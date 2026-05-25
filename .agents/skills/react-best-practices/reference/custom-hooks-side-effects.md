---
name: custom-hooks-side-effects
description: Always cleanup side effects in custom hooks to prevent memory leaks.
---

# Custom Hooks Side Effects

Always cleanup side effects in custom hooks to prevent memory leaks and unexpected behavior.

## The Problem

```tsx
// DON'T - No cleanup
function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const timer = setInterval(callback, delay)
    // No cleanup - timer keeps running after unmount!
  }, [callback, delay])
}

function Component() {
  useInterval(() => console.log('tick'), 1000)
  return <div>Component</div>
}
```

## The Solution

```tsx
// DO - Always cleanup
function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const timer = setInterval(callback, delay)
    return () => clearInterval(timer)
  }, [callback, delay])
}

function Component() {
  useInterval(() => console.log('tick'), 1000)
  return <div>Component</div>
}
```

## Common Patterns

### 1. Event Listeners

```tsx
function useKeyPress(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) callback()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}

function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback()
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [ref, callback])
}

function useScroll(callback: () => void) {
  useEffect(() => {
    window.addEventListener('scroll', callback)
    return () => window.removeEventListener('scroll', callback)
  }, [callback])
}
```

### 2. Timers

```tsx
function useTimeout(callback: () => void, delay: number) {
  useEffect(() => {
    const timer = setTimeout(callback, delay)
    return () => clearTimeout(timer)
  }, [callback, delay])
}

function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const timer = setInterval(callback, delay)
    return () => clearInterval(timer)
  }, [callback, delay])
}

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

### 3. Subscriptions

```tsx
function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [url])

  return { socket, messages }
}

function useEventEmitter<T>(emitter: EventEmitter<T>, eventName: string, callback: (data: T) => void) {
  useEffect(() => {
    emitter.on(eventName, callback)
    return () => emitter.off(eventName, callback)
  }, [emitter, eventName, callback])
}

function useObservable<T>(observable: Observable<T>) {
  const [value, setValue] = useState<T | null>(null)

  useEffect(() => {
    const subscription = observable.subscribe(setValue)
    return () => subscription.unsubscribe()
  }, [observable])

  return value
}
```

### 4. Fetch with AbortController

```tsx
function useFetch(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        const json = await res.json()
        if (!controller.signal.aborted) {
          setData(json)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => controller.abort()
  }, [url])

  return { data, loading, error }
}
```

### 5. Window Events

```tsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

function useScrollPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setPosition({
        x: window.scrollX,
        y: window.scrollY
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return position
}
```

### 6. Local Storage

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function useLocalStorageSync<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage(key, initialValue)

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, setValue])

  return [value, setValue] as const
}
```

### 7. Animation Frame

```tsx
function useAnimationFrame(callback: () => void) {
  useEffect(() => {
    let animationFrameId: number

    const loop = () => {
      callback()
      animationFrameId = requestAnimationFrame(loop)
    }

    animationFrameId = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animationFrameId)
  }, [callback])
}

function useSpring(value: number, stiffness: number = 0.1, damping: number = 0.8) {
  const [current, setCurrent] = useState(value)
  const [velocity, setVelocity] = useState(0)

  useAnimationFrame(() => {
    const force = (value - current) * stiffness
    const acceleration = force - velocity * damping
    setVelocity(v => v + acceleration)
    setCurrent(c => c + velocity)
  })

  return current
}
```

### 8. Media Queries

```tsx
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
  const isDesktop = useMediaQuery('(min-width: 1025px)')

  return { isMobile, isTablet, isDesktop }
}
```

## Common Mistakes

### Mistake 1. No Cleanup

```tsx
// DON'T - No cleanup
function useHook() {
  useEffect(() => {
    const timer = setInterval(() => {}, 1000)
    // No cleanup
  }, [])
}

// DO - Always cleanup
function useHook() {
  useEffect(() => {
    const timer = setInterval(() => {}, 1000)
    return () => clearInterval(timer)
  }, [])
}
```

### Mistake 2. Cleanup Runs After Effect

```tsx
// DON'T - Wrong order
function useHook() {
  useEffect(() => {
    return () => console.log('Cleanup')
    console.log('Effect')
  }, [])
}

// DO - Effect first, then cleanup
function useHook() {
  useEffect(() => {
    console.log('Effect')
    return () => console.log('Cleanup')
  }, [])
}
```

### Mistake 3. Multiple Cleanup Functions

```tsx
// DON'T - Only last cleanup runs
function useHook() {
  useEffect(() => {
    const timer1 = setInterval(() => {}, 1000)
    const timer2 = setInterval(() => {}, 2000)

    return () => clearInterval(timer1)
    return () => clearInterval(timer2)
  }, [])
}

// DO - Single cleanup function
function useHook() {
  useEffect(() => {
    const timer1 = setInterval(() => {}, 1000)
    const timer2 = setInterval(() => {}, 2000)

    return () => {
      clearInterval(timer1)
      clearInterval(timer2)
    }
  }, [])
}
```

### Mistake 4. Not Cleaning Up Async Operations

```tsx
// DON'T - No cleanup for async
function useHook(url: string) {
  useEffect(() => {
    fetch(url).then(data => console.log(data))
    // No cleanup
  }, [url])
}

// DO - Cleanup async operations
function useHook(url: string) {
  useEffect(() => {
    const controller = new AbortController()

    fetch(url, { signal: controller.signal })
      .then(data => console.log(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      })

    return () => controller.abort()
  }, [url])
}
```

## Key Takeaways

- Always cleanup side effects in custom hooks
- Return cleanup function from useEffect
- Cleanup runs before unmount and before re-run
- Clean up: timers, event listeners, subscriptions
- Use AbortController for fetch requests
- Cleanup animation frames and intervals
- Remove event listeners properly
- Prevent memory leaks
