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

export type TriggerMode = 'auto' | 'normal' | 'single';
export type TriggerEdge = 'rising' | 'falling';

export interface TriggerSettings {
  mode: TriggerMode;
  edge: TriggerEdge;
  level: number; // Volts
  holdoff: number; // seconds (0 to disable)
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

const DEFAULT_TRIGGER: TriggerSettings = {
  mode: 'auto',
  edge: 'rising',
  level: 0,
  holdoff: 0,
};

export function useWaveformGenerator(
  divisions: number = 10,
  pointsPerDivision: number = 100
) {
  const [waveformSettings, setWaveformSettings] = useState<WaveformSettings>(DEFAULT_WAVEFORM);
  const [timebaseSettings, setTimebaseSettings] = useState<TimebaseSettings>(DEFAULT_TIMEBASE);
  const [triggerSettings, setTriggerSettings] = useState<TriggerSettings>(DEFAULT_TRIGGER);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [isTriggered, setIsTriggered] = useState(false);
  const [triggerArmed, setTriggerArmed] = useState(true);
  
  const phaseRef = useRef(0);
  const animationRef = useRef<number>();
  const lastTriggerTimeRef = useRef(0);
  const autoTriggerCounterRef = useRef(0);
  const frozenDataRef = useRef<number[]>([]);
  const triggeredPhaseRef = useRef(0);

  // Generate raw waveform data at a given phase
  const generateWaveformAtPhase = useCallback((phase: number): number[] => {
    const { frequency, amplitude, offset, waveformType, noiseLevel } = waveformSettings;
    const { timePerDivision } = timebaseSettings;
    
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

  // Find trigger point in the data - returns the phase offset to align trigger
  const findTriggerPhase = useCallback((currentPhase: number): number | null => {
    const { frequency, amplitude, offset, waveformType } = waveformSettings;
    const { level, edge } = triggerSettings;
    
    // For sine wave, we can calculate the exact phase for the trigger level
    if (waveformType === 'sine') {
      const normalizedLevel = (level - offset) / amplitude;
      if (normalizedLevel >= -1 && normalizedLevel <= 1) {
        // asin gives us the phase where sine crosses this level (rising)
        let triggerPhase = Math.asin(normalizedLevel);
        
        if (edge === 'falling') {
          // For falling edge, use the phase after the peak
          triggerPhase = Math.PI - triggerPhase;
        }
        
        // Align to trigger phase
        const angularFreq = 2 * Math.PI * frequency;
        const currentCyclePhase = currentPhase % (2 * Math.PI);
        const phaseOffset = triggerPhase - currentCyclePhase;
        
        return phaseOffset;
      }
    }
    
    // For other waveforms, sample and find crossing
    const testData = generateWaveformAtPhase(currentPhase);
    const totalPoints = testData.length;
    
    for (let i = 1; i < Math.min(totalPoints / 2, 200); i++) {
      const prev = testData[i - 1];
      const curr = testData[i];
      
      const risingCross = edge === 'rising' && prev < level && curr >= level;
      const fallingCross = edge === 'falling' && prev > level && curr <= level;
      
      if (risingCross || fallingCross) {
        // Return a small phase offset to center trigger point
        const { timePerDivision } = timebaseSettings;
        const totalTime = timePerDivision * divisions;
        const timeStep = totalTime / totalPoints;
        const triggerTime = i * timeStep;
        const angularFreq = 2 * Math.PI * frequency;
        return -triggerTime * angularFreq;
      }
    }
    
    return null;
  }, [waveformSettings, triggerSettings, timebaseSettings, divisions, generateWaveformAtPhase]);

  // Check if we should trigger
  const shouldTrigger = useCallback((currentTime: number): boolean => {
    const { mode, holdoff } = triggerSettings;
    
    // Check holdoff
    if (holdoff > 0 && (currentTime - lastTriggerTimeRef.current) < holdoff * 1000) {
      return false;
    }
    
    // Single mode - only trigger once when armed
    if (mode === 'single' && !triggerArmed) {
      return false;
    }
    
    return true;
  }, [triggerSettings, triggerArmed]);

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      const { mode } = triggerSettings;
      const phaseIncrement = (2 * Math.PI * waveformSettings.frequency) / 60; // 60 FPS
      phaseRef.current += phaseIncrement;
      
      if (phaseRef.current > 2 * Math.PI * 100) {
        phaseRef.current -= 2 * Math.PI * 100;
      }

      if (shouldTrigger(timestamp)) {
        const triggerPhaseOffset = findTriggerPhase(phaseRef.current);
        
        if (triggerPhaseOffset !== null) {
          // Found a valid trigger point
          triggeredPhaseRef.current = phaseRef.current + triggerPhaseOffset;
          const newData = generateWaveformAtPhase(triggeredPhaseRef.current);
          frozenDataRef.current = newData;
          setWaveformData(newData);
          setIsTriggered(true);
          lastTriggerTimeRef.current = timestamp;
          autoTriggerCounterRef.current = 0;
          
          if (mode === 'single') {
            setTriggerArmed(false);
            setIsRunning(false);
            return;
          }
        } else if (mode === 'auto') {
          // Auto mode: trigger anyway after timeout
          autoTriggerCounterRef.current++;
          if (autoTriggerCounterRef.current > 30) { // ~0.5 second at 60fps
            const newData = generateWaveformAtPhase(phaseRef.current);
            setWaveformData(newData);
            setIsTriggered(false);
            autoTriggerCounterRef.current = 0;
          }
        } else if (mode === 'normal') {
          // Normal mode: keep showing last triggered data
          if (frozenDataRef.current.length > 0) {
            setWaveformData(frozenDataRef.current);
          }
          setIsTriggered(false);
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, waveformSettings.frequency, triggerSettings, shouldTrigger, findTriggerPhase, generateWaveformAtPhase]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
    // Re-arm trigger when starting
    if (!isRunning) {
      setTriggerArmed(true);
    }
  }, [isRunning]);

  const resetPhase = useCallback(() => {
    phaseRef.current = 0;
    triggeredPhaseRef.current = 0;
    lastTriggerTimeRef.current = 0;
    autoTriggerCounterRef.current = 0;
    frozenDataRef.current = [];
    setTriggerArmed(true);
  }, []);

  const armTrigger = useCallback(() => {
    setTriggerArmed(true);
    if (!isRunning && triggerSettings.mode === 'single') {
      setIsRunning(true);
    }
  }, [isRunning, triggerSettings.mode]);

  return {
    waveformData,
    waveformSettings,
    setWaveformSettings,
    timebaseSettings,
    setTimebaseSettings,
    triggerSettings,
    setTriggerSettings,
    isRunning,
    isTriggered,
    triggerArmed,
    toggleRunning,
    resetPhase,
    armTrigger,
  };
}
