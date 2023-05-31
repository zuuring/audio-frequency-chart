import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AudioInputNote = () => {
    const [data, setData] = useState([]);
    const [recording, setRecording] = useState(false);
    const intervalRef = useRef(null);

    const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const frequencyToNote = (frequency) => {
        let h = Math.round(12 * (Math.log(frequency / 440) / Math.log(2)));
        return noteStrings[h % 12];
    }

    const startRecording = () => {
        setRecording(true);
    }

    const pauseRecording = () => {
        setRecording(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }

    useEffect(() => {
        if (!recording) {
            return;
        }

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

                    intervalRef.current = setInterval(() => {
                        analyser.getByteFrequencyData(dataArray);
                        let maxIndex = dataArray.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
                        let freq = maxIndex * audioContext.sampleRate / (analyser.fftSize * 2);

                        // Calculate the RMS value for volume
                        let sum = dataArray.reduce((a, b) => a + b, 0);
                        let rms = Math.sqrt(sum / bufferLength);
                        setData(prev => [...prev, { time: prev.length + 1, note: frequencyToNote(freq), frequency: freq, volume: rms }]);
                    }, 100);
                })
                .catch(function (err) {
                    alert('Sorry, microphone permissions are required for the app. Feel free to read on without playing :)')
                });
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [recording]);

    return (
        <div>
            <h2>Recorded Frequency</h2>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={pauseRecording}>Pause Recording</button>
            <LineChart
                width={980}
                height={300}
                data={data}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
                <XAxis dataKey="time" label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <CartesianGrid stroke="#f5f5f5" />
                <Line type="monotone" dataKey="frequency" stroke="#ff7300" yAxisId={0} />
            </LineChart>
            <h2>Recorded Volume</h2>
            <LineChart
                width={980}
                height={300}
                data={data}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
                <XAxis dataKey="time" label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: 0 }} />
                <YAxis label={{ value: 'Volume', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <CartesianGrid stroke="#f5f5f5" />
                <Line type="monotone" dataKey="volume" stroke="#ff7300" yAxisId={0} />
            </LineChart>
        </div>
    );
};

export default AudioInputNote;
