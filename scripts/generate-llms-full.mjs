import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../docs', import.meta.url));
const output = fileURLToPath(new URL('../docs/.vitepress/dist/llms-full.txt', import.meta.url));
const skipped = new Set(['README.md', 'zh/README.md', '404.md']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'public' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else if (entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

function canonical(relativePath) {
  const page = relativePath.replaceAll(sep, '/').replace(/\.md$/, '');
  if (page === 'index') return '/';
  if (page === 'zh/index') return '/zh/';
  return `/${page.replace(/\/index$/, '/')}`;
}

function titleOf(body, fallback) {
  const match = body.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].replace(/\s*\{#.*\}$/, '').trim() : fallback;
}

const files = walk(root)
  .filter((file) => !skipped.has(relative(root, file).replaceAll(sep, '/')))
  .sort((a, b) => {
    const ar = relative(root, a).replaceAll(sep, '/');
    const br = relative(root, b).replaceAll(sep, '/');
    const rank = (page) => page === 'index.md' ? 0 : page === 'zh/index.md' ? 1 : page.startsWith('zh/') ? 3 : 2;
    return rank(ar) - rank(br) || ar.localeCompare(br);
  });

const sections = files.map((file) => {
  const rel = relative(root, file).replaceAll(sep, '/');
  const source = readFileSync(file, 'utf8').replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  const title = titleOf(source, rel.replace(/\.md$/, ''));
  const body = source.replace(/^#\s+.+\n+/, '').trim();
  return `## ${title}\n\nSource: https://docs.rsrs.rs${canonical(rel)}\n\n${body}`;
});

const header = `# Respire documentation — full text

> Complete Markdown source for the official English and Simplified Chinese Respire documentation.

Canonical site: https://docs.rsrs.rs/
Pages: ${files.length}

`;

writeFileSync(output, `${header}${sections.join('\n\n---\n\n')}\n`);
console.log(`Generated llms-full.txt from ${files.length} Markdown pages.`);
