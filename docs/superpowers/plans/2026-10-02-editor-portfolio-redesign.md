# Editor Portfolio Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as a premium code-editor/file-explorer experience (meadow palette, Iosevka, file-tree nav, highlighted line-numbered content, editor-native motion) matching the feel of digitalmeadow.studio, carrying the user's own content.

**Architecture:** Keep React 19 + Vite 7 + Tailwind v3 + react-router-dom 7. A persistent editor shell (`Editor` = `FileTree` sidebar + `ContentPane`) renders "files" as routes (`/`, `/projects/:id`, `/archive/:id`, `/about`, `/contact`, `/shell`, `/resume`). Content stays data-driven (`projects.ts` + new `about`/`contact`/`readme` data). Pure data→tree/line mapping lives in `src/data/` (unit-tested with Vitest); visual components are verified by build + Playwright smoke checks.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind 3.4, react-router-dom 7, GSAP, Lenis, Vitest (dev-only, added for the data layer).

**Spec:** `docs/superpowers/specs/2026-10-02-editor-portfolio-redesign-design.md`

## Global Constraints

- Node `>=22` (package.json engines). Vite root is `src/`; HTML entry is `src/index.html`; `public/` holds `404.html` + `favicon.svg`.
- Palette tokens (CSS vars in `src/index.css` `:root`), exact values: `--base #1c2225`, `--mantle #171c1f`, `--crust #171c1f`, `--surface0 #232a2e`, `--surface1 #2b3337`, `--surface2 #374145`, `--overlay0 #4a585c`, `--overlay1 #58686d`, `--overlay2 #6f8788`, `--text #f8f9e8`, `--subtext0 #839e9a`, `--subtext1 #96b4aa`, `--subtext2 #adc9bc`, `--red #f57f82`, `--orange #f7a182`, `--yellow #f5d098`, `--lime #dbe6af`, `--green #cbe3b3`, `--aqua #b3e3ca`, `--skye #b3e6db`, `--snow #afd9e6`, `--blue #b2caed`, `--purple #d2bdf3`, `--pink #f3c0e5`, `--cherry #fae6ef`.
- Syntax token→color mapping: keyword→`red`, string→`lime`, function→`green`, constant→`pink`, comment→`overlay2`, punctuation→`subtext0`, link→`skye`, parameter→`text`, plain→`text`.
- Font: `--font-ui: "Iosevka", ui-monospace, monospace` applied to `body` and all UI. Line-height ≈1.357rem; sidebar `36ch`; line-number gutter `5ch` (collapses to `0` under `50rem`).
- Copy rules: reuse the user's existing content verbatim (projects.ts, About cells, Contact, Hero identity "ATHARV MITTAL · SECURITY × PRODUCT · full-stack / security-trained / product-obsessed"). Do not copy any code/text/name/asset from digitalmeadow.studio.
- `prefers-reduced-motion: reduce` must disable wave/intro/marquee and render content static.
- Drop `three`/`@types/three`; keep `gsap`, `lenis`. No new runtime deps beyond Iosevka font package.

## Review Focus

1. **Deep link on GH Pages SPA** — `/projects/vulnswarm-vex` (or any file route) opened directly must serve `404.html` → rewrite to the app and render the file, not a blank/404 page.
2. **Unknown file id** — `/projects/does-not-exist` must render a "file not found" line in the content pane, not crash.
3. **Tree keyboard navigation** — arrow keys move between tree items; `aria-current` tracks the open file; Enter/Space opens the focused file.
4. **Reduced motion** — with `prefers-reduced-motion: reduce`, all text is visible immediately (no wave/intro hiding content).
5. **Narrow viewport** — sidebar collapses to a toggle under ~50rem; line numbers hidden; no horizontal page scroll.

---

### Task 1: Foundation — theme tokens, font, dependency changes, test setup

**Files:**
- Modify: `src/index.css` (replace `:root` palette, body font, remove grain/cursor/scanline-swe/CRT-SWE styles that no longer apply)
- Modify: `package.json` (remove `three`, `@types/three`; add `@fontsource/iosevka`, `vitest`)
- Modify: `vite.config.ts` (drop `three` from `manualChunks`; keep `gsap`)
- Modify: `tailwind.config.js` (extend `fontFamily.mono` to Iosevka)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts` (empty for now)

**Interfaces:**
- Produces: CSS vars consumed by every later task via `var(--color-*)` and `var(--font-ui)`; a working `npm test` runner.

- [ ] **Step 1: Update `src/index.css` `:root` block**

Replace the existing `:root { … }` (lines 5–14) with the meadow palette from Global Constraints. Body font becomes `var(--font-ui)`. Delete the now-unused `.grain`, `.cursor-dot`, `.scanline-swe`, `.scanlines`, `.vignette`, `.crt-subtle`, `.terminal-dot`, `.terminal-cursor` rules (the terminal re-coloring happens in Task 8; keep only what the terminal still needs). Keep `@tailwind` directives, `@media (prefers-reduced-motion)`, and scrollbar rules (re-point scrollbar colors to `--surface0` / `--green`).

- [ ] **Step 2: Add the font import at the top of `src/index.css`**

```css
@import "@fontsource/iosevka/400.css";
@import "@fontsource/iosevka/500.css";
@import "@fontsource/iosevka/700.css";
```

- [ ] **Step 3: Update `package.json` dependencies**

Remove `"three": "^0.185.0"` and `"@types/three": "^0.185.0"`. Add to `devDependencies`: `"@fontsource/iosevka": "^5.1.1"`, `"vitest": "^3.2.4"`. Add a script `"test": "vitest run"`.

- [ ] **Step 4: Update `vite.config.ts` manualChunks**

Change `manualChunks` to remove the `three` entry, leaving only `gsap: ["gsap"]`.

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 6: Install and verify**

Run: `npm install` then `npm run build`.
Expected: install succeeds; `tsc --noEmit` passes; `vite build` completes without the `three` chunk and with no unresolved `var(--…)` (CSS vars are used at runtime, so build only verifies syntax).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): meadow theme tokens, Iosevka, drop three, add vitest"
```

