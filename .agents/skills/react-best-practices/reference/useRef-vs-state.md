---
name: useRef-vs-state
description: Use useRef for values that don't trigger re-renders, useState for values that do.
---

# useRef vs useState

Use useRef for values that don't trigger re-renders, useState for values that do.

## The Difference

### useState (Triggers Re-render)

```tsx
// DO - useState for values that need to trigger re-renders
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
```

### useRef (No Re-render)

```tsx
// DO - useRef for values that don't need to trigger re-renders
function Timer() {
  const timerRef = useRef<number | null>(null)

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      console.log('Timer tick')
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <div>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  )
}
```

## Common Patterns

### 1. Storing Previous Value

```tsx
// DON'T - Using state for previous value causes extra re-renders
function Component() {
  const [count, setCount] = useState(0)
  const [prevCount, setPrevCount] = useState(0)

  useEffect(() => {
    setPrevCount(count)
  }, [count])

  return <div>Current: {count}, Previous: {prevCount}</div>
}

// DO - Use useRef to store previous value
function Component() {
  const [count, setCount] = useState(0)
  const prevCountRef = useRef(count)

  useEffect(() => {
    prevCountRef.current = count
  }, [count])

  return <div>Current: {count}, Previous: {prevCountRef.current}</div>
}
```

### 2. Storing DOM Elements

```tsx
// DO - Use useRef to store DOM element references
function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} />
}

function ScrollToBottom() {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div>
      <div style={{ height: '1000px' }}>Scroll down</div>
      <div ref={bottomRef}>Bottom</div>
    </div>
  )
}
```

### 3. Storing Timer IDs

```tsx
// DO - Use useRef to store timer IDs
function Timer() {
  const timerRef = useRef<number | null>(null)

  const start = () => {
    if (timerRef.current) return
    timerRef.current = window.setInterval(() => {
      console.log('Tick')
    }, 1000)
  }

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return stop
  }, [])

  return (
    <div>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  )
}
```

### 4. Storing Mutable Values

```tsx
// DON'T - Using state for mutable values causes issues
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    for (let i = 0; i < 5; i++) {
      setCount(count + 1)  // Only updates once!
    }
  }

  return <button onClick={handleClick}>Count: {count}</button>
}

// DO - Use useRef for mutable values
function Component() {
  const countRef = useRef(0)
  const [, forceUpdate] = useState({})

  const handleClick = () => {
    for (let i = 0; i < 5; i++) {
      countRef.current++
    }
    forceUpdate({})
  }

  return <button onClick={handleClick}>Count: {countRef.current}</button>
}
```

### 5. Storing Event Handlers

```tsx
// DO - Use useRef to store stable event handlers
function Component() {
  const handlerRef = useRef<(() => void) | null>(null)

  const setHandler = (handler: () => void) => {
    handlerRef.current = handler
  }

  const handleClick = () => {
    handlerRef.current?.()
  }

  return (
    <div>
      <button onClick={handleClick}>Trigger Handler</button>
      <button onClick={() => setHandler(() => console.log('Handler 1'))}>
        Set Handler 1
      </button>
      <button onClick={() => setHandler(() => console.log('Handler 2'))}>
        Set Handler 2
      </button>
    </div>
  )
}
```

### 6. Storing Previous Props

```tsx
// DO - Use useRef to store previous props
function Component({ userId }: { userId: string }) {
  const prevUserIdRef = useRef(userId)

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log(`User changed from ${prevUserIdRef.current} to ${userId}`)
      prevUserIdRef.current = userId
    }
  }, [userId])

  return <div>User: {userId}</div>
}
```

### 7. Storing Animation Frames

```tsx
// DO - Use useRef to store animation frame IDs
function Animation() {
  const animationRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)

  const animate = () => {
    setProgress(prev => {
      const next = prev + 1
      if (next >= 100) {
        return 0
      }
      return next
    })
    animationRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return <div>Progress: {progress}%</div>
}
```

### 8. Storing WebSocket Connections

```tsx
// DO - Use useRef to store WebSocket connections
function WebSocketComponent() {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080')

    wsRef.current.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    return () => {
      wsRef.current?.close()
    }
  }, [])

  const sendMessage = (message: string) => {
    wsRef.current?.send(message)
  }

  return (
    <div>
      <button onClick={() => sendMessage('Hello')}>Send</button>
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Using useRef for Display Values

```tsx
// DON'T - Using useRef for display values
function Counter() {
  const countRef = useRef(0)

  return (
    <div>
      <p>Count: {countRef.current}</p>
      <button onClick={() => countRef.current++}>Increment</button>
    </div>
  )
  // Count won't update in UI!
}

// DO - Use useState for display values
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
```

### Mistake 2. Using useState for Non-Display Values

```tsx
// DON'T - Using useState for non-display values
function Timer() {
  const [timerId, setTimerId] = useState<number | null>(null)

  const startTimer = () => {
    setTimerId(setInterval(() => {}, 1000))
  }

  const stopTimer = () => {
    if (timerId) clearInterval(timerId)
  }

  // Extra re-renders!
  return <div>Timer</div>
}

// DO - Use useRef for non-display values
function Timer() {
  const timerRef = useRef<number | null>(null)

  const startTimer = () => {
    timerRef.current = setInterval(() => {}, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  return <div>Timer</div>
}
```

### Mistake 3. Mutating Ref Values in Render

```tsx
// DON'T - Mutating ref in render
function Component() {
  const countRef = useRef(0)
  countRef.current++  // Side effect in render!

  return <div>{countRef.current}</div>
}

// DO - Mutate ref in effects or handlers
function Component() {
  const countRef = useRef(0)

  useEffect(() => {
    countRef.current++
  }, [])

  return <div>{countRef.current}</div>
}
```

## Decision Guide

```
Need to store a value?
├─ Does it need to trigger re-render?
│  ├─ Yes → Use useState
│  └─ No → Use useRef
└─ Is it a DOM element reference?
   └─ Yes → Use useRef
```

## Key Takeaways

- Use useState for values that need to trigger re-renders
- Use useRef for values that don't need to trigger re-renders
- Use useRef for DOM element references
- Use useRef for storing timers, intervals, and animation frames
- Use useRef for storing mutable values
- Use useRef for storing previous values
- Use useRef for storing WebSocket connections
- Don't use useRef for display values
