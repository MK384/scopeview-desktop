import React, { useMemo } from 'react';
import type { ChannelSettings } from '@/hooks/useWaveformGenerator';

interface ChannelData {
  data: number[];
  settings: ChannelSettings;
}

interface MeasurementPanelProps {
  channel1Data: ChannelData;
  channel2Data: ChannelData;
  timePerDivision: number;
  divisions: number;
}

interface Measurements {
  vMax: number;
  vMin: number;
  vPP: number;
  vRMS: number;
  frequency: number;
  period: number;
  dutyCycle: number;
}

const calculateMeasurements = (
  data: number[],
  timePerDivision: number,
  divisions: number
): Measurements => {
  if (data.length === 0) {
    return {
      vMax: 0,
      vMin: 0,
      vPP: 0,
      vRMS: 0,
      frequency: 0,
      period: 0,
      dutyCycle: 0,
    };
  }

  const vMax = Math.max(...data);
  const vMin = Math.min(...data);
  const vPP = vMax - vMin;
  
  // Calculate RMS
  const sumSquares = data.reduce((sum, val) => sum + val * val, 0);
  const vRMS = Math.sqrt(sumSquares / data.length);

  // Estimate frequency by counting zero crossings
  let zeroCrossings = 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  
  for (let i = 1; i < data.length; i++) {
    if ((data[i - 1] - mean) * (data[i] - mean) < 0) {
      zeroCrossings++;
    }
  }

  const totalTime = timePerDivision * divisions;
  const frequency = (zeroCrossings / 2) / totalTime;
  const period = frequency > 0 ? 1 / frequency : 0;

  // Calculate duty cycle (time above mean / total time)
  const samplesAboveMean = data.filter(v => v > mean).length;
  const dutyCycle = (samplesAboveMean / data.length) * 100;

  return {
    vMax,
    vMin,
    vPP,
    vRMS,
    frequency,
    period,
    dutyCycle,
  };
};

const formatValue = (value: number, unit: string, decimals: number = 2): string => {
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)} M${unit}`;
  } else if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)} k${unit}`;
  } else if (Math.abs(value) >= 1) {
    return `${value.toFixed(decimals)} ${unit}`;
  } else if (Math.abs(value) >= 1e-3) {
    return `${(value * 1e3).toFixed(decimals)} m${unit}`;
  } else if (Math.abs(value) >= 1e-6) {
    return `${(value * 1e6).toFixed(decimals)} µ${unit}`;
  }
  return `${value.toFixed(decimals)} ${unit}`;
};

interface ChannelMeasurementsProps {
  measurements: Measurements;
  channelNum: 1 | 2;
  colorClass: string;
}

const ChannelMeasurements: React.FC<ChannelMeasurementsProps> = ({
  measurements,
  channelNum,
  colorClass,
}) => (
  <>
    {/* Column 1: Voltage Min/Max */}
    <div className="space-y-2">
      <h4 className={`text-xs font-semibold ${colorClass} uppercase`}>CH{channelNum}</h4>
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">V min</span>
        <p className={`font-mono ${colorClass}`}>{formatValue(measurements.vMin, 'V')}</p>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">V max</span>
        <p className={`font-mono ${colorClass}`}>{formatValue(measurements.vMax, 'V')}</p>
      </div>
    </div>

    {/* Column 2: V p-p / V rms */}
    <div className="space-y-2">
      <div className="h-4" /> {/* Spacer for header alignment */}
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">V p-p</span>
        <p className={`font-mono ${colorClass}`}>{formatValue(measurements.vPP, 'V')}</p>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">V rms</span>
        <p className={`font-mono ${colorClass}`}>{formatValue(measurements.vRMS, 'V')}</p>
      </div>
    </div>

    {/* Column 3: Frequency / Period / Duty Cycle */}
    <div className="space-y-2">
      <div className="h-4" /> {/* Spacer for header alignment */}
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">Freq (Duty)</span>
        <p className={`font-mono ${colorClass}`}>
          {formatValue(measurements.frequency, 'Hz')} ({measurements.dutyCycle.toFixed(1)}%)
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground text-xs">Period</span>
        <p className={`font-mono ${colorClass}`}>{formatValue(measurements.period, 's')}</p>
      </div>
    </div>
  </>
);

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  channel1Data,
  channel2Data,
  timePerDivision,
  divisions,
}) => {
  const measurements1 = useMemo(
    () => calculateMeasurements(channel1Data.data, timePerDivision, divisions),
    [channel1Data.data, timePerDivision, divisions]
  );

  const measurements2 = useMemo(
    () => calculateMeasurements(channel2Data.data, timePerDivision, divisions),
    [channel2Data.data, timePerDivision, divisions]
  );

  const ch1Enabled = channel1Data.settings.enabled;
  const ch2Enabled = channel2Data.settings.enabled;

  if (!ch1Enabled && !ch2Enabled) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">Measurements</h3>
        <p className="text-muted-foreground text-sm">Enable a channel to see measurements</p>
      </div>
    );
  }

  const bothEnabled = ch1Enabled && ch2Enabled;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">Measurements</h3>
      
      <div className={`grid gap-4 text-sm ${bothEnabled ? 'grid-cols-6' : 'grid-cols-3'}`}>
        {ch1Enabled && (
          <ChannelMeasurements
            measurements={measurements1}
            channelNum={1}
            colorClass="text-primary"
          />
        )}
        
        {ch2Enabled && (
          <ChannelMeasurements
            measurements={measurements2}
            channelNum={2}
            colorClass="text-trace-ch2"
          />
        )}
      </div>
    </div>
  );
};
