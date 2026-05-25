---
name: performance-usecallback
description: Use useCallback to memoize functions and prevent unnecessary re-renders.
---

# useCallback

Use useCallback to memoize functions and prevent unnecessary re-renders.

## The Problem

```tsx
// DON'T - New function on every render
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    console.log('Clicked')
  }

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={handleClick} />
    </div>
  )
}

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})
// Child re-renders on every parent render!
```

## The Solution

```tsx
// DO - Use useCallback to memoize function
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={handleClick} />
    </div>
  )
}

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})
// Child only re-renders when handleClick changes!
```

## Common Patterns

### 1. Basic useCallback

```tsx
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return <button onClick={handleClick}>Click me</button>
}
```

### 2. useCallback with Dependencies

```tsx
function Component() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const handleLog = useCallback(() => {
    console.log('Count:', count)
  }, [count])

  return (
    <div>
      <button onClick={handleClick}>Increment</button>
      <button onClick={handleLog}>Log</button>
    </div>
  )
}
```

### 3. useCallback with State Updates

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(c => c - 1)
  }, [])

  const reset = useCallback(() => {
    setCount(0)
  }, [])

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### 4. useCallback with Event Handlers

```tsx
function Form() {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted:', value)
  }, [value])

  const handleReset = useCallback(() => {
    setValue('')
  }, [])

  return (
    <form onSubmit={handleSubmit}>
      <input value={value} onChange={handleChange} />
      <button type="submit">Submit</button>
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  )
}
```

### 5. useCallback with Child Components

```tsx
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleChildClick = useCallback(() => {
    console.log('Child clicked')
  }, [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={handleChildClick} />
    </div>
  )
}
```

### 6. useCallback with Props

```tsx
function Component({ onAction }: { onAction: (value: string) => void }) {
  const [value, setValue] = useState('')

  const handleClick = useCallback(() => {
    onAction(value)
  }, [value, onAction])

  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={handleClick}>Submit</button>
    </div>
  )
}

function Parent() {
  const handleAction = useCallback((value: string) => {
    console.log('Action:', value)
  }, [])

  return <Component onAction={handleAction} />
}
```

### 7. useCallback with Async Operations

```tsx
function DataFetcher() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.fetchData()
      setData(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  )
}
```

### 8. useCallback with Multiple Dependencies

```tsx
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  const handleLog = useCallback(() => {
    console.log(`Count: ${count}, Name: ${name}`)
  }, [count, name])

  const handleIncrement = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  return (
    <div>
      <button onClick={handleIncrement}>Increment</button>
      <input value={name} onChange={handleNameChange} />
      <button onClick={handleLog}>Log</button>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using useCallback with memo

```tsx
// DON'T - Not using useCallback
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={() => console.log('Clicked')} />
    </div>
  )
}
// Child re-renders on every parent render!

// DO - Using useCallback
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => console.log('Clicked'), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={handleClick} />
    </div>
  )
}
```

### Mistake 2. Missing Dependencies

```tsx
// DON'T - Missing dependencies
function Component() {
  const [count, setCount] = useState(0)

  const handleLog = useCallback(() => {
    console.log('Count:', count)
  }, [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={handleLog}>Log</button>
    </div>
  )
}
// Always logs 0!

// DO - Including dependencies
function Component() {
  const [count, setCount] = useState(0)

  const handleLog = useCallback(() => {
    console.log('Count:', count)
  }, [count])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={handleLog}>Log</button>
    </div>
  )
}
```

### Mistake 3. Overusing useCallback

```tsx
// DON'T - Overusing useCallback
function Component() {
  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return <button onClick={handleClick}>Click me</button>
}

// DO - Only use when needed
function Component() {
  const handleClick = () => {
    console.log('Clicked')
  }

  return <button onClick={handleClick}>Click me</button>
}
```

## Performance Considerations

### 1. When to Use useCallback

```tsx
// DO - Use when passing to memoized child
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const handleClick = useCallback(() => console.log('Clicked'), [])
  return <Child onClick={handleClick} />
}

// DON'T - Don't use for simple handlers
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click me</button>
}
```

### 2. useCallback vs Inline Functions

```tsx
// DON'T - Inline function causes re-render
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={() => console.log('Clicked')} />
    </div>
  )
}

// DO - useCallback prevents re-render
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)
  const handleClick = useCallback(() => console.log('Clicked'), [])
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <Child onClick={handleClick} />
    </div>
  )
}
```

## Key Takeaways

- Use useCallback to memoize functions
- Use with memo for child components
- Include all dependencies in dependency array
- Don't overuse useCallback
- Profile before optimizing
- Consider the cost of memoization
- Use for event handlers passed to children
- Use for functions used in useEffect dependencies
