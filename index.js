const Pitchfinder = require("pitchfinder");
const detectPitch = Pitchfinder.AMDF();

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

async function init() {
    const FFTSIZE = 2048 * 4;
    const context = new AudioContext();

    if (context.state === 'suspended') {
        await context.resume();
    }

    const stream = await navigator.mediaDevices
        .getUserMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
                latency: 0
            }
        });
    const lineInSource = context.createMediaStreamSource(stream);

    const analyser = context.createAnalyser();
    analyser.fftSize = FFTSIZE;
    analyser.smoothingTimeConstant = 0.1;
    const timeBuffer = new Float32Array(FFTSIZE);

    const gainNodeL = context.createGain();
    const gainNodeR = context.createGain();
    const merger = context.createChannelMerger(2);

    lineInSource.connect(analyser);
    analyser.connect(gainNodeL);
    analyser.connect(gainNodeR);

    gainNodeL.connect(merger, 0, 0);
    gainNodeR.connect(merger, 0, 1);
    const gain = 20;
    gainNodeL.gain.setTargetAtTime(gain, context.currentTime, 0.01);
    gainNodeR.gain.setTargetAtTime(gain, context.currentTime, 0.01);

    merger.connect(context.destination);


    function update() {
        requestAnimationFrame(update);

        analyser.getFloatTimeDomainData(timeBuffer);
        const pitch = detectPitch(timeBuffer); // null if pitch cannot be identified

        if (pitch !== null) {
            const noteNum = noteFromPitch(pitch);
            const note = noteStrings[noteNum % 12];
            console.log({ pitch, note })
        }

    }

    update();
}

function noteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
}


document.querySelector('button').addEventListener('click', init);

