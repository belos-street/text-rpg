---
name: typescript-hooks
description: Use TypeScript to type hooks for better type safety.
---

# TypeScript Hooks

Use TypeScript to type hooks for better type safety.

## The Problem

```tsx
// DON'T - Untyped hooks
function Component() {
  const [state, setState] = useState(null)
  const [user, setUser] = useState(null)

  return <div>{user?.name}</div>
}
// No type safety!
```

## The Solution

```tsx
// DO - Typed hooks
function Component() {
  const [state, setState] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  return <div>{user?.name}</div>
}
// Full type safety!
```

## Common Patterns

### 1. useState with Types

```tsx
function Counter() {
  const [count, setCount] = useState<number>(0)
  const [name, setName] = useState<string>('')

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <input value={name} onChange={e => setName(e.target.value)} />
    </div>
  )
}
```

### 2. useState with Union Types

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error'

function DataFetcher() {
  const [status, setStatus] = useState<Status>('idle')

  return <div>Status: {status}</div>
}
```

### 3. useEffect with Types

```tsx
function Component() {
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Timer fired')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return <div>Component</div>
}
```

### 4. useContext with Types

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### 5. useReducer with Types

```tsx
type State = {
  count: number
  name: string
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_NAME'; payload: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    case 'DECREMENT':
      return { ...state, count: state.count - 1 }
    case 'SET_NAME':
      return { ...state, name: action.payload }
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    name: ''
  })

  return (
    <div>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>
        {state.count}
      </button>
      <input
        value={state.name}
        onChange={e => dispatch({ type: 'SET_NAME', payload: e.target.value })}
      />
    </div>
  )
}
```

### 6. useRef with Types

```tsx
function InputFocus() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} />
}

function Timer() {
  const timerRef = useRef<number | null>(null)

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      console.log('Tick')
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

### 7. useMemo with Types

```tsx
function ExpensiveCalculation({ numbers }: { numbers: number[] }) {
  const sum = useMemo<number>(() => {
    return numbers.reduce((acc, num) => acc + num, 0)
  }, [numbers])

  return <div>Sum: {sum}</div>
}
```

### 8. useCallback with Types

```tsx
function Button({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Click</button>
}

function Parent() {
  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return <Button onClick={handleClick} />
}
```

## Common Mistakes

### Mistake 1. Not Typing useState

```tsx
// DON'T - Not typing useState
function Component() {
  const [data, setData] = useState(null)
  return <div>{data}</div>
}

// DO - Typing useState
function Component() {
  const [data, setData] = useState<string | null>(null)
  return <div>{data}</div>
}
```

### Mistake 2. Not Typing useContext

```tsx
// DON'T - Not typing useContext
const ThemeContext = createContext(undefined)

function Component() {
  const theme = useContext(ThemeContext)
  return <div>{theme}</div>
}

// DO - Typing useContext
interface ThemeContextValue {
  theme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function Component() {
  const theme = useContext(ThemeContext)
  return <div>{theme.theme}</div>
}
```

### Mistake 3. Not Typing useReducer

```tsx
// DON'T - Not typing useReducer
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    default:
      return state
  }
}

// DO - Typing useReducer
type State = { count: number }
type Action = { type: 'INCREMENT' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 }
    default:
      return state
  }
}
```

## Best Practices

### 1. Use Type Inference

```tsx
// DO - Let TypeScript infer types
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  return <div>{count} {name}</div>
}
```

### 2. Use Union Types for State

```tsx
// DO - Use union types
type Status = 'idle' | 'loading' | 'success' | 'error'

function Component() {
  const [status, setStatus] = useState<Status>('idle')
  return <div>{status}</div>
}
```

### 3. Type Custom Hooks

```tsx
// DO - Type custom hooks
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)

  return { count, increment, decrement }
}
```

### 4. Use Generic Hooks

```tsx
// DO - Use generic hooks
function useFetch<T>(url: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [url])

  return { data, loading }
}
```

## Key Takeaways

- Type useState with explicit types
- Use union types for state
- Type useContext properly
- Type useReducer actions and state
- Type useRef with element types
- Use type inference when possible
- Type custom hooks
- Use generic hooks for reusability
