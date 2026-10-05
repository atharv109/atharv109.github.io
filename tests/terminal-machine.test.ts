import { describe, it, expect } from 'vitest';
import { createMachine } from '../src/scripts/terminal/machine';
import type { TermState } from '../src/scripts/terminal/machine';

const s0 = (): TermState => ({ cwd: [], history: [], matrixOn: false });

describe('terminal machine', () => {
  it('empty input echoes a prompt line with no output', () => {
    expect(createMachine().exec('', s0()).lines).toEqual([]);
  });
  it('unknown command → "command not found" error line', () => {
    const r = createMachine().exec('florp', s0());
    expect(r.lines.some((l) => l.text.includes('not found') && l.tone === 'err')).toBe(true);
  });
  it('cd missing dir → error, cwd unchanged', () => {
    const st = s0();
    const r = createMachine().exec('cd nowhere', st);
    expect(r.lines[1].tone).toBe('err'); // lines[0] is the prompt echo
    expect(r.state.cwd).toEqual([]);
  });
  it('cd .. at root stays at root', () => {
    expect(createMachine().exec('cd ..', s0()).state.cwd).toEqual([]);
  });
  it('cd projects then pwd shows ~/projects', () => {
    const m = createMachine();
    const moved = m.exec('cd projects', s0());
    expect(moved.state.cwd).toEqual(['projects']);
    expect(m.exec('pwd', moved.state).lines[1].text).toBe('~/projects');
  });
  it('cat directory → "is a directory" error', () => {
    const r = createMachine().exec('cat projects', s0());
    expect(r.lines.some((l) => /directory/i.test(l.text) && l.tone === 'err')).toBe(true);
  });
  it('clear sets clear flag', () => {
    expect(createMachine().exec('clear', s0()).clear).toBe(true);
  });
  it('exit → navigate "/"', () => {
    expect(createMachine().exec('exit', s0()).navigate).toBe('/');
  });
  it('secret flags the trophy hook on the result', () => {
    expect(createMachine().exec('secret', s0()).trophy).toBe('secret');
  });
  it('200-char input line handled without throw', () => {
    expect(() => createMachine().exec('x'.repeat(200), s0())).not.toThrow();
  });
  it('history records commands', () => {
    const m = createMachine();
    const a = m.exec('ls', s0());
    const b = m.exec('pwd', a.state);
    expect(b.state.history).toEqual(['ls', 'pwd']);
  });
  it('run non-executable file → permission denied', () => {
    const r = createMachine().exec('run skills.txt', s0());
    expect(r.lines.some((l) => /permission denied/i.test(l.text))).toBe(true);
  });
  it('run contact.sh succeeds with executable output', () => {
    const r = createMachine().exec('run contact.sh', s0());
    expect(r.lines.some((l) => l.text.includes('atharvm2005@gmail.com'))).toBe(true);
  });
});
