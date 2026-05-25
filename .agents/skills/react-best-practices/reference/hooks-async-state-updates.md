---
name: hooks-async-state-updates
description: State updates are asynchronous. Never read state immediately after setState.
---

# Async State Updates

React state updates are asynchronous for performance reasons. State values are not updated immediately after calling setState.

## The Problem

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    console.log(count)  // Logs 0, not 1!
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## Why This Happens

React batches updates and schedules them for later. The state variable remains unchanged until the component re-renders.

## Solutions

### Use Functional Updates

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(prev => {
      const newCount = prev + 1
      console.log(newCount)  // Logs 1
      return newCount
    })
  }

  return <button onClick={handleClick}>{count}</button>
}
```

### Use useEffect for Side Effects

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Count changed:', count)
  }, [count])

  const handleClick = () => {
    setCount(count + 1)
  }

  return <button onClick={handleClick}>{count}</button>
}
```

### Use Ref for Immediate Access

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  const handleClick = () => {
    setCount(prev => {
      const newCount = prev + 1
      countRef.current = newCount
      return newCount
    })
    console.log(countRef.current)  // Access immediately
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## Common Pitfalls

### Pitfall 1: Reading State in Same Function

```tsx
// DON'T
function Form() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = () => {
    setEmail('user@example.com')
    setPassword('password')
    console.log(email, password)  // Still empty strings!
  }
}

// DO
function Form() {
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = () => {
    const newData = { email: 'user@example.com', password: 'password' }
    setFormData(newData)
    console.log(newData)  // Use the new data directly
  }
}
```

### Pitfall 2: Multiple Dependent Updates

```tsx
// DON'T
function Counter() {
  const [count, setCount] = useState(0)
  const [doubled, setDoubled] = useState(0)

  const handleClick = () => {
    setCount(count + 1)
    setDoubled(count * 2)  // Uses old count!
  }
}

// DO - Use functional updates
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    setCount(prev => {
      const newCount = prev + 1
      return newCount
    })
  }

  const doubled = useMemo(() => count * 2, [count])
}
```

## Async Operations

```tsx
function UserProfile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function fetchUser() {
      const data = await api.getUser()
      setUser(data)
      // State updated after fetch completes
    }
    fetchUser()
  }, [])

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}
```

## Key Takeaways

- State updates are asynchronous
- Never read state immediately after setState
- Use functional updates when new state depends on old state
- Use useEffect for side effects that depend on state changes
- Use refs when you need immediate access to updated values
