import React from 'react';

const ProjectAcctomaticVisual = (props: { className?: string }) => {
  return (
    <div
      className={props.className}
      style={{
        width: '100%',
        height: '100%',
        background: '#0D0404',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes acctomatic-scan {
          0% { transform: translateY(-50px); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { transform: translateY(240px); opacity: 0; }
        }
        @keyframes acctomatic-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes acctomatic-flow {
          to { stroke-dashoffset: 0; }
        }
        .acctomatic-scan-line {
          animation: acctomatic-scan 3s ease-in-out infinite;
        }
        .acctomatic-field {
          animation: acctomatic-pulse 2.5s ease-in-out infinite;
        }
        .acctomatic-field-a { animation-delay: 0s; }
        .acctomatic-field-b { animation-delay: 0.5s; }
        .acctomatic-field-c { animation-delay: 1s; }
        .acctomatic-pipeline {
          animation: acctomatic-flow 1.4s linear infinite;
        }
        .acctomatic-pipeline-b { animation-delay: -0.7s; }
        .acctomatic-pipeline-c { animation-delay: -1.4s; }
      `}</style>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="acctomatic-glow" cx="0.3" cy="0.4" r="0.8">
            <stop offset="0%" stopColor="#E85A2D" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0D0404" stopOpacity="0" />
          </radialGradient>
          <pattern id="acctomatic-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#E85A2D" opacity="0.07" />
          </pattern>
        </defs>

        <rect width="400" height="300" fill="#0D0404" />
        <rect width="400" height="300" fill="url(#acctomatic-grid)" />
        <rect x="40" y="20" width="320" height="260" rx="16" fill="url(#acctomatic-glow)" />

        {/* Invoice document */}
        <g transform="translate(44, 54)">
          <rect x="0" y="0" width="132" height="192" rx="8" fill="#FFFFFF" fillOpacity="0.03" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1.5" />
          {/* Header */}
          <rect x="16" y="20" width="64" height="7" rx="2" fill="#FFFFFF" fillOpacity="0.22" />
          <rect x="16" y="34" width="44" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          {/* Table rows */}
          <rect x="16" y="64" width="100" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="76" width="92" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="88" width="80" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="112" width="100" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="124" width="72" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="148" width="100" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          <rect x="16" y="160" width="56" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.12" />
          {/* Scan beam */}
          <rect x="4" y="0" width="124" height="2" rx="1" fill="#E85A2D" className="acctomatic-scan-line" />
          <rect x="4" y="0" width="124" height="20" rx="1" fill="#E85A2D" fillOpacity="0.08" className="acctomatic-scan-line" />
        </g>

        {/* Extraction pipelines */}
        <path
          d="M 176 110 C 210 110, 210 88, 252 88"
          fill="none"
          stroke="#E85A2D"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeDasharray="5 5"
          strokeDashoffset="10"
          className="acctomatic-pipeline"
        />
        <path
          d="M 176 150 C 210 150, 210 148, 252 148"
          fill="none"
          stroke="#E85A2D"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeDasharray="5 5"
          strokeDashoffset="10"
          className="acctomatic-pipeline acctomatic-pipeline-b"
        />
        <path
          d="M 176 190 C 210 190, 210 208, 252 208"
          fill="none"
          stroke="#7A1F1F"
          strokeWidth="1.5"
          strokeOpacity="0.7"
          strokeDasharray="5 5"
          strokeDashoffset="10"
          className="acctomatic-pipeline acctomatic-pipeline-c"
        />

        {/* Structured output cards */}
        <g transform="translate(252, 68)">
          <g className="acctomatic-field acctomatic-field-a">
            <rect x="0" y="0" width="96" height="40" rx="6" fill="#FFFFFF" fillOpacity="0.04" stroke="#E85A2D" strokeOpacity="0.65" strokeWidth="1" />
            <rect x="12" y="12" width="40" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.25" />
            <rect x="12" y="21" width="60" height="6" rx="2" fill="#E85A2D" fillOpacity="0.8" />
          </g>
          <g className="acctomatic-field acctomatic-field-b" transform="translate(0, 60)">
            <rect x="0" y="0" width="96" height="40" rx="6" fill="#FFFFFF" fillOpacity="0.04" stroke="#E85A2D" strokeOpacity="0.65" strokeWidth="1" />
            <rect x="12" y="12" width="36" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.25" />
            <rect x="12" y="21" width="52" height="6" rx="2" fill="#E85A2D" fillOpacity="0.8" />
          </g>
          <g className="acctomatic-field acctomatic-field-c" transform="translate(0, 120)">
            <rect x="0" y="0" width="96" height="40" rx="6" fill="#FFFFFF" fillOpacity="0.04" stroke="#7A1F1F" strokeOpacity="0.9" strokeWidth="1.5" />
            <rect x="12" y="12" width="32" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.25" />
            <rect x="12" y="21" width="40" height="6" rx="2" fill="#7A1F1F" fillOpacity="0.9" />
            <circle cx="82" cy="10" r="3" fill="#E85A2D" />
          </g>
        </g>

        {/* State-machine ring */}
        <g transform="translate(340, 238)">
          <circle cx="0" cy="0" r="16" fill="none" stroke="#7A1F1F" strokeWidth="2" strokeOpacity="0.5" />
          <circle cx="0" cy="0" r="10" fill="none" stroke="#E85A2D" strokeWidth="2" strokeOpacity="0.9" />
          <circle cx="0" cy="0" r="4" fill="#E85A2D" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
};

export default ProjectAcctomaticVisual;