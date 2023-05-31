import React, { useRef, useEffect } from 'react';
import Meyda from 'meyda';

const MicrophoneVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 200;
    canvas.height = 300;



    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 10; // Increase the gain value as needed
        source.connect(gainNode);
        const analyzer = Meyda.createMeydaAnalyzer({
          audioContext: audioContext,
          source: gainNode,
          bufferSize: 2048,
          featureExtractors: ['rms'],
          callback: (features) => {
            const rms = features.rms;
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

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      <h2>Microphone Levels</h2>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default MicrophoneVisualizer;
