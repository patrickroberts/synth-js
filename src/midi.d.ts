export = MIDIStream;
declare class MIDIStream {
    constructor(buffer: ArrayBufferLike);
    data: Uint8Array;
    byteOffset: number;
    lastEventTypeByte: number;
    readString(byteLength: number): string;
    readUint32(): number;
    readUint24(): number;
    readUint16(): number;
    readUint8(): number;
    readInt8(): number;
    readVarUint(): number;
    skip(byteLength: number): void;
    readChunk(): {
        id: string;
        length: number;
        data: ArrayBufferLike;
    };
    readEvent<T extends keyof EventMap, S extends EventMap[T] extends undefined ? never : Exclude<keyof EventMap[T], number | symbol>, V extends S extends keyof EventMap[T] ? "value" extends keyof EventMap[T][S] ? EventMap[T][S][keyof EventMap[T][S] & "value"] : never : never = S extends keyof EventMap[T] ? "value" extends keyof EventMap[T][S] ? EventMap[T][S][keyof EventMap[T][S] & "value"] : never : never, E extends S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {} = S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}>(): Event<T, S, V, E>;
}
declare namespace MIDIStream {
    export { EventMap, MetaEvent, SysExEvent, DividedSysExEvent, UnknownEvent, ChannelEvent, Event };
}
type EventMap = {
    meta: MetaEvent;
    sysEx: SysExEvent;
    dividedSysEx: DividedSysExEvent;
    unknown: UnknownEvent;
    channel: ChannelEvent;
};
type Event<T extends keyof EventMap = keyof EventMap, S extends Exclude<keyof EventMap[T], number | symbol> | undefined = undefined, V extends S extends keyof EventMap[T] ? "value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never : never = S extends keyof EventMap[T] ? "value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never : never, E extends S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {} = S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}> = {
    delta: number;
    subType: S;
    type: T;
    value: any;
} & E;
type MetaEvent = {
    sequenceNumber: {
        value: number;
    };
    text: {
        value: string;
    };
    copyrightNotice: {
        value: string;
    };
    trackName: {
        value: string;
    };
    instrumentName: {
        value: string;
    };
    lyrics: {
        value: string;
    };
    marker: {
        value: string;
    };
    cuePoint: {
        value: string;
    };
    midiChannelPrefix: {
        value: number | undefined;
    };
    endOfTrack: {
        value: undefined;
    };
    setTempo: {
        value: number | undefined;
    };
    smpteOffset: {
        value: {
            frameRate: number;
            hour: number;
            minute: number;
            second: number;
            frame: number;
            subFrame: number;
        } | undefined;
    };
    timeSignature: {
        value: {
            numerator: number;
            denominator: number;
            metronome: number;
            thirtyseconds: number;
        } | undefined;
    };
    keySignature: {
        value: {
            key: number;
            scale: number;
        } | undefined;
    };
    sequencerSpecific: {
        value: number;
    };
    unknown: {
        value: number;
    };
};
type SysExEvent = {
    [x: string]: {
        value: string;
    };
    [x: number]: {
        value: string;
    };
    [x: symbol]: {
        value: string;
    };
};
type DividedSysExEvent = {
    [x: string]: {
        value: string;
    };
    [x: number]: {
        value: string;
    };
    [x: symbol]: {
        value: string;
    };
};
type UnknownEvent = {
    unknown: {
        value: string;
    };
};
type ChannelEvent = {
    noteOff: {
        channel: number;
        value: {
            noteNumber: number;
        };
    };
    noteOn: {
        channel: number;
        value: {
            noteNumber: number;
        };
    };
    noteAftertouch: {
        channel: number;
        value: {
            noteNumber: number;
            amount: number;
        };
    };
    controller: {
        channel: number;
        value: {
            controllerNumber: number;
            controllerValue: number;
        };
    };
    programChange: {
        channel: number;
        value: number;
    };
    channelAftertouch: {
        channel: number;
        value: number;
    };
    pitchBend: {
        channel: number;
        value: number;
    };
    unknown: {
        channel: number;
        value: number;
    };
};
