import React from 'react';

export default function ProjectVulnswarmVexVisual(props: { className?: string }): React.ReactNode {
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
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 440 320'
        preserveAspectRatio='xMidYMid meet'
        width='100%'
        height='100%'
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id='vv-glow' cx='50%' cy='50%' r='50%'>
            <stop offset='0%' stopColor='#E85A2D' stopOpacity='0.5' />
            <stop offset='100%' stopColor='#E85A2D' stopOpacity='0' />
          </radialGradient>
        </defs>
        <style>{`
          .vv-edge { fill: none; stroke: #7A1F1F; stroke-width: 1.5; stroke-linecap: round; opacity: 0.7; }
          .vv-flow { fill: none; stroke: #E85A2D; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 6 10; animation: vv-flow 1.8s linear infinite; }
          .vv-node { fill: #7A1F1F; }
          .vv-hub { fill: #E85A2D; }
          .vv-text { fill: #FFFFFF; font-family: system-ui, -apple-system, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.03em; }
          .vv-label { fill: rgba(255,255,255,0.55); font-family: system-ui, -apple-system, sans-serif; font-size: 8px; }
          .vv-pulse { transform-origin: center; transform-box: fill-box; animation: vv-pulse 3s ease-in-out infinite; }
          @keyframes vv-flow { to { stroke-dashoffset: -16; } }
          @keyframes vv-pulse { 0%, 100% { opacity: 0.25; transform: scale(0.9); } 50% { opacity: 0.55; transform: scale(1.15); } }
        `}</style>

        {/* faint grid */}
        <g stroke='#7A1F1F' strokeOpacity='0.1' strokeWidth='1'>
          <line x1='40' y1='40' x2='400' y2='40' />
          <line x1='40' y1='160' x2='400' y2='160' />
          <line x1='40' y1='280' x2='400' y2='280' />
          <line x1='40' y1='40' x2='40' y2='280' />
          <line x1='160' y1='40' x2='160' y2='280' />
          <line x1='350' y1='40' x2='350' y2='280' />
          <line x1='400' y1='40' x2='400' y2='280' />
        </g>

        {/* advisory sources -> evidence checks */}
        <path className='vv-edge' d='M50 70 C100 70,120 110,150 110' />
        <path className='vv-edge' d='M50 130 C100 130,120 110,150 110' />
        <path className='vv-edge' d='M50 130 C110 130,140 160,170 160' />
        <path className='vv-edge' d='M50 190 C110 190,140 160,170 160' />
        <path className='vv-edge' d='M50 250 C100 250,140 210,170 210' />
        <path className='vv-edge' d='M50 190 C100 190,140 210,170 210' />
        <path className='vv-edge' d='M50 70 C100 70,160 110,210 110' />

        {/* evidence -> verdict decisions (animated flow) */}
        <path className='vv-flow' d='M150 110 C250 110,300 100,350 100' />
        <path className='vv-flow' d='M210 110 C280 110,320 160,350 160' />
        <path className='vv-flow' d='M170 160 C260 160,310 160,350 160' />
        <path className='vv-flow' d='M170 210 C250 210,300 220,350 220' />

        {/* verdicts -> final VEX output */}
        <path className='vv-edge' d='M350 100 C370 100,380 140,400 160' />
        <path className='vv-edge' d='M350 160 C370 160,390 160,400 160' />
        <path className='vv-edge' d='M350 220 C370 220,380 180,400 160' />

        {/* advisory source nodes */}
        <circle cx='50' cy='70' r='6' className='vv-node' />
        <circle cx='50' cy='130' r='6' className='vv-node' />
        <circle cx='50' cy='190' r='6' className='vv-node' />
        <circle cx='50' cy='250' r='6' className='vv-node' />
        <text x='50' y='70' className='vv-text' textAnchor='middle' dy='-12'>OSV</text>
        <text x='50' y='130' className='vv-text' textAnchor='middle' dy='-12'>CVE</text>
        <text x='50' y='190' className='vv-text' textAnchor='middle' dy='-12'>GHSA</text>
        <text x='50' y='250' className='vv-text' textAnchor='middle' dy='-12'>PYSEC</text>

        {/* evidence cluster */}
        <circle cx='150' cy='110' r='16' fill='url(#vv-glow)' className='vv-pulse' />
        <circle cx='210' cy='110' r='16' fill='url(#vv-glow)' className='vv-pulse' />
        <circle cx='170' cy='210' r='16' fill='url(#vv-glow)' className='vv-pulse' />
        <circle cx='150' cy='110' r='5' className='vv-hub' />
        <circle cx='210' cy='110' r='5' className='vv-hub' />
        <circle cx='170' cy='210' r='5' className='vv-hub' />
        <text x='150' y='110' className='vv-text' textAnchor='middle' dy='20'>reach</text>
        <text x='210' y='110' className='vv-text' textAnchor='middle' dy='20'>version</text>
        <text x='170' y='210' className='vv-text' textAnchor='middle' dy='20'>context</text>

        {/* central Z3 reasoning hub */}
        <circle cx='170' cy='160' r='32' fill='url(#vv-glow)' className='vv-pulse' />
        <circle cx='170' cy='160' r='12' className='vv-hub' />
        <text x='170' y='160' className='vv-text' textAnchor='middle' dy='4'>Z3</text>

        {/* verdict nodes */}
        <circle cx='350' cy='100' r='14' className='vv-node' />
        <circle cx='350' cy='100' r='7' className='vv-hub' />
        <text x='350' y='100' className='vv-text' textAnchor='middle' dy='-20'>affected</text>

        <circle cx='350' cy='160' r='14' className='vv-node' />
        <circle cx='350' cy='160' r='7' className='vv-hub' />
        <text x='350' y='160' className='vv-text' textAnchor='middle' dy='-20'>not_affected</text>

        <circle cx='350' cy='220' r='14' className='vv-node' />
        <circle cx='350' cy='220' r='7' className='vv-hub' />
        <text x='350' y='220' className='vv-text' textAnchor='middle' dy='-20'>manual_review</text>

        {/* VEX output collector */}
        <circle cx='400' cy='160' r='18' fill='url(#vv-glow)' className='vv-pulse' />
        <circle cx='400' cy='160' r='9' className='vv-hub' />
        <text x='400' y='160' className='vv-text' textAnchor='middle' dy='26'>VEX</text>
        <text x='400' y='160' className='vv-label' textAnchor='middle' dy='34'>VERDICT</text>
      </svg>
    </div>
  );
}
