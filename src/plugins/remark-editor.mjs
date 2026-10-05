// remark-editor.mjs — mdast pass for the editor rhythm (ref §2.5):
// two aria-hidden blank paragraphs before each h2, one before each h3 and
// after each list; inline links become .button chips. Media/embed/frame needs
// are served by the FeatureBlock component directly in pages — no directive
// syntax (keeps the dep set frozen).

const spacer = () => ({ type: 'html', value: '<p aria-hidden="true">&nbsp;</p>' });

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const textOf = (node) => (node.children ?? []).map((c) => c.value ?? textOf(c)).join('');

export default function remarkEditorRhythm() {
  return (tree) => {
    if (!tree?.children) return;
    const out = [];
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      const prev = tree.children[i - 1];
      if (node.type === 'heading' && node.depth === 2) {
        out.push(spacer(), spacer());
      } else if (node.type === 'heading' && node.depth === 3) {
        out.push(spacer());
      } else if (node.type === 'list' && prev) {
        // blank line after lists — applied post-loop below
      }
      out.push(rewriteLinks(node));
      if (node.type === 'list') out.push(spacer());
    }
    tree.children = out;
  };
}

function rewriteLinks(node) {
  if (!node.children) return node;
  node.children = node.children.map((child) => {
    if (child.type === 'link') {
      const label = escapeHtml(textOf(child));
      const colorMatch = /\?color=(\w+)$/.exec(child.url);
      const href = colorMatch ? child.url.slice(0, -colorMatch[0].length) : child.url;
      const color = colorMatch ? colorMatch[1] : 'green';
      return {
        type: 'html',
        value:
          `<a class="button" href="${escapeHtml(href)}" style="--link-color:var(--color-${color})">` +
          `<span class="button-inner">${label}</span></a>`,
      };
    }
    return rewriteLinks(child);
  });
  return node;
}
