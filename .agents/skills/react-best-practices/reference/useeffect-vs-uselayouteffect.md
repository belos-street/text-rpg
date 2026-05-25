---
name: useeffect-vs-uselayouteffect
description: Use useEffect for most side effects. Use useLayoutEffect only when you need to read/modify DOM synchronously after mutations.
---

# useEffect vs useLayoutEffect

Use useEffect for most side effects. Use useLayoutEffect only when you need to read or modify the DOM synchronously after React updates.

## useEffect

Runs asynchronously after paint. Most side effects should use useEffect.

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    document.title = `Count: ${count}`
  }, [count])

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## useLayoutEffect

Runs synchronously after DOM mutations but before paint. Use when you need to read from the DOM immediately after updates.

```tsx
function Tooltip() {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!tooltipRef.current) return

    const rect = tooltipRef.current.getBoundingClientRect()
    setPosition({ x: rect.left, y: rect.top })
  }, [])

  return (
    <div ref={tooltipRef} style={{ left: position.x, top: position.y }}>
      Tooltip
    </div>
  )
}
```

## When to Use useEffect

### 1. Data Fetching

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  return <div>{user?.name}</div>
}
```

### 2. Subscriptions

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const subscription = chatApi.subscribe(roomId, (msg) => {
      setMessages(prev => [...prev, msg])
    })

    return () => subscription.unsubscribe()
  }, [roomId])

  return <ul>{messages.map(m => <li key={m.id}>{m.text}</li>)}</ul>
}
```

### 3. Timers

```tsx
function Timer() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return <div>{count}</div>
}
```

### 4. Logging

```tsx
function Component({ value }: { value: string }) {
  useEffect(() => {
    console.log('Value changed:', value)
  }, [value])

  return <div>{value}</div>
}
```

### 5. Non-DOM Side Effects

```tsx
function Analytics() {
  useEffect(() => {
    analytics.track('page_view')
  }, [])

  return <div>Page</div>
}
```

## When to Use useLayoutEffect

### 1. DOM Measurements

```tsx
function MeasureElement() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return

    const { width, height } = ref.current.getBoundingClientRect()
    setDimensions({ width, height })
  }, [])

  return (
    <div ref={ref}>
      Size: {dimensions.width} x {dimensions.height}
    </div>
  )
}
```

### 2. Scroll Position

```tsx
function ScrollToBottom({ messages }: { messages: Message[] }) {
  const listRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!listRef.current) return

    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  return (
    <div ref={listRef} style={{ overflow: 'auto', height: 300 }}>
      {messages.map(m => <div key={m.id}>{m.text}</div>)}
    </div>
  )
}
```

### 3. Focus Management

```tsx
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal">
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  )
}
```

### 4. Preventing Layout Shift

```tsx
function AutoResizingTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
```

### 5. Synchronous DOM Updates

```tsx
function Tooltip({ target }: { target: HTMLElement | null }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!target) return

    const rect = target.getBoundingClientRect()
    setPosition({ x: rect.left, y: rect.bottom })
  }, [target])

  return (
    <div style={{ position: 'absolute', left: position.x, top: position.y }}>
      Tooltip content
    </div>
  )
}
```

## Performance Considerations

### useEffect (Preferred)

```tsx
// Runs asynchronously, doesn't block paint
function Component() {
  useEffect(() => {
    document.title = 'Updated'
  }, [])

  return <div>Content</div>
}
```

### useLayoutEffect (Use Sparingly)

```tsx
// Runs synchronously, blocks paint
function Component() {
  useLayoutEffect(() => {
    const rect = element.getBoundingClientRect()
    setState({ width: rect.width })
  }, [])

  return <div>Content</div>
}
```

## SSR Considerations

useLayoutEffect doesn't run on the server. Use useEffect or check for server rendering.

```tsx
function Component() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  useLayoutEffect(() => {
    // Safe to use after mounting
  }, [])

  return <div>Content</div>
}
```

Or use a custom hook:

```tsx
function useIsomorphicLayoutEffect(callback: () => void, deps: any[]) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const effectHook = mounted ? useLayoutEffect : useEffect

  effectHook(callback, deps)
}
```

## Common Mistakes

### Mistake 1: Using useLayoutEffect Unnecessarily

```tsx
// DON'T - useLayoutEffect overkill
function Component() {
  useLayoutEffect(() => {
    console.log('Mounted')
  }, [])

  return <div>Content</div>
}

// DO - useEffect is sufficient
function Component() {
  useEffect(() => {
    console.log('Mounted')
  }, [])

  return <div>Content</div>
}
```

### Mistake 2: Blocking Paint

```tsx
// DON'T - Expensive computation in useLayoutEffect
function Component() {
  useLayoutEffect(() => {
    const result = expensiveComputation()
    setState(result)
  }, [])

  return <div>Content</div>
}

// DO - Use useEffect for expensive operations
function Component() {
  useEffect(() => {
    const result = expensiveComputation()
    setState(result)
  }, [])

  return <div>Content</div>
}
```

## Key Takeaways

- Use useEffect for most side effects (data fetching, subscriptions, timers)
- Use useLayoutEffect only for DOM measurements and synchronous updates
- useEffect runs asynchronously after paint
- useLayoutEffect runs synchronously before paint
- useLayoutEffect blocks paint, use sparingly
- useLayoutEffect doesn't run on the server
- Prefer useEffect unless you need synchronous DOM access
