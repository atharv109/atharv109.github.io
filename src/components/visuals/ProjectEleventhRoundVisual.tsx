import React from 'react';

export const ProjectEleventhRoundVisual = ({
  className,
}: {
  className?: string;
}): React.ReactNode => {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: '#0D0404',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes eleventh-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.8; }
        }
        @keyframes eleventh-flicker {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.7; }
        }
        .eleventh-spotlight {
          animation: eleventh-pulse 4s ease-in-out infinite;
        }
        .eleventh-rope {
          animation: eleventh-flicker 3s ease-in-out infinite;
        }
      `}</style>
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <defs>
          <radialGradient id="eleventhSpot" cx="50%" cy="0%" r="90%" fx="50%" fy="0%">
            <stop offset="0%" stopColor="#7A1F1F" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#0D0404" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0D0404" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="eleventhRope" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#E85A2D" stopOpacity="0" />
            <stop offset="20%" stopColor="#E85A2D" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#E85A2D" stopOpacity="1" />
            <stop offset="80%" stopColor="#E85A2D" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E85A2D" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Arena spotlight */}
        <rect width="400" height="300" fill="url(#eleventhSpot)" className="eleventh-spotlight" />

        {/* Ring floor perspective */}
        <path
          d="M60 230 L340 230 L380 275 L20 275 Z"
          fill="none"
          stroke="#E85A2D"
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Floor cross lines */}
        <line x1="200" y1="230" x2="200" y2="275" stroke="#7A1F1F" strokeWidth="1" opacity="0.4" />
        <line x1="60" y1="230" x2="20" y2="275" stroke="#7A1F1F" strokeWidth="1" opacity="0.25" />
        <line x1="340" y1="230" x2="380" y2="275" stroke="#7A1F1F" strokeWidth="1" opacity="0.25" />

        {/* Corner posts */}
        <line x1="60" y1="90" x2="60" y2="230" stroke="#E85A2D" strokeWidth="3" opacity="0.7" />
        <line x1="340" y1="90" x2="340" y2="230" stroke="#E85A2D" strokeWidth="3" opacity="0.7" />

        {/* Ropes */}
        <line x1="60" y1="125" x2="340" y2="125" stroke="url(#eleventhRope)" strokeWidth="2" className="eleventh-rope" />
        <line x1="60" y1="165" x2="340" y2="165" stroke="url(#eleventhRope)" strokeWidth="2" className="eleventh-rope" style={{ animationDelay: '0.5s' }} />
        <line x1="60" y1="205" x2="340" y2="205" stroke="url(#eleventhRope)" strokeWidth="2" className="eleventh-rope" style={{ animationDelay: '1s' }} />

        {/* Round number */}
        <g transform="translate(200, 82)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            letterSpacing="6"
            opacity="0.6"
          >
            ROUND
          </text>
          <text
            x="0"
            y="46"
            textAnchor="middle"
            fill="#E85A2D"
            fontSize="64"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            fontWeight="900"
            letterSpacing="-3"
          >
            11
          </text>
        </g>

        {/* Punch motion burst */}
        <g transform="translate(320, 150)" opacity="0.55">
          <line x1="0" y1="0" x2="50" y2="-8" stroke="#E85A2D" strokeWidth="2" />
          <line x1="0" y1="8" x2="46" y2="0" stroke="#E85A2D" strokeWidth="2" />
          <line x1="0" y1="16" x2="50" y2="16" stroke="#E85A2D" strokeWidth="2" />
          <circle cx="58" cy="-8" r="2.5" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};