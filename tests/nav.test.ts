import { describe, it, expect } from 'vitest';
import { NAV, type NavNode } from '../src/data/nav';

function flatten(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flatten(n.children) : [])]);
}

const all = flatten(NAV);
const hrefs = all.flatMap((n) => (n.href ? [n.href] : []));

describe('nav tree', () => {
  it('contains every route', () => {
    const routes = [
      '/',
      '/projects/',
      '/projects/vulnswarm-vex/',
      '/projects/adversary-lab/',
      '/projects/prompt-optimiser/',
      '/projects/eleventh-round/',
      '/projects/crypton/',
      '/projects/acctomatic/',
      '/archive/',
      '/archive/tinyvulnscanner/',
      '/archive/eduai/',
      '/archive/protopaper/',
      '/archive/billshield/',
      '/archive/ai-outfit/',
      '/archive/blinks/',
      '/archive/buildora-agent-pipeline/',
      '/archive/android-app/',
      '/about/',
      '/experience/',
      '/contact/',
      '/shell/',
      '/resume/',
    ];
    for (const route of routes) expect(hrefs).toContain(route);
  });

  it('every node with children has no href', () => {
    for (const node of all) {
      if (node.children?.length) expect(node.href).toBeUndefined();
    }
  });

  it('external nodes are root-level with href', () => {
    for (const label of ['github', 'linkedin', 'email']) {
      const node = NAV.find((n) => n.label === label);
      expect(node, label).toBeDefined();
      expect(node!.href, label).toBeDefined();
    }
  });

  it('exactly one nav item carries end: true (the bottom cluster is compact; multiple flags spread the links apart)', () => {
    const ends = NAV.filter((n) => n.end === true).map((n) => n.label);
    expect(ends).toEqual(['contact.md']);
  });

  it('the about page shows as about.me in the tree', () => {
    expect(NAV.find((n) => n.label === 'about.me')?.href).toBe('/about/');
  });
});
