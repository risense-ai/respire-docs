import { defineConfig } from 'vitepress'

const editPattern = `https://github.com/risense-ai/respire-docs/edit/${process.env.CF_PAGES_BRANCH || 'main'}/docs/:path`

export default defineConfig({
  title: 'Respire',
  description: 'Local-first AI memory: architecture, interfaces and development',
  lang: 'en',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' }]],
  cleanUrls: true,
  metaChunk: true,
  locales: {
    root: { label: 'English', lang: 'en' },
    zh: {
      label: '简体中文',
      lang: 'zh-Hans',
      description: '本地优先的 AI 记忆：架构、接口与开发',
      themeConfig: {
        outline: { level: [2, 3], label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        editLink: { pattern: editPattern, text: '在 GitHub 上编辑此页' },
        langMenuLabel: '切换语言',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        skipToContentLabel: '跳转到内容',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        notFound: {
          title: '页面未找到',
          quote: '此页面不存在，请检查地址或返回首页。',
          linkLabel: '返回中文首页',
          linkText: '返回首页',
        },
        nav: [
          { text: '概览', link: '/zh/' },
          { text: '快速开始', link: '/zh/getting-started' },
          { text: '接口', link: '/zh/cli-api' },
          { text: '开发', link: '/zh/development' },
        ],
        sidebar: [
          { text: '概览', link: '/zh/' },
          { text: '仓库', link: '/zh/repos' },
          { text: '使用 Respire', items: [
            { text: '快速开始', link: '/zh/getting-started' },
            { text: '操作演练', link: '/zh/walkthrough' },
            { text: 'CLI 命令', link: '/zh/cli' },
            { text: '客户端', link: '/zh/client' },
            { text: '本地 Web', link: '/zh/product/web' },
            { text: 'AI 工具注入', link: '/zh/injection' },
            { text: '常见问题', link: '/zh/faq' },
          ] },
          { text: 'AI 工具插件', items: [
            { text: '总览', link: '/zh/plugins/' },
            { text: 'ZCode', link: '/zh/plugins/zcode' },
            { text: 'Kimi Code', link: '/zh/plugins/kimi' },
            { text: 'Dim', link: '/zh/plugins/dimcode' },
            { text: 'Qoder', link: '/zh/plugins/qoder' },
            { text: 'WorkBuddy', link: '/zh/plugins/workbuddy' },
            { text: 'Hermes', link: '/zh/plugins/hermes' },
            { text: 'Codex', link: '/zh/plugins/codex' },
            { text: 'Pi', link: '/zh/plugins/pi' },
          ] },
          { text: '操作指南', items: [
            { text: 'Windows 安装', link: '/zh/guides/windows-install' },
            { text: '迁移与升级', link: '/zh/guides/migrate-and-upgrade' },
            { text: '批量整理提取记忆', link: '/zh/guides/batch-tidy-extracted' },
            { text: '示例：注入豆包', link: '/zh/guides/agent-example-doubao' },
            { text: '技能仓库安装与使用', link: '/zh/guides/skills-repo' },
            { text: 'memTools 桌面收录', link: '/zh/guides/memtools' },
          ] },
          { text: '架构', items: [
            { text: '数据流', link: '/zh/architecture' },
            { text: '运行流程', link: '/zh/architecture-internals' },
            { text: '宿主运行时与升级', link: '/zh/runtime' },
            { text: '数据模型', link: '/zh/data-model' },
            { text: '记忆关联', link: '/zh/associations' },
            { text: '同步与密钥', link: '/zh/sync-and-keys' },
            { text: '同步 v2', link: '/zh/sync-v2-rollout' },
            { text: 'Core SDK', link: '/zh/product/core' },
          ] },
          { text: '接口', items: [
            { text: 'CLI JSON', link: '/zh/cli-api' },
            { text: 'Runtime RPC', link: '/zh/runtime-rpc' },
            { text: 'RPC 完整功能参考', link: '/zh/runtime-rpc-commands' },
            { text: '服务端 API', link: '/zh/server' },
            { text: '请求边界', link: '/zh/server-request-boundaries' },
            { text: '契约', link: '/zh/contracts' },
          ] },
          { text: '构建与部署', items: [
            { text: '开发', link: '/zh/development' },
            { text: '服务端部署', link: '/zh/server-deployment' },
            { text: 'Windows 打包', link: '/zh/windows-packaging' },
            { text: '客户端集成', link: '/zh/CLIENT-GUIDE' },
            { text: '检索基准测试', link: '/zh/benchmark' },
            { text: '插件', link: '/zh/plugin-dev' },
            { text: '网站', link: '/zh/product/site' },
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
    siteTitle: false,
    outline: { level: [2, 3], label: 'On this page' },
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详细列表',
                resetButtonTitle: '重置搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到相关结果',
                footer: {
                  selectText: '选择', selectKeyAriaLabel: '回车键',
                  navigateText: '切换', navigateUpKeyAriaLabel: '上箭头',
                  navigateDownKeyAriaLabel: '下箭头', closeText: '关闭',
                  closeKeyAriaLabel: 'Esc 键',
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
      ] },
      { text: 'Guides', items: [
        { text: 'Installing on Windows', link: '/guides/windows-install' },
        { text: 'Migrating and upgrading', link: '/guides/migrate-and-upgrade' },
        { text: 'Batch-tidying extracted memories', link: '/guides/batch-tidy-extracted' },
        { text: 'Worked example: Doubao', link: '/guides/agent-example-doubao' },
        { text: 'Skills repository', link: '/guides/skills-repo' },
        { text: 'memTools desktop capture', link: '/guides/memtools' },
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
        { text: 'All RPC functions', link: '/runtime-rpc-commands' },
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
