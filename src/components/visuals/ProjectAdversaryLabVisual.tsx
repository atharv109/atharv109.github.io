import React from 'react';

export const ProjectAdversaryLabVisual: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: '#0D0404',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          .pulse { animation: pulse 2.2s ease-in-out infinite; }
          .pulse-delay { animation: pulse 2.2s ease-in-out infinite 1.1s; }
          .sweep { animation: sweep 5s linear infinite; transform-origin: 200px 150px; }
          @keyframes pulse {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.95; }
          }
          @keyframes sweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Background grid */}
        <g stroke="#7A1F1F" strokeWidth="0.5" opacity="0.18">
          <line x1="0" y1="60" x2="400" y2="60" />
          <line x1="0" y1="120" x2="400" y2="120" />
          <line x1="0" y1="180" x2="400" y2="180" />
          <line x1="0" y1="240" x2="400" y2="240" />
          <line x1="80" y1="0" x2="80" y2="300" />
          <line x1="160" y1="0" x2="160" y2="300" />
          <line x1="240" y1="0" x2="240" y2="300" />
          <line x1="320" y1="0" x2="320" y2="300" />
        </g>

        {/* Detection coverage rings */}
        <circle cx="200" cy="150" r="95" fill="none" stroke="#7A1F1F" strokeWidth="1" opacity="0.35" />
        <circle cx="200" cy="150" r="65" fill="none" stroke="#7A1F1F" strokeWidth="1" opacity="0.45" />
        <circle cx="200" cy="150" r="35" fill="none" stroke="#7A1F1F" strokeWidth="1" opacity="0.55" />

        {/* Radar sweep */}
        <line x1="200" y1="150" x2="200" y2="55" stroke="#E85A2D" strokeWidth="2" opacity="0.6" className="sweep" />

        {/* Coverage polygon */}
        <polygon
          points="200,85 255,125 240,185 160,185 145,125"
          fill="#E85A2D"
          opacity="0.10"
          stroke="#E85A2D"
          strokeWidth="1.5"
        />

        {/* Kill chain path */}
        <path
          d="M 40 230 L 100 230 L 130 160 L 180 160 L 220 100 L 270 100 L 320 160 L 365 160"
          fill="none"
          stroke="#E85A2D"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Kill chain nodes */}
        <g>
          <circle cx="40" cy="230" r="5" fill="#E85A2D" />
          <circle cx="100" cy="230" r="5" fill="#7A1F1F" />
          <circle cx="130" cy="160" r="5" fill="#E85A2D" />
          <circle cx="180" cy="160" r="5" fill="#7A1F1F" />
          <circle cx="220" cy="100" r="5" fill="#E85A2D" />
          <circle cx="270" cy="100" r="5" fill="#7A1F1F" />
          <circle cx="320" cy="160" r="5" fill="#E85A2D" />
          <circle cx="365" cy="160" r="5" fill="#7A1F1F" />
        </g>

        {/* Pulsing alert halos */}
        <circle cx="130" cy="160" r="12" fill="#E85A2D" className="pulse" />
        <circle cx="320" cy="160" r="12" fill="#E85A2D" className="pulse-delay" />

        {/* Central monitoring core */}
        <g transform="translate(200,150)">
          <polygon
            points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
            fill="#0D0404"
            stroke="#E85A2D"
            strokeWidth="2.5"
          />
          <circle r="7" fill="#E85A2D" className="pulse" />
        </g>

        {/* Detection coverage bars */}
        <g transform="translate(20, 268)">
          <rect x="0" y="0" width="45" height="6" rx="3" fill="#E85A2D" opacity="0.9" />
          <rect x="55" y="0" width="28" height="6" rx="3" fill="#7A1F1F" opacity="0.7" />
          <rect x="93" y="0" width="65" height="6" rx="3" fill="#E85A2D" opacity="0.5" />
          <rect x="168" y="0" width="38" height="6" rx="3" fill="#7A1F1F" opacity="0.8" />
          <rect x="216" y="0" width="55" height="6" rx="3" fill="#E85A2D" opacity="0.6" />
          <rect x="281" y="0" width="40" height="6" rx="3" fill="#7A1F1F" opacity="0.5" />
          <rect x="331" y="0" width="50" height="6" rx="3" fill="#E85A2D" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
};