---

### Task 2: Data layer — file tree + highlighted code lines (TDD)

**Files:**
- Create: `src/data/fileTree.ts`
- Create: `src/data/codeLines.ts`
- Create: `src/data/fileTree.test.ts`
- Create: `src/data/codeLines.test.ts`

**Interfaces:**
- Consumes: `projects`, `archiveProjects` from `src/data/projects.ts` (existing).
- Produces (used by Tasks 3–8):
  - `type Token = 'keyword' | 'string' | 'function' | 'constant' | 'comment' | 'punctuation' | 'link' | 'parameter' | 'plain'`
  - `interface CodeSegment { text: string; token: Token; href?: string }`
  - `interface CodeLine { segments: CodeSegment[] }`
  - `function tokenColor(token: Token): string` → returns a CSS `var(--color-*)` string.
  - `interface TreeNode { name: string; kind: 'folder' | 'file' | 'external' | 'executable'; path?: string; href?: string; children?: TreeNode[] }`
  - `function buildFileTree(): TreeNode[]`
  - `function projectToCodeLines(p: Project): CodeLine[]`

- [ ] **Step 1: Write the failing tests — `src/data/codeLines.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { tokenColor, projectToCodeLines } from "./codeLines";
import { projects } from "./projects";

describe("tokenColor", () => {
  it("maps semantic tokens to CSS vars", () => {
    expect(tokenColor("keyword")).toBe("var(--color-red)");
    expect(tokenColor("string")).toBe("var(--color-lime)");
    expect(tokenColor("function")).toBe("var(--color-green)");
    expect(tokenColor("constant")).toBe("var(--color-pink)");
    expect(tokenColor("comment")).toBe("var(--color-overlay2)");
    expect(tokenColor("link")).toBe("var(--color-skye)");
    expect(tokenColor("plain")).toBe("var(--color-text)");
  });
});

describe("projectToCodeLines", () => {
  it("renders name as keyword, metric as constant, stack as string, prose as comment", () => {
    const p = projects.find((x) => x.id === "vulnswarm-vex")!;
    const lines = projectToCodeLines(p);
    const flat = lines.flatMap((l) => l.segments);
    const byText = (t: string) => flat.find((s) => s.text === t);
    expect(byText("VulnSwarm-VEX")?.token).toBe("keyword");
    expect(byText("91.7%")?.token).toBe("constant");
    expect(flat.some((s) => s.text === "Python" && s.token === "string")).toBe(true);
    expect(flat.some((s) => s.token === "comment")).toBe(true);
  });

  it("emits a link segment for the first project link", () => {
    const p = projects.find((x) => x.id === "prompt-optimiser")!;
    const flat = projectToCodeLines(p).flatMap((l) => l.segments);
    const link = flat.find((s) => s.token === "link");
    expect(link?.href).toBe("https://github.com/atharv109/Chatgpt-prompt-optimiser");
  });
});
```

- [ ] **Step 2: Write the failing tests — `src/data/fileTree.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { buildFileTree } from "./fileTree";

function find(tree: ReturnType<typeof buildFileTree>, name: string) {
  for (const n of tree) {
    if (n.name === name) return n;
    if (n.children) {
      const hit = find(n.children, name);
      if (hit) return hit;
    }
  }
  return undefined;
}

describe("buildFileTree", () => {
  const tree = buildFileTree();

  it("has README.md at the root", () => {
    expect(find(tree, "README.md")).toMatchObject({ kind: "file", path: "/" });
  });

  it("nests six featured projects under projects/", () => {
    const projectsNode = find(tree, "projects");
    expect(projectsNode?.kind).toBe("folder");
    expect(projectsNode?.children?.filter((c) => c.kind === "file")).toHaveLength(6);
  });

  it("has an executable shell file", () => {
    expect(find(tree, "shell")).toMatchObject({ kind: "executable", path: "/shell" });
  });

  it("lists github/linkedin/email as external root entries", () => {
    expect(find(tree, "github")).toMatchObject({ kind: "external", href: "https://github.com/atharv109" });
    expect(find(tree, "email")).toMatchObject({ kind: "external", href: "mailto:atharvm2005@gmail.com" });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — modules `./codeLines` and `./fileTree` do not exist.

- [ ] **Step 4: Implement `src/data/codeLines.ts`**

```ts
import type { Project } from "./projects";

