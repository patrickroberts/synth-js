'use strict';

class MIDIStream {
  constructor(buffer) {
    this.data = new Uint8Array(buffer);
    this.byteOffset = 0;
    this.lastEventTypeByte = 0x00;
  }

  readString(byteLength) {
    var byteOffset = this.byteOffset;

    for (var i = 0, str = ''; i < byteLength; i++) {
      str += String.fromCharCode(this.data[byteOffset + i]);
    }

    this.byteOffset += byteLength;

    return str;
  }

  readUint32() {
    var byteOffset = this.byteOffset;
    var value = (
      (this.data[byteOffset    ] << 24) |
      (this.data[byteOffset + 1] << 16) |
      (this.data[byteOffset + 2] <<  8) |
      (this.data[byteOffset + 3]      )
    );

    this.byteOffset += 4;

    return value;
  }

  readUint24() {
    var byteOffset = this.byteOffset;
    var value = (
      (this.data[byteOffset    ] << 16) |
      (this.data[byteOffset + 1] <<  8) |
      (this.data[byteOffset + 2]      )
    );

    this.byteOffset += 3;

    return value;
  }

  readUint16() {
    var byteOffset = this.byteOffset;
    var value = (
      (this.data[byteOffset    ] << 8) |
      (this.data[byteOffset + 1]     )
    );

    this.byteOffset += 2;

    return value;
  }

  readUint8() {
    var byteOffset = this.byteOffset;
    var value = this.data[byteOffset];

    this.byteOffset += 1;

    return value;
  }

  readInt8() {
    var byteOffset = this.byteOffset;
    var value = this.data[byteOffset];

    if (value & 0x80 === 0x80) {
      value ^= 0xFFFFFF00;
    }

    this.byteOffset += 1;

    return value;
  }

  readVarUint() {
    var value = 0;
    var uint8;

    do {
      uint8 = this.readUint8();
      value = (value << 7) + (uint8 & 0x7F);
    } while ((uint8 & 0x80) === 0x80);

    return value;
  }

  skip(byteLength) {
    this.byteOffset += byteLength;
  }

  readChunk() {
    var id = this.readString(4);
    var length = this.readUint32();
    var byteOffset = this.byteOffset;

    this.byteOffset += length;

    var data = this.data.slice(byteOffset, this.byteOffset);

    return {
      id: id,
      length: length,
      data: data.buffer
    };
  }

  readEvent() {
    var event = {};

    event.delta = this.readVarUint();

    var eventTypeByte = this.readUint8();

    // system event
    if ((eventTypeByte & 0xF0) === 0xF0) {
      switch (eventTypeByte) {
      // meta event
      case 0xFF:
        event.type = 'meta';

        var subTypeByte = this.readUint8();
        var length = this.readVarUint();

        switch (subTypeByte) {
        case 0x00:
          event.subType = 'sequenceNumber';
          if (length === 2)
            event.value = this.readUint16();
          else
            this.skip(length);
          break;
        case 0x01:
          event.subType = 'text';
          event.value = this.readString(length);
          break;
        case 0x02:
          event.subType = 'copyrightNotice';
          event.value = this.readString(length);
          break;
        case 0x03:
          event.subType = 'trackName';
          event.value = this.readString(length);
          break;
        case 0x04:
          event.subType = 'instrumentName';
          event.value = this.readString(length);
          break;
        case 0x05:
          event.subType = 'lyrics';
          event.value = this.readString(length);
          break;
        case 0x06:
          event.subType = 'marker';
          event.value = this.readString(length);
          break;
        case 0x07:
          event.subType = 'cuePoint';
          event.value = this.readString(length);
          break;
        case 0x20:
          event.subType = 'midiChannelPrefix';
          if (length === 1)
            event.value = this.readUint8();
          else
            this.skip(length);
          break;
        case 0x2F:
          event.subType = 'endOfTrack';
          if (length > 0)
            this.skip(length);
          break;
        case 0x51:
          event.subType = 'setTempo';
          if (length === 3)
            event.value = this.readUint24();
          else
            this.skip(length)
          break;
        case 0x54:
          event.subType = 'smpteOffset';
          if (length === 5) {
            var hourByte = this.readUint8();
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
          event.subType = 'timeSignature';
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
          event.subType = 'keySignature';
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
          event.subType = 'sequencerSpecific';
          event.value = this.readString(length);
          break;
        default:
          event.subType = 'unknown';
          event.value = this.readString(length);
        }
        break;
      // sysex event
      case 0xF0:
        event.type = 'sysEx';

        var length = this.readVarUint();

        event.value = this.readString(length);

        break;
      case 0xF7:
        event.type = 'dividedSysEx';

        var length = this.readVarUint();

        event.value = this.readString(length);

        break;
      default:
        event.type = 'unknown';

        var length = this.readVarUint();

        event.value = this.readString(length);
      }
    // channel event
    } else {
      var param;

      // if the high bit is low
      // use running event type mode
      if ((eventTypeByte & 0x80) === 0x00) {
        param = eventTypeByte;
        eventTypeByte = this.lastEventTypeByte;
      } else {
        param = this.readUint8();
        this.lastEventTypeByte = eventTypeByte;
      }

      var eventType = eventTypeByte >> 4;

      event.channel = eventTypeByte & 0x0F;
      event.type = 'channel';

      switch (eventType) {
      case 0x08:
        event.subType = 'noteOff';

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
          event.subType = 'noteOff';
        } else {
          event.subType = 'noteOn';
        }
        break;
      case 0x0A:
        event.subType = 'noteAftertouch';

        event.value = {
          noteNumber: param,
          amount: this.readUint8()
        };
        break;
      case 0x0B:
        event.subType = 'controller';

        event.value = {
          controllerNumber: param,
          controllerValue: this.readUint8()
        };
        break;
      case 0x0C:
        event.subType = 'programChange';
        event.value = param;
        break;
      case 0x0D:
        event.subType = 'channelAftertouch';
        event.value = param;
        break;
      case 0x0E:
        event.subType = 'pitchBend';
        event.value = param + (this.readUint8() << 7);
        break;
      default:
        event.subType = 'unknown';
        event.value = (param << 8) + this.readUint8();
      }
    }

    return event;
  }
};

module.exports = MIDIStream;
