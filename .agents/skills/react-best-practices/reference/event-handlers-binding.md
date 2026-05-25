---
name: event-handlers-binding
description: Use arrow functions or useCallback for event handlers to avoid binding issues.
---

# Event Handlers Binding

Use arrow functions or useCallback for event handlers to avoid binding issues.

## The Problem

```tsx
// DON'T - Binding in constructor (class components)
class Button extends React.Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick() {
    console.log('Clicked')
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>
  }
}
```

## The Solution

```tsx
// DO - Arrow functions (functional components)
function Button() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}

// DO - Class arrow fields
class Button extends React.Component {
  handleClick = () => {
    console.log('Clicked')
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>
  }
}
```

## Common Patterns

### 1. Arrow Functions

```tsx
function Component() {
  const handleClick = () => console.log('Clicked')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Changed:', e.target.value)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted')
  }

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onChange={handleChange} />
      <form onSubmit={handleSubmit}>
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}
```

### 2. useCallback for Performance

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  return (
    <div>
      <button onClick={handleClick}>Increment</button>
      <Child onClick={useCallback(() => console.log('Child'), [])} />
    </div>
  )
}

const Child = memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})
```

### 3. Handlers with Parameters

```tsx
function List({ items }: { items: string[] }) {
  const handleItemClick = (item: string) => () => {
    console.log('Clicked:', item)
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

### 4. Handlers with Event Objects

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Changed:', e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 5. Async Handlers

```tsx
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

### 6. Handlers with Multiple Actions

```tsx
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

### 7. Handlers with State Updates

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => setCount(c => c + 1)
  const handleDecrement = () => setCount(c => c - 1)
  const handleReset = () => setCount(0)

  return (
    <div>
      <button onClick={handleIncrement}>+</button>
      <span>{count}</span>
      <button onClick={handleDecrement}>-</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

### 8. Handlers with Conditional Logic

```tsx
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

## Common Mistakes

### Mistake 1. Binding in Render

```tsx
// DON'T - Binding in render
function Component() {
  const handleClick = function() {
    console.log('Clicked')
  }.bind(this)

  return <button onClick={handleClick}>Click</button>
}

// DO - Arrow functions
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 2. Inline Arrow Functions

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

### Mistake 3. Function Calls in JSX

```tsx
// DON'T - Function calls
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick()}>Click</button>
}

// DO - Function references
function Component() {
  const handleClick = () => console.log('Clicked')
  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 4. Not Using useCallback

```tsx
// DON'T - Not using useCallback
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={() => console.log('Child clicked')} />
    </div>
  )
}

// DO - Using useCallback
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

## Performance Optimization

### 1. useCallback with Dependencies

```tsx
function Component({ userId }: { userId: string }) {
  const [data, setData] = useState(null)

  const fetchData = useCallback(async () => {
    const result = await api.fetchUser(userId)
    setData(result)
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return <div>{JSON.stringify(data)}</div>
}
```

### 2. Memoizing Handlers

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const handleIncrement = useCallback(() => {
    setCount(c => c + 1)
  }, [])

  const handleDecrement = useCallback(() => {
    setCount(c => c - 1)
  }, [])

  return (
    <div>
      <button onClick={handleIncrement}>+</button>
      <button onClick={handleDecrement}>-</button>
    </div>
  )
}
```

### 3. Stable Handler References

```tsx
const Child = memo(({ onClick }: { onClick: () => void }) => {
  console.log('Child rendered')
  return <button onClick={onClick}>Child</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleChildClick = useCallback(() => console.log('Child clicked'), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <Child onClick={handleChildClick} />
    </div>
  )
}
```

## Key Takeaways

- Use arrow functions for event handlers
- Use useCallback for performance optimization
- Avoid binding in render
- Pass function references, not calls
- Define handlers outside JSX
- Use useCallback with proper dependencies
- Memoize handlers for child components
- Keep handler references stable