export type Token =
  | "keyword" | "string" | "function" | "constant" | "comment"
  | "punctuation" | "link" | "parameter" | "plain";

export interface CodeSegment { text: string; token: Token; href?: string }
export interface CodeLine { segments: CodeSegment[] }

const TOKEN_COLOR: Record<Token, string> = {
  keyword: "var(--color-red)",
  string: "var(--color-lime)",
  function: "var(--color-green)",
  constant: "var(--color-pink)",
  comment: "var(--color-overlay2)",
  punctuation: "var(--color-subtext0)",
  link: "var(--color-skye)",
  parameter: "var(--color-text)",
  plain: "var(--color-text)",
};

export function tokenColor(token: Token): string {
  return TOKEN_COLOR[token];
}

function line(...segments: CodeSegment[]): CodeLine {
  return { segments };
}

export function projectToCodeLines(p: Project): CodeLine[] {
  const lines: CodeLine[] = [];
  lines.push(line({ text: "# ", token: "comment" }, { text: p.name, token: "keyword" }));
  lines.push(line({ text: p.role, token: "parameter" }));
  lines.push(line({ text: "// " + p.timeframe, token: "comment" }));
  if (p.metric) lines.push(line({ text: "metric: ", token: "comment" }, { text: p.metric, token: "constant" }));
  if (p.hook) lines.push(line({ text: "// " + p.hook, token: "comment" }));
  lines.push(line({ text: "problem: ", token: "comment" }, { text: p.problem, token: "plain" }));
  lines.push(line({ text: "solution: ", token: "comment" }, { text: p.solution, token: "plain" }));
  lines.push(line({ text: "impact: ", token: "comment" }, { text: p.impact, token: "plain" }));
  lines.push(line({ text: "stack: ", token: "comment" }, { text: "[" + p.techStack.join(", ") + "]", token: "string" }));
  for (const link of p.links) {
    lines.push(line({ text: link.label + ": ", token: "comment" }, { text: link.url, token: "link", href: link.url }));
  }
  return lines;
}
```

- [ ] **Step 5: Implement `src/data/fileTree.ts`**

```ts
import { projects, archiveProjects } from "./projects";

export interface TreeNode {
  name: string;
  kind: "folder" | "file" | "external" | "executable";
  path?: string;
  href?: string;
  children?: TreeNode[];
}

function projectFile(id: string): TreeNode {
  return { name: id + ".md", kind: "file", path: "/projects/" + id };
}

