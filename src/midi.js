'use strict';

class MIDIStream {
  /**
   * @param {ArrayBufferLike} buffer
   */
  constructor(buffer) {
    this.data = new Uint8Array(buffer);
    this.byteOffset = 0;
    this.lastEventTypeByte = 0x00;
  }

  /**
   * @param {number} byteLength
   * @returns {string}
   */
  readString(byteLength) {
    const byteOffset = this.byteOffset;
    let str = '';

    for (let i = 0; i < byteLength; i++) {
      str += String.fromCharCode(this.data[byteOffset + i]);
    }

    this.byteOffset += byteLength;

    return str;
  }

  readUint32() {
    const byteOffset = this.byteOffset;
    const value = (
      (this.data[byteOffset    ] << 24) |
      (this.data[byteOffset + 1] << 16) |
      (this.data[byteOffset + 2] <<  8) |
      (this.data[byteOffset + 3]      )
    );

    this.byteOffset += 4;

    return value;
  }

  readUint24() {
    const byteOffset = this.byteOffset;
    const value = (
      (this.data[byteOffset    ] << 16) |
      (this.data[byteOffset + 1] <<  8) |
      (this.data[byteOffset + 2]      )
    );

    this.byteOffset += 3;

    return value;
  }

  readUint16() {
    const byteOffset = this.byteOffset;
    const value = (
      (this.data[byteOffset    ] << 8) |
      (this.data[byteOffset + 1]     )
    );

    this.byteOffset += 2;

    return value;
  }

  readUint8() {
    const byteOffset = this.byteOffset;
    const value = this.data[byteOffset];

    this.byteOffset += 1;

    return value;
  }

  readInt8() {
    const byteOffset = this.byteOffset;
    let value = this.data[byteOffset];

    if ((value & 0x80) === 0x80) {
      value ^= 0xFFFFFF00;
    }

    this.byteOffset += 1;

    return value;
  }

  readVarUint() {
    let value = 0;
    let uint8;

    do {
      uint8 = this.readUint8();
      value = (value << 7) + (uint8 & 0x7F);
    } while ((uint8 & 0x80) === 0x80);

    return value;
  }

  /**
   * @param {number} byteLength
   */
  skip(byteLength) {
    this.byteOffset += byteLength;
  }

  readChunk() {
    const id = this.readString(4);
    const length = this.readUint32();
    const byteOffset = this.byteOffset;

    this.byteOffset += length;

    const data = this.data.slice(byteOffset, this.byteOffset);

    return {
      id: id,
      length: length,
      data: data.buffer
    };
  }

