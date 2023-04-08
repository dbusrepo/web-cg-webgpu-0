import assert from 'assert';

const PR = Math.round(window.devicePixelRatio || 1); // #pixels per col

// const CSS_WIDTH = 80 * 5;
// const CSS_HEIGHT = 48 * 5;
const CSS_WIDTH = 80 * 1.3;
const CSS_HEIGHT = 48 * 1.3;

const WIDTH = 80 * PR;
const HEIGHT = 48 * PR;
const CSS_GRAPH_WIDTH = 74;
// const CSS_GRAPH_WIDTH = 15; // for test
const CSS_GRAPH_HEIGHT = 30;

const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = CSS_GRAPH_WIDTH * PR;
const GRAPH_HEIGHT = CSS_GRAPH_HEIGHT * PR;

const BG_ALPHA = 0.9;

class StatsPanel {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _title: string;
  private _fgCol: string;
  private _bgCol: string;
  private _values: number[]; // as a circular array store last N values
  private _nextIdx: number; // next value index
  private _min = Infinity;
  private _max = 0;
  private _heightScaleFactor: number;
  private _heightRescaleThreshold: number;
  private _curIdx: number; // cur update index, inc at every update
  private _maxDeque: number[]; // deque values to impl max of last N values
  private _maxDequeIdx: number[]; // deque indices
  private _first: boolean;

  constructor(title: string, fg: string, bg: string) {
    this._canvas = document.createElement('canvas');
    this._canvas.width = WIDTH;
    this._canvas.height = HEIGHT;
    this._canvas.style.width = `${CSS_WIDTH}px`;
    this._canvas.style.height = `${CSS_HEIGHT}px`;
    this._title = title;
    this._fgCol = fg;
    this._bgCol = bg;

    const context = this._canvas.getContext('2d');
    assert(context);
    this._context = context;
    this._context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
    this._context.textBaseline = 'top';

    // draw the entire canvas background
    this._context.fillStyle = bg;
    this._context.fillRect(0, 0, WIDTH, HEIGHT);

    // draw the title
    this._context.fillStyle = fg;
    this._context.fillText(title, TEXT_X, TEXT_Y);

    // draw the graph area
    this.drawGraphBackground();

    // alloc mem for panel values and the threshold for scaling heights
    this._values = new Array(CSS_GRAPH_WIDTH).fill(0);
    this._heightScaleFactor = 0; // normalization factor to scale value to col heights in pixels
    this._heightRescaleThreshold = 0;
    this._nextIdx = 0;
    this._curIdx = 0;
    this._maxDeque = [];
    this._maxDequeIdx = [];
    this._first = true;
  }

  get title(): string {
    return this._title;
  }

  get dom(): HTMLCanvasElement {
    return this._canvas;
  }

  private drawGraphBackground(): void {
    this._context.fillStyle = this._fgCol;
    this._context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = BG_ALPHA;
    this._context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
  }

  private downScaleBound(): number {
    return ((this._heightRescaleThreshold / 3) * 2) / 3;
  }

  private checkDownRescale(): boolean {
    // downscale if max value is less than 2/3 of the first third of the graph height
    const res = this._maxDeque[0] < this.downScaleBound();
    return res;
  }

  // bound max value to 2/3 of the graph height, so up rescale when a new value
  // is greater than 2/3 of the graph height
  // down rescale when max value is less than 2/3 of the first third of the graph height
  // and map the 2/3 of the first third of the graph height to 2/3 of the graph height
  private recalcRedrawThreshold(source: number): void {
    // const factor = (source / CSS_GRAPH_HEIGHT) | 0;
    // const RESCALE_FACTOR = 2;
    // this._redrawThreshold = CSS_GRAPH_HEIGHT * (factor + RESCALE_FACTOR);
    assert(source >= 0);
    if (this._first) {
      // if first rescale, draw value at half of the graph height
      this._heightScaleFactor = source * 2;
      this._first = false;
    } else {
      this._heightScaleFactor = (source * 3) / 2; // bound scaled values to 2/3 of the graph height
    }
    // rescale factor to 2/3 of _heightScaleFactor
    this._heightRescaleThreshold = (this._heightScaleFactor * 2) / 3;
    assert(this._heightScaleFactor >= source);
  }

  update(value = 0) {
    this._min = Math.min(this._min, value);
    this._max = Math.max(this._max, value);

    // draw the text background
    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = 1;
    this._context.fillRect(0, 0, WIDTH, GRAPH_Y);

    // draw the text
    const text = Math.round(value) + ' ' + this.title;
    // + ' ('
    // + // Math.round(this._min)
    // + // '-'
    // + Math.round(this._max)
    // + ')';

    this._context.fillStyle = this._fgCol;
    this._context.fillText(
      text,
      TEXT_X,
      TEXT_Y,
      // GRAPH_WIDTH
    );

    this.updateMaxDeque(value);

    let downScale = false;
    if (
      value > this._heightRescaleThreshold ||
      (downScale = this.checkDownRescale())
    ) {
      do {
        const source = downScale ? this.downScaleBound() : value;
        this.recalcRedrawThreshold(source);
      } while (downScale && (downScale = this.checkDownRescale()));

      this.drawGraphBackground();

      // redraw scaled values
      this._context.fillStyle = this._fgCol;
      this._context.globalAlpha = 1;
      for (let i = 0, { length } = this._values; i < length; ++i) {
        const idx = i + this._nextIdx;
        const cur = idx < length ? idx : idx - length;
        const curVal = this._values[cur];
        const h = Math.round((curVal / this._heightScaleFactor) * GRAPH_HEIGHT);
        this._context.fillRect(
          GRAPH_X + PR * i,
          GRAPH_Y + GRAPH_HEIGHT - h,
          PR,
          h,
        );
      }
    }

    this._values[this._nextIdx++] = value;
    this._nextIdx %= this._values.length;

    // draw the current graph shifted left one col (PR)
    this._context.globalAlpha = 1;
    this._context.drawImage(
      this._canvas,
      GRAPH_X + PR,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
    );

    /* DRAW THE LAST COL (value): two steps: full col with fg col + upper part with bg col */

    // draw the last (new) col: first draw the entire col with the fg background
    this._context.fillStyle = this._fgCol;
    this._context.globalAlpha = 1;
    this._context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      GRAPH_HEIGHT,
    );

    // then draw the upper part with the bg color
    const hUpper = Math.round(
      (1 - value / this._heightScaleFactor) * GRAPH_HEIGHT,
    );
    // console.log('Last col: ' + (1 - value / this._redrawThreshold));
    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = BG_ALPHA;
    this._context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, hUpper);

    this._curIdx++;
  }

  private updateMaxDeque(value: number): void {
    const deque = this._maxDeque;
    const dequeIdx = this._maxDequeIdx;
    while (dequeIdx.length && dequeIdx[0] < this._curIdx - CSS_GRAPH_WIDTH) {
      deque.shift();
      dequeIdx.shift();
    }
    while (deque.length && deque[deque.length - 1] <= value) {
      deque.pop();
      dequeIdx.pop();
    }
    deque.push(value);
    dequeIdx.push(this._curIdx);
  }
}

export { StatsPanel };
