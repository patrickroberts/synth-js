'use strict';

class WAV {
  static semitone(note = 'REST') {
    // matches occurence of A through G
    // followed by positive or negative integer
    // followed by 0 to 2 occurences of flat or sharp
    const re = /^([A-G])(\-?\d+)(b{0,2}|#{0,2})$/;

    // if semitone is unrecognized, assume REST
    if (!re.test(note)) {
      return -Infinity;
    }

    // parse substrings of note
    const [, tone, octave, accidental] = note.match(re);

    // semitone indexed relative to A4 == 69 for compatibility with MIDI
    const tones = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
    const octaves = {'-1': 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11};
    const accidentals = {bb: -2, b: -1, '': 0, '#': 1, '##': 2};

    // if semitone is unrecognized, assume REST
    if (tones[tone] === undefined || octaves[octave] === undefined || accidentals[accidental] === undefined) {
      return -Infinity;
    }

    // return calculated index
    return tones[tone] + octaves[octave] * 12 + accidentals[accidental];
  }

  static note(semitone = -Infinity) {
    const octaves = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const tones = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const octaveIndex = Math.floor(semitone / 12);
    const toneIndex = Math.floor(semitone - octaveIndex * 12);

    const octave = octaves[octaveIndex];
    const tone = tones[toneIndex];

    // by default assume REST
    if (octave === undefined || tone === undefined) {
      return 'REST';
    }

    // tone followed by octave followed by accidental
    return tone.charAt(0) + octave.toString() + tone.charAt(1);
  }

  // converts semitone index to frequency in Hz
  static frequency(semitone = -Infinity) {
    // A4 is 440 Hz, 12 semitones per octave
    return 440 * Math.pow(2, (semitone - 69) / 12);
  }

  constructor(numChannels = 1, sampleRate = 44100, bitsPerSample = 16, littleEndian = true, data = []) {
    var bytesPerSample = bitsPerSample >>> 3;
    // WAV header is always 44 bytes
    this.header = new ArrayBuffer(44);
    // flexible container for reading / writing raw bytes in header
    this.view = new DataView(this.header);
    // leave sound data as non typed array for more flexibility
    this.data = data;

    // initialize as non-configurable because it
    // causes script to freeze when using parsed
    // chunk sizes with wrong endianess assumed
    Object.defineProperty(this, 'littleEndian', {
      configurable: false,
      enumerable: true,
      value: littleEndian,
      writable: false
    });

    // initial write index in data array
    this.pointer = 0;

    // WAV header properties
    this.ChunkID = littleEndian ? 'RIFF' : 'RIFX';
    this.ChunkSize = this.header.byteLength - 8;
    this.Format = 'WAVE';
    this.SubChunk1ID = 'fmt ';
    this.SubChunk1Size = 16;
    this.AudioFormat = 1;
    this.NumChannels = numChannels;
    this.SampleRate = sampleRate;
    this.ByteRate = numChannels * sampleRate * bytesPerSample;
    this.BlockAlign = numChannels * bytesPerSample;
    this.BitsPerSample = bitsPerSample;
    this.SubChunk2ID = 'data';
    this.SubChunk2Size = data.length * bytesPerSample;
  }

  // internal setter for writing strings as raw bytes to header
  setString(str, byteLength = str.length, byteOffset = 0) {
    for (var i = 0; i < byteLength; i++) {
      this.view.setUint8(byteOffset + i, str.charCodeAt(i));
    }
  }

  // internal getter for reading raw bytes as strings from header
  getString(byteLength, byteOffset = 0) {
    for (var i = 0, str = ''; i < byteLength; i++) {
      str += String.fromCharCode(this.view.getUint8(byteOffset + i));
    }

    return str;
  }

  // header property mutators

  // 4 bytes at offset of 0 bytes
  set ChunkID(str) {
    this.setString(str, 4, 0);
  }

  get ChunkID() {
    return this.getString(4, 0);
  }

  // 4 bytes at offset of 4 bytes
  set ChunkSize(uint) {
    this.view.setUint32(4, uint, this.littleEndian);
  }

  get ChunkSize() {
    return this.view.getUint32(4, this.littleEndian);
  }

  // 4 bytes at offset of 8 bytes
  set Format(str) {
    this.setString(str, 4, 8);
  }

  get Format() {
    return this.getString(4, 8);
  }

  // 4 bytes at offset of 12 bytes
  set SubChunk1ID(str) {
    this.setString(str, 4, 12);
  }

  get SubChunk1ID() {
    return this.getString(4, 12);
  }

  // 4 bytes at offset of 16 bytes
  set SubChunk1Size(uint) {
    this.view.setUint32(16, uint, this.littleEndian);
  }

  get SubChunk1Size() {
    return this.view.getUint32(16, this.littleEndian);
  }

  // 2 bytes at offset of 20 bytes
  set AudioFormat(uint) {
    this.view.setUint16(20, uint, this.littleEndian);
  }

  get AudioFormat() {
    return this.view.getUint16(20, this.littleEndian);
  }

  // 2 bytes at offset of 22 bytes
  set NumChannels(uint) {
    this.view.setUint16(22, uint, this.littleEndian);
  }

  get NumChannels() {
    return this.view.getUint16(22, this.littleEndian);
  }

  // 4 bytes at offset of 24 bytes
  set SampleRate(uint) {
    this.view.setUint32(24, uint, this.littleEndian);
  }

  get SampleRate() {
    return this.view.getUint32(24, this.littleEndian);
  }

  // 4 bytes at offset of 28 bytes
  set ByteRate(uint) {
    this.view.setUint32(28, uint, this.littleEndian);
  }

  get ByteRate() {
    return this.view.getUint32(28, this.littleEndian);
  }

  // 2 bytes at offset of 32 bytes
  set BlockAlign(uint) {
    this.view.setUint16(32, uint, this.littleEndian);
  }

  get BlockAlign() {
    return this.view.getUint16(32, this.littleEndian);
  }

  // 2 bytes at offset of 34 bytes
  set BitsPerSample(uint) {
    this.view.setUint16(34, uint, this.littleEndian);
  }

  get BitsPerSample() {
    return this.view.getUint16(34, this.littleEndian);
  }

  // 4 bytes at offset of 36 bytes
  set SubChunk2ID(str) {
    this.setString(str, 4, 36);
  }

  get SubChunk2ID() {
    return this.getString(4, 36);
  }

  // 4 bytes at offset of 40 bytes
  set SubChunk2Size(uint) {
    this.view.setUint32(40, uint, this.littleEndian);
  }

  get SubChunk2Size() {
    return this.view.getUint32(40, this.littleEndian);
  }

  // internal getter for sound data as
  // typed array based on header properties
  get typedData() {
    var bytesPerSample = this.BitsPerSample >>> 3;
    var data = this.data;
    var size = this.SubChunk2Size;
    var samples = size / bytesPerSample;
    var buffer = new ArrayBuffer(size);
    var uint8 = new Uint8Array(buffer);

    // convert signed normalized sound data to typed integer data
    // i.e. [-1, 1] -> [INT_MIN, INT_MAX]
    var amplitude = Math.pow(2, (bytesPerSample << 3) - 1) - 1;
    var i, d;

    switch (bytesPerSample) {
    case 1:
      // endianess not relevant for 8-bit encoding
      for (i = 0; i < samples; i++) {
        // convert by adding 0x80 instead of 0x100
        // WAV uses unsigned data for 8-bit encoding

        // [INT8_MIN, INT8_MAX] -> [0, UINT8_MAX]
        uint8[i] = (data[i] * amplitude + 0x80) & 0xFF;
      }
      break;
    case 2:
      // LSB first
      if (this.littleEndian) {
        for (i = 0; i < samples; i++) {
          // [INT16_MIN, INT16_MAX] -> [0, UINT16_MAX]
          d = (data[i] * amplitude + 0x10000) & 0xFFFF;

          // unwrap inner loop
          uint8[i * 2    ] = (d      ) & 0xFF;
          uint8[i * 2 + 1] = (d >>> 8);
        }
      // MSB first
      } else {
        for (i = 0; i < samples; i++) {
          // [INT16_MIN, INT16_MAX] -> [0, UINT16_MAX]
          d = (data[i] * amplitude + 0x10000) & 0xFFFF;

          // unwrap inner loop
          uint8[i * 2    ] = (d >>> 8);
          uint8[i * 2 + 1] = (d      ) & 0xFF;
        }
      }
      break;
    case 3:
      // LSB first
      if (this.littleEndian) {
        for (i = 0; i < samples; i++) {
          // [INT24_MIN, INT24_MAX] -> [0, UINT24_MAX]
          d = (data[i] * amplitude + 0x1000000) & 0xFFFFFF;

          // unwrap inner loop
          uint8[i * 3    ] = (d       ) & 0xFF;
          uint8[i * 3 + 1] = (d >>>  8) & 0xFF;
          uint8[i * 3 + 2] = (d >>> 16);
        }
      // MSB first
      } else {
        for (i = 0; i < samples; i++) {
          // [INT24_MIN, INT24_MAX] -> [0, UINT24_MAX]
          d = (data[i] * amplitude + 0x1000000) & 0xFFFFFF;

          // unwrap inner loop
          uint8[i * 3    ] = (d >>> 16);
          uint8[i * 3 + 1] = (d >>>  8) & 0xFF;
          uint8[i * 3 + 2] = (d       ) & 0xFF;
        }
      }
    case 4:
      // LSB first
      if (this.littleEndian) {
        for (i = 0; i < samples; i++) {
          // [INT32_MIN, INT32_MAX] -> [0, UINT32_MAX]
          d = (data[i] * amplitude + 0x100000000) & 0xFFFFFFFF;

          // unwrap inner loop
          uint8[i * 4    ] = (d       ) & 0xFF;
          uint8[i * 4 + 1] = (d >>>  8) & 0xFF;
          uint8[i * 4 + 2] = (d >>> 16) & 0xFF;
          uint8[i * 4 + 3] = (d >>> 24);
        }
      // MSB first
      } else {
        for (i = 0; i < samples; i++) {
          // [INT32_MIN, INT32_MAX] -> [0, UINT32_MAX]
          d = (data[i] * amplitude + 0x100000000) & 0xFFFFFFFF;

          // unwrap inner loop
          uint8[i * 4    ] = (d >>> 24);
          uint8[i * 4 + 1] = (d >>> 16) & 0xFF;
          uint8[i * 4 + 2] = (d >>>  8) & 0xFF;
          uint8[i * 4 + 3] = (d       ) & 0xFF;
        }
      }
    }

    return buffer;
  }

  // binary container outputs

  // browser-specific
  // generates blob from concatenated typed arrays
  toBlob() {
    return new Blob([this.header, this.typedData], {type: 'audio/wav'});
  }

  // Node.js-specific
  // generates buffer from concatenated typed arrays
  toBuffer() {
    return Buffer.concat([Buffer.from(this.header), Buffer.from(this.typedData)]);
  }

  // pointer mutators

  // gets time (in seconds) of pointer
  tell() {
    return this.pointer / this.NumChannels / this.SampleRate;
  }

  // sets time (in seconds) of pointer
  // zero-fills by default
  seek(time, fill = true) {
    var data   = this.data;
    var sample = Math.round(this.SampleRate * time);

    this.pointer = this.NumChannels * sample;

    if (fill) {
      // zero-fill seek
      while (data.length < this.pointer) {
        data[data.length] = 0;
      }
    } else {
      this.pointer = data.length;
    }
  }

  // sound data mutators

  // writes the specified note to the sound data
  // for amount of time in seconds
  // at given normalized amplitude
  // to channels listed (or all by default)
  // adds to existing data by default
  // and does not reset write index after operation by default
  writeNote({note, time, amplitude = 1}, channels = [], blend = true, reset = false) {
    // creating local references to properties
    var data = this.data;
    var numChannels = this.NumChannels;
    var sampleRate = this.SampleRate;

    // to prevent sound artifacts
    const fadeSeconds = 0.001;

    // calculating properties of given note
    var semitone = WAV.semitone(note);
    var frequency = WAV.frequency(semitone) * Math.PI * 2 / sampleRate;
    var period = Math.PI * 2 / frequency;

    // amount of blocks to be written
    var blocksOut = Math.round(sampleRate * time);
    // reduces sound artifacts by fading at last fadeSeconds
    var nonZero = blocksOut - sampleRate * fadeSeconds;
    // fade interval in samples
    var fade = blocksOut - nonZero + 1;

    // index of start and stop samples
    var start = this.pointer;
    var stop = data.length;

    // determines amount of blocks to be updated
    var blocksIn = Math.min(Math.floor((stop - start) / numChannels), blocksOut);

    // i = index of each sample block
    // j = index of each channel in a block
    // k = cached index of data
    // d = sample data value
    var i, j, k, d;

    // by default write to all channels
    if (channels.length === 0) {
      // don't overwrite passed array
      channels = [];

      for (i = 0; i < numChannels; i++) {
        channels[i] = i;
      }
    }

    // inline .indexOf() function calls into array references
    var skipChannel = [];

    for (i = 0; i < numChannels; i++) {
      skipChannel[i] = (channels.indexOf(i) === -1);
    }

    // update existing data
    for (i = 0; i < blocksIn; i++) {
      // iterate through specified channels
      for (j = 0; j < channels.length; j++) {
        k = start + i * numChannels + channels[j];
        d = 0;

        if (frequency > 0) {
          d = amplitude * Math.sin(frequency * i) * ((i < fade) ? i : (i > nonZero) ? blocksOut - i + 1 : fade) / fade;
        }

        data[k] = d + (blend ? data[k] : 0);
      }
    }

    // append data
    for (i = blocksIn; i < blocksOut; i++) {
      k = start + i * numChannels;

      // iterate through all channels
      for (j = 0; j < numChannels; j++) {
        d = 0;

        // only write non-zero data to specified channels
        if (frequency > 0 || !skipChannel[j]) {
          d = amplitude * Math.sin(frequency * i) * ((i < fade) ? i : (i > nonZero) ? blocksOut - i + 1 : fade) / fade;
        }

        data[k + j] = d;
      }
    }

    // update header properties
    var end = Math.max(start + blocksOut * numChannels, stop) * this.BitsPerSample >>> 3;

    this.ChunkSize = end + this.header.byteLength - 8;
    this.SubChunk2Size = end;

    if (!reset) {
      // move write index to end of written data
      this.pointer = start + blocksOut * numChannels;
    }
  }

  // adds specified notes in series
  // (or asynchronously if offset property is specified in a note)
  // each playing for time * relativeDuration seconds
  // followed by a time * (1 - relativeDuration) second rest
  writeProgression(notes, amplitude = 1, channels = [], blend = true, reset = false, relativeDuration = 1) {
    var start = this.pointer;

    for (var i = 0, note, time, amp, off, secs, rest; i < notes.length; i++) {
      ({note, time, amplitude: amp, offset: off} = notes[i]);

      // for asynchronous progression
      if (off !== undefined) {
        this.seek(off);
      }

      if (relativeDuration === 1 || note === 'REST') {
        this.writeNote({note, time, amplitude: amp === undefined ? amplitude : amp * amplitude}, channels, blend, false);
      } else {
        secs = time * relativeDuration;
        rest = time - secs;

        this.writeNote({note: note, time: secs, amplitude: amp === undefined ? amplitude : amp * amplitude}, channels, blend, false);
        this.writeNote({note: 'REST', time: rest}, channels, blend, false);
      }
    }

    if (reset) {
      this.pointer = start;
    }
  }
};

module.exports = WAV;
