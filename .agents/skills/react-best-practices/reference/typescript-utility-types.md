---
name: typescript-utility-types
description: Use TypeScript utility types for better type manipulation.
---

# TypeScript Utility Types

Use TypeScript utility types for better type manipulation.

## Common Utility Types

### 1. Partial

```tsx
interface User {
  id: number
  name: string
  email: string
}

function updateUser(id: number, updates: Partial<User>) {
  console.log(`Updating user ${id} with:`, updates)
}

function App() {
  const handleUpdate = () => {
    updateUser(1, { name: 'John' })
    updateUser(2, { email: 'john@example.com' })
  }

  return <button onClick={handleUpdate}>Update</button>
}
```

### 2. Required

```tsx
interface User {
  id?: number
  name?: string
  email?: string
}

function createUser(user: Required<User>) {
  console.log('Creating user:', user)
}

function App() {
  const handleCreate = () => {
    createUser({
      id: 1,
      name: 'John',
      email: 'john@example.com'
    })
  }

  return <button onClick={handleCreate}>Create</button>
}
```

### 3. Readonly

```tsx
interface Config {
  apiUrl: string
  timeout: number
}

function useConfig(config: Readonly<Config>) {
  return config
}

function App() {
  const config: Readonly<Config> = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  }

  return <div>{config.apiUrl}</div>
}
```

### 4. Pick

```tsx
interface User {
  id: number
  name: string
  email: string
  age: number
}

type UserBasicInfo = Pick<User, 'id' | 'name'>

function UserInfo({ user }: { user: UserBasicInfo }) {
  return (
    <div>
      <p>ID: {user.id}</p>
      <p>Name: {user.name}</p>
    </div>
  )
}
```

### 5. Omit

```tsx
interface User {
  id: number
  name: string
  email: string
  password: string
}

type PublicUser = Omit<User, 'password'>

function PublicProfile({ user }: { user: PublicUser }) {
  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### 6. Record

```tsx
type Theme = 'light' | 'dark'

type ThemeColors = Record<Theme, { primary: string; secondary: string }>

const themes: ThemeColors = {
  light: { primary: '#fff', secondary: '#000' },
  dark: { primary: '#000', secondary: '#fff' }
}

function App() {
  const [theme, setTheme] = useState<Theme>('light')

  return (
    <div style={{ background: themes[theme].primary }}>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  )
}
```

### 7. Exclude

```tsx
type EventTypes = 'click' | 'scroll' | 'resize' | 'mousemove'

type NonInteractiveEvents = Exclude<EventTypes, 'click' | 'scroll'>

function handleEvent(event: NonInteractiveEvents) {
  console.log('Event:', event)
}

function App() {
  useEffect(() => {
    window.addEventListener('resize', handleEvent)
    window.addEventListener('mousemove', handleEvent)

    return () => {
      window.removeEventListener('resize', handleEvent)
      window.removeEventListener('mousemove', handleEvent)
    }
  }, [])

  return <div>App</div>
}
```

### 8. Extract

```tsx
type EventHandlers = {
  onClick: () => void
  onChange: () => void
  onSubmit: () => void
}

type HandlerNames = Extract<keyof EventHandlers, `on${string}`>

function App() {
  const handlers: HandlerNames[] = ['onClick', 'onChange', ' onSubmit']
  return <div>{handlers.join(', ')}</div>
}
```

## Common Patterns

### 1. Partial for Form Updates

```tsx
interface User {
  id: number
  name: string
  email: string
  age: number
}

function UserForm() {
  const [user, setUser] = useState<User>({
    id: 0,
    name: '',
    email: '',
    age: 0
  })

  const handleChange = (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleUpdate = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <form>
      <input value={user.name} onChange={handleChange('name')} />
      <input value={user.email} onChange={handleChange('email')} />
      <input type="number" value={user.age} onChange={handleChange('age')} />
      <button onClick={() => handleUpdate({ name: 'John' })}>Update Name</button>
    </form>
  )
}
```

### 2. Pick for Component Props

```tsx
interface User {
  id: number
  name: string
  email: string
  age: number
  address: string
}

type UserCardProps = Pick<User, 'name' | 'email'>

function UserCard({ name, email }: UserCardProps) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}

function App() {
  const user: User = {
    id: 1,
    name: 'John',
    email: 'john@example.com',
    age: 30,
    address: '123 Main St'
  }

  return <UserCard name={user.name} email={user.email} />
}
```

### 3. Omit for Sensitive Data

```tsx
interface User {
  id: number
  name: string
  email: string
  password: string
  ssn: string
}

type PublicUser = Omit<User, 'password' | 'ssn'>

function UserProfile({ user }: { user: PublicUser }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}

function App() {
  const user: User = {
    id: 1,
    name: 'John',
    email: 'john@example.com',
    password: 'secret',
    ssn: '123-45-6789'
  }

  const publicUser: PublicUser = {
    id: user.id,
    name: user.name,
    email: user.email
  }

  return <UserProfile user={publicUser} />
}
```

### 4. Record for Configuration

```tsx
type Environment = 'development' | 'staging' | 'production'

