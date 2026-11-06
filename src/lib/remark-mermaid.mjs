// a ```mermaid block becomes <pre class="mermaid">, which MarkdownContent.astro draws
// in the browser, instead of a highlighted code block. the source stays the text.
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function remarkMermaid() {
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type === 'code' && child.lang === 'mermaid') {
        return { type: 'html', value: `<pre class="mermaid" data-pagefind-ignore>${escape(child.value)}</pre>` };
      }
      walk(child);
      return child;
    });
  };
  return walk;
}
