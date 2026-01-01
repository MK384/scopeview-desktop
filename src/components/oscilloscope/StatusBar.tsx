import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface StatusBarProps {
  isRunning: boolean;
  sampleRate: number;
  timePerDivision: number;
  voltsPerDivision: number;
}

const formatTime = (seconds: number): string => {
  if (seconds >= 1) return `${seconds.toFixed(2)} s`;
  if (seconds >= 0.001) return `${(seconds * 1000).toFixed(2)} ms`;
  if (seconds >= 0.000001) return `${(seconds * 1000000).toFixed(2)} µs`;
  return `${(seconds * 1000000000).toFixed(2)} ns`;
};

const formatSampleRate = (rate: number): string => {
  if (rate >= 1000000) return `${(rate / 1000000).toFixed(1)} MS/s`;
  if (rate >= 1000) return `${(rate / 1000).toFixed(1)} kS/s`;
  return `${rate} S/s`;
};

export const StatusBar: React.FC<StatusBarProps> = ({
  isRunning,
  sampleRate,
  timePerDivision,
  voltsPerDivision,
}) => {
  return (
    <div className="bg-card/80 backdrop-blur border border-border rounded-lg px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isRunning ? 'text-trace animate-pulse' : 'text-muted-foreground'}`} />
          <span className={isRunning ? 'text-trace font-medium' : 'text-muted-foreground'}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-mono">{formatSampleRate(sampleRate)}</span>
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 font-mono text-xs">
        <div>
          <span className="text-muted-foreground">T/div: </span>
          <span className="text-foreground">{formatTime(timePerDivision)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">V/div: </span>
          <span className="text-foreground">
            {voltsPerDivision >= 1 ? `${voltsPerDivision} V` : `${voltsPerDivision * 1000} mV`}
          </span>
        </div>
      </div>
    </div>
  );
};
