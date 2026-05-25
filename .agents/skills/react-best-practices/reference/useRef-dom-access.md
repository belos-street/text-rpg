---
name: useRef-dom-access
description: Use useRef to access and manipulate DOM elements directly.
---

# useRef DOM Access

Use useRef to access and manipulate DOM elements directly when necessary.

## Basic Usage

```tsx
function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} placeholder="Auto-focused" />
}
```

## Common Patterns

### 1. Focusing Elements

```tsx
function FocusExample() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFocus = () => {
    inputRef.current?.focus()
  }

  return (
    <div>
      <input ref={inputRef} placeholder="Click button to focus" />
      <button onClick={handleFocus}>Focus Input</button>
    </div>
  )
}

function AutoFocusForm() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const handleTab = (e: React.KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  return (
    <form>
      <input
        ref={nameRef}
        placeholder="Name"
        onKeyDown={e => handleTab(e, emailRef)}
      />
      <input
        ref={emailRef}
        placeholder="Email"
      />
    </form>
  )
}
```

### 2. Scrolling Elements

```tsx
function ScrollToElement() {
  const targetRef = useRef<HTMLDivElement>(null)

  const scrollToTarget = () => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <button onClick={scrollToTarget}>Scroll to Target</button>
      <div style={{ height: '1000px' }}>Content</div>
      <div ref={targetRef} style={{ background: 'yellow' }}>
        Target Element
      </div>
    </div>
  )
}

function ScrollToBottom() {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div style={{ height: '200px', overflow: 'auto' }}>
      <div style={{ height: '500px' }}>Content</div>
      <div ref={bottomRef}>Bottom</div>
    </div>
  )
}

function ScrollableList() {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  return (
    <div>
      <button onClick={scrollToTop}>Top</button>
      <button onClick={scrollToBottom}>Bottom</button>
      <div
        ref={containerRef}
        style={{ height: '200px', overflow: 'auto', border: '1px solid #ccc' }}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i}>Item {i}</div>
        ))}
      </div>
    </div>
  )
}
```

### 3. Measuring Elements

```tsx
function MeasureElement() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (elementRef.current) {
      const { width, height } = elementRef.current.getBoundingClientRect()
      setDimensions({ width, height })
    }
  }, [])

  return (
    <div>
      <div ref={elementRef} style={{ background: 'lightblue' }}>
        Measurable Element
      </div>
      <p>Width: {dimensions.width}px</p>
      <p>Height: {dimensions.height}px</p>
    </div>
  )
}

function ResponsiveElement() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <div>
      <div
        ref={elementRef}
        style={{ background: 'lightgreen', width: '50%' }}
      >
        Responsive Element
      </div>
      <p>Width: {width}px</p>
    </div>
  )
}
```

### 4. Canvas and Media Elements

```tsx
function CanvasExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = 'lightblue'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(100, 75, 50, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  return <canvas ref={canvasRef} width={200} height={150} />
}

function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()

  return (
    <div>
      <video ref={videoRef} width="320" height="240">
        <source src="movie.mp4" type="video/mp4" />
      </video>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  )
}

function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)

  const play = () => audioRef.current?.play()
  const pause = () => audioRef.current?.pause()

  return (
    <div>
      <audio ref={audioRef}>
        <source src="audio.mp3" type="audio/mpeg" />
      </audio>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  )
}
```

### 5. Input Manipulation

```tsx
function SelectAllText() {
  const inputRef = useRef<HTMLInputElement>(null)

  const selectAll = () => {
    inputRef.current?.select()
  }

  return (
    <div>
      <input
        ref={inputRef}
        defaultValue="Select this text"
      />
      <button onClick={selectAll}>Select All</button>
    </div>
  )
}

function CopyToClipboard() {
  const inputRef = useRef<HTMLInputElement>(null)

  const copy = () => {
    inputRef.current?.select()
    document.execCommand('copy')
  }

  return (
    <div>
      <input
        ref={inputRef}
        defaultValue="Copy this text"
      />
      <button onClick={copy}>Copy</button>
    </div>
  )
}

function AutoResizeTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  return (
    <textarea
      ref={textareaRef}
      onChange={handleChange}
      placeholder="Auto-resizing textarea"
      style={{ resize: 'none', overflow: 'hidden' }}
    />
  )
}
```

### 6. Animation and Transitions

```tsx
function AnimateElement() {
  const elementRef = useRef<HTMLDivElement>(null)

  const animate = () => {
    const element = elementRef.current
    if (!element) return

    element.style.transition = 'transform 0.5s'
    element.style.transform = 'translateX(100px)'
  }

  const reset = () => {
    const element = elementRef.current
    if (!element) return

    element.style.transform = 'translateX(0)'
  }

  return (
    <div>
      <div
        ref={elementRef}
        style={{
          width: '100px',
          height: '100px',
          background: 'lightcoral'
        }}
      />
      <button onClick={animate}>Animate</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}

function FadeIn() {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.style.opacity = '0'
    element.style.transition = 'opacity 1s'

    requestAnimationFrame(() => {
      element.style.opacity = '1'
    })
  }, [])

  return (
    <div ref={elementRef} style={{ fontSize: '24px' }}>
      Fade In Text
    </div>
  )
}
```

### 7. Click Outside Detection

```tsx
function ClickOutside() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'white',
          border: '1px solid #ccc',
          padding: '10px'
        }}>
          Dropdown content
        </div>
      )}
    </div>
  )
}
```

### 8. Drag and Drop

```tsx
function Draggable() {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const element = elementRef.current
    if (!element) return

    const rect = element.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const element = elementRef.current
      if (!element) return

      element.style.position = 'absolute'
      element.style.left = e.clientX - position.x + 'px'
      element.style.top = e.clientY - position.y + 'px'
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, position])

  return (
    <div
      ref={elementRef}
      onMouseDown={handleMouseDown}
      style={{
        width: '100px',
        height: '100px',
        background: 'lightblue',
        cursor: 'move'
      }}
    >
      Drag me
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Accessing Ref Before Mount

```tsx
// DON'T - Accessing ref before mount
function Component() {
  const ref = useRef<HTMLDivElement>(null)

  ref.current?.scrollIntoView()  // Might not work!

  return <div ref={ref}>Content</div>
}

// DO - Access ref in useEffect
function Component() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollIntoView()
  }, [])

  return <div ref={ref}>Content</div>
}
```

### Mistake 2. Not Checking for Null

```tsx
// DON'T - Not checking for null
function Component() {
  const ref = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    ref.current.focus()  // Error if null!
  }

  return <input ref={ref} />
}

// DO - Check for null
function Component() {
  const ref = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    ref.current?.focus()
  }

  return <input ref={ref} />
}
```

### Mistake 3. Using Ref for State

```tsx
// DON'T - Using ref for state
function Counter() {
  const countRef = useRef(0)

  return (
    <div>
      <p>Count: {countRef.current}</p>
      <button onClick={() => countRef.current++}>Increment</button>
    </div>
  )
  // Won't update!
}

// DO - Use state for display values
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

## Key Takeaways

- Use useRef to access DOM elements
- Access refs in useEffect or event handlers
- Always check for null when accessing refs
- Use refs for focus, scroll, and measurement
- Use refs for canvas and media elements
- Use refs for input manipulation
- Use refs for animations and transitions
- Don't use refs for display values
