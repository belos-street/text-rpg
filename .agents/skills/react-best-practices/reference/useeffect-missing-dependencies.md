---
name: useeffect-missing-dependencies
description: Always include all values used in useEffect in the dependency array to avoid stale closures and bugs.
---

# Missing Dependencies

Always include all values from the component scope that are used inside useEffect in the dependency array.

## The Problem

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count)  // Always logs 0 - stale closure!
    }, 1000)

    return () => clearInterval(timer)
  }, [])  // count is missing from deps

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## The Solution

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count)  // Logs current count
    }, 1000)

    return () => clearInterval(timer)
  }, [count])  // Include count in deps

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

## Common Scenarios

### 1. Fetching with Dynamic Parameters

```tsx
// DON'T - Missing dependency
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [])  // userId is missing!

  // DO - Include dependency
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [userId])
}
```

### 2. Functions in Effects

```tsx
// DON'T - Function changes on every render
function Form() {
  const [data, setData] = useState({})

  const handleSubmit = () => {
    api.submit(data)
  }

  useEffect(() => {
    handleSubmit()
  }, [handleSubmit])  // Runs on every render!

  // DO - Move function inside effect
  useEffect(() => {
    function handleSubmit() {
      api.submit(data)
    }
    handleSubmit()
  }, [data])

  // OR - Use useCallback
  const handleSubmit = useCallback(() => {
    api.submit(data)
  }, [data])

  useEffect(() => {
    handleSubmit()
  }, [handleSubmit])
}
```

### 3. Multiple Dependencies

```tsx
function Search({ query, category }: { query: string; category: string }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}&cat=${category}`)
      .then(res => res.json())
      .then(setResults)
  }, [query, category])  // Include both dependencies
}
```

### 4. Objects and Arrays

```tsx
function Component() {
  const [config, setConfig] = useState({ timeout: 1000, retries: 3 })

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Timeout:', config.timeout)
    }, config.timeout)

    return () => clearTimeout(timer)
  }, [config])  // config object changes on every update!

  // DO - Use individual properties
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Timeout:', config.timeout)
    }, config.timeout)

    return () => clearTimeout(timer)
  }, [config.timeout, config.retries])
}
```

## ESLint React Hooks Rule

Enable the ESLint rule to catch missing dependencies automatically:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Handling ESLint Warnings

### Scenario 1: Intentionally Omitting Dependency

```tsx
// If you really need to omit, use eslint-disable
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1)  // Using functional update
  }, 1000)

  return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### Scenario 2: Ref for Latest Value

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  useEffect(() => {
    countRef.current = count
  }, [count])

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current)
    }, 1000)

    return () => clearInterval(timer)
  }, [])  // No deps needed
}
```

### Scenario 3: UseReducer for Complex State

```tsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 }
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'increment' })
    }, 1000)

    return () => clearInterval(timer)
  }, [])  // No deps needed with dispatch
}
```

## Common Patterns

### Fetching with AbortController

```tsx
function DataFetcher({ id }: { id: string }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
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
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()
  }, [id])

  return <div>{loading ? 'Loading...' : JSON.stringify(data)}</div>
}
```

## Key Takeaways

- Always include all values used in useEffect in dependency array
- Use ESLint react-hooks/exhaustive-deps rule to catch issues
- Functions in deps often need useCallback or should be moved inside effect
- Objects/arrays in deps may need to be split into individual properties
- Use refs or useReducer when you need to avoid dependency issues
- Never intentionally omit dependencies without good reason
