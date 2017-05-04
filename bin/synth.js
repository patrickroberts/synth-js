#!/usr/bin/env node
'use strict';

const fs = require('fs');
const midiToWav = require('../lib/midi2wav');
const getArgs = require('../lib/args');

try {
  const args = getArgs(process.argv);

  if (args.help || args.input === undefined) {
    return console.log(fs.readFileSync(`${__dirname}/../man/help.txt`, {encoding: 'utf8'}));
  }

  if (args.verbose) {
    console.log(JSON.stringify(args, null, 2));
  }

  if (typeof args.input === 'string') {
    fs.readFile(`${args.input}.mid`, {encoding: null}, (error, data) => {
      if (error) {
        throw error;
      }

      if (args.verbose) {
        console.log('parsing MIDI...');
      }

      const wav = midiToWav(data, args);

      if (args.DryRun) {
        return console.log('dry run complete');
      }

      if (args.verbose) {
        console.log('writing buffer...');
      }

      const buffer = wav.toBuffer();

      fs.writeFile(`${args.output}.wav`, buffer, {encoding: null}, (error) => {
        if (error) {
          throw error;
        }

        if (args.verbose) {
          console.log('success');
        }
      });
    });
  } else {
    throw new ReferenceError('no input file specified');
  }
} catch (error) {
  console.log(error.stack);
}
