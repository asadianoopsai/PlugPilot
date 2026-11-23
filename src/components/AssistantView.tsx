import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, Info, Send } from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { PROJECTS_DATA } from '../data/projectsData';
import { AppView, AssistantRecommendation } from '../types/electronics';
import { generateProjectRecommendation } from '../utils/assistantEngine';

interface AssistantViewProps {
  initialPrompt?: string;
  onNavigate: (view: AppView) => void;
}

const STARTER_PROMPTS = [
  'Monitor LPG gas leak and temperature in my garage with Wi-Fi alerts',
  'Automatic indoor plant watering system using Arduino Uno',
  'Build a solar-friendly weather station with pressure, humidity, and OLED',
  'Ultrasonic smart parking bay indicator with 16x2 LCD display',
];

export const AssistantView: React.FC<AssistantViewProps> = ({
  initialPrompt = '',
  onNavigate,
}) => {
  const [promptInput, setPromptInput] = useState(
    initialPrompt.trim() || STARTER_PROMPTS[0]
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AssistantRecommendation>(() =>
    generateProjectRecommendation(
      initialPrompt.trim() || STARTER_PROMPTS[0]
    )
  );
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (initialPrompt.trim()) {
      setPromptInput(initialPrompt);
      setRecommendation(generateProjectRecommendation(initialPrompt));
    }
  }, [initialPrompt]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promptInput.trim();
    if (trimmed.length < 4) {
      setErrorMessage('Please describe your electronics project idea (at least 4 characters).');
      return;
    }
    setErrorMessage(null);
    setRecommendation(generateProjectRecommendation(trimmed));
  };

  const handleStarterSelect = (sample: string) => {
    setErrorMessage(null);
    setPromptInput(sample);
    setRecommendation(generateProjectRecommendation(sample));
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(recommendation.starterCodeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const relatedGuides = PROJECTS_DATA.filter((p) =>
    recommendation.relatedProjectIds.includes(p.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header with Honest Demo Mode Disclosure */}
      <div className="border-b border-[#eef0f5]/[0.08] pb-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium text-[#38bdf8]">
              AI project assistant
            </p>
            <h1 className="mt-2 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[#eef0f5] sm:text-3xl">
              Hardware architecture advisor
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
              Describe what you want to build to receive suggested microcontrollers, compatible
              sensors, wiring checklists, and starter firmware links
            </p>
          </div>

          <div className="inline-flex items-start gap-2.5 rounded-lg border border-[#eef0f5]/[0.1] bg-[#11141c] px-4 py-3 text-xs text-[#a3a9b8]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <div className="font-medium text-[#eef0f5]">Demo mode active</div>
              <div className="text-[#7a8296]">
                Uses built-in rule-based component matching and sample architectures (no paid API required).
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="mt-6">
          <label htmlFor="assistant-prompt-input" className="block text-xs font-medium text-[#a3a9b8]">
            Describe your electronics project
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="assistant-prompt-input"
              type="text"
              value={promptInput}
              onChange={(e) => {
                setPromptInput(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. Automated greenhouse fan and soil moisture monitor with ESP32"
              className="h-11 flex-1 rounded-lg border border-[#eef0f5]/[0.12] bg-[#11141c] px-4 text-sm text-[#eef0f5] placeholder-[#7a8296] transition-colors duration-150 ease-unslop focus:border-[#38bdf8]/70 focus:outline-none"
            />
            <ShinyButton
              type="submit"
              size="md"
              cornerRadius={8}
              fillColor="#0b0d14"
              insetColor="rgba(56, 189, 248, 0.3)"
              labelColor="#eef0f5"
              accentColor="#38bdf8"
              accentSoftColor="#7dd3fc"
              label="Suggest architecture"
              className="h-11 shrink-0 px-5 text-sm"
            >
              <Send className="h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} aria-hidden="true" />
              Suggest architecture
            </ShinyButton>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#e5a93c]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#e5a93c]" strokeWidth={1.5} aria-hidden="true" />
              {errorMessage}
            </p>
          )}
        </form>

        {/* Quick Sample Prompts */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#7a8296]">Sample prompts:</span>
          {STARTER_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleStarterSelect(sample)}
              className="rounded-md border border-[#eef0f5]/[0.08] bg-[#11141c] px-3 py-1.5 text-left text-xs text-[#a3a9b8] transition-[background-color,border-color,color,transform] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] hover:text-[#eef0f5] active:scale-[0.98]"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Recommendation Output */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Recommended Board + Component BOM */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-6">
            <div className="text-xs font-medium text-[#38bdf8]">
              Sample project architecture
            </div>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-[-0.02em] text-[#eef0f5]">
              {recommendation.projectTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
              {recommendation.summary}
            </p>

            {/* Recommended MCU */}
            <div className="mt-6 border-t border-[#eef0f5]/[0.08] pt-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="text-xs font-medium text-[#7a8296]">Recommended controller</div>
                  <div className="mt-0.5 font-display text-base font-medium text-[#eef0f5]">
                    {recommendation.recommendedBoardName}
                  </div>
                </div>
                <ShinyButton
                  type="button"
                  size="sm"
                  cornerRadius={6}
                  fillColor="#11141c"
                  insetColor="rgba(238, 240, 245, 0.14)"
                  labelColor="#eef0f5"
                  accentColor="#7a8296"
                  accentSoftColor="#eef0f5"
                  speckleOpacity={0.22}
                  label="View board pinout"
                  onClick={() =>
                    onNavigate({
                      name: 'component-detail',
                      componentId: recommendation.recommendedBoardId,
                    })
                  }
                  className="h-8 shrink-0 px-3 text-xs"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#a3a9b8]">
                {recommendation.boardRationale}
              </p>
            </div>

            {/* Suggested Sensors & Modules */}
            <div className="mt-6 border-t border-[#eef0f5]/[0.08] pt-5">
              <h3 className="font-display text-sm font-medium text-[#eef0f5]">
                Suggested sensors and modules
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recommendation.suggestedComponents.map((item) => (
                  <button
                    key={item.componentId}
                    type="button"
                    onClick={() =>
                      onNavigate({ name: 'component-detail', componentId: item.componentId })
                    }
                    className="group flex flex-col justify-between rounded-lg border border-[#eef0f5]/[0.08] bg-[#07080d] p-4 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                  >
                    <div>
                      <div className="font-display text-sm font-medium text-[#eef0f5]">
                        {item.name}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">{item.role}</p>
                    </div>
                    <span className="mt-3 text-xs font-medium text-[#38bdf8] group-hover:text-[#7dd3fc]">
                      Open component guide
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Supporting Parts */}
            <div className="mt-5 border-t border-[#eef0f5]/[0.08] pt-4">
              <h4 className="text-xs font-medium text-[#eef0f5]">Additional parts needed</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-[#a3a9b8]">
                {recommendation.additionalHardware.map((part) => (
                  <li key={part} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7a8296]" aria-hidden="true" />
                    <span>{part}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Wiring Summary & Power Note */}
          <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-6">
            <h3 className="font-display text-base font-medium text-[#eef0f5]">
              Wiring and integration summary
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[#eef0f5]">
              {recommendation.wiringSummary.map((line) => (
                <li key={line} className="rounded-lg border border-[#eef0f5]/[0.08] bg-[#07080d] px-3.5 py-2.5 font-mono text-xs">
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-lg border border-[#e5a93c]/30 bg-[#07080d] p-4 text-xs leading-relaxed text-[#a3a9b8]">
              <span className="font-medium text-[#e5a93c]">Power and logic guardrail: </span>
              {recommendation.powerAndSafetyNote}
            </div>
          </div>
        </div>

        {/* Right: Build Sequence, Starter Code & Related Guides */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-6">
            <h3 className="font-display text-base font-medium text-[#eef0f5]">
              Recommended build sequence
            </h3>
            <ol className="mt-3 space-y-3 text-sm text-[#a3a9b8]">
              {recommendation.architectureSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#1a1e28] font-mono text-xs font-medium text-[#38bdf8] tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-[#a3a9b8]">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Starter Code */}
          <div className="overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#07080d]">
            <div className="flex items-center justify-between border-b border-[#eef0f5]/[0.08] bg-[#11141c] px-4 py-2.5">
              <span className="font-mono text-xs font-medium text-[#38bdf8]">
                starter_architecture.ino
              </span>
              <ShinyButton
                type="button"
                size="sm"
                cornerRadius={6}
                fillColor="#11141c"
                insetColor="rgba(238, 240, 245, 0.12)"
                labelColor="#eef0f5"
                accentColor={copiedCode ? "#4cc38a" : "#7a8296"}
                accentSoftColor="#eef0f5"
                speckleOpacity={0.2}
                label={copiedCode ? "Copied" : "Copy"}
                onClick={handleCopySnippet}
                className="h-7 px-2.5 text-xs"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#4cc38a]" strokeWidth={1.5} aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#7a8296]" strokeWidth={1.5} aria-hidden="true" />
                    Copy
                  </>
                )}
              </ShinyButton>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-[#eef0f5]">
              <code>{recommendation.starterCodeSnippet}</code>
            </pre>
          </div>

          {/* Matching Plug Pilot Guides */}
          <div className="rounded-xl border border-[#eef0f5]/[0.08] bg-[#11141c] p-6">
            <h3 className="font-display text-base font-medium text-[#eef0f5]">
              Matching Plug Pilot step-by-step guides
            </h3>
            <div className="mt-3 space-y-3">
              {relatedGuides.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => onNavigate({ name: 'project-detail', projectId: guide.id })}
                  className="group block w-full rounded-lg border border-[#eef0f5]/[0.08] bg-[#07080d] p-4 text-left transition-[background-color,border-color] duration-150 ease-unslop hover:border-[#eef0f5]/[0.18] hover:bg-[#1a1e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
                >
                  <div className="flex items-center gap-2 text-xs text-[#7a8296]">
                    <span className="font-medium text-[#38bdf8]">{guide.primaryBoard}</span>
                    <span aria-hidden="true">·</span>
                    <span>{guide.difficulty}</span>
                  </div>
                  <div className="mt-1 font-display text-sm font-medium text-[#eef0f5]">
                    {guide.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
