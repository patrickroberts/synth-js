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

### JavaScript:

```html
<script src="synth.min.js"></script>
```

After including the file from `dst/synth.min.js`, the global variable `synth` will be initialized.

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
// convert midi buffer to wav buffer
let wavBuffer = synth.midiToWav(midiBuffer).toBuffer();

fs.writeFileSync('song.wav', wavBuffer, {encoding: 'binary'});
```

### JavaScript:

```html
<style>
  #wav:after {
    content: " " attr(download);
  }

  #wav:not([href]) {
    display: none;
  }
</style>
<input type="file" id="midi" accept="audio/midi">
<a id="wav">Download</a>
<script>
  var audio;
  var input = document.getElementById('midi');
  var anchor = document.getElementById('wav');

  input.addEventListener('change', function change() {
    // clean up previous song, if any
    if (anchor.hasAttribute('href')) {
      URL.revokeObjectURL(anchor.href);
      anchor.removeAttribute('href');

      if (audio && !audio.paused) {
        audio.pause();
      }
    }

    // check if file exists
    if (input.files.length > 0) {
      var reader = new FileReader();
      var midName = input.files[0].name;
      // replace file extension with .wav
      var wavName = midName.replace(/\..+?$/, '.wav');

      // set callback for array buffer
      reader.addEventListener('load', function load(event) {
        // convert midi arraybuffer to wav blob
        var wav = synth.midiToWav(event.target.result).toBlob();
        // create a temporary URL to the wav file
        var src = URL.createObjectURL(wav);

        audio = new Audio(src);
        audio.play();

        anchor.setAttribute('href', src);
      });

      // read the file as an array buffer
      reader.readAsArrayBuffer(input.files[0]);

      // set the name of the wav file
      anchor.setAttribute('download', wavName);
    }
  });
</script>
```

See the demo [here][browser-demo].

## FAQ

### Where can I find documentation?

Currently, documentation only exists for the command-line utility.
To access it, use `man`:

```bash
$ man synth
```

For Node or JavaScript, refer to the `src/` directory for accessible APIs:

* `synth.WAV()`
* `synth.MIDIStream()`
* `synth.midiToWav()`

## License

Available under the MIT License

[browser-demo]: https://jsfiddle.net/patrob10114/o5r1adyz/show/
