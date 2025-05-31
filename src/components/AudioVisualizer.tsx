import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioLevel, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!isRecording) {
      // Draw idle state
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
      return;
    }
    
    // Draw audio level visualization
    const barWidth = 4;
    const barGap = 2;
    const totalBars = Math.floor(canvas.width / (barWidth + barGap));
    const centerY = canvas.height / 2;
    
    for (let i = 0; i < totalBars; i++) {
      // Calculate bar height based on position and audio level
      // Create a wave-like pattern
      const barPosition = i / totalBars;
      const positionFactor = Math.sin(barPosition * Math.PI * 4 + Date.now() / 200);
      const heightFactor = Math.max(0.1, audioLevel);
      const barHeight = Math.abs(positionFactor) * heightFactor * (canvas.height / 2 - 4);
      
      // Calculate bar color based on audio level
      const hue = 200 - audioLevel * 120; // Blue to red
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      
      // Draw bar (mirrored)
      ctx.fillRect(
        i * (barWidth + barGap),
        centerY - barHeight,
        barWidth,
        barHeight
      );
      
      ctx.fillRect(
        i * (barWidth + barGap),
        centerY,
        barWidth,
        barHeight
      );
    }
  }, [audioLevel, isRecording]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 bg-slate-900 rounded-md"
      width={600}
      height={100}
    />
  );
};

export default AudioVisualizer;
