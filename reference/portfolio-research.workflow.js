export const meta = {
  name: 'portfolio-research-and-visuals',
  description: 'Study portfolio projects and generate abstract visual concepts',
  phases: [
    { title: 'Research', detail: 'Read public repos and profile data for each project' },
    { title: 'Visuals', detail: 'Design abstract SVG/React visual components' }
  ]
}

const projectSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    timeframe: { type: 'string' },
    oneLiner: { type: 'string' },
    description: { type: 'string' },
    techStack: { type: 'array', items: { type: 'string' } },
    keyMetrics: { type: 'array', items: { type: 'string' } },
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          url: { type: 'string' }
        },
        required: ['label', 'url']
      }
    },
    visualTheme: { type: 'string' },
    colorHints: { type: 'array', items: { type: 'string' } }
  },
  required: ['id', 'name', 'role', 'timeframe', 'oneLiner', 'description', 'techStack', 'visualTheme']
}

const visualSchema = {
  type: 'object',
  properties: {
    projectId: { type: 'string' },
    projectName: { type: 'string' },
    componentName: { type: 'string' },
    description: { type: 'string' },
    componentCode: { type: 'string' },
    dependencies: { type: 'array', items: { type: 'string' } }
  },
  required: ['projectId', 'projectName', 'componentName', 'componentCode']
}

const { projects, profilePath } = args

phase('Research')
log(`Researching ${projects.length} projects in parallel`)
const researchResults = await parallel(projects.map((p) => () => {
  const prompt = `Study this portfolio project and return a structured, recruiter-friendly summary.

Project data:
${JSON.stringify(p, null, 2)}

Context file: ${profilePath}

Instructions:
1. If repoUrl is provided and repoVisibility is public, read the repository with gh repo view and/or WebFetch on the README to add concrete technical detail. Do not invent features.
2. If liveUrl is provided, you may briefly inspect it with WebFetch for visual/UX context.
3. If the repo is private, missing, or inaccessible, rely ONLY on the provided data. Never invent facts.
4. Return id, name, role, timeframe, oneLiner (max 12 words), description (2-3 sentences), techStack, keyMetrics (from data only), links (array of {label, url}), visualTheme (one short phrase), and colorHints (2-3 hex colors that fit both the project and the portfolio palette #0D0404 / #E85A2D / #7A1F1F).
5. Do not claim publication acceptance, production scale, or outcomes not in the data.`
  return agent(prompt, { phase: 'Research', schema: projectSchema, label: `research-${p.id}` })
}))

phase('Visuals')
const featured = researchResults.filter(Boolean).filter(r => {
  const original = projects.find(p => p.id === r.id)
  return original && original.category === 'featured'
})
log(`Generating visuals for ${featured.length} featured projects`)
const visualResults = await parallel(featured.map((r) => () => {
  const prompt = `Design an abstract project-card visual for this portfolio project. Return a complete React component as a string.

Project summary:
${JSON.stringify(r, null, 2)}

Requirements:
- Component name must be "Project${r.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/-/g, '').replace(/^./, c => c.toUpperCase())}Visual". Example: "ProjectEleventhRoundVisual".
- Use SVG or pure HTML inside the component. No raster image assets.
- Palette: near-black background #0D0404, burnt orange accent #E85A2D, deep burgundy secondary #7A1F1F. Use only these plus whites/transparent.
- Abstract, geometric, thematically tied to the project domain.
- Component signature: (props: { className?: string }) => React.ReactNode.
- Return a div that fills width and height 100% (use a fixed aspect ratio wrapper on the consumer side).
- Keep animation limited to CSS transitions/keyframes or SVG SMIL. No JS animation libraries inside the component.
- Provide the full TypeScript React component as a single string in componentCode. Include "import React from 'react'" if needed.
- dependencies should be an array of required runtime packages beyond React (usually empty).`
  return agent(prompt, { phase: 'Visuals', schema: visualSchema, label: `visual-${r.id}` })
}))

return {
  research: researchResults.filter(Boolean),
  visuals: visualResults.filter(Boolean)
}
