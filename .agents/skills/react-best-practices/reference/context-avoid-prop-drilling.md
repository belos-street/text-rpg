---
name: context-avoid-prop-drilling
description: Use Context API to avoid passing props through many component layers.
---

# Avoid Prop Drilling

Use Context API to avoid passing props through many component layers.

## The Problem

```tsx
// DON'T - Prop drilling through multiple levels
function App() {
  const [theme, setTheme] = useState('light')

  return (
    <Header theme={theme} setTheme={setTheme} />
  )
}

function Header({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return (
    <nav>
      <Logo theme={theme} />
      <Menu theme={theme} setTheme={setTheme} />
    </nav>
  )
}

function Menu({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return (
    <ul>
      <li><Home theme={theme} /></li>
      <li><Settings theme={theme} setTheme={setTheme} /></li>
    </ul>
  )
}

function Settings({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  )
}
```

## The Solution

```tsx
// DO - Use Context
const ThemeContext = createContext<{
  theme: string
  setTheme: (theme: string) => void
}>({
  theme: 'light',
  setTheme: () => {}
})

function App() {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Header />
    </ThemeContext.Provider>
  )
}

function Header() {
  return (
    <nav>
      <Logo />
      <Menu />
    </nav>
  )
}

function Menu() {
  return (
    <ul>
      <li><Home /></li>
      <li><Settings /></li>
    </ul>
  )
}

function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  )
}
```

## Common Patterns

### 1. Basic Context Setup

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### 2. Multiple Contexts

```tsx
const ThemeContext = createContext<string>('light')
const UserContext = createContext<User | null>(null)

function App() {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState<User | null>(null)

  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <Header />
        <Main />
      </UserContext.Provider>
    </ThemeContext.Provider>
  )
}

function Header() {
  const theme = useContext(ThemeContext)
  return <header className={theme}>Header</header>
}

function Main() {
  const user = useContext(UserContext)
  return <main>{user ? `Welcome ${user.name}` : 'Please login'}</main>
}
```

### 3. Context with Complex State

```tsx
interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    user: null,
    theme: 'light',
    notifications: []
  })

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

### 4. Context with Selectors

```tsx
const DataContext = createContext<Data[]>([])

function useData() {
  const data = useContext(DataContext)

  return {
    all: data,
    active: data.filter(item => item.active),
    inactive: data.filter(item => !item.active),
    byId: (id: string) => data.find(item => item.id === id)
  }
}
```

### 5. Context with Default Values

```tsx
const ConfigContext = createContext({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
})

function App() {
  return (
    <ConfigContext.Provider value={{ apiUrl: '/api', timeout: 10000, retries: 5 }}>
      <Component />
    </ConfigContext.Provider>
  )
}

function Component() {
  const config = useContext(ConfigContext)
  console.log(config.apiUrl)
  return <div>Component</div>
}
```

### 6. Conditional Context

```tsx
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser(token).then(setUser)
      setIsAuthenticated(true)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
```

## Common Mistakes

### Mistake 1: Prop Drilling

```tsx
// DON'T - Passing props through multiple levels
function App() {
  const [theme, setTheme] = useState('light')
  return <Header theme={theme} setTheme={setTheme} />
}

function Header({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return <Nav theme={theme} setTheme={setTheme} />
}

function Nav({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  return <Menu theme={theme} setTheme={setTheme} />
}

// DO - Use Context
function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeProvider value={{ theme, setTheme }}>
      <Header />
    </ThemeProvider>
  )
}
```

### Mistake 2: Too Much Context

```tsx
// DON'T - Everything in one context
const AppContext = createContext({
  theme: 'light',
  user: null,
  settings: {},
  notifications: [],
  // ... many more values
})

// DO - Split into multiple contexts
const ThemeContext = createContext({ theme: 'light' })
const UserContext = createContext({ user: null })
const SettingsContext = createContext({ settings: {} })
```

### Mistake 3: Context Value Changes on Every Render

```tsx
// DON'T - New object on every render
function App() {
  const [theme, setTheme] = useState('light')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Component />
    </ThemeContext.Provider>
  )
}

// DO - Use useMemo
function App() {
  const [theme, setTheme] = useState('light')

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      <Component />
    </ThemeContext.Provider>
  )
}
```

## Key Takeaways

- Use Context to avoid prop drilling
- Create custom hooks for accessing context
- Use useMemo to stabilize context values
- Split large contexts into smaller, focused ones
- Provide default values for optional context
- Use TypeScript for type safety
- Consider context only when prop drilling becomes problematic
