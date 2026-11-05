import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { extractDescription } from './description.mjs';

for (const host of ['dimcode', 'codex', 'kimi']) {
  test(`${host} retains the linked introduction`, () => {
    const text = extractDescription(readFileSync(new URL(`../docs/plugins/${host}.md`, import.meta.url), 'utf8'));
    assert.ok(text.startsWith(`respire-${host} `), text);
    assert.match(text, /[.!?]$/);
  });
}
test('joins wrapped prose and ignores code, tables and standalone links', () => {
  const prose = 'This introduction continues onto another line and explains the product clearly.';
  const source = '# Title\n\n[Standalone link with a sufficiently long title](https://example.com)\n\n~~~sh\nThis is code with enough characters to be wrongly selected.\n~~~\n\n| Table with enough characters to be wrongly selected |\n\nThis introduction continues onto another line\nand explains the product clearly.\n';
  assert.equal(extractDescription(source), prose);
});
