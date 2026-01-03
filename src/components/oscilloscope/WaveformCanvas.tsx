import React, { useRef, useEffect, useCallback } from 'react';
import type { CursorSettings } from './CursorPanel';

interface WaveformCanvasProps {
  data: number[];
  divisions: number;
  voltsPerDivision: number;
  verticalOffset: number;
  triggerLevel: number;
  showGrid: boolean;
  showTrigger: boolean;
  traceColor?: string;
  cursorSettings?: CursorSettings;
  timePerDivision?: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  data,
  divisions,
  voltsPerDivision,
  verticalOffset,
  triggerLevel,
  showGrid = true,
  showTrigger = true,
  traceColor = '#00ff88',
  cursorSettings,
  timePerDivision = 0.001,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridColor = 'rgba(100, 100, 100, 0.4)';
    const subGridColor = 'rgba(60, 60, 60, 0.3)';
    const centerLineColor = 'rgba(150, 150, 150, 0.6)';

    ctx.strokeStyle = subGridColor;
    ctx.lineWidth = 0.5;

    // Sub-divisions (5 per division)
    const subDivX = width / (divisions * 5);
    const subDivY = height / (divisions * 5);

    for (let i = 0; i <= divisions * 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * subDivX, 0);
      ctx.lineTo(i * subDivX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * subDivY);
      ctx.lineTo(width, i * subDivY);
      ctx.stroke();
    }

    // Main divisions
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const divX = width / divisions;
    const divY = height / divisions;

    for (let i = 0; i <= divisions; i++) {
      ctx.beginPath();
      ctx.moveTo(i * divX, 0);
      ctx.lineTo(i * divX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * divY);
      ctx.lineTo(width, i * divY);
      ctx.stroke();
    }

    // Center lines
    ctx.strokeStyle = centerLineColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [divisions]);

  const drawTriggerLevel = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const voltsRange = voltsPerDivision * divisions;
    const centerY = height / 2;
    const pixelsPerVolt = height / voltsRange;
    const triggerY = centerY - (triggerLevel + verticalOffset) * pixelsPerVolt;

    ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(0, triggerY);
    ctx.lineTo(width, triggerY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Trigger marker
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, triggerY);
    ctx.lineTo(10, triggerY - 5);
    ctx.lineTo(10, triggerY + 5);
    ctx.closePath();
    ctx.fill();
  }, [triggerLevel, verticalOffset, voltsPerDivision, divisions]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (data.length === 0) return;

    const voltsRange = voltsPerDivision * divisions;
    const centerY = height / 2;
    const pixelsPerVolt = height / voltsRange;
    const pixelsPerPoint = width / data.length;

    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Add glow effect
    ctx.shadowColor = traceColor;
    ctx.shadowBlur = 8;

    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = i * pixelsPerPoint;
      const y = centerY - (data[i] + verticalOffset) * pixelsPerVolt;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [data, voltsPerDivision, divisions, verticalOffset, traceColor]);

  const drawCursors = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!cursorSettings?.enabled) return;

    const totalTime = timePerDivision * divisions;
    const totalVolts = voltsPerDivision * divisions;

    // Time cursor colors (cyan)
    const timeCursorColor1 = 'rgba(34, 211, 238, 0.9)';
    const timeCursorColor2 = 'rgba(34, 211, 238, 0.6)';

    // Voltage cursor colors (pink)
    const voltCursorColor1 = 'rgba(244, 114, 182, 0.9)';
    const voltCursorColor2 = 'rgba(244, 114, 182, 0.6)';

    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Draw vertical cursors (time)
    const x1 = cursorSettings.x1 * width;
    const x2 = cursorSettings.x2 * width;

    ctx.strokeStyle = timeCursorColor1;
    ctx.beginPath();
    ctx.moveTo(x1, 0);
    ctx.lineTo(x1, height);
    ctx.stroke();

    ctx.strokeStyle = timeCursorColor2;
    ctx.beginPath();
    ctx.moveTo(x2, 0);
    ctx.lineTo(x2, height);
    ctx.stroke();

    // Draw horizontal cursors (voltage)
    const y1 = cursorSettings.y1 * height;
    const y2 = cursorSettings.y2 * height;

    ctx.strokeStyle = voltCursorColor1;
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(width, y1);
    ctx.stroke();

    ctx.strokeStyle = voltCursorColor2;
    ctx.beginPath();
    ctx.moveTo(0, y2);
    ctx.lineTo(width, y2);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw labels
    ctx.font = '11px monospace';
    
    // T1 label
    ctx.fillStyle = timeCursorColor1;
    ctx.fillText('T1', x1 + 4, 14);
    
    // T2 label
    ctx.fillStyle = timeCursorColor2;
    ctx.fillText('T2', x2 + 4, 28);
    
    // V1 label
    ctx.fillStyle = voltCursorColor1;
    ctx.fillText('V1', width - 24, y1 - 4);
    
    // V2 label
    ctx.fillStyle = voltCursorColor2;
    ctx.fillText('V2', width - 24, y2 - 4);

    // Draw delta shading
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.fillRect(Math.min(x1, x2), 0, Math.abs(x2 - x1), height);

    ctx.fillStyle = 'rgba(244, 114, 182, 0.05)';
    ctx.fillRect(0, Math.min(y1, y2), width, Math.abs(y2 - y1));

  }, [cursorSettings, timePerDivision, voltsPerDivision, divisions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw layers
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    if (showTrigger) {
      drawTriggerLevel(ctx, width, height);
    }

    drawWaveform(ctx, width, height);
    drawCursors(ctx, width, height);
  }, [data, showGrid, showTrigger, cursorSettings, drawGrid, drawTriggerLevel, drawWaveform, drawCursors]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-oscilloscope-screen rounded-lg overflow-hidden border border-border/50"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
