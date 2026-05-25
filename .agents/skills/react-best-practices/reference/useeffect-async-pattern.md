---
name: useeffect-async-pattern
description: Use async functions inside useEffect, not as the effect function itself.
---

# Async Pattern in useEffect

You cannot use async functions directly as the effect function. Define an async function inside useEffect instead.

## The Problem

```tsx
// DON'T - Async function as effect
function UserProfile() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(async () => {
    const data = await fetchUser()
    setUser(data)
  }, [])  // Error: Effect callbacks are synchronous
}
```

## The Solution

```tsx
// DO - Define async function inside effect
function UserProfile() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUserData() {
      const data = await fetchUser()
      setUser(data)
    }
    fetchUserData()
  }, [])
}
```

## Common Patterns

### 1. Basic Async Fetch

```tsx
function DataComponent() {
  const [data, setData] = useState<Data[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const result = await api.getData()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{data.length} items</div>
}
```

### 2. With AbortController

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

  return <div>{JSON.stringify(data)}</div>
}
```

### 3. Polling

```tsx
function StatusChecker() {
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/status')
        const data = await res.json()
        setStatus(data.status)
      } catch (err) {
        console.error(err)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  return <div>Status: {status}</div>
}
```

### 4. Sequential Requests

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    async function loadUserData() {
      try {
        const userData = await fetchUser(userId)
        setUser(userData)

        const userPosts = await fetchPosts(userId)
        setPosts(userPosts)
      } catch (err) {
        console.error(err)
      }
    }
    loadUserData()
  }, [userId])

  return (
    <div>
      <h1>{user?.name}</h1>
      <ul>
        {posts.map(post => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  )
}
```

### 5. Parallel Requests

```tsx
function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, notificationsData] = await Promise.all([
          fetchStats(),
          fetchNotifications()
        ])
        setStats(statsData)
        setNotifications(notificationsData)
      } catch (err) {
        console.error(err)
      }
    }
    loadDashboard()
  }, [])

  return <div>Dashboard</div>
}
```

### 6. Retry Logic

```tsx
function DataFetcher({ id, maxRetries = 3 }: { id: string; maxRetries?: number }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let retries = 0

    async function fetchData() {
      try {
        const res = await fetch(`/api/data/${id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json)
      } catch (err) {
        if (retries < maxRetries) {
          retries++
          setTimeout(fetchData, 1000 * retries)
        } else {
          setError(err as Error)
        }
      }
    }

    fetchData()
  }, [id, maxRetries])

  return <div>{error ? error.message : JSON.stringify(data)}</div>
}
```

### 7. Using IIFE

```tsx
function Component() {
  useEffect(() => {
    (async () => {
      const data = await fetchData()
      console.log(data)
    })()
  }, [])
}
```

## Common Mistakes

### Mistake 1: Not Handling Errors

```tsx
// DON'T - No error handling
useEffect(() => {
  async function fetchData() {
    const data = await api.getData()
    setData(data)
  }
  fetchData()
}, [])

// DO - Handle errors
useEffect(() => {
  async function fetchData() {
    try {
      const data = await api.getData()
      setData(data)
    } catch (err) {
      setError(err as Error)
    }
  }
  fetchData()
}, [])
```

### Mistake 2: Race Conditions

```tsx
// DON'T - Race condition
function Component({ id }: { id: string }) {
  useEffect(() => {
    async function fetchData() {
      const data = await fetch(`/api/data/${id}`)
      setData(await data.json())
    }
    fetchData()
  }, [id])
}

// DO - Use AbortController
function Component({ id }: { id: string }) {
  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const data = await fetch(`/api/data/${id}`, {
          signal: controller.signal
        })
        setData(await data.json())
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err)
        }
      }
    }

    fetchData()
    return () => controller.abort()
  }, [id])
}
```

### Mistake 3: Not Cleaning Up

```tsx
// DON'T - No cleanup
useEffect(() => {
  async function fetchData() {
    const data = await fetch('/api/data')
    setData(data)
  }
  fetchData()
}, [])

// DO - Cleanup with AbortController
useEffect(() => {
  const controller = new AbortController()

  async function fetchData() {
    try {
      const data = await fetch('/api/data', {
        signal: controller.signal
      })
      setData(data)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err)
      }
    }
  }

  fetchData()
  return () => controller.abort()
}, [])
```

## Key Takeaways

- Define async function inside useEffect, not as the effect function
- Always handle errors with try/catch
- Use AbortController to prevent race conditions
- Cleanup async operations when component unmounts
- Use Promise.all for parallel requests
- Consider retry logic for failed requests
