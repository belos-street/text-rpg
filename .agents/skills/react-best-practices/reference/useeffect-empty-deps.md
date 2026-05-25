---
name: useeffect-empty-deps
description: Empty dependency array in useEffect means the effect runs only once on mount, similar to componentDidMount.
---

# Empty Dependency Array

Passing an empty dependency array `[]` to useEffect means the effect runs only once when the component mounts.

## Basic Usage

```tsx
function UserProfile() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser().then(setUser)
  }, [])  // Runs only once on mount

  if (!user) return <div>Loading...</div>
  return <div>{user.name}</div>
}
```

## When to Use Empty Deps

### 1. Initial Data Fetching

```tsx
function DataComponent() {
  const [data, setData] = useState<Data[]>([])

  useEffect(() => {
    async function fetchData() {
      const result = await api.getData()
      setData(result)
    }
    fetchData()
  }, [])  // Fetch once on mount
}
```

### 2. Event Listeners

```tsx
function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])  // Set up once on mount
}
```

### 3. Timers

```tsx
function Timer() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])  // Start timer once on mount
}
```

### 4. Third-party Libraries

```tsx
function Chart() {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    const chart = new Chart(chartRef.current, {
      type: 'bar',
      data: chartData
    })

    return () => chart.destroy()
  }, [])  // Initialize once on mount
}
```

## Common Mistakes

### Mistake 1: Using Empty Deps with External Values

```tsx
// DON'T - Stale closure
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [])  // userId is stale if it changes!
}

// DO - Include dependencies
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])  // Re-fetch when userId changes
}
```

### Mistake 2: Using Empty Deps with Functions

```tsx
// DON'T - Function changes on every render
function Form() {
  const [data, setData] = useState({})

  const handleSubmit = async () => {
    const result = await api.submit(data)
    console.log(result)
  }

  useEffect(() => {
    handleSubmit()
  }, [handleSubmit])  // Runs on every render!
}

// DO - Use useCallback or move inside effect
function Form() {
  const [data, setData] = useState({})

  useEffect(() => {
    async function submit() {
      const result = await api.submit(data)
      console.log(result)
    }
    submit()
  }, [data])
}
```

### Mistake 3: Forgetting Cleanup

```tsx
// DON'T - Memory leak
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)
    // No cleanup - timer keeps running after unmount!
  }, [])
}

// DO - Always cleanup
function Component() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)
    return () => clearInterval(timer)
  }, [])
}
```

## Comparison with Lifecycle Methods

```tsx
// Class Component - componentDidMount
class UserProfile extends React.Component {
  state = { user: null }

  componentDidMount() {
    fetchUser().then(user => this.setState({ user }))
  }

  render() {
    return <div>{this.state.user?.name}</div>
  }
}

// Function Component - useEffect with empty deps
function UserProfile() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser().then(setUser)
  }, [])

  return <div>{user?.name}</div>
}
```

## Key Takeaways

- Empty dependency array `[]` means effect runs once on mount
- Similar to `componentDidMount` in class components
- Don't use empty deps if effect depends on props or state
- Always cleanup timers, event listeners, and subscriptions
- Use when setting up things that should persist for component lifetime
