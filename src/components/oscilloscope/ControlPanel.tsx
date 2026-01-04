import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { TimebaseSettings, ChannelSettings, InputRange, CouplingMode } from '@/hooks/useWaveformGenerator';

interface ControlPanelProps {
  timebaseSettings: TimebaseSettings;
  onTimebaseChange: (settings: TimebaseSettings) => void;
  channel1: ChannelSettings;
  onChannel1Change: (settings: ChannelSettings) => void;
  channel2: ChannelSettings;
  onChannel2Change: (settings: ChannelSettings) => void;
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

const INPUT_RANGE_OPTIONS: { label: string; value: InputRange }[] = [
  { label: '±5 V', value: '5V' },
  { label: '±15 V', value: '15V' },
];

const COUPLING_OPTIONS: { label: string; value: CouplingMode }[] = [
  { label: 'AC', value: 'AC' },
  { label: 'DC', value: 'DC' },
  { label: 'GND', value: 'GND' },
];

interface ChannelPanelProps {
  channel: ChannelSettings;
  onChange: (settings: ChannelSettings) => void;
  channelNum: 1 | 2;
}

const ChannelPanel: React.FC<ChannelPanelProps> = ({ channel, onChange, channelNum }) => {
  const colorClass = channelNum === 1 ? 'text-primary' : 'text-trace-ch2';
  const borderClass = channelNum === 1 ? 'border-primary/30' : 'border-trace-ch2/30';

  return (
    <div className={`bg-card border ${borderClass} rounded-lg p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${colorClass} uppercase tracking-wide`}>
          CH{channelNum}
        </h3>
        <Switch
          checked={channel.enabled}
          onCheckedChange={(enabled) => onChange({ ...channel, enabled })}
        />
      </div>

      {channel.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Volts/Div</Label>
            <Select
              value={channel.voltsPerDivision.toString()}
              onValueChange={(value) => onChange({ ...channel, voltsPerDivision: parseFloat(value) })}
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
              Offset: {channel.verticalOffset.toFixed(2)} V
            </Label>
            <Slider
              value={[channel.verticalOffset]}
              onValueChange={([value]) => onChange({ ...channel, verticalOffset: value })}
              min={-5}
              max={5}
              step={0.1}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Input Range</Label>
              <Select
                value={channel.inputRange}
                onValueChange={(value: InputRange) => onChange({ ...channel, inputRange: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INPUT_RANGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Coupling</Label>
              <Select
                value={channel.coupling}
                onValueChange={(value: CouplingMode) => onChange({ ...channel, coupling: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUPLING_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  timebaseSettings,
  onTimebaseChange,
  channel1,
  onChannel1Change,
  channel2,
  onChannel2Change,
  isRunning,
  onToggleRunning,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      {/* Run/Stop Controls */}
      <div className="bg-card border border-border rounded-lg p-4">
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
      </div>

      {/* Horizontal (Time) Controls */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
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

      {/* Channel 1 Panel */}
      <ChannelPanel 
        channel={channel1} 
        onChange={onChannel1Change} 
        channelNum={1} 
      />

      {/* Channel 2 Panel */}
      <ChannelPanel 
        channel={channel2} 
        onChange={onChannel2Change} 
        channelNum={2} 
      />
    </div>
  );
};
