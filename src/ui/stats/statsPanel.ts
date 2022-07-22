import assert from 'assert';

const PR = Math.round(window.devicePixelRatio || 1);

const CSS_WIDTH = 80;
const CSS_HEIGHT = 48;

const WIDTH = CSS_WIDTH * PR;
const HEIGHT = CSS_HEIGHT * PR;

const CSS_GRAPH_WIDTH = 74;
const CSS_GRAPH_HEIGHT = 30;

const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = CSS_GRAPH_WIDTH * PR;
const GRAPH_HEIGHT = CSS_GRAPH_HEIGHT * PR;

// when rescaling panel values, this should be at least 1
const RESCALE_ADD_EXTRA = 2;

const BG_ALPHA = .9;

class StatsPanel {
  private _canvas: HTMLCanvasElement;
  private _context: CanvasRenderingContext2D;
  private _title: string;
  private _fgCol: string;
  private _bgCol: string;
  private _values: number[]; // as a circular array store last N values
  private _start: number; // starting index in values[0..length-1]
  private _min = Infinity;
  private _max = 0;
	private _redrawThreshold: number; // inv: value <= this._redrawThreshold
  private _curIdx: number; // cur update index, inc at every update
  private _maxDeque: number[]; // deque values to impl max of last N values
  private _maxDequeIdx: number[]; // deque idxs to impl max of last N values

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
    this.drawGraphBg();

    // alloc mem for panel values and the threshold for scaling heights
    this._values = new Array(CSS_GRAPH_WIDTH).fill(0);
    this._start = 0;
    this._redrawThreshold = 0; // default start height
    this._curIdx = 0;
    this._maxDeque = [];
    this._maxDequeIdx = [];
    // console.log('threshold: ' + this._redrawThreshold);
  }

  get title(): string {
    return this._title;
  }

  get dom(): HTMLCanvasElement {
    return this._canvas;
  }

  private drawGraphBg(): void {
    this._context.fillStyle = this._fgCol;
    this._context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = BG_ALPHA;
    this._context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
  }

  private updateMaxDeque(value: number): void {
    const deque = this._maxDeque;
    const dequeIdx = this._maxDequeIdx;
    while (dequeIdx.length && dequeIdx[0] < this._curIdx - CSS_GRAPH_WIDTH) {
      deque.shift();
      dequeIdx.shift();
    }
    while (deque.length && deque[deque.length-1] <= value) {
      deque.pop();
      dequeIdx.pop();
    }
    deque.push(value);
    dequeIdx.push(this._curIdx);
  }

  private downRescale(): boolean {
    const bound = this._redrawThreshold - (1 + RESCALE_ADD_EXTRA) * CSS_GRAPH_HEIGHT;
    const res = this._maxDeque[0] < bound;
    return res;
  }

  update(value = 0) {

    this._min = Math.min(this._min, value);
    this._max = Math.max(this._max, value);

    // draw the text background
    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = 1;
    this._context.fillRect(0, 0, WIDTH, GRAPH_Y);

    // draw the text
    const text =
      Math.round(value) +
        ' ' +
        this.title +
        ' (' +
        Math.round(this._min) +
        '-' +
        Math.round(this._max) +
        ')';

    this._context.fillStyle = this._fgCol;
    this._context.fillText(text,
      TEXT_X,
      TEXT_Y,
      // GRAPH_WIDTH
    );

    this.updateMaxDeque(value);

    let downscale = false;
    if (value > this._redrawThreshold || (downscale=this.downRescale())) { // rescale required
      const source = downscale ? this._maxDeque[0] : value;
      const factor = (source / CSS_GRAPH_HEIGHT) | 0;
      const newThreshold = CSS_GRAPH_HEIGHT * (factor + 1 + RESCALE_ADD_EXTRA);
      assert(newThreshold >= source);
      this._redrawThreshold = newThreshold;
      // console.log('RESCALE TO ' + newThreshold);

      this.drawGraphBg();

      // draw the values rescaled
      this._context.fillStyle = this._fgCol;
      this._context.globalAlpha = 1;
      for (
        let i = 0, { length } = this._values;
        i < length;
        ++i
      ) {
        const idx = i + this._start;
        const cur = idx < length ? idx : idx - length;
        const curVal = this._values[cur];
        const h = Math.round(
          (curVal / this._redrawThreshold) * GRAPH_HEIGHT,
        );
        this._context.fillRect(
          GRAPH_X + PR * i,
          GRAPH_Y + GRAPH_HEIGHT - h,
          PR,
          h,
        );
      }
    }

    this._values[this._start] = value;
    this._start++;
    if (this._start >= this._values.length) {
      this._start = 0;
    }

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
    // this._context.globalAlpha = 1; // already set above
    this._context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      GRAPH_HEIGHT,
    );

    // then draw the upper part with the bg color
    const hUpper = Math.round(
      (1 - value / this._redrawThreshold) * GRAPH_HEIGHT,
    );
    // console.log('Last col: ' + (1 - value / this._redrawThreshold));
    this._context.fillStyle = this._bgCol;
    this._context.globalAlpha = BG_ALPHA;
    this._context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, hUpper);

    this._curIdx++;
  }
}

export { StatsPanel };
