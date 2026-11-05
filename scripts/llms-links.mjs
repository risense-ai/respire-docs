export function absoluteLinks(body, sourcePath) {
  const base = new URL(sourcePath, 'https://docs.rsrs.rs/');
  let fence;
  return body.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      return line;
    }
    if (fence) return line;
    return line.replace(/(\[[^\]]*\]\()([^\s)]+)([^)]*\))/g, (match, prefix, target, suffix) => {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) return match;
      const url = new URL(target, base);
      url.pathname = url.pathname.replace(/\/index\.md$/, '/').replace(/\.md$/, '');
      return `${prefix}${url.href}${suffix}`;
    });
  }).join('\n');
}
