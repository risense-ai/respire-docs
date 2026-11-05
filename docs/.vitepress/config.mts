import { defineConfig } from 'vitepress'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { extractDescription } from '../../scripts/description.mjs'

const SITE = 'https://docs.rsrs.rs'
const image = `https://rsrs.rs/memory-fiber-sculpture.png`

function canonicalPath(page: string) {
  const clean = page.replace(/\.md$/, '')
  return clean === 'index' ? '/' : `/${clean.replace(/\/index$/, '/')}`
}

function faqSchema(content: string, url: string) {
  if (!/\/(?:zh\/)?faq$/.test(url)) return null
  const rows = [...content.matchAll(/<tr><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/g)]
  if (!rows.length) return null
  const text = (value: string) => value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url,
    mainEntity: rows.map(([, question, answer]) => ({
      '@type': 'Question',
      name: text(question),
      acceptedAnswer: { '@type': 'Answer', text: text(answer) },
    })),
  }
}

const editPattern = `https://github.com/risense-ai/respire-docs/edit/${process.env.CF_PAGES_BRANCH || 'main'}/docs/:path`

export default defineConfig({
  title: 'Respire',
  description: 'Local-first AI memory: installation, AI tool integration, architecture and development guides',
  lang: 'en',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }],
    ['meta', { property: 'og:site_name', content: 'Respire documentation' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
  ],
  sitemap: {
    hostname: SITE,
    transformItems: (items) => items.filter((item) => item.url !== 'README' && item.url !== 'zh/README'),
  },
  transformPageData(pageData, { siteConfig }) {
    const file = join(siteConfig.srcDir, pageData.filePath)
    const source = readFileSync(file, 'utf8')
    const committedAt = spawnSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' })
    if (committedAt.status !== 0) throw new Error(`Unable to determine document update time: ${file}`)
    const lastUpdated = committedAt.stdout.trim() ? Date.parse(committedAt.stdout.trim()) : undefined
    return { description: pageData.frontmatter.description || extractDescription(source) || siteConfig.site.description, lastUpdated }
  },
  transformHead({ page, pageData, title, content }) {
    if (page === '404.md' || page === 'README.md' || page === 'zh/README.md') return [['meta', { name: 'robots', content: 'noindex,follow' }]]
    const path = canonicalPath(page)
    const url = `${SITE}${path}`
    const zh = page.startsWith('zh/')
    const englishPath = zh ? page.slice(3) : page
    const chinesePath = zh ? page : `zh/${page}`
    const alternates = [
      ['en', `${SITE}${canonicalPath(englishPath)}`],
      ['zh-Hans', `${SITE}${canonicalPath(chinesePath)}`],
      ['x-default', `${SITE}${canonicalPath(englishPath)}`],
    ].map(([hreflang, href]) => ['link', { rel: 'alternate', hreflang, href }] as const)
    const description = pageData.description || pageData.frontmatter.description
    const documentTitle = title.replace(/ \| Respire$/, '')
    const schema = faqSchema(content, url) ?? {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: documentTitle,
      description,
      url,
      inLanguage: zh ? 'zh-Hans' : 'en',
      image,
      isPartOf: { '@type': 'WebSite', name: 'Respire documentation', url: SITE },
      publisher: { '@type': 'Organization', name: 'Respire', url: 'https://rsrs.rs/', logo: image },
      ...(pageData.lastUpdated ? { dateModified: new Date(pageData.lastUpdated).toISOString() } : {}),
    }
    return [
      ['link', { rel: 'canonical', href: url }],
      ...alternates,
      ['meta', { property: 'og:title', content: documentTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: zh ? 'zh_CN' : 'en_US' }],
      ['meta', { name: 'twitter:title', content: documentTitle }],
      ['meta', { name: 'twitter:description', content: description }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(schema)],
    ]
  },
  cleanUrls: true,
  metaChunk: true,
  locales: {
    root: { label: 'English', lang: 'en' },
    zh: {
      label: '��������',
      lang: 'zh-Hans',
      description: '�������ȵ� AI ���䣺�ܹ����ӿ��뿪��',
      themeConfig: {
        outline: { level: [2, 3], label: '��ҳĿ¼' },
        docFooter: { prev: '��һҳ', next: '��һҳ' },
        editLink: { pattern: editPattern, text: '�� GitHub �ϱ༭��ҳ' },
        langMenuLabel: '�л�����',
        sidebarMenuLabel: '�˵�',
        returnToTopLabel: '���ض���',
        skipToContentLabel: '��ת������',
        darkModeSwitchLabel: '���',
        lightModeSwitchTitle: '�л���ǳɫģʽ',
        darkModeSwitchTitle: '�л�����ɫģʽ',
        notFound: {
          title: 'ҳ��δ�ҵ�',
          quote: '��ҳ�治���ڣ������ַ�򷵻���ҳ��',
          linkLabel: '����������ҳ',
          linkText: '������ҳ',
        },
        logoLink: { link: 'https://rsrs.rs/zh/', target: '_self' },
        nav: [
          { text: '��ҳ', link: 'https://rsrs.rs/zh/', target: '_self' },
          { text: '����', link: '/zh/' },
          { text: '���ٿ�ʼ', link: '/zh/getting-started' },
          { text: '�ӿ�', link: '/zh/cli-api' },
          { text: '����', link: '/zh/development' },
        ],
        sidebar: [
          { text: '����', link: '/zh/' },
          { text: '�ֿ�', link: '/zh/repos' },
          { text: 'ʹ�� Respire', items: [
            { text: '���ٿ�ʼ', link: '/zh/getting-started' },
            { text: '��������', link: '/zh/walkthrough' },
            { text: 'CLI ����', link: '/zh/cli' },
            { text: '�ͻ���', link: '/zh/client' },
            { text: '���� Web', link: '/zh/product/web' },
            { text: 'AI ����ע��', link: '/zh/injection' },
            { text: '��������', link: '/zh/faq' },
          ] },
          { text: 'AI ���߲��', items: [
            { text: '����', link: '/zh/plugins/' },
            { text: 'ZCode', link: '/zh/plugins/zcode' },
            { text: 'Kimi Code', link: '/zh/plugins/kimi' },
            { text: 'Dim', link: '/zh/plugins/dimcode' },
            { text: 'Qoder', link: '/zh/plugins/qoder' },
            { text: 'WorkBuddy', link: '/zh/plugins/workbuddy' },
            { text: 'Hermes', link: '/zh/plugins/hermes' },
            { text: 'Codex', link: '/zh/plugins/codex' },
            { text: 'Pi', link: '/zh/plugins/pi' },
            { text: 'DSH', link: '/zh/plugins/dsh' },
            { text: 'Magpie', link: '/zh/plugins/magpie' },
            { text: 'OpenClaw', link: '/zh/plugins/openclaw' },
            { text: 'MiniMax Code', link: '/zh/plugins/minimax-code' },
            { text: 'ͨ�ð���Agent Plugins��', link: '/zh/plugins/general' },
          ] },
          { text: '����ָ��', items: [
            { text: 'Windows ��װ', link: '/zh/guides/windows-install' },
            { text: 'Ǩ��������', link: '/zh/guides/migrate-and-upgrade' },
            { text: '����������ȡ����', link: '/zh/guides/batch-tidy-extracted' },
            { text: 'ʾ����ע�붹��', link: '/zh/guides/agent-example-doubao' },
            { text: '���ֿܲⰲװ��ʹ��', link: '/zh/guides/skills-repo' },
            { text: 'memTools ����С����', link: '/zh/guides/memtools' },
          ] },
          { text: '�ܹ�', items: [
            { text: '������', link: '/zh/architecture' },
            { text: '��������', link: '/zh/architecture-internals' },
            { text: '��������ʱ������', link: '/zh/runtime' },
            { text: '����ģ��', link: '/zh/data-model' },
            { text: '�������', link: '/zh/associations' },
            { text: 'ͬ������Կ', link: '/zh/sync-and-keys' },
            { text: 'ͬ�� v2', link: '/zh/sync-v2-rollout' },
            { text: 'Core SDK', link: '/zh/product/core' },
          ] },
          { text: '�ӿ�', items: [
            { text: 'CLI JSON', link: '/zh/cli-api' },
            { text: 'Runtime RPC', link: '/zh/runtime-rpc' },
            { text: 'RPC �ο���1.0.17-dev.14��', link: '/zh/runtime-rpc-commands' },
            { text: '����� API', link: '/zh/server' },
            { text: '����߽�', link: '/zh/server-request-boundaries' },
            { text: '��Լ', link: '/zh/contracts' },
          ] },
          { text: '�����벿��', items: [
            { text: '����', link: '/zh/development' },
            { text: '����˲���', link: '/zh/server-deployment' },
            { text: 'Windows ���', link: '/zh/windows-packaging' },
            { text: '�ͻ��˼���', link: '/zh/CLIENT-GUIDE' },
            { text: '������׼����', link: '/zh/benchmark' },
            { text: '���', link: '/zh/plugin-dev' },
            { text: '��վ', link: '/zh/product/site' },
          ] },
        ],
      },
    },
  },
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
    logoLink: { link: 'https://rsrs.rs/', target: '_self' },
    siteTitle: false,
    outline: { level: [2, 3], label: 'On this page' },
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '����', buttonAriaLabel: '�����ĵ�' },
              modal: {
                displayDetails: '��ʾ��ϸ�б�',
                resetButtonTitle: '��������',
                backButtonTitle: '�ر�����',
                noResultsText: 'û���ҵ���ؽ��',
                footer: {
                  selectText: 'ѡ��', selectKeyAriaLabel: '�س���',
                  navigateText: '�л�', navigateUpKeyAriaLabel: '�ϼ�ͷ',
                  navigateDownKeyAriaLabel: '�¼�ͷ', closeText: '�ر�',
                  closeKeyAriaLabel: 'Esc ��',
                },
              },
            },
            miniSearch: {
              options: {
                // Use the same segmentation for indexing and browser queries.
                tokenize: (text) => Array.from(
                  new Intl.Segmenter('zh-Hans', { granularity: 'word' }).segment(text),
                  (part) => part.segment,
                ).filter((word) => /[\p{L}\p{N}]/u.test(word)),
              },
            },
          },
        },
      },
    },
    i18nRouting: true,
    editLink: {
      pattern: editPattern,
      text: 'Edit this page on GitHub',
    },
    docFooter: { prev: 'Previous', next: 'Next' },
    nav: [
      { text: 'Home', link: 'https://rsrs.rs/', target: '_self' },
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
      { text: 'AI tool plugins', items: [
        { text: 'Overview', link: '/plugins/' },
        { text: 'ZCode', link: '/plugins/zcode' },
        { text: 'Kimi Code', link: '/plugins/kimi' },
        { text: 'Dim', link: '/plugins/dimcode' },
        { text: 'Qoder', link: '/plugins/qoder' },
        { text: 'WorkBuddy', link: '/plugins/workbuddy' },
        { text: 'Hermes', link: '/plugins/hermes' },
        { text: 'Codex', link: '/plugins/codex' },
        { text: 'Pi', link: '/plugins/pi' },
        { text: 'DSH', link: '/plugins/dsh' },
        { text: 'Magpie', link: '/plugins/magpie' },
        { text: 'OpenClaw', link: '/plugins/openclaw' },
        { text: 'MiniMax Code', link: '/plugins/minimax-code' },
        { text: 'General (Agent Plugins)', link: '/plugins/general' },
      ] },
      { text: 'Guides', items: [
        { text: 'Installing on Windows', link: '/guides/windows-install' },
        { text: 'Migrating and upgrading', link: '/guides/migrate-and-upgrade' },
        { text: 'Batch-tidying extracted memories', link: '/guides/batch-tidy-extracted' },
        { text: 'Worked example: Doubao', link: '/guides/agent-example-doubao' },
        { text: 'Skills repository', link: '/guides/skills-repo' },
        { text: 'memTools desktop app', link: '/guides/memtools' },
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
        { text: 'Runtime RPC', link: '/runtime-rpc' },
        { text: 'RPC reference (1.0.17-dev.14)', link: '/runtime-rpc-commands' },
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
