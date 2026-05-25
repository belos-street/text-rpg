---
name: useeffect-cleanup-function
description: Return a cleanup function from useEffect to clean up side effects when component unmounts or before re-running.
---

# Cleanup Function

Return a cleanup function from useEffect to clean up side effects when the component unmounts or before the effect re-runs.

## Basic Pattern

```tsx
function Timer() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => {
      clearInterval(timer)  // Cleanup function
    }
  }, [])

  return <div>Timer running</div>
}
```

## When Cleanup Runs

### 1. On Unmount

```tsx
function Component() {
  useEffect(() => {
    console.log('Mount')
    return () => console.log('Unmount')
  }, [])
  // Cleanup runs when component unmounts
}
```

### 2. Before Re-run

```tsx
function Component({ userId }: { userId: string }) {
  useEffect(() => {
    console.log('Effect for userId:', userId)
    return () => console.log('Cleanup for userId:', userId)
  }, [userId])

  // When userId changes:
  // 1. Cleanup for old userId runs
  // 2. Effect for new userId runs
}
```

## Common Use Cases

### 1. Event Listeners

```tsx
function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div>{size.width} x {size.height}</div>
}
```

### 2. Timers and Intervals

```tsx
function Countdown({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return <div>{timeLeft}s remaining</div>
}
```

### 3. Subscriptions

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const subscription = chatApi.subscribe(roomId, (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => subscription.unsubscribe()
  }, [roomId])

  return (
    <ul>
      {messages.map(msg => <li key={msg.id}>{msg.text}</li>)}
    </ul>
  )
}
```

### 4. WebSockets

```tsx
function WebSocketComponent() {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [])

  return <div>{messages.join(', ')}</div>
}
```

### 5. AbortController for Fetch

```tsx
function DataFetcher({ id }: { id: string }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const res = await fetch(`/api/data/${id}`, {
          signal: controller.signal
        })
        const json = await res.json()
        setData(json)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      }
    }

    fetchData()

    return () => controller.abort()
  }, [id])

  return <div>{JSON.stringify(data)}</div>
}
```

### 6. Third-party Libraries

```tsx
function Chart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = new Chart(chartRef.current, {
      type: 'bar',
      data: chartData
    })

    return () => chart.destroy()
  }, [])

  return <div ref={chartRef} />
}
```

### 7. DOM Manipulation

```tsx
function ScrollLock({ locked }: { locked: boolean }) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [locked])

  return <div>Content</div>
}
```

## Common Mistakes

### Mistake 1: Forgetting Cleanup

```tsx
// DON'T - Memory leak
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)
    // No cleanup - timer keeps running!
  }, [])
}

// DO - Always cleanup
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)
    return () => clearInterval(timer)
  }, [])
}
```

### Mistake 2: Cleanup Runs After Effect

```tsx
// DON'T - Wrong order
useEffect(() => {
  return () => {
    console.log('Cleanup')
  }
  console.log('Effect')
}, [])

// DO - Effect first, then cleanup
useEffect(() => {
  console.log('Effect')
  return () => {
    console.log('Cleanup')
  }
}, [])
```

### Mistake 3: Multiple Cleanup Functions

```tsx
// DON'T - Only last cleanup runs
useEffect(() => {
  const timer1 = setInterval(() => {}, 1000)
  const timer2 = setInterval(() => {}, 2000)

  return () => {
    clearInterval(timer1)
  }
  return () => {
    clearInterval(timer2)  // Never runs!
  }
}, [])

// DO - Single cleanup function
useEffect(() => {
  const timer1 = setInterval(() => {}, 1000)
  const timer2 = setInterval(() => {}, 2000)

  return () => {
    clearInterval(timer1)
    clearInterval(timer2)
  }
}, [])
```

## Comparison with Lifecycle Methods

```tsx
// Class Component
class Component extends React.Component {
  componentDidMount() {
    this.timer = setInterval(() => {}, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }
}

// Function Component
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {}, 1000)
    return () => clearInterval(timer)
  }, [])
}
```

## Key Takeaways

- Return a cleanup function from useEffect to clean up side effects
- Cleanup runs before component unmounts and before effect re-runs
- Always cleanup: timers, event listeners, subscriptions, WebSockets
- Use AbortController for fetch requests to avoid memory leaks
- Cleanup runs after the effect completes, not before
- Only one cleanup function per useEffect
