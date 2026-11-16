import type { ReactNode } from 'react';
import type { ArtKind, Palette } from '../types';

interface ArtworkProps {
  kind: ArtKind;
  palette: Palette;
  title: string;
  className?: string;
}

/**
 * Generated cover art used as a stand-in for project photography.
 * Swap for <img> once real project imagery is available.
 */
export function Artwork({ kind, palette, title, className = '' }: ArtworkProps) {
  const { bg, fg, accent } = palette;
  const initial = title.charAt(0);
  const soft = { fill: fg, opacity: 0.12 };
  const mid = { fill: fg, opacity: 0.28 };

  const scenes: Record<ArtKind, ReactNode> = {
    web: (
      <>
        <rect x="90" y="80" width="620" height="440" rx="14" fill={fg} opacity="0.07" stroke={fg} strokeOpacity="0.25" />
        <circle cx="118" cy="106" r="6" fill={accent} />
        <circle cx="140" cy="106" r="6" {...mid} />
        <circle cx="162" cy="106" r="6" {...mid} />
        <rect x="90" y="130" width="620" height="1" {...mid} />
        <text x="130" y="330" fontSize="190" fontFamily="'Instrument Serif', serif" fontStyle="italic" fill={fg}>
          {initial}
        </text>
        <rect x="300" y="200" width="250" height="16" rx="8" fill={fg} opacity="0.8" />
        <rect x="300" y="232" width="330" height="10" rx="5" {...mid} />
        <rect x="300" y="254" width="280" height="10" rx="5" {...mid} />
        <rect x="300" y="296" width="130" height="40" rx="20" fill={accent} />
        <rect x="130" y="390" width="170" height="100" rx="8" {...soft} />
        <rect x="315" y="390" width="170" height="100" rx="8" fill={accent} opacity="0.55" />
        <rect x="500" y="390" width="170" height="100" rx="8" {...soft} />
      </>
    ),
    system: (
      <>
        {Array.from({ length: 12 }, (_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const hot = i === 1 || i === 6 || i === 11;
          return (
            <g key={i} transform={`translate(${96 + col * 156}, ${84 + row * 150})`}>
              <rect width="140" height="134" rx="10" fill={hot ? accent : fg} opacity={hot ? 0.95 : 0.1} />
              <rect x="14" y="16" width={50 + ((i * 17) % 50)} height="8" rx="4" fill={hot ? bg : fg} opacity={hot ? 0.9 : 0.55} />
              <rect x="14" y="34" width="70" height="6" rx="3" fill={hot ? bg : fg} opacity="0.35" />
              <circle cx="110" cy="104" r="14" fill={hot ? bg : accent} opacity={hot ? 0.85 : 0.6} />
              {i % 3 === 0 ? <path d="M105 97l12 7-12 7z" fill={hot ? accent : bg} /> : null}
            </g>
          );
        })}
      </>
    ),
    print: (
      <>
        <g transform="translate(120 110) rotate(-6 200 200)">
          <rect width="150" height="360" fill={fg} opacity="0.92" />
          <rect x="150" width="150" height="360" fill={fg} opacity="0.78" />
          <rect x="300" width="150" height="360" fill={accent} />
          <rect x="22" y="36" width="90" height="12" rx="6" fill={bg} />
          <rect x="22" y="64" width="106" height="6" rx="3" fill={bg} opacity="0.45" />
          <rect x="22" y="80" width="86" height="6" rx="3" fill={bg} opacity="0.45" />
          <rect x="22" y="230" width="106" height="100" fill={bg} opacity="0.14" />
          <circle cx="225" cy="120" r="44" fill={bg} opacity="0.16" />
          <rect x="172" y="200" width="106" height="6" rx="3" fill={bg} opacity="0.45" />
          <rect x="172" y="216" width="80" height="6" rx="3" fill={bg} opacity="0.45" />
          <text x="322" y="300" fontSize="150" fontFamily="'Instrument Serif', serif" fill={bg}>
            {initial}
          </text>
        </g>
        <g transform="translate(500 330) rotate(9)">
          <rect width="210" height="124" rx="6" fill={bg} stroke={fg} strokeOpacity="0.4" />
          <rect x="18" y="20" width="26" height="26" rx="13" fill={accent} />
          <rect x="18" y="72" width="110" height="8" rx="4" fill={fg} opacity="0.85" />
          <rect x="18" y="90" width="76" height="6" rx="3" {...mid} />
        </g>
      </>
    ),
    brand: (
      <>
        <rect x="80" y="70" width="640" height="460" fill="none" stroke={fg} strokeWidth="2" />
        <rect x="80" y="70" width="320" height="460" fill={fg} />
        <text x="240" y="390" textAnchor="middle" fontSize="300" fontFamily="'Instrument Serif', serif" fill={bg}>
          {initial}
        </text>
        <circle cx="560" cy="230" r="92" fill={accent} />
        <rect x="430" y="370" width="260" height="22" fill={fg} />
        <rect x="430" y="408" width="180" height="22" fill={fg} />
        <rect x="430" y="446" width="230" height="22" fill={accent} />
        <rect x="430" y="490" width="60" height="10" fill={fg} opacity="0.4" />
      </>
    ),
    product: (
      <>
        <rect x="90" y="80" width="620" height="440" rx="16" fill={fg} opacity="0.06" stroke={fg} strokeOpacity="0.22" />
        <rect x="90" y="80" width="150" height="440" fill={fg} opacity="0.07" />
        <rect x="112" y="108" width="34" height="34" rx="9" fill={accent} />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="112" y={176 + i * 36} width={i === 1 ? 104 : 80 + ((i * 13) % 24)} height="12" rx="6" fill={i === 1 ? accent : fg} opacity={i === 1 ? 1 : 0.3} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(${268 + (i % 3) * 142}, ${150 + Math.floor(i / 3) * 170})`}>
            <rect width="126" height="150" rx="12" fill={fg} opacity={i === 2 ? 0 : 0.09} />
            {i === 2 ? <rect width="126" height="150" rx="12" fill={accent} /> : null}
            <rect x="16" y="18" width="34" height="34" rx="8" fill={i === 2 ? bg : accent} opacity={i === 2 ? 0.9 : 0.7} />
            <rect x="16" y="88" width="80" height="10" rx="5" fill={i === 2 ? bg : fg} opacity="0.8" />
            <rect x="16" y="110" width="56" height="7" rx="3.5" fill={i === 2 ? bg : fg} opacity="0.4" />
          </g>
        ))}
        <rect x="268" y="106" width="200" height="16" rx="8" fill={fg} opacity="0.8" />
      </>
    ),
    finance: (
      <>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="100" x2="700" y1={170 + i * 90} y2={170 + i * 90} stroke={fg} strokeOpacity="0.14" />
        ))}
        <path d="M100 440 C 190 420, 230 330, 310 340 S 430 250, 500 230 S 620 150, 700 120 L700 440 Z" fill={accent} opacity="0.18" />
        <path d="M100 440 C 190 420, 230 330, 310 340 S 430 250, 500 230 S 620 150, 700 120" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <circle cx="500" cy="230" r="9" fill={bg} stroke={accent} strokeWidth="4" />
        <rect x="440" y="150" width="120" height="50" rx="8" fill={fg} />
        <rect x="456" y="168" width="60" height="8" rx="4" fill={bg} />
        <rect x="456" y="182" width="36" height="5" rx="2.5" fill={bg} opacity="0.5" />
        <text x="100" y="130" fontSize="72" fontFamily="'Instrument Serif', serif" fill={fg}>
          {title.split(' ')[0]}
        </text>
        <rect x="100" y="480" width="150" height="10" rx="5" {...mid} />
        <rect x="270" y="480" width="90" height="10" rx="5" {...soft} />
      </>
    ),
  };

  return (
    <svg className={`artwork ${className}`.trim()} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Abstract cover artwork for ${title}`}>
      <rect width="800" height="600" fill={bg} />
      {scenes[kind]}
    </svg>
  );
}
