---
name: hooks-functional-updates
description: Use functional updates when new state depends on previous state to avoid stale closures.
---

# Functional Updates

Functional updates allow you to update state based on the previous state, avoiding stale closure issues.

## The Problem

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    setCount(count + 1)
    setCount(count + 1)
    // Result: count is 1, not 3!
    // All three calls use the same initial count value
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## The Solution: Functional Updates

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)
    // Result: count is 3
    // Each call gets the latest value
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## When to Use Functional Updates

### 1. Multiple Updates in Same Handler

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const incrementBy = (amount: number) => {
    setCount(prev => prev + amount)
    setCount(prev => prev + amount)
  }
}
```

### 2. State Depends on Previous State

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => {
    setCount(prev => prev + 1)
  }

  const handleDouble = () => {
    setCount(prev => prev * 2)
  }
}
```

### 3. Updates in Event Handlers or Callbacks

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => prev + 1)  // Always gets latest value
    }, 1000)

    return () => clearInterval(timer)
  }, [])
}
```

### 4. Complex Object Updates

```tsx
function UserProfile() {
  const [user, setUser] = useState({ name: '', age: 0 })

  const updateName = (newName: string) => {
    setUser(prev => ({ ...prev, name: newName }))
  }

  const incrementAge = () => {
    setUser(prev => ({ ...prev, age: prev.age + 1 }))
  }
}
```

## Common Patterns

### Toggle Pattern

```tsx
function Toggle() {
  const [isOn, setIsOn] = useState(false)

  const toggle = () => {
    setIsOn(prev => !prev)
  }

  return <button onClick={toggle}>{isOn ? 'ON' : 'OFF'}</button>
}
```

### Array Operations

```tsx
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])

  const addTodo = (text: string) => {
    setTodos(prev => [...prev, { id: Date.now(), text, done: false }])
  }

  const removeTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    )
  }
}
```

### Counter with Step

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const increment = (step: number) => {
    setCount(prev => prev + step)
  }

  return (
    <>
      <div>{count}</div>
      <button onClick={() => increment(1)}>+1</button>
      <button onClick={() => increment(5)}>+5</button>
      <button onClick={() => increment(10)}>+10</button>
    </>
  )
}
```

## When NOT to Use Functional Updates

### When New State Doesn't Depend on Old State

```tsx
// DON'T - Unnecessary functional update
function Form() {
  const [name, setName] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)  // Direct value, no need for functional update
  }
}

// DO - Direct update is fine
function Form() {
  const [name, setName] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }
}
```

## Key Takeaways

- Use functional updates when new state depends on previous state
- Prevents stale closure issues in callbacks and timers
- Essential for multiple updates in the same handler
- Not needed when setting to a completely new independent value
- The function receives the previous state as its argument
