import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
} from "react"
import confetti, {
  type CreateTypes as ConfettiInstance,
  type GlobalOptions as ConfettiGlobalOptions,
  type Options as ConfettiOptions,
} from "canvas-confetti"

export type ConfettiRef = {
  fire: (options?: ConfettiOptions) => void
  reset: () => void
}

type ConfettiProps = ComponentPropsWithoutRef<"canvas"> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
}

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  ({ options, globalOptions, manualstart = false, ...canvasProps }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const instanceRef = useRef<ConfettiInstance | null>(null)
    const optionsRef = useRef(options)
    const globalOptionsRef = useRef(globalOptions)

    useEffect(() => {
      optionsRef.current = options
    }, [options])

    useEffect(() => {
      if (!canvasRef.current) return
      instanceRef.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
        ...globalOptionsRef.current,
      })
      const warmUp = window.setTimeout(() => void instanceRef.current?.({ particleCount: 0 })?.catch(() => undefined), 1200)
      return () => {
        window.clearTimeout(warmUp)
        instanceRef.current?.reset()
        instanceRef.current = null
      }
    }, [])

    const fire = useCallback((overrides: ConfettiOptions = {}) => {
      void instanceRef.current?.({ ...optionsRef.current, ...overrides })?.catch(() => undefined)
    }, [])

    const reset = useCallback(() => instanceRef.current?.reset(), [])

    const api = useMemo<ConfettiRef>(() => ({ fire, reset }), [fire, reset])

    useImperativeHandle(ref, () => api, [api])

    useEffect(() => {
      if (!manualstart) fire()
    }, [manualstart, fire])

    return <canvas ref={canvasRef} {...canvasProps} />
  },
)

Confetti.displayName = "Confetti"
