---
name: typescript-best-practices
description: Follow TypeScript best practices for React development.
---

# TypeScript Best Practices

Follow TypeScript best practices for React development.

## Common Patterns

### 1. Strict Type Checking

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Type Component Props

```tsx
interface ButtonProps {
  text: string
  onClick: () => void
  disabled?: boolean
}

function Button({ text, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  )
}
```

### 3. Type Event Handlers

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target.value)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleChange} />
      <button onClick={handleClick}>Submit</button>
    </form>
  )
}
```

### 4. Type Refs

```tsx
function InputFocus() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <input ref={inputRef} />
}
```

### 5. Type Custom Hooks

```tsx
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)

  return { count, increment, decrement }
}

function Counter() {
  const { count, increment, decrement } = useCounter(0)

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  )
}
```

### 6. Type Context

```tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }

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

### 7. Type Generics

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>
}

function App() {
  const strings = ['Item 1', 'Item 2']
  const numbers = [1, 2, 3]

  return (
    <div>
      <List items={strings} renderItem={item => <span>{item}</span>} />
      <List items={numbers} renderItem={item => <span>{item}</span>} />
    </div>
  )
}
```

### 8. Type Utility Types

```tsx
interface User {
  id: number
  name: string
  email: string
  password: string
}

type PublicUser = Omit<User, 'password'>
type UserUpdate = Partial<User>
type UserKeys = keyof User

function PublicProfile({ user }: { user: PublicUser }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}

function updateUser(id: number, updates: UserUpdate) {
  console.log('Updating user:', updates)
}
```

## Common Mistakes

### Mistake 1. Using `any`

```tsx
// DON'T - Using any
interface Props {
  data: any
}

function Component({ data }: Props) {
  return <div>{data}</div>
}

// DO - Using specific types
interface Props {
  data: { id: number; name: string }
}

function Component({ data }: Props) {
  return <div>{data.name}</div>
}
```

### Mistake 2. Not Typing Props

```tsx
// DON'T - Not typing props
function Component({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>
}

// DO - Typing props
interface Props {
  text: string
  onClick: () => void
}

function Component({ text, onClick }: Props) {
  return <button onClick={onClick}>{text}</button>
}
```

### Mistake 3. Not Typing Event Handlers

```tsx
// DON'T - Not typing event handlers
function Component() {
  const handleClick = (e: any) => {
    console.log('Clicked')
  }

  return <button onClick={handleClick}>Click</button>
}

// DO - Typing event handlers
function Component() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Clicked')
  }

  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 4. Not Using Optional Props

```tsx
// DON'T - Not using optional props
interface Props {
  disabled: boolean
}

function Component({ disabled }: Props) {
  return <button disabled={disabled}>Click</button>
}

// DO - Using optional props
interface Props {
  disabled?: boolean
}

function Component({ disabled = false }: Props) {
  return <button disabled={disabled}>Click</button>
}
```

## Best Practices

### 1. Enable Strict Mode

```tsx
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2. Use Interface for Props

```tsx
// DO - Use interfaces
interface ButtonProps {
  text: string
  onClick: () => void
}

function Button({ text, onClick }: ButtonProps) {
  return <button onClick={onClick}>{text}</button>
}
```

### 3. Use Type Aliases for Simple Types

```tsx
// DO - Use type aliases
type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps {
  variant: ButtonVariant
  text: string
}
```

### 4. Use Generics for Reusable Components

```tsx
// DO - Use generics
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}
```

### 5. Use Utility Types

```tsx
// DO - Use utility types
interface User {
  id: number
  name: string
  password: string
}

type PublicUser = Omit<User, 'password'>
type UserUpdate = Partial<User>
```

### 6. Type Custom Hooks

```tsx
// DO - Type custom hooks
function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)

  return { count, increment, decrement }
}
```

### 7. Type Context

```tsx
// DO - Type context
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
```

### 8. Use Type Guards

```tsx
// DO - Use type guards
function isUser(obj: any): obj is User {
  return typeof obj === 'object' && 'id' in obj && 'name' in obj
}

function Component({ data }: { data: unknown }) {
  if (isUser(data)) {
    return <div>{data.name}</div>
  }
  return <div>Not a user</div>
}
```

## Performance Tips

### 1. Use Type Inference

```tsx
// DO - Use type inference
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  return <div>{count} {name}</div>
}
```

### 2. Avoid Unnecessary Types

```tsx
// DON'T - Unnecessary types
function Component() {
  const [count, setCount] = useState<number>(0)
  const [name, setName] = useState<string>('')

  return <div>{count} {name}</div>
}

// DO - Let TypeScript infer
function Component() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')

  return <div>{count} {name}</div>
}
```

### 3. Use Utility Types

```tsx
// DO - Use utility types
interface User {
  id: number
  name: string
  email: string
}

type UserUpdate = Partial<User>

function updateUser(id: number, updates: UserUpdate) {
  console.log('Updating user:', updates)
}
```

## Key Takeaways

- Enable strict type checking
- Type all component props
- Type event handlers properly
- Type refs with element types
- Type custom hooks
- Type context properly
- Use generics for reusability
- Use utility types
- Avoid using `any`
- Use type guards
- Let TypeScript infer when possible
- Keep types simple and readable
