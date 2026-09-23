import { useRef, type ReactNode } from 'react'
import { useTextScramble } from '../hooks/useTextScramble'

interface ScrambleLinkProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  'data-cursor-hover'?: boolean
}

export function ScrambleLink({ children, href, className = '', ...rest }: ScrambleLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null)
  useTextScramble(ref)

  return (
    <a ref={ref} href={href} className={`inline-block ${className}`} {...rest}>
      {children}
    </a>
  )
}

export function ScrambleButton({ children, className = '', ...rest }: Omit<ScrambleLinkProps, 'href' | 'target' | 'rel'>) {
  const ref = useRef<HTMLButtonElement>(null)
  useTextScramble(ref)

  return (
    <button ref={ref} className={`inline-block ${className}`} {...rest}>
      {children}
    </button>
  )
}
