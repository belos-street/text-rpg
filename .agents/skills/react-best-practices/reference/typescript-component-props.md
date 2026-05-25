---
name: typescript-component-props
description: Use TypeScript to type component props for better type safety.
---

# TypeScript Component Props

Use TypeScript to type component props for better type safety.

## The Problem

```tsx
// DON'T - Untyped props
function Button({ text, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  )
}
// No type safety!
```

## The Solution

```tsx
// DO - Typed props
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
// Full type safety!
```

## Common Patterns

### 1. Basic Props Interface

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

### 2. Event Handler Props

```tsx
interface FormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onReset: (e: React.FormEvent<HTMLFormElement>) => void
}

function Form({ onSubmit, onReset }: FormProps) {
  return (
    <form onSubmit={onSubmit} onReset={onReset}>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  )
}
```

### 3. Children Prop

```tsx
interface CardProps {
  title: string
  children: React.ReactNode
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

### 4. Generic Props

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  )
}

function App() {
  const items = ['Item 1', 'Item 2', 'Item 3']

  return (
    <List
      items={items}
      renderItem={(item, index) => <span>{item}</span>}
    />
  )
}
```

### 5. Union Type Props

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps {
  variant?: ButtonVariant
  text: string
  onClick: () => void
}

function Button({ variant = 'primary', text, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {text}
    </button>
  )
}
```

### 6. Optional Props with Defaults

```tsx
interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'email' | 'password'
}

function Input({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  type = 'text'
}: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
```

### 7. Function Component Type

```tsx
type ButtonProps = {
  text: string
  onClick: () => void
}

const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>
}

// Or with explicit return type
const Button2: React.FC<ButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>
}
```

### 8. Polymorphic Components

```tsx
type AsProps<T extends React.ElementType> = {
  as?: T
} & React.ComponentPropsWithoutRef<T>

function PolymorphicComponent<T extends React.ElementType = 'button'>({
  as,
  ...props
}: AsProps<T>) {
  const Component = as || 'button'
  return <Component {...props} />
}

function App() {
  return (
    <div>
      <PolymorphicComponent>Button</PolymorphicComponent>
      <PolymorphicComponent as="a" href="https://example.com">
        Link
      </PolymorphicComponent>
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Using `any` for Props

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

### Mistake 2. Not Typing Event Handlers

```tsx
// DON'T - Not typing event handlers
interface Props {
  onClick: (e: any) => void
}

function Component({ onClick }: Props) {
  return <button onClick={onClick}>Click</button>
}

// DO - Typing event handlers
interface Props {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function Component({ onClick }: Props) {
  return <button onClick={onClick}>Click</button>
}
```

### Mistake 3. Not Using Optional Props

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

### 1. Use Interfaces for Props

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

### 2. Use Type Aliases for Simple Types

```tsx
// DO - Use type aliases
type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps {
  variant: ButtonVariant
  text: string
}
```

### 3. Use Generics for Reusable Components

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

### 4. Use React.FC for Function Components

```tsx
// DO - Use React.FC
interface ButtonProps {
  text: string
  onClick: () => void
}

const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>
}
```

## Key Takeaways

- Use interfaces for component props
- Type event handlers properly
- Use optional props with defaults
- Use generics for reusable components
- Use union types for variants
- Avoid using `any`
- Use React.FC for function components
- Create polymorphic components when needed
