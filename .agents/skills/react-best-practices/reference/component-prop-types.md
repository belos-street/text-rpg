---
name: component-prop-types
description: Use TypeScript interfaces or PropTypes for prop validation to catch errors early.
---

# Prop Types

Use TypeScript interfaces or PropTypes for prop validation to catch errors early.

## TypeScript Interfaces

### Basic Interface

```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

// Usage
<Button label="Click me" onClick={() => console.log('Clicked')} />
<Button label="Submit" variant="secondary" onClick={() => {}} />
```

### Union Types

```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'danger' | 'success'
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  )
}

// Usage
<Button label="Primary" variant="primary" onClick={() => {}} />
<Button label="Success" variant="success" onClick={() => {}} />
```

### Optional Props

```tsx
interface CardProps {
  title: string
  content?: string
  footer?: React.ReactNode
  showClose?: boolean
  onClose?: () => void
}

function Card({ title, content, footer, showClose = false, onClose }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {showClose && <button onClick={onClose}>×</button>}
      </div>
      {content && <p>{content}</p>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

// Usage
<Card title="Title" />
<Card title="Title" content="Content" />
<Card
  title="Title"
  content="Content"
  footer={<button>Action</button>}
  showClose
  onClose={() => console.log('Closed')}
/>
```

### Array Props

```tsx
interface ListProps {
  items: string[]
  renderItem?: (item: string, index: number) => React.ReactNode
}

function List({ items, renderItem }: ListProps) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem ? renderItem(item, index) : item}</li>
      ))}
    </ul>
  )
}

// Usage
<List items={['Item 1', 'Item 2', 'Item 3']} />
<List
  items={['Item 1', 'Item 2']}
  renderItem={(item, index) => <strong>{index + 1}. {item}</strong>}
/>
```

### Object Props

```tsx
interface User {
  id: string
  name: string
  email: string
}

interface UserProfileProps {
  user: User
  onUpdate: (user: User) => void
}

function UserProfile({ user, onUpdate }: UserProfileProps) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={() => onUpdate({ ...user, name: 'Updated' })}>
        Update
      </button>
    </div>
  )
}

// Usage
<UserProfile
  user={{ id: '1', name: 'John', email: 'john@example.com' }}
  onUpdate={user => console.log('Updated:', user)}
/>
```

### Function Props

```tsx
interface ButtonProps {
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onDoubleClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

function Button({ label, onClick, onDoubleClick }: ButtonProps) {
  return (
    <button onClick={onClick} onDoubleClick={onDoubleClick}>
      {label}
    </button>
  )
}

// Usage
<Button
  label="Click me"
  onClick={e => console.log('Clicked', e)}
  onDoubleClick={e => console.log('Double clicked', e)}
/>
```

### Children Prop

```tsx
interface ContainerProps {
  children: React.ReactNode
  className?: string
}

function Container({ children, className = '' }: ContainerProps) {
  return <div className={`container ${className}`}>{children}</div>
}

// Usage
<Container>
  <h1>Title</h1>
  <p>Content</p>
</Container>
```

### Generic Props

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  )
}

// Usage
interface User {
  id: string
  name: string
}

<List
  items={[{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }]}
  renderItem={(user, index) => <strong>{index + 1}. {user.name}</strong>}
  keyExtractor={user => user.id}
/>
```

## PropTypes (for JavaScript)

### Basic PropTypes

```tsx
import PropTypes from 'prop-types'

function Button({ label, onClick, disabled, variant }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger'])
}

Button.defaultProps = {
  disabled: false,
  variant: 'primary'
}
```

### Complex PropTypes

```tsx
function UserProfile({ user, onUpdate }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <button onClick={() => onUpdate(user)}>Update</button>
    </div>
  )
}

UserProfile.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired
  }).isRequired,
  onUpdate: PropTypes.func.isRequired
}
```

### Array PropTypes

```tsx
function List({ items, renderItem }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem ? renderItem(item) : item}</li>
      ))}
    </ul>
  )
}

List.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  renderItem: PropTypes.func
}
```

## Common Patterns

### 1. Extending HTML Element Props

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  )
}

// Usage
<Button variant="primary" onClick={() => {}}>
  Click me
</Button>
```

### 2. Polymorphic Components

```tsx
type AsProps<T extends React.ElementType> = {
  as?: T
} & React.ComponentPropsWithoutRef<T>

function Polymorphic<T extends React.ElementType = 'div'>({
  as,
  children,
  ...props
}: AsProps<T>) {
  const Component = as || 'div'
  return <Component {...props}>{children}</Component>
}

// Usage
<Polymorphic as="button" onClick={() => {}}>
  Click me
</Polymorphic>
<Polymorphic as="a" href="/about">
  About
</Polymorphic>
```

### 3. Conditional Props

```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password'
  value?: string
  onChange?: (value: string) => void
  min?: number
  max?: number
}

function Input({ type = 'text', value, onChange, min, max, ...props }: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      min={type === 'number' ? min : undefined}
      max={type === 'number' ? max : undefined}
      {...props}
    />
  )
}

// Usage
<Input type="text" value={text} onChange={setText} />
<Input type="number" value={count} onChange={setCount} min={0} max={100} />
```

## Common Mistakes

### Mistake 1: Missing Required Props

```tsx
// DON'T - Missing required prop
interface ButtonProps {
  label: string
  onClick: () => void
}

function Button({ label }: ButtonProps) {
  return <button>{label}</button>
}

// DO - Include all required props
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}
```

### Mistake 2: Using any Type

```tsx
// DON'T - Using any
interface Props {
  data: any
  onClick: (data: any) => void
}

// DO - Specific types
interface User {
  id: string
  name: string
}

interface Props {
  data: User
  onClick: (data: User) => void
}
```

### Mistake 3: Not Validating Props

```tsx
// DON'T - No validation
function Button({ label, variant }) {
  return <button className={variant}>{label}</button>
}

// DO - With TypeScript
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
}

function Button({ label, variant = 'primary' }: ButtonProps) {
  return <button className={variant}>{label}</button>
}
```

## Key Takeaways

- Use TypeScript interfaces for type-safe props
- Use PropTypes for JavaScript projects
- Mark required props with `isRequired` (PropTypes) or no `?` (TypeScript)
- Use union types for enums
- Use optional props with `?` or default values
- Extend HTML element props when appropriate
- Validate props to catch errors early
- Use generics for reusable components
- Avoid `any` type - use specific types
