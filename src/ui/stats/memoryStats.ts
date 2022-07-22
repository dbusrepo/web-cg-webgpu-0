import { Stats } from './stats';
import { MemoryStatsPanel } from './memoryStatsPanel';

// required to avoid ts type error with Performance
declare global {
  interface Performance {
    memory: any; // eslint-disable-line
    measureUserAgentSpecificMemory: any;
  }
}


class MemoryStats {
  private _stats: Stats;
  private _panel: MemoryStatsPanel;

  constructor(stats: Stats) {
    if (!performance.measureUserAgentSpecificMemory) {
      console.log('performance.measureUserAgentSpecificMemory is not available.');
      return; // TODO ?
    }
    this._stats = stats;
    this._panel = new MemoryStatsPanel();
    this._stats.addPanel(this._panel);
    this.scheduleMeasurement();
  }

  // Starts statistical sampling of the memory usage.
  private scheduleMeasurement() {
    let interval = this.measurementInterval();
    // console.log('Scheduling memory measurement in ' +
    //     `${Math.round(interval / 1000)} seconds.`);
    setTimeout(this.performMeasurement.bind(this), interval);
  }

  private async performMeasurement() {
    let result;
    try {
      result = await performance.measureUserAgentSpecificMemory();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.log('The context is not secure. Memory monitor not allowed');
        return;
      }
      throw error;
    }
    // 2. Record the result.
    // console.log(`Memory usage: ${result.bytes} bytes`);
    // console.log('Memory breakdown: ', result.breakdown);
    this._panel.update(result.bytes);
    // 3. Schedule the next measurement.
    this.scheduleMeasurement();
  };

  // Returns a random interval in milliseconds that is
  // sampled with a Poisson process. It ensures that on
  // average there is one measurement every ....
  private measurementInterval(): number {
    const MEAN_INTERVAL_IN_MS = 1000; //5 * 60 * 1000;
    return -Math.log(Math.random()) * MEAN_INTERVAL_IN_MS;
  }
}

export { MemoryStats };
