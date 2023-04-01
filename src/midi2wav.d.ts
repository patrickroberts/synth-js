declare function _exports<T extends keyof MIDIStream.EventMap, S extends MIDIStream.EventMap[T] extends undefined ? never : Exclude<keyof MIDIStream.EventMap[T], number | symbol>, V extends S extends keyof MIDIStream.EventMap[T] ? "value" extends keyof MIDIStream.EventMap[T][S] ? MIDIStream.EventMap[T][S]["value"] : never : never = S extends keyof MIDIStream.EventMap[T] ? "value" extends keyof MIDIStream.EventMap[T][S] ? MIDIStream.EventMap[T][S]["value"] : never : never, E extends S extends keyof MIDIStream.EventMap[T] ? Omit<MIDIStream.EventMap[T][S], "value"> : {} = S extends keyof MIDIStream.EventMap[T] ? Omit<MIDIStream.EventMap[T][S], "value"> : {}>(buffer: ArrayBufferLike, args?: {
    verbose?: boolean | undefined;
    Skip?: {
        [subType: string]: string;
    }[] | ((track: MIDIStream.Event<T, S, V, E>[]) => boolean) | undefined;
    channels?: number | undefined;
    sampleRate?: number | undefined;
    bitsPerSample?: number | undefined;
    duration?: number | undefined;
}): WAV | null;
export = _exports;
import MIDIStream = require("./midi");
import WAV = require("./wav");
