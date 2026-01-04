import React, { useState } from 'react';
import { useWaveformGenerator } from '@/hooks/useWaveformGenerator';
import { WaveformCanvas } from '@/components/oscilloscope/WaveformCanvas';
import { ControlPanel } from '@/components/oscilloscope/ControlPanel';
import { SignalGenPanel } from '@/components/oscilloscope/SignalGenPanel';
import { MeasurementPanel } from '@/components/oscilloscope/MeasurementPanel';
import { CursorPanel, type CursorSettings } from '@/components/oscilloscope/CursorPanel';
import { TriggerPanel } from '@/components/oscilloscope/TriggerPanel';
import { StatusBar } from '@/components/oscilloscope/StatusBar';

const DIVISIONS = 10;

// Trace colors from design system
const CH1_TRACE_COLOR = 'hsl(150, 85%, 50%)';
const CH1_GLOW_COLOR = 'hsl(150, 85%, 60%)';
const CH2_TRACE_COLOR = 'hsl(45, 95%, 55%)';
const CH2_GLOW_COLOR = 'hsl(45, 95%, 65%)';

const Index = () => {
  const {
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
  } = useWaveformGenerator(DIVISIONS);

  const [cursorSettings, setCursorSettings] = useState<CursorSettings>({
    enabled: false,
    showVertical: true,
    showHorizontal: true,
    snapToWaveform: true,
    x1: 0.25,
    x2: 0.75,
    y1: 0.25,
    y2: 0.75,
  });

  return (
    <div className="h-screen bg-background p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Digital Oscilloscope
        </h1>
        <p className="text-sm text-muted-foreground">1 MS/s Real-time Waveform Display</p>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 flex-1 min-h-0">
        {/* Waveform Display Area */}
        <div className="space-y-4">
          <StatusBar
            isRunning={isRunning}
            sampleRate={timebaseSettings.sampleRate}
            timePerDivision={timebaseSettings.timePerDivision}
            voltsPerDivision={channel1.voltsPerDivision}
            triggerMode={triggerSettings.mode}
            isTriggered={isTriggered}
          />
          
          <div className="aspect-[16/9] min-h-[400px]">
            <WaveformCanvas
              channel1Data={{
                data: waveformDataCh1,
                settings: channel1,
                traceColor: CH1_TRACE_COLOR,
                glowColor: CH1_GLOW_COLOR,
              }}
              channel2Data={{
                data: waveformDataCh2,
                settings: channel2,
                traceColor: CH2_TRACE_COLOR,
                glowColor: CH2_GLOW_COLOR,
              }}
              divisions={DIVISIONS}
              triggerLevel={triggerSettings.level}
              showGrid={true}
              showTrigger={true}
              cursorSettings={cursorSettings}
              onCursorChange={setCursorSettings}
              timePerDivision={timebaseSettings.timePerDivision}
              triggerEdge={triggerSettings.edge}
              triggerSource={triggerSettings.source}
            />
          </div>

          <MeasurementPanel
            data={waveformDataCh1}
            timePerDivision={timebaseSettings.timePerDivision}
            divisions={DIVISIONS}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 overflow-y-auto min-h-0 custom-scrollbar">
          <ControlPanel
            timebaseSettings={timebaseSettings}
            onTimebaseChange={setTimebaseSettings}
            channel1={channel1}
            onChannel1Change={setChannel1}
            channel2={channel2}
            onChannel2Change={setChannel2}
            isRunning={isRunning}
            onToggleRunning={toggleRunning}
            onReset={resetPhase}
          />

          <CursorPanel
            cursorSettings={cursorSettings}
            onCursorChange={setCursorSettings}
            timePerDivision={timebaseSettings.timePerDivision}
            voltsPerDivision={channel1.voltsPerDivision}
            divisions={DIVISIONS}
          />

          <TriggerPanel
            triggerSettings={triggerSettings}
            onTriggerSettingsChange={setTriggerSettings}
            isTriggered={isTriggered}
            triggerArmed={triggerArmed}
            onArmTrigger={armTrigger}
            isRunning={isRunning}
            channel1={channel1}
            channel2={channel2}
          />

          <SignalGenPanel
            channel1={channel1}
            onChannel1Change={setChannel1}
            channel2={channel2}
            onChannel2Change={setChannel2}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
