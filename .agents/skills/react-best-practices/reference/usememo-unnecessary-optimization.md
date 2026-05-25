---
name: usememo-unnecessary-optimization
description: Don't use useMemo prematurely. Only use it for expensive computations or when you need referential equality.
---

# Unnecessary useMemo

Don't use useMemo prematurely. Only use it for expensive computations or when you need referential equality.

## The Problem

```tsx
// DON'T - Unnecessary useMemo
function Counter() {
  const [count, setCount] = useState(0)

  const doubled = useMemo(() => count * 2, [count])

  return <div>{doubled}</div>
}
```

Simple calculations like `count * 2` are too fast to benefit from memoization.

## When to Use useMemo

### 1. Expensive Computations

```tsx
function DataProcessor({ items }: { items: Item[] }) {
  const processed = useMemo(() => {
    console.log('Processing...')
    return items
      .filter(item => item.active)
      .map(item => ({
        ...item,
        calculated: complexCalculation(item)
      }))
      .sort((a, b) => a.calculated - b.calculated)
  }, [items])

  return <div>{processed.length} items</div>
}
```

### 2. Referential Equality

```tsx
function Parent() {
  const [count, setCount] = useState(0)

  const config = useMemo(() => ({
    threshold: 0.5,
    rootMargin: '10px'
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
    const observer = new IntersectionObserver(callback, config)
    return () => observer.disconnect()
  }, [config])

  return <div>Child</div>
}
```

### 3. Preventing Unnecessary Re-renders

```tsx
function Parent() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState([])

  const expensiveValue = useMemo(() => {
    return heavyComputation(data)
  }, [data])

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      <Child value={expensiveValue} />
    </>
  )
}

const Child = memo(function Child({ value }: { value: any }) {
  console.log('Child rendered')
  return <div>{value}</div>
})
```

### 4. Complex Derived State

```tsx
function FilteredList({ items, filter }: { items: Item[]; filter: string }) {
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter])

  return (
    <ul>
      {filteredItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  )
}
```

## When NOT to Use useMemo

### 1. Simple Calculations

```tsx
// DON'T - Too simple to memoize
function Counter() {
  const [count, setCount] = useState(0)

  const doubled = useMemo(() => count * 2, [count])

  return <div>{doubled}</div>
}

// DO - Direct calculation
function Counter() {
  const [count, setCount] = useState(0)

  return <div>{count * 2}</div>
}
```

### 2. Object Creation Without Dependencies

```tsx
// DON'T - useMemo with empty deps
function Component() {
  const config = useMemo(() => ({
    threshold: 0.5
  }), [])

  return <Child config={config} />
}

// DO - Use const
function Component() {
  const config = { threshold: 0.5 }

  return <Child config={config} />
}
```

### 3. When Dependencies Change Frequently

```tsx
// DON'T - useMemo with frequently changing deps
function Component({ items }: { items: Item[] }) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0)
  }, [items])

  return <div>{total}</div>
}

// DO - Direct calculation
function Component({ items }: { items: Item[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return <div>{total}</div>
}
```

## Performance Considerations

### useMemo Has Overhead

```tsx
// useMemo has its own cost
function Component({ data }: { data: Data[] }) {
  const processed = useMemo(() => {
    return data.filter(x => x.active)
  }, [data])

  // If data changes often, useMemo overhead may exceed benefit
}
```

### Measure Before Optimizing

```tsx
function Component({ items }: { items: Item[] }) {
  const start = performance.now()

  const result = useMemo(() => {
    return expensiveOperation(items)
  }, [items])

  console.log(`Computation took ${performance.now() - start}ms`)

  return <div>{result}</div>
}
```

## Common Patterns

### 1. Memoizing Filtered Lists

```tsx
function SearchResults({ items, query }: { items: Item[]; query: string }) {
  const results = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [items, query])

  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
}
```

### 2. Memoizing Sorted Lists

```tsx
function SortedList({ items, sortBy }: { items: Item[]; sortBy: string }) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1
      if (a[sortBy] > b[sortBy]) return 1
      return 0
    })
  }, [items, sortBy])

  return <ul>{sorted.map(s => <li key={s.id}>{s.name}</li>)}</ul>
}
```

### 3. Memoizing Complex Objects

```tsx
function Chart({ data }: { data: DataPoint[] }) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: 'blue'
    }]
  }), [data])

  return <ChartComponent data={chartData} />
}
```

## Key Takeaways

- Don't use useMemo prematurely - measure first
- Use useMemo for expensive computations
- Use useMemo when you need referential equality
- Simple calculations don't need memoization
- useMemo has its own overhead
- Only optimize when you've identified a performance issue
- Prefer readability over premature optimization
