import { useState, useEffect, useCallback, useRef } from 'react';

export interface WaveformSettings {
  frequency: number; // Hz
  amplitude: number; // Volts
  offset: number; // Volts
  waveformType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  noiseLevel: number; // 0-1
}

export type InputRange = '5V' | '15V';
export type CouplingMode = 'AC' | 'DC' | 'GND';
export type ProbeAttenuation = '1X' | '10X';

export interface ChannelSettings {
  enabled: boolean;
  voltsPerDivision: number;
  verticalOffset: number;
  inputRange: InputRange;
  coupling: CouplingMode;
  probeAttenuation: ProbeAttenuation;
  waveformSettings: WaveformSettings;
}

export interface TimebaseSettings {
  timePerDivision: number; // seconds per division
  sampleRate: number; // samples per second
}

export type TriggerMode = 'auto' | 'normal' | 'single';
export type TriggerEdge = 'rising' | 'falling';
export type TriggerSource = 'ch1' | 'ch2';

export interface TriggerSettings {
  mode: TriggerMode;
  edge: TriggerEdge;
  level: number; // Volts
  holdoff: number; // seconds (0 to disable)
  source: TriggerSource;
}

const DEFAULT_WAVEFORM_CH1: WaveformSettings = {
  frequency: 1000,
  amplitude: 2.5,
  offset: 0,
  waveformType: 'sine',
  noiseLevel: 0.02,
};

const DEFAULT_WAVEFORM_CH2: WaveformSettings = {
  frequency: 2000,
  amplitude: 1.5,
  offset: 0,
  waveformType: 'square',
  noiseLevel: 0.02,
};

const DEFAULT_CHANNEL_1: ChannelSettings = {
  enabled: true,
  voltsPerDivision: 1,
  verticalOffset: 0,
  inputRange: '5V',
  coupling: 'DC',
  probeAttenuation: '1X',
  waveformSettings: DEFAULT_WAVEFORM_CH1,
};

const DEFAULT_CHANNEL_2: ChannelSettings = {
  enabled: false,
  voltsPerDivision: 1,
  verticalOffset: 0,
  inputRange: '5V',
  coupling: 'DC',
  probeAttenuation: '1X',
  waveformSettings: DEFAULT_WAVEFORM_CH2,
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
  source: 'ch1',
};

