---
name: suspense-data-fetching
description: Use Suspense for data fetching with React 18+ features.
---

# Suspense Data Fetching

Use Suspense for data fetching with React 18+ features.

## The Problem

```tsx
// DON'T - Traditional data fetching with loading states
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>No user found</div>

  return <div>{user.name}</div>
}
```

## The Solution

```tsx
// DO - Use Suspense for data fetching
function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUser(userId))

  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

## Common Patterns

### 1. Basic Suspense Data Fetching

```tsx
function useData<T>(promise: Promise<T>): T {
  if (promise.status === 'fulfilled') {
    return promise.value as T
  }
  if (promise.status === 'rejected') {
    throw promise.reason
  }
  throw promise.then(
    value => {
      promise.status = 'fulfilled'
      promise.value = value
    },
    reason => {
      promise.status = 'rejected'
      promise.reason = reason
    }
  )
}

function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 2. Multiple Data Sources

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  const posts = useData(fetchUserPosts(userId))

  return (
    <div>
      <h1>{user.name}</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 3. Nested Suspense

```tsx
function PostList({ userId }: { userId: string }) {
  const posts = useData(fetchUserPosts(userId))

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <Suspense fallback={<div>Loading comments...</div>}>
            <PostWithComments postId={post.id} />
          </Suspense>
        </li>
      ))}
    </ul>
  )
}

function PostWithComments({ postId }: { postId: string }) {
  const comments = useData(fetchPostComments(postId))

  return (
    <div>
      <p>Comments: {comments.length}</p>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading posts...</div>}>
      <PostList userId="1" />
    </Suspense>
  )
}
```

### 4. Error Boundaries with Suspense

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### 5. Data Caching

```tsx
const cache = new Map<string, any>()

function fetchData<T>(key: string, fetcher: () => Promise<T>): T {
  if (cache.has(key)) {
    return cache.get(key)
  }

  const promise = fetcher()
  cache.set(key, promise)

  throw promise
}

function UserProfile({ userId }: { userId: string }) {
  const user = fetchData(`user-${userId}`, () => fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 6. Prefetching Data

```tsx
function prefetchData<T>(key: string, fetcher: () => Promise<T>) {
  if (!cache.has(key)) {
    const promise = fetcher()
    cache.set(key, promise)
  }
}

function UserProfile({ userId }: { userId: string }) {
  const user = fetchData(`user-${userId}`, () => fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  useEffect(() => {
    prefetchData('user-2', () => fetchUser('2'))
  }, [])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### 7. Streaming Data

```tsx
function UserList({ userIds }: { userIds: string[] }) {
  return (
    <ul>
      {userIds.map(userId => (
        <li key={userId}>
          <Suspense fallback={<div>Loading...</div>}>
            <UserProfile userId={userId} />
          </Suspense>
        </li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UserList userIds={['1', '2', '3']} />
    </Suspense>
  )
}
```

### 8. Server-Side Rendering with Suspense

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <html>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <UserProfile userId="1" />
        </Suspense>
      </body>
    </html>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using Error Boundaries

```tsx
// DON'T - Not using Error Boundary
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}

// DO - Using Error Boundary
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### Mistake 2. Not Caching Data

```tsx
// DON'T - Not caching data
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <div>{user.name}</div>
}

// DO - Caching data
const cache = new Map()

function UserProfile({ userId }: { userId: string }) {
  const user = fetchData(`user-${userId}`, () => fetchUser(userId))
  return <div>{user.name}</div>
}
```

### Mistake 3. Not Prefetching Data

```tsx
// DON'T - Not prefetching
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}

// DO - Prefetching data
function App() {
  useEffect(() => {
    prefetchData('user-2', () => fetchUser('2'))
  }, [])

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

## Performance Tips

### 1. Use Suspense for Independent Data

```tsx
// DO - Fetch independent data in parallel
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  const settings = useData(fetchUserSettings(userId))

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Theme: {settings.theme}</p>
    </div>
  )
}
```

### 2. Use Nested Suspense for Progressive Loading

```tsx
// DO - Use nested Suspense
function PostList({ userId }: { userId: string }) {
  const posts = useData(fetchUserPosts(userId))

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <Suspense fallback={<div>Loading comments...</div>}>
            <PostWithComments postId={post.id} />
          </Suspense>
        </li>
      ))}
    </ul>
  )
}
```

### 3. Use Error Boundaries for Error Recovery

```tsx
// DO - Use Error Boundaries
function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Key Takeaways

- Use Suspense for data fetching
- Wrap data fetching in Suspense
- Use Error Boundaries for error handling
- Cache data to avoid duplicate requests
- Prefetch data for better UX
- Use nested Suspense for progressive loading
- Fetch independent data in parallel
- Use Suspense for streaming data
- Works with SSR
- Use libraries like React Query or SWR
