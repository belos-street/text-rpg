---
name: hooks-initial-state-lazy
description: Use lazy initialization for expensive initial state to avoid recalculating on every render.
---

# Lazy Initial State

Use lazy initialization for expensive initial state computation to avoid running the function on every render.

## The Problem

```tsx
function UserProfile() {
  const [user, setUser] = useState(
    calculateExpensiveUser()  // Runs on every render!
  )

  return <div>{user.name}</div>
}

function calculateExpensiveUser(): User {
  console.log('Expensive calculation running...')
  // Complex computation, API call, or large data processing
  return { name: 'Alice', age: 25 }
}
```

The initial state function runs on every render, causing performance issues.

## The Solution: Lazy Initialization

```tsx
function UserProfile() {
  const [user, setUser] = useState(() =>
    calculateExpensiveUser()  // Runs only once!
  )

  return <div>{user.name}</div>
}
```

Pass a function to useState instead of the value directly.

## When to Use Lazy Initialization

### 1. Expensive Computations

```tsx
function DataProcessor() {
  const [processedData, setProcessedData] = useState(() => {
    console.log('Processing data...')
    return largeRawData.map(item => ({
      ...item,
      calculated: complexCalculation(item)
    }))
  })

  return <div>{processedData.length} items</div>
}
```

### 2. Reading from localStorage

```tsx
function ThemeProvider() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })

  return <div className={theme}>Content</div>
}
```

### 3. Parsing Large JSON

```tsx
function ConfigLoader() {
  const [config, setConfig] = useState(() => {
    const raw = localStorage.getItem('config')
    return raw ? JSON.parse(raw) : defaultConfig
  })

  return <div>{config.appName}</div>
}
```

### 4. Complex Object Creation

```tsx
function Game() {
  const [board, setBoard] = useState(() => {
    return Array(8).fill(null).map(() =>
      Array(8).fill(null)
    )
  })

  return <Board grid={board} />
}
```

## Common Patterns

### Reading from URL

```tsx
function SearchPage() {
  const [searchParams, setSearchParams] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      query: params.get('q') || '',
      category: params.get('category') || 'all'
    }
  })

  return <SearchForm {...searchParams} />
}
```

### Combining Multiple Sources

```tsx
function App() {
  const [state, setState] = useState(() => {
    const fromStorage = localStorage.getItem('appState')
    const fromUrl = new URLSearchParams(window.location.search)
    const fromDefaults = defaultState

    return {
      ...fromDefaults,
      ...(fromStorage ? JSON.parse(fromStorage) : {}),
      ...(fromUrl.get('theme') ? { theme: fromUrl.get('theme') } : {})
    }
  })
}
```

### Conditional Initialization

```tsx
function UserDashboard() {
  const [user, setUser] = useState(() => {
    const token = getAuthToken()
    if (!token) return null

    return decodeToken(token)
  })

  if (!user) return <Login />

  return <Dashboard user={user} />
}
```

## When NOT to Use Lazy Initialization

### Simple Values

```tsx
// DON'T - Unnecessary function wrapper
function Counter() {
  const [count, setCount] = useState(() => 0)
}

// DO - Direct value is fine
function Counter() {
  const [count, setCount] = useState(0)
}
```

### Simple Objects

```tsx
// DON'T - Overkill for simple objects
function Form() {
  const [formData, setFormData] = useState(() => ({
    name: '',
    email: ''
  }))
}

// DO - Direct object is fine
function Form() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
}
```

## Performance Comparison

```tsx
// WITHOUT lazy initialization
function ExpensiveComponent() {
  const [data, setData] = useState(
    Array(1000000).fill(0).map((_, i) => i * 2)
  )
  // This array is created on EVERY render!
}

// WITH lazy initialization
function ExpensiveComponent() {
  const [data, setData] = useState(() =>
    Array(1000000).fill(0).map((_, i) => i * 2)
  )
  // This array is created only ONCE!
}
```

## Key Takeaways

- Use lazy initialization for expensive initial state computations
- Pass a function to useState instead of the value directly
- The function runs only once during initial render
- Not needed for simple values or objects
- Common use cases: localStorage, URL params, large data processing
- Improves performance by avoiding unnecessary recalculations
