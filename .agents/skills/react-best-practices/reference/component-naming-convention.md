---
name: component-naming-convention
description: Use PascalCase for component names and camelCase for props and functions.
---

# Naming Convention

Use PascalCase for component names and camelCase for props and functions.

## Component Names

### PascalCase for Components

```tsx
// DO - PascalCase
function UserProfile() {
  return <div>User Profile</div>
}

function Button() {
  return <button>Click me</button>
}

// DON'T - camelCase or lowercase
function userProfile() {
  return <div>User Profile</div>
}

function button() {
  return <button>Click me</button>
}
```

### File Names

```tsx
// File: UserProfile.tsx
export function UserProfile() {
  return <div>User Profile</div>
}

// File: Button.tsx
export function Button() {
  return <button>Click me</button>
}
```

### Default Exports

```tsx
// File: UserProfile.tsx
export default function UserProfile() {
  return <div>User Profile</div>
}

// Usage
import UserProfile from './UserProfile'
```

### Named Exports

```tsx
// File: components.tsx
export function UserProfile() {
  return <div>User Profile</div>
}

export function Button() {
  return <button>Click me</button>
}

// Usage
import { UserProfile, Button } from './components'
```

## Props and Functions

### camelCase for Props

```tsx
// DO - camelCase
interface ButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled: boolean
}

function Button({ onClick, isLoading, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled || isLoading}>
    {isLoading ? 'Loading...' : 'Click me'}
  </button>
}

// DON'T - PascalCase or snake_case
interface ButtonProps {
  OnClick: () => void
  IsLoading: boolean
  disabled: boolean
}
```

### camelCase for Functions

```tsx
// DO - camelCase
function handleClick() {
  console.log('Clicked')
}

function handleSubmit() {
  console.log('Submitted')
}

function fetchData() {
  console.log('Fetching')
}

// DON'T - PascalCase or snake_case
function HandleClick() {
  console.log('Clicked')
}

function handle_submit() {
  console.log('Submitted')
}
```

### Event Handlers

```tsx
// DO - handle prefix + camelCase
function handleClick() {
  console.log('Clicked')
}

function handleSubmit(event: React.FormEvent) {
  event.preventDefault()
  console.log('Submitted')
}

function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value)
}

// Usage
<button onClick={handleClick}>Click</button>
<form onSubmit={handleSubmit}>
  <input onChange={handleChange} />
</form>
```

### Boolean Props

```tsx
// DO - is/has/should prefix
interface Props {
  isLoading: boolean
  hasError: boolean
  shouldShow: boolean
  disabled: boolean
}

function Component({ isLoading, hasError, shouldShow, disabled }: Props) {
  if (isLoading) return <div>Loading...</div>
  if (hasError) return <div>Error</div>
  if (!shouldShow) return null

  return <button disabled={disabled}>Button</button>
}
```

## Custom Hooks

### use Prefix for Hooks

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
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(url)
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [url])

  return { data, loading, error }
}

// DON'T - No use prefix
function counter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)
  return { count }
}
```

## Constants

### UPPER_SNAKE_CASE for Constants

```tsx
// DO - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT = 5000

function fetchData() {
  fetch(`${API_BASE_URL}/data`, {
    timeout: DEFAULT_TIMEOUT
  })
}
```

### camelCase for Module-level Constants

```tsx
// DO - camelCase for module constants
const defaultConfig = {
  timeout: 5000,
  retries: 3
}

function fetchData(config = defaultConfig) {
  console.log(config)
}
```

## Types and Interfaces

### PascalCase for Types and Interfaces

```tsx
// DO - PascalCase
interface User {
  id: string
  name: string
  email: string
}

type Status = 'active' | 'inactive' | 'pending'

interface ButtonProps {
  onClick: () => void
  disabled: boolean
}

type FetchResult<T> = {
  data: T | null
  error: Error | null
}

// DON'T - camelCase
interface user {
  id: string
  name: string
}

type status = 'active' | 'inactive'
```

## Common Patterns

### 1. Component with Multiple Files

```tsx
// UserProfile.tsx
export function UserProfile() {
  return <div>User Profile</div>
}

// UserProfile.types.ts
export interface UserProfileProps {
  userId: string
}

// UserProfile.styles.ts
export const styles = {
  container: 'user-profile',
  name: 'user-name'
}
```

### 2. HOC Naming

```tsx
// DO - with prefix + PascalCase
function withLoading<P>(Component: React.ComponentType<P>) {
  return function WithLoading(props: P & { loading: boolean }) {
    if (props.loading) return <div>Loading...</div>
    return <Component {...props} />
  }
}

// Usage
const UserProfileWithLoading = withLoading(UserProfile)
```

### 3. Context Naming

```tsx
// DO - Context + PascalCase
const UserContext = createContext<User | null>(null)

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  )
}

function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
```

## Common Mistakes

### Mistake 1: Inconsistent Naming

```tsx
// DON'T - Inconsistent
function UserProfile() {
  const [user_name, setUser_name] = useState('')
  const [userAge, setUserAge] = useState(0)

  return <div>{user_name}</div>
}

// DO - Consistent
function UserProfile() {
  const [userName, setUserName] = useState('')
  const [userAge, setUserAge] = useState(0)

  return <div>{userName}</div>
}
```

### Mistake 2: Abbreviations

```tsx
// DON'T - Unclear abbreviations
function UsrPrf() {
  return <div>User Profile</div>
}

// DO - Clear names
function UserProfile() {
  return <div>User Profile</div>
}
```

### Mistake 3: Generic Names

```tsx
// DON'T - Too generic
function Component() {
  return <div>Content</div>
}

function handleEvent() {
  console.log('Event')
}

// DO - Descriptive names
function UserProfile() {
  return <div>User Profile</div>
}

function handleSubmit() {
  console.log('Submitted')
}
```

## Key Takeaways

- Use PascalCase for component names
- Use camelCase for props, functions, and variables
- Use UPPER_SNAKE_CASE for constants
- Use `use` prefix for custom hooks
- Use `handle` prefix for event handlers
- Use `is/has/should` prefix for boolean props
- Use PascalCase for types and interfaces
- Be consistent with naming conventions
- Use descriptive, clear names
