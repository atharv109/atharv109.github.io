// pdf-pages.ts — <pdf-pages data-src="...">: renders a PDF file's pages as
// canvases with pdf.js (cdnjs, the allowed CDN) — NO viewer chrome: no
// toolbar, no thumbnails, no page widgets; just the pages, stacked, in the
// site's own framing (1px outline, page caption line under each, buffer-style
// numerals). Pages render lazily as they scroll into view at device-pixel
// ratio ×2 scale so text stays crisp. Reduced motion is irrelevant (static
// renders). Failure path: a load error prints one error line inside the
// frame, and the download chip above the element remains usable.

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.min.mjs';

interface PdfDocumentLike {
  numPages: number;
  getPage(n: number): Promise<PdfPageLike>;
}

interface PdfPageLike {
  getViewport(opts: { scale: number }): { width: number; height: number };
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void> };
}

interface PdfJs {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(opts: { url: string }): { promise: Promise<PdfDocumentLike> };
}

const RENDER_SCALE = 2; // device pixels per CSS pixel of page width

class PdfPages extends HTMLElement {
  connectedCallback(): void {
    if (this.dataset.built) return;
    this.dataset.built = '1';
    const src = this.getAttribute('data-src') ?? '';
    if (!src) return;
    this.render(src).catch((er) => {
      this.dataset.built = '';
      const line = document.createElement('p');
      line.className = 'pdf-caption';
      line.textContent = `pdf failed to load here — use the download chip above (${er instanceof Error ? er.message : String(er)})`;
      this.append(line);
      void line;
    });
  }

  private async render(src: string): Promise<void> {
    const lib = (await import(/* @vite-ignore */ PDFJS)) as unknown as {
      default?: PdfJs;
    } & PdfJs;
    const pdfjs: PdfJs = lib.default ?? (lib as unknown as PdfJs);
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.4.299/pdf.worker.min.mjs';
    // pdf.js ≥4 takes a param object, not a bare url string.
    const doc = await pdfjs.getDocument({ url: src }).promise;

    this.classList.add('pdf-pages');
    // The page rail: a scrollbar-like column on the PDF's right edge, one
    // segment per page, the visible page filled (the thumb); click jumps.
    const body = document.createElement('div');
    body.className = 'pdf-body';
    const rail = document.createElement('nav');
    rail.className = 'pdf-rail';
    rail.setAttribute('aria-label', 'PDF pages');
    this.append(body, rail);
    const thumbs: HTMLButtonElement[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const frame = document.createElement('div');
      frame.className = 'pdf-page-frame';
      frame.style.minHeight = 'calc(30 * var(--line-height))'; // reserved row space
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.setAttribute('aria-label', `Resume page ${n} of ${doc.numPages}`);
      frame.append(canvas);
      body.append(frame);
      // Rail thumb per page — the active one fills like a scrollbar thumb.
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'pdf-thumb';
      thumb.textContent = `${doc.numPages > 1 ? n : ''}`;
      thumb.setAttribute('aria-label', `Go to page ${n} of ${doc.numPages}`);
      thumb.addEventListener('click', () =>
        frame.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
      rail.append(thumb);
      thumbs.push(thumb);
      // Lazy: paint + highlight the rail thumb when the frame is about to be
      // seen.
      const paint = (): Promise<void> => this.paint(doc, n, canvas);
      const activate = () => {
        thumbs.forEach((t, k) => t.classList.toggle('is-active', k === n - 1));
      };
      if (n === 1) {
        await paint(); // page 1 paints immediately (it is the ask)
        activate();
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              io.disconnect();
              activate();
              void paint();
            }
          },
          { rootMargin: '200px' },
        );
        io.observe(frame);
      }
    }
  }

  /** Render page n into the canvas at exactly the frame's CSS width and
      DPR*2 resolution; the canvas element scales down (width:100% CSS). */
  private async paint(doc: PdfDocumentLike, n: number, canvas: HTMLCanvasElement): Promise<void> {
    const page = await doc.getPage(n);
    const cssW = this.clientWidth || 700;
    const scale = (cssW / 612) * RENDER_SCALE; // 612pt ≈ US-letter default
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    // Frame height now tracks the painted page (aspect-correct, no reserved gap).
    frameFrom(canvas).style.minHeight = 'unset';
  }
}

function frameFrom(canvas: HTMLCanvasElement): HTMLElement {
  return canvas.closest<HTMLElement>('.pdf-page-frame')!;
}

if (typeof customElements !== 'undefined' && !customElements.get('pdf-pages')) {
  customElements.define('pdf-pages', PdfPages);
}