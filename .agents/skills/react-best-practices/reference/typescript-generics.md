---
name: typescript-generics
description: Use TypeScript generics for reusable components and hooks.
---

# TypeScript Generics

Use TypeScript generics for reusable components and hooks.

## The Problem

```tsx
// DON'T - Not using generics
interface ListProps {
  items: any[]
  renderItem: (item: any) => React.ReactNode
}

function List({ items, renderItem }: ListProps) {
  return <ul>{items.map(renderItem)}</ul>
}

function App() {
  const items = ['Item 1', 'Item 2']
  return <List items={items} renderItem={item => <li>{item}</li>} />
}
// No type safety for items!
```

## The Solution

```tsx
// DO - Using generics
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}

function App() {
  const items = ['Item 1', 'Item 2']
  return <List items={items} renderItem={item => <li>{item}</li>} />
}
// Full type safety for items!
```

## Common Patterns

### 1. Generic Component Props

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}</ul>
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

### 2. Generic Hooks

```tsx
function useFetch<T>(url: string): {
  data: T | null
  loading: boolean
  error: Error | null
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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

interface User {
  id: number
  name: string
}

function UserProfile() {
  const { data: user, loading } = useFetch<User>('/api/user/1')

  if (loading) return <div>Loading...</div>
  if (!user) return <div>No user</div>

  return <div>{user.name}</div>
}
```

### 3. Generic with Constraints

```tsx
interface SelectProps<T extends { id: string | number; label: string }> {
  options: T[]
  value: T
  onChange: (value: T) => void
}

function Select<T extends { id: string | number; label: string }>({
  options,
  value,
  onChange
}: SelectProps<T>) {
  return (
    <select value={value.id} onChange={e => onChange(options.find(o => o.id === e.target.value)!)}>
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function App() {
  const options = [
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' }
  ]

  const [value, setValue] = useState(options[0])

  return <Select options={options} value={value} onChange={setValue} />
}
```

### 4. Multiple Generics

```tsx
interface TableProps<T, K extends keyof T> {
  data: T[]
  columns: { key: K; label: string }[]
}

function Table<T, K extends keyof T>({ data, columns }: TableProps<T, K>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={String(column.key)}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map(column => (
              <td key={String(column.key)}>{String(row[column.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface User {
  id: number
  name: string
  email: string
}

function App() {
  const users: User[] = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ]

  const columns = [
    { key: 'name' as keyof User, label: 'Name' },
    { key: 'email' as keyof User, label: 'Email' }
  ]

  return <Table data={users} columns={columns} />
}
```

### 5. Generic with Default Types

```tsx
interface ContainerProps<T = ReactNode> {
  children: T
}

function Container<T = ReactNode>({ children }: ContainerProps<T>) {
  return <div className="container">{children}</div>
}

function App() {
  return (
    <div>
      <Container>Simple content</Container>
      <Container<string>String content</Container>
    </div>
  )
}
```

### 6. Generic Higher-Order Components

```tsx
function withLoading<T extends object>(
  Component: React.ComponentType<T>
): React.FC<T & { loading: boolean }> {
  return ({ loading, ...props }: T & { loading: boolean }) => {
    if (loading) {
      return <div>Loading...</div>
    }
    return <Component {...(props as T)} />
  }
}

interface UserProfileProps {
  user: { name: string }
}

function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>
}

const UserProfileWithLoading = withLoading(UserProfile)

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  return (
    <UserProfileWithLoading
      loading={loading}
      user={{ name: 'John' }}
    />
  )
}
```

### 7. Generic Context

```tsx
interface CreateContextOptions<T> {
  defaultValue: T
  displayName?: string
}

function createContext<T>(options: CreateContextOptions<T>) {
  const Context = React.createContext<T>(options.defaultValue)

  const Provider: React.FC<{ value: T }> = ({ value, children }) => {
    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  const useContext = () => {
    const context = React.useContext(Context)
    if (!context) {
      throw new Error(`use${options.displayName || 'Context'} must be used within Provider`)
    }
    return context
  }

  return { Provider, useContext: useContext as () => T }
}

const { Provider: ThemeProvider, useContext: useTheme } = createContext({
  defaultValue: 'light',
  displayName: 'Theme'
})

function App() {
  const theme = useTheme()
  return <div>Theme: {theme}</div>
}
```

### 8. Generic Utility Types

```tsx
interface User {
  id: number
  name: string
  email: string
}

type UserKeys = keyof User
type UserValues = User[keyof User]

function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

function App() {
  const user: User = { id: 1, name: 'John', email: 'john@example.com' }

  const name = getValue(user, 'name')
  const email = getValue(user, 'email')

  return (
    <div>
      <p>Name: {name}</p>
      <p>Email: {email}</p>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using Generics

```tsx
// DON'T - Not using generics
interface ListProps {
  items: any[]
  renderItem: (item: any) => React.ReactNode
}

function List({ items, renderItem }: ListProps) {
  return <ul>{items.map(renderItem)}</ul>
}

// DO - Using generics
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}
```

### Mistake 2. Not Using Constraints

```tsx
// DON'T - Not using constraints
interface SelectProps<T> {
  options: T[]
  value: T
  onChange: (value: T) => void
}

// DO - Using constraints
interface SelectProps<T extends { id: string; label: string }> {
  options: T[]
  value: T
  onChange: (value: T) => void
}
```

### Mistake 3. Over-Complicating Generics

```tsx
// DON'T - Over-complicating
interface Props<T, U, V, W> {
  data: T
  config: U
  options: V
  settings: W
}

// DO - Keep it simple
interface Props<T> {
  data: T
}
```

## Best Practices

### 1. Use Meaningful Generic Names

```tsx
// DO - Use meaningful names
interface ListProps<TItem> {
  items: TItem[]
  renderItem: (item: TItem) => React.ReactNode
}

function List<TItem>({ items, renderItem }: ListProps<TItem>) {
  return <ul>{items.map(renderItem)}</ul>
}
```

### 2. Use Constraints When Needed

```tsx
// DO - Use constraints
interface Props<T extends { id: string | number }> {
  items: T[]
}

function Component<T extends { id: string | number }>({ items }: Props<T>) {
  return <div>{items.length}</div>
}
```

### 3. Provide Default Types

```tsx
// DO - Provide default types
interface Props<T = string> {
  value: T
}

function Component<T = string>({ value }: Props<T>) {
  return <div>{value}</div>
}
```

### 4. Use Utility Types

```tsx
// DO - Use utility types
interface Props<T> {
  data: T
  onChange: (data: Partial<T>) => void
}

function Component<T>({ data, onChange }: Props<T>) {
  return <div>{JSON.stringify(data)}</div>
}
```

## Key Takeaways

- Use generics for reusable components
- Use generics for reusable hooks
- Use constraints to limit generic types
- Use meaningful generic names
- Provide default types
- Use utility types
- Keep generics simple
- Use multiple generics when needed
