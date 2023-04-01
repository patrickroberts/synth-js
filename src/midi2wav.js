'use strict';

const WAV = require('./wav');
const MIDIStream = require('./midi');
const Timer = require('./utils/timer');

/**
 * @template {keyof MIDIStream.EventMap} T
 * @template {MIDIStream.EventMap[T] extends undefined ? never : Exclude<keyof MIDIStream.EventMap[T], number | symbol>} S
 * @template {S extends keyof MIDIStream.EventMap[T] ? ("value" extends keyof MIDIStream.EventMap[T][S] ? MIDIStream.EventMap[T][S]["value"] : never) : never} [V=S extends keyof MIDIStream.EventMap[T] ? ("value" extends keyof MIDIStream.EventMap[T][S] ? MIDIStream.EventMap[T][S]["value"] : never) : never]
 * @template {S extends keyof MIDIStream.EventMap[T] ? Omit<MIDIStream.EventMap[T][S], "value"> : {}} [E = S extends keyof MIDIStream.EventMap[T] ? Omit<MIDIStream.EventMap[T][S], "value"> : {}]
 * @param {ArrayBufferLike} buffer
 * @param {{ verbose?: boolean; Skip?: Array<{ [subType: string]: string }> | ((track: Array<MIDIStream.Event<T, S, V, E>>) => boolean); channels?: number; sampleRate?: number; bitsPerSample?: number; duration?: number; }} args
 * @returns {WAV | null}
 */
module.exports = function midiToWav(buffer, args = {}) {
  if (args.verbose) {
    console.log('parsing MIDI header...');
  }

  const midiStream = new MIDIStream(buffer);
  const header = midiStream.readChunk();

  if (header.id !== 'MThd' || header.length !== 6) {
    throw new SyntaxError('malformed header');
  }

  const headerStream = new MIDIStream(header.data);
  const trackCount = headerStream.readUint16();
  const timeDivision = headerStream.readUint16();
  const tracks = [];
  const progression = [];
  const events = [];
  let maxAmplitude;

  for (let i = 0; i < trackCount; i++) {
    if (args.verbose) {
      console.log(`parsing track ${i + 1}...`);
    }

    const trackChunk = midiStream.readChunk();

    if (trackChunk.id !== 'MTrk') {
      continue;
    }

    const trackStream = new MIDIStream(trackChunk.data);
    /** @type {Array<MIDIStream.Event<T, S, V, E>>} */
    const track = [];
    let keep = true;

    // determine whether applied filter will remove the current track while populating it
    while (keep && trackStream.byteOffset < trackChunk.length) {
      /** @type {MIDIStream.Event<T, S, V, E>} */
      let event = trackStream.readEvent();
      track.push(event);

      if (typeof event.value === 'string') {
        if (args.verbose) {
          console.log(`{"${event.subType}":"${event.value}"}`);
        }

        if (Array.isArray(args.Skip)) {
          for (const element of args.Skip) {
            if (element[event.subType] === event.value) {
              if (args.verbose) {
                console.log(`skip match found: {"${event.subType}":"${event.value}"}`);
              }

              keep = false;
              break;
            }
          }
        }
      }
    }

    if (typeof args.Skip === 'function') {
      keep = !args.Skip(track);
    }

    if (keep) {
      tracks.push(track);
    } else if (args.verbose) {
      console.log(`skipping track ${i + 1}...`);
    }
  }

  if (timeDivision >>> 15 === 0) {
    // use microseconds per beat
    const timer = new Timer(timeDivision);

    if (args.verbose) {
      console.log('initializing timer...');
    }

    // set up timer with setTempo events
    for (let i = 0, delta = 0, ticks = 0, event; i < tracks[0].length; i++) {
      event = tracks[0][i];
      delta += event.delta;
      ticks += event.delta;

      if (event.subType === 'setTempo') {
        timer.addCriticalPoint(delta, event.value);
        delta = 0;
      }
    }

    // generate note data
    for (let i = 0; i < tracks.length; i++) {
      if (args.verbose) {
        console.log(`generating progression from track ${i + 1}...`);
      }

      let track = tracks[i];
      let delta = 0;
      let map = new Map();

      for (const element of track) {
        let event = element;
        delta += event.delta;

        if (event.type === 'channel') {
          const semitone = event.value.noteNumber;

          if (event.subType === 'noteOn') {
            let velocity = event.value.velocity;
            let offset = timer.getTime(delta);

            // use stack for simultaneous identical notes
            if (map.has(semitone)) {
              map.get(semitone).push({offset, velocity});
            } else {
              map.set(semitone, [{offset, velocity}]);
            }

            // to determine maximum total velocity for normalizing volume
            events.push({velocity, delta, note: true});
          } else if (event.subType === 'noteOff') {
            const notes = map.get(semitone);
	          const note = notes ? notes.pop() : { offset: 0, velocity: 0 };

            progression.push({
              note: WAV.note(semitone),
              time: timer.getTime(delta) - note.offset,
              amplitude: note.velocity / 128,
              offset: note.offset,
            });

            // to determine maximum total velocity for normalizing volume
            events.push({velocity: note.velocity, delta, note: false});
          }
        } else if (args.verbose && event.type === 'meta') {
          if (typeof event.value === 'string') {
            console.log(`${timer.getTime(delta).toFixed(2)}s ${event.subType}: ${event.value}`);
          }
        }
      }
    }

    if (args.verbose) {
      console.log('normalizing volume...');
    }

    events.sort(function (a, b) {
      return a.delta - b.delta || Number(a.note) - Number(b.note);
    });

    if (args.verbose) {
      console.log('total notes:', progression.length);
      console.log('total time:', timer.getTime(events[events.length - 1].delta), 'seconds');
    }

    let maxVelocity = 1;
    let maxVelocityTime = 0;
    let velocity = 1;
    let maxChord = 0;
    let maxChordTime = 0;
    let chord = 0;

    for (const event of events) {
      if (event.note) {
        velocity += event.velocity;
        chord++;

        if (velocity > maxVelocity) {
          maxVelocity = velocity;
          maxVelocityTime = timer.getTime(event.delta);
        }

        if (chord > maxChord) {
          maxChord = chord;
          maxChordTime = timer.getTime(event.delta);
        }
      } else {
        velocity -= event.velocity;
        chord--;
      }
    }

    // scaling factor for amplitude
    maxAmplitude = 128 / maxVelocity;

    if (args.verbose) {
      console.log('setting volume to', maxAmplitude);
      console.log('  maximum chord of', maxChord, 'at', maxChordTime, 'seconds');
      console.log('  maximum velocity of', maxVelocity - 1, 'at', maxVelocityTime, 'seconds');
    }
  } else {
    // use frames per second
    // not yet implemented

    console.log('Detected unsupported MIDI timing mode');

    return null;

    /*
    let framesPerSecond = (division >>> 8) & 0x7F;
    let ticksPerFrame = division & 0xFF;

    if (framesPerSecond === 29) {
      framesPerSecond = 29.97;
    }

    // seconds per tick = 1 / frames per second / ticks per frame
    secsPerTick = 1 / framesPerSecond / ticksPerFrame;
    */
  }

  // set to mono
  args.channels = 1;

  if (args.verbose) {
    console.log('generating WAV buffer...');
  }

  const wav = new WAV(args.channels, args.sampleRate, args.bitsPerSample);

  wav.writeProgression(progression, maxAmplitude, [0], true, true, args.duration);

  return wav;
};
