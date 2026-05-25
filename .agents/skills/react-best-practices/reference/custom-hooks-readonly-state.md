---
name: custom-hooks-readonly-state
description: Return read-only state from custom hooks to prevent external mutations.
---

# Custom Hooks Read-Only State

Return read-only state from custom hooks to prevent external mutations and maintain encapsulation.

## The Problem

```tsx
// DON'T - Exposing mutable state
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}

function Component() {
  const { count, setCount } = useCounter()

  const handleClick = () => {
    count++  // Direct mutation - breaks reactivity!
    setCount(count)
  }

  return <button onClick={handleClick}>{count}</button>
}
```

## The Solution

```tsx
// DO - Return read-only state and controlled updater
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])

  return { count, increment, decrement, reset }
}

function Component() {
  const { count, increment } = useCounter()

  return <button onClick={increment}>{count}</button>
}
```

## Common Patterns

### 1. Counter with Controlled Updates

```tsx
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(initialValue), [initialValue])
  const setValue = useCallback((value: number) => setCount(value), [])

  return { count, increment, decrement, reset, setValue }
}

function Component() {
  const { count, increment, decrement, reset } = useCounter(0)

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

### 2. Toggle with Read-Only State

```tsx
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return { value, toggle, setTrue, setFalse }
}

function Component() {
  const { value, toggle } = useToggle(false)

  return <button onClick={toggle}>{value ? 'ON' : 'OFF'}</button>
}
```

### 3. Array with Read-Only Operations

```tsx
function useArray<T>(initialArray: T[] = []) {
  const [array, setArray] = useState<T[]>(initialArray)

  const push = useCallback((item: T) => {
    setArray(prev => [...prev, item])
  }, [])

  const remove = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [])

  const update = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((v, i) => i === index ? item : v))
  }, [])

  const clear = useCallback(() => setArray([]), [])

  return { array, push, remove, update, clear }
}

function Component() {
  const { array, push, remove } = useArray<string>(['Item 1', 'Item 2'])

  return (
    <div>
      <button onClick={() => push('New Item')}>Add</button>
      <ul>
        {array.map((item, index) => (
          <li key={index}>
            {item}
            <button onClick={() => remove(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 4. Object with Read-Only State

```tsx
function useObject<T extends object>(initialObject: T) {
  const [obj, setObj] = useState<T>(initialObject)

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setObj(prev => ({ ...prev, [key]: value }))
  }, [])

  const merge = useCallback((updates: Partial<T>) => {
    setObj(prev => ({ ...prev, ...updates }))
  }, [])

  const reset = useCallback(() => setObj(initialObject), [initialObject])

  return { obj, update, merge, reset }
}

function Component() {
  const { obj, update, merge } = useObject({ name: '', age: 0 })

  return (
    <div>
      <input
        value={obj.name}
        onChange={e => update('name', e.target.value)}
      />
      <input
        type="number"
        value={obj.age}
        onChange={e => update('age', parseInt(e.target.value))}
      />
      <button onClick={() => merge({ name: 'John', age: 25 })}>
        Merge
      </button>
    </div>
  )
}
```

### 5. Form with Read-Only State

```tsx
function useForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = useCallback((name: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({ ...prev, [name]: e.target.value }))
  }, [])

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const { [name]: removed, ...rest } = prev
      return rest
    })
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0

  return { values, errors, handleChange, setError, clearError, reset, isValid }
}

function Component() {
  const form = useForm({ name: '', email: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.isValid) {
      console.log('Submit:', form.values)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form.values.name}
        onChange={form.handleChange('name')}
      />
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange('email')}
      />
      <button type="submit" disabled={!form.isValid}>
        Submit
      </button>
    </form>
  )
}
```

### 6. Fetch with Read-Only State

```tsx
function useFetch(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [url])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

function Component() {
  const { data, loading, error, refetch } = useFetch('/api/data')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={refetch}>Refetch</button>
    </div>
  )
}
```

### 7. Local Storage with Read-Only State

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    localStorage.setItem(key, JSON.stringify(newValue))
  }, [key])

  const removeValue = useCallback(() => {
    setValue(initialValue)
    localStorage.removeItem(key)
  }, [key, initialValue])

  return { value, updateValue, removeValue }
}

function Component() {
  const { value, updateValue, removeValue } = useLocalStorage('theme', 'light')

  return (
    <div>
      <button onClick={() => updateValue('light')}>Light</button>
      <button onClick={() => updateValue('dark')}>Dark</button>
      <button onClick={removeValue}>Reset</button>
      <p>Current theme: {value}</p>
    </div>
  )
}
```

### 8. Debounced Value with Read-Only State

```tsx
function useDebounce<T>(value: T, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function Component() {
  const [inputValue, setInputValue] = useState('')
  const debouncedValue = useDebounce(inputValue, 500)

  return (
    <div>
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      <p>Debounced: {debouncedValue}</p>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Exposing setState Directly

```tsx
// DON'T - Exposing setState
function useCounter() {
  const [count, setCount] = useState(0)
  return { count, setCount }
}

// DO - Exposing controlled methods
function useCounter() {
  const [count, setCount] = useState(0)
  const increment = () => setCount(c => c + 1)
  return { count, increment }
}
```

### Mistake 2. Allowing Direct Mutation

```tsx
// DON'T - Allowing mutation
function useArray() {
  const [array, setArray] = useState([])
  return { array, setArray }
}

// DO - Providing controlled methods
function useArray() {
  const [array, setArray] = useState([])
  const push = (item) => setArray(prev => [...prev, item])
  return { array, push }
}
```

### Mistake 3. Not Encapsulating Logic

```tsx
// DON'T - Exposing raw state
function useForm() {
  const [values, setValues] = useState({})
  return { values, setValues }
}

// DO - Encapsulating logic
function useForm() {
  const [values, setValues] = useState({})
  const handleChange = (name) => (e) => {
    setValues(prev => ({ ...prev, [name]: e.target.value }))
  }
  return { values, handleChange }
}
```

## Key Takeaways

- Return read-only state from custom hooks
- Provide controlled methods for state updates
- Encapsulate state management logic
- Prevent external mutations
- Use useCallback for stable method references
- Provide clear, semantic methods
- Maintain single responsibility
- Keep hooks focused and reusable
