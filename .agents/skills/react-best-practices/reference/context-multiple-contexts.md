---
name: context-multiple-contexts
description: Use multiple contexts for different concerns instead of one large context.
---

# Multiple Contexts

Use multiple contexts for different concerns instead of one large context to improve performance and maintainability.

## The Problem

```tsx
// DON'T - Single large context
const AppContext = createContext<{
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
  settings: Settings
  cart: CartItem[]
  wishlist: Product[]
}>({
  user: null,
  theme: 'light',
  notifications: [],
  settings: {},
  cart: [],
  wishlist: []
})

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])

  const value = {
    user, theme, notifications, settings, cart, wishlist,
    setUser, setTheme, setNotifications, setSettings, setCart, setWishlist
  }

  return (
    <AppContext.Provider value={value}>
      <Header />
      <Main />
      <Footer />
    </AppContext.Provider>
  )
}

function Header() {
  const { user, theme } = useContext(AppContext)
  return <header className={theme}>{user?.name}</header>
}

function Main() {
  const { cart, wishlist } = useContext(AppContext)
  return <main>Cart: {cart.length}, Wishlist: {wishlist.length}</main>
}

function Footer() {
  const { settings } = useContext(AppContext)
  return <footer>{settings.company}</footer>
}
```

When theme changes, all components re-render even though only Header uses theme.

## The Solution

```tsx
// DO - Split into multiple contexts
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const UserContext = createContext<UserContextValue | undefined>(undefined)
const NotificationsContext = createContext<Notification[]>([])
const SettingsContext = createContext<Settings>({})
const CartContext = createContext<CartContextValue | undefined>(undefined)
const WishlistContext = createContext<Product[]>([])

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NotificationsProvider>
          <SettingsProvider>
            <CartProvider>
              <WishlistProvider>
                <Header />
                <Main />
                <Footer />
              </WishlistProvider>
            </CartProvider>
          </SettingsProvider>
        </NotificationsProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

function Header() {
  const { theme } = useTheme()
  const { user } = useUser()
  return <header className={theme}>{user?.name}</header>
}

function Main() {
  const { cart } = useCart()
  const { wishlist } = useWishlist()
  return <main>Cart: {cart.length}, Wishlist: {wishlist.length}</main>
}

function Footer() {
  const { settings } = useSettings()
  return <footer>{settings.company}</footer>
}
```

Now only components using the changed context re-render.

## Common Patterns

### 1. Context by Domain

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
  const { user } = useAuth()
  return <header className={theme}>{user?.name}</header>
}

function Main() {
  const { data } = useData()
  return <main>{data.length} items</main>
}
```

### 2. Context by Update Frequency

```tsx
const UserContext = createContext<User | null>(null)
const ThemeContext = createContext<'light' | 'dark'>('light')
const NotificationsContext = createContext<Notification[]>([])

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [notifications, setNotifications] = useState<Notification[]>([])

  return (
    <UserContext.Provider value={user}>
      <ThemeContext.Provider value={theme}>
        <NotificationsContext.Provider value={notifications}>
          <Header />
          <Notifications />
          <Main />
        </NotificationsContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}
```

### 3. Nested Context Providers

```tsx
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Header />
            <Main />
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### 4. Context Composition

```tsx
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function App() {
  return (
    <AppProviders>
      <Header />
      <Main />
      <Footer />
    </AppProviders>
  )
}
```

### 5. Context with Custom Hooks

```tsx
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}

function Header() {
  const { theme } = useTheme()
  const { user } = useUser()
  return <header className={theme}>{user?.name}</header>
}
```

### 6. Context with Type Safety

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

interface UserContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
const UserContext = createContext<UserContextValue | undefined>(undefined)

function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

function useUser(): UserContextValue {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
```

### 7. Context with Lazy Loading

```tsx
const DataContext = createContext<Data[] | null>(null)

function DataProvider({ children, fetchData }: { children: ReactNode; fetchData: () => Promise<Data[]> }) {
  const [data, setData] = useState<Data[] | null>(null)
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider fetchData={fetchData}>
          <Header />
          <Main />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

## Common Mistakes

### Mistake 1. Single Large Context

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

### Mistake 2. Too Many Small Contexts

```tsx
// DON'T - Too granular
const FirstNameContext = createContext('')
const LastNameContext = createContext('')
const EmailContext = createContext('')
const AgeContext = createContext(0)

// DO - Group related values
const UserContext = createContext<User | null>(null)
```

### Mistake 3. Deep Nesting

```tsx
// DON'T - Too many nested providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationsProvider>
              <SettingsProvider>
                <Component />
              </SettingsProvider>
            </NotificationsProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

// DO - Use composition or reduce nesting
function App() {
  return (
    <AppProviders>
      <Component />
    </AppProviders>
  )
}
```

## Key Takeaways

- Split large contexts into smaller, focused ones
- Group related values together
- Separate by update frequency
- Use custom hooks for context access
- Compose providers for cleaner code
- Avoid excessive nesting
- Consider performance implications
- Use TypeScript for type safety