  /**
   * @template {keyof EventMap} T
   * @template {EventMap[T] extends undefined ? never : Exclude<keyof EventMap[T], number | symbol>} S
   * @template {S extends keyof EventMap[T] ? ("value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never) : never} [V=S extends keyof EventMap[T] ? ("value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never) : never]
   * @template {S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}} [E = S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}]
   * @returns {Event<T, S, V, E>}
   */
  readEvent() {
    /** @type {Event<T, S, V, E>} */
    const event = {};

    event.delta = this.readVarUint();

    let eventTypeByte = this.readUint8();

    // system event
    if ((eventTypeByte & 0xF0) === 0xF0) {
      switch (eventTypeByte) {
      // meta event
      case 0xFF:
        /** @type {Event<"meta", keyof MetaEvent, any, {}>} */
        // @ts-expect-error
        const meta = event
        meta.type = "meta";

        const subTypeByte = this.readUint8();
        let length = this.readVarUint();

        switch (subTypeByte) {
        case 0x00:
          meta.subType = 'sequenceNumber';
          if (length === 2)
            event.value = this.readUint16();
          else
            this.skip(length);
          break;
        case 0x01:
          meta.subType = 'text';
          event.value = this.readString(length);
          break;
        case 0x02:
          meta.subType = 'copyrightNotice';
          event.value = this.readString(length);
          break;
        case 0x03:
          meta.subType = 'trackName';
          event.value = this.readString(length);
          break;
        case 0x04:
          meta.subType = 'instrumentName';
          event.value = this.readString(length);
          break;
        case 0x05:
          meta.subType = 'lyrics';
          event.value = this.readString(length);
          break;
        case 0x06:
          meta.subType = 'marker';
          event.value = this.readString(length);
          break;
        case 0x07:
          meta.subType = 'cuePoint';
          event.value = this.readString(length);
          break;
        case 0x20:
          meta.subType = 'midiChannelPrefix';
          if (length === 1)
            event.value = this.readUint8();
          else
            this.skip(length);
          break;
        case 0x2F:
          meta.subType = 'endOfTrack';
          if (length > 0)
            this.skip(length);
          break;
        case 0x51:
          meta.subType = 'setTempo';
          if (length === 3)
            event.value = this.readUint24();
          else
            this.skip(length)
          break;
        case 0x54:
          meta.subType = 'smpteOffset';
          if (length === 5) {
            const hourByte = this.readUint8();
            event.value = {
              frameRate: ({
                0x00: 24,
                0x01: 25,
                0x02: 29.97,
                0x03: 30
              }[hourByte >>> 6]),
              hour: (hourByte & 0x3F),
              minute: this.readUint8(),
              second: this.readUint8(),
              frame: this.readUint8(),
              subFrame: this.readUint8()
            };
          } else {
            this.skip(length);
          }
          break;
        case 0x58:
          meta.subType = 'timeSignature';
          if (length === 4) {
            event.value = {
              numerator: this.readUint8(),
              denominator: 1 << this.readUint8(),
              metronome: this.readUint8(),
              thirtyseconds: this.readUint8()
            };
          } else {
            this.skip(length);
          }
          break;
        case 0x59:
          meta.subType = 'keySignature';
          if (length === 2) {
            event.value = {
              key: this.readInt8(),
              scale: this.readUint8()
            };
          } else {
            this.skip(length);
          }
          break;
        case 0x7F:
          meta.subType = 'sequencerSpecific';
          event.value = this.readString(length);
          break;
        default:
          meta.subType = 'unknown';
          event.value = this.readString(length);
        }
        break;
      // sysex event
      case 0xF0:
        /** @type {Event<"sysEx", Exclude<keyof SysExEvent, number | symbol>, any, {}>} */
        // @ts-expect-error
        const sysex = event;
        sysex.type = 'sysEx';

        length = this.readVarUint();

        event.value = this.readString(length);

        break;
      case 0xF7:
        /** @type {Event<"dividedSysEx", Exclude<keyof DividedSysExEvent, number | symbol>, any, {}>} */
        // @ts-expect-error
        const divsysex = event;
        divsysex.type = 'dividedSysEx';

        length = this.readVarUint();

        event.value = this.readString(length);

        break;
      default:
        /** @type {Event<"unknown", Exclude<keyof UnknownEvent, number | symbol>, any, {}>} */
        // @ts-expect-error
        const unk = event;
        unk.type = 'unknown';
        unk.subType = "unknown";

        length = this.readVarUint();

        event.value = this.readString(length);
      }
    // channel event
    } else {
      let param;

      // if the high bit is low
      // use running event type mode
      if ((eventTypeByte & 0x80) === 0x00) {
        param = eventTypeByte;
        eventTypeByte = this.lastEventTypeByte;
      } else {
        param = this.readUint8();
        this.lastEventTypeByte = eventTypeByte;
      }

      const eventType = eventTypeByte >> 4;

      /** @type {Event<"channel", keyof ChannelEvent, any, { channel: number; }>} */
      // @ts-expect-error
      const chan = event;
      chan.channel = eventTypeByte & 0x0F;
      chan.type = 'channel';

      switch (eventType) {
      case 0x08:
        chan.subType = 'noteOff';

        event.value = {
          noteNumber: param,
          velocity: this.readUint8()
        };
        break;
      case 0x09:
        event.value = {
          noteNumber: param,
          velocity: this.readUint8()
        };

        // some midi implementations use a noteOn
        // event with 0 velocity to denote noteOff
        if (event.value.velocity === 0) {
          chan.subType = 'noteOff';
        } else {
          chan.subType = 'noteOn';
        }
        break;
      case 0x0A:
        chan.subType = 'noteAftertouch';

        event.value = {
          noteNumber: param,
          amount: this.readUint8()
        };
        break;
      case 0x0B:
        chan.subType = 'controller';

        event.value = {
          controllerNumber: param,
          controllerValue: this.readUint8()
        };
        break;
      case 0x0C:
        chan.subType = 'programChange';
        event.value = param;
        break;
      case 0x0D:
        chan.subType = 'channelAftertouch';
        event.value = param;
        break;
      case 0x0E:
        chan.subType = 'pitchBend';
        event.value = param + (this.readUint8() << 7);
        break;
      default:
        chan.subType = 'unknown';
        event.value = (param << 8) + this.readUint8();
      }
    }

    return event;
  }
};

