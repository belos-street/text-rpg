---
name: custom-hooks-vs-utility-functions
description: Use custom hooks for stateful logic, utility functions for stateless operations.
---

# Custom Hooks vs Utility Functions

Use custom hooks for stateful logic, utility functions for stateless operations.

## The Difference

### Utility Functions (Stateless)

```tsx
// Utility function - no state, no side effects
function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

function calculateTotal(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Usage
function Component() {
  const date = new Date()
  const formatted = formatDate(date)
  return <div>{formatted}</div>
}
```

### Custom Hooks (Stateful)

```tsx
// Custom hook - has state or side effects
function useCurrentDate() {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return date
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// Usage
function Component() {
  const date = useCurrentDate()
  return <div>{date.toLocaleString()}</div>
}
```

## When to Use Utility Functions

### 1. Pure Functions

```tsx
// Utility function - pure, no side effects
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Usage
function Component() {
  const name = 'john'
  const price = 99.99

  return (
    <div>
      <p>{capitalize(name)}</p>
      <p>{truncate('This is a long text', 10)}</p>
      <p>{formatCurrency(price)}</p>
    </div>
  )
}
```

### 2. Data Transformations

```tsx
// Utility function - transforms data
function filterActive(items: { active: boolean }[]) {
  return items.filter(item => item.active)
}

function sortByDate<T extends { date: Date }>(items: T[]) {
  return [...items].sort((a, b) => a.date.getTime() - b.date.getTime())
}

function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const group = String(item[key])
    acc[group] = acc[group] || []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// Usage
function Component({ items }: { items: Item[] }) {
  const active = filterActive(items)
  const sorted = sortByDate(active)
  const grouped = groupBy(sorted, 'category')

  return <div>{JSON.stringify(grouped)}</div>
}
```

### 3. Validation Functions

```tsx
// Utility function - validation logic
function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isRequired(value: string): boolean {
  return value.trim().length > 0
}

function minLength(value: string, min: number): boolean {
  return value.length >= min
}

// Usage
function Component() {
  const [email, setEmail] = useState('')

  const isValid = isEmail(email)

  return (
    <div>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      {!isValid && <p>Please enter a valid email</p>}
    </div>
  )
}
```

## When to Use Custom Hooks

### 1. State Management

```tsx
// Custom hook - manages state
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle] as const
}

function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  return { count, increment, decrement }
}

// Usage
function Component() {
  const [isOn, toggle] = useToggle(false)
  const { count, increment, decrement } = useCounter(0)

  return (
    <div>
      <button onClick={toggle}>{isOn ? 'ON' : 'OFF'}</button>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

### 2. Side Effects

```tsx
// Custom hook - has side effects
function useWindowSize() {
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

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

function useKeyPress(key: string) {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(true)
    }

    const handleUp = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(false)
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)

    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [key])

  return pressed
}

// Usage
function Component() {
  const { width, height } = useWindowSize()
  const isEscapePressed = useKeyPress('Escape')

  return (
    <div>
      <p>Window: {width} x {height}</p>
      {isEscapePressed && <p>Escape pressed!</p>}
    </div>
  )
}
```

### 3. Persistent State

```tsx
// Custom hook - persists state
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = sessionStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// Usage
function Component() {
  const [theme, setTheme] = useLocalStorage('theme', 'light')

  return (
    <div>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <p>Current: {theme}</p>
    </div>
  )
}
```

### 4. Async Operations

```tsx
// Custom hook - manages async state
function useFetch(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(url, { signal: controller.signal })
        const json = await res.json()
        if (!controller.signal.aborted) {
          setData(json)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => controller.abort()
  }, [url])

  return { data, loading, error }
}

// Usage
function Component() {
  const { data, loading, error } = useFetch('/api/data')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{JSON.stringify(data)}</div>
}
```

## Common Mistakes

### Mistake 1. Using Hook for Pure Function

```tsx
// DON'T - Hook for pure function
function useFormatDate(date: Date): string {
  return date.toLocaleDateString()
}

// DO - Utility function
function formatDate(date: Date): string {
  return date.toLocaleDateString()
}
```

### Mistake 2. Using Utility Function for Stateful Logic

```tsx
// DON'T - Utility function with state
function getLocalStorage(key: string, initialValue: string) {
  const saved = localStorage.getItem(key)
  return saved || initialValue
}

// DO - Custom hook
function useLocalStorage(key: string, initialValue: string) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved || initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue] as const
}
```

### Mistake 3. Mixing Concerns

```tsx
// DON'T - Hook doing too much
function useData(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(url).then(res => res.json()).then(setData)
  }, [url])

  return { data, loading, formatData: () => data?.toUpperCase() }
}

// DO - Separate concerns
function useFetch(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(url).then(res => res.json()).then(setData)
  }, [url])

  return { data, loading }
}

function formatData(data: string): string {
  return data?.toUpperCase()
}
```

## Decision Tree

```
Need to reuse logic?
├─ Is it stateful?
│  ├─ Yes → Use custom hook
│  └─ No → Use utility function
└─ Does it have side effects?
   ├─ Yes → Use custom hook
   └─ No → Use utility function
```

## Key Takeaways

- Use utility functions for pure, stateless operations
- Use custom hooks for stateful logic
- Use custom hooks for side effects
- Keep utility functions simple and focused
- Keep custom hooks focused on one concern
- Don't mix stateful and stateless logic
- Test utility functions independently
- Test custom hooks with React testing utilities
