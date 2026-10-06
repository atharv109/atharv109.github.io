// remark-editor.mjs is a pure mdast tree walk (node env, no DOM).
import { describe, it, expect } from 'vitest';
import remarkEditorRhythm from '../src/plugins/remark-editor.mjs';
import type { Root } from 'mdast';

const run = (children: unknown[]) => {
  const tree = { type: 'root', children } as unknown as Root;
  remarkEditorRhythm()(tree, undefined, () => undefined);
  return tree.children;
};
const text = (v: string) => ({ type: 'text', value: v });
const h = (d: number, v: string) => ({ type: 'heading', depth: d, children: [text(v)] });
const htmlSpacers = (cs: unknown[]) => cs.filter((n) => (n as { value: string }).value?.includes('aria-hidden'));

describe('remark-editor rhythm', () => {
  it('inserts two spacers before h2 and one before h3', () => {
    const out = run([h(2, 'Highlights')]) as { type: string; value: string }[];
    expect(htmlSpacers(out).length).toBe(2);
    expect(out[out.length - 1].type).toBe('heading');
  });
  it('one spacer before h3', () => {
    const out = run([h(3, 'Group')]) as { type: string }[];
    expect(htmlSpacers(out).length).toBe(1);
  });
  it('spacer after a list', () => {
    const out = run([{ type: 'list', children: [] }]) as { type: string }[];
    expect(htmlSpacers(out).length).toBe(1);
  });
  it('splits soft-wrapped paragraphs into separate buffer lines', () => {
    const out = run([
      { type: 'paragraph', children: [text('Role: Solo Developer\nTimeframe: 2026')] },
    ]) as { type: string; children: { value: string }[] }[];
    const paras = out.filter((n) => n.type === 'paragraph');
    expect(paras.length).toBe(2);
    expect(paras[0].children[0].value).toBe('Role: Solo Developer');
    expect(paras[1].children[0].value).toBe('Timeframe: 2026');
  });
  it('rewrites links into .button chips; ?color suffix is consumed', () => {
    const out = run([
      { type: 'paragraph', children: [text('see '), { type: 'link', url: 'https://x.y?color=pink', children: [text('x')] }] },
    ]) as { type: string; children?: { type: string; value: string }[] }[];
    const para = out.find((n) => n.type === 'paragraph')!;
    const chip = para.children!.find((c) => c.type === 'html')!;
    expect(chip.value).toContain('href="https://x.y"');
    expect(chip.value).toContain('--color-pink');
    expect(chip.value).toContain('>x</span>');
  });
  it('links default to green without a ?color suffix', () => {
    const out = run([
      { type: 'paragraph', children: [{ type: 'link', url: 'mailto:a@b.c', children: [text('mail')] }] },
    ]) as { children?: { type: string; value: string }[] }[];
    const para = out.find((n) => n.type === 'paragraph')!;
    expect(para.children!.some((c) => c.value?.includes('--color-green'))).toBe(true);
  });
});