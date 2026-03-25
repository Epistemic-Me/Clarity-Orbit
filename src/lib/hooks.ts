import { useEffect, useState, useRef } from 'react'

export function useAnimatedNumber(value: number, duration: number = 400): number {
  const [display, setDisplay] = useState(value)
  const startRef = useRef(value)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === display) return
    startRef.current = display
    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      if (!startTimeRef.current) return
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(2, -10 * progress)
      const current = startRef.current + (value - startRef.current) * ease
      setDisplay(Math.round(current))
      if (progress < 1) requestAnimationFrame(animate)
      else setDisplay(value)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return display
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined)
  useEffect(() => { ref.current = value }, [value])
  return ref.current
}

export function usePersistedState<T>(key: string, initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`clarity-orbit:${key}`)
      if (stored) return JSON.parse(stored)
    } catch (_e) { /* ignore */ }
    return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(`clarity-orbit:${key}`, JSON.stringify(state))
    } catch (_e) { /* ignore */ }
  }, [key, state])

  return [state, setState]
}