export function useWaveformGenerator(
  divisions: number = 10,
  pointsPerDivision: number = 100
) {
  const [channel1, setChannel1] = useState<ChannelSettings>(DEFAULT_CHANNEL_1);
  const [channel2, setChannel2] = useState<ChannelSettings>(DEFAULT_CHANNEL_2);
  const [timebaseSettings, setTimebaseSettings] = useState<TimebaseSettings>(DEFAULT_TIMEBASE);
  const [triggerSettings, setTriggerSettings] = useState<TriggerSettings>(DEFAULT_TRIGGER);
  const [waveformDataCh1, setWaveformDataCh1] = useState<number[]>([]);
  const [waveformDataCh2, setWaveformDataCh2] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [isTriggered, setIsTriggered] = useState(false);
  const [triggerArmed, setTriggerArmed] = useState(true);
  
  const phaseRefCh1 = useRef(0);
  const phaseRefCh2 = useRef(0);
  const animationRef = useRef<number>();
  const lastTriggerTimeRef = useRef(0);
  const autoTriggerCounterRef = useRef(0);
  const frozenDataCh1Ref = useRef<number[]>([]);
  const frozenDataCh2Ref = useRef<number[]>([]);
  const triggeredPhaseCh1Ref = useRef(0);
  const triggeredPhaseCh2Ref = useRef(0);

  // Generate raw waveform data at a given phase for a specific channel
  const generateWaveformAtPhase = useCallback((phase: number, waveformSettings: WaveformSettings): number[] => {
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
  }, [timebaseSettings, divisions, pointsPerDivision]);

  // Find trigger point in the data - returns a TIME OFFSET (in seconds) to align trigger
  const findTriggerTimeOffset = useCallback((currentPhase: number): number | null => {
    const triggerChannel = triggerSettings.source === 'ch1' ? channel1 : channel2;
    const { frequency, amplitude, offset, waveformType } = triggerChannel.waveformSettings;
    const { level, edge } = triggerSettings;
    const angularFreq = 2 * Math.PI * Math.max(frequency, 1e-6);
    
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
        const currentCyclePhase = currentPhase % (2 * Math.PI);
        let phaseOffset = triggerPhase - currentCyclePhase;
        
        // Normalize to [-π, π]
        while (phaseOffset > Math.PI) phaseOffset -= 2 * Math.PI;
        while (phaseOffset < -Math.PI) phaseOffset += 2 * Math.PI;
        
        // Convert phase offset to time offset
        return phaseOffset / angularFreq;
      }
    }
    
    // For other waveforms, sample and find crossing
    const testData = generateWaveformAtPhase(currentPhase, triggerChannel.waveformSettings);
    const totalPoints = testData.length;
    const { timePerDivision } = timebaseSettings;
    const totalTime = timePerDivision * divisions;
    const timeStep = totalTime / totalPoints;

    // Scan the full capture window so low-frequency signals can still trigger reliably.
    for (let i = 1; i < totalPoints; i++) {
      const prev = testData[i - 1];
      const curr = testData[i];

      const risingCross = edge === 'rising' && prev < level && curr >= level;
      const fallingCross = edge === 'falling' && prev > level && curr <= level;

      if (risingCross || fallingCross) {
        // Return the TIME offset needed to shift this crossing to the left edge of the capture
        const triggerTime = i * timeStep;
        return -triggerTime;
      }
    }
    
    return null;
  }, [triggerSettings, channel1, channel2, timebaseSettings, divisions, generateWaveformAtPhase]);

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
      
      // Each channel advances its own phase based on its own frequency
      const phaseIncrementCh1 = (2 * Math.PI * channel1.waveformSettings.frequency) / 60; // 60 FPS
      const phaseIncrementCh2 = (2 * Math.PI * channel2.waveformSettings.frequency) / 60;
      
      phaseRefCh1.current += phaseIncrementCh1;
      phaseRefCh2.current += phaseIncrementCh2;
      
      if (phaseRefCh1.current > 2 * Math.PI * 100) {
        phaseRefCh1.current -= 2 * Math.PI * 100;
      }
      if (phaseRefCh2.current > 2 * Math.PI * 100) {
        phaseRefCh2.current -= 2 * Math.PI * 100;
      }

      if (shouldTrigger(timestamp)) {
        // Get time offset (in seconds) to align trigger crossing to left edge
        const dt = findTriggerTimeOffset(
          triggerSettings.source === 'ch1' ? phaseRefCh1.current : phaseRefCh2.current
        );
        
        if (dt !== null) {
          // Apply the same time shift to both channels so the display stays synchronized
          // phase = omega * t, so phase_offset = omega * dt
          triggeredPhaseCh1Ref.current =
            phaseRefCh1.current + dt * (2 * Math.PI * channel1.waveformSettings.frequency);
          triggeredPhaseCh2Ref.current =
            phaseRefCh2.current + dt * (2 * Math.PI * channel2.waveformSettings.frequency);
          
          const newDataCh1 = channel1.enabled ? generateWaveformAtPhase(triggeredPhaseCh1Ref.current, channel1.waveformSettings) : [];
          const newDataCh2 = channel2.enabled ? generateWaveformAtPhase(triggeredPhaseCh2Ref.current, channel2.waveformSettings) : [];
          
          frozenDataCh1Ref.current = newDataCh1;
          frozenDataCh2Ref.current = newDataCh2;
          setWaveformDataCh1(newDataCh1);
          setWaveformDataCh2(newDataCh2);
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
            const newDataCh1 = channel1.enabled ? generateWaveformAtPhase(phaseRefCh1.current, channel1.waveformSettings) : [];
            const newDataCh2 = channel2.enabled ? generateWaveformAtPhase(phaseRefCh2.current, channel2.waveformSettings) : [];
            setWaveformDataCh1(newDataCh1);
            setWaveformDataCh2(newDataCh2);
            setIsTriggered(false);
            autoTriggerCounterRef.current = 0;
          }
        } else if (mode === 'normal') {
          // Normal mode: keep showing last triggered data
          if (frozenDataCh1Ref.current.length > 0) {
            setWaveformDataCh1(frozenDataCh1Ref.current);
          }
          if (frozenDataCh2Ref.current.length > 0) {
            setWaveformDataCh2(frozenDataCh2Ref.current);
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
  }, [isRunning, channel1, channel2, triggerSettings, shouldTrigger, findTriggerTimeOffset, generateWaveformAtPhase]);

  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
    // Re-arm trigger when starting
    if (!isRunning) {
      setTriggerArmed(true);
    }
  }, [isRunning]);

  const resetPhase = useCallback(() => {
    phaseRefCh1.current = 0;
    phaseRefCh2.current = 0;
    triggeredPhaseCh1Ref.current = 0;
    triggeredPhaseCh2Ref.current = 0;
    lastTriggerTimeRef.current = 0;
    autoTriggerCounterRef.current = 0;
    frozenDataCh1Ref.current = [];
    frozenDataCh2Ref.current = [];
    setTriggerArmed(true);
  }, []);

  const armTrigger = useCallback(() => {
    setTriggerArmed(true);
    if (!isRunning && triggerSettings.mode === 'single') {
      setIsRunning(true);
    }
  }, [isRunning, triggerSettings.mode]);

  return {
    waveformDataCh1,
    waveformDataCh2,
    channel1,
    setChannel1,
    channel2,
    setChannel2,
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
