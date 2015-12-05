(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var synth = require('./')(ac)
// just connect and start the synth to make sure it plays, edit as needed!
synth.connect(ac.destination)
console.log('hi')
setInterval(function () {

  synth.start(ac.currentTime)
}, 500)

},{"./":2}],2:[function(require,module,exports){
var makeDistortionCurve = require('make-distortion-curve')
var adsr = require('a-d-s-r')
// yr function should accept an audioContext, and optional params/opts
module.exports = function (ac, opts) {
  // make some audioNodes, connect them, store them on the object
  var audioNodes = {
    noiseBuffer: ac.createBuffer(1, ac.sampleRate, ac.sampleRate),
    noiseFilter: ac.createBiquadFilter(),
    noiseEnvelope: ac.createGain(),
    osc: ac.createOscillator(),
    oscdistortion: ac.createWaveShaper(),
    oscEnvelope: ac.createGain(),
    compressor: ac.createDynamicsCompressor(),
    distortion: ac.createWaveShaper(),
    mainFilter: ac.createBiquadFilter(),
    highFilter: ac.createBiquadFilter(),
    volume: ac.createGain(),
    settings: {
      freq: 200,
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
  }
// set all the things
  var output = audioNodes.noiseBuffer.getChannelData(0)
  for (var i = 0; i < ac.sampleRate; i++) {
    output[i] = Math.random() * 2 - 1
  }

  audioNodes.noiseFilter.type = 'highpass'
  audioNodes.noiseFilter.frequency.setValueAtTime(1000, ac.currentTime)

  audioNodes.noiseEnvelope.gain.setValueAtTime(0.00001, ac.currentTime)

  audioNodes.osc.type = 'triangle'
  audioNodes.oscdistortion.curve = makeDistortionCurve(1000)
  audioNodes.oscdistortion.oversample = '4x'

  audioNodes.oscEnvelope.gain.setValueAtTime(0.00001, ac.currentTime)

  audioNodes.compressor.threshold.value = -15
  audioNodes.compressor.knee.value = 33
  audioNodes.compressor.ratio.value = 5
  audioNodes.compressor.reduction.value = -10
  audioNodes.compressor.attack.value = 0.005
  audioNodes.compressor.release.value = 0.150

  audioNodes.distortion.curve = makeDistortionCurve(222)
  audioNodes.distortion.oversample = '2x'

  audioNodes.mainFilter.type = 'peaking'
  audioNodes.mainFilter.frequency.value = 250
  audioNodes.mainFilter.gain.value = 1.5
  audioNodes.mainFilter.Q.value = 25

  audioNodes.highFilter.type = 'peaking'
  audioNodes.highFilter.frequency.value = 9000
  audioNodes.highFilter.Q.value = 25
// connect the graph
  audioNodes.noiseFilter.connect(audioNodes.noiseEnvelope)
  audioNodes.osc.connect(audioNodes.oscdistortion)
  audioNodes.oscdistortion.connect(audioNodes.oscEnvelope)
  audioNodes.noiseEnvelope.connect(audioNodes.compressor)
  audioNodes.oscEnvelope.connect(audioNodes.compressor)
  audioNodes.compressor.connect(audioNodes.distortion)
  audioNodes.distortion.connect(audioNodes.mainFilter)
  audioNodes.mainFilter.connect(audioNodes.highFilter)
  audioNodes.highFilter.connect(audioNodes.volume)
// start it up
  audioNodes.volume.gain.setValueAtTime(0.5, ac.currentTime)
  audioNodes.osc.start(ac.currentTime)
// READY 2 return THIS THING B) *NICE*
  return {
    connect: function (input) {
      audioNodes.volume.connect(input)
    },
    start: function (when) {
      var noise = ac.createBufferSource()
      noise.buffer = audioNodes.noiseBuffer
      noise.connect(audioNodes.noiseFilter)
      noise.start(when)
      adsr(audioNodes.noiseEnvelope, when, makeADSR('noise', audioNodes.settings))
      adsr(audioNodes.oscEnvelope, when, makeADSR('tri', audioNodes.settings))
      audioNodes.osc.frequency.setValueAtTime(audioNodes.settings.freq, when)
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
  return Object.keys(settings).filter(function (k) {
    return !!k.match(type)
  }).map(function (k) {
    return k.replace(type, '')
  }).reduce(function (o, k) {
    o[k] = settings[type + k]
    return o
  }, {})
}

},{"a-d-s-r":3,"make-distortion-curve":4}],3:[function(require,module,exports){
module.exports = function (gainNode, when, adsr) {
  gainNode.gain.exponentialRampToValueAtTime(adsr.peak, when + adsr.attack)
  gainNode.gain.exponentialRampToValueAtTime(adsr.mid, when + adsr.attack + adsr.decay)
  gainNode.gain.setValueAtTime(adsr.mid, when + adsr.sustain + adsr.attack + adsr.decay)
  gainNode.gain.exponentialRampToValueAtTime(adsr.end, when + adsr.sustain + adsr.attack + adsr.decay + adsr.release)
}

},{}],4:[function(require,module,exports){
module.exports = function(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGVtby5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2EtZC1zLXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWFrZS1kaXN0b3J0aW9uLWN1cnZlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIndpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHRcbnZhciBhYyA9IG5ldyBBdWRpb0NvbnRleHQoKVxudmFyIHN5bnRoID0gcmVxdWlyZSgnLi8nKShhYylcbi8vIGp1c3QgY29ubmVjdCBhbmQgc3RhcnQgdGhlIHN5bnRoIHRvIG1ha2Ugc3VyZSBpdCBwbGF5cywgZWRpdCBhcyBuZWVkZWQhXG5zeW50aC5jb25uZWN0KGFjLmRlc3RpbmF0aW9uKVxuY29uc29sZS5sb2coJ2hpJylcbnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcblxuICBzeW50aC5zdGFydChhYy5jdXJyZW50VGltZSlcbn0sIDUwMClcbiIsInZhciBtYWtlRGlzdG9ydGlvbkN1cnZlID0gcmVxdWlyZSgnbWFrZS1kaXN0b3J0aW9uLWN1cnZlJylcbnZhciBhZHNyID0gcmVxdWlyZSgnYS1kLXMtcicpXG4vLyB5ciBmdW5jdGlvbiBzaG91bGQgYWNjZXB0IGFuIGF1ZGlvQ29udGV4dCwgYW5kIG9wdGlvbmFsIHBhcmFtcy9vcHRzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhYywgb3B0cykge1xuICAvLyBtYWtlIHNvbWUgYXVkaW9Ob2RlcywgY29ubmVjdCB0aGVtLCBzdG9yZSB0aGVtIG9uIHRoZSBvYmplY3RcbiAgdmFyIGF1ZGlvTm9kZXMgPSB7XG4gICAgbm9pc2VCdWZmZXI6IGFjLmNyZWF0ZUJ1ZmZlcigxLCBhYy5zYW1wbGVSYXRlLCBhYy5zYW1wbGVSYXRlKSxcbiAgICBub2lzZUZpbHRlcjogYWMuY3JlYXRlQmlxdWFkRmlsdGVyKCksXG4gICAgbm9pc2VFbnZlbG9wZTogYWMuY3JlYXRlR2FpbigpLFxuICAgIG9zYzogYWMuY3JlYXRlT3NjaWxsYXRvcigpLFxuICAgIG9zY2Rpc3RvcnRpb246IGFjLmNyZWF0ZVdhdmVTaGFwZXIoKSxcbiAgICBvc2NFbnZlbG9wZTogYWMuY3JlYXRlR2FpbigpLFxuICAgIGNvbXByZXNzb3I6IGFjLmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpLFxuICAgIGRpc3RvcnRpb246IGFjLmNyZWF0ZVdhdmVTaGFwZXIoKSxcbiAgICBtYWluRmlsdGVyOiBhYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICBoaWdoRmlsdGVyOiBhYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICB2b2x1bWU6IGFjLmNyZWF0ZUdhaW4oKSxcbiAgICBzZXR0aW5nczoge1xuICAgICAgZnJlcTogMjAwLFxuICAgICAgbm9pc2VhdHRhY2s6IDAuMDAwMDAxLFxuICAgICAgbm9pc2VkZWNheTogMC4wMDAwMDEsXG4gICAgICBub2lzZXN1c3RhaW46IDAuMTE3NSxcbiAgICAgIG5vaXNlcmVsZWFzZTogMC4xMjUsXG4gICAgICBub2lzZXBlYWs6IDAuNDI1LFxuICAgICAgbm9pc2VtaWQ6IDAuNDEyMTUsXG4gICAgICBub2lzZWVuZDogMC4wMDAwMDEsXG4gICAgICB0cmlhdHRhY2s6IDAuMDAwMDAwMSxcbiAgICAgIHRyaWRlY2F5OiAwLjAwMDAwMDAxLFxuICAgICAgdHJpc3VzdGFpbjogMC4xMTc1LFxuICAgICAgdHJpcmVsZWFzZTogMC4xMjUsXG4gICAgICB0cmlwZWFrOiAwLjg3LFxuICAgICAgdHJpbWlkOiAwLjc1LFxuICAgICAgdHJpZW5kOiAwLjAwMDAwMVxuICAgIH1cbiAgfVxuLy8gc2V0IGFsbCB0aGUgdGhpbmdzXG4gIHZhciBvdXRwdXQgPSBhdWRpb05vZGVzLm5vaXNlQnVmZmVyLmdldENoYW5uZWxEYXRhKDApXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWMuc2FtcGxlUmF0ZTsgaSsrKSB7XG4gICAgb3V0cHV0W2ldID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxXG4gIH1cblxuICBhdWRpb05vZGVzLm5vaXNlRmlsdGVyLnR5cGUgPSAnaGlnaHBhc3MnXG4gIGF1ZGlvTm9kZXMubm9pc2VGaWx0ZXIuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKDEwMDAsIGFjLmN1cnJlbnRUaW1lKVxuXG4gIGF1ZGlvTm9kZXMubm9pc2VFbnZlbG9wZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuMDAwMDEsIGFjLmN1cnJlbnRUaW1lKVxuXG4gIGF1ZGlvTm9kZXMub3NjLnR5cGUgPSAndHJpYW5nbGUnXG4gIGF1ZGlvTm9kZXMub3NjZGlzdG9ydGlvbi5jdXJ2ZSA9IG1ha2VEaXN0b3J0aW9uQ3VydmUoMTAwMClcbiAgYXVkaW9Ob2Rlcy5vc2NkaXN0b3J0aW9uLm92ZXJzYW1wbGUgPSAnNHgnXG5cbiAgYXVkaW9Ob2Rlcy5vc2NFbnZlbG9wZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuMDAwMDEsIGFjLmN1cnJlbnRUaW1lKVxuXG4gIGF1ZGlvTm9kZXMuY29tcHJlc3Nvci50aHJlc2hvbGQudmFsdWUgPSAtMTVcbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLmtuZWUudmFsdWUgPSAzM1xuICBhdWRpb05vZGVzLmNvbXByZXNzb3IucmF0aW8udmFsdWUgPSA1XG4gIGF1ZGlvTm9kZXMuY29tcHJlc3Nvci5yZWR1Y3Rpb24udmFsdWUgPSAtMTBcbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLmF0dGFjay52YWx1ZSA9IDAuMDA1XG4gIGF1ZGlvTm9kZXMuY29tcHJlc3Nvci5yZWxlYXNlLnZhbHVlID0gMC4xNTBcblxuICBhdWRpb05vZGVzLmRpc3RvcnRpb24uY3VydmUgPSBtYWtlRGlzdG9ydGlvbkN1cnZlKDIyMilcbiAgYXVkaW9Ob2Rlcy5kaXN0b3J0aW9uLm92ZXJzYW1wbGUgPSAnMngnXG5cbiAgYXVkaW9Ob2Rlcy5tYWluRmlsdGVyLnR5cGUgPSAncGVha2luZydcbiAgYXVkaW9Ob2Rlcy5tYWluRmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDI1MFxuICBhdWRpb05vZGVzLm1haW5GaWx0ZXIuZ2Fpbi52YWx1ZSA9IDEuNVxuICBhdWRpb05vZGVzLm1haW5GaWx0ZXIuUS52YWx1ZSA9IDI1XG5cbiAgYXVkaW9Ob2Rlcy5oaWdoRmlsdGVyLnR5cGUgPSAncGVha2luZydcbiAgYXVkaW9Ob2Rlcy5oaWdoRmlsdGVyLmZyZXF1ZW5jeS52YWx1ZSA9IDkwMDBcbiAgYXVkaW9Ob2Rlcy5oaWdoRmlsdGVyLlEudmFsdWUgPSAyNVxuLy8gY29ubmVjdCB0aGUgZ3JhcGhcbiAgYXVkaW9Ob2Rlcy5ub2lzZUZpbHRlci5jb25uZWN0KGF1ZGlvTm9kZXMubm9pc2VFbnZlbG9wZSlcbiAgYXVkaW9Ob2Rlcy5vc2MuY29ubmVjdChhdWRpb05vZGVzLm9zY2Rpc3RvcnRpb24pXG4gIGF1ZGlvTm9kZXMub3NjZGlzdG9ydGlvbi5jb25uZWN0KGF1ZGlvTm9kZXMub3NjRW52ZWxvcGUpXG4gIGF1ZGlvTm9kZXMubm9pc2VFbnZlbG9wZS5jb25uZWN0KGF1ZGlvTm9kZXMuY29tcHJlc3NvcilcbiAgYXVkaW9Ob2Rlcy5vc2NFbnZlbG9wZS5jb25uZWN0KGF1ZGlvTm9kZXMuY29tcHJlc3NvcilcbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLmNvbm5lY3QoYXVkaW9Ob2Rlcy5kaXN0b3J0aW9uKVxuICBhdWRpb05vZGVzLmRpc3RvcnRpb24uY29ubmVjdChhdWRpb05vZGVzLm1haW5GaWx0ZXIpXG4gIGF1ZGlvTm9kZXMubWFpbkZpbHRlci5jb25uZWN0KGF1ZGlvTm9kZXMuaGlnaEZpbHRlcilcbiAgYXVkaW9Ob2Rlcy5oaWdoRmlsdGVyLmNvbm5lY3QoYXVkaW9Ob2Rlcy52b2x1bWUpXG4vLyBzdGFydCBpdCB1cFxuICBhdWRpb05vZGVzLnZvbHVtZS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgYWMuY3VycmVudFRpbWUpXG4gIGF1ZGlvTm9kZXMub3NjLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuLy8gUkVBRFkgMiByZXR1cm4gVEhJUyBUSElORyBCKSAqTklDRSpcbiAgcmV0dXJuIHtcbiAgICBjb25uZWN0OiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgIGF1ZGlvTm9kZXMudm9sdW1lLmNvbm5lY3QoaW5wdXQpXG4gICAgfSxcbiAgICBzdGFydDogZnVuY3Rpb24gKHdoZW4pIHtcbiAgICAgIHZhciBub2lzZSA9IGFjLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpXG4gICAgICBub2lzZS5idWZmZXIgPSBhdWRpb05vZGVzLm5vaXNlQnVmZmVyXG4gICAgICBub2lzZS5jb25uZWN0KGF1ZGlvTm9kZXMubm9pc2VGaWx0ZXIpXG4gICAgICBub2lzZS5zdGFydCh3aGVuKVxuICAgICAgYWRzcihhdWRpb05vZGVzLm5vaXNlRW52ZWxvcGUsIHdoZW4sIG1ha2VBRFNSKCdub2lzZScsIGF1ZGlvTm9kZXMuc2V0dGluZ3MpKVxuICAgICAgYWRzcihhdWRpb05vZGVzLm9zY0VudmVsb3BlLCB3aGVuLCBtYWtlQURTUigndHJpJywgYXVkaW9Ob2Rlcy5zZXR0aW5ncykpXG4gICAgICBhdWRpb05vZGVzLm9zYy5mcmVxdWVuY3kuc2V0VmFsdWVBdFRpbWUoYXVkaW9Ob2Rlcy5zZXR0aW5ncy5mcmVxLCB3aGVuKVxuICAgIH0sXG4gICAgc3RvcDogZnVuY3Rpb24gKHdoZW4pIHtcbiAgICAgIGF1ZGlvTm9kZXMub3NjLnN0b3Aod2hlbilcbiAgICB9LFxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgIE9iamVjdC5rZXlzKG9wdHMpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgYXVkaW9Ob2Rlcy5zZXR0aW5nc1trXSA9IG9wdHNba11cbiAgICAgIH0pXG4gICAgfSxcbiAgICBub2RlczogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGF1ZGlvTm9kZXNcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUFEU1IgKHR5cGUsIHNldHRpbmdzKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhzZXR0aW5ncykuZmlsdGVyKGZ1bmN0aW9uIChrKSB7XG4gICAgcmV0dXJuICEhay5tYXRjaCh0eXBlKVxuICB9KS5tYXAoZnVuY3Rpb24gKGspIHtcbiAgICByZXR1cm4gay5yZXBsYWNlKHR5cGUsICcnKVxuICB9KS5yZWR1Y2UoZnVuY3Rpb24gKG8sIGspIHtcbiAgICBvW2tdID0gc2V0dGluZ3NbdHlwZSArIGtdXG4gICAgcmV0dXJuIG9cbiAgfSwge30pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChnYWluTm9kZSwgd2hlbiwgYWRzcikge1xuICBnYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoYWRzci5wZWFrLCB3aGVuICsgYWRzci5hdHRhY2spXG4gIGdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShhZHNyLm1pZCwgd2hlbiArIGFkc3IuYXR0YWNrICsgYWRzci5kZWNheSlcbiAgZ2Fpbk5vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZShhZHNyLm1pZCwgd2hlbiArIGFkc3Iuc3VzdGFpbiArIGFkc3IuYXR0YWNrICsgYWRzci5kZWNheSlcbiAgZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKGFkc3IuZW5kLCB3aGVuICsgYWRzci5zdXN0YWluICsgYWRzci5hdHRhY2sgKyBhZHNyLmRlY2F5ICsgYWRzci5yZWxlYXNlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhbW91bnQpIHtcbiAgdmFyIGsgPSB0eXBlb2YgYW1vdW50ID09PSAnbnVtYmVyJyA/IGFtb3VudCA6IDUwLFxuICAgIG5fc2FtcGxlcyA9IDQ0MTAwLFxuICAgIGN1cnZlID0gbmV3IEZsb2F0MzJBcnJheShuX3NhbXBsZXMpLFxuICAgIGRlZyA9IE1hdGguUEkgLyAxODAsXG4gICAgaSA9IDAsXG4gICAgeDtcbiAgZm9yICggOyBpIDwgbl9zYW1wbGVzOyArK2kgKSB7XG4gICAgeCA9IGkgKiAyIC8gbl9zYW1wbGVzIC0gMTtcbiAgICBjdXJ2ZVtpXSA9ICggMyArIGsgKSAqIHggKiAyMCAqIGRlZyAvICggTWF0aC5QSSArIGsgKiBNYXRoLmFicyh4KSApO1xuICB9XG4gIHJldHVybiBjdXJ2ZTtcbn1cbiJdfQ==
