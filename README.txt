NAME
  synth - JavaScript MIDI-to-WAV synthesizer

SYNOPSIS
  synth -i filename [options]

DESCRIPTION
  Parses MIDI file and synthesizes sinusoidal raw audio in WAV format.

OPTIONS
  -i, --input filename
    [Required] Specify path of MIDI file (without extension) as input

  -o, --output filename
    Specify path of WAV file (without extension) as output
    Default to input

  -s, --sample-rate number
    Specify explicitly the sample rate in Hz of WAV output.
    Default 44100

  -b, --bits-per-sample number
    Specify explicitly the bits per sample of WAV output.
    Default 16

  -d, --duration number
    Specify explicitly the relative note duration before rest.
    Default 1

  -S, --skip json|file
    Specify either JSON literal or path of JSON file containing meta events or
      source file with which to match and omit MIDI tracks from WAV output. If
      source file is specified, imports function that accepts a track and
      returns a boolean specifying whether to skip or not.
    Default []

    Example Usage:
      synth -i file -S [{\"text\":\"Drums\"},{\"text\":\"Timpani\"}]
      synth -i file -S skip.json

      skip.json:

      [
        {
          "text": "Drums"
        },
        {
          "text": "Timpani"
        }
      ]

      synth -i file -S skip.js

      skip.js:

      module.exports = function (track) {
        // ...logic for determining whether to skip
        return skip;
      };

  -v, --verbose
    Verbose output

  -D, --dry-run
    Run verbosely without generating WAV file

  -h, --help
    Display the help page

AUTHOR
  Patrick Roberts

COPYRIGHT
  Synth is available under the MIT License.
