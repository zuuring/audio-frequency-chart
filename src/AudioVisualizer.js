import React, { useRef, useEffect, useState } from 'react';
import Meyda from 'meyda';
import { LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Line } from 'recharts';

const MicrophoneVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const [volumeData, setVolumeData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 200;

    let audioContext = null;
    let analyzer = null;

    const startRecording = () => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(stream);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 10;

          source.connect(gainNode);

          const bufferSize = 2048;

          analyzer = Meyda.createMeydaAnalyzer({
            audioContext: audioContext,
            source: gainNode,
            bufferSize: bufferSize,
            featureExtractors: ['rms', 'amplitudeSpectrum'],
            callback: (features) => {
              const rms = features.rms;
              const frequency = getFrequencyFromSpectrum(features.amplitudeSpectrum, audioContext.sampleRate);

              setVolumeData((prevData) => [
                ...prevData,
                { time: Date.now(), volume: rms },
              ]);

              setFrequencyData((prevData) => [
                ...prevData,
                { time: Date.now(), frequency: frequency },
              ]);

              ctx.fillStyle = 'grey';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              const barHeight = rms * canvas.height;
              ctx.fillStyle = 'blue';
              ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
            },
          });

          audioContextRef.current = audioContext;
          analyzerRef.current = analyzer;
          analyzer.start();
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    };

    const stopRecording = () => {
      if (analyzerRef.current) {
        analyzerRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      stopRecording();
    };
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const getFrequencyFromSpectrum = (spectrum, sampleRate) => {
    const maxAmplitude = Math.max(...spectrum);
    const index = spectrum.findIndex((value) => value === maxAmplitude);
    const frequency = index * (sampleRate / spectrum.length);
    return frequency.toFixed(2);
  };

  return (
    <div style={{ padding: '2em' }}>
      <div style={{ float: 'right' }}>
        <h2>Mic levels</h2>
        <canvas ref={canvasRef} />
      </div>
      <div>
        <button onClick={handleStartRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={handleStopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
      <h2>Recorded Volume</h2>
      <LineChart
        width={980}
        height={300}
        data={volumeData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <XAxis dataKey="time" label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: 0 }} />
        <YAxis label={{ value: 'Volume', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <CartesianGrid stroke="#f5f5f5" />
        <Line type="monotone" dataKey="volume" stroke="#ff7300" yAxisId={0} />
      </LineChart>
      <h2>Detected Frequency (Hz)</h2>
      <LineChart
        width={980}
        height={300}
        data={frequencyData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <XAxis dataKey="time" label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: 0 }} />
        <YAxis label={{ value: 'Frequency (Hz)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <CartesianGrid stroke="#f5f5f5" />
        <Line type="monotone" dataKey="frequency" stroke="#00ff00" yAxisId={0} />
      </LineChart>
    </div>
  );
};

export default MicrophoneVisualizer;
