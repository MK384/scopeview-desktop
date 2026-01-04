import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { TimebaseSettings } from '@/hooks/useWaveformGenerator';

interface ControlPanelProps {
  timebaseSettings: TimebaseSettings;
  onTimebaseChange: (settings: TimebaseSettings) => void;
  voltsPerDivision: number;
  onVoltsPerDivisionChange: (value: number) => void;
  verticalOffset: number;
  onVerticalOffsetChange: (value: number) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
}

const TIME_PER_DIV_OPTIONS = [
  { label: '1 µs', value: 0.000001 },
  { label: '2 µs', value: 0.000002 },
  { label: '5 µs', value: 0.000005 },
  { label: '10 µs', value: 0.00001 },
  { label: '20 µs', value: 0.00002 },
  { label: '50 µs', value: 0.00005 },
  { label: '100 µs', value: 0.0001 },
  { label: '200 µs', value: 0.0002 },
  { label: '500 µs', value: 0.0005 },
  { label: '1 ms', value: 0.001 },
  { label: '2 ms', value: 0.002 },
  { label: '5 ms', value: 0.005 },
  { label: '10 ms', value: 0.01 },
];

const VOLTS_PER_DIV_OPTIONS = [
  { label: '10 mV', value: 0.01 },
  { label: '20 mV', value: 0.02 },
  { label: '50 mV', value: 0.05 },
  { label: '100 mV', value: 0.1 },
  { label: '200 mV', value: 0.2 },
  { label: '500 mV', value: 0.5 },
  { label: '1 V', value: 1 },
  { label: '2 V', value: 2 },
  { label: '5 V', value: 5 },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  timebaseSettings,
  onTimebaseChange,
  voltsPerDivision,
  onVoltsPerDivisionChange,
  verticalOffset,
  onVerticalOffsetChange,
  isRunning,
  onToggleRunning,
  onReset,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-6">
      {/* Run/Stop Controls */}
      <div className="flex gap-2">
        <Button 
          onClick={onToggleRunning}
          variant={isRunning ? 'destructive' : 'default'}
          className="flex-1"
        >
          {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isRunning ? 'Stop' : 'Run'}
        </Button>
        <Button onClick={onReset} variant="outline" size="icon">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Horizontal (Time) Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Horizontal</h3>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Time/Div</Label>
          <Select
            value={timebaseSettings.timePerDivision.toString()}
            onValueChange={(value) => 
              onTimebaseChange({ ...timebaseSettings, timePerDivision: parseFloat(value) })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PER_DIV_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vertical Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Vertical</h3>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Volts/Div</Label>
          <Select
            value={voltsPerDivision.toString()}
            onValueChange={(value) => onVoltsPerDivisionChange(parseFloat(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOLTS_PER_DIV_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value.toString()}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Offset: {verticalOffset.toFixed(2)} V
          </Label>
          <Slider
            value={[verticalOffset]}
            onValueChange={([value]) => onVerticalOffsetChange(value)}
            min={-5}
            max={5}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
};
