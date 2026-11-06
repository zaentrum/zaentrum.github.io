// zaentrum.github.io: the product page at /, the docs at /docs/.
//
//   npm run dev       copies the docs in (scripts/sync-docs.mjs), dev server on :4321
//   npm run build     copies the docs in, static site -> dist/
//
// the pages come from the docs/ folder of zaentrum/zaentrum; the sections and their
// order are src/nav.mjs. the look is the nalet design system's: its tokens, its two
// typefaces, its dark canvas and square frames (src/styles/theme.css).
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLinksValidator from 'starlight-links-validator';
import { remarkMermaid } from './src/lib/remark-mermaid.mjs';
import { topics, topicFolders, unlisted } from './src/nav.mjs';
import codeTheme from './src/lib/code-theme.json' with { type: 'json' };

if (unlisted.length) {
  console.warn(`not in the side navigation yet (src/nav.mjs): ${unlisted.map((p) => `docs/${p}`).join(', ')}`);
}

export default defineConfig({
  site: 'https://zaentrum.github.io',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // the product page used to be zaentrum/zaentrum's own Pages site, at /zaentrum/.
  redirects: { '/zaentrum/': '/' },
  markdown: {
    // straight quotes and dashes stay as they are written; the docs quote code.
    processor: unified({ remarkPlugins: [remarkMermaid], smartypants: false }),
  },
  integrations: [
    starlight({
      title: 'zaentrum docs',
      description: 'Run, extend and build on zaentrum, the neutral, self-hosted media platform.',
      favicon: '/favicon.svg',
      customCss: [
        '@fontsource/inter/400.css',
        '@fontsource/inter/500.css',
        '@fontsource/inter/600.css',
        '@fontsource/jetbrains-mono/400.css',
        '@fontsource/jetbrains-mono/500.css',
        '@fontsource/jetbrains-mono/600.css',
        '@fontsource/jetbrains-mono/700.css',
        './src/styles/tokens.css',
        './src/styles/theme.css',
      ],
      components: {
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        Sidebar: './src/components/Sidebar.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
      },
      expressiveCode: {
        themes: [codeTheme],
        useStarlightUiThemeColors: false,
        styleOverrides: {
          borderRadius: '0',
          borderColor: 'var(--border)',
          codeFontFamily: 'var(--ff-mono)',
          codeFontSize: '13px',
          uiFontFamily: 'var(--ff-mono)',
          frames: {
            shadowColor: 'transparent',
            editorTabBarBackground: 'var(--bg-2)',
            terminalTitlebarBackground: 'var(--bg-2)',
            terminalBackground: 'var(--bg-2)',
            editorBackground: 'var(--bg-2)',
          },
        },
      },
      plugins: [
        starlightSidebarTopics(topics, { topics: { run: ['/docs/*'], ...topicFolders }, exclude: ['/404'] }),
        // the product page and the schemas site are outside the docs.
        starlightLinksValidator({ exclude: ['/', '/schemas/**'] }),
      ],
    }),
  ],
});
