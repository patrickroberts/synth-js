export = Timer;
declare class Timer {
    constructor(ticksPerBeat: number);
    ticksPerBeat: number;
    criticalPoints: {
        delta: number;
        microsecondsPerBeat: number;
    }[];
    addCriticalPoint(delta: number, microsecondsPerBeat: number): void;
    getTime(delta: number): number;
}
