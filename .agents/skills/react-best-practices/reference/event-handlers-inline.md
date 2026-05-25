---
name: event-handlers-inline
description: Avoid inline event handlers in JSX for better performance and readability.
---

# Event Handlers Inline

Avoid inline event handlers in JSX for better performance and readability.

## The Problem

```tsx
// DON'T - Inline event handlers
function Component() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
// New function created on every render!
```

## The Solution

```tsx
// DO - Define handlers outside JSX
function Component() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => setCount(c => c + 1)
  const handleDecrement = () => setCount(c => c - 1)
  const handleReset = () => setCount(0)

  return (
    <div>
      <button onClick={handleIncrement}>Increment</button>
      <button onClick={handleDecrement}>Decrement</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

## Common Patterns

### 1. Simple Handlers

```tsx
// DON'T - Inline handlers
function Button() {
  return <button onClick={() => console.log('Clicked')}>Click</button>
}

// DO - Defined handlers
function Button() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

### 2. Handlers with Parameters

```tsx
// DON'T - Inline handlers with parameters
function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index} onClick={() => console.log(item)}>
          {item}
        </li>
      ))}
    </ul>
  )
}

// DO - Defined handlers
function List({ items }: { items: string[] }) {
  const handleItemClick = (item: string) => () => {
    console.log(item)
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index} onClick={handleItemClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  )
}
```

### 3. Handlers with State Updates

```tsx
// DON'T - Inline state updates
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

// DO - Defined handlers
function Counter() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => setCount(c => c + 1)
  const handleDecrement = () => setCount(c => c - 1)
  const handleReset = () => setCount(0)

  return (
    <div>
      <button onClick={handleIncrement}>+</button>
      <button onClick={handleDecrement}>-</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

### 4. Handlers with Event Objects

```tsx
// DON'T - Inline event handlers
function Form() {
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      console.log('Submitted')
    }}>
      <button type="submit">Submit</button>
    </form>
  )
}

// DO - Defined handlers
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 5. Handlers with Multiple Actions

```tsx
// DON'T - Inline multiple actions
function Button() {
  const [loading, setLoading] = useState(false)

  return (
    <button
      onClick={() => {
        setLoading(true)
        api.fetchData().finally(() => setLoading(false))
      }}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Click'}
    </button>
  )
}

// DO - Defined handlers
function Button() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await api.fetchData()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : 'Click'}
    </button>
  )
}
```

### 6. Handlers with useCallback

```tsx
// DON'T - Inline handlers without memoization
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={() => console.log('Child clicked')} />
    </div>
  )
}

// DO - Memoized handlers
function Parent() {
  const [count, setCount] = useState(0)

  const handleIncrement = useCallback(() => setCount(c => c + 1), [])
  const handleChildClick = useCallback(() => console.log('Child clicked'), [])

  return (
    <div>
      <button onClick={handleIncrement}>Increment</button>
      <Child onClick={handleChildClick} />
    </div>
  )
}
```

### 7. Handlers with Conditional Logic

```tsx
// DON'T - Inline conditional logic
function Button({ disabled }: { disabled: boolean }) {
  return (
    <button
      onClick={() => {
        if (!disabled) {
          console.log('Clicked')
        }
      }}
      disabled={disabled}
    >
      Click
    </button>
  )
}

// DO - Defined handlers
function Button({ disabled }: { disabled: boolean }) {
  const handleClick = () => {
    if (!disabled) {
      console.log('Clicked')
    }
  }

  return (
    <button onClick={handleClick} disabled={disabled}>
      Click
    </button>
  )
}
```

### 8. Handlers with Async Operations

```tsx
// DON'T - Inline async handlers
function Button() {
  return (
    <button
      onClick={async () => {
        try {
          await api.fetchData()
          console.log('Success')
        } catch (error) {
          console.error('Error:', error)
        }
      }}
    >
      Fetch
    </button>
  )
}

// DO - Defined async handlers
function Button() {
  const handleClick = async () => {
    try {
      await api.fetchData()
      console.log('Success')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return <button onClick={handleClick}>Fetch</button>
}
```

## Common Mistakes

### Mistake 1. Inline Arrow Functions

```tsx
// DON'T - Inline arrow functions
function Component() {
  return <button onClick={() => console.log('Clicked')}>Click</button>
}

// DO - Defined handlers
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 2. Inline Function Calls

```tsx
// DON'T - Inline function calls
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick()}>Click</button>
}

// DO - Pass function reference
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 3. Inline Bind

```tsx
// DON'T - Inline bind
function Component() {
  return <button onClick={function() { console.log('Clicked') }.bind(this)}>Click</button>
}

// DO - Defined handlers
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

## Performance Considerations

### 1. Re-render Optimization

```tsx
// DON'T - Causes unnecessary re-renders
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={() => console.log('Child clicked')} />
    </div>
  )
}

// DO - Optimized with useCallback
function Parent() {
  const [count, setCount] = useState(0)

  const handleIncrement = useCallback(() => setCount(c => c + 1), [])
  const handleChildClick = useCallback(() => console.log('Child clicked'), [])

  return (
    <div>
      <button onClick={handleIncrement}>Increment</button>
      <Child onClick={handleChildClick} />
    </div>
  )
}
```

### 2. Memo Child Components

```tsx
const Child = memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})

// DON'T - Child re-renders on every parent render
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={() => console.log('Child clicked')} />
    </div>
  )
}

// DO - Child doesn't re-render unnecessarily
function Parent() {
  const [count, setCount] = useState(0)

  const handleIncrement = useCallback(() => setCount(c => c + 1), [])
  const handleChildClick = useCallback(() => console.log('Child clicked'), [])

  return (
    <div>
      <button onClick={handleIncrement}>Increment</button>
      <Child onClick={handleChildClick} />
    </div>
  )
}
```

## Key Takeaways

- Avoid inline event handlers in JSX
- Define handlers outside JSX
- Use useCallback for memoization
- Pass function references, not calls
- Improve performance and readability
- Prevent unnecessary re-renders
- Keep JSX clean and readable
- Follow React best practices
