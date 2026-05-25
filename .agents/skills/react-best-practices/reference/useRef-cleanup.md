---
name: useRef-cleanup
description: Always cleanup refs that hold resources to prevent memory leaks.
---

# useRef Cleanup

Always cleanup refs that hold resources to prevent memory leaks.

## The Problem

```tsx
// DON'T - Not cleaning up refs
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
    }
  }

  return (
    <div>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  )
  // Timer keeps running if component unmounts!
}
```

## The Solution

```tsx
// DO - Clean up refs in useEffect
function Timer() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = () => {
    if (timerRef.current) return
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

### 1. Cleanup Timers

```tsx
function IntervalTimer() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      console.log('Interval tick')
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return <div>Timer running</div>
}

function TimeoutTimer() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      console.log('Timeout fired')
    }, 5000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return <div>Timer will fire in 5 seconds</div>
}
```

### 2. Cleanup Animation Frames

```tsx
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

### 3. Cleanup Event Listeners

```tsx
function WindowResize() {
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      sizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div>
      Size: {sizeRef.current.width} x {sizeRef.current.height}
    </div>
  )
}

function KeyPress() {
  const pressedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div>
      Pressed keys: {Array.from(pressedKeysRef.current).join(', ')}
    </div>
  )
}
```

### 4. Cleanup WebSocket Connections

```tsx
function WebSocketComponent() {
  const wsRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080')

    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
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

### 5. Cleanup ResizeObserver

```tsx
function ResizableElement() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div>
      <div
        ref={elementRef}
        style={{ width: '50%', background: 'lightblue' }}
      >
        Resizable Element
      </div>
      <p>Size: {size.width} x {size.height}</p>
    </div>
  )
}
```

### 6. Cleanup IntersectionObserver

```tsx
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = imgRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : ''}
      alt={alt}
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  )
}
```

### 7. Cleanup MediaRecorder

```tsx
function AudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        setAudioChunks(prev => [...prev, event.data])
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [isRecording])

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <p>Chunks: {audioChunks.length}</p>
    </div>
  )
}
```

### 8. Cleanup Geolocation

```tsx
function Geolocation() {
  const positionRef = useRef<GeolocationPosition | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const [position, setPosition] = useState<GeolocationPosition | null>(null)

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          positionRef.current = pos
          setPosition(pos)
        },
        (error) => {
          console.error('Geolocation error:', error)
        },
        { enableHighAccuracy: true }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div>
      {position ? (
        <div>
          <p>Latitude: {position.coords.latitude}</p>
          <p>Longitude: {position.coords.longitude}</p>
        </div>
      ) : (
        <p>Waiting for location...</p>
      )}
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Cleaning Up Timers

```tsx
// DON'T - Not cleaning up timer
function Timer() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {}, 1000)
    // No cleanup!
  }, [])

  return <div>Timer</div>
}

// DO - Cleaning up timer
function Timer() {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {}, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return <div>Timer</div>
}
```

### Mistake 2. Not Cleaning Up Event Listeners

```tsx
// DON'T - Not cleaning up event listeners
function Component() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    // No cleanup!
  }, [])

  return <div>Component</div>
}

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

### Mistake 3. Not Cleaning Up Observers

```tsx
// DON'T - Not cleaning up observer
function Component() {
  useEffect(() => {
    const observer = new IntersectionObserver(callback)
    observer.observe(element)
    // No cleanup!
  }, [])

  return <div>Component</div>
}

// DO - Cleaning up observer
function Component() {
  useEffect(() => {
    const observer = new IntersectionObserver(callback)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return <div>Component</div>
}
```

## Key Takeaways

- Always cleanup refs that hold resources
- Cleanup timers, intervals, and timeouts
- Cleanup event listeners
- Cleanup observers (ResizeObserver, IntersectionObserver)
- Cleanup WebSocket connections
- Cleanup MediaRecorder
- Cleanup Geolocation watch
- Cleanup animation frames
- Prevent memory leaks
