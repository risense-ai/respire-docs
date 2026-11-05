import assert from 'node:assert/strict';
import { test } from 'node:test';
import { absoluteLinks } from './llms-links.mjs';

test('aggregate links resolve from each source document', () => {
  assert.equal(absoluteLinks('[Guide](./index.md#start) [FAQ](../faq.md) [Here](#install) ![Icon](/agents/codex.png)', 'zh/plugins/codex.md'),
    '[Guide](https://docs.rsrs.rs/zh/plugins/#start) [FAQ](https://docs.rsrs.rs/zh/faq) [Here](https://docs.rsrs.rs/zh/plugins/codex#install) ![Icon](https://docs.rsrs.rs/agents/codex.png)');
});
test('preserves external links and fenced examples', () => {
  const text = '[Web](https://example.com/a.md)\n```md\n[Example](./sample.md)\n```';
  assert.equal(absoluteLinks(text, 'index.md'), text);
});