/**
 * @typedef {Object} EventMap
 * @property {MetaEvent} meta
 * @property {SysExEvent} sysEx
 * @property {DividedSysExEvent} dividedSysEx
 * @property {UnknownEvent} unknown
 * @property {ChannelEvent} channel
 */

/**
 * @typedef {Object} MetaEvent
 * @property {{ value: number; }} sequenceNumber
 * @property {{ value: string; }} text
 * @property {{ value: string; }} copyrightNotice
 * @property {{ value: string; }} trackName
 * @property {{ value: string; }} instrumentName
 * @property {{ value: string; }} lyrics
 * @property {{ value: string; }} marker
 * @property {{ value: string; }} cuePoint
 * @property {{ value: number | undefined; }} midiChannelPrefix
 * @property {{ value: undefined; }} endOfTrack
 * @property {{ value: number | undefined; }} setTempo
 * @property {{ value: { frameRate: number; hour: number; minute: number; second: number; frame: number; subFrame: number; } | undefined; }} smpteOffset
 * @property {{ value: { numerator: number; denominator: number; metronome: number; thirtyseconds: number; } | undefined; }} timeSignature
 * @property {{ value: { key: number; scale: number; } | undefined; }} keySignature
 * @property {{ value: number; }} sequencerSpecific
 * @property {{ value: number; }} unknown
 */

/**
 * @typedef {{ [K in any]: { value: string; }; }} SysExEvent
 */

/**
 * @typedef {{ [K in any]: { value: string; }; }} DividedSysExEvent
 */

/**
 * @typedef {{ unknown: { value: string; }; }} UnknownEvent
 */

/**
 * @typedef {Object} ChannelEvent
 * @property {{ channel: number; value: { noteNumber: number; } }} noteOff
 * @property {{ channel: number; value: { noteNumber: number; } }} noteOn
 * @property {{ channel: number; value: { noteNumber: number; amount: number; } }} noteAftertouch
 * @property {{ channel: number; value: { controllerNumber: number; controllerValue: number; } }} controller
 * @property {{ channel: number; value: number; }} programChange
 * @property {{ channel: number; value: number; }} channelAftertouch
 * @property {{ channel: number; value: number; }} pitchBend
 * @property {{ channel: number; value: number; }} unknown
 */

/**
 * @template {keyof EventMap} [T=keyof EventMap]
 * @template {Exclude<keyof EventMap[T], number | symbol> | undefined} [S=undefined]
 * @template {S extends keyof EventMap[T] ? ("value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never) : never} [V=S extends keyof EventMap[T] ? ("value" extends keyof EventMap[T][S] ? EventMap[T][S]["value"] : never) : never]
 * @template {S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}} [E = S extends keyof EventMap[T] ? Omit<EventMap[T][S], "value"> : {}]
 * @typedef {{ delta: number; subType: S; type: T; value: any } & E} Event
 */

module.exports = MIDIStream;
