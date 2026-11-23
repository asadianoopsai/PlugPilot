import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const TITLE_TEXT = 'Plug Pilot';
const CHARACTERS = Array.from(TITLE_TEXT);

export const InteractiveHeroTitle: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [waveIdx, setWaveIdx] = useState<number | null>(null);
  const [traceLit, setTraceLit] = useState(false);
  const waveTimerRef = useRef<number | null>(null);
  const traceTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (waveTimerRef.current !== null) {
      window.clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }
    if (traceTimerRef.current !== null) {
      window.clearTimeout(traceTimerRef.current);
      traceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const triggerSignalWave = () => {
    clearTimers();
    setTraceLit(true);

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (reducedMotion) {
      traceTimerRef.current = window.setTimeout(() => {
        setTraceLit(false);
      }, 350);
      return;
    }

    let step = 0;
    setWaveIdx(0);
    waveTimerRef.current = window.setInterval(() => {
      step += 1;
      if (step >= CHARACTERS.length) {
        if (waveTimerRef.current !== null) {
          window.clearInterval(waveTimerRef.current);
          waveTimerRef.current = null;
        }
        setWaveIdx(null);
        traceTimerRef.current = window.setTimeout(() => {
          setTraceLit(false);
        }, 280);
      } else {
        setWaveIdx(step);
      }
    }, 45);
  };

  const activeCenter = waveIdx ?? hoveredIdx;
  const isInteracting = activeCenter !== null || traceLit;

  return (
    <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.03] tracking-[-0.035em] sm:text-5xl lg:text-[62px]">
      <button
        type="button"
        onClick={triggerSignalWave}
        onMouseLeave={() => setHoveredIdx(null)}
        onBlur={() => setHoveredIdx(null)}
        className={`group relative inline-flex cursor-pointer flex-col items-start rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8] focus-visible:ring-offset-4 ${
          isLight ? 'focus-visible:ring-offset-[#f8fafc]' : 'focus-visible:ring-offset-[#0b0d14]'
        }`}
        title="Click to pulse circuit trace"
      >
        <span className="sr-only">{TITLE_TEXT}</span>
        <span
          aria-hidden="true"
          className="inline-flex select-none items-baseline"
        >
          {CHARACTERS.map((char, idx) => {
            if (char === ' ') {
              return (
                <span key={`space-${idx}`} className="w-[0.26em]" />
              );
            }

            const distance =
              activeCenter === null ? null : Math.abs(activeCenter - idx);
            const isPrimary = distance === 0;
            const isNeighbor = distance === 1;

            const glyphColorClass = isPrimary
              ? isLight
                ? '-translate-y-1.5 scale-105 text-[#0284c7] drop-shadow-[0_4px_14px_rgba(2,132,199,0.28)]'
                : '-translate-y-1.5 scale-105 text-[#38bdf8] drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]'
              : isNeighbor
                ? isLight
                  ? '-translate-y-0.5 scale-[1.02] text-[#0369a1]'
                  : '-translate-y-0.5 scale-[1.02] text-[#7dd3fc]'
                : isLight
                  ? 'translate-y-0 scale-100 text-[#0f172a]'
                  : 'translate-y-0 scale-100 text-[#eef0f5]';

            return (
              <span
                key={`${char}-${idx}`}
                onMouseEnter={() => setHoveredIdx(idx)}
                className={`relative inline-block transition-all duration-150 ease-out motion-reduce:transform-none ${glyphColorClass}`}
              >
                {char}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-opacity duration-150 ${
                    isPrimary
                      ? isLight
                        ? 'bg-[#0284c7] opacity-100'
                        : 'bg-[#38bdf8] opacity-100'
                      : isNeighbor
                        ? isLight
                          ? 'bg-[#0ea5e9] opacity-65'
                          : 'bg-[#7dd3fc] opacity-60'
                        : 'opacity-0'
                  }`}
                />
              </span>
            );
          })}
        </span>

        {/* Interactive PCB trace bar beneath the landing title */}
        <span
          aria-hidden="true"
          className={`relative mt-2.5 block h-[2px] w-full overflow-hidden rounded-full ${
            isLight ? 'bg-slate-900/[0.12]' : 'bg-[#eef0f5]/[0.12]'
          }`}
        >
          <span
            className={`block h-full w-full origin-left rounded-full transition-all duration-300 ease-out ${
              isLight
                ? 'bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7]'
                : 'bg-gradient-to-r from-[#38bdf8] via-[#7dd3fc] to-[#38bdf8]'
            } ${
              isInteracting
                ? 'scale-x-100 opacity-100'
                : 'scale-x-[0.22] opacity-65 group-hover:scale-x-100 group-hover:opacity-100'
            }`}
          />
        </span>
      </button>
    </h1>
  );
};
