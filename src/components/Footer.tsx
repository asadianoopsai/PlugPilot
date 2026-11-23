import React from 'react';
import { AppView } from '../types/electronics';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative z-10 border-t border-[#eef0f5]/[0.08] bg-[#07080d]/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-display text-lg font-semibold tracking-[-0.015em] text-[#eef0f5]">
              Plug Pilot
            </div>
            <p className="mt-1 text-sm font-medium text-[#38bdf8]">
              Turn ideas into real-world electronics.
            </p>
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#7a8296]">
              Electronics reference and project-building workspace for students, hobbyists,
              and embedded engineers working with sensors, Arduino, and ESP32.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-[#a3a9b8]">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#7a8296]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'components', category: 'All' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  Sensor & Component Library
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'projects', difficulty: 'All' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  Step-by-Step Project Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'sandbox', presetId: 'dht22-climate' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  Beginner 3D Circuit Lab
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'assistant' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  AI Project Assistant
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium text-[#a3a9b8]">Popular References</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#7a8296]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'component-detail', componentId: 'esp32' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  ESP32 DevKit V1 Pinout
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'component-detail', componentId: 'arduino-uno' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  Arduino Uno R3 Reference
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'project-detail', projectId: 'esp32-smart-home-automation' })}
                  className="transition-colors duration-150 ease-unslop hover:text-[#eef0f5]"
                >
                  ESP32 Smart Home Guide
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#eef0f5]/[0.08] pt-6 text-xs text-[#7a8296] sm:flex-row sm:items-center">
          <span>Plug Pilot Hardware Learning Platform</span>
          <span className="font-mono tabular-nums">12 Categories · 8 Build Guides</span>
        </div>
      </div>
    </footer>
  );
};
