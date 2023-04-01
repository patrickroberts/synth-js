'use strict';

/**
 * utility class to calculate time from delta ticks
 * when MIDI file has several `setTempo` events
 */
class Timer {
  /**
   * @param {number} ticksPerBeat
   */
  constructor(ticksPerBeat) {
    this.ticksPerBeat = ticksPerBeat;
    /** @type {Array<{ delta: number; microsecondsPerBeat: number; }>} */
    this.criticalPoints = [];
  }

  /**
   * delta represents ticks since last time change
   * @param {number} delta
   * @param {number} microsecondsPerBeat
   */
  addCriticalPoint(delta, microsecondsPerBeat) {
    this.criticalPoints.push({
      delta,
      microsecondsPerBeat
    });
  }

  /**
   * @param {number} delta
   */
  getTime(delta) {
    const microsecondsPerSecond = 1000000;
    let time = 0;
    // midi standard initializes file with this value
    let microsecondsPerBeat = 500000;

    // iterate through time changes while decrementing delta ticks to 0
    for (let i = 0, criticalPoint; i < this.criticalPoints.length && delta > 0; i++) {
      criticalPoint = this.criticalPoints[i];

      // incrementally calculate the time passed for each range of timing
      if (delta >= criticalPoint.delta) {
        time += criticalPoint.delta * microsecondsPerBeat / this.ticksPerBeat / microsecondsPerSecond;
        delta -= criticalPoint.delta;
      } else {
        time += delta * microsecondsPerBeat / this.ticksPerBeat / microsecondsPerSecond;
        delta = 0;
      }

      microsecondsPerBeat = criticalPoint.microsecondsPerBeat;
    }

    time += delta * microsecondsPerBeat / this.ticksPerBeat / microsecondsPerSecond;

    return time;
  }
};

module.exports = Timer;
