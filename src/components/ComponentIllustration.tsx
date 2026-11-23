import React from 'react';
import { IllustrationKind } from '../types/electronics';

interface ComponentIllustrationProps {
  kind: IllustrationKind;
  compact?: boolean;
  activePinIndex?: number | null;
}

export const ComponentIllustration: React.FC<ComponentIllustrationProps> = ({
  kind,
  compact = false,
  activePinIndex = null,
}) => {
  const sizeClass = compact ? 'h-24 w-full' : 'h-56 w-full';

  const pinFill = (idx: number, defaultColor = '#94A3B8') =>
    activePinIndex === idx ? '#22D3EE' : defaultColor;

  return (
    <div
      data-preserve-dark="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-lg bg-[#07080d] ${sizeClass}`}
    >
      <svg
        viewBox="0 0 220 130"
        className="relative z-10 h-full w-full max-w-[220px] p-2"
        role="img"
        aria-label={`${kind} technical illustration`}
      >
        {(kind === 'esp32') && (
          <g>
            {/* PCB Board */}
            <rect x="40" y="18" width="140" height="92" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="2" />
            {/* RF Shield */}
            <rect x="52" y="28" width="52" height="50" rx="3" fill="#475569" stroke="#94A3B8" strokeWidth="1.2" />
            <text x="78" y="56" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontFamily="monospace">ESP32</text>
            {/* PCB Antenna */}
            <path d="M52 24 H32 V36 H40 V28 H36 V40" stroke="#D97706" strokeWidth="1.8" fill="none" />
            {/* USB Port */}
            <rect x="166" y="52" width="18" height="24" rx="2" fill="#94A3B8" />
            {/* Pin Headers */}
            {Array.from({ length: 12 }).map((_, i) => (
              <g key={i}>
                <circle cx={52 + i * 10} cy="22" r="2" fill={pinFill(i % 4, '#F59E0B')} />
                <circle cx={52 + i * 10} cy="106" r="2" fill={pinFill(i % 4, '#F59E0B')} />
              </g>
            ))}
          </g>
        )}

        {(kind === 'arduino_uno') && (
          <g>
            <rect x="34" y="18" width="152" height="94" rx="5" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.6" />
            {/* USB-B & Barrel Jack */}
            <rect x="26" y="30" width="22" height="24" rx="2" fill="#CBD5E1" />
            <rect x="28" y="82" width="22" height="18" rx="2" fill="#1E293B" />
            {/* ATmega328P DIP */}
            <rect x="82" y="64" width="76" height="20" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1.2" />
            <text x="120" y="77" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">ATmega328P</text>
            {/* Headers */}
            <rect x="74" y="22" width="96" height="8" rx="1" fill="#090D16" />
            <rect x="92" y="100" width="78" height="8" rx="1" fill="#090D16" />
            <circle cx="155" cy="44" r="3" fill="#22D3EE" />
          </g>
        )}

        {(kind === 'hcsr04') && (
          <g>
            <rect x="35" y="28" width="150" height="62" rx="5" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="1.5" />
            <circle cx="75" cy="59" r="24" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="75" cy="59" r="17" fill="#0F172A" />
            <circle cx="145" cy="59" r="24" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="145" cy="59" r="17" fill="#0F172A" />
            <rect x="97" y="22" width="26" height="10" rx="3" fill="#CBD5E1" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={93 + i * 10} y="90" width="4" height="22" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'dht11' || kind === 'dht22') && (
          <g>
            <rect
              x="72"
              y="18"
              width="76"
              height="74"
              rx="4"
              fill={kind === 'dht11' ? '#0284C7' : '#E2E8F0'}
              stroke={kind === 'dht11' ? '#38BDF8' : '#94A3B8'}
              strokeWidth="1.6"
            />
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={84 + c * 14}
                  y={30 + r * 12}
                  width="9"
                  height="8"
                  rx="1"
                  fill="#0F172A"
                  opacity="0.7"
                />
              ))
            )}
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={87 + i * 14} y="92" width="4" height="24" fill={pinFill(i, '#CBD5E1')} />
            ))}
          </g>
        )}

        {(kind === 'lm35' || kind === 'hall') && (
          <g>
            <path d="M84 36 C84 22, 136 22, 136 36 V64 H84 Z" fill="#1E293B" stroke="#64748B" strokeWidth="1.6" />
            <text x="110" y="52" textAnchor="middle" fill="#CBD5E1" fontSize="9" fontFamily="monospace">
              {kind === 'lm35' ? 'LM35' : 'A3144'}
            </text>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={92 + i * 16} y="64" width="4" height="48" fill={pinFill(i, '#94A3B8')} />
            ))}
          </g>
        )}

        {(kind === 'ds18b20') && (
          <g>
            <rect x="44" y="52" width="66" height="24" rx="12" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1.5" />
            <rect x="110" y="57" width="16" height="14" rx="2" fill="#1E293B" />
            <path d="M126 60 H182" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M126 64 H182" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <path d="M126 68 H182" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {(kind === 'pir') && (
          <g>
            <rect x="58" y="34" width="104" height="62" rx="4" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
            <circle cx="110" cy="64" r="28" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M90 64 Q110 42 130 64 Q110 86 90 64" fill="none" stroke="#94A3B8" strokeWidth="1.2" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={96 + i * 12} y="96" width="4" height="20" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'mpu6050' || kind === 'bmp280' || kind === 'vl53l0x' || kind === 'bh1750' || kind === 'magnetometer') && (
          <g>
            <rect x="55" y="26" width="110" height="72" rx="5" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="1.6" />
            <rect x="94" y="46" width="32" height="32" rx="2" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.2" />
            <circle cx="67" cy="38" r="4" fill="#07080d" stroke="#FBBF24" strokeWidth="1.5" />
            <circle cx="153" cy="38" r="4" fill="#07080d" stroke="#FBBF24" strokeWidth="1.5" />
            <text x="110" y="65" textAnchor="middle" fill="#38BDF8" fontSize="7" fontFamily="monospace">MEMS</text>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={74 + i * 18} cy="88" r="3" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'mq2' || kind === 'mq135') && (
          <g>
            <rect x="54" y="28" width="112" height="68" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
            <circle cx="92" cy="62" r="24" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="92" cy="62" r="18" fill="#475569" stroke="#CBD5E1" strokeDasharray="3 2" strokeWidth="1.5" />
            <rect x="132" y="48" width="18" height="22" rx="2" fill="#2563EB" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={166} y={40 + i * 12} width="18" height="3" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'ldr') && (
          <g>
            <circle cx="110" cy="52" r="28" fill="#B45309" stroke="#F59E0B" strokeWidth="2" />
            <path
              d="M92 46 Q110 38 128 46 Q110 54 92 54 Q110 62 128 62"
              stroke="#FEF3C7"
              strokeWidth="2.5"
              fill="none"
            />
            <rect x="98" y="80" width="3" height="34" fill={pinFill(0, '#94A3B8')} />
            <rect x="118" y="80" width="3" height="34" fill={pinFill(1, '#94A3B8')} />
          </g>
        )}

        {(kind === 'oled' || kind === 'lcd16x2') && (
          <g>
            <rect x="38" y="24" width="144" height="82" rx="4" fill={kind === 'oled' ? '#1E3A8A' : '#065F46'} stroke="#60A5FA" strokeWidth="1.5" />
            <rect x="48" y="38" width="124" height="54" rx="2" fill={kind === 'oled' ? '#020617' : '#0EA5E9'} />
            <text x="110" y="62" textAnchor="middle" fill={kind === 'oled' ? '#22D3EE' : '#082F49'} fontSize="10" fontFamily="monospace">
              {kind === 'oled' ? '128x64 OLED' : '16x2 I2C LCD'}
            </text>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={86 + i * 16} cy="30" r="2.5" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'hc05' || kind === 'nrf24l01') && (
          <g>
            <rect x="52" y="24" width="116" height="74" rx="4" fill={kind === 'hc05' ? '#1D4ED8' : '#0F172A'} stroke="#38BDF8" strokeWidth="1.5" />
            <rect x="74" y="34" width="52" height="52" rx="3" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
            <path d="M134 40 H156 V50 H140 V60 H156" stroke="#FBBF24" strokeWidth="2" fill="none" />
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={34} y={40 + i * 11} width="18" height="3" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}

        {(kind === 'soil_moisture') && (
          <g>
            <path d="M84 20 H136 V88 L110 116 L84 88 Z" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1="98" y1="44" x2="98" y2="96" stroke="#FBBF24" strokeWidth="3" />
            <line x1="122" y1="44" x2="122" y2="96" stroke="#FBBF24" strokeWidth="3" />
            <rect x="96" y="14" width="28" height="10" fill="#1E293B" />
          </g>
        )}

        {(kind === 'relay') && (
          <g>
            <rect x="44" y="24" width="132" height="82" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            <rect x="64" y="34" width="56" height="60" rx="3" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
            <rect x="134" y="42" width="28" height="44" rx="2" fill="#065F46" stroke="#34D399" strokeWidth="1.2" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={28} y={48 + i * 12} width="16" height="3" fill={pinFill(i, '#FBBF24')} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
