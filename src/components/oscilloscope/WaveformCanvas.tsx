import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  onCursorChange?: (settings: CursorSettings) => void;
  timePerDivision?: number;
}

type DragTarget = 'x1' | 'x2' | 'y1' | 'y2' | null;

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
  onCursorChange,
  timePerDivision = 0.001,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoveredCursor, setHoveredCursor] = useState<DragTarget>(null);

  const DRAG_THRESHOLD = 10; // pixels for hit detection

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

    // Time cursor colors (cyan)
    const timeCursorColor1 = hoveredCursor === 'x1' ? 'rgba(34, 211, 238, 1)' : 'rgba(34, 211, 238, 0.9)';
    const timeCursorColor2 = hoveredCursor === 'x2' ? 'rgba(34, 211, 238, 0.85)' : 'rgba(34, 211, 238, 0.6)';

    // Voltage cursor colors (pink)
    const voltCursorColor1 = hoveredCursor === 'y1' ? 'rgba(244, 114, 182, 1)' : 'rgba(244, 114, 182, 0.9)';
    const voltCursorColor2 = hoveredCursor === 'y2' ? 'rgba(244, 114, 182, 0.85)' : 'rgba(244, 114, 182, 0.6)';

    ctx.lineWidth = hoveredCursor ? 2 : 1;
    ctx.setLineDash([4, 4]);

    // Draw vertical cursors (time)
    if (cursorSettings.showVertical) {
      const x1 = cursorSettings.x1 * width;
      const x2 = cursorSettings.x2 * width;

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

      // Draw drag handles for vertical cursors
      ctx.setLineDash([]);
      ctx.fillStyle = timeCursorColor1;
      ctx.beginPath();
      ctx.arc(x1, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = timeCursorColor2;
      ctx.beginPath();
      ctx.arc(x2, 20, 6, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = '11px monospace';
      ctx.fillStyle = timeCursorColor1;
      ctx.fillText('T1', x1 + 10, 24);
      ctx.fillStyle = timeCursorColor2;
      ctx.fillText('T2', x2 + 10, 24);

      // Delta shading
      ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.fillRect(Math.min(x1, x2), 0, Math.abs(x2 - x1), height);
      
      ctx.setLineDash([4, 4]);
    }

    // Draw horizontal cursors (voltage)
    if (cursorSettings.showHorizontal) {
      const y1 = cursorSettings.y1 * height;
      const y2 = cursorSettings.y2 * height;

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

      // Draw drag handles for horizontal cursors
      ctx.setLineDash([]);
      ctx.fillStyle = voltCursorColor1;
      ctx.beginPath();
      ctx.arc(width - 20, y1, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = voltCursorColor2;
      ctx.beginPath();
      ctx.arc(width - 20, y2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.font = '11px monospace';
      ctx.fillStyle = voltCursorColor1;
      ctx.fillText('V1', width - 44, y1 - 8);
      ctx.fillStyle = voltCursorColor2;
      ctx.fillText('V2', width - 44, y2 - 8);

      // Delta shading
      ctx.fillStyle = 'rgba(244, 114, 182, 0.05)';
      ctx.fillRect(0, Math.min(y1, y2), width, Math.abs(y2 - y1));
    }

    ctx.setLineDash([]);
  }, [cursorSettings, hoveredCursor]);

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
      // Update cursor position while dragging
      const newSettings = { ...cursorSettings };
      
      if (dragTarget === 'x1' || dragTarget === 'x2') {
        const normalizedX = Math.max(0, Math.min(1, mouseX / rect.width));
        newSettings[dragTarget] = normalizedX;
      } else if (dragTarget === 'y1' || dragTarget === 'y2') {
        const normalizedY = Math.max(0, Math.min(1, mouseY / rect.height));
        newSettings[dragTarget] = normalizedY;
      }

      onCursorChange(newSettings);
    } else {
      // Update hover state
      const target = findCursorAtPosition(mouseX, mouseY, rect.width, rect.height);
      setHoveredCursor(target);
    }
  }, [cursorSettings, dragTarget, onCursorChange, findCursorAtPosition]);

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

    drawWaveform(ctx, width, height);
    drawCursors(ctx, width, height);
  }, [data, showGrid, showTrigger, cursorSettings, hoveredCursor, drawGrid, drawTriggerLevel, drawWaveform, drawCursors]);

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
