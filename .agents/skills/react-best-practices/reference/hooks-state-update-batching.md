---
name: hooks-state-update-batching
description: React batches state updates for performance. Multiple setState calls in event handlers are batched together.
---

# State Update Batching

React batches multiple state updates together to avoid unnecessary re-renders.

## Automatic Batching

In React 18+, automatic batching works everywhere including event handlers, async operations, timeouts, and native event handlers.

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  const handleClick = () => {
    setCount(c => c + 1)
    setName('Alice')
    // Both updates are batched - only one re-render
  }

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  )
}
```

## Batching in Async Operations

```tsx
function fetchData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    setLoading(true)
    const result = await api.getData()
    setData(result)
    setLoading(false)
    // All three updates are batched in React 18+
  }
}
```

## Common Mistake

```tsx
// DON'T - Relying on stale state
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    setCount(count + 1)  // Still uses initial count!
    // Result: count becomes 1, not 2
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## Correct Approach

```tsx
// DO - Use functional updates
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(c => c + 1)
    setCount(c => c + 1)  // Uses updated count
    // Result: count becomes 2
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## Multiple State Updates

```tsx
function UserProfile() {
  const [user, setUser] = useState({ name: '', age: 0 })

  const updateProfile = () => {
    setUser(prev => ({ ...prev, name: 'Alice' }))
    setUser(prev => ({ ...prev, age: 25 }))
    // Both updates are batched, final result: { name: 'Alice', age: 25 }
  }
}
```

## When Batching Doesn't Apply

```tsx
// Outside React event handlers (rare)
setTimeout(() => {
  setCount(1)
  setName('Alice')
  // In React 17: Two separate re-renders
  // In React 18+: Batched together
}, 0)
```

## Key Takeaways

- React 18+ batches all state updates automatically
- Use functional updates when new state depends on previous state
- Don't rely on state values being immediately updated after setState
- Multiple setState calls in event handlers are batched into one re-render
