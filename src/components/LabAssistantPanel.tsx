import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Crosshair,
  HelpCircle,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { BeginnerCircuitId, BenchBoardId } from '../types/electronics';
import {
  BenchEnvironmentInputs,
  BenchWireConnection,
  CircuitSimulationResult,
} from '../utils/circuitSimulator';
import {
  answerLabQuestion,
  getBeginnerQuickQuestions,
  LabAssistantReply,
  LabGuideContext,
} from '../utils/labAssistant';

interface LabAssistantPanelProps {
  presetId: BeginnerCircuitId;
  boardId: BenchBoardId;
  connections: BenchWireConnection[];
  simResult: CircuitSimulationResult;
  envInputs: BenchEnvironmentInputs;
  guideContext: LabGuideContext;
  highlightedPair: { sensorPinId: string; boardPinId: string } | null;
  onHighlightPair: (pair: { sensorPinId: string; boardPinId: string } | null) => void;
  onWireStep: (sensorPinId: string, boardPinId: string) => void;
  onStartGuidedPractice: () => void;
  onOpenManualWiring: () => void;
  onToggleTestPower: () => void;
}

type GuideSubTab = 'steps' | 'about' | 'parts';

interface QAHistoryEntry {
  question: string;
  reply: LabAssistantReply;
}

