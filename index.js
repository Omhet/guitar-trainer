import { Player } from './player.js';

var userAnalyser;
const FFTSIZE = 2048 * 4;

const Pitchfinder = require("pitchfinder");
const detectPitch = Pitchfinder.AMDF();

async function init() {
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

    userAnalyser = context.createAnalyser();
    userAnalyser.fftSize = FFTSIZE;
    userAnalyser.smoothingTimeConstant = 0.1;

    const gainNodeL = context.createGain();
    const gainNodeR = context.createGain();
    const merger = context.createChannelMerger(2);

    lineInSource.connect(userAnalyser);
    userAnalyser.connect(gainNodeL);
    userAnalyser.connect(gainNodeR);

    gainNodeL.connect(merger, 0, 0);
    gainNodeR.connect(merger, 0, 1);
    const gain = 20;
    gainNodeL.gain.setTargetAtTime(gain, context.currentTime, 0.01);
    gainNodeR.gain.setTargetAtTime(gain, context.currentTime, 0.01);

    merger.connect(context.destination);
}

document.getElementById('start').addEventListener('click', init);
const progress = document.getElementById('progress');


const player = new Player(handleUpdate);

let all = 0;
let success = 0;
let res = 0;
const userTimeBuffer = new Float32Array(FFTSIZE);

function handleUpdate(refPitch) {
    userAnalyser.getFloatTimeDomainData(userTimeBuffer);
    const userPitch = detectPitch(userTimeBuffer);

    if (refPitch !== null) {
        if (userPitch !== null) {
            const diff = Math.abs(refPitch - userPitch);

            if (diff < 6) {
                success++;
                console.log({ res, all, success, diff, userPitch });

            }
        }

        all++;
        res = (success / all) * 100;
        progress.value = res;
    }
}

const playBtn = document.getElementById('play');
playBtn.addEventListener('click', () => {
    player.playSequence();
});
