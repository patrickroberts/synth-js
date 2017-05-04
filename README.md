# synth-js

Command-line utility and Node module for generating raw audio data from MIDI files.

## Installation

### Command-line utility:

```bash
$ npm link synth-js
```

### Node module:

```bash
$ npm install --save synth-js
```

## Usage

### Command-line utility:

```bash
# assuming song.mid in cwd
$ synth -i song
# now song.wav contains raw audio data for song.mid
```

### Node module:

```js
const synth = require('synth-js');
const fs = require('fs');

let midBuffer = fs.readFileSync('song.mid');
let wavBuffer = synth.midiToWav(midiBuffer).toBuffer();

fs.writeFileSync('song.wav', wavBuffer, {encoding: 'binary'});
```

## License

Available under the MIT License
