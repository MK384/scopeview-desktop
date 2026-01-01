import { useState, useEffect, useCallback, useRef } from 'react';

export interface WaveformSettings {
  frequency: number; // Hz
  amplitude: number; // Volts
  offset: number; // Volts
  waveformType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  noiseLevel: number; // 0-1
}

export interface TimebaseSettings {
  timePerDivision: number; // seconds per division
  sampleRate: number; // samples per second
}

const DEFAULT_WAVEFORM: WaveformSettings = {
  frequency: 1000,
  amplitude: 2.5,
  offset: 0,
  waveformType: 'sine',
  noiseLevel: 0.02,
};

const DEFAULT_TIMEBASE: TimebaseSettings = {
  timePerDivision: 0.001, // 1ms/div
  sampleRate: 1000000, // 1 MS/s
};

export function useWaveformGenerator(
  divisions: number = 10,
  pointsPerDivision: number = 100
) {
  const [waveformSettings, setWaveformSettings] = useState<WaveformSettings>(DEFAULT_WAVEFORM);
  const [timebaseSettings, setTimebaseSettings] = useState<TimebaseSettings>(DEFAULT_TIMEBASE);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const phaseRef = useRef(0);
  const animationRef = useRef<number>();

  const generateWaveform = useCallback((phase: number): number[] => {
    const { frequency, amplitude, offset, waveformType, noiseLevel } = waveformSettings;
    const { timePerDivision, sampleRate } = timebaseSettings;
    
    const totalTime = timePerDivision * divisions;
    const totalPoints = pointsPerDivision * divisions;
    const timeStep = totalTime / totalPoints;
    
    const data: number[] = [];
    
    for (let i = 0; i < totalPoints; i++) {
      const t = i * timeStep;
      const angularFreq = 2 * Math.PI * frequency;
      let value: number;
      
      switch (waveformType) {
        case 'sine':
          value = Math.sin(angularFreq * t + phase);
          break;
        case 'square':
          value = Math.sin(angularFreq * t + phase) >= 0 ? 1 : -1;
          break;
        case 'triangle':
          value = (2 / Math.PI) * Math.asin(Math.sin(angularFreq * t + phase));
          break;
        case 'sawtooth':
          value = (2 / Math.PI) * Math.atan(Math.tan((angularFreq * t + phase) / 2));
          break;
        default:
          value = Math.sin(angularFreq * t + phase);
      }
      
      // Apply amplitude and offset
      value = value * amplitude + offset;
      
      // Add noise
      if (noiseLevel > 0) {
        value += (Math.random() - 0.5) * 2 * noiseLevel * amplitude;
      }
      
      data.push(value);
    }
    
    return data;
  }, [waveformSettings, timebaseSettings, divisions, pointsPerDivision]);

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      const phaseIncrement = (2 * Math.PI * waveformSettings.frequency) / 60; // 60 FPS
      phaseRef.current += phaseIncrement;
      
      if (phaseRef.current > 2 * Math.PI) {
        phaseRef.current -= 2 * Math.PI;
      }
      
      setWaveformData(generateWaveform(phaseRef.current));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, generateWaveform, waveformSettings.frequency]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetPhase = useCallback(() => {
    phaseRef.current = 0;
  }, []);

  return {
    waveformData,
    waveformSettings,
    setWaveformSettings,
    timebaseSettings,
    setTimebaseSettings,
    isRunning,
    toggleRunning,
    resetPhase,
  };
}
