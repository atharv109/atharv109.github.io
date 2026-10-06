// remark-editor.mjs — mdast pass for the editor rhythm (ref §2.5):
// two aria-hidden blank paragraphs before each h2, one before each h3 and
// after each list; single-newline markdown soft-wraps split into distinct
// buffer paragraphs (Key: value line groups); inline links become .button
// chips (?color=name suffix support). Media/embed/frame needs are served by
// the FeatureBlock component directly in pages — no directive syntax.

const spacer = () => ({ type: 'html', value: '<p aria-hidden="true">&nbsp;</p>' });

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const textOf = (node) => (node.children ?? []).map((c) => c.value ?? textOf(c)).join('');

// One markdown soft-wrap = one buffer line boundary: split a paragraph whose
// text nodes contain single newlines into several paragraphs (e.g. key/value
// line groups). Children outside text nodes pass through on the current side
// of the split.
function splitParagraph(node) {
  if (node.type !== 'paragraph' || !node.children) return [node];
  const pieces = [];
  let current = [];
  let split = false;
  const flush = () => {
    if (current.length) pieces.push({ type: 'paragraph', children: current });
    current = [];
  };
  for (const child of node.children) {
    if (child.type === 'text' && child.value.includes('\n')) {
      const parts = child.value.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          flush();
          split = true;
        }
        if (parts[i]) current.push({ ...child, value: parts[i] });
      }
    } else {
      current.push(child);
    }
  }
  flush();
  return split ? pieces : [node];
}

export default function remarkEditorRhythm() {
  return (tree) => {
    if (!tree?.children) return;
    const out = [];
    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) out.push(spacer(), spacer());
      else if (node.type === 'heading' && node.depth === 3) out.push(spacer());
      const pieces = node.type === 'paragraph' ? splitParagraph(node) : [node];
      for (const piece of pieces) out.push(rewriteLinks(piece));
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