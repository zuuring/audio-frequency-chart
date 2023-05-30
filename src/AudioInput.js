import React, { useState, useEffect } from 'react';

const AudioInputNote = () => {
    const [data, setData] = useState([]);

    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const frequencyToNote = (frequency) => {
        let h = Math.round(12 * (Math.log(frequency / 440) / Math.log(2)));
        return noteStrings[h % 12];
    }

    useEffect(() => {
        var source;
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var analyser = audioContext.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (!navigator?.mediaDevices?.getUserMedia) {
            alert('Sorry, getUserMedia is required for the app.')
            return;
        } else {
            var constraints = { audio: true };
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function (stream) {
                    source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);

                    const interval = setInterval(() => {
                        analyser.getByteFrequencyData(dataArray);
                        let maxIndex = dataArray.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
                        let freq = maxIndex * audioContext.sampleRate / (analyser.fftSize * 2);
                        setData(prev => [...prev, { time: prev.length + 1, note: frequencyToNote(freq), frequency: freq }]);
                    }, 1000);

                    return () => clearInterval(interval);
                })
                .catch(function (err) {
                    alert('Sorry, microphone permissions are required for the app. Feel free to read on without playing :)')
                });
        }
    }, []);

    return (
        <div>
            <h2>Recorded Notes and Frequency</h2>
            {data.map((item, index) => (
                <p key={index}>
                    Second {item.time}: {item.note} ({item.frequency.toFixed(2)} Hz)
                </p>
            ))}
        </div>
    );
};

export default AudioInputNote;
