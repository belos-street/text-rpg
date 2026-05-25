---
name: custom-hooks-naming-convention
description: Always start custom hook names with 'use' prefix followed by camelCase.
---

# Custom Hooks Naming Convention

Always start custom hook names with 'use' prefix followed by camelCase.

## The Convention

```tsx
// DO - use prefix + camelCase
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  return { count, increment, decrement }
}

function useFetch(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return { data, loading, error }
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
```

## Common Patterns

### 1. State Hooks

```tsx
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle, setValue] as const
}

function useBoolean(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  const toggle = useCallback(() => setValue(v => !v), [])
  return { value, setValue, setTrue, setFalse, toggle }
}
```

### 2. Data Fetching Hooks

```tsx
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(url)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}

function useAsync<T>(asyncFunction: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      try {
        const result = await asyncFunction()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => { cancelled = true }
  }, deps)

  return { data, loading, error }
}
```

### 3. DOM Hooks

```tsx
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

function useScroll() {
  const [scroll, setScroll] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setScroll({
        x: window.scrollX,
        y: window.scrollY
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scroll
}
```

### 4. Event Hooks

```tsx
function useKeyPress(key: string) {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(true)
    }

    const handleUp = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(false)
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)

    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [key])

  return pressed
}

function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback()
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [ref, callback])
}
```

### 5. Lifecycle Hooks

```tsx
function useMount(callback: () => void) {
  useEffect(callback, [])
}

function useUnmount(callback: () => void) {
  useEffect(() => callback, [])
}

function useMountAndUnmount(mount: () => void, unmount: () => void) {
  useEffect(() => {
    mount()
    return unmount
  }, [])
}
```

### 6. Form Hooks

```tsx
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (name: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [name]: e.target.value })
  }

  const handleSubmit = (onSubmit: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const reset = () => setValues(initialValues)

  return { values, errors, handleChange, handleSubmit, reset }
}
```

## Common Mistakes

### Mistake 1. No 'use' Prefix

```tsx
// DON'T - No use prefix
function counter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}

// DO - Use use prefix
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}
```

### Mistake 2. Wrong Case

```tsx
// DON'T - Wrong case
function UseCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}

function use_counter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}

// DO - Correct case
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count, setCount }
}
```

### Mistake 3. Unclear Names

```tsx
// DON'T - Unclear name
function useData(url: string) {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(url).then(setData) }, [url])
  return data
}

// DO - Descriptive name
function useFetch(url: string) {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(url).then(setData) }, [url])
  return data
}
```

### Mistake 4. Too Generic

```tsx
// DON'T - Too generic
function useHook(url: string) {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(url).then(setData) }, [url])
  return data
}

// DO - Descriptive name
function useFetch(url: string) {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(url).then(setData) }, [url])
  return data
}
```

## Naming Guidelines

### 1. Use Verb + Noun

```tsx
function useFetch() { }
function useLocalStorage() { }
function useWindowSize() { }
function useKeyPress() { }
```

### 2. Be Specific

```tsx
function useFetch() { }
function useFetchUser() { }
function useFetchPosts() { }
```

### 3. Use Consistent Patterns

```tsx
function useToggle() { }
function useBoolean() { }
function useCounter() { }
function useArray() { }
```

### 4. Avoid Abbreviations

```tsx
// DON'T - Abbreviations
function useLS(key: string) { }
function useWinSize() { }
function useKP(key: string) { }

// DO - Full names
function useLocalStorage(key: string) { }
function useWindowSize() { }
function useKeyPress(key: string) { }
```

## Key Takeaways

- Always start with 'use' prefix
- Use camelCase after 'use' prefix
- Be descriptive and specific
- Avoid abbreviations
- Use consistent naming patterns
- Follow React's conventions
- Use verb + noun pattern
- Make names self-explanatory
