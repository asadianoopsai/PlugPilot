import React from 'react';
import { ProjectWiringConnection } from '../types/electronics';

interface ProjectWiringDiagramProps {
  boardName: 'ESP32' | 'Arduino Uno';
  connections: ProjectWiringConnection[];
  activeConnectionId: string | null;
  onSelectConnection: (id: string) => void;
}

const WIRE_HEX: Record<ProjectWiringConnection['wireColor'], string> = {
  red: '#e5484d',
  black: '#7a8296',
  cyan: '#38bdf8',
  amber: '#e5a93c',
  emerald: '#4cc38a',
  violet: '#a78bfa',
};

export const ProjectWiringDiagram: React.FC<ProjectWiringDiagramProps> = ({
  boardName,
  connections,
  activeConnectionId,
  onSelectConnection,
}) => {
  const height = Math.max(260, 70 + connections.length * 46);

  return (
    <div
      data-preserve-dark="true"
      className="overflow-hidden rounded-xl border border-[#eef0f5]/[0.08] bg-[#07080d] p-4"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-[#7a8296]">
        <span>Interactive schematic connection map</span>
        <span>Select a trace or table row to highlight</span>
      </div>

      <svg
        viewBox={`0 0 680 ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Wiring diagram for ${boardName} project`}
      >
        <defs>
          <pattern id="schematic-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(238,240,245,0.06)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="680" height={height} fill="url(#schematic-grid)" rx="8" />

        {/* MCU Board Block on Left */}
        <rect
          x="24"
          y="28"
          width="176"
          height={height - 56}
          rx="10"
          fill="#11141c"
          stroke="#38bdf8"
          strokeOpacity="0.65"
          strokeWidth="1.5"
        />
        <text x="112" y="56" textAnchor="middle" fill="#eef0f5" fontSize="13" fontWeight="500" fontFamily="sans-serif">
          {boardName}
        </text>
        <text x="112" y="74" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
          {boardName === 'ESP32' ? '3.3V logic · Wi-Fi' : '5.0V logic · ATmega328P'}
        </text>

        {/* Wiring Traces and Target Modules */}
        {connections.map((conn, index) => {
          const y = 96 + index * 46;
          const isSelected = activeConnectionId === conn.id;
          const color = WIRE_HEX[conn.wireColor];
          const dimmed = activeConnectionId !== null && !isSelected;

          return (
            <g
              key={conn.id}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${conn.fromComponent} ${conn.fromPin} to ${conn.toBoardPin}`}
              onClick={() => onSelectConnection(conn.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectConnection(conn.id);
                }
              }}
              className="cursor-pointer focus:outline-none"
              opacity={dimmed ? 0.35 : 1}
            >
              {/* Board Pin Label */}
              <rect
                x="40"
                y={y - 13}
                width="146"
                height="24"
                rx="4"
                fill="#1a1e28"
                stroke="rgba(238,240,245,0.14)"
                strokeWidth="1"
              />
              <text x="113" y={y + 3} textAnchor="middle" fill="#eef0f5" fontSize="10" fontFamily="monospace">
                {conn.toBoardPin}
              </text>

              {/* Wire Path */}
              <path
                d={`M 186 ${y - 1} C 260 ${y - 1}, 320 ${y - 1}, 410 ${y - 1}`}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 3.5 : 2}
                strokeLinecap="round"
              />
              <circle cx="186" cy={y - 1} r={isSelected ? 4 : 3} fill={color} />
              <circle cx="410" cy={y - 1} r={isSelected ? 4 : 3} fill={color} />

              {/* Wire Signal Badge on trace */}
              <rect x="248" y={y - 11} width="110" height="20" rx="4" fill="#07080d" stroke={color} strokeWidth="1" />
              <text x="303" y={y + 2} textAnchor="middle" fill="#eef0f5" fontSize="9.5" fontFamily="monospace">
                {conn.fromPin}
              </text>

              {/* Peripheral Module Block */}
              <rect
                x="410"
                y={y - 17}
                width="244"
                height="32"
                rx="6"
                fill={isSelected ? '#1a1e28' : '#11141c'}
                stroke={isSelected ? '#38bdf8' : 'rgba(238,240,245,0.12)'}
                strokeWidth={isSelected ? 1.5 : 1}
              />
              <text x="424" y={y - 2} fill="#eef0f5" fontSize="11" fontWeight="500" fontFamily="sans-serif">
                {conn.fromComponent}
              </text>
              <text x="424" y={y + 10} fill="#7a8296" fontSize="9" fontFamily="sans-serif">
                {conn.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
