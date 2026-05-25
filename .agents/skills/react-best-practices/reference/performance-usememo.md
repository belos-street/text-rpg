---
name: performance-usememo
description: Use useMemo to memoize expensive calculations and prevent unnecessary re-computation.
---

# useMemo

Use useMemo to memoize expensive calculations and prevent unnecessary re-computation.

## The Problem

```tsx
// DON'T - Expensive calculation on every render
function Component({ items }: { items: number[] }) {
  const [count, setCount] = useState(0)

  const expensiveValue = items.reduce((sum, item) => {
    for (let i = 0; i < 1000000; i++) {
      sum += item
    }
    return sum
  }, 0)

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <p>Expensive: {expensiveValue}</p>
    </div>
  )
}
// Expensive calculation runs on every count change!
```

## The Solution

```tsx
// DO - Use useMemo to memoize expensive calculation
function Component({ items }: { items: number[] }) {
  const [count, setCount] = useState(0)

  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => {
      for (let i = 0; i < 1000000; i++) {
        sum += item
      }
      return sum
    }, 0)
  }, [items])

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <p>Expensive: {expensiveValue}</p>
    </div>
  )
}
// Expensive calculation only runs when items changes!
```

## Common Patterns

### 1. Basic useMemo

```tsx
function Component({ numbers }: { numbers: number[] }) {
  const sum = useMemo(() => {
    return numbers.reduce((acc, num) => acc + num, 0)
  }, [numbers])

  return <div>Sum: {sum}</div>
}
```

### 2. useMemo with Filtering

