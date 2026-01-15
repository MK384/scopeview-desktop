import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crosshair } from 'lucide-react';
import type { TriggerSettings, TriggerMode, TriggerSource, ChannelSettings } from '@/hooks/useWaveformGenerator';

interface TriggerPanelProps {
  triggerSettings: TriggerSettings;
  onTriggerSettingsChange: (settings: TriggerSettings) => void;
  isTriggered: boolean;
  triggerArmed: boolean;
  onArmTrigger: () => void;
  isRunning: boolean;
  channel1: ChannelSettings;
  channel2: ChannelSettings;
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
  channel1,
  channel2,
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
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">Trigger</h3>
          <div className="flex gap-1">
            <Button
              variant={triggerSettings.source === 'ch1' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, source: 'ch1' })}
              disabled={!channel1.enabled}
            >
              CH1
            </Button>
            <Button
              variant={triggerSettings.source === 'ch2' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => onTriggerSettingsChange({ ...triggerSettings, source: 'ch2' })}
              disabled={!channel2.enabled}
            >
              CH2
            </Button>
          </div>
        </div>
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

      {/* Mode and Holdoff Row */}
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mode</Label>
          <Tabs 
            value={triggerSettings.mode} 
            onValueChange={(value) => onTriggerSettingsChange({ ...triggerSettings, mode: value as TriggerMode })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="auto" className="text-[10px] capitalize">
                Auto
              </TabsTrigger>
              <TabsTrigger value="normal" className="text-[10px] capitalize">
                Normal
              </TabsTrigger>
              <TabsTrigger value="single" className="text-[10px] capitalize">
                Single
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Holdoff</Label>
          <Select
            value={triggerSettings.holdoff.toString()}
            onValueChange={(value) => 
              onTriggerSettingsChange({ ...triggerSettings, holdoff: parseFloat(value) })
            }
          >
            <SelectTrigger className="w-20 h-7 text-xs">
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
