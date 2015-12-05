(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
console.log('hi')
window.AudioContext = window.AudioContext || window.webkitAudioContext
var ac = new AudioContext()
var synth = require('./')(ac)
// just connect and start the synth to make sure it plays, edit as needed!
synth.connect(ac.destination)
console.log('hi')
setInterval(function () {

  synth.start(ac.currentTime)
  console.log('howdy')
}, 500)

},{"./":2}],2:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGVtby5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL2EtZC1zLXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWFrZS1kaXN0b3J0aW9uLWN1cnZlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zb2xlLmxvZygnaGknKVxud2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dFxudmFyIGFjID0gbmV3IEF1ZGlvQ29udGV4dCgpXG52YXIgc3ludGggPSByZXF1aXJlKCcuLycpKGFjKVxuLy8ganVzdCBjb25uZWN0IGFuZCBzdGFydCB0aGUgc3ludGggdG8gbWFrZSBzdXJlIGl0IHBsYXlzLCBlZGl0IGFzIG5lZWRlZCFcbnN5bnRoLmNvbm5lY3QoYWMuZGVzdGluYXRpb24pXG5jb25zb2xlLmxvZygnaGknKVxuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuXG4gIHN5bnRoLnN0YXJ0KGFjLmN1cnJlbnRUaW1lKVxuICBjb25zb2xlLmxvZygnaG93ZHknKVxufSwgNTAwKVxuIiwidmFyIG1ha2VEaXN0b3J0aW9uQ3VydmUgPSByZXF1aXJlKCdtYWtlLWRpc3RvcnRpb24tY3VydmUnKVxudmFyIGFkc3IgPSByZXF1aXJlKCdhLWQtcy1yJylcbi8vIHlyIGZ1bmN0aW9uIHNob3VsZCBhY2NlcHQgYW4gYXVkaW9Db250ZXh0LCBhbmQgb3B0aW9uYWwgcGFyYW1zL29wdHNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjLCBvcHRzKSB7XG4gIC8vIG1ha2Ugc29tZSBhdWRpb05vZGVzLCBjb25uZWN0IHRoZW0sIHN0b3JlIHRoZW0gb24gdGhlIG9iamVjdFxuICB2YXIgYXVkaW9Ob2RlcyA9IHtcbiAgICBub2lzZTogdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpLFxuICAgIG5vaXNlQnVmZmVyOiBhYy5jcmVhdGVCdWZmZXIoMSwgYWMuc2FtcGxlUmF0ZSwgYWMuc2FtcGxlUmF0ZSksXG4gICAgbm9pc2VGaWx0ZXI6IGFjLmNyZWF0ZUJpcXVhZEZpbHRlcigpLFxuICAgIG5vaXNlRW52ZWxvcGU6IGFjLmNyZWF0ZUdhaW4oKSxcbiAgICBvc2M6IGFjLmNyZWF0ZU9zY2lsbGF0b3IoKSxcbiAgICBvc2NFbnZlbG9wZTogYWMuY3JlYXRlR2FpbigpLFxuICAgIGNvbXByZXNzb3I6IGFjLmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpLFxuICAgIGRpc3RvcnRpb246IGFjLmNyZWF0ZVdhdmVTaGFwZXIoKSxcbiAgICBtYWluRmlsdGVyOiBhYy5jcmVhdGVCaXF1YWRGaWx0ZXIoKSxcbiAgICB2b2x1bWU6IGFjLmNyZWF0ZUdhaW4oKSxcbiAgICBzZXR0aW5nczoge1xuICAgICAgZnJlcTogMTAwLFxuICAgICAgbm9pc2VhdHRhY2s6IDAuMDAwMDAxLFxuICAgICAgbm9pc2VkZWNheTogMC4wMDAwMDEsXG4gICAgICBub2lzZXN1c3RhaW46IDAuMTUsXG4gICAgICBub2lzZXJlbGVhc2U6IDAuMDUsXG4gICAgICBub2lzZXBlYWs6IDEsXG4gICAgICBub2lzZW1pZDogMC44NSxcbiAgICAgIG5vaXNlZW5kOiAwLjAwMDAwMDAwMDAwMDAwMDAxLFxuICAgICAgdHJpYXR0YWNrOiAwLjAwMDAwMDEsXG4gICAgICB0cmlkZWNheTogMC4wMDAwMDAwMSxcbiAgICAgIHRyaXN1c3RhaW46IDAuMDc1LFxuICAgICAgdHJpcmVsZWFzZTogMC4wMjUsXG4gICAgICB0cmlwZWFrOiAwLjcsXG4gICAgICB0cmltaWQ6IDAuNTUsXG4gICAgICB0cmllbmQ6IDAuMDAwMDAwMDAwMDAwMDAwMDFcbiAgICB9XG4gIH1cbi8vIHNldCBhbGwgdGhlIHRoaW5nc1xuICB2YXIgb3V0cHV0ID0gYXVkaW9Ob2Rlcy5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhYy5zYW1wbGVSYXRlOyBpKyspIHtcbiAgICBvdXRwdXRbaV0gPSBNYXRoLnJhbmRvbSgpICogMiAtIDFcbiAgfVxuICBhdWRpb05vZGVzLm5vaXNlLmJ1ZmZlciA9IGF1ZGlvTm9kZXMubm9pc2VCdWZmZXJcblxuICBhdWRpb05vZGVzLm5vaXNlRmlsdGVyLnR5cGUgPSAnaGlnaHBhc3MnXG4gIGF1ZGlvTm9kZXMubm9pc2VGaWx0ZXIuZnJlcXVlbmN5LnNldFZhbHVlQXRUaW1lKDEwMDAsIGFjLmN1cnJlbnRUaW1lKVxuXG4gIGF1ZGlvTm9kZXMub3NjLnR5cGUgPSAndHJpYW5nbGUnXG5cbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLnRocmVzaG9sZC52YWx1ZSA9IC0xNVxuICBhdWRpb05vZGVzLmNvbXByZXNzb3Iua25lZS52YWx1ZSA9IDMzXG4gIGF1ZGlvTm9kZXMuY29tcHJlc3Nvci5yYXRpby52YWx1ZSA9IDVcbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLnJlZHVjdGlvbi52YWx1ZSA9IC0xMFxuICBhdWRpb05vZGVzLmNvbXByZXNzb3IuYXR0YWNrLnZhbHVlID0gMC4wMDVcbiAgYXVkaW9Ob2Rlcy5jb21wcmVzc29yLnJlbGVhc2UudmFsdWUgPSAwLjE1MFxuXG4gIGF1ZGlvTm9kZXMuZGlzdG9ydGlvbi5jdXJ2ZSA9IG1ha2VEaXN0b3J0aW9uQ3VydmUoMjIyKVxuXG4gIGF1ZGlvTm9kZXMubWFpbkZpbHRlci50eXBlID0gJ3BlYWtpbmcnXG4gIGF1ZGlvTm9kZXMubWFpbkZpbHRlci5mcmVxdWVuY3kudmFsdWUgPSAyNTBcbiAgYXVkaW9Ob2Rlcy5tYWluRmlsdGVyLmdhaW4udmFsdWUgPSAxLjVcbiAgYXVkaW9Ob2Rlcy5tYWluRmlsdGVyLlEudmFsdWUgPSAyNVxuLy8gc3RhcnQgaXQgdXBcbiAgYXVkaW9Ob2Rlcy52b2x1bWUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhYy5jdXJyZW50VGltZSlcbiAgYXVkaW9Ob2Rlcy5vc2Muc3RhcnQoYWMuY3VycmVudFRpbWUpXG4gIGF1ZGlvTm9kZXMubm9pc2Uuc3RhcnQoYWMuY3VycmVudFRpbWUpXG4vLyBjb25uZWN0IHRoZSBncmFwaFxuICBhdWRpb05vZGVzLm5vaXNlLmNvbm5lY3QoYXVkaW9Ob2Rlcy5ub2lzZUZpbHRlcilcbiAgYXVkaW9Ob2Rlcy5ub2lzZUZpbHRlci5jb25uZWN0KGF1ZGlvTm9kZXMubm9pc2VFbnZlbG9wZSlcbiAgYXVkaW9Ob2Rlcy5vc2MuY29ubmVjdChhdWRpb05vZGVzLm9zY0VudmVsb3BlKVxuICBhdWRpb05vZGVzLm5vaXNlRW52ZWxvcGUuY29ubmVjdChhdWRpb05vZGVzLmNvbXByZXNzb3IpXG4gIGF1ZGlvTm9kZXMub3NjRW52ZWxvcGUuY29ubmVjdChhdWRpb05vZGVzLmNvbXByZXNzb3IpXG4gIGF1ZGlvTm9kZXMuY29tcHJlc3Nvci5jb25uZWN0KGF1ZGlvTm9kZXMuZGlzdG9ydGlvbilcbiAgYXVkaW9Ob2Rlcy5kaXN0b3J0aW9uLmNvbm5lY3QoYXVkaW9Ob2Rlcy5tYWluRmlsdGVyKVxuICBhdWRpb05vZGVzLm1haW5GaWx0ZXIuY29ubmVjdChhdWRpb05vZGVzLnZvbHVtZSlcbi8vIFJFQURZIDIgcmV0dXJuIFRISVMgVEhJTkcgQikgKk5JQ0UqXG4gIHJldHVybiB7XG4gICAgY29ubmVjdDogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICBhdWRpb05vZGVzLnZvbHVtZS5jb25uZWN0KGlucHV0KVxuICAgIH0sXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICh3aGVuKSB7XG4gICAgICBhZHNyKGF1ZGlvTm9kZXMubm9pc2VFbnZlbG9wZSwgd2hlbiwgbWFrZUFEU1IoJ25vaXNlJywgYXVkaW9Ob2Rlcy5zZXR0aW5ncykpXG4gICAgICBhZHNyKGF1ZGlvTm9kZXMub3NjRW52ZWxvcGUsIHdoZW4sIG1ha2VBRFNSKCd0cmknLCBhdWRpb05vZGVzLnNldHRpbmdzKSlcbiAgICAgIGF1ZGlvTm9kZXMub3NjLmZyZXF1ZW5jeS5zZXRWYWx1ZUF0VGltZShhdWRpb05vZGVzLnNldHRpbmdzLmZyZXEsIHRpbWUpXG4gICAgfSxcbiAgICBzdG9wOiBmdW5jdGlvbiAod2hlbikge1xuICAgICAgYXVkaW9Ob2Rlcy5vc2Muc3RvcCh3aGVuKVxuICAgIH0sXG4gICAgdXBkYXRlOiBmdW5jdGlvbiAob3B0cykge1xuICAgICAgT2JqZWN0LmtleXMob3B0cykuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuICAgICAgICBhdWRpb05vZGVzLnNldHRpbmdzW2tdID0gb3B0c1trXVxuICAgICAgfSlcbiAgICB9LFxuICAgIG5vZGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gYXVkaW9Ob2Rlc1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQURTUiAodHlwZSwgc2V0dGluZ3MpIHtcbiAgT2JqZWN0LmtleXMoc2V0dGluZ3MpLmZpbHRlcihmdW5jdGlvbiAoaykge1xuICAgIHJldHVybiAhIWsubWF0Y2godHlwZSlcbiAgfSkubWFwKGZ1bmN0aW9uIChrKSB7XG4gICAgcmV0dXJuIGsucmVwbGFjZSh0eXBlLCAnJylcbiAgfSkucmVkdWNlKGZ1bmN0aW9uIChvLCBrKSB7XG4gICAgb1trXSA9IHNldHRpbmdzW3R5cGUgKyBrXVxuICAgIHJldHVybiBvXG4gIH0sIHt9KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZ2Fpbk5vZGUsIHdoZW4sIGFkc3IpIHtcbiAgZ2Fpbk5vZGUuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKGFkc3IucGVhaywgd2hlbiArIGFkc3IuYXR0YWNrKVxuICBnYWluTm9kZS5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoYWRzci5taWQsIHdoZW4gKyBhZHNyLmF0dGFjayArIGFkc3IuZGVjYXkpXG4gIGdhaW5Ob2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoYWRzci5taWQsIHdoZW4gKyBhZHNyLnN1c3RhaW4gKyBhZHNyLmF0dGFjayArIGFkc3IuZGVjYXkpXG4gIGdhaW5Ob2RlLmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZShhZHNyLmVuZCwgd2hlbiArIGFkc3Iuc3VzdGFpbiArIGFkc3IuYXR0YWNrICsgYWRzci5kZWNheSArIGFkc3IucmVsZWFzZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYW1vdW50KSB7XG4gIHZhciBrID0gdHlwZW9mIGFtb3VudCA9PT0gJ251bWJlcicgPyBhbW91bnQgOiA1MCxcbiAgICBuX3NhbXBsZXMgPSA0NDEwMCxcbiAgICBjdXJ2ZSA9IG5ldyBGbG9hdDMyQXJyYXkobl9zYW1wbGVzKSxcbiAgICBkZWcgPSBNYXRoLlBJIC8gMTgwLFxuICAgIGkgPSAwLFxuICAgIHg7XG4gIGZvciAoIDsgaSA8IG5fc2FtcGxlczsgKytpICkge1xuICAgIHggPSBpICogMiAvIG5fc2FtcGxlcyAtIDE7XG4gICAgY3VydmVbaV0gPSAoIDMgKyBrICkgKiB4ICogMjAgKiBkZWcgLyAoIE1hdGguUEkgKyBrICogTWF0aC5hYnMoeCkgKTtcbiAgfVxuICByZXR1cm4gY3VydmU7XG59XG4iXX0=
