import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { CursorSettings } from './CursorPanel';
import type { TriggerEdge, ChannelSettings } from '@/hooks/useWaveformGenerator';

interface ChannelData {
  data: number[];
  settings: ChannelSettings;
  traceColor: string;
  glowColor: string;
}

interface WaveformCanvasProps {
  channel1Data: ChannelData;
  channel2Data: ChannelData;
  divisions: number;
  triggerLevel: number;
  showGrid: boolean;
  showTrigger: boolean;
  cursorSettings?: CursorSettings;
  onCursorChange?: (settings: CursorSettings) => void;
  timePerDivision?: number;
  triggerEdge?: TriggerEdge;
  triggerSource?: 'ch1' | 'ch2';
}

type DragTarget = 'x1' | 'x2' | 'y1' | 'y2' | null;

const formatTime = (seconds: number): string => {
  if (Math.abs(seconds) >= 1) return `${seconds.toFixed(2)}s`;
  if (Math.abs(seconds) >= 0.001) return `${(seconds * 1000).toFixed(2)}ms`;
  return `${(seconds * 1000000).toFixed(2)}µs`;
};

const formatVoltage = (volts: number): string => {
  if (Math.abs(volts) >= 1) return `${volts.toFixed(2)}V`;
  return `${(volts * 1000).toFixed(2)}mV`;
};

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  channel1Data,
  channel2Data,
  divisions,
  triggerLevel,
  showGrid = true,
  showTrigger = true,
  cursorSettings,
  onCursorChange,
  timePerDivision = 0.001,
  triggerEdge = 'rising',
  triggerSource = 'ch1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoveredCursor, setHoveredCursor] = useState<DragTarget>(null);

  const DRAG_THRESHOLD = 10;
  const SNAP_RADIUS = 15; // pixels for snap detection

  // Use active channel for cursor snapping
  const activeChannelData = channel1Data.settings.enabled ? channel1Data : channel2Data;
  const data = activeChannelData.data;
  const voltsPerDivision = activeChannelData.settings.voltsPerDivision;
  const verticalOffset = activeChannelData.settings.verticalOffset;

  // Find peaks and valleys in waveform data
  const findPeaksAndValleys = useCallback((data: number[]): { peaks: number[]; valleys: number[] } => {
    const peaks: number[] = [];
    const valleys: number[] = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      } else if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        valleys.push(i);
      }
    }
    
    return { peaks, valleys };
  }, []);

  // Snap to nearest peak or valley
  const snapToWaveform = useCallback((normalizedX: number, width: number): number => {
    if (data.length === 0) return normalizedX;
    
    const { peaks, valleys } = findPeaksAndValleys(data);
    const allPoints = [...peaks, ...valleys];
    
    const mouseXPixel = normalizedX * width;
    const pixelsPerPoint = width / data.length;
    
    let closestPoint = -1;
    let closestDistance = Infinity;
    
    for (const pointIndex of allPoints) {
      const pointXPixel = pointIndex * pixelsPerPoint;
      const distance = Math.abs(mouseXPixel - pointXPixel);
      
      if (distance < closestDistance && distance < SNAP_RADIUS) {
        closestDistance = distance;
        closestPoint = pointIndex;
      }
    }
    
    if (closestPoint >= 0) {
      return closestPoint / data.length;
    }
    
    return normalizedX;
  }, [data, findPeaksAndValleys, SNAP_RADIUS]);

  // Snap horizontal cursor to waveform voltage
  const snapToWaveformVoltage = useCallback((normalizedY: number, height: number): number => {
    if (data.length === 0) return normalizedY;
    
    const voltsRange = voltsPerDivision * divisions;
    const centerY = height / 2;
    const pixelsPerVolt = height / voltsRange;
    
    // Get all unique voltage values from peaks and valleys
    const { peaks, valleys } = findPeaksAndValleys(data);
    const significantPoints = [...peaks, ...valleys];
    
    const mouseYPixel = normalizedY * height;
    
    let closestY = -1;
    let closestDistance = Infinity;
    
    for (const pointIndex of significantPoints) {
      const voltage = data[pointIndex];
      const yPixel = centerY - (voltage + verticalOffset) * pixelsPerVolt;
      const distance = Math.abs(mouseYPixel - yPixel);
      
      if (distance < closestDistance && distance < SNAP_RADIUS) {
        closestDistance = distance;
        closestY = yPixel / height;
      }
    }
    
    if (closestY >= 0) {
      return closestY;
    }
    
    return normalizedY;
  }, [data, voltsPerDivision, divisions, verticalOffset, findPeaksAndValleys, SNAP_RADIUS]);

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
    // Use trigger source channel for positioning
    const triggerChannelSettings = triggerSource === 'ch1' ? channel1Data.settings : channel2Data.settings;
    const triggerVoltsPerDiv = triggerChannelSettings.voltsPerDivision;
    const triggerVerticalOffset = triggerChannelSettings.verticalOffset;
    
    const voltsRange = triggerVoltsPerDiv * divisions;
    const centerY = height / 2;
    const pixelsPerVolt = height / voltsRange;
    const triggerY = centerY - (triggerLevel + triggerVerticalOffset) * pixelsPerVolt;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(0, triggerY);
    ctx.lineTo(width, triggerY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Trigger marker with edge direction indicator
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, triggerY);
    ctx.lineTo(12, triggerY - 6);
    ctx.lineTo(12, triggerY + 6);
    ctx.closePath();
    ctx.fill();

    // Edge direction arrow
    ctx.strokeStyle = 'rgba(239, 68, 68, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (triggerEdge === 'rising') {
      ctx.moveTo(16, triggerY + 8);
      ctx.lineTo(16, triggerY - 8);
      ctx.moveTo(12, triggerY - 4);
      ctx.lineTo(16, triggerY - 8);
      ctx.lineTo(20, triggerY - 4);
    } else {
      ctx.moveTo(16, triggerY - 8);
      ctx.lineTo(16, triggerY + 8);
      ctx.moveTo(12, triggerY + 4);
      ctx.lineTo(16, triggerY + 8);
      ctx.lineTo(20, triggerY + 4);
    }
    ctx.stroke();
  }, [triggerLevel, channel1Data.settings, channel2Data.settings, triggerSource, divisions, triggerEdge]);

  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    channelData: ChannelData
  ) => {
    if (channelData.data.length === 0 || !channelData.settings.enabled) return;

    const { data: chData, settings, traceColor, glowColor } = channelData;
    const voltsRange = settings.voltsPerDivision * divisions;
    const centerY = height / 2;
    const pixelsPerVolt = height / voltsRange;
    const pixelsPerPoint = width / chData.length;

    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Add glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;

    ctx.beginPath();

    for (let i = 0; i < chData.length; i++) {
      const x = i * pixelsPerPoint;
      const y = centerY - (chData[i] + settings.verticalOffset) * pixelsPerVolt;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [divisions]);

  const drawCursors = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!cursorSettings?.enabled) return;

    const timeCursorColor1 = hoveredCursor === 'x1' ? 'rgba(34, 211, 238, 1)' : 'rgba(34, 211, 238, 0.9)';
    const timeCursorColor2 = hoveredCursor === 'x2' ? 'rgba(34, 211, 238, 0.85)' : 'rgba(34, 211, 238, 0.6)';
    const voltCursorColor1 = hoveredCursor === 'y1' ? 'rgba(244, 114, 182, 1)' : 'rgba(244, 114, 182, 0.9)';
    const voltCursorColor2 = hoveredCursor === 'y2' ? 'rgba(244, 114, 182, 0.85)' : 'rgba(244, 114, 182, 0.6)';

    const totalTime = timePerDivision * divisions;
    const voltsRange = voltsPerDivision * divisions;

    ctx.setLineDash([4, 4]);

    // Draw vertical cursors (time)
    if (cursorSettings.showVertical) {
      const x1 = cursorSettings.x1 * width;
      const x2 = cursorSettings.x2 * width;
      const t1 = cursorSettings.x1 * totalTime;
      const t2 = cursorSettings.x2 * totalTime;
      const deltaT = Math.abs(t2 - t1);

      ctx.strokeStyle = timeCursorColor1;
      ctx.lineWidth = hoveredCursor === 'x1' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, height);
      ctx.stroke();

      ctx.strokeStyle = timeCursorColor2;
      ctx.lineWidth = hoveredCursor === 'x2' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, height);
      ctx.stroke();

      // Drag handles
      ctx.setLineDash([]);
      ctx.fillStyle = timeCursorColor1;
      ctx.beginPath();
      ctx.arc(x1, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = timeCursorColor2;
      ctx.beginPath();
      ctx.arc(x2, 20, 6, 0, Math.PI * 2);
      ctx.fill();

      // T1 and T2 labels with values
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = timeCursorColor1;
      ctx.fillText(`T1: ${formatTime(t1)}`, x1 + 10, 40);
      ctx.fillStyle = timeCursorColor2;
      ctx.fillText(`T2: ${formatTime(t2)}`, x2 + 10, 40);

      // Delta T line (grey dashed horizontal line between cursors)
      const deltaY = height * 0.85;
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(Math.min(x1, x2), deltaY);
      ctx.lineTo(Math.max(x1, x2), deltaY);
      ctx.stroke();

      // Arrow heads
      ctx.setLineDash([]);
      const arrowSize = 5;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      
      ctx.fillStyle = 'rgba(150, 150, 150, 0.9)';
      ctx.beginPath();
      ctx.moveTo(minX, deltaY);
      ctx.lineTo(minX + arrowSize, deltaY - arrowSize);
      ctx.lineTo(minX + arrowSize, deltaY + arrowSize);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(maxX, deltaY);
      ctx.lineTo(maxX - arrowSize, deltaY - arrowSize);
      ctx.lineTo(maxX - arrowSize, deltaY + arrowSize);
      ctx.closePath();
      ctx.fill();

      // ΔT and frequency labels
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = 'rgba(200, 200, 200, 1)';
      const frequency = deltaT > 0 ? 1 / deltaT : 0;
      const freqText = frequency >= 1000000 
        ? `${(frequency / 1000000).toFixed(2)}MHz`
        : frequency >= 1000 
          ? `${(frequency / 1000).toFixed(2)}kHz`
          : `${frequency.toFixed(2)}Hz`;
      const deltaTText = `ΔT: ${formatTime(deltaT)}  (${freqText})`;
      const deltaTWidth = ctx.measureText(deltaTText).width;
      ctx.fillText(deltaTText, (minX + maxX) / 2 - deltaTWidth / 2, deltaY - 8);

      // Delta shading
      ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.fillRect(Math.min(x1, x2), 0, Math.abs(x2 - x1), height);
      
      ctx.setLineDash([4, 4]);
    }

    // Draw horizontal cursors (voltage)
    if (cursorSettings.showHorizontal) {
      const y1 = cursorSettings.y1 * height;
      const y2 = cursorSettings.y2 * height;
      const v1 = (0.5 - cursorSettings.y1) * voltsRange;
      const v2 = (0.5 - cursorSettings.y2) * voltsRange;
      const deltaV = Math.abs(v2 - v1);

      ctx.strokeStyle = voltCursorColor1;
      ctx.lineWidth = hoveredCursor === 'y1' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y1);
      ctx.lineTo(width, y1);
      ctx.stroke();

      ctx.strokeStyle = voltCursorColor2;
      ctx.lineWidth = hoveredCursor === 'y2' ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(width, y2);
      ctx.stroke();

      // Drag handles
      ctx.setLineDash([]);
      ctx.fillStyle = voltCursorColor1;
      ctx.beginPath();
      ctx.arc(width - 20, y1, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = voltCursorColor2;
      ctx.beginPath();
      ctx.arc(width - 20, y2, 6, 0, Math.PI * 2);
      ctx.fill();

      // V1 and V2 labels with values
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = voltCursorColor1;
      ctx.fillText(`V1: ${formatVoltage(v1)}`, 10, y1 - 8);
      ctx.fillStyle = voltCursorColor2;
      ctx.fillText(`V2: ${formatVoltage(v2)}`, 10, y2 - 8);

      // Delta V line (grey dashed vertical line between cursors)
      const deltaX = width * 0.15;
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(deltaX, Math.min(y1, y2));
      ctx.lineTo(deltaX, Math.max(y1, y2));
      ctx.stroke();

      // Arrow heads
      ctx.setLineDash([]);
      const arrowSize = 5;
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      ctx.fillStyle = 'rgba(150, 150, 150, 0.9)';
      ctx.beginPath();
      ctx.moveTo(deltaX, minY);
      ctx.lineTo(deltaX - arrowSize, minY + arrowSize);
      ctx.lineTo(deltaX + arrowSize, minY + arrowSize);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(deltaX, maxY);
      ctx.lineTo(deltaX - arrowSize, maxY - arrowSize);
      ctx.lineTo(deltaX + arrowSize, maxY - arrowSize);
      ctx.closePath();
      ctx.fill();

      // ΔV label
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = 'rgba(200, 200, 200, 1)';
      const deltaVText = `ΔV: ${formatVoltage(deltaV)}`;
      ctx.save();
      ctx.translate(deltaX + 12, (minY + maxY) / 2);
      ctx.fillText(deltaVText, 0, 0);
      ctx.restore();

      // Delta shading
      ctx.fillStyle = 'rgba(244, 114, 182, 0.05)';
      ctx.fillRect(0, Math.min(y1, y2), width, Math.abs(y2 - y1));
    }

    ctx.setLineDash([]);
  }, [cursorSettings, hoveredCursor, timePerDivision, divisions, voltsPerDivision]);

  const findCursorAtPosition = useCallback((mouseX: number, mouseY: number, width: number, height: number): DragTarget => {
    if (!cursorSettings?.enabled) return null;

    // Check vertical cursors (time)
    if (cursorSettings.showVertical) {
      const x1 = cursorSettings.x1 * width;
      const x2 = cursorSettings.x2 * width;

      if (Math.abs(mouseX - x1) < DRAG_THRESHOLD) return 'x1';
      if (Math.abs(mouseX - x2) < DRAG_THRESHOLD) return 'x2';
    }

    // Check horizontal cursors (voltage)
    if (cursorSettings.showHorizontal) {
      const y1 = cursorSettings.y1 * height;
      const y2 = cursorSettings.y2 * height;

      if (Math.abs(mouseY - y1) < DRAG_THRESHOLD) return 'y1';
      if (Math.abs(mouseY - y2) < DRAG_THRESHOLD) return 'y2';
    }

    return null;
  }, [cursorSettings, DRAG_THRESHOLD]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !cursorSettings?.enabled || !onCursorChange) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const target = findCursorAtPosition(mouseX, mouseY, rect.width, rect.height);
    if (target) {
      setDragTarget(target);
      e.preventDefault();
    }
  }, [cursorSettings, onCursorChange, findCursorAtPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container || !cursorSettings?.enabled) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (dragTarget && onCursorChange) {
      const newSettings = { ...cursorSettings };
      
      if (dragTarget === 'x1' || dragTarget === 'x2') {
        let normalizedX = Math.max(0, Math.min(1, mouseX / rect.width));
        // Snap to waveform peaks/valleys (if enabled)
        if (cursorSettings.snapToWaveform) {
          normalizedX = snapToWaveform(normalizedX, rect.width);
        }
        newSettings[dragTarget] = normalizedX;
      } else if (dragTarget === 'y1' || dragTarget === 'y2') {
        let normalizedY = Math.max(0, Math.min(1, mouseY / rect.height));
        // Snap to waveform voltage levels (if enabled)
        if (cursorSettings.snapToWaveform) {
          normalizedY = snapToWaveformVoltage(normalizedY, rect.height);
        }
        newSettings[dragTarget] = normalizedY;
      }

      onCursorChange(newSettings);
    } else {
      const target = findCursorAtPosition(mouseX, mouseY, rect.width, rect.height);
      setHoveredCursor(target);
    }
  }, [cursorSettings, dragTarget, onCursorChange, findCursorAtPosition, snapToWaveform, snapToWaveformVoltage]);

  const handleMouseUp = useCallback(() => {
    setDragTarget(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragTarget(null);
    setHoveredCursor(null);
  }, []);

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

    // Draw both channels (CH2 first so CH1 appears on top)
    drawWaveform(ctx, width, height, channel2Data);
    drawWaveform(ctx, width, height, channel1Data);
    drawCursors(ctx, width, height);
  }, [channel1Data, channel2Data, showGrid, showTrigger, cursorSettings, hoveredCursor, drawGrid, drawTriggerLevel, drawWaveform, drawCursors]);

  const cursorStyle = hoveredCursor 
    ? (hoveredCursor === 'x1' || hoveredCursor === 'x2' ? 'ew-resize' : 'ns-resize')
    : 'crosshair';

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-oscilloscope-screen rounded-lg overflow-hidden border border-border/50"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};
