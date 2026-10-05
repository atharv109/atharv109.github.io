// site-terminal.ts — <site-terminal>: the security terminal as a vanilla
// custom element. site shell chrome lives outside; this is the buffer content.
// All command logic is pure (machine.ts); this file renders and wires input.

import { createMachine, complete } from './machine';
import type { TermState, TermLine, TermResult } from './machine';
import { BANNER, BOOT_LINES, pathString } from './fs';
import { runMatrixOverlay } from './matrix';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class SiteTerminal extends HTMLElement {
  private machine = createMachine();
  private state: TermState = { cwd: [], history: [], matrixOn: false };
  private historyNav = -1;
  private buffer!: HTMLElement;
  private input!: HTMLInputElement;
  private promptEl!: HTMLElement;
  private bootTimers: number[] = [];
  private booting = true;

  connectedCallback() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.classList.add('term');
    this.innerHTML = `
      <pre class="term-banner" aria-hidden="true"></pre>
      <div class="term-buffer"></div>
      <div class="term-input-row">
        <span class="term-prompt t-err"></span>
        <input class="term-input" type="text" autocomplete="off" autocapitalize="off"
               spellcheck="false" aria-label="Terminal input" />
        <span class="term-cursor" aria-hidden="true"></span>
      </div>
      <div class="term-hint t-muted">Hint: try \`help\`, \`neofetch\`, or \`cat skills.txt\`</div>
    `;
    this.buffer = this.querySelector('.term-buffer')!;
    this.input = this.querySelector('.term-input')!;
    this.promptEl = this.querySelector('.term-prompt')!;
    (this.querySelector('.term-banner') as HTMLPreElement).textContent = BANNER.join('\n');
    this.updatePrompt();

    const hint = this.querySelector<HTMLElement>('.term-hint')!;
    hint.hidden = true;
    setTimeout(() => {
      if (this.state.history.length === 0) hint.hidden = false;
    }, 12000);

    this.input.addEventListener('keydown', (e) => this.onKey(e));
    this.addEventListener('click', () => this.input.focus());
    this.addEventListener('keydown', () => this.skipBoot(), true);

    if (reduced) {
      this.booting = false;
      BOOT_LINES.forEach((l) => this.line(`[ ${l.text} ${l.status === 'ok' ? 'OK' : 'INFO'} ]`, 'muted'));
    } else {
      this.runBoot();
    }
    setTimeout(() => this.input.focus(), 0);
  }

  disconnectedCallback() {
    this.bootTimers.forEach(clearTimeout);
  }

  private runBoot() {
    let i = 0;
    const step = () => {
      if (!this.booting) return;
      if (i >= BOOT_LINES.length) {
        this.booting = false;
        return;
      }
      const l = BOOT_LINES[i++];
      this.line(`[ ${l.text} ${l.status === 'ok' ? 'OK' : 'INFO'} ]`, 'muted');
      this.bootTimers.push(window.setTimeout(step, 120 + Math.random() * 280));
    };
    step();
  }

  private skipBoot() {
    if (!this.booting) return;
    this.booting = false;
    this.bootTimers.forEach(clearTimeout);
  }

  private updatePrompt() {
    this.promptEl.textContent = `atharv@security:${pathString(this.state.cwd)}$`;
  }

  private line(text: string, tone: TermLine['tone'] = 'out', scramble = false): HTMLElement {
    const div = document.createElement('div');
    div.className = `term-line t-${tone}`;
    this.buffer.appendChild(div);
    if (scramble && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let counter = 0;
      let raf = 0;
      const tick = () => {
        let s = '';
        for (let i = 0; i < text.length; i++) {
          s += i < counter ? text[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        div.textContent = s;
        if (counter >= text.length) return;
        counter += 0.5;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else {
      div.textContent = text;
    }
    return div;
  }

  private renderResult(r: TermResult) {
    if (r.clear) this.buffer.textContent = '';
    if (r.reboot) {
      this.buffer.textContent = '';
      this.state = { cwd: [], history: [], matrixOn: false };
      this.updatePrompt();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.booting = true;
        this.runBoot();
      }
      return;
    }
    if (r.stagger && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.renderEcho(r.lines[0]);
      r.lines.slice(1).forEach((l, i) =>
        setTimeout(() => this.line(l.text, l.tone, l.scramble ?? false), 100 * (i + 1)),
      );
    } else {
      this.renderEcho(r.lines[0]);
      r.lines.slice(1).forEach((l) => this.line(l.text, l.tone, l.scramble ?? false));
    }
    if (r.glitch) {
      this.classList.add('term-glitch');
      setTimeout(() => this.classList.remove('term-glitch'), 180);
    }
    if (r.matrix) runMatrixOverlay(this.ownerDocument.body);
    if (r.trophy) document.dispatchEvent(new CustomEvent('trophy:secret', { detail: { id: 'secret' } }));
    if (r.navigate) setTimeout(() => (location.href = r.navigate!), 900);
    this.updatePrompt();
  }

  private renderEcho(l?: TermLine) {
    if (!l) return;
    this.line(`${this.promptEl.textContent} ${l.text}`, 'sys');
  }

  private onKey(e: KeyboardEvent) {
    this.skipBoot();
    if (e.key === 'Enter') {
      const raw = this.input.value;
      this.input.value = '';
      const r = this.machine.exec(raw, this.state);
      this.state = r.state;
      this.historyNav = -1;
      this.renderResult(r);
      this.scrollBottom();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const c = complete(this.input.value, this.state.cwd);
      if (c.value) this.input.value = c.value;
      else if (c.options) {
        this.line(`${this.promptEl.textContent} ${this.input.value}`, 'sys');
        this.line(c.options.join('  '), 'out');
      }
      this.scrollBottom();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const h = this.state.history;
      if (!h.length) return;
      this.historyNav = this.historyNav === -1 ? h.length - 1 : Math.max(0, this.historyNav - 1);
      this.input.value = h[this.historyNav];
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const h = this.state.history;
      if (this.historyNav === -1) return;
      const next = Math.min(h.length - 1, this.historyNav + 1);
      if (next === this.historyNav) {
        this.historyNav = -1;
        this.input.value = '';
      } else {
        this.historyNav = next;
        this.input.value = h[next];
      }
      return;
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.buffer.textContent = '';
    }
  }

  private scrollBottom() {
    const page = this.closest('.content-lines') ?? this;
    page.scrollTop = page.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  }
}

if (!customElements.get('site-terminal')) {
  customElements.define('site-terminal', SiteTerminal);
}
