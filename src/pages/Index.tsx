import React, { useState } from 'react';
import { useWaveformGenerator } from '@/hooks/useWaveformGenerator';
import { WaveformCanvas } from '@/components/oscilloscope/WaveformCanvas';
import { ControlPanel } from '@/components/oscilloscope/ControlPanel';
import { SignalGenPanel } from '@/components/oscilloscope/SignalGenPanel';
import { MeasurementPanel } from '@/components/oscilloscope/MeasurementPanel';
import { CursorPanel, type CursorSettings } from '@/components/oscilloscope/CursorPanel';
import { StatusBar } from '@/components/oscilloscope/StatusBar';

const DIVISIONS = 10;

const Index = () => {
  const {
    waveformData,
    waveformSettings,
    setWaveformSettings,
    timebaseSettings,
    setTimebaseSettings,
    isRunning,
    toggleRunning,
    resetPhase,
  } = useWaveformGenerator(DIVISIONS);

  const [voltsPerDivision, setVoltsPerDivision] = useState(1);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [triggerLevel, setTriggerLevel] = useState(0);
  const [cursorSettings, setCursorSettings] = useState<CursorSettings>({
    enabled: false,
    x1: 0.25,
    x2: 0.75,
    y1: 0.25,
    y2: 0.75,
  });

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Digital Oscilloscope
        </h1>
        <p className="text-sm text-muted-foreground">1 MS/s Real-time Waveform Display</p>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Waveform Display Area */}
        <div className="space-y-4">
          <StatusBar
            isRunning={isRunning}
            sampleRate={timebaseSettings.sampleRate}
            timePerDivision={timebaseSettings.timePerDivision}
            voltsPerDivision={voltsPerDivision}
          />
          
          <div className="aspect-[16/9] min-h-[400px]">
            <WaveformCanvas
              data={waveformData}
              divisions={DIVISIONS}
              voltsPerDivision={voltsPerDivision}
              verticalOffset={verticalOffset}
              triggerLevel={triggerLevel}
              showGrid={true}
              showTrigger={true}
              cursorSettings={cursorSettings}
              timePerDivision={timebaseSettings.timePerDivision}
            />
          </div>

          <MeasurementPanel
            data={waveformData}
            timePerDivision={timebaseSettings.timePerDivision}
            divisions={DIVISIONS}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <ControlPanel
            timebaseSettings={timebaseSettings}
            onTimebaseChange={setTimebaseSettings}
            voltsPerDivision={voltsPerDivision}
            onVoltsPerDivisionChange={setVoltsPerDivision}
            verticalOffset={verticalOffset}
            onVerticalOffsetChange={setVerticalOffset}
            triggerLevel={triggerLevel}
            onTriggerLevelChange={setTriggerLevel}
            isRunning={isRunning}
            onToggleRunning={toggleRunning}
            onReset={resetPhase}
          />

          <CursorPanel
            cursorSettings={cursorSettings}
            onCursorChange={setCursorSettings}
            timePerDivision={timebaseSettings.timePerDivision}
            voltsPerDivision={voltsPerDivision}
            divisions={DIVISIONS}
          />

          <SignalGenPanel
            waveformSettings={waveformSettings}
            onWaveformChange={setWaveformSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
