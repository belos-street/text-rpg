---
name: suspense-concurrent-features
description: Use Suspense with concurrent features for better UX.
---

# Suspense Concurrent Features

Use Suspense with concurrent features for better UX.

## The Problem

```tsx
// DON'T - Blocking UI during data fetching
function App() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchUser('1').then(setUser)
    fetchUserPosts('1').then(setPosts)
  }, [])

  if (!user) return <div>Loading...</div>

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
// UI blocks until all data is loaded
```

## The Solution

```tsx
// DO - Use Suspense with concurrent features
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <h1>{user.name}</h1>
}

function UserPosts({ userId }: { userId: string }) {
  const posts = useData(fetchUserPosts(userId))
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId="1" />
      </Suspense>
    </div>
  )
}
// UI streams in as data loads
```

## Common Patterns

### 1. Streaming Content

```tsx
function UserProfile({ userId }: { userId: string }) {
  const user = useData(fetchUser(userId))
  return <h1>{user.name}</h1>
}

function UserPosts({ userId }: { userId: string }) {
  const posts = useData(fetchUserPosts(userId))
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId="1" />
      </Suspense>
    </div>
  )
}
```

### 2. useTransition for Non-Urgent Updates

```tsx
function SearchResults({ query }: { query: string }) {
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<string[]>([])

  const handleSearch = (newQuery: string) => {
    startTransition(() => {
      setResults(search(newQuery))
    })
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <div>Searching...</div>}
      <ul>
        {results.map(result => (
          <li key={result}>{result}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 3. useDeferredValue for Expensive Renders

```tsx
function ExpensiveList({ items }: { items: string[] }) {
  const deferredItems = useDeferredValue(items)

  return (
    <ul>
      {deferredItems.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const items = search(query)

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <Suspense fallback={<div>Loading...</div>}>
        <ExpensiveList items={items} />
      </Suspense>
    </div>
  )
}
```

### 4. startTransition for Smooth Updates

```tsx
function TabContent({ tab }: { tab: string }) {
  const data = useData(fetchTabData(tab))
  return <div>{data.content}</div>
}

function App() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setTab(newTab)
    })
  }

  return (
    <div>
      <nav>
        <button onClick={() => handleTabChange('home')}>Home</button>
        <button onClick={() => handleTabChange('about')}>About</button>
        <button onClick={() => handleTabChange('contact')}>Contact</button>
      </nav>
      {isPending && <div>Loading...</div>}
      <Suspense fallback={<div>Loading content...</div>}>
        <TabContent tab={tab} />
      </Suspense>
    </div>
  )
}
```

### 5. Concurrent Mode with Multiple Suspense

```tsx
function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>

      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId="1" />
      </Suspense>

      <Suspense fallback={<div>Loading comments...</div>}>
        <UserComments userId="1" />
      </Suspense>
    </div>
  )
}
```

### 6. useId for Stable IDs

```tsx
function FormField({ label }: { label: string }) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  )
}

function App() {
  return (
    <form>
      <FormField label="Name" />
      <FormField label="Email" />
      <FormField label="Password" />
    </form>
  )
}
```

### 7. useSyncExternalStore for External Stores

```tsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback)
      return () => window.removeEventListener('resize', callback)
    },
    () => ({ width: window.innerWidth, height: window.innerHeight })
  )

  return size
}

function App() {
  const { width, height } = useWindowSize()

  return (
    <div>
      <p>Width: {width}</p>
      <p>Height: {height}</p>
    </div>
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

### Mistake 1. Not Using Concurrent Features

```tsx
// DON'T - Not using concurrent features
function App() {
  const [tab, setTab] = useState('home')

  return (
    <div>
      <button onClick={() => setTab('home')}>Home</button>
      <button onClick={() => setTab('about')}>About</button>
      <Suspense fallback={<div>Loading...</div>}>
        <TabContent tab={tab} />
      </Suspense>
    </div>
  )
}

// DO - Using concurrent features
function App() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setTab(newTab)
    })
  }

  return (
    <div>
      <button onClick={() => handleTabChange('home')}>Home</button>
      <button onClick={() => handleTabChange('about')}>About</button>
      {isPending && <div>Loading...</div>}
      <Suspense fallback={<div>Loading...</div>}>
        <TabContent tab={tab} />
      </Suspense>
    </div>
  )
}
```

### Mistake 2. Blocking UI

```tsx
// DON'T - Blocking UI
function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser('1').then(setUser)
  }, [])

  if (!user) return <div>Loading...</div>

  return <div>{user.name}</div>
}

// DO - Non-blocking UI
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

### Mistake 3. Not Using useTransition

```tsx
// DON'T - Not using useTransition
function App() {
  const [tab, setTab] = useState('home')

  return (
    <div>
      <button onClick={() => setTab('about')}>About</button>
      <Suspense fallback={<div>Loading...</div>}>
        <TabContent tab={tab} />
      </Suspense>
    </div>
  )
}

// DO - Using useTransition
function App() {
  const [tab, setTab] = useState('home')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setTab(newTab)
    })
  }

  return (
    <div>
      <button onClick={() => handleTabChange('about')}>About</button>
      {isPending && <div>Loading...</div>}
      <Suspense fallback={<div>Loading...</div>}>
        <TabContent tab={tab} />
      </Suspense>
    </div>
  )
}
```

## Performance Tips

### 1. Use useTransition for Non-Urgent Updates

```tsx
// DO - Use useTransition
function App() {
  const [isPending, startTransition] = useTransition()

  const handleUpdate = () => {
    startTransition(() => {
      updateData()
    })
  }

  return (
    <div>
      <button onClick={handleUpdate}>Update</button>
      {isPending && <div>Updating...</div>}
    </div>
  )
}
```

### 2. Use useDeferredValue for Expensive Renders

```tsx
// DO - Use useDeferredValue
function App() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <ExpensiveList query={deferredQuery} />
    </div>
  )
}
```

### 3. Stream Content with Suspense

```tsx
// DO - Stream content
function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading user...</div>}>
        <UserProfile userId="1" />
      </Suspense>
      <Suspense fallback={<div>Loading posts...</div>}>
        <UserPosts userId="1" />
      </Suspense>
    </div>
  )
}
```

## Key Takeaways

- Use Suspense for streaming content
- Use useTransition for non-urgent updates
- Use useDeferredValue for expensive renders
- Use useId for stable IDs
- Use useSyncExternalStore for external stores
- Stream content with multiple Suspense
- Provide smooth UX with concurrent features
- Use concurrent mode for better performance
- Works with SSR
- Improve UX with streaming