export const LabAssistantPanel: React.FC<LabAssistantPanelProps> = ({
  presetId,
  boardId,
  connections,
  simResult,
  envInputs,
  guideContext,
  highlightedPair,
  onHighlightPair,
  onWireStep,
  onStartGuidedPractice,
  onOpenManualWiring,
  onToggleTestPower,
}) => {
  const [subTab, setSubTab] = useState<GuideSubTab>('steps');
  const [questionInput, setQuestionInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [qaEntry, setQaEntry] = useState<QAHistoryEntry>(() => ({
    question: 'What is this project about?',
    reply: answerLabQuestion(
      'What is this project about?',
      presetId,
      boardId,
      connections,
      simResult,
      envInputs
    ),
  }));

  // Refresh default contextual briefing whenever kit, board, or fault state switches
  useEffect(() => {
    const defaultPrompt = guideContext.hasFault
      ? 'Why is my wire red and how do I fix it?'
      : 'What is this project about?';
    setQaEntry({
      question: defaultPrompt,
      reply: answerLabQuestion(
        defaultPrompt,
        presetId,
        boardId,
        connections,
        simResult,
        envInputs
      ),
    });
    setInputError(null);
  }, [presetId, boardId, guideContext.hasFault]);

  const quickQuestions = getBeginnerQuickQuestions(presetId, boardId, simResult);

  const askQuestion = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setInputError('Ask a short question (for example: "What should I connect first?").');
      return;
    }
    setInputError(null);
    const reply = answerLabQuestion(
      trimmed,
      presetId,
      boardId,
      connections,
      simResult,
      envInputs
    );
    setQaEntry({ question: trimmed, reply });
    if (reply.highlightPins) {
      onHighlightPair(reply.highlightPins);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(questionInput);
    if (questionInput.trim().length >= 2) {
      setQuestionInput('');
    }
  };

  const activeStep = guideContext.activeStep;
  const isHighlightingActive =
    Boolean(activeStep && highlightedPair) &&
    highlightedPair?.sensorPinId === activeStep?.sensorPinId &&
    highlightedPair?.boardPinId === activeStep?.boardPinId;

  return (
    <div className="mt-2 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
      {/* LEFT: Guided Walkthrough (About / What to Connect / Step-by-Step How to Connect) */}
      <div className="flex flex-col justify-between rounded-lg border border-[#eef0f5]/[0.08] bg-[#11141c] p-2.5 lg:col-span-7">
        <div>
          {/* Sub-tabs answering the core beginner questions */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#eef0f5]/[0.08] pb-2">
            <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Beginner guide sections">
              {(
                [
                  { id: 'steps', label: 'How to Connect' },
                  { id: 'about', label: 'Project & Goal' },
                  { id: 'parts', label: 'What to Connect' },
                ] as const
              ).map((item) => {
                const selected = subTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSubTab(item.id)}
                    className={`h-7 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                      selected
                        ? 'bg-[#1a1e28] text-[#eef0f5]'
                        : 'text-[#a3a9b8] hover:text-[#eef0f5]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onStartGuidedPractice}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-[#eef0f5]/[0.1] bg-[#0b0d14] px-2 text-xs font-medium text-[#a3a9b8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:border-[#38bdf8]/50 hover:text-[#eef0f5]"
              title="Reset wires and guide me step-by-step from Step 1"
            >
              <RotateCcw className="h-3 w-3 text-[#38bdf8]" strokeWidth={1.5} />
              Practice Step-by-Step
            </button>
          </div>

          {subTab === 'steps' && (
            <div className="mt-2 space-y-1.5">
              {/* Coach Callout */}
              <div
                className={`rounded-md border bg-[#0b0d14] px-2.5 py-1.5 text-xs ${
                  guideContext.hasFault
                    ? 'border-[#ef4444]/45'
                    : guideContext.isAllDone
                    ? 'border-[#4cc38a]/40'
                    : 'border-[#38bdf8]/35'
                }`}
              >
                <div
                  className={`font-medium ${
                    guideContext.hasFault
                      ? 'text-[#f87171]'
                      : guideContext.isAllDone
                      ? 'text-[#4cc38a]'
                      : 'text-[#38bdf8]'
                  }`}
                >
                  {guideContext.coachHeadline}
                </div>
                <p className="mt-0.5 line-clamp-2 leading-snug text-[#a3a9b8]">{guideContext.coachMessage}</p>
              </div>

              {/* Compact Step Cards */}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {guideContext.steps.map((step) => (
                  <div
                    key={step.sensorPinId}
                    className={`flex items-start gap-2 rounded-md border px-2 py-1 text-xs ${
                      step.status === 'fix'
                        ? 'border-[#ef4444]/45 bg-[#0b0d14]'
                        : step.status === 'next'
                        ? 'border-[#38bdf8]/45 bg-[#0b0d14]'
                        : step.status === 'completed'
                        ? 'border-[#4cc38a]/30 bg-[#0b0d14]/70'
                        : 'border-[#eef0f5]/[0.06] bg-[#0b0d14]/50'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4cc38a]" strokeWidth={1.5} />
                    ) : step.status === 'fix' ? (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f87171]" strokeWidth={1.5} />
                    ) : (
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[11px] font-medium tabular-nums ${
                          step.status === 'next'
                            ? 'bg-[#38bdf8] text-[#07080d]'
                            : 'bg-[#1a1e28] text-[#a3a9b8]'
                        }`}
                      >
                        {step.stepNumber}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="font-mono font-medium text-[#eef0f5]">
                        {step.sensorPinLabel} → {step.boardPinLabel}
                      </div>
                      <div className="truncate text-[11px] text-[#a3a9b8]" title={step.whyItMatters}>
                        {step.whyItMatters}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subTab === 'about' && (
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-md border border-[#eef0f5]/[0.08] bg-[#0b0d14] p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#38bdf8]">
                  <Compass className="h-3.5 w-3.5" strokeWidth={1.5} />
                  What this project is about
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">
                  {guideContext.projectAbout}
                </p>
              </div>
              <div className="rounded-md border border-[#eef0f5]/[0.08] bg-[#0b0d14] p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#4cc38a]">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                  What it should do for you
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">
                  {guideContext.whatItDoes}
                </p>
              </div>
            </div>
          )}

          {subTab === 'parts' && (
            <div className="mt-2.5 space-y-2">
              <div className="rounded-md border border-[#eef0f5]/[0.08] bg-[#0b0d14] p-2.5">
                <div className="text-xs font-medium text-[#38bdf8]">
                  What to connect on your workbench
                </div>
                <ul className="mt-1.5 space-y-1 text-xs text-[#eef0f5]">
                  {guideContext.whatToConnectSummary.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#38bdf8]" aria-hidden="true" />
                      <span className="text-[#a3a9b8]">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Guided Action Footer */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef0f5]/[0.08] pt-2">
          {activeStep ? (
            <div className="flex flex-wrap items-center gap-2">
              <ShinyButton
                type="button"
                size="sm"
                cornerRadius={8}
                fillColor="#0b0d14"
                insetColor="rgba(56, 189, 248, 0.3)"
                labelColor="#eef0f5"
                accentColor={activeStep.status === 'fix' ? '#ef4444' : '#38bdf8'}
                accentSoftColor={activeStep.status === 'fix' ? '#fca5a5' : '#7dd3fc'}
                label={
                  activeStep.status === 'fix'
                    ? `Fix Step ${activeStep.stepNumber}: ${activeStep.sensorPinId} → ${activeStep.boardPinId}`
                    : `Wire Step ${activeStep.stepNumber}: ${activeStep.sensorPinId} → ${activeStep.boardPinId}`
                }
                onClick={() => onWireStep(activeStep.sensorPinId, activeStep.boardPinId)}
                className="h-8 px-3 text-xs"
              >
                <Wrench className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
                {activeStep.status === 'fix'
                  ? `Fix Step ${activeStep.stepNumber}: ${activeStep.sensorPinId} → ${activeStep.boardPinId}`
                  : `Wire Step ${activeStep.stepNumber}: ${activeStep.sensorPinId} → ${activeStep.boardPinId}`}
              </ShinyButton>

              <button
                type="button"
                onClick={() =>
                  onHighlightPair(
                    isHighlightingActive
                      ? null
                      : {
                          sensorPinId: activeStep.sensorPinId,
                          boardPinId: activeStep.boardPinId,
                        }
                  )
                }
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                  isHighlightingActive
                    ? 'border-[#e5a93c]/60 bg-[#1a1e28] text-[#e5a93c]'
                    : 'border-[#eef0f5]/[0.12] bg-[#0b0d14] text-[#eef0f5] hover:border-[#38bdf8]/50'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" strokeWidth={1.5} />
                {isHighlightingActive ? 'Pins Highlighted in 3D' : 'Show Pins in 3D'}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenManualWiring}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#eef0f5]/[0.12] bg-[#0b0d14] px-3 text-xs font-medium text-[#eef0f5] whitespace-nowrap transition-colors duration-150 ease-unslop hover:border-[#38bdf8]/50"
              >
                Edit Pins Manually
              </button>
              <button
                type="button"
                onClick={onStartGuidedPractice}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#38bdf8]/40 bg-[#0b0d14] px-3 text-xs font-medium text-[#38bdf8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                Practice From Step 1
              </button>
            </div>
          )}

          <span className="font-mono text-[11px] text-[#7a8296] tabular-nums">
            {guideContext.steps.filter((s) => s.status === 'completed').length} /{' '}
            {guideContext.steps.length} verified
          </span>
        </div>
      </div>

      {/* RIGHT: Ask Beginner Assistant Q&A */}
      <div className="flex flex-col justify-between rounded-lg border border-[#eef0f5]/[0.08] bg-[#11141c] p-2.5 lg:col-span-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#eef0f5]">
              <MessageSquare className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
              Ask the 3D Lab Guide
            </div>
            <span className="text-[11px] text-[#7a8296]">Beginner coach</span>
          </div>

          {/* Quick Beginner Prompts */}
          <div className="mt-1.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {quickQuestions.map((qq) => (
              <button
                key={qq}
                type="button"
                onClick={() => askQuestion(qq)}
                className={`truncate rounded-md border px-2 py-1 text-left text-[11px] transition-colors duration-150 ease-unslop ${
                  qaEntry.question === qq
                    ? 'border-[#38bdf8]/50 bg-[#1a1e28] text-[#eef0f5]'
                    : 'border-[#eef0f5]/[0.08] bg-[#0b0d14] text-[#a3a9b8] hover:border-[#eef0f5]/[0.18] hover:text-[#eef0f5]'
                }`}
                title={qq}
              >
                {qq}
              </button>
            ))}
          </div>

          {/* Latest Answer Box */}
          <div
            className="mt-1.5 max-h-24 overflow-y-auto rounded-md border border-[#eef0f5]/[0.08] bg-[#0b0d14] p-2 text-xs leading-snug text-[#eef0f5]"
            aria-live="polite"
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[#38bdf8]">
              <HelpCircle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              <span>{qaEntry.question}</span>
            </div>
            <p className="text-[#a3a9b8]">{qaEntry.reply.text}</p>

            {qaEntry.reply.suggestedAction === 'fix-fault' && activeStep && (
              <button
                type="button"
                onClick={() => onWireStep(activeStep.sensorPinId, activeStep.boardPinId)}
                className="mt-2 inline-flex h-7 items-center gap-1 rounded border border-[#ef4444]/40 bg-[#11141c] px-2 text-[11px] font-medium text-[#f87171] hover:bg-[#1a1e28]"
              >
                Fix {activeStep.sensorPinId} → {activeStep.boardPinId} now
              </button>
            )}

            {qaEntry.reply.suggestedAction === 'wire-next' && activeStep && (
              <button
                type="button"
                onClick={() => onWireStep(activeStep.sensorPinId, activeStep.boardPinId)}
                className="mt-2 inline-flex h-7 items-center gap-1 rounded border border-[#38bdf8]/40 bg-[#11141c] px-2 text-[11px] font-medium text-[#38bdf8] hover:bg-[#1a1e28]"
              >
                Wire {activeStep.sensorPinId} → {activeStep.boardPinId} now
              </button>
            )}

            {qaEntry.reply.suggestedAction === 'toggle-test' && (
              <button
                type="button"
                onClick={onToggleTestPower}
                className="mt-2 inline-flex h-7 items-center gap-1 rounded border border-[#4cc38a]/40 bg-[#11141c] px-2 text-[11px] font-medium text-[#4cc38a] hover:bg-[#1a1e28]"
              >
                <Play className="h-3 w-3" strokeWidth={1.5} />
                Toggle USB Power Test
              </button>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="mt-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="lab-guide-input" className="sr-only">
              Ask the 3D Lab Beginner Guide
            </label>
            <input
              id="lab-guide-input"
              type="text"
              value={questionInput}
              onChange={(e) => {
                setQuestionInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Ask about wiring, pins, or what it does..."
              className="h-8 flex-1 rounded-md border border-[#eef0f5]/[0.12] bg-[#0b0d14] px-2.5 text-xs text-[#eef0f5] placeholder-[#7a8296] focus:border-[#38bdf8]/70 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#38bdf8]/50 bg-[#0b0d14] px-2.5 text-xs font-medium text-[#eef0f5] transition-colors duration-150 ease-unslop hover:border-[#38bdf8] hover:text-[#38bdf8]"
            >
              <Send className="h-3 w-3 text-[#38bdf8]" strokeWidth={1.5} />
              Ask
            </button>
          </div>
          {inputError && (
            <p role="alert" className="mt-1 flex items-center gap-1 text-[11px] text-[#e5a93c]">
              <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              {inputError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
