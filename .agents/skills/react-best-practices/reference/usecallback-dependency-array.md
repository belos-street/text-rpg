---
name: usecallback-dependency-array
description: Always include all values used in useCallback in the dependency array to avoid stale closures.
---

# useCallback Dependency Array

Always include all values used in useCallback in the dependency array to avoid stale closures and bugs.

## The Problem

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log(count)  // Always logs 0 - stale closure!
  }, [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </>
  )
}
```

## The Solution

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log(count)  // Logs current count
  }, [count])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </>
  )
}
```

## Common Scenarios

### 1. Using State in Callback

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(c => c + 1)  // Functional update - no dep needed
  }, [])

  const logCount = useCallback(() => {
    console.log(count)  // Needs count in deps
  }, [count])

  return (
    <>
      <button onClick={increment}>Increment</button>
      <button onClick={logCount}>Log</button>
    </>
  )
}
```

### 2. Using Props in Callback

```tsx
function Parent({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  const fetchUser = useCallback(async () => {
    const data = await api.getUser(userId)
    setUser(data)
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return <div>{user?.name}</div>
}
```

### 3. Multiple Dependencies

```tsx
function Search({ query, category }: { query: string; category: string }) {
  const [results, setResults] = useState([])

  const search = useCallback(async () => {
    const data = await api.search({ query, category })
    setResults(data)
  }, [query, category])

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <button onClick={search}>Search</button>
      <Results items={results} />
    </>
  )
}
```

### 4. Event Handlers with Multiple Values

```tsx
function Form() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = useCallback(async () => {
    await api.submit({ name, email })
  }, [name, email])

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 5. Callbacks Passed to memo Components

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child onClick={handleClick} />
    </>
  )
}

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})
```

### 6. Using Functions in Callback

```tsx
function Component() {
  const [data, setData] = useState([])

  const processData = useCallback(() => {
    return data.filter(item => item.active)
  }, [data])

  const handleProcess = useCallback(() => {
    const result = processData()
    console.log(result)
  }, [processData])

  return <button onClick={handleProcess}>Process</button>
}
```

## Common Mistakes

### Mistake 1: Missing Dependencies

```tsx
// DON'T - Missing dependency
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log(count)
  }, [])

  // DO - Include dependency
  const handleClick = useCallback(() => {
    console.log(count)
  }, [count])
}
```

### Mistake 2: Unnecessary Dependencies

```tsx
// DON'T - Unnecessary dependency
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [count])

  // DO - No dependency needed for functional update
  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])
}
```

### Mistake 3: Object Dependencies

```tsx
// DON'T - Object changes on every render
function Component() {
  const [data, setData] = useState({})

  const handleClick = useCallback(() => {
    console.log(data)
  }, [data])

  // DO - Use individual properties
  const handleClick = useCallback(() => {
    console.log(data.name)
  }, [data.name])
}
```

## ESLint Integration

Enable ESLint rule to catch missing dependencies:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Advanced Patterns

### 1. Functional Updates to Avoid Dependencies

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(c => c + 1)  // No dependency needed
  }, [])

  const incrementBy = useCallback((amount: number) => {
    setCount(c => c + amount)  // No dependency needed
  }, [])

  return (
    <>
      <button onClick={increment}>+1</button>
      <button onClick={() => incrementBy(5)}>+5</button>
    </>
  )
}
```

### 2. Ref for Latest Value

```tsx
function Component() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  useEffect(() => {
    countRef.current = count
  }, [count])

  const handleClick = useCallback(() => {
    console.log(countRef.current)  // No dependency needed
  }, [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <button onClick={handleClick}>Log</button>
    </>
  )
}
```

### 3. useReducer to Avoid Dependencies

```tsx
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 }
    case 'setCount':
      return { ...state, count: action.payload }
    default:
      return state
  }
}

function Component() {
  const [state, dispatch] = useReducer(reducer, { count: 0 })

  const increment = useCallback(() => {
    dispatch({ type: 'increment' })  // No dependency needed
  }, [])

  const setCount = useCallback((value: number) => {
    dispatch({ type: 'setCount', payload: value })
  }, [])

  return <button onClick={increment}>{state.count}</button>
}
```

## Key Takeaways

- Always include all values used in useCallback in dependency array
- Use functional updates to avoid dependencies on state
- Use ESLint react-hooks/exhaustive-deps rule
- Be careful with object/array dependencies
- Use refs or useReducer to avoid dependency issues
- useCallback is primarily for passing stable callbacks to children
- Don't use useCallback just to avoid re-creating functions
