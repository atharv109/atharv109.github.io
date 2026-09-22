import React from 'react';

export default function ProjectCryptonVisual({ className }: { className?: string }): React.ReactNode {
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
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E85A2D" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#7A1F1F" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0D0404" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7A1F1F" />
            <stop offset="50%" stopColor="#E85A2D" />
            <stop offset="100%" stopColor="#7A1F1F" />
          </linearGradient>
        </defs>

        <rect width="400" height="400" fill="#0D0404" />
        <circle cx="200" cy="200" r="180" fill="url(#coreGlow)" />

        <g transform="translate(200, 200)">
          <circle r="170" fill="none" stroke="#7A1F1F" strokeWidth="1" opacity="0.25" />
          <circle r="150" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="30s" repeatCount="indefinite" />
          </circle>
          <circle r="125" fill="none" stroke="#E85A2D" strokeWidth="1" strokeDasharray="18 9" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="22s" repeatCount="indefinite" />
          </circle>
          <circle r="100" fill="none" stroke="#7A1F1F" strokeWidth="2" strokeDasharray="40 20" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="18s" repeatCount="indefinite" />
          </circle>

          <circle r="95" fill="none" stroke="#E85A2D" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="95;145;95" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.35;0" dur="5s" repeatCount="indefinite" />
          </circle>

          <path
            d="M0,-70 L61,-35 L61,35 L0,70 L-61,35 L-61,-35 Z"
            fill="none"
            stroke="#E85A2D"
            strokeWidth="3"
          />
          <path
            d="M0,-52 L46,-26 L46,26 L0,52 L-46,26 L-46,-26 Z"
            fill="#7A1F1F"
            fillOpacity="0.35"
            stroke="#E85A2D"
            strokeWidth="1.5"
          />

          <g transform="translate(0, -8)">
            <circle cx="0" cy="-18" r="12" fill="none" stroke="#E85A2D" strokeWidth="3" />
            <rect x="-4" y="-8" width="8" height="42" rx="1" fill="#E85A2D" />
            <rect x="4" y="22" width="10" height="4" fill="#E85A2D" />
            <rect x="4" y="30" width="10" height="4" fill="#E85A2D" />
          </g>

          <g>
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite" />
            <circle cx="150" cy="0" r="7" fill="#0D0404" stroke="#E85A2D" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="150" y2="0" stroke="#E85A2D" strokeWidth="0.5" opacity="0.4" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="120" to="480" dur="14s" repeatCount="indefinite" />
            <circle cx="150" cy="0" r="6" fill="#0D0404" stroke="#E85A2D" strokeWidth="2" />
            <line x1="0" y1="0" x2="150" y2="0" stroke="#E85A2D" strokeWidth="0.5" opacity="0.4" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="240" to="600" dur="14s" repeatCount="indefinite" />
            <circle cx="150" cy="0" r="5" fill="#0D0404" stroke="#7A1F1F" strokeWidth="2" />
            <line x1="0" y1="0" x2="150" y2="0" stroke="#7A1F1F" strokeWidth="0.5" opacity="0.4" />
          </g>
        </g>
      </svg>
    </div>
  );
}