export function buildFileTree(): TreeNode[] {
  return [
    { name: "README.md", kind: "file", path: "/" },
    {
      name: "projects", kind: "folder",
      children: projects.map((p) => projectFile(p.id)),
    },
    {
      name: "archive", kind: "folder",
      children: archiveProjects.map((p) => ({ name: p.id + ".md", kind: "file", path: "/archive/" + p.id })),
    },
    { name: "about.md", kind: "file", path: "/about" },
    { name: "contact.md", kind: "file", path: "/contact" },
    { name: "shell", kind: "executable", path: "/shell" },
    { name: "resume.md", kind: "file", path: "/resume" },
    { name: "github", kind: "external", href: "https://github.com/atharv109" },
    { name: "linkedin", kind: "external", href: "https://www.linkedin.com/in/atharv-mittal/" },
    { name: "email", kind: "external", href: "mailto:atharvm2005@gmail.com" },
  ];
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — 8 assertions green.

- [ ] **Step 7: Commit**

```bash
git add src/data/fileTree.ts src/data/codeLines.ts src/data/*.test.ts
git commit -m "feat(editor): file-tree and highlighted-code-line data mapping"
```

---

### Task 3: Editor shell — routing + FileTree sidebar

**Files:**
- Create: `src/components/editor/FileTree.tsx`
- Create: `src/components/editor/icons.tsx`
- Modify: `src/App.tsx` (replace `AppShell` with `Editor` shell; new routes)
- Create: `src/components/editor/Editor.tsx`

**Interfaces:**
- Consumes: `buildFileTree(): TreeNode[]`, `TreeNode`.
- Produces: `Editor` component (imported by `App.tsx`); route contract `/`, `/projects/:id`, `/archive/:id`, `/about`, `/contact`, `/shell`, `/resume`; `FileTree` component.

- [ ] **Step 1: Create `src/components/editor/icons.tsx`** (inline SVG glyphs for tree entries)

```tsx
export function FolderIcon({ open }: { open?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={open ? "M1 4.5h4l1.5 2h8v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" : "M1 4h5l1.5 2H15a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"} stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
export function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1h6l2 2v12H4z" stroke="currentColor" strokeWidth="1" />
      <path d="M10 1v2h2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
export function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
      style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
      <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
export function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M7 3h2a4 4 0 0 1 0 8H7M9 5H7a4 4 0 0 0 0 8h2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/components/editor/FileTree.tsx`**

A recursive tree. Folders toggle open/closed via local state (persist in `localStorage` under `nav-open:<name>`). Files are `Link`/`NavLink` to their `path`; external entries are `<a href target=_blank>`. Active file gets `aria-current="page"` and `--green` color. Keyboard: ArrowUp/Down move focus across flattened items; Enter/Space activates. Emit `role="tree"` on the root and `role="treeitem"` on each node.

```tsx
import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { TreeNode } from "../../data/fileTree";
import { FolderIcon, FileIcon, ChevronIcon, LinkIcon } from "./icons";

function iconFor(node: TreeNode, open: boolean) {
  if (node.kind === "folder") return <><ChevronIcon open={open} /><FolderIcon open={open} /></>;
  if (node.kind === "external") return <LinkIcon />;
  if (node.kind === "executable") return <FileIcon />;
  return <FileIcon />;
}

function Node({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(() => localStorage.getItem("nav-open:" + node.name) === "1");
  const indent = { paddingLeft: `${depth * 1.25}ch` };
  if (node.kind === "folder") {
    return (
      <div role="treeitem" aria-expanded={open}>
        <button style={indent} className="tree-row" onClick={() => {
          setOpen((o) => { localStorage.setItem("nav-open:" + node.name, o ? "0" : "1"); return !o; });
        }}>
          {iconFor(node, open)}<span>{node.name}/</span>
        </button>
        {open && node.children?.map((c) => <Node key={c.name} node={c} depth={depth + 1} />)}
      </div>
    );
  }
  if (node.kind === "external") {
    return (
      <a role="treeitem" style={indent} className="tree-row" href={node.href} target="_blank" rel="noopener noreferrer">
        {iconFor(node, false)}<span>{node.name}</span>
      </a>
    );
  }
  return (
    <NavLink role="treeitem" style={indent} className={({ isActive }) => "tree-row" + (isActive ? " is-current" : "")} to={node.path!} end={node.path === "/"}>
      {iconFor(node, false)}<span>{node.name}</span>
    </NavLink>
  );
}

export function FileTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <nav role="tree" aria-label="Site" className="tree">
      <div className="cwd">~/atharv-mittal</div>
      {nodes.map((n) => <Node key={n.name} node={n} depth={0} />)}
    </nav>
  );
}
```

- [ ] **Step 3: Create `src/components/editor/Editor.tsx`**

Persistent two-pane shell. Renders `FileTree` (left, 36ch) + `<Outlet/>` (right). Includes the status bar (Task 4 will fill it — for now render a placeholder `<StatusBar/>` import stub or a plain `<footer>`). Provide a theme/font-size toggle button (Task 9 wires it; render a stub button now).

```tsx
import { Outlet } from "react-router-dom";
import { FileTree } from "./FileTree";
import { buildFileTree } from "../../data/fileTree";
import { useLenis } from "../../hooks/useLenis";

export function Editor() {
  useLenis();
  return (
    <div className="editor">
      <aside className="sidebar"><FileTree nodes={buildFileTree()} /></aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `src/App.tsx`**

Replace the old `AppShell` (Preloader/CustomCursor/grain/Spotlight/Nav/ScrollSpy/SwePortfolio/SecurityPortfolio) with a BrowserRouter whose layout route is `Editor` and whose child routes are the file routes. Keep `LenisContext` if `useLenis` still needs it (or simplify: `useLenis` can run in `Editor` without context). Lazy-load the page components.

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Editor } from "./components/editor/Editor";

const Readme = lazy(() => import("./pages/Readme"));
const Project = lazy(() => import("./pages/ProjectFile"));
const Archive = lazy(() => import("./pages/ArchiveFile"));
const AboutFile = lazy(() => import("./pages/AboutFile"));
const ContactFile = lazy(() => import("./pages/ContactFile"));
const Shell = lazy(() => import("./pages/ShellFile"));
const Resume = lazy(() => import("./pages/ResumeFile"));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Editor />}>
            <Route path="/" element={<Readme />} />
            <Route path="/projects/:id" element={<Project />} />
            <Route path="/archive/:id" element={<Archive />} />
            <Route path="/about" element={<AboutFile />} />
            <Route path="/contact" element={<ContactFile />} />
            <Route path="/shell" element={<Shell />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="*" element={<Readme />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

(Page components are created in Tasks 5 and 8; until then build fails — see Step 5 ordering.)

- [ ] **Step 5: Add `editor` layout CSS to `src/index.css`**

```css
.editor { display: grid; grid-template-columns: var(--sidebar-width, 36ch) 1fr; min-height: 100vh; }
.sidebar { border-right: 1px solid var(--color-overlay0); background: var(--color-mantle); overflow-y: auto; }
.content { min-width: 0; }
.tree-row { display: flex; align-items: center; gap: .5ch; width: 100%; padding: .15rem 1ch; color: var(--color-subtext0); background: none; border: none; font: inherit; text-align: left; cursor: pointer; }
.tree-row:hover { color: var(--color-text); }
.tree-row.is-current { color: var(--color-green); }
.cwd { padding: .5rem 1ch; color: var(--color-subtext2); border-bottom: 1px solid var(--color-overlay0); }
@media (width <= 50rem) { .editor { grid-template-columns: 1fr; } .sidebar { position: fixed; inset: 0 auto 0 0; width: 36ch; transform: translateX(-100%); } }
```

- [ ] **Step 6: Verify**

Run: `npm run build`
Expected: fails only on missing page imports (`./pages/Readme`, etc.) if Task 5 hasn't run yet. If implementing tasks in order, create minimal placeholder page files (export a component returning `<div/>`) now so the build is green, then flesh them out in Task 5. Expected after placeholders: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): editor shell, file-tree sidebar, file routing"
```

---

### Task 4: Content pane — line numbers, highlighted prose, status bar

**Files:**
- Create: `src/components/editor/HighlightedCode.tsx`
- Create: `src/components/editor/LineNumbers.tsx`
- Create: `src/components/editor/StatusBar.tsx`
- Create: `src/components/editor/ContentPane.tsx`

**Interfaces:**
- Consumes: `CodeLine`, `tokenColor()` from `src/data/codeLines.ts`.
- Produces: `ContentPane({ lines, filetype, title })` used by every page in Task 5; `HighlightedCode({ lines })`; `StatusBar({ filetype })`.

- [ ] **Step 1: Create `src/components/editor/HighlightedCode.tsx`**

```tsx
import type { CodeLine } from "../../data/codeLines";
import { tokenColor } from "../../data/codeLines";

export function HighlightedCode({ lines }: { lines: CodeLine[] }) {
  return (
    <div className="content-lines">
      {lines.map((line, i) => (
        <div className="content-row" key={i}>
          {line.segments.map((seg, j) =>
            seg.href ? (
              <a key={j} href={seg.href} target="_blank" rel="noopener noreferrer" style={{ color: tokenColor(seg.token) }}>
                {seg.text}
              </a>
            ) : (
              <span key={j} style={{ color: tokenColor(seg.token) }}>{seg.text}</span>
            )
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/editor/LineNumbers.tsx`**

```tsx
export function LineNumbers({ count }: { count: number }) {
  return (
    <div className="line-numbers" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i}>{i + 1}</span>)}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/editor/StatusBar.tsx`**

```tsx
export function StatusBar({ filetype }: { filetype: string }) {
  return (
    <footer className="statusbar">
      <span>Ln 1, Col 1</span>
      <span>UTF-8</span>
      <span>{filetype}</span>
      <span className="ml-auto">dark</span>
    </footer>
  );
}
```

- [ ] **Step 4: Create `src/components/editor/ContentPane.tsx`**

```tsx
import { LineNumbers } from "./LineNumbers";
import { HighlightedCode } from "./HighlightedCode";
import { StatusBar } from "./StatusBar";
import type { CodeLine } from "../../data/codeLines";

export function ContentPane({ title, filetype, lines }: { title: string; filetype: string; lines: CodeLine[] }) {
  return (
    <div className="content-page">
      <div className="content-wrapper">
        <LineNumbers count={lines.length} />
        <HighlightedCode lines={lines} />
      </div>
      <StatusBar filetype={filetype} />
    </div>
  );
}
```

- [ ] **Step 5: Add content-pane CSS to `src/index.css`**

```css
.content-page { display: flex; flex-direction: column; min-height: 100vh; }
.content-wrapper { display: flex; flex: 1; }
.line-numbers { width: var(--line-numbers-width, 5ch); text-align: right; padding-right: 1ch; color: var(--color-overlay1); user-select: none; border-right: 1px solid var(--color-overlay0); }
.content-lines { flex: 1; padding: 0 1.5ch; }
.content-row { white-space: pre-wrap; line-height: 1.357rem; }
.statusbar { display: flex; gap: 2ch; padding: .25rem 1ch; border-top: 1px solid var(--color-overlay0); color: var(--color-subtext1); font-size: .85rem; }
@media (width <= 50rem) { .line-numbers { display: none; } }
```

- [ ] **Step 6: Verify**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): content pane with line numbers, highlighted prose, status bar"
```

---

### Task 5: Content pages — README, About, Contact, Project, Archive, Resume

**Files:**
- Create: `src/data/site.ts` (readme/about/contact content)
- Create: `src/pages/Readme.tsx`
- Create: `src/pages/AboutFile.tsx`
- Create: `src/pages/ContactFile.tsx`
- Create: `src/pages/ProjectFile.tsx`
- Create: `src/pages/ArchiveFile.tsx`
- Create: `src/pages/ResumeFile.tsx`
- Delete: `src/sections/Hero.tsx`, `src/sections/Work.tsx`, `src/sections/About.tsx`, `src/sections/Contact.tsx`, `src/routes/SwePortfolio.tsx`

**Interfaces:**
- Consumes: `ContentPane`, `CodeLine`, `projectToCodeLines`, `projects`, `archiveProjects`.
- Produces: page components matching the route contract from Task 3.

- [ ] **Step 1: Create `src/data/site.ts`** (reuse existing copy verbatim)

```ts
import type { CodeLine } from "./codeLines";

export const readmeLines: CodeLine[] = [
  { segments: [{ text: "# ATHARV MITTAL", token: "keyword" }] },
  { segments: [{ text: "SECURITY × PRODUCT", token: "constant" }] },
  { segments: [{ text: "// full-stack engineer · security-trained · product-obsessed", token: "comment" }] },
  { segments: [{ text: "Find the break → build the fix → ship the proof.", token: "string" }] },
];

export const aboutLines: CodeLine[] = [
  { segments: [{ text: "// Not two roles. One loop.", token: "comment" }] },
  { segments: [{ text: "loop: ", token: "comment" }, { text: "\"Started by finding what breaks. Now I build the products that don't.\"", token: "string" }] },
  { segments: [{ text: "degree: ", token: "comment" }, { text: "\"B.S. Cybersecurity, Penn State '28\"", token: "string" }] },
  { segments: [{ text: "cert: ", token: "comment" }, { text: "\"CompTIA Security+\"", token: "constant" }] },
  { segments: [{ text: "current: ", token: "comment" }, { text: "\"Founder @ Buildora — ~50 clients\"", token: "string" }] },
  { segments: [{ text: "focus: ", token: "comment" }, { text: "\"Full-stack · Security · AI infra\"", token: "string" }] },
  { segments: [{ text: "experience: ", token: "comment" }, { text: "\"SOC intern @ Centrient Pharma\"", token: "string" }] },
  { segments: [{ text: "location: ", token: "comment" }, { text: "\"State College, PA — willing to relocate\"", token: "string" }] },
];

