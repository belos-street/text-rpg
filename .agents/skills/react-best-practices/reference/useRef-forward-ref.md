---
name: useRef-forward-ref
description: Use forwardRef to pass refs through components to child DOM elements.
---

# useRef forwardRef

Use forwardRef to pass refs through components to child DOM elements.

## Basic Usage

```tsx
const MyInput = forwardRef<HTMLInputElement, { label: string }>(
  ({ label }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} />
      </div>
    )
  }
)

MyInput.displayName = 'MyInput'

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div>
      <MyInput ref={inputRef} label="Name" />
      <button onClick={handleClick}>Focus Input</button>
    </div>
  )
}
```

## Common Patterns

### 1. Forwarding Ref to Input

```tsx
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="form-group">
        <label>{label}</label>
        <input
          ref={ref}
          className={error ? 'error' : ''}
          {...props}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Form() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    nameRef.current?.focus()
  }

  return (
    <form>
      <TextInput ref={nameRef} label="Name" />
      <TextInput ref={emailRef} label="Email" />
      <button type="button" onClick={handleSubmit}>Submit</button>
    </form>
  )
}
```

### 2. Forwarding Ref with Custom Logic

```tsx
const AutoFocusInput = forwardRef<HTMLInputElement, InputProps>(
  ({ autoFocus, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (autoFocus) {
        internalRef.current?.focus()
      }
    }, [autoFocus])

    useImperativeHandle(ref, () => internalRef.current!)

    return <input ref={internalRef} {...props} />
  }
)

AutoFocusInput.displayName = 'AutoFocusInput'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  autoFocus?: boolean
}

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <AutoFocusInput ref={inputRef} autoFocus />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  )
}
```

### 3. useImperativeHandle for Custom Methods

```tsx
const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ src }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    const play = () => videoRef.current?.play()
    const pause = () => videoRef.current?.pause()
    const seek = (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
      }
    }

    useImperativeHandle(ref, () => ({
      play,
      pause,
      seek,
      getDuration: () => videoRef.current?.duration || 0,
      getCurrentTime: () => videoRef.current?.currentTime || 0
    }))

    return <video ref={videoRef} src={src} />
  }
)

VideoPlayer.displayName = 'VideoPlayer'

interface VideoPlayerRef {
  play: () => void
  pause: () => void
  seek: (time: number) => void
  getDuration: () => number
  getCurrentTime: () => number
}

interface VideoPlayerProps {
  src: string
}

function Parent() {
  const videoRef = useRef<VideoPlayerRef>(null)

  const handlePlay = () => videoRef.current?.play()
  const handleSeek = () => videoRef.current?.seek(10)

  return (
    <div>
      <VideoPlayer ref={videoRef} src="video.mp4" />
      <button onClick={handlePlay}>Play</button>
      <button onClick={handleSeek}>Seek to 10s</button>
    </div>
  )
}
```

### 4. Conditional Ref Forwarding

```tsx
const ConditionalInput = forwardRef<HTMLInputElement, ConditionalInputProps>(
  ({ type = 'text', ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (type === 'password') {
        internalRef.current?.focus()
      }
    }, [type])

    useImperativeHandle(ref, () => internalRef.current!, [type])

    return <input ref={internalRef} type={type} {...props} />
  }
)

ConditionalInput.displayName = 'ConditionalInput'

interface ConditionalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'password'
}

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <ConditionalInput ref={inputRef} type="password" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  )
}
```

### 5. Multiple Refs

```tsx
const MultiRefComponent = forwardRef<HTMLDivElement, MultiRefProps>(
  ({ children, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => internalRef.current!)

    return <div ref={internalRef} {...props}>{children}</div>
  }
)

MultiRefComponent.displayName = 'MultiRefComponent'

interface MultiRefProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function Parent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (containerRef.current) {
      setHeight(containerRef.current.offsetHeight)
    }
  }, [])

  return (
    <MultiRefComponent ref={containerRef}>
      <p>Container height: {height}px</p>
    </MultiRefComponent>
  )
}
```

