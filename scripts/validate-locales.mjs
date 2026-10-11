import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createMarkdownRenderer } from 'vitepress';

const root = path.resolve('docs');
const dist = path.join(root, '.vitepress/dist');
const md = await createMarkdownRenderer(root);
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  entry.name.startsWith('.') ? [] : entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
);
const sources = walk(root).filter((file) => file.endsWith('.md') && !file.startsWith(path.join(root, 'zh') + path.sep));
const translations = walk(path.join(root, 'zh')).filter((file) => file.endsWith('.md'));
assert.equal(translations.length, sources.length, 'English and Chinese page counts must match');
const inlineCodes = (tokens) => tokens.flatMap((token) => [
  ...(token.type === 'code_inline' ? [token.content] : []),
  ...(token.children ? inlineCodes(token.children) : []),
]);
const codeBlocks = (tokens) => tokens.filter((token) => token.type === 'fence' && token.info.trim() !== 'mermaid')
  .map((token) => [token.info.trim(), token.content.replace(/\r\n/g, '\n')]);
const headingIds = (html) => [...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map((match) => match[1]);
let links = 0;
for (const source of sources) {
  const relative = path.relative(root, source);
  const translated = path.join(root, 'zh', relative);
  assert.ok(fs.existsSync(translated), `Missing Chinese page: ${relative}`);
  const en = fs.readFileSync(source, 'utf8');
  const zh = fs.readFileSync(translated, 'utf8');
  assert.ok(/[\u3400-\u9fff]/u.test(zh), `Untranslated page: ${relative}`);
  const enTokens = md.parse(en, {});
  const zhTokens = md.parse(zh, {});
  assert.deepEqual(codeBlocks(zhTokens), codeBlocks(enTokens), `Executable examples changed: ${relative}`);
  for (const code of new Set(inlineCodes(enTokens))) {
    assert.ok(inlineCodes(zhTokens).includes(code), `Technical identifier missing: ${relative}: ${code}`);
  }
  const enHtml = fs.readFileSync(path.join(dist, relative.replace(/\.md$/, '.html')), 'utf8');
  const zhHtml = fs.readFileSync(path.join(dist, 'zh', relative.replace(/\.md$/, '.html')), 'utf8');
  assert.match(enHtml, /<html[^>]*lang="en"/, `English lang: ${relative}`);
  assert.match(zhHtml, /<html[^>]*lang="zh-Hans"/, `Chinese lang: ${relative}`);
  assert.ok(zhHtml.includes('/docs/zh/' + relative.replaceAll(path.sep, '/')), `Chinese edit link: ${relative}`);
  assert.deepEqual(headingIds(zhHtml), headingIds(enHtml), `Corresponding anchors differ: ${relative}`);
}

for (const file of walk(dist).filter((item) => item.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const url = new URL(relative.replace(/(?:^|\/)index\.html$/, '/').replace(/\.html$/, ''), 'https://docs.rsrs.rs/');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1].replaceAll('&amp;', '&');
    if (/^(?:https?:|mailto:|data:|javascript:)/.test(value)) continue;
    const target = new URL(value, url);
    if (target.origin !== url.origin) continue;
    const pathname = decodeURIComponent(target.pathname);
    const candidates = pathname.endsWith('/') ? [path.join(dist, pathname, 'index.html')] : [path.join(dist, pathname), path.join(dist, pathname + '.html')];
    const destination = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    assert.ok(destination, `Broken local link: ${relative} -> ${value}`);
    if (target.hash && destination.endsWith('.html')) {
      const anchor = decodeURIComponent(target.hash.slice(1));
      assert.ok(fs.readFileSync(destination, 'utf8').includes(`id="${anchor}"`), `Broken anchor: ${relative} -> ${value}`);
    }
    links++;
  }
}
console.log(`Locales verified: ${sources.length} page pairs; stable anchors, technical identifiers, executable examples, language metadata and ${links} internal links/resources.`);
