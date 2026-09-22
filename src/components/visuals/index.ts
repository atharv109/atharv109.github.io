import { ProjectEleventhRoundVisual } from './ProjectEleventhRoundVisual'
import ProjectVulnswarmVexVisual from './ProjectVulnswarmVexVisual'
import { ProjectPromptOptimiserVisual } from './ProjectPromptOptimiserVisual'
import { ProjectAdversaryLabVisual } from './ProjectAdversaryLabVisual'
import ProjectAcctomaticVisual from './ProjectAcctomaticVisual'
import ProjectCryptonVisual from './ProjectCryptonVisual'

export const projectVisuals: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  'eleventh-round': ProjectEleventhRoundVisual,
  'vulnswarm-vex': ProjectVulnswarmVexVisual,
  'prompt-optimiser': ProjectPromptOptimiserVisual,
  'adversary-lab': ProjectAdversaryLabVisual,
  'acctomatic': ProjectAcctomaticVisual,
  'crypton': ProjectCryptonVisual,
}