export const contactLines: CodeLine[] = [
  { segments: [{ text: "// LET'S BUILD SOMETHING.", token: "comment" }] },
  { segments: [{ text: "email: ", token: "comment" }, { text: "atharvm2005@gmail.com", token: "link", href: "mailto:atharvm2005@gmail.com" }] },
  { segments: [{ text: "github: ", token: "comment" }, { text: "github.com/atharv109", token: "link", href: "https://github.com/atharv109" }] },
  { segments: [{ text: "linkedin: ", token: "comment" }, { text: "linkedin.com/in/atharv-mittal", token: "link", href: "https://www.linkedin.com/in/atharv-mittal/" }] },
];
```

- [ ] **Step 2: Create the four simple pages**

`Readme.tsx` → `ContentPane({ title: "README.md", filetype: "markdown", lines: readmeLines })`.
`AboutFile.tsx` → `ContentPane({ title: "about.md", filetype: "markdown", lines: aboutLines })`.
`ContactFile.tsx` → `ContentPane({ title: "contact.md", filetype: "markdown", lines: contactLines })`.
`ResumeFile.tsx` → `ContentPane({ title: "resume.md", filetype: "markdown", lines: [{ segments: [{ text: "// resume coming soon", token: "comment" }] }] })` (placeholder per spec).

- [ ] **Step 3: Create `src/pages/ProjectFile.tsx`**

```tsx
import { useParams, Navigate } from "react-router-dom";
import { projects } from "../data/projects";
import { projectToCodeLines } from "../data/codeLines";
import { ContentPane } from "../components/editor/ContentPane";

export default function ProjectFile() {
  const { id } = useParams();
  const p = projects.find((x) => x.id === id);
  if (!p) return <ContentPane title="404.md" filetype="markdown" lines={[{ segments: [{ text: "// file not found: " + id, token: "comment" }] }]} />;
  return <ContentPane title={p.id + ".md"} filetype="markdown" lines={projectToCodeLines(p)} />;
}
```

(Review Focus #2 — unknown id renders a "file not found" line, no crash.)

- [ ] **Step 4: Create `src/pages/ArchiveFile.tsx`**

```tsx
import { useParams } from "react-router-dom";
import { archiveProjects } from "../data/projects";
import { projectToCodeLines } from "../data/codeLines";
import { ContentPane } from "../components/editor/ContentPane";

export default function ArchiveFile() {
  const { id } = useParams();
  const p = archiveProjects.find((x) => x.id === id);
  if (!p) return <ContentPane title="404.md" filetype="markdown" lines={[{ segments: [{ text: "// file not found: " + id, token: "comment" }] }]} />;
  return <ContentPane title={p.id + ".md"} filetype="markdown" lines={projectToCodeLines(p)} />;
}
```

- [ ] **Step 5: Delete the replaced section/route files**

Delete `src/sections/Hero.tsx`, `Work.tsx`, `About.tsx`, `Contact.tsx`, `src/routes/SwePortfolio.tsx`, and the now-unused `src/components/BridgeField.tsx`, `Spotlight.tsx`, `ProjectVisual.tsx`, `ScrollSpy.tsx`, `Preloader.tsx`, `CustomCursor.tsx`, `RouteTransition.tsx`, `Nav.tsx`. Keep `ScrambleLink.tsx`, `useLenis.ts`, `useMagneticButton.ts`, `useTextScramble.ts` (used later).

- [ ] **Step 6: Verify build + smoke test**

Run: `npm run build`. Expected: PASS (no dangling imports).
Playwright: `npm run dev`, then `browser_navigate` to `http://localhost:5173/` → assert "ATHARV MITTAL" and "README.md" in the tree; navigate to `/projects/vulnswarm-vex` → assert "VulnSwarm-VEX" and "91.7%"; navigate to `/projects/nope` → assert "file not found".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): content pages for README, about, contact, projects, archive, resume"
```

---

### Task 6: Motion — wave reveal, boot intro, marquee

**Files:**
- Create: `src/components/motion/WaveReveal.tsx`
- Create: `src/components/motion/Intro.tsx`
- Create: `src/components/motion/Marquee.tsx`
- Modify: `src/components/editor/Editor.tsx` (mount `Intro` on first load, `Marquee` in content pane footer area)

**Interfaces:**
- Consumes: GSAP + ScrollTrigger (already installed).
- Produces: `WaveReveal({ children, skip? })` wrapping content lines; `Intro()` one-shot boot overlay; `Marquee({ items })`.

- [ ] **Step 1: Create `src/components/motion/WaveReveal.tsx`** (scroll-driven per-line reveal using GSAP ScrollTrigger; honors reduced motion)

```tsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function WaveReveal({ children, skip }: { children: React.ReactNode; skip?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (skip || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.querySelectorAll(".content-row"), {
        opacity: 0, y: 12, stagger: 0.03, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: ref.current, start: "top 92%", toggleActions: "play none none reverse" },
      });
    }, ref);
    return () => ctx.revert();
  }, [skip]);
  return <div ref={ref}>{children}</div>;
}
```

- [ ] **Step 2: Create `src/components/motion/Intro.tsx`**

```tsx
import { useEffect, useState } from "react";

