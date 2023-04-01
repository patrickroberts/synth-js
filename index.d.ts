export const WAV: typeof import("./src/wav");
export const MIDIStream: typeof import("./src/midi");
export const midiToWav: <T extends keyof import("./src/midi").EventMap, S extends import("./src/midi").EventMap[T] extends undefined ? never : Exclude<keyof import("./src/midi").EventMap[T], number | symbol>, V extends S extends keyof import("./src/midi").EventMap[T] ? "value" extends keyof import("./src/midi").EventMap[T][S] ? import("./src/midi").EventMap[T][S]["value"] : never : never = S extends keyof import("./src/midi").EventMap[T] ? "value" extends keyof import("./src/midi").EventMap[T][S] ? import("./src/midi").EventMap[T][S]["value"] : never : never, E extends S extends keyof import("./src/midi").EventMap[T] ? Omit<import("./src/midi").EventMap[T][S], "value"> : {} = S extends keyof import("./src/midi").EventMap[T] ? Omit<import("./src/midi").EventMap[T][S], "value"> : {}>(buffer: ArrayBufferLike, args?: {
    verbose?: boolean | undefined;
    Skip?: {
        [subType: string]: string;
    }[] | ((track: import("./src/midi").Event<T, S, V, E>[]) => boolean) | undefined;
    channels?: number | undefined;
    sampleRate?: number | undefined;
    bitsPerSample?: number | undefined;
    duration?: number | undefined;
}) => import("./src/wav") | null;
