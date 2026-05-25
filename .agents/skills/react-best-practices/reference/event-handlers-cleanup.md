---
name: event-handlers-cleanup
description: Always cleanup event listeners in useEffect to prevent memory leaks.
---

# Event Handlers Cleanup

Always cleanup event listeners in useEffect to prevent memory leaks.

## The Problem

```tsx
// DON'T - Not cleaning up event listeners
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    // No cleanup!
  }, [])

  return <div>Component</div>
}
// Memory leak!
```

## The Solution

```tsx
// DO - Cleaning up event listeners
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div>Component</div>
}
```

## Common Patterns

### 1. Window Events

```tsx
function WindowResize() {
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

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div>
      Width: {size.width}, Height: {size.height}
    </div>
  )
}

function ScrollPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setPosition({
        x: window.scrollX,
        y: window.scrollY
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div>
      Scroll: {position.x}, {position.y}
    </div>
  )
}
```

### 2. Keyboard Events

```tsx
function KeyPress() {
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKey(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <div>Pressed key: {pressedKey}</div>
}

function KeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        console.log('Save shortcut')
      }

      if (e.key === 'Escape') {
        console.log('Escape pressed')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <div>Press Ctrl+S or Escape</div>
}
```

### 3. Mouse Events

```tsx
function MousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div>
      Mouse: {position.x}, {position.y}
    </div>
  )
}

function ClickOutside() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}
```

### 4. Form Events

```tsx
function FormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(errors).length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [errors])

  return <div>Form with validation</div>
}
```

### 5. Media Events

```tsx
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => console.log('Video played')
    const handlePause = () => console.log('Video paused')
    const handleEnded = () => console.log('Video ended')

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return <video ref={videoRef} src="video.mp4" controls />
}

function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => console.log('Audio played')
    const handlePause = () => console.log('Audio paused')
    const handleEnded = () => console.log('Audio ended')

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  return <audio ref={audioRef} src="audio.mp3" controls />
}
```

### 6. Custom Events

```tsx
function CustomEventComponent() {
  useEffect(() => {
    const handleCustomEvent = (e: CustomEvent) => {
      console.log('Custom event:', e.detail)
    }

    window.addEventListener('custom-event', handleCustomEvent as EventListener)

    return () => {
      window.removeEventListener('custom-event', handleCustomEvent as EventListener)
    }
  }, [])

  return <div>Custom event listener</div>
}

function EventEmitter() {
  const emitEvent = () => {
    window.dispatchEvent(new CustomEvent('custom-event', { detail: { message: 'Hello' } }))
  }

  return <button onClick={emitEvent}>Emit Event</button>
}
```

### 7. WebSocket Events

```tsx
function WebSocketComponent() {
  const [messages, setMessages] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080')

    const ws = wsRef.current

    const handleMessage = (event: MessageEvent) => {
      setMessages(prev => [...prev, event.data])
    }

    const handleError = (error: Event) => {
      console.error('WebSocket error:', error)
    }

    const handleClose = () => {
      console.log('WebSocket closed')
    }

    ws.addEventListener('message', handleMessage)
    ws.addEventListener('error', handleError)
    ws.addEventListener('close', handleClose)

    return () => {
      ws.removeEventListener('message', handleMessage)
      ws.removeEventListener('error', handleError)
      ws.removeEventListener('close', handleClose)
      ws.close()
    }
  }, [])

  return (
    <div>
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  )
}
```

### 8. Storage Events

```tsx
function StorageSync() {
  const [data, setData] = useState<string | null>(null)

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'myData' && e.newValue) {
        setData(e.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const updateData = () => {
    const newData = `Data at ${Date.now()}`
    localStorage.setItem('myData', newData)
    setData(newData)
  }

  return (
    <div>
      <button onClick={updateData}>Update Data</button>
      <p>Current data: {data}</p>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Cleaning Up

```tsx
// DON'T - Not cleaning up
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    // No cleanup!
  }, [])

  return <div>Component</div>
}

// DO - Cleaning up
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div>Component</div>
}
```

### Mistake 2. Wrong Function Reference

```tsx
// DON'T - Wrong function reference
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', () => {})
    }
  }, [])

  return <div>Component</div>
}

// DO - Correct function reference
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <div>Component</div>
}
```

### Mistake 3. Not Handling Multiple Listeners

```tsx
// DON'T - Not handling multiple listeners
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      // Forgot to remove scroll listener!
    }
  }, [])

  return <div>Component</div>
}

// DO - Handling all listeners
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return <div>Component</div>
}
```

## Key Takeaways

- Always cleanup event listeners in useEffect
- Return cleanup function from useEffect
- Remove the same function reference that was added
- Cleanup all event listeners
- Prevent memory leaks
- Handle window events properly
- Handle keyboard and mouse events
- Handle media events
- Handle custom events
- Handle WebSocket events
