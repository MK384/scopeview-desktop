import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Crosshair } from 'lucide-react';
import type { TriggerSettings, TriggerMode } from '@/hooks/useWaveformGenerator';

interface TriggerPanelProps {
  triggerSettings: TriggerSettings;
  onTriggerSettingsChange: (settings: TriggerSettings) => void;
  isTriggered: boolean;
  triggerArmed: boolean;
  onArmTrigger: () => void;
  isRunning: boolean;
}

const HOLDOFF_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '100 µs', value: 0.0001 },
  { label: '1 ms', value: 0.001 },
  { label: '10 ms', value: 0.01 },
  { label: '100 ms', value: 0.1 },
  { label: '500 ms', value: 0.5 },
  { label: '1 s', value: 1 },
];

export const TriggerPanel: React.FC<TriggerPanelProps> = ({
  triggerSettings,
  onTriggerSettingsChange,
  isTriggered,
  triggerArmed,
  onArmTrigger,
  isRunning,
}) => {
  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onTriggerSettingsChange({ ...triggerSettings, level: value });
    }
  };

  const handleEdgeToggle = (checked: boolean) => {
    onTriggerSettingsChange({ 
      ...triggerSettings, 
      edge: checked ? 'rising' : 'falling' 
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Trigger</h3>
        <div className="flex items-center gap-2">
          <span 
            className={`w-2 h-2 rounded-full ${
              isTriggered 
                ? 'bg-green-500 animate-pulse' 
                : triggerArmed 
                  ? 'bg-yellow-500' 
                  : 'bg-muted-foreground'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isTriggered ? 'Trig\'d' : triggerArmed ? 'Armed' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Mode</Label>
        <div className="grid grid-cols-3 gap-1">
          {(['auto', 'normal', 'single'] as TriggerMode[]).map((mode) => (
            <Button
              key={mode}
              variant={triggerSettings.mode === mode ? 'default' : 'outline'}
              size="sm"
              className="text-xs capitalize"
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, mode })}
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Level and Edge Row */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Level & Edge</Label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={triggerSettings.level}
                onChange={handleLevelChange}
                step={0.1}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                V
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">↘</span>
            <Switch
              checked={triggerSettings.edge === 'rising'}
              onCheckedChange={handleEdgeToggle}
            />
            <span className="text-xs text-muted-foreground">↗</span>
          </div>
        </div>
      </div>

      {/* Holdoff */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Holdoff</Label>
        <Select
          value={triggerSettings.holdoff.toString()}
          onValueChange={(value) => 
            onTriggerSettingsChange({ ...triggerSettings, holdoff: parseFloat(value) })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOLDOFF_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Single Mode Arm Button */}
      {triggerSettings.mode === 'single' && (
        <Button 
          onClick={onArmTrigger} 
          variant="outline" 
          className="w-full"
          disabled={triggerArmed && isRunning}
        >
          <Crosshair className="w-4 h-4 mr-2" />
          {triggerArmed ? 'Waiting...' : 'Arm Trigger'}
        </Button>
      )}
    </div>
  );
};
