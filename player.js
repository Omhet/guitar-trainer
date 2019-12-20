
import Tone, { Sampler } from 'tone';
import { Midi } from '@tonejs/midi';

const Pitchfinder = require("pitchfinder");
const detectPitch = Pitchfinder.AMDF();

const sampler = new Sampler({
    "E2": "./samples/E2.wav",
    "E4": "./samples/E4.wav",
    "A3": "./samples/A3.wav",
    "B2": "./samples/B2.wav",
    "B3": "./samples/B3.wav",
    "B4": "./samples/B4.wav",
    "D3": "./samples/D3.wav",
    "F2": "./samples/F2.wav",
    "C#3": "./samples/Csharp3.wav",
}).connect(Tone.Master);

export class Player {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
    }

    playSequence() {
        console.log(this.onUpdate)

        const readMidi = async () => {
            const midi = await Midi.fromUrl("./midi/train.mid");
            console.log(midi);
            const now = Tone.now() + 1;
            const track = midi.tracks[0];
            console.log(track);
            const notes = track.notes;

            notes.forEach(note => {
                sampler.triggerAttackRelease(note.name, note.duration, note.time + now, note.velocity)
            })


            const FFTSIZE = 2048 * 4;
            const refAnalyser = sampler.context.createAnalyser();
            refAnalyser.fftSize = FFTSIZE;
            refAnalyser.smoothingTimeConstant = 0.1;
            const refTimeBuffer = new Float32Array(FFTSIZE);

            sampler.connect(refAnalyser);



            const update = () => {
                requestAnimationFrame(update);

                refAnalyser.getFloatTimeDomainData(refTimeBuffer);
                const refPitch = detectPitch(refTimeBuffer);

                this.onUpdate(refPitch);
            }
            update();

        }
        readMidi();
    }
}