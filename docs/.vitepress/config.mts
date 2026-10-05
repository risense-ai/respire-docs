import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Respire',
  description: 'Local-first AI memory: architecture, interfaces and development',
  lang: 'en',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }]],
  cleanUrls: true,
  metaChunk: true,
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    config(md) {
      const fence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        if (tokens[idx].info.trim() === 'mermaid') {
          return `<pre class="mermaid">${md.utils.escapeHtml(tokens[idx].content)}</pre>`
        }
        return fence ? fence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
      }
    },
  },
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-reverse.svg' },
    siteTitle: false,
    outline: { level: [2, 3], label: 'On this page' },
    search: { provider: 'local' },
    docFooter: { prev: 'Previous', next: 'Next' },
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Get started', link: '/getting-started' },
      { text: 'Interfaces', link: '/cli-api' },
      { text: 'Development', link: '/development' },
    ],
    sidebar: [
      { text: 'Overview', link: '/' },
      { text: 'Repositories', link: '/repos' },
      { text: 'Use Respire', items: [
        { text: 'Getting started', link: '/getting-started' },
        { text: 'Walkthrough', link: '/walkthrough' },
        { text: 'CLI commands', link: '/cli' },
        { text: 'Client', link: '/client' },
        { text: 'Local Web', link: '/product/web' },
        { text: 'AI tool injection', link: '/injection' },
        { text: 'FAQ', link: '/faq' },
      ] },
      { text: 'Architecture', items: [
        { text: 'Data flow', link: '/architecture' },
        { text: 'Runtime flow', link: '/architecture-internals' },
        { text: 'Host runtime and upgrades', link: '/runtime' },
        { text: 'Data model', link: '/data-model' },
        { text: 'Memory associations', link: '/associations' },
        { text: 'Sync and keys', link: '/sync-and-keys' },
        { text: 'Sync v2', link: '/sync-v2-rollout' },
        { text: 'Core SDK', link: '/product/core' },
      ] },
      { text: 'Interfaces', items: [
        { text: 'CLI JSON', link: '/cli-api' },
        { text: 'Server API', link: '/server' },
        { text: 'Request boundaries', link: '/server-request-boundaries' },
        { text: 'Contracts', link: '/contracts' },
      ] },
      { text: 'Build and deploy', items: [
        { text: 'Development', link: '/development' },
        { text: 'Server deployment', link: '/server-deployment' },
        { text: 'Windows packaging', link: '/windows-packaging' },
        { text: 'Client integration', link: '/CLIENT-GUIDE' },
        { text: 'Evaluation', link: '/benchmark' },
        { text: 'Plugins', link: '/plugin-dev' },
        { text: 'Website', link: '/product/site' },
      ] },
    ],
  },
})
