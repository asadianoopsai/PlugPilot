import React from 'react';
import { COMPONENTS_DATA } from '../data/componentsData';
import { ElectronicsProject } from '../types/electronics';

interface ProjectBlueprintCoverProps {
  project: ElectronicsProject;
}

export const ProjectBlueprintCover: React.FC<ProjectBlueprintCoverProps> = ({ project }) => {
  const parts = project.requiredComponentIds
    .map((id) => COMPONENTS_DATA.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 4);

  const peripherals = parts.filter((p) => p.category !== 'Microcontrollers').slice(0, 3);

  return (
    <div
      data-preserve-dark="true"
      className="relative aspect-[16/9] w-full overflow-hidden border-b border-[#eef0f5]/[0.08] bg-[#07080d]"
    >
      <svg
        viewBox="0 0 480 270"
        className="h-full w-full"
        role="img"
        aria-label={`${project.title} circuit topology preview`}
      >
        <defs>
          <pattern id={`grid-${project.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#eef0f5" strokeWidth="0.6" opacity="0.06" />
          </pattern>
        </defs>
        <rect width="480" height="270" fill={`url(#grid-${project.id})`} />

        {/* MCU Block */}
        <rect x="36" y="75" width="136" height="120" rx="8" fill="#11141c" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="104" y="128" textAnchor="middle" fill="#eef0f5" fontSize="14" fontWeight="500" fontFamily="sans-serif">
          {project.primaryBoard}
        </text>
        <text x="104" y="148" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          {project.primaryBoard === 'ESP32' ? '3.3V · Wi-Fi/BLE' : '5.0V · ATmega328P'}
        </text>

        {/* Peripheral Nodes */}
        {peripherals.map((comp, idx) => {
          const y = peripherals.length === 1 ? 115 : peripherals.length === 2 ? 75 + idx * 80 : 45 + idx * 72;
          const colors = ['#22D3EE', '#F59E0B', '#10B981'];
          const traceColor = colors[idx % colors.length];
          return (
            <g key={comp.id}>
              <path
                d={`M 172 ${105 + idx * 24} C 225 ${105 + idx * 24}, 245 ${y + 22}, 292 ${y + 22}`}
                fill="none"
                stroke={traceColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="172" cy={105 + idx * 24} r="3" fill={traceColor} />
              <circle cx="292" cy={y + 22} r="3" fill={traceColor} />
              <rect x="292" y={y} width="152" height="44" rx="6" fill="#0B1324" stroke="#334155" strokeWidth="1.3" />
              <text x="304" y={y + 19} fill="#F1F5F9" fontSize="11" fontWeight="600" fontFamily="sans-serif">
                {comp.partNumber}
              </text>
              <text x="304" y={y + 34} fill="#94A3B8" fontSize="9.5" fontFamily="monospace">
                {comp.interfaceType}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
