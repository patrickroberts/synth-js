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
  var anchor = document.getElementById('wav');

  document.getElementById('midi').addEventListener('change', function change() {
    if (anchor.hasAttribute('href')) {
      URL.revokeObjectURL(anchor.href);
      anchor.removeAttribute('href');

      if (audio && !audio.paused) {
        audio.pause();
      }
    }

    if (this.files.length > 0) {
      var reader = new FileReader();

      reader.addEventListener('load', function load(event) {
        var wav = synth.midiToWav(event.target.result).toBlob();
        var src = URL.createObjectURL(wav);

        audio = new Audio(src);
        audio.play();

        anchor.setAttribute('href', src);
      });

      reader.readAsArrayBuffer(this.files[0]);

      anchor.setAttribute('download', this.files[0].name.replace(/\..+?$/, '.wav'));
    }
  });
</script>
```

See the demo [here][browser-demo].

## License

Available under the MIT License

[browser-demo]: https://jsfiddle.net/patrob10114/o5r1adyz/show/
