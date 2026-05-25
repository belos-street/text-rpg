---
name: usememo-object-stability
description: Use useMemo to maintain stable object references and prevent unnecessary re-renders in child components.
---

# Object Stability

Use useMemo to maintain stable object references and prevent unnecessary re-renders in child components.

## The Problem

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const config = { threshold: 0.5 }

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child config={config} />
    </>
  )
}

function Child({ config }: { config: Config }) {
  useEffect(() => {
    console.log('Effect runs')
  }, [config])

  return <div>Child</div>
}
```

Every time Parent re-renders, `config` is a new object, causing Child to re-render.

## The Solution

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const config = useMemo(() => ({
    threshold: 0.5
  }), [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child config={config} />
    </>
  )
}

function Child({ config }: { config: Config }) {
  useEffect(() => {
    console.log('Effect runs once')
  }, [config])

  return <div>Child</div>
}
```

## Common Scenarios

### 1. Configuration Objects

```tsx
function Parent() {
  const [theme, setTheme] = useState('light')

  const config = useMemo(() => ({
    colors: theme === 'light' ? lightColors : darkColors,
    spacing: { sm: 4, md: 8, lg: 16 }
  }), [theme])

  return <Child config={config} />
}
```

### 2. Callback Props

```tsx
function Parent() {
  const [data, setData] = useState([])

  const handlers = useMemo(() => ({
    onEdit: (id: string) => console.log('Edit', id),
    onDelete: (id: string) => console.log('Delete', id)
  }), [])

  return <List items={data} handlers={handlers} />
}
```

### 3. Style Objects

```tsx
function Component({ active }: { active: boolean }) {
  const style = useMemo(() => ({
    backgroundColor: active ? 'blue' : 'gray',
    padding: '10px',
    borderRadius: '4px'
  }), [active])

  return <div style={style}>Content</div>
}
```

### 4. Form Values

```tsx
function Form({ initialValues }: { initialValues: FormValues }) {
  const [values, setValues] = useState(initialValues)

  const formData = useMemo(() => ({
    values,
    errors: validate(values),
    touched: {}
  }), [values])

  return <FormFields data={formData} />
}
```

### 5. Context Values

```tsx
function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  const contextValue = useMemo(() => ({
    user,
    theme,
    setUser,
    setTheme
  }), [user, theme])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}
```

### 6. Props for memo Components

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const options = useMemo(() => ({
    threshold: 0.5,
    rootMargin: '10px'
  }), [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <IntersectionObserver options={options} />
    </>
  )
}

const IntersectionObserver = memo(function IntersectionObserver({ options }: { options: Options }) {
  useEffect(() => {
    const observer = new IntersectionObserver(callback, options)
    return () => observer.disconnect()
  }, [options])

  return <div>Observer</div>
})
```

## Common Mistakes

### Mistake 1: Creating Objects in Render

```tsx
// DON'T - New object on every render
function Parent() {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child config={{ threshold: 0.5 }} />
    </>
  )
}

// DO - Use useMemo
function Parent() {
  const [count, setCount] = useState(0)

  const config = useMemo(() => ({ threshold: 0.5 }), [])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child config={config} />
    </>
  )
}
```

### Mistake 2: Unstable Array Dependencies

```tsx
// DON'T - Array changes on every render
function Parent() {
  const [count, setCount] = useState(0)

  const config = useMemo(() => ({
    items: [1, 2, 3]
  }), [])

  return <Child config={config} />
}

// DO - Stable array
function Parent() {
  const [count, setCount] = useState(0)

  const config = useMemo(() => ({
    items: [1, 2, 3] as const
  }), [])

  return <Child config={config} />
}
```

### Mistake 3: Over-Memoizing

```tsx
// DON'T - Unnecessary useMemo
function Component() {
  const style = useMemo(() => ({
    padding: '10px'
  }), [])

  return <div style={style}>Content</div>
}

// DO - Direct object
function Component() {
  return <div style={{ padding: '10px' }}>Content</div>
}
```

## Advanced Patterns

### 1. Conditional Object Properties

```tsx
function Component({ showExtra }: { showExtra: boolean }) {
  const config = useMemo(() => {
    const base = {
      threshold: 0.5,
      rootMargin: '10px'
    }

    return showExtra
      ? { ...base, extra: true }
      : base
  }, [showExtra])

  return <Child config={config} />
}
```

### 2. Merging Multiple Sources

```tsx
function Component({ userConfig, defaultConfig }: { userConfig: Config; defaultConfig: Config }) {
  const mergedConfig = useMemo(() => ({
    ...defaultConfig,
    ...userConfig
  }), [userConfig, defaultConfig])

  return <Child config={mergedConfig} />
}
```

### 3. Dynamic Object Keys

```tsx
function Component({ items }: { items: Item[] }) {
  const itemsMap = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {} as Record<string, Item>)
  }, [items])

  return <Lookup map={itemsMap} />
}
```

## Key Takeaways

- Use useMemo to maintain stable object references
- Prevents unnecessary re-renders in child components
- Essential for props passed to memo components
- Important for useEffect dependencies
- Don't over-memoize simple objects
- Measure performance before optimizing
- Stable references are key for React's reconciliation
