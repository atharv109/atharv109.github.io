import { useRef, type ReactNode } from 'react'
import { useTextScramble } from '../hooks/useTextScramble'
import { useMagneticButton } from '../hooks/useMagneticButton'

interface ScrambleLinkProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  magnetic?: boolean
  'data-cursor-hover'?: boolean
}

export function ScrambleLink({ children, href, magnetic = true, className = '', ...rest }: ScrambleLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  useTextScramble(ref)
  if (magnetic) useMagneticButton(ref, 0.25)

  return (
    <a ref={ref} href={href} className={`inline-block ${className}`} {...rest}>
      {children}
    </a>
  )
}

export function ScrambleButton({ children, magnetic = true, className = '', ...rest }: Omit<ScrambleLinkProps, 'href' | 'target' | 'rel'>) {
  const ref = useRef<HTMLButtonElement>(null)
  useTextScramble(ref)
  if (magnetic) useMagneticButton(ref, 0.25)

  return (
    <button ref={ref} className={`inline-block ${className}`} {...rest}>
      {children}
    </button>
  )
}
