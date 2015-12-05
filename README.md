# DJ SNAZZY SNARE

a noisy snazzy snare syntj, inspired and deeply guided by [Synthesising Drum Sounds with the Web Audio API by Chris Lowis](https://dev.opera.com/articles/drum-sounds-webaudio/)

# USE IT

```
var dss = require('dj-snazzy-snare')(yrAudioContext)
dss.start(yrAudioContext.currentTime)
// ok that was a p chill lil lo-fi distorted snare-ish sound, but what if...

dss.update({freq: 1000}) // YEAH! MAKE SOME HARSHER NOISE
dss.start(yrAudioContext.currentTime)
```

# SETTINGS:
other things that can be controlled through the update method:

```
    settings: {
      freq: 200, // for the triangle oscillator
      noiseattack: 0.000001,
      noisedecay: 0.000001,
      noisesustain: 0.1175,
      noiserelease: 0.125,
      noisepeak: 0.425,
      noisemid: 0.41215,
      noiseend: 0.000001,
      triattack: 0.0000001,
      tridecay: 0.00000001,
      trisustain: 0.1175,
      trirelease: 0.125,
      tripeak: 0.87,
      trimid: 0.75,
      triend: 0.000001
    }
```

For everything else, just call `nodes()` on yr synth object to do more close to the metal manipulations


# DEVELOPMENT

```
git clone https://github.com/wham-js/web-audio-synth-template.git
cd web-audio-synth-template
npm install
npm run test # should pass! Yay!
```

# HEAR THE MAGIC!

- `npm run serve` boot a webserver at port 3000
- `npm run build` build demo.js to a bundle. Run this after making any changes to hear updates (or add [watchify](https://github.com/wham-js/web-audio-advent-calendar/blob/master/package.json#L8), i wanted to keep things "light")
- open `http://localhost:3000/` in a web browser and hear the magic (hopefully)

# RESOURCES


- [openmusic](https://github.com/openmusic) has a ton of helpful modules
- if you need a basic convolver impulse, [voila](https://github.com/mdn/voice-change-o-matic/tree/gh-pages/audio)