---
name: context-performance-optimization
description: Optimize context performance by splitting contexts and memoizing values.
---

# Context Performance

Optimize context performance by splitting contexts and memoizing values to prevent unnecessary re-renders.

## The Problem

```tsx
// DON'T - Single large context causes all consumers to re-render
const AppContext = createContext<{
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
  settings: Settings
}>({
  user: null,
  theme: 'light',
  notifications: [],
  settings: {}
})

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<Settings>({})

  const value = { user, theme, notifications, settings }

  return (
    <AppContext.Provider value={value}>
      <Header />
      <Notifications />
      <Settings />
    </AppContext.Provider>
  )
}

function Header() {
  const { theme } = useContext(AppContext)
  return <header className={theme}>Header</header>
}

function Notifications() {
  const { notifications } = useContext(AppContext)
  return <div>{notifications.length} notifications</div>
}

function Settings() {
  const { settings } = useContext(AppContext)
  return <div>Settings</div>
}
```

When theme changes, all three components re-render even though only Header uses theme.

## The Solution

```tsx
// DO - Split into multiple contexts
const ThemeContext = createContext<'light' | 'dark'>('light')
const UserContext = createContext<User | null>(null)
const NotificationsContext = createContext<Notification[]>([])
const SettingsContext = createContext<Settings>({})

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<Settings>({})

  return (
    <ThemeContext.Provider value={theme}>
      <UserContext.Provider value={user}>
        <NotificationsContext.Provider value={notifications}>
          <SettingsContext.Provider value={settings}>
            <Header />
            <Notifications />
            <Settings />
          </SettingsContext.Provider>
        </NotificationsContext.Provider>
      </UserContext.Provider>
    </ThemeContext.Provider>
  )
}

function Header() {
  const theme = useContext(ThemeContext)
  return <header className={theme}>Header</header>
}

function Notifications() {
  const notifications = useContext(NotificationsContext)
  return <div>{notifications.length} notifications</div>
}

function Settings() {
  const settings = useContext(SettingsContext)
  return <div>Settings</div>
}
```

Now only the components that use the changed context re-render.

## Common Patterns

### 1. Splitting Context by Domain

```tsx
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const DataContext = createContext<DataContextValue | undefined>(undefined)

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <Header />
          <Main />
          <Footer />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function Header() {
  const { theme } = useTheme()
  return <header className={theme}>Header</header>
}

function Main() {
  const { user } = useAuth()
  const { data } = useData()
  return <main>{user ? data : 'Login'}</main>
}
```

### 2. Memoizing Context Values

```tsx
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const value = useMemo(() => ({
    theme,
    setTheme
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 3. Using useReducer for Complex State

```tsx
interface State {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
}

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }

function reducer(state: State, action: Action): State {
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

function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    theme: 'light',
    notifications: []
  })

  const value = useMemo(() => ({ state, dispatch }), [state])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
```

### 4. Selective Context Consumption

```tsx
const DataContext = createContext<Data[]>([])

function useData() {
  const data = useContext(DataContext)

  const active = useMemo(() => data.filter(item => item.active), [data])
  const inactive = useMemo(() => data.filter(item => !item.active), [data])

  return { data, active, inactive }
}

function ActiveList() {
  const { active } = useData()
  return <ul>{active.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

function InactiveList() {
  const { inactive } = useData()
  return <ul>{inactive.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
```

### 5. Context with Memoized Selectors

```tsx
const DataContext = createContext<Data[]>([])

function useDataSelector<T>(selector: (data: Data[]) => T): T {
  const data = useContext(DataContext)
  return useMemo(() => selector(data), [data, selector])
}

function ActiveList() {
  const active = useDataSelector(data => data.filter(item => item.active))
  return <ul>{active.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

function InactiveList() {
  const inactive = useDataSelector(data => data.filter(item => !item.active))
  return <ul>{inactive.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
```

### 6. Lazy Context Initialization

```tsx
const DataContext = createContext<Data[] | null>(null)

function DataProvider({ children, fetchData }: { children: ReactNode; fetchData: () => Promise<Data[]> }) {
  const [data, setData] = useState<Data[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false))
  }, [fetchData])

  if (loading) return <div>Loading...</div>

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  )
}
```

## Common Mistakes

### Mistake 1: Single Large Context

```tsx
// DON'T - Everything in one context
const AppContext = createContext({
  theme: 'light',
  user: null,
  notifications: [],
  settings: {}
})

// DO - Split into multiple contexts
const ThemeContext = createContext({ theme: 'light' })
const UserContext = createContext({ user: null })
const NotificationsContext = createContext({ notifications: [] })
```

### Mistake 2: Not Memoizing Context Value

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

// DO - Memoize value
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

### Mistake 3: Context Value Changes Too Often

```tsx
// DON'T - Context changes on every render
function App() {
  const [items, setItems] = useState([])
  const value = { items, setItems }
  return <DataContext.Provider value={value}><Child /></DataContext.Provider>
}

// DO - Memoize value
function App() {
  const [items, setItems] = useState([])
  const value = useMemo(() => ({ items, setItems }), [items])
  return <DataContext.Provider value={value}><Child /></DataContext.Provider>
}
```

## Performance Tips

### 1. Use Context Only When Necessary

```tsx
// DO - Use props for simple cases
function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick}>{children}</button>
}

// Use Context for deeply nested components
function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <DeeplyNestedComponent />
    </ThemeContext.Provider>
  )
}
```

### 2. Split Context by Update Frequency

```tsx
// DO - Separate frequently updated values
const UserContext = createContext<User | null>(null)
const ThemeContext = createContext<'light' | 'dark'>('light')
const NotificationsContext = createContext<Notification[]>([])
```

### 3. Use Composition for Static Values

```tsx
// DO - Use composition for static values
function App() {
  return (
    <StaticValue value="static">
      <DynamicContext>
        <Component />
      </DynamicContext>
    </StaticValue>
  )
}
```

## Key Takeaways

- Split large contexts into smaller, focused ones
- Memoize context values with useMemo
- Use useReducer for complex state management
- Create custom hooks for context access
- Use selectors to derive values from context
- Lazy initialize context when possible
- Use context only when prop drilling is problematic
- Consider composition for static values
