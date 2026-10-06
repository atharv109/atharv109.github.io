// story-block.ts — <story-block data-story="slug">: the presentation player.
// In-buffer 20-line ASCII grid + legend chip + caption + progress dots.
// Autoplay waits for BOTH the arrival wave to clear (T6 contract: don't play
// under wave-pending) and the block entering the viewport; ←/→ scrub beats,
// Space pauses/plays, R replays. Reduced motion: one static final frame,
// no autoplay — still keyboard-scrub-able. Playback runs at 0.7× — beat
// pacing is tuned for reading, not realtime.
import { AsciiRenderer } from './ascii/renderer';
import { makeStory } from './ascii/story';
import type { StoryBeat } from './ascii/story';

type StoryFactory = () => { beats: StoryBeat[]; layman?: string };

const PLAYBACK_SPEED = 0.7;

const FILES = import.meta.glob<StoryFactory>('./stories/*.ts');

const GRID_ROWS = 20; // buffer lines snapped (20 × 19px)

class StoryBlock extends HTMLElement {
  private story: Story | null = null;
  private captionEl: HTMLElement | null = null;
  private dotsEl: HTMLElement | null = null;
  private chipEl: HTMLButtonElement | null = null;
  private started = false;
  private waveCleared = false;

  connectedCallback(): void {
    if (this.dataset.built) return;
    this.dataset.built = '1';
    const slug = this.getAttribute('data-story') ?? '';
    const loader = FILES[`./stories/${slug}.ts`];
    if (!slug || !loader) return;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'fb-title story-chip';
    const grid = document.createElement('div');
    grid.className = 'story-grid';
    grid.style.minHeight = `calc(${GRID_ROWS} * var(--line-height))`;
    const caption = document.createElement('p');
    caption.className = 'story-caption';
    const plain = document.createElement('p');
    plain.className = 'story-plain'; // text set in the loader (data.layman)
    const dots = document.createElement('p');
    dots.className = 'story-progress';
    dots.setAttribute('aria-hidden', 'true');
    this.append(chip, grid, caption, plain, dots);
    this.chipEl = chip;
    this.captionEl = caption;
    this.dotsEl = dots;
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', 'Story beats — left and right arrows scrub, Space pauses, R replays');
    this.addEventListener('keydown', (e) => this.onKey(e));

    loader().then((mod) => {
      const data = mod.default();
      const story: Story = makeStory(data.beats, { speed: PLAYBACK_SPEED });
      // The layman one-liner lives under the video (static, always visible).
      if (data.layman) plain.textContent = data.layman;
      else plain.remove();
      // Assign BEFORE registering: onBeatChange/onStateChange fire
      // synchronously at registration (engine immediate-init), and both sync
      // hooks bail while this.story is still null if it is assigned later.
      this.story = story;
      // seek() fires state mid-seek (paused, beat not yet advanced) and the
      // beat change only afterwards — the chip must re-render on BOTH.
      story.onBeatChange((i) => {
        this.syncUi(i);
        this.syncChip();
      });
      story.onStateChange(() => this.syncChip());

      // Reduced motion: park at the final beat, one static frame, no autoplay.
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        story.seekToBeat(story.beats.length - 1);
        story.pause();
        new AsciiRenderer(grid, story).start({});
        this.started = true;
        return;
      }

      // Autoplay after wave clear + viewport entry.
      if (!htmlClass().classList.contains('wave-pending')) this.waveCleared = true;
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            this.arm();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(this);
    });
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.story) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright') this.story.seekToBeat(this.story.beatIndex + 1);
    else if (k === 'arrowleft') this.story.seekToBeat(this.story.beatIndex - 1);
    else if (k === ' ' || e.code === 'Space') this.story.toggle();
    else if (k === 'r') this.story.replay();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  private arm(): void {
    if (this.started) return;
    const html = htmlClass();
    if (!this.waveCleared) {
      // poll for the arrival wave to clear (T6 contract); flag the clear so
      // the re-entrant arm() takes its start path instead of polling again.
      const poll = () =>
        html.classList.contains('wave-pending')
          ? requestAnimationFrame(poll)
          : ((this.waveCleared = true), this.arm());
      requestAnimationFrame(poll);
      return;
    }
    this.started = true;
    const grid = this.querySelector<HTMLElement>('.story-grid');
    if (grid && this.story) new AsciiRenderer(grid, this.story).start({});
  }

  private syncChip(): void {
    const story = this.story;
    const chip = this.chipEl;
    if (!story || !chip) return;
    const n = story.beats.length;
    const i = Math.min(n - 1, story.beatIndex);
    const state = story.finished ? 'replay' : story.playing ? 'pause' : 'play';
    chip.textContent = `story · ${story.beats[i]?.label ?? ''} — beat ${i + 1}/${n} [${state}]`;
    chip.setAttribute('aria-expanded', String(story.playing));
  }

  private syncUi(i: number): void {
    const story = this.story;
    if (!story) return;
    const b = story.beats[i];
    if (this.captionEl && b) this.captionEl.textContent = b.caption;
    if (this.dotsEl) {
      this.dotsEl.textContent =
        story.beats.map((_, k) => (k === i ? '•' : '·')).join(' ') + `  ${i + 1}/${story.beats.length}`;
    }
  }
}

function htmlClass(): Document['documentElement'] {
  return document.documentElement;
}

if (typeof customElements !== 'undefined' && !customElements.get('story-block')) {
  customElements.define('story-block', StoryBlock);
}