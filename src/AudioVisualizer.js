import React, { useRef, useEffect, useState } from 'react';
import Meyda from 'meyda';
import { LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Line } from 'recharts';

const MicrophoneVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const [volumeData, setVolumeData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [audioSource, setAudioSource] = useState('microphone');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const audioElementRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 400;
    canvas.height = 200;

    let audioContext = null;
    let analyzer = null;

    const startRecording = () => {
      audioContext = new AudioContext({ sampleRate: 44100 });
      let source;

      if (audioSource === 'microphone') {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            source = audioContext.createMediaStreamSource(stream);
            setupAnalyzer(source);
          })
          .catch((error) => {
            console.error('Error accessing microphone:', error);
          });
      } else if (audioSource === 'file') {
        source = audioContext.createMediaElementSource(audioElementRef.current);
        setupAnalyzer(source);
      }
    };

    const setupAnalyzer = (source) => {
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
    };

    const stopRecording = () => {
      if (analyzerRef.current) {
        analyzerRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
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
  }, [isRecording, audioSource]);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        audioElementRef.current.src = reader.result;
        audioElementRef.current.play();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSourceChange = (e) => {
    setAudioSource(e.target.value);
  };

  const getFrequencyFromSpectrum = (spectrum, sampleRate) => {
    const positiveSpectrum = spectrum.slice(0, spectrum.length / 2);
    const maxAmplitude = Math.max(...positiveSpectrum);
    const index = positiveSpectrum.findIndex((value) => value === maxAmplitude);
    const frequency = index * (sampleRate / (2 * spectrum.length));
    return frequency.toFixed(2);
};

  return (
    <div style={{ padding: '2em' }}>
      <div style={{ float: 'right' }}>
        <h2>Mic levels</h2>
        <canvas ref={canvasRef} />
      </div>
      <div>
        <select value={audioSource} onChange={handleSourceChange}>
          <option value="microphone">Microphone</option>
          <option value="file">Audio Source</option>
        </select>
        <button onClick={handleStartRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={handleStopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
      <h2>Audio Source</h2>
      <input type="file" accept=".mp3" onChange={handleFileChange} ref={fileInputRef} />
      <audio controls ref={audioElementRef} style={{ marginTop: '1rem' }} />
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
