var makeDistortionCurve = require('make-distortion-curve')
var adsr = require('a-d-s-r')
// yr function should accept an audioContext, and optional params/opts
module.exports = function (ac, opts) {
  // make some audioNodes, connect them, store them on the object
  var audioNodes = {
    noise: this.context.createBufferSource(),
    noiseBuffer: ac.createBuffer(1, ac.sampleRate, ac.sampleRate),
    noiseFilter: ac.createBiquadFilter(),
    noiseEnvelope: ac.createGain(),
    osc: ac.createOscillator(),
    oscEnvelope: ac.createGain(),
    compressor: ac.createDynamicsCompressor(),
    distortion: ac.createWaveShaper(),
    mainFilter: ac.createBiquadFilter(),
    volume: ac.createGain(),
    settings: {
      freq: 100,
      noiseattack: 0.000001,
      noisedecay: 0.000001,
      noisesustain: 0.15,
      noiserelease: 0.05,
      noisepeak: 1,
      noisemid: 0.85,
      noiseend: 0.00000000000000001,
      triattack: 0.0000001,
      tridecay: 0.00000001,
      trisustain: 0.075,
      trirelease: 0.025,
      tripeak: 0.7,
      trimid: 0.55,
      triend: 0.00000000000000001
    }
  }
// set all the things
  var output = audioNodes.buffer.getChannelData(0)
  for (var i = 0; i < ac.sampleRate; i++) {
    output[i] = Math.random() * 2 - 1
  }
  audioNodes.noise.buffer = audioNodes.noiseBuffer

  audioNodes.noiseFilter.type = 'highpass'
  audioNodes.noiseFilter.frequency.setValueAtTime(1000, ac.currentTime)

  audioNodes.osc.type = 'triangle'

  audioNodes.compressor.threshold.value = -15
  audioNodes.compressor.knee.value = 33
  audioNodes.compressor.ratio.value = 5
  audioNodes.compressor.reduction.value = -10
  audioNodes.compressor.attack.value = 0.005
  audioNodes.compressor.release.value = 0.150

  audioNodes.distortion.curve = makeDistortionCurve(222)

  audioNodes.mainFilter.type = 'peaking'
  audioNodes.mainFilter.frequency.value = 250
  audioNodes.mainFilter.gain.value = 1.5
  audioNodes.mainFilter.Q.value = 25
// start it up
  audioNodes.volume.gain.setValueAtTime(0, ac.currentTime)
  audioNodes.osc.start(ac.currentTime)
  audioNodes.noise.start(ac.currentTime)
// connect the graph
  audioNodes.noise.connect(audioNodes.noiseFilter)
  audioNodes.noiseFilter.connect(audioNodes.noiseEnvelope)
  audioNodes.osc.connect(audioNodes.oscEnvelope)
  audioNodes.noiseEnvelope.connect(audioNodes.compressor)
  audioNodes.oscEnvelope.connect(audioNodes.compressor)
  audioNodes.compressor.connect(audioNodes.distortion)
  audioNodes.distortion.connect(audioNodes.mainFilter)
  audioNodes.mainFilter.connect(audioNodes.volume)
// READY 2 return THIS THING B) *NICE*
  return {
    connect: function (input) {
      audioNodes.volume.connect(input)
    },
    start: function (when) {
      adsr(audioNodes.noiseEnvelope, when, makeADSR('noise', audioNodes.settings))
      adsr(audioNodes.oscEnvelope, when, makeADSR('tri', audioNodes.settings))
      audioNodes.osc.frequency.setValueAtTime(audioNodes.settings.freq, time)
    },
    stop: function (when) {
      audioNodes.osc.stop(when)
    },
    update: function (opts) {
      Object.keys(opts).forEach(function (k) {
        audioNodes.settings[k] = opts[k]
      })
    },
    nodes: function () {
      return audioNodes
    }
  }
}

function makeADSR (type, settings) {
  Object.keys(settings).filter(function (k) {
    return !!k.match(type)
  }).map(function (k) {
    return k.replace(type, '')
  }).reduce(function (o, k) {
    o[k] = settings[type + k]
    return o
  }, {})
}
