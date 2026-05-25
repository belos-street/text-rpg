---
name: usecallback-vs-inline-functions
description: Use useCallback only when passing callbacks to memo components or as dependencies. Inline functions are fine otherwise.
---

# useCallback vs Inline Functions

Use useCallback only when passing callbacks to memo components or as dependencies. Inline functions are fine otherwise.

## The Problem

```tsx
// DON'T - Unnecessary useCallback
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return <button onClick={handleClick}>{count}</button>
}
```

This useCallback provides no benefit since the button is not memoized.

## When to Use useCallback

### 1. Passing to memo Components

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

### 2. As useEffect Dependency

```tsx
function Component() {
  const [data, setData] = useState([])

  const fetchData = useCallback(async () => {
    const result = await api.getData()
    setData(result)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return <div>{data.length} items</div>
}
```

### 3. Passing to Custom Hooks

```tsx
function useKeyPress(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === key) callback()
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [key, callback])
}

function Component() {
  const handleEscape = useCallback(() => {
    console.log('Escape pressed')
  }, [])

  useKeyPress('Escape', handleEscape)

  return <div>Press Escape</div>
}
```

### 4. Stable Reference for Comparison

```tsx
function Component() {
  const [callback, setCallback] = useState<(() => void) | null>(null)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  useEffect(() => {
    if (callback) {
      callback()
    }
  }, [callback])

  return (
    <>
      <button onClick={() => setCallback(handleClick)}>Set Callback</button>
    </>
  )
}
```

## When Inline Functions Are Fine

### 1. Event Handlers on Non-memo Components

```tsx
// DO - Inline function is fine
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  )
}
```

### 2. Simple Event Handlers

```tsx
// DO - Inline function is fine
function Form() {
  const [name, setName] = useState('')

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  )
}
```

### 3. One-time Event Handlers

```tsx
// DO - Inline function is fine
function Component() {
  return (
    <button onClick={() => console.log('Clicked')}>
      Click me
    </button>
  )
}
```

### 4. Mapped Event Handlers

```tsx
// DO - Inline function is fine
function List({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <button onClick={() => console.log(item.id)}>
            {item.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
```

## Performance Comparison

### Without useCallback

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child onClick={() => console.log('Child clicked')} />
    </>
  )
}

function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
}
```

Child re-renders every time Parent re-renders because onClick is a new function.

### With useCallback

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Child clicked')
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

Child only re-renders when handleClick changes (never in this case).

## Common Mistakes

### Mistake 1: Overusing useCallback

```tsx
// DON'T - Unnecessary useCallback
function Component() {
  const [count, setCount] = useState(0)

  const increment = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return <button onClick={increment}>{count}</button>
}

// DO - Inline function is fine
function Component() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  )
}
```

### Mistake 2: useCallback Without memo

```tsx
// DON'T - useCallback without memo
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

function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
}

// DO - Use memo with useCallback
const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})
```

### Mistake 3: useCallback for Simple Logic

```tsx
// DON'T - Unnecessary for simple logic
function Component() {
  const [value, setValue] = useState('')

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  return <input value={value} onChange={handleChange} />
}

// DO - Inline function is fine
function Component() {
  const [value, setValue] = useState('')

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}
```

## Decision Tree

```
Need to pass callback to child?
├─ Yes
│  └─ Is child memoized?
│     ├─ Yes → Use useCallback
│     └─ No → Inline function is fine
└─ No → Inline function is fine
```

## Key Takeaways

- Use useCallback only when necessary
- Inline functions are fine for most cases
- Use useCallback when passing to memo components
- Use useCallback as useEffect dependencies
- Use useCallback when passing to custom hooks
- Don't use useCallback just to avoid creating functions
- Measure performance before optimizing
- useCallback has its own overhead
