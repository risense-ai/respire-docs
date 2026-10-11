#!/usr/bin/env node
// Free, incremental EN -> ZH Markdown translator for the Respire docs.
//
// Layout: English sources live at docs/ (the root locale); Chinese translations
// are written to docs/zh/ at the same relative path. The docs/zh subtree is
// skipped while scanning, so translations are never retranslated as sources.
//
// Backend-agnostic: it talks to any OpenAI-compatible POST {base}/chat/completions.
//   - Local Ollama (free, offline)  : TRANSLATE_BASE_URL=http://127.0.0.1:11434/v1
//   - DeepSeek / Zhipu GLM / Qwen   : set TRANSLATE_BASE_URL + TRANSLATE_API_KEY + TRANSLATE_MODEL
//
// Incremental: a hashed cache (.translation-cache.json) means only new or changed
// source files are sent to the model. Re-run any time; unchanged pages are skipped.
//
// Usage:
//   npm run translate                 # translate changed docs/*.md -> docs/zh/*.md
//   npm run translate -- --dry-run    # show what would be translated, no API calls
//   npm run translate -- --force      # retranslate everything
//
// Environment:
//   TRANSLATE_BASE_URL  default http://127.0.0.1:11434/v1
//   TRANSLATE_API_KEY   default "ollama" (Ollama ignores it)
//   TRANSLATE_MODEL     default qwen2.5:14b
//   TRANSLATE_SRC       default docs
//   TRANSLATE_DST       default docs/zh
//   TRANSLATE_CACHE     default .translation-cache.json
//   TRANSLATE_NAME      default "Simplified Chinese (zh-Hans)"
//   TRANSLATE_MAX_CHARS default 6000 (per request)

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const cfg = {
  baseUrl: (process.env.TRANSLATE_BASE_URL || 'http://127.0.0.1:11434/v1').replace(/\/+$/, ''),
  apiKey: process.env.TRANSLATE_API_KEY ?? 'ollama',
  model: process.env.TRANSLATE_MODEL || 'qwen2.5:14b',
  srcDir: process.env.TRANSLATE_SRC || 'docs',
  dstDir: process.env.TRANSLATE_DST || 'docs/zh',
  cacheFile: process.env.TRANSLATE_CACHE || '.translation-cache.json',
  targetName: process.env.TRANSLATE_NAME || 'Simplified Chinese (zh-Hans)',
  maxChars: Number(process.env.TRANSLATE_MAX_CHARS || 6000),
}

const flags = new Set(process.argv.slice(2))
const dryRun = flags.has('--dry-run')
const force = flags.has('--force')

const SYSTEM = `You are a professional technical translator for a software documentation site. \
Translate the user's Markdown from English into ${cfg.targetName}.

Rules:
- Translate ALL human-readable prose: headings, paragraphs, table cells, list items, image alt text, and link text.
- Do NOT translate: fenced code blocks, inline code, URLs, file paths, HTML tags/attributes, or product/technology names (Respire, rsrs, risense-ai, VitePress, Rust, SQLite, Tauri, etc.).
- YAML frontmatter: translate ONLY the values of "title" and "description"; leave all other keys and values unchanged.
- Preserve Markdown syntax exactly: heading levels, tables, lists, blockquotes, mermaid blocks, links and images. Keep the English heading IDs VitePress derives (do NOT add manual {#...} anchors).
- Keep CLI flags, JSON keys, identifiers and code verbatim.
- Output ONLY the translated Markdown. No explanations, no wrapping code fence around the whole answer.`

const dstAbs = path.resolve(cfg.dstDir)

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (path.resolve(full) === dstAbs) continue // never treat translations as sources
      if (entry.name.startsWith('.')) continue
      out.push(...(await walk(full)))
    } else if (entry.name.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

// Split markdown into chunks on blank lines, never inside a fenced code block.
function chunkMarkdown(text, max = cfg.maxChars) {
  const chunks = []
  let buf = []
  let size = 0
  let inFence = false
  const flush = () => {
    if (buf.length) {
      chunks.push(buf.join('\n'))
      buf = []
      size = 0
    }
  }
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence
    buf.push(line)
    size += line.length + 1
    if (!inFence && size >= max && line.trim() === '') flush()
  }
  flush()
  return chunks.length ? chunks : [text]
}

function stripOuterFence(s) {
  const m = s.match(/^\s*```[a-zA-Z]*\n([\s\S]*?)\n```\s*$/)
  return m ? m[1] : s
}

async function callModel(content) {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body.slice(0, 300)}`)
  }
  const data = await res.json()
  const out = data?.choices?.[0]?.message?.content
  if (!out) throw new Error('Model returned no content')
  return stripOuterFence(out).trim()
}

async function translateWithRetry(content) {
  let lastError
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await callModel(content)
    } catch (err) {
      lastError = err
      const wait = attempt * 3000
      console.warn(`    retry ${attempt}/4 after error: ${err.message} (waiting ${wait}ms)`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastError
}

async function translateFile(text) {
  const chunks = chunkMarkdown(text)
  const parts = []
  for (let i = 0; i < chunks.length; i++) {
    if (chunks.length > 1) console.log(`    chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`)
    parts.push(await translateWithRetry(chunks[i]))
  }
  return parts.join('\n\n')
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

async function main() {
  if (!existsSync(cfg.srcDir)) {
    console.error(`Source directory not found: ${cfg.srcDir}`)
    process.exit(1)
  }

  let cache = {}
  if (existsSync(cfg.cacheFile)) {
    try {
      cache = JSON.parse(await readFile(cfg.cacheFile, 'utf8'))
    } catch {
      console.warn(`Ignoring unreadable cache: ${cfg.cacheFile}`)
    }
  }

  const files = (await walk(cfg.srcDir)).sort()
  console.log(`Found ${files.length} source file(s) in ${cfg.srcDir}/ (excluding ${cfg.dstDir}/)`)
  console.log(`Backend : ${cfg.baseUrl}  model=${cfg.model}`)
  console.log(`Mode    : ${dryRun ? 'dry-run' : force ? 'force' : 'incremental'}\n`)

  let translated = 0
  let skipped = 0

  for (const file of files) {
    const rel = path.relative(cfg.srcDir, file)
    const dest = path.join(cfg.dstDir, rel)
    const source = await readFile(file, 'utf8')
    const hash = sha256(source)
    const upToDate = !force && cache[rel]?.hash === hash && existsSync(dest)

    if (upToDate) {
      skipped++
      console.log(`skip  ${rel}`)
      continue
    }

    console.log(`${dryRun ? 'plan' : 'xl8t'}  ${rel}  ->  ${path.relative('.', dest)}`)
    if (dryRun) continue

    const out = await translateFile(source)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, out.endsWith('\n') ? out : out + '\n', 'utf8')
    cache[rel] = { hash, out: dest.replace(/\\/g, '/') }
    await writeFile(cfg.cacheFile, JSON.stringify(cache, null, 2) + '\n', 'utf8')
    translated++
  }

  console.log(`\nDone. translated=${translated} skipped=${skipped}${dryRun ? ' (dry-run, nothing written)' : ''}`)
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`)
  process.exit(1)
})
