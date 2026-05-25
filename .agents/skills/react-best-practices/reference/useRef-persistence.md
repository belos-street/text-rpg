---
name: useRef-persistence
description: Use useRef to persist values across renders without triggering re-renders.
---

# useRef Persistence

Use useRef to persist values across renders without triggering re-renders.

## The Problem

```tsx
// DON'T - Using state causes re-renders
function Counter() {
  const [count, setCount] = useState(0)
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })

  return (
    <div>
      <p>Count: {count}</p>
      <p>Render count: {renderCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
// Render count updates on every render!
```

## The Solution

```tsx
// DO - Using ref doesn't cause re-renders
function Counter() {
  const [count, setCount] = useState(0)
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current++
  })

  return (
    <div>
      <p>Count: {count}</p>
      <p>Render count: {renderCountRef.current}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
// Render count persists without re-renders!
```

## Common Patterns

### 1. Storing Previous Values

```tsx
function PreviousValue({ value }: { value: number }) {
  const prevValueRef = useRef<number | null>(null)

  useEffect(() => {
    prevValueRef.current = value
  }, [value])

  return (
    <div>
      <p>Current: {value}</p>
      <p>Previous: {prevValueRef.current ?? 'N/A'}</p>
    </div>
  )
}

function PreviousProps({ userId }: { userId: string }) {
  const prevUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log(`User changed from ${prevUserIdRef.current} to ${userId}`)
      prevUserIdRef.current = userId
    }
  }, [userId])

  return <div>User: {userId}</div>
}
```

### 2. Storing Render Count

```tsx
function RenderCount() {
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current++
  })

  return <div>Render count: {renderCountRef.current}</div>
}

function ComponentWithRenderCount() {
  const [count, setCount] = useState(0)
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current++
  })

  return (
    <div>
      <p>Count: {count}</p>
      <p>Render count: {renderCountRef.current}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
```

### 3. Storing Component Mount Status

```tsx
function IsMounted() {
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = async () => {
    const data = await api.fetchData()
    if (isMountedRef.current) {
      setData(data)
    }
  }

  return <div>Component</div>
}
```

### 4. Storing Latest State Value

```tsx
function LatestState() {
  const [count, setCount] = useState(0)
  const latestCountRef = useRef(count)

  useEffect(() => {
    latestCountRef.current = count
  }, [count])

  const handleClick = () => {
    console.log('Latest count:', latestCountRef.current)
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={handleClick}>Log Latest</button>
    </div>
  )
}
```

### 5. Storing Callback References

```tsx
function CallbackRef() {
  const callbackRef = useRef<(() => void) | null>(null)

  const setCallback = (callback: () => void) => {
    callbackRef.current = callback
  }

  const triggerCallback = () => {
    callbackRef.current?.()
  }

  return (
    <div>
      <button onClick={triggerCallback}>Trigger</button>
      <button onClick={() => setCallback(() => console.log('Callback 1'))}>
        Set Callback 1
      </button>
      <button onClick={() => setCallback(() => console.log('Callback 2'))}>
        Set Callback 2
      </button>
    </div>
  )
}
```

### 6. Storing Animation State

```tsx
function AnimationState() {
  const animationRef = useRef<{ id: number | null; progress: number }>({
    id: null,
    progress: 0
  })

  const startAnimation = () => {
    const animate = () => {
      animationRef.current.progress += 1
      if (animationRef.current.progress < 100) {
        animationRef.current.id = requestAnimationFrame(animate)
      }
    }
    animationRef.current.id = requestAnimationFrame(animate)
  }

  const stopAnimation = () => {
    if (animationRef.current.id) {
      cancelAnimationFrame(animationRef.current.id)
      animationRef.current.id = null
    }
  }

  return (
    <div>
      <p>Progress: {animationRef.current.progress}%</p>
      <button onClick={startAnimation}>Start</button>
      <button onClick={stopAnimation}>Stop</button>
    </div>
  )
}
```