export function Intro() {
  const [hidden, setHidden] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (hidden) return;
    const t = setTimeout(() => setHidden(true), 700);
    return () => clearTimeout(t);
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className="intro-overlay" aria-hidden="true">
      <span className="intro-caret">▌</span>
    </div>
  );
}
```

Add to `src/index.css`:

```css
.intro-overlay { position: fixed; inset: 0; z-index: 100; background: var(--color-mantle); display: grid; place-items: center; transition: opacity .4s ease; }
.intro-caret { color: var(--color-green); font-size: 2rem; animation: blink 1s step-end infinite; }
```

- [ ] **Step 3: Create `src/components/motion/Marquee.tsx`** (CSS `marquee-scroll` keyframe; duplicate the list for a seamless loop; content `project names · tech · tagline`)

```tsx
const items = ["VulnSwarm-VEX", "Adversary Lab", "Crypton", "Eleventh Round", "Acctomatic", "Find the break → build the fix → ship the proof"];

export function Marquee() {
  const row = items.map((t, i) => <span key={i}>{t} <span aria-hidden>·</span> </span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}</div>
    </div>
  );
}
```

- [ ] **Step 4: Add keyframes + marquee CSS to `src/index.css`**

```css
@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.marquee { overflow: hidden; border-top: 1px solid var(--color-overlay0); }
.marquee-track { display: flex; gap: 3ch; white-space: nowrap; width: max-content; animation: marquee-scroll 30s linear infinite; color: var(--color-subtext1); }
@media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
```

- [ ] **Step 5: Wire `Intro` + `Marquee` into `Editor.tsx`** (Intro once on mount; Marquee above the status bar; wrap each page's lines in `WaveReveal` inside `ContentPane` in Task 4 — update `ContentPane` to wrap `HighlightedCode` in `<WaveReveal>`).

- [ ] **Step 6: Verify**

Run: `npm run build`. Playwright: load `/` → observe intro fade; scroll a project page → lines reveal; confirm `prefers-reduced-motion` (via `browser_emulate_media reducedMotion: "reduce"`) shows content immediately.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): wave reveal, boot intro, marquee"
```

---

### Task 7: Achievements drawer + popup links

**Files:**
- Create: `src/components/editor/AchievementsDrawer.tsx`
- Create: `src/components/editor/PopupWindow.tsx`
- Modify: `src/components/editor/Editor.tsx` (mount drawer toggle; render popups)

**Interfaces:**
- Consumes: `projects` (metrics), `CodeLine` link segments.
- Produces: `AchievementsDrawer({ open, onClose })`; `PopupWindow({ href, title, onClose })`.

- [ ] **Step 1: Create `src/components/editor/AchievementsDrawer.tsx`**

```tsx
import { projects } from "../../data/projects";

export function AchievementsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="drawer" role="dialog" aria-label="Achievements">
      <div className="drawer-head">
        <span>achievements</span>
        <button onClick={onClose} aria-label="Close">×</button>
      </div>
      {projects.map((p) => (
        <div key={p.id} className="trophy-card">
          <span className="trophy-metric" style={{ color: "var(--color-pink)" }}>{p.metric}</span>
          <span className="trophy-title" style={{ color: "var(--color-green)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}
```

Add to `src/index.css`:

```css
.drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 40ch; max-width: 90vw; background: var(--color-surface0); border-left: 1px solid var(--color-overlay0); padding: 1ch; overflow-y: auto; z-index: 60; }
.drawer-head { display: flex; justify-content: space-between; color: var(--color-subtext1); margin-bottom: 1ch; }
.trophy-card { padding: .75ch 0; border-top: 1px solid var(--color-overlay0); }
.trophy-metric { display: block; font-size: 1.1rem; }
.trophy-title { display: block; color: var(--color-subtext0); }
```

- [ ] **Step 2: Create `src/components/editor/PopupWindow.tsx`**

