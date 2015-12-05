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