### 7. Storing Debounce Timer

```tsx
function DebouncedInput() {
  const [value, setValue] = useState('')
  const debounceTimerRef = useRef<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      console.log('Debounced value:', newValue)
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return <input value={value} onChange={handleChange} />
}
```

### 8. Storing Throttle Timer

```tsx
function ThrottledButton() {
  const throttleTimerRef = useRef<number | null>(null)
  const clickCountRef = useRef(0)

  const handleClick = () => {
    if (throttleTimerRef.current) {
      clickCountRef.current++
      return
    }

    clickCountRef.current++
    console.log('Throttled click:', clickCountRef.current)

    throttleTimerRef.current = window.setTimeout(() => {
      throttleTimerRef.current = null
    }, 1000)
  }

  return <button onClick={handleClick}>Throttled Click</button>
}
```

### 9. Storing Async Operation State

```tsx
function AsyncOperation() {
  const operationRef = useRef<{ pending: boolean; data: any }>({
    pending: false,
    data: null
  })

  const fetchData = async () => {
    if (operationRef.current.pending) return

    operationRef.current.pending = true

    try {
      const data = await api.fetchData()
      operationRef.current.data = data
    } finally {
      operationRef.current.pending = false
    }
  }

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      <p>Pending: {operationRef.current.pending ? 'Yes' : 'No'}</p>
      <p>Data: {JSON.stringify(operationRef.current.data)}</p>
    </div>
  )
}
```

### 10. Storing Form State

```tsx
function FormState() {
  const formRef = useRef<{ touched: Set<string>; errors: Record<string, string> }>({
    touched: new Set(),
    errors: {}
  })

  const handleBlur = (field: string) => {
    formRef.current.touched.add(field)
  }

  const setError = (field: string, error: string) => {
    formRef.current.errors[field] = error
  }

  const clearError = (field: string) => {
    delete formRef.current.errors[field]
  }

  return (
    <form>
      <input
        name="name"
        onBlur={() => handleBlur('name')}
        onChange={() => clearError('name')}
      />
      {formRef.current.touched.has('name') && formRef.current.errors.name && (
        <span>{formRef.current.errors.name}</span>
      )}
    </form>
  )
}
```

## Common Mistakes

### Mistake 1. Using State for Non-Display Values

```tsx
// DON'T - Using state for non-display values
function Component() {
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })
  // Causes re-render!

  return <div>Component</div>
}

// DO - Using ref for non-display values
function Component() {
  const renderCountRef = useRef(0)

  useEffect(() => {
    renderCountRef.current++
  })
  // No re-render!

  return <div>Component</div>
}
```

### Mistake 2. Using Ref for Display Values

```tsx
// DON'T - Using ref for display values
function Counter() {
  const countRef = useRef(0)

  return (
    <div>
      <p>Count: {countRef.current}</p>
      <button onClick={() => countRef.current++}>Increment</button>
    </div>
  )
  // Won't update in UI!
}

// DO - Using state for display values
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

### Mistake 3. Mutating Ref in Render

```tsx
// DON'T - Mutating ref in render
function Component() {
  const countRef = useRef(0)
  countRef.current++
  // Side effect in render!

  return <div>{countRef.current}</div>
}

// DO - Mutating ref in useEffect
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
Need to persist a value?
├─ Does it need to trigger re-render?
│  ├─ Yes → Use useState
│  └─ No → Use useRef
└─ Is it a DOM element reference?
   └─ Yes → Use useRef
```

## Key Takeaways

- Use useRef to persist values across renders
- Use useRef for values that don't need to trigger re-renders
- Use useRef to store previous values
- Use useRef to store render count
- Use useRef to store component mount status
- Use useRef to store latest state values
- Use useRef to store callback references
- Use useRef to store animation state
- Use useRef to store debounce/throttle timers
- Use useRef to store async operation state
- Don't use useRef for display values
