---
name: component-default-props
description: Use default values in destructuring or TypeScript default parameters instead of defaultProps.
---

# Default Props

Use default values in destructuring or TypeScript default parameters instead of defaultProps.

## The Problem with defaultProps

```tsx
// DON'T - Using defaultProps (deprecated pattern)
function Button({ label, variant }: { label: string; variant?: string }) {
  return <button className={variant}>{label}</button>
}

Button.defaultProps = {
  variant: 'primary'
}
```

## The Solution

```tsx
// DO - Default values in destructuring
function Button({ label, variant = 'primary' }: { label: string; variant?: string }) {
  return <button className={variant}>{label}</button>
}
```

## Common Patterns

### 1. Simple Default Values

```tsx
// DO - Default value in destructuring
function Button({
  label,
  variant = 'primary',
  disabled = false
}: {
  label: string
  variant?: string
  disabled?: boolean
}) {
  return (
    <button className={variant} disabled={disabled}>
      {label}
    </button>
  )
}

// Usage
<Button label="Click me" />
<Button label="Click me" variant="secondary" />
```

### 2. Object Default Values

```tsx
// DO - Default object in destructuring
function Card({
  title,
  content,
  style = {}
}: {
  title: string
  content?: string
  style?: React.CSSProperties
}) {
  return (
    <div style={{ padding: '16px', ...style }}>
      <h2>{title}</h2>
      {content && <p>{content}</p>
    </div>
  )
}

// Usage
<Card title="Title" />
<Card title="Title" style={{ backgroundColor: 'blue' }} />
```

### 3. Array Default Values

```tsx
// DO - Default array in destructuring
function List({
  items = []
}: {
  items?: string[]
}) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

// Usage
<List />
<List items={['Item 1', 'Item 2']} />
```

### 4. Function Default Values

```tsx
// DO - Default function in destructuring
function Button({
  onClick = () => console.log('Clicked')
}: {
  onClick?: () => void
}) {
  return <button onClick={onClick}>Click me</button>
}

// Usage
<Button />
<Button onClick={() => console.log('Custom click')} />
```

### 5. TypeScript Default Parameters

```tsx
// DO - TypeScript default parameter
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

function Button({
  label,
  variant = 'primary',
  disabled = false
}: ButtonProps) {
  return (
    <button className={variant} disabled={disabled}>
      {label}
    </button>
  )
}
```

### 6. Complex Default Values

```tsx
// DO - Default value with calculation
function ProgressBar({
  value = 0,
  max = 100,
  color = value > 90 ? 'red' : 'blue'
}: {
  value?: number
  max?: number
  color?: string
}) {
  const percentage = (value / max) * 100

  return (
    <div style={{ width: '100%', backgroundColor: '#eee' }}>
      <div
        style={{
          width: `${percentage}%`,
          backgroundColor: color
        }}
      />
    </div>
  )
}
```

### 7. Conditional Defaults

```tsx
// DO - Conditional default values
function Input({
  type = 'text',
  placeholder,
  required = false
}: {
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  required?: boolean
}) {
  return (
    <input
      type={type}
      placeholder={placeholder || `Enter ${type}`}
      required={required}
    />
  )
}

// Usage
<Input />
<Input type="email" placeholder="Enter your email" />
```

## Common Mistakes

### Mistake 1: Using defaultProps

```tsx
// DON'T - Using defaultProps
function Button({ label, variant }: { label: string; variant?: string }) {
  return <button className={variant}>{label}</button>
}

Button.defaultProps = {
  variant: 'primary'
}

// DO - Default value in destructuring
function Button({ label, variant = 'primary' }: { label: string; variant?: string }) {
  return <button className={variant}>{label}</button>
}
```

### Mistake 2: defaultProps with TypeScript

```tsx
// DON'T - defaultProps with TypeScript
interface ButtonProps {
  label: string
  variant?: string
}

function Button({ label, variant }: ButtonProps) {
  return <button className={variant}>{label}</button>
}

Button.defaultProps = {
  variant: 'primary'
}

// DO - TypeScript default parameter
interface ButtonProps {
  label: string
  variant?: string
}

function Button({ label, variant = 'primary' }: ButtonProps) {
  return <button className={variant}>{label}</button>
}
```

### Mistake 3: Mutable Default Values

```tsx
// DON'T - Mutable default value (shared reference)
function List({ items = [] }: { items?: string[] }) {
  items.push('new')  // Affects all instances!
  return <ul>{items.map(item => <li>{item}</li>)}</ul>
}

// DO - Use function for mutable defaults
function List({ items }: { items?: string[] }) {
  const list = items ?? []
  return <ul>{list.map(item => <li>{item}</li>)}</ul>
}

// OR - Use useState
function List({ initialItems = [] }: { initialItems?: string[] }) {
  const [items, setItems] = useState(initialItems)

  const addItem = () => {
    setItems([...items, 'new'])
  }

  return (
    <>
      <ul>{items.map(item => <li>{item}</li>)}</ul>
      <button onClick={addItem}>Add</button>
    </>
  )
}
```

## Advanced Patterns

### 1. Default Props with Validation

```tsx
function Button({
  label,
  variant = 'primary',
  disabled = false
}: {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) {
  if (!['primary', 'secondary', 'danger'].includes(variant)) {
    console.warn(`Invalid variant: ${variant}`)
  }

  return (
    <button className={variant} disabled={disabled}>
      {label}
    </button>
  )
}
```

### 2. Default Props with Composition

```tsx
function BaseButton({
  label,
  variant = 'primary',
  ...props
}: {
  label: string
  variant?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {label}
    </button>
  )
}

function PrimaryButton(props: Omit<React.ComponentProps<typeof BaseButton>, 'variant'>) {
  return <BaseButton variant="primary" {...props} />
}

function SecondaryButton(props: Omit<React.ComponentProps<typeof BaseButton>, 'variant'>) {
  return <BaseButton variant="secondary" {...props} />
}
```

### 3. Default Props Factory

```tsx
function createButton(defaultVariant: string) {
  return function Button({
    label,
    variant = defaultVariant,
    disabled = false
  }: {
    label: string
    variant?: string
    disabled?: boolean
  }) {
    return (
      <button className={variant} disabled={disabled}>
        {label}
      </button>
    )
  }
}

const PrimaryButton = createButton('primary')
const SecondaryButton = createButton('secondary')
```

## Key Takeaways

- Use default values in destructuring instead of defaultProps
- Use TypeScript default parameters for type safety
- Be careful with mutable default values (arrays, objects)
- Use factory functions or useState for mutable defaults
- Default values should be simple and predictable
- Validate default values when necessary
- Prefer composition over multiple default prop variations