```tsx
export function PopupWindow({ href, title, onClose }: { href: string; title: string; onClose: () => void }) {
  const embeddable = !href.startsWith("http") || new URL(href).hostname === location.hostname;
  return (
    <div className="popup" role="dialog" aria-label={title}>
      <div className="popup-titlebar">
        <span>{title}</span>
        <button onClick={onClose} aria-label="Close">×</button>
      </div>
      {embeddable ? (
        <iframe src={href} title={title} />
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="popup-open">open in new tab ↗</a>
      )}
    </div>
  );
}
```

Add to `src/index.css`:

```css
.popup { position: fixed; inset: 10vh 10vw; z-index: 70; display: flex; flex-direction: column; background: var(--color-base); border: 1px solid var(--color-overlay1); box-shadow: 0 20px 60px rgba(0,0,0,.4); }
.popup-titlebar { display: flex; justify-content: space-between; padding: .5ch 1ch; background: var(--color-surface0); color: var(--color-subtext1); }
.popup iframe { flex: 1; border: none; background: #fff; }
.popup-open { padding: 2ch; color: var(--color-skye); }
```

- [ ] **Step 3: Wire both into `Editor.tsx`** — add an "achievements" button in the status bar that opens the drawer; render `PopupWindow` when a link segment is clicked (manage open state at the `Editor` level via context or a simple `useState` in `ContentPane`).

- [ ] **Step 4: Verify**

Run: `npm run build`. Playwright: open drawer → assert metric "91.7%" visible; click a GitHub link → assert popup title bar renders with a "open in new tab" link.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(editor): achievements drawer and popup link windows"
```

---

### Task 8: Security terminal as the `shell` file

**Files:**
- Create: `src/pages/ShellFile.tsx`
- Modify: `src/routes/SecurityPortfolio.tsx` (re-color; re-home; `exit` → `/`)

**Interfaces:**
- Consumes: the existing `SecurityPortfolio` component and its command set.
- Produces: `ShellFile` page matching route `/shell`.

- [ ] **Step 1: Re-color `SecurityPortfolio.tsx`** — replace every hard-coded neon color with meadow tokens: `#00ff41` → `var(--color-green)`, `#ff4d00` → `var(--color-red)`, `#00e5ff` → `var(--color-skye)`, `#888888` → `var(--color-subtext0)`, `#050505` → `var(--color-base)`. Update `lineColor` and `textShadow` accordingly.

- [ ] **Step 2: Change `exit` behavior** — `exit` already calls `navigate('/')`; confirm it now lands on README (it does, since `/` is README). Remove the full-screen `fixed inset-0` wrapper; render inside the editor content pane (`overflow-y-auto` within `.content`), keeping the boot sequence, banner, matrix overlay, and prompt.

- [ ] **Step 3: Create `src/pages/ShellFile.tsx`**

```tsx
import { SecurityPortfolio } from "../routes/SecurityPortfolio";

export default function ShellFile() {
  return <SecurityPortfolio />;
}
```

- [ ] **Step 4: Verify**

Run: `npm run build`. Playwright: navigate to `/shell` → assert banner text and that typing `help` lists commands; run `cat skills.txt` → assert "CORE COMPETENCIES"; run `exit` → assert back at `/` (README visible).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(editor): re-home security terminal as shell file, meadow re-color"
```

---

### Task 9: Theme toggle, font-size, accessibility, cleanup

**Files:**
- Create: `src/components/editor/ThemeToggle.tsx`
- Modify: `src/index.css` (light-theme vars)
- Modify: `src/components/editor/Editor.tsx` (mount toggle; sidebar collapse on mobile)
- Modify: `src/index.html` (title + `<meta name="theme-color">`)

**Interfaces:**
- Consumes: `data-theme` attribute on `<html>`; `dm-theme`/font-size localStorage keys.
- Produces: `ThemeToggle()`.

- [ ] **Step 1: Create `src/components/editor/ThemeToggle.tsx`** — a button cycling dark/light by setting `document.documentElement.dataset.theme` and persisting to `localStorage["dm-theme"]`; a font-size stepper adjusting `document.documentElement.style.fontSize`.

- [ ] **Step 2: Add light-theme CSS vars** — under `[data-theme="light"] { … }`, map the light palette from the spec §3 (crust `#e8ded5`, base `#f5efe6`, text `#2b3034`, etc.). Respect `prefers-color-scheme: light` as the initial default only when no stored theme exists.

- [ ] **Step 3: Wire the toggle into `Editor.tsx`** (status-bar-right) and add the mobile sidebar toggle button (a hamburger that flips `transform` on `.sidebar`; update the `@media` rule from Task 3 to `.sidebar.is-open { transform: none; }`).

- [ ] **Step 4: Final sweep** — grep for remaining `#ff4d00`, `#00ff41`, `#050505`, `#f5f5f5`, `var(--accent)` references outside the terminal and replace with meadow tokens or remove dead code. Confirm no imports reference deleted files.

- [ ] **Step 5: Update `src/index.html`** — `<title>Atharv Mittal — Editor</title>`, `<meta name="theme-color" content="#1c2225">`.

- [ ] **Step 6: Verify full build + smoke**

Run: `npm run build`. Playwright: verify theme toggle flips palette; resize to 375px → sidebar hidden behind toggle; verify `/` and `/shell` deep-link (Review Focus #1/#5).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(editor): theme toggle, font-size, light theme, mobile sidebar, cleanup"
```
