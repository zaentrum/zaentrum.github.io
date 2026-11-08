// zaentrum.github.io: the product page at /, the docs at /docs/, the specification at /spec/.
//
//   npm run dev       copies the docs in (scripts/sync-docs.mjs), dev server on :4321
//   npm run build     copies the docs in, static site -> dist/
//
// the pages come from the docs/ and spec/ folders of zaentrum/zaentrum; the sections and their
// order are src/nav.mjs. the look is the nalet design system's: its tokens, its two
// typefaces, its dark canvas and square frames (src/styles/theme.css).
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightLinksValidator from 'starlight-links-validator';
import { remarkMermaid } from './src/lib/remark-mermaid.mjs';
import { topics, unlisted, gone, moved } from './src/nav.mjs';
import codeTheme from './src/lib/code-theme.json' with { type: 'json' };

if (unlisted.length) {
  console.warn(`at the end of their section until src/nav.mjs lists them: ${unlisted.join(', ')}`);
}
if (gone.length) {
  console.warn(`listed in src/nav.mjs, gone from the repository: ${gone.join(', ')}`);
}

export default defineConfig({
  site: 'https://zaentrum.github.io',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  // the product page used to be zaentrum/zaentrum's own Pages site, at /zaentrum/; the
  // specification's pages used to be in the docs, at /docs/chino/ and /docs/portal/.
  redirects: { '/zaentrum/': '/', ...Object.fromEntries(moved) },
  markdown: {
    // straight quotes and dashes stay as they are written; the docs quote code.
    processor: unified({ remarkPlugins: [remarkMermaid], smartypants: false }),
  },
  integrations: [
    starlight({
      title: 'zaentrum',
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
        // every docs page is in a section's side navigation (src/nav.mjs); the 404 page is in none,
        // and a capability's fact sheet (src/pages/spec/capabilities/) is in the capabilities'.
        starlightSidebarTopics(topics, { exclude: ['/404'], topics: { capabilities: ['/spec/capabilities/**'] } }),
        // the product page and the schemas site are outside the docs.
        starlightLinksValidator({ exclude: ['/', '/schemas/**'] }),
      ],
    }),
  ],
});
