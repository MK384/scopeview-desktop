import React, { useMemo } from 'react';

interface MeasurementPanelProps {
  data: number[];
  timePerDivision: number;
  divisions: number;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({
  data,
  timePerDivision,
  divisions,
}) => {
  const measurements = useMemo(() => {
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
  }, [data, timePerDivision, divisions]);

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

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">Measurements</h3>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        {/* Column 1: Voltage Min/Max */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">V min</span>
            <p className="font-mono text-primary">{formatValue(measurements.vMin, 'V')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">V max</span>
            <p className="font-mono text-primary">{formatValue(measurements.vMax, 'V')}</p>
          </div>
        </div>

        {/* Column 2: V p-p / V rms */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">V p-p</span>
            <p className="font-mono text-trace">{formatValue(measurements.vPP, 'V')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">V rms</span>
            <p className="font-mono text-trace">{formatValue(measurements.vRMS, 'V')}</p>
          </div>
        </div>

        {/* Column 3: Frequency / Period / Duty Cycle */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Frequency (Duty Cycle)</span>
            <p className="font-mono text-accent">
              {formatValue(measurements.frequency, 'Hz')} ({measurements.dutyCycle.toFixed(1)}%)
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs">Period</span>
            <p className="font-mono text-accent">{formatValue(measurements.period, 's')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
