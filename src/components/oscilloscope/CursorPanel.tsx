import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface CursorSettings {
  enabled: boolean;
  x1: number; // 0-1 position
  x2: number; // 0-1 position
  y1: number; // 0-1 position
  y2: number; // 0-1 position
}

interface CursorPanelProps {
  cursorSettings: CursorSettings;
  onCursorChange: (settings: CursorSettings) => void;
  timePerDivision: number;
  voltsPerDivision: number;
  divisions: number;
}

export const CursorPanel: React.FC<CursorPanelProps> = ({
  cursorSettings,
  onCursorChange,
  timePerDivision,
  voltsPerDivision,
  divisions,
}) => {
  const totalTime = timePerDivision * divisions;
  const totalVolts = voltsPerDivision * divisions;

  // Calculate actual values from normalized positions
  const t1 = cursorSettings.x1 * totalTime;
  const t2 = cursorSettings.x2 * totalTime;
  const deltaT = Math.abs(t2 - t1);
  const frequency = deltaT > 0 ? 1 / deltaT : 0;

  const v1 = (0.5 - cursorSettings.y1) * totalVolts;
  const v2 = (0.5 - cursorSettings.y2) * totalVolts;
  const deltaV = Math.abs(v2 - v1);

  const formatTime = (seconds: number): string => {
    if (seconds >= 1) return `${seconds.toFixed(3)} s`;
    if (seconds >= 0.001) return `${(seconds * 1000).toFixed(3)} ms`;
    if (seconds >= 0.000001) return `${(seconds * 1000000).toFixed(3)} µs`;
    return `${(seconds * 1000000000).toFixed(3)} ns`;
  };

  const formatVoltage = (volts: number): string => {
    if (Math.abs(volts) >= 1) return `${volts.toFixed(3)} V`;
    return `${(volts * 1000).toFixed(3)} mV`;
  };

  const formatFrequency = (hz: number): string => {
    if (hz >= 1000000) return `${(hz / 1000000).toFixed(3)} MHz`;
    if (hz >= 1000) return `${(hz / 1000).toFixed(3)} kHz`;
    return `${hz.toFixed(3)} Hz`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Cursors</h3>
        <Switch
          checked={cursorSettings.enabled}
          onCheckedChange={(enabled) => onCursorChange({ ...cursorSettings, enabled })}
        />
      </div>

      {cursorSettings.enabled && (
        <>
          {/* Time Cursors */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-cyan-400 uppercase">Time (Vertical)</h4>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                T1: {formatTime(t1)}
              </Label>
              <Slider
                value={[cursorSettings.x1 * 100]}
                onValueChange={([value]) => 
                  onCursorChange({ ...cursorSettings, x1: value / 100 })
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                T2: {formatTime(t2)}
              </Label>
              <Slider
                value={[cursorSettings.x2 * 100]}
                onValueChange={([value]) => 
                  onCursorChange({ ...cursorSettings, x2: value / 100 })
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded p-2">
              <div>
                <span className="text-muted-foreground">ΔT: </span>
                <span className="font-mono text-cyan-400">{formatTime(deltaT)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">1/ΔT: </span>
                <span className="font-mono text-cyan-400">{formatFrequency(frequency)}</span>
              </div>
            </div>
          </div>

          {/* Voltage Cursors */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-pink-400 uppercase">Voltage (Horizontal)</h4>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                V1: {formatVoltage(v1)}
              </Label>
              <Slider
                value={[cursorSettings.y1 * 100]}
                onValueChange={([value]) => 
                  onCursorChange({ ...cursorSettings, y1: value / 100 })
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                V2: {formatVoltage(v2)}
              </Label>
              <Slider
                value={[cursorSettings.y2 * 100]}
                onValueChange={([value]) => 
                  onCursorChange({ ...cursorSettings, y2: value / 100 })
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>

            <div className="text-xs bg-muted/30 rounded p-2">
              <span className="text-muted-foreground">ΔV: </span>
              <span className="font-mono text-pink-400">{formatVoltage(deltaV)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
