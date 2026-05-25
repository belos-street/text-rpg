---
name: performance-memo
description: Use React.memo to prevent unnecessary re-renders of pure components.
---

# React.memo

Use React.memo to prevent unnecessary re-renders of pure components.

## The Problem

```tsx
// DON'T - Component re-renders when parent re-renders
function ExpensiveComponent({ data }: { data: string[] }) {
  console.log('ExpensiveComponent rendered')
  const result = data.map(item => item.toUpperCase())
  return <div>{result.join(', ')}</div>
}

function Parent() {
  const [count, setCount] = useState(0)
  const data = ['item1', 'item2', 'item3']

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveComponent data={data} />
    </div>
  )
}
// ExpensiveComponent re-renders on every count change!
```

## The Solution

```tsx
// DO - Use React.memo to prevent unnecessary re-renders
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }: { data: string[] }) {
  console.log('ExpensiveComponent rendered')
  const result = data.map(item => item.toUpperCase())
  return <div>{result.join(', ')}</div>
})

function Parent() {
  const [count, setCount] = useState(0)
  const data = ['item1', 'item2', 'item3']

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveComponent data={data} />
    </div>
  )
}
// ExpensiveComponent only re-renders when data changes!
```

## Common Patterns

### 1. Basic memo

```tsx
const MemoizedComponent = React.memo(function Component({ name }: { name: string }) {
  return <div>Hello, {name}!</div>
})

function Parent() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('John')

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <button onClick={() => setName('Jane')}>Change Name</button>
      <MemoizedComponent name={name} />
    </div>
  )
}
```

### 2. memo with Custom Comparison

```tsx
const MemoizedComponent = React.memo(
  function Component({ data }: { data: { id: number; value: string } }) {
    console.log('Component rendered')
    return <div>{data.value}</div>
  },
  (prevProps, nextProps) => {
    return prevProps.data.id === nextProps.data.id
  }
)

function Parent() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState({ id: 1, value: 'Hello' })

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <button onClick={() => setData({ id: 1, value: 'World' })}>
        Change Value
      </button>
      <MemoizedComponent data={data} />
    </div>
  )
}
```

### 3. memo with Function Props

```tsx
const MemoizedComponent = React.memo(function Component({
  onClick
}: {
  onClick: () => void
}) {
  console.log('Component rendered')
  return <button onClick={onClick}>Click me</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent onClick={handleClick} />
    </div>
  )
}
```

### 4. memo with Children

```tsx
const MemoizedComponent = React.memo(function Component({
  children
}: {
  children: ReactNode
}) {
  console.log('Component rendered')
  return <div className="card">{children}</div>
})

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent>
        <h2>Card Title</h2>
        <p>Card content</p>
      </MemoizedComponent>
    </div>
  )
}
```

### 5. memo with Object Props

```tsx
const MemoizedComponent = React.memo(function Component({
  config
}: {
  config: { theme: string; language: string }
}) {
  console.log('Component rendered')
  return <div>Theme: {config.theme}, Language: {config.language}</div>
})

function Parent() {
  const [count, setCount] = useState(0)
  const config = useMemo(() => ({ theme: 'dark', language: 'en' }), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent config={config} />
    </div>
  )
}
```

### 6. memo with Array Props

```tsx
const MemoizedComponent = React.memo(function Component({
  items
}: {
  items: string[]
}) {
  console.log('Component rendered')
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
})

function Parent() {
  const [count, setCount] = useState(0)
  const items = useMemo(() => ['item1', 'item2', 'item3'], [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent items={items} />
    </div>
  )
}
```

### 7. memo with Complex Props

```tsx
const MemoizedComponent = React.memo(function Component({
  user,
  settings
}: {
  user: { id: number; name: string }
  settings: { theme: string; notifications: boolean }
}) {
  console.log('Component rendered')
  return (
    <div>
      <p>User: {user.name}</p>
      <p>Theme: {settings.theme}</p>
    </div>
  )
})

function Parent() {
  const [count, setCount] = useState(0)
  const user = useMemo(() => ({ id: 1, name: 'John' }), [])
  const settings = useMemo(() => ({ theme: 'dark', notifications: true }), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent user={user} settings={settings} />
    </div>
  )
}
```

### 8. memo with TypeScript

```tsx
interface MemoizedComponentProps {
  name: string
  age: number
  onClick: () => void
}

const MemoizedComponent = React.memo(function MemoizedComponent({
  name,
  age,
  onClick
}: MemoizedComponentProps) {
  console.log('MemoizedComponent rendered')
  return (
    <div>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
      <button onClick={onClick}>Click</button>
    </div>
  )
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => {
    console.log('Clicked')
  }, [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent name="John" age={30} onClick={handleClick} />
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using useCallback with memo

```tsx
// DON'T - Not using useCallback
const MemoizedComponent = React.memo(function Component({
  onClick
}: {
  onClick: () => void
}) {
  return <button onClick={onClick}>Click</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent onClick={() => console.log('Clicked')} />
    </div>
  )
}
// MemoizedComponent re-renders on every count change!

// DO - Using useCallback
const MemoizedComponent = React.memo(function Component({
  onClick
}: {
  onClick: () => void
}) {
  return <button onClick={onClick}>Click</button>
})

function Parent() {
  const [count, setCount] = useState(0)

  const handleClick = useCallback(() => console.log('Clicked'), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent onClick={handleClick} />
    </div>
  )
}
```

### Mistake 2. Not Using useMemo with memo

```tsx
// DON'T - Not using useMemo
const MemoizedComponent = React.memo(function Component({
  config
}: {
  config: { theme: string }
}) {
  return <div>Theme: {config.theme}</div>
})

function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent config={{ theme: 'dark' }} />
    </div>
  )
}
// MemoizedComponent re-renders on every count change!

// DO - Using useMemo
const MemoizedComponent = React.memo(function Component({
  config
}: {
  config: { theme: string }
}) {
  return <div>Theme: {config.theme}</div>
})

function Parent() {
  const [count, setCount] = useState(0)
  const config = useMemo(() => ({ theme: 'dark' }), [])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <MemoizedComponent config={config} />
    </div>
  )
}
```

### Mistake 3. Overusing memo

```tsx
// DON'T - Memoizing simple components
const SimpleComponent = React.memo(function Component({ text }: { text: string }) {
  return <div>{text}</div>
})

// DO - Only memoize expensive components
function SimpleComponent({ text }: { text: string }) {
  return <div>{text}</div>
}

const ExpensiveComponent = React.memo(function Component({ data }: { data: string[] }) {
  const result = data.map(item => item.toUpperCase())
  return <div>{result.join(', ')}</div>
})
```

## Key Takeaways

- Use React.memo for expensive pure components
- Memoize function props with useCallback
- Memoize object/array props with useMemo
- Use custom comparison for complex props
- Don't overuse memo on simple components
- Profile before optimizing
- Consider the cost of memoization
- Use TypeScript for type safety
