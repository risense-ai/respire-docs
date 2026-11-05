export function extractDescription(source) {
  const body = source.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, '')
    .replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
  const paragraphs = body.split(/\r?\n\s*\r?\n/)
    .map(value => value.trim())
    .filter(value => value && !/^(?:[#<>|`*+\-]|\d+[.)]\s)/.test(value))
    .filter(value => !/^\[[^\]]+\]\([^)]+\)\s*$/.test(value) && !/^\[[^\]]+\]:/.test(value))
    .map(value => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim())
    .filter(value => value.length >= 40);
  const text = paragraphs[0];
  if (!text || text.length <= 220) return text;
  const ends = [...text.matchAll(/[������]|[.!?](?=\s|$)/g)].map(match => match.index + 1);
  const end = ends.filter(index => index <= 220).at(-1) ?? ends[0];
  return end ? text.slice(0, end).trim() : text;
}
