import DefaultTheme from 'vitepress/theme'
import { inBrowser, onContentUpdated } from 'vitepress'
import type { Theme } from 'vitepress'

async function renderMermaid() {
  if (!inBrowser) return
  const nodes = document.querySelectorAll('pre.mermaid:not([data-processed])')
  if (nodes.length === 0) return
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' })
  await mermaid.run({ nodes: nodes as NodeListOf<HTMLElement> })
}

export default {
  extends: DefaultTheme,
  setup() {
    onContentUpdated(() => void renderMermaid())
  },
} satisfies Theme
