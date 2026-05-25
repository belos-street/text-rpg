---
name: context-default-values
description: Provide default values for context to make it optional and avoid errors.
---

# Context Default Values

Provide default values for context to make it optional and avoid errors when used outside provider.

## The Problem

```tsx
// DON'T - No default value causes errors
const ThemeContext = createContext<string>()

function App() {
  return (
    <Header />
  )
}

function Header() {
  const theme = useContext(ThemeContext)
  return <header className={theme}>Header</header>
  // Error: theme is undefined
}
```

## The Solution

```tsx
// DO - Provide default value
const ThemeContext = createContext<string>('light')

function App() {
  return (
    <Header />
  )
}

function Header() {
  const theme = useContext(ThemeContext)
  return <header className={theme}>Header</header>
  // Works: theme is 'light'
}
```

## Common Patterns

### 1. String Default Value

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  )
}

function Header() {
  const theme = useContext(ThemeContext)
  return <header className={theme}>Header</header>
}
```

### 2. Object Default Value

```tsx
interface Config {
  apiUrl: string
  timeout: number
  retries: number
}

const ConfigContext = createContext<Config>({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
})

function App() {
  const config = useContext(ConfigContext)
  console.log(config.apiUrl)
  return <div>App</div>
}
```

### 3. Function Default Value

```tsx
const ThemeContext = createContext<{
  theme: 'light' | 'dark'
  toggleTheme: () => void
}>({
  theme: 'light',
  toggleTheme: () => console.warn('toggleTheme called outside provider')
})

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Header />
    </ThemeContext.Provider>
  )
}

function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  return (
    <header className={theme}>
      <button onClick={toggleTheme}>Toggle</button>
    </header>
  )
}
```

### 4. Null Default with Validation

```tsx
const UserContext = createContext<User | null>(null)

function useUser() {
  const user = useContext(UserContext)

  if (!user) {
    throw new Error('useUser must be used within UserProvider')
  }

  return user
}

function App() {
  return (
    <UserContext.Provider value={null}>
      <Component />
    </UserContext.Provider>
  )
}

function Component() {
  try {
    const user = useUser()
    return <div>{user.name}</div>
  } catch (error) {
    return <div>Please login</div>
  }
}
```

### 5. Optional Context with Type Guard

```tsx
const ThemeContext = createContext<'light' | 'dark' | null>(null)

function useTheme() {
  const theme = useContext(ThemeContext)

  if (!theme) {
    console.warn('useTheme called outside ThemeProvider, using default')
    return 'light'
  }

  return theme
}

function App() {
  return (
    <Header />
  )
}

function Header() {
  const theme = useTheme()
  return <header className={theme}>Header</header>
}
```

### 6. Default Value with Lazy Initialization

```tsx
const ConfigContext = createContext<Config | null>(null)

function useConfig() {
  const config = useContext(ConfigContext)

  if (!config) {
    return {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    }
  }

  return config
}

function App() {
  const config = useConfig()
  console.log(config.apiUrl)
  return <div>App</div>
}
```

### 7. Context with Factory Function

```tsx
function createContextWithDefault<T>(defaultValue: T) {
  return createContext(defaultValue)
}

const ThemeContext = createContextWithDefault('light')
const UserContext = createContextWithDefault<User | null>(null)
```

## Common Mistakes

### Mistake 1: No Default Value

```tsx
// DON'T - No default value
const ThemeContext = createContext<string>()

function Component() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Content</div>
  // Error: theme is undefined
}

// DO - Provide default value
const ThemeContext = createContext<string>('light')

function Component() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Content</div>
  // Works: theme is 'light'
}
```

### Mistake 2: Incorrect Default Type

```tsx
// DON'T - Wrong default type
const ThemeContext = createContext<string | null>(null)

function Component() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Content</div>
  // Error: theme can be null
}

// DO - Correct default type
const ThemeContext = createContext<string>('light')

function Component() {
  const theme = useContext(ThemeContext)
  return <div className={theme}>Content</div>
  // Works: theme is always string
}
```

### Mistake 3. Mutable Default Value

```tsx
// DON'T - Mutable default value
const DataContext = createContext<string[]>([])

function App() {
  const data = useContext(DataContext)
  data.push('new')  // Affects all consumers!
  return <div>{data.length}</div>
}

// DO - Immutable default value
const DataContext = createContext<string[]>([])

function App() {
  const data = useContext(DataContext)
  const newData = [...data, 'new']  // Create new array
  return <div>{newData.length}</div>
}
```

## Advanced Patterns

### 1. Context with Conditional Default

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

function useTheme() {
  const theme = useContext(ThemeContext)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  return theme || (prefersDark ? 'dark' : 'light')
}
```

### 2. Context with Validation

```tsx
const ConfigContext = createContext<Config | null>(null)

function useConfig() {
  const config = useContext(ConfigContext)

  if (!config) {
    return defaultConfig
  }

  if (!config.apiUrl) {
    console.warn('Missing apiUrl in config, using default')
    return { ...config, apiUrl: defaultConfig.apiUrl }
  }

  return config
}
```

### 3. Context with Fallback

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

function useTheme(fallback: 'light' | 'dark' = 'light') {
  const theme = useContext(ThemeContext)
  return theme || fallback
}

function Component() {
  const theme = useTheme('dark')
  return <div className={theme}>Content</div>
}
```

## Key Takeaways

- Always provide default values for context
- Use meaningful default values that make sense
- Use null as default for optional context
- Validate context usage with custom hooks
- Provide warnings for missing providers
- Use type guards for optional context
- Consider lazy initialization for complex defaults
- Keep default values immutable
