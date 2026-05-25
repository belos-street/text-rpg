---
name: custom-hooks-composition
description: Compose multiple hooks together to build complex functionality from simpler pieces.
---

# Custom Hooks Composition

Compose multiple hooks together to build complex functionality from simpler pieces.

## Basic Composition

```tsx
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  return { count, increment, decrement }
}

function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue)
  const toggle = () => setValue(v => !v)
  return [value, toggle] as const
}

function useCounterWithToggle(initialValue: number = 0) {
  const counter = useCounter(initialValue)
  const [isPaused, togglePaused] = useToggle(false)

  const increment = useCallback(() => {
    if (!isPaused) counter.increment()
  }, [isPaused, counter.increment])

  return { ...counter, isPaused, togglePaused, increment }
}
```

## Common Patterns

### 1. Fetching with Loading State

```tsx
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

function useFetchWithRetry(url: string, maxRetries: number = 3) {
  const [retries, setRetries] = useState(0)
  const fetch = useFetch(url)

  useEffect(() => {
    if (fetch.error && retries < maxRetries) {
      setTimeout(() => setRetries(r => r + 1), 1000 * retries)
    }
  }, [fetch.error, retries, maxRetries])

  return { ...fetch, retries }
}
```

### 2. Form with Validation

```tsx
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (name: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [name]: e.target.value })
  }

  const reset = () => setValues(initialValues)

  return { values, errors, handleChange, reset }
}

function useValidation<T>(values: T, rules: ValidationRules<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const newErrors: Record<string, string> = {}
    Object.entries(rules).forEach(([field, rule]) => {
      const error = rule(values[field as keyof T])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
  }, [values, rules])

  return errors
}

function ValidatedForm<T>(initialValues: T, rules: ValidationRules<T>) {
  const form = useForm(initialValues)
  const errors = useValidation(form.values, rules)

  return { ...form, errors }
}
```

### 3. Local Storage with Sync

```tsx
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

function useLocalStorageSync<T>(key: string, initialValue: T) {
  const [value, setValue] = useLocalStorage(key, initialValue)

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setValue(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, setValue])

  return [value, setValue] as const
}
```

### 4. Debounced Input

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

function useDebouncedInput(initialValue: string = '', delay: number = 500) {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, delay)

  return { value, setValue, debouncedValue }
}
```

### 5. Window Size with Debounce

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

function useDebouncedWindowSize(delay: number = 200) {
  const size = useWindowSize()
  const debouncedSize = useDebounce(size, delay)

  return debouncedSize
}
```

### 6. Authentication with Persistence

```tsx
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser(token).then(setUser).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password)
    localStorage.setItem('token', token)
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  return { user, loading, login, logout }
}

function useAuthWithRefresh() {
  const auth = useAuth()
  const [token, setToken] = useLocalStorage('token', '')

  useEffect(() => {
    if (token) {
      const interval = setInterval(async () => {
        const newToken = await api.refreshToken(token)
        setToken(newToken)
      }, 30 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [token, setToken])

  return auth
}
```

### 7. Pagination with Filters

```tsx
function usePagination(initialPage: number = 1, initialPageSize: number = 10) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const nextPage = () => setPage(p => p + 1)
  const prevPage = () => setPage(p => Math.max(1, p - 1))
  const goToPage = (p: number) => setPage(Math.max(1, p))

  return { page, pageSize, setPage, setPageSize, nextPage, prevPage, goToPage }
}

function useFilters<T>(initialFilters: T) {
  const [filters, setFilters] = useState(initialFilters)

  const updateFilter = <K extends keyof T>(key: K, value: T[K]) => {
    setFilters({ ...filters, [key]: value })
  }

  const resetFilters = () => setFilters(initialFilters)

  return { filters, updateFilter, resetFilters }
}

function usePaginatedData<T>(initialFilters: T) {
  const pagination = usePagination()
  const filters = useFilters(initialFilters)

  const { data, loading } = useFetch(
    `/api/data?page=${pagination.page}&pageSize=${pagination.pageSize}&filters=${JSON.stringify(filters.filters)}`
  )

  return { data, loading, pagination, filters }
}
```

### 8. Search with History

```tsx
function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    search(query).then(setResults)
  }, [query])

  return { query, setQuery, results }
}

function useSearchHistory(maxItems: number = 10) {
  const [history, setHistory] = useLocalStorage<string[]>('search-history', [])

  const addToHistory = useCallback((query: string) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h !== query)
      return [query, ...filtered].slice(0, maxItems)
    })
  }, [setHistory, maxItems])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  return { history, addToHistory, clearHistory }
}

function useSearchWithHistory() {
  const search = useSearch()
  const history = useSearchHistory()

  const handleSearch = useCallback((query: string) => {
    search.setQuery(query)
    if (query.length >= 2) {
      history.addToHistory(query)
    }
  }, [search, history])

  return { ...search, history, handleSearch }
}
```

## Common Mistakes

### Mistake 1. Not Composing Hooks

```tsx
// DON'T - Duplicating logic
function useComplexFeature() {
  const [count, setCount] = useState(0)
  const [paused, setPaused] = useState(false)
  const increment = () => {
    if (!paused) setCount(c => c + 1)
  }
  return { count, paused, setPaused, increment }
}

// DO - Compose hooks
function useComplexFeature() {
  const counter = useCounter(0)
  const [paused, setPaused] = useToggle(false)

  const increment = useCallback(() => {
    if (!paused) counter.increment()
  }, [paused, counter.increment])

  return { ...counter, paused, setPaused, increment }
}
```

### Mistake 2. Tight Coupling

```tsx
// DON'T - Tightly coupled
function useFeatureA() {
  const [value, setValue] = useState('')
  return { value, setValue }
}

function useFeatureB() {
  const featureA = useFeatureA()
  return { ...featureA, extra: 'data' }
}

// DO - Loosely coupled
function useFeatureA() {
  const [value, setValue] = useState('')
  return { value, setValue }
}

function useFeatureB(initialValue: string) {
  const [value, setValue] = useState(initialValue)
  const extra = 'data'
  return { value, setValue, extra }
}
```

### Mistake 3. Over-Composing

```tsx
// DON'T - Too many layers
function useA() { }
function useB() { return useA() }
function useC() { return useB() }
function useD() { return useC() }

// DO - Reasonable composition
function useA() { }
function useB() { return useA() }
function useC() { return useB() }
```

## Key Takeaways

- Compose hooks to build complex functionality
- Keep hooks focused and single-purpose
- Reuse existing hooks instead of duplicating logic
- Use useCallback to memoize composed functions
- Keep dependencies minimal
- Avoid tight coupling between hooks
- Don't over-compose - keep it readable
- Test hooks in isolation