```tsx
function Component({ items }: { items: { id: number; active: boolean }[] }) {
  const activeItems = useMemo(() => {
    return items.filter(item => item.active)
  }, [items])

  return (
    <div>
      <p>Active: {activeItems.length}</p>
      <ul>
        {activeItems.map(item => (
          <li key={item.id}>{item.id}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 3. useMemo with Sorting

```tsx
function Component({ items }: { items: { id: number; name: string }[] }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  return (
    <ul>
      {sortedItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

### 4. useMemo with Complex Calculations

```tsx
function Component({ data }: { data: number[] }) {
  const statistics = useMemo(() => {
    const sum = data.reduce((acc, num) => acc + num, 0)
    const avg = sum / data.length
    const min = Math.min(...data)
    const max = Math.max(...data)

    return { sum, avg, min, max }
  }, [data])

  return (
    <div>
      <p>Sum: {statistics.sum}</p>
      <p>Avg: {statistics.avg}</p>
      <p>Min: {statistics.min}</p>
      <p>Max: {statistics.max}</p>
    </div>
  )
}
```

### 5. useMemo with Object Creation

```tsx
function Component({ userId }: { userId: string }) {
  const config = useMemo(() => ({
    apiUrl: `/api/users/${userId}`,
    timeout: 5000,
    retries: 3
  }), [userId])

  useEffect(() => {
    fetch(config.apiUrl)
  }, [config.apiUrl])

  return <div>Component</div>
}
```

### 6. useMemo with Array Creation

```tsx
function Component({ items }: { items: string[] }) {
  const options = useMemo(() => {
    return items.map(item => ({ label: item, value: item }))
  }, [items])

  return (
    <select>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
```

### 7. useMemo with Derived State

```tsx
function Component({ todos }: { todos: { id: number; completed: boolean }[] }) {
  const stats = useMemo(() => {
    const total = todos.length
    const completed = todos.filter(t => t.completed).length
    const pending = total - completed
    const percentage = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, pending, percentage }
  }, [todos])

  return (
    <div>
      <p>Total: {stats.total}</p>
      <p>Completed: {stats.completed}</p>
      <p>Pending: {stats.pending}</p>
      <p>Progress: {stats.percentage.toFixed(1)}%</p>
    </div>
  )
}
```

### 8. useMemo with Multiple Dependencies

```tsx
function Component({
  items,
  filter,
  sortBy
}: {
  items: { id: number; name: string; category: string }[]
  filter: string
  sortBy: 'name' | 'category'
}) {
  const filteredAndSorted = useMemo(() => {
    let result = items

    if (filter) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
      )
    }

    result = [...result].sort((a, b) =>
      a[sortBy].localeCompare(b[sortBy])
    )

    return result
  }, [items, filter, sortBy])

  return (
    <ul>
      {filteredAndSorted.map(item => (
        <li key={item.id}>
          {item.name} ({item.category})
        </li>
      ))}
    </ul>
  )
}
```

## Common Mistakes

### Mistake 1. Using useMemo for Simple Values

```tsx
// DON'T - Using useMemo for simple values
function Component() {
  const [count, setCount] = useState(0)

  const doubled = useMemo(() => count * 2, [count])

  return <div>Doubled: {doubled}</div>
}

// DO - Direct calculation for simple values
function Component() {
  const [count, setCount] = useState(0)

  return <div>Doubled: {count * 2}</div>
}
```

### Mistake 2. Missing Dependencies

```tsx
// DON'T - Missing dependencies
function Component({ items }: { items: number[] }) {
  const [multiplier, setMultiplier] = useState(2)

  const multiplied = useMemo(() => {
    return items.map(item => item * multiplier)
  }, [items])

  return (
    <div>
      <button onClick={() => setMultiplier(m => m + 1)}>Multiplier: {multiplier}</button>
      <p>{multiplied.join(', ')}</p>
    </div>
  )
}
// Always uses multiplier = 2!

// DO - Including all dependencies
function Component({ items }: { items: number[] }) {
  const [multiplier, setMultiplier] = useState(2)

  const multiplied = useMemo(() => {
    return items.map(item => item * multiplier)
  }, [items, multiplier])

  return (
    <div>
      <button onClick={() => setMultiplier(m => m + 1)}>Multiplier: {multiplier}</button>
      <p>{multiplied.join(', ')}</p>
    </div>
  )
}
```

### Mistake 3. Overusing useMemo

```tsx
// DON'T - Overusing useMemo
function Component({ name }: { name: string }) {
  const greeting = useMemo(() => `Hello, ${name}!`, [name])
  return <div>{greeting}</div>
}

// DO - Only use for expensive calculations
function Component({ name }: { name: string }) {
  return <div>Hello, {name}!</div>
}
```

## Performance Considerations

### 1. When to Use useMemo

```tsx
// DO - Use for expensive calculations
function Component({ data }: { data: number[] }) {
  const expensiveResult = useMemo(() => {
    return data.reduce((acc, num) => {
      for (let i = 0; i < 1000000; i++) {
        acc += num
      }
      return acc
    }, 0)
  }, [data])

  return <div>{expensiveResult}</div>
}

// DON'T - Don't use for simple operations
function Component({ count }: { count: number }) {
  const doubled = useMemo(() => count * 2, [count])
  return <div>{doubled}</div>
}
```

### 2. useMemo vs Computed Values

```tsx
// DO - Use useMemo for expensive derived state
function Component({ items }: { items: { id: number; value: number }[] }) {
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0)
  }, [items])

  return <div>Total: {total}</div>
}

// DON'T - Don't use useMemo for simple derived state
function Component({ count }: { count: number }) {
  const doubled = useMemo(() => count * 2, [count])
  return <div>{doubled}</div>
}
```

### 3. useMemo with Reference Equality

```tsx
// DO - Use useMemo for stable references
function Component({ items }: { items: string[] }) {
  const options = useMemo(() => {
    return items.map(item => ({ label: item, value: item }))
  }, [items])

  return <Select options={options} />
}

// DON'T - New reference on every render
function Component({ items }: { items: string[] }) {
  const options = items.map(item => ({ label: item, value: item }))
  return <Select options={options} />
}
```

## Key Takeaways

- Use useMemo for expensive calculations
- Memoize derived state
- Include all dependencies
- Don't overuse useMemo
- Profile before optimizing
- Consider the cost of memoization
- Use for stable object/array references
- Use for complex filtering/sorting
