import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChannelSettings, WaveformSettings } from '@/hooks/useWaveformGenerator';

interface SignalGenPanelProps {
  channel1: ChannelSettings;
  onChannel1Change: (settings: ChannelSettings) => void;
  channel2: ChannelSettings;
  onChannel2Change: (settings: ChannelSettings) => void;
}

export const SignalGenPanel: React.FC<SignalGenPanelProps> = ({
  channel1,
  onChannel1Change,
  channel2,
  onChannel2Change,
}) => {
  const renderSignalControls = (
    channel: ChannelSettings,
    onChange: (settings: ChannelSettings) => void,
    channelNum: 1 | 2
  ) => {
    const waveformSettings = channel.waveformSettings;
    const colorClass = channelNum === 1 ? 'text-primary' : 'text-trace-ch2';

    const updateWaveform = (updates: Partial<WaveformSettings>) => {
      onChange({
        ...channel,
        waveformSettings: { ...waveformSettings, ...updates },
      });
    };

    if (!channel.enabled) {
      return (
        <div className="text-xs text-muted-foreground text-center py-4">
          Enable CH{channelNum} to configure signal
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Waveform</Label>
          <Select
            value={waveformSettings.waveformType}
            onValueChange={(value: WaveformSettings['waveformType']) => 
              updateWaveform({ waveformType: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="sawtooth">Sawtooth</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Frequency: {waveformSettings.frequency >= 1000 
              ? `${(waveformSettings.frequency / 1000).toFixed(1)} kHz`
              : `${waveformSettings.frequency} Hz`}
          </Label>
          <Slider
            value={[Math.log10(waveformSettings.frequency)]}
            onValueChange={([value]) => 
              updateWaveform({ frequency: Math.round(Math.pow(10, value)) })
            }
            min={1}
            max={5}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Amplitude: {waveformSettings.amplitude.toFixed(2)} V
          </Label>
          <Slider
            value={[waveformSettings.amplitude]}
            onValueChange={([value]) => 
              updateWaveform({ amplitude: value })
            }
            min={0.1}
            max={5}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Noise: {(waveformSettings.noiseLevel * 100).toFixed(0)}%
          </Label>
          <Slider
            value={[waveformSettings.noiseLevel]}
            onValueChange={([value]) => 
              updateWaveform({ noiseLevel: value })
            }
            min={0}
            max={0.2}
            step={0.01}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Signal Gen (Mock)</h3>
      
      <Tabs defaultValue="ch1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ch1" className="data-[state=active]:text-primary">
            CH1
          </TabsTrigger>
          <TabsTrigger value="ch2" className="data-[state=active]:text-trace-ch2">
            CH2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ch1" className="mt-3">
          {renderSignalControls(channel1, onChannel1Change, 1)}
        </TabsContent>
        <TabsContent value="ch2" className="mt-3">
          {renderSignalControls(channel2, onChannel2Change, 2)}
        </TabsContent>
      </Tabs>
    </div>
  );
};
