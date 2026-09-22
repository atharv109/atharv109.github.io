import React from 'react';

export interface ProjectPromptOptimiserVisualProps {
  className?: string;
}

export const ProjectPromptOptimiserVisual: React.FC<ProjectPromptOptimiserVisualProps> = ({
  className,
}) => {
  return (
    <div
      className={['prompt-optimiser-visual', className].filter(Boolean).join(' ')}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0D0404',
      }}
    >
      <style>{`
        .prompt-optimiser-visual__browser-frame {
          fill: none;
          stroke: #E85A2D;
          stroke-opacity: 0.28;
          stroke-width: 1;
        }
        .prompt-optimiser-visual__top-rule {
          stroke: #E85A2D;
          stroke-opacity: 0.18;
          stroke-width: 1;
        }
        .prompt-optimiser-visual__dot {
          fill: #7A1F1F;
        }
        .prompt-optimiser-visual__address-bar {
          fill: #7A1F1F;
          fill-opacity: 0.35;
        }
        .prompt-optimiser-visual__prompt-line {
          fill: #E85A2D;
          fill-opacity: 0.16;
        }
        .prompt-optimiser-visual__output-line {
          fill: #FFFFFF;
          fill-opacity: 0.12;
        }
        .prompt-optimiser-visual__stage {
          fill: #7A1F1F;
          stroke: #E85A2D;
          stroke-width: 1.5;
          animation: promptOptimiserStagePulse 2.8s ease-in-out infinite;
        }
        .prompt-optimiser-visual__stage:nth-of-type(1) { animation-delay: 0s; }
        .prompt-optimiser-visual__stage:nth-of-type(2) { animation-delay: 0.4s; }
        .prompt-optimiser-visual__stage:nth-of-type(3) { animation-delay: 0.8s; }
        .prompt-optimiser-visual__stage:nth-of-type(4) { animation-delay: 1.2s; }
        .prompt-optimiser-visual__stage:nth-of-type(5) { animation-delay: 1.6s; }
        .prompt-optimiser-visual__stage:nth-of-type(6) { animation-delay: 2s; }
        .prompt-optimiser-visual__stage-text {
          fill: #FFFFFF;
          font-size: 9px;
          font-weight: 700;
          font-family: 'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
        }
        .prompt-optimiser-visual__flow {
          fill: none;
          stroke: #E85A2D;
          stroke-width: 1.5;
          stroke-dasharray: 5 5;
          animation: promptOptimiserFlow 1s linear infinite;
          opacity: 0.6;
        }
        .prompt-optimiser-visual__button {
          animation: promptOptimiserButtonGlow 2.2s ease-in-out infinite;
        }
        .prompt-optimiser-visual__button-text {
          fill: #0D0404;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }
        .prompt-optimiser-visual__packet {
          fill: #E85A2D;
          filter: drop-shadow(0 0 3px rgba(232, 90, 45, 0.7));
        }
        .prompt-optimiser-visual__packet--trail {
          fill: #FFFFFF;
          fill-opacity: 0.5;
        }
        @keyframes promptOptimiserStagePulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; filter: drop-shadow(0 0 6px rgba(232, 90, 45, 0.55)); }
        }
        @keyframes promptOptimiserButtonGlow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(232, 90, 45, 0.3)); }
          50% { filter: drop-shadow(0 0 14px rgba(232, 90, 45, 0.65)); }
        }
        @keyframes promptOptimiserFlow {
          to { stroke-dashoffset: -20; }
        }
      `}</style>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="ppv-button-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E85A2D" />
            <stop offset="100%" stopColor="#7A1F1F" />
          </linearGradient>
        </defs>

        {/* Browser chrome */}
        <rect x="30" y="24" width="340" height="252" rx="12" className="prompt-optimiser-visual__browser-frame" />
        <line x1="30" y1="60" x2="370" y2="60" className="prompt-optimiser-visual__top-rule" />
        <circle cx="56" cy="43" r="5" className="prompt-optimiser-visual__dot" />
        <circle cx="76" cy="43" r="5" className="prompt-optimiser-visual__dot" />
        <circle cx="96" cy="43" r="5" className="prompt-optimiser-visual__dot" />
        <rect x="122" y="37" width="170" height="12" rx="6" className="prompt-optimiser-visual__address-bar" />
        <rect x="305" y="34" width="48" height="18" rx="4" fill="url(#ppv-button-grad)" className="prompt-optimiser-visual__button" />
        <text x="329" y="46" textAnchor="middle" className="prompt-optimiser-visual__button-text">OPTIMIZE</text>

        {/* Prompt text */}
        <rect x="52" y="82" width="168" height="11" rx="5.5" className="prompt-optimiser-visual__prompt-line" />
        <rect x="52" y="102" width="112" height="9" rx="4.5" className="prompt-optimiser-visual__prompt-line" />
        <rect x="52" y="119" width="76" height="8" rx="4" className="prompt-optimiser-visual__prompt-line" />

        {/* Optimized output text */}
        <rect x="210" y="236" width="132" height="10" rx="5" className="prompt-optimiser-visual__output-line" />
        <rect x="210" y="252" width="88" height="8" rx="4" className="prompt-optimiser-visual__output-line" />

        {/* Pipeline flow path */}
        <path
          d="M 80 135 L 80 180 L 294 180 L 294 226"
          className="prompt-optimiser-visual__flow"
        />

        {/* Six pipeline stages */}
        <rect x="66" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="80" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">1</text>

        <rect x="108" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="122" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">2</text>

        <rect x="150" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="164" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">3</text>

        <rect x="192" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="206" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">4</text>

        <rect x="234" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="248" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">5</text>

        <rect x="276" y="164" width="28" height="32" rx="6" className="prompt-optimiser-visual__stage" />
        <text x="290" y="184" textAnchor="middle" className="prompt-optimiser-visual__stage-text">6</text>

        {/* Flowing data packets */}
        <circle r="4" className="prompt-optimiser-visual__packet">
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path="M 80 135 L 80 180 L 294 180 L 294 226"
          />
        </circle>
        <circle r="2.5" className="prompt-optimiser-visual__packet--trail">
          <animateMotion
            dur="3s"
            begin="1.5s"
            repeatCount="indefinite"
            path="M 80 135 L 80 180 L 294 180 L 294 226"
          />
        </circle>
      </svg>
    </div>
  );
};

export default ProjectPromptOptimiserVisual;
