---
name: useeffect-conditional-effects
description: Avoid conditional effects. Use conditions inside useEffect instead.
---

# Conditional Effects

Don't use if statements or ternary operators to conditionally call useEffect. Put the condition inside the effect instead.

## The Problem

```tsx
// DON'T - Conditional useEffect call
function Component({ shouldFetch }: { shouldFetch: boolean }) {
  const [data, setData] = useState(null)

  if (shouldFetch) {
    useEffect(() => {
      fetchData().then(setData)
    }, [])
  }
  // Error: React Hook "useEffect" is called conditionally
}
```

## The Solution

```tsx
// DO - Condition inside useEffect
function Component({ shouldFetch }: { shouldFetch: boolean }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!shouldFetch) return

    fetchData().then(setData)
  }, [shouldFetch])
}
```

## Common Patterns

### 1. Conditional Data Fetching

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!userId) return

    fetchUser(userId).then(setUser)
  }, [userId])

  if (!user) return <div>No user selected</div>
  return <div>{user.name}</div>
}
```

### 2. Early Return

```tsx
function DataComponent({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!enabled) return

    fetchData().then(setData)
  }, [enabled])

  return <div>{JSON.stringify(data)}</div>
}
```

### 3. Conditional Event Listeners

```tsx
function KeyboardListener({ enabled }: { enabled: boolean }) {
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => [...prev, e.key])
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled])

  return <div>Keys: {keys.join(', ')}</div>
}
```

### 4. Conditional Subscription

```tsx
function ChatRoom({ roomId, joined }: { roomId: string; joined: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!joined) return

    const subscription = chatApi.subscribe(roomId, (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => subscription.unsubscribe()
  }, [roomId, joined])

  return <ul>{messages.map(m => <li key={m.id}>{m.text}</li>)}</ul>
}
```

### 5. Multiple Conditions

```tsx
function DataFetcher({ userId, token }: { userId: string; token: string | null }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId || !token) return

    fetch(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setData)
  }, [userId, token])

  return <div>{JSON.stringify(data)}</div>
}
```

### 6. Conditional Polling

```tsx
function StatusMonitor({ active, interval = 5000 }: { active: boolean; interval?: number }) {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!active) return

    async function checkStatus() {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data.status)
    }

    checkStatus()
    const timer = setInterval(checkStatus, interval)

    return () => clearInterval(timer)
  }, [active, interval])

  return <div>Status: {status}</div>
}
```

### 7. Conditional WebSocket

```tsx
function WebSocketComponent({ connected }: { connected: boolean }) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    if (!connected) {
      socket?.close()
      setSocket(null)
      return
    }

    const ws = new WebSocket('ws://localhost:8080')

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    setSocket(ws)

    return () => ws.close()
  }, [connected])

  return <div>{messages.join(', ')}</div>
}
```

## Common Mistakes

### Mistake 1: Conditional Hook Call

```tsx
// DON'T - Conditional hook call
function Component({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState(null)

  if (enabled) {
    useEffect(() => {
      fetchData().then(setData)
    }, [])
  }
}

// DO - Condition inside effect
function Component({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!enabled) return

    fetchData().then(setData)
  }, [enabled])
}
```

### Mistake 2: Ternary Operator

```tsx
// DON'T - Ternary operator with hooks
function Component({ mode }: { mode: 'light' | 'dark' }) {
  mode === 'dark'
    ? useEffect(() => {
        document.body.classList.add('dark')
      }, [])
    : useEffect(() => {
        document.body.classList.remove('dark')
      }, [])
}

// DO - Single effect with condition
function Component({ mode }: { mode: 'light' | 'dark' }) {
  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [mode])
}
```

### Mistake 3: Not Cleaning Up on False

```tsx
// DON'T - Doesn't cleanup when condition becomes false
function Component({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => clearInterval(timer)
  }, [])
}

// DO - Cleanup when condition changes
function Component({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => clearInterval(timer)
  }, [enabled])
}
```

## Advanced Patterns

### 1. Conditional Dependencies

```tsx
function Component({ userId, includeProfile }: { userId: string; includeProfile: boolean }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const url = includeProfile
        ? `/api/users/${userId}?include=profile`
        : `/api/users/${userId}`

      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    }

    fetchData()
  }, [userId, includeProfile])

  return <div>{JSON.stringify(data)}</div>
}
```

### 2. Conditional Cleanup

```tsx
function Component({ persist }: { persist: boolean }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(setData)

    return () => {
      if (persist) {
        localStorage.setItem('data', JSON.stringify(data))
      }
    }
  }, [persist])

  return <div>{JSON.stringify(data)}</div>
}
```

## Key Takeaways

- Never conditionally call useEffect
- Put conditions inside useEffect instead
- Use early return pattern for cleaner code
- Include condition in dependency array
- Cleanup runs when condition changes
- Always follow Rules of Hooks