### 6. Ref Callback

```tsx
const CallbackInput = forwardRef<HTMLInputElement, InputProps>(
  ({ onRefReady, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (internalRef.current && onRefReady) {
        onRefReady(internalRef.current)
      }
    }, [onRefReady])

    useImperativeHandle(ref, () => internalRef.current!)

    return <input ref={internalRef} {...props} />
  }
)

CallbackInput.displayName = 'CallbackInput'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onRefReady?: (element: HTMLInputElement) => void
}

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRefReady = (element: HTMLInputElement) => {
    console.log('Input ref ready:', element)
  }

  return (
    <div>
      <CallbackInput ref={inputRef} onRefReady={handleRefReady} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  )
}
```

### 7. Generic forwardRef

```tsx
const GenericComponent = forwardRef<HTMLDivElement, GenericComponentProps>(
  ({ as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component ref={ref} {...props}>
        {children}
      </Component>
    )
  }
)

GenericComponent.displayName = 'GenericComponent'

interface GenericComponentProps<E extends React.ElementType> {
  as?: E
  children?: ReactNode
}

function Parent() {
  const divRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div>
      <GenericComponent ref={divRef}>Div content</GenericComponent>
      <GenericComponent as="button" ref={buttonRef as any}>Button content</GenericComponent>
    </div>
  )
}
```

### 8. ForwardRef with TypeScript

```tsx
const TypedInput = forwardRef<HTMLInputElement, TypedInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="form-group">
        <label>{label}</label>
        <input
          ref={ref}
          className={error ? 'error' : ''}
          {...props}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    )
  }
)

TypedInput.displayName = 'TypedInput'

interface TypedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Form() {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    nameRef.current?.focus()
  }

  return (
    <form>
      <TypedInput ref={nameRef} label="Name" />
      <TypedInput ref={emailRef} label="Email" />
      <button type="button" onClick={handleSubmit}>Submit</button>
    </form>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using forwardRef

```tsx
// DON'T - Not using forwardRef
function MyInput({ label }: { label: string }) {
  return <input placeholder={label} />
}

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <MyInput ref={inputRef} label="Name" />
      {/* Warning: ref is not forwarded! */}
    </div>
  )
}

// DO - Using forwardRef
const MyInput = forwardRef<HTMLInputElement, { label: string }>(
  ({ label }, ref) => {
    return <input ref={ref} placeholder={label} />
  }
)

MyInput.displayName = 'MyInput'

function Parent() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <MyInput ref={inputRef} label="Name" />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </div>
  )
}
```

### Mistake 2. Not Setting displayName

```tsx
// DON'T - Not setting displayName
const MyInput = forwardRef<HTMLInputElement, { label: string }>(
  ({ label }, ref) => {
    return <input ref={ref} placeholder={label} />
  }
)

// DO - Setting displayName
const MyInput = forwardRef<HTMLInputElement, { label: string }>(
  ({ label }, ref) => {
    return <input ref={ref} placeholder={label} />
  }
)

MyInput.displayName = 'MyInput'
```

### Mistake 3. Not Using useImperativeHandle

```tsx
// DON'T - Not using useImperativeHandle
const MyComponent = forwardRef<HTMLInputElement, {}>(
  (props, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)

    return <input ref={internalRef} />
    {/* ref is not connected! */}
  }
)

// DO - Using useImperativeHandle
const MyComponent = forwardRef<HTMLInputElement, {}>(
  (props, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => internalRef.current!)

    return <input ref={internalRef} />
  }
)
```

## Key Takeaways

- Use forwardRef to pass refs through components
- Set displayName for debugging
- Use useImperativeHandle for custom ref behavior
- Use TypeScript for type safety
- Handle null refs properly
- Use ref callbacks for side effects
- Consider generic components for flexibility
- Document ref behavior in props
