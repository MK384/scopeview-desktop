import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { WaveformSettings } from '@/hooks/useWaveformGenerator';

interface SignalGenPanelProps {
  waveformSettings: WaveformSettings;
  onWaveformChange: (settings: WaveformSettings) => void;
}

export const SignalGenPanel: React.FC<SignalGenPanelProps> = ({
  waveformSettings,
  onWaveformChange,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Signal Gen (Mock)</h3>
      
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Waveform</Label>
        <Select
          value={waveformSettings.waveformType}
          onValueChange={(value: WaveformSettings['waveformType']) => 
            onWaveformChange({ ...waveformSettings, waveformType: value })
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
            onWaveformChange({ ...waveformSettings, frequency: Math.round(Math.pow(10, value)) })
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
            onWaveformChange({ ...waveformSettings, amplitude: value })
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
            onWaveformChange({ ...waveformSettings, noiseLevel: value })
          }
          min={0}
          max={0.2}
          step={0.01}
        />
      </div>
    </div>
  );
};
