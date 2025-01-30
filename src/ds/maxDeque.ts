// import assert from 'assert';

class MaxDeque {
  private values: number[] = [];
  private counters: number[] = [];
  private bufferSize: number;

  constructor(bufferSize: number) {
    this.bufferSize = bufferSize;
  }

  public push(value: number): void {
    // assert(this.counters.length === this.values.length);
    // assert(this.counters.length <= this.bufferSize);

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.counters.length; i++) {
      // assert(this.counters[i] < this.bufferSize);
      this.counters[i]!++;
    }

    if (this.counters.length > 0 && this.counters[0]! >= this.bufferSize) {
      this.values.shift();
      this.counters.shift();
    }

    while (this.values.length > 0 && this.values.at(-1)! <= value) {
      this.values.pop();
      this.counters.pop();
    }

    this.values.push(value);
    this.counters.push(0);
  }

  public get max(): number | undefined {
    return this.values[0];
  }
}

export default MaxDeque;