type Config = Record<Environment, {
  apiUrl: string
  timeout: number
  debug: boolean
}>

const config: Config = {
  development: {
    apiUrl: 'http://localhost:3000',
    timeout: 5000,
    debug: true
  },
  staging: {
    apiUrl: 'https://staging.example.com',
    timeout: 5000,
    debug: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    timeout: 3000,
    debug: false
  }
}

function App() {
  const env: Environment = 'development'
  const currentConfig = config[env]

  return (
    <div>
      <p>API URL: {currentConfig.apiUrl}</p>
      <p>Debug: {currentConfig.debug ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### 5. Exclude for Event Handling

```tsx
type AllEvents = 'click' | 'scroll' | 'resize' | 'mousemove' | 'keydown'

type PassiveEvents = Exclude<AllEvents, 'click' | 'keydown'>

function usePassiveEvents() {
  useEffect(() => {
    const handleScroll = () => console.log('Scroll')
    const handleResize = () => console.log('Resize')
    const handleMouseMove = () => console.log('MouseMove')

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return <div>Passive events enabled</div>
}
```

### 6. Extract for String Types

```tsx
type EventNames = 'onClick' | 'onChange' | 'onSubmit' | 'onFocus'

type OnEventNames = Extract<EventNames, `on${string}`>

function App() {
  const events: OnEventNames[] = ['onClick', 'onChange', 'onSubmit']
  return <div>{events.join(', ')}</div>
}
```

### 7. ReturnType for Function Types

```tsx
function fetchData(): Promise<{ id: number; name: string }> {
  return Promise.resolve({ id: 1, name: 'John' })
}

type DataType = Awaited<ReturnType<typeof fetchData>>

function DataComponent() {
  const [data, setData] = useState<DataType | null>(null)

  useEffect(() => {
    fetchData().then(setData)
  }, [])

  return <div>{data?.name}</div>
}
```

### 8. Parameters for Function Types

```tsx
function handleEvent(event: MouseEvent, data: string) {
  console.log(event, data)
}

type HandlerParams = Parameters<typeof handleEvent>

function App() {
  const handleClick: HandlerParams[0] = new MouseEvent('click')
  const data: HandlerParams[1] = 'Hello'

  return <button onClick={() => handleEvent(handleClick, data)}>Click</button>
}
```

## Common Mistakes

### Mistake 1. Not Using Utility Types

```tsx
// DON'T - Not using utility types
interface User {
  id: number
  name: string
  email: string
}

function updateUser(id: number, updates: { name?: string; email?: string }) {
  console.log('Updating user:', updates)
}

// DO - Using utility types
function updateUser(id: number, updates: Partial<User>) {
  console.log('Updating user:', updates)
}
```

### Mistake 2. Not Using Pick/Omit

```tsx
// DON'T - Not using Pick/Omit
interface User {
  id: number
  name: string
  email: string
  password: string
}

function PublicProfile({ name, email }: { name: string; email: string }) {
  return <div>{name} {email}</div>
}

// DO - Using Pick/Omit
type PublicUser = Pick<User, 'name' | 'email'>

function PublicProfile({ name, email }: PublicUser) {
  return <div>{name} {email}</div>
}
```

### Mistake 3. Not Using Record

```tsx
// DON'T - Not using Record
const themes = {
  light: { primary: '#fff', secondary: '#000' },
  dark: { primary: '#000', secondary: '#fff' }
}

// DO - Using Record
type Theme = 'light' | 'dark'
type ThemeColors = Record<Theme, { primary: string; secondary: string }>

const themes: ThemeColors = {
  light: { primary: '#fff', secondary: '#000' },
  dark: { primary: '#000', secondary: '#fff' }
}
```

## Best Practices

### 1. Use Partial for Updates

```tsx
// DO - Use Partial for updates
interface User {
  id: number
  name: string
  email: string
}

function updateUser(id: number, updates: Partial<User>) {
  console.log('Updating user:', updates)
}
```

### 2. Use Pick for Component Props

```tsx
// DO - Use Pick for props
interface User {
  id: number
  name: string
  email: string
}

type UserCardProps = Pick<User, 'name' | 'email'>

function UserCard({ name, email }: UserCardProps) {
  return <div>{name} {email}</div>
}
```

### 3. Use Omit for Sensitive Data

```tsx
// DO - Use Omit for sensitive data
interface User {
  id: number
  name: string
  password: string
}

type PublicUser = Omit<User, 'password'>

function PublicProfile({ user }: { user: PublicUser }) {
  return <div>{user.name}</div>
}
```

### 4. Use Record for Configuration

```tsx
// DO - Use Record for config
type Environment = 'development' | 'production'

type Config = Record<Environment, { apiUrl: string }>

const config: Config = {
  development: { apiUrl: 'http://localhost:3000' },
  production: { apiUrl: 'https://api.example.com' }
}
```

## Key Takeaways

- Use Partial for optional updates
- Use Required for required fields
- Use Readonly for immutable data
- Use Pick to select properties
- Use Omit to exclude properties
- Use Record for key-value pairs
- Use Exclude to remove types
- Use Extract to filter types
