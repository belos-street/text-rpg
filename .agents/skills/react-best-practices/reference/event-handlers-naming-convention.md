---
name: event-handlers-naming-convention
description: Use clear, descriptive names for event handlers starting with 'handle' or 'on'.
---

# Event Handlers Naming Convention

Use clear, descriptive names for event handlers starting with 'handle' or 'on'.

## The Convention

```tsx
// DO - Clear, descriptive names
function Component() {
  const handleClick = () => console.log('Clicked')
  const handleSubmit = (e: React.FormEvent) => console.log('Submitted')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => console.log('Changed')

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <form onSubmit={handleSubmit}>
        <input onChange={handleChange} />
      </form>
    </div>
  )
}
```

## Common Patterns

### 1. handle Prefix

```tsx
function Button() {
  const handleClick = () => console.log('Button clicked')
  const handleMouseEnter = () => console.log('Mouse entered')
  const handleMouseLeave = () => console.log('Mouse left')

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      Button
    </button>
  )
}

function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  const handleReset = () => console.log('Form reset')

  return (
    <form onSubmit={handleSubmit} onReset={handleReset}>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  )
}
```

### 2. on Prefix

```tsx
function Input() {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target.value)
  }

  const onFocus = () => console.log('Input focused')
  const onBlur = () => console.log('Input blurred')

  return (
    <input
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}

function Select() {
  const onSelect = (value: string) => {
    console.log('Selected:', value)
  }

  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </select>
  )
}
```

### 3. Descriptive Names

```tsx
function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const handleToggle = () => onToggle(todo.id)
  const handleDelete = () => onDelete(todo.id)

  return (
    <li>
      <input type="checkbox" checked={todo.completed} onChange={handleToggle} />
      <span>{todo.text}</span>
      <button onClick={handleDelete}>Delete</button>
    </li>
  )
}

interface TodoItemProps {
  todo: { id: number; text: string; completed: boolean }
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}
```

### 4. Action-Based Names

```tsx
function Counter() {
  const handleIncrement = () => console.log('Increment')
  const handleDecrement = () => console.log('Decrement')
  const handleReset = () => console.log('Reset')

  return (
    <div>
      <button onClick={handleDecrement}>-</button>
      <button onClick={handleReset}>Reset</button>
      <button onClick={handleIncrement}>+</button>
    </div>
  )
}

function Modal() {
  const handleOpen = () => console.log('Modal opened')
  const handleClose = () => console.log('Modal closed')
  const handleSave = () => console.log('Modal saved')
  const handleCancel = () => console.log('Modal cancelled')

  return (
    <div>
      <button onClick={handleOpen}>Open</button>
      <button onClick={handleClose}>Close</button>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  )
}
```

### 5. Context-Specific Names

```tsx
function LoginForm() {
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Email changed:', e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Password changed:', e.target.value)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login submitted')
  }

  return (
    <form onSubmit={handleLogin}>
      <input type="email" onChange={handleEmailChange} />
      <input type="password" onChange={handlePasswordChange} />
      <button type="submit">Login</button>
    </form>
  )
}

function SearchBar() {
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search query:', e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search submitted')
  }

  const handleSearchClear = () => {
    console.log('Search cleared')
  }

  return (
    <form onSubmit={handleSearchSubmit}>
      <input type="search" onChange={handleSearchQueryChange} />
      <button type="submit">Search</button>
      <button type="button" onClick={handleSearchClear}>Clear</button>
    </form>
  )
}
```

### 6. Async Handlers

```tsx
function AsyncButton() {
  const handleAsyncClick = async () => {
    try {
      await api.fetchData()
      console.log('Data fetched successfully')
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  return <button onClick={handleAsyncClick}>Fetch Data</button>
}

function AsyncForm() {
  const handleAsyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await api.submitForm()
      console.log('Form submitted successfully')
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <form onSubmit={handleAsyncSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}
```

### 7. Event-Specific Handlers

```tsx
function KeyboardShortcuts() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key)
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    console.log('Key released:', e.key)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('Key typed:', e.key)
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onKeyPress={handleKeyPress}
      tabIndex={0}
    >
      Press any key
    </div>
  )
}

function DragAndDrop() {
  const handleDragStart = (e: React.DragEvent) => {
    console.log('Drag started')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    console.log('Dropped')
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      Drag me
    </div>
  )
}
```

### 8. Lifecycle Handlers

```tsx
function LifecycleComponent() {
  const handleMount = () => {
    console.log('Component mounted')
  }

  const handleUnmount = () => {
    console.log('Component unmounted')
  }

  const handleUpdate = () => {
    console.log('Component updated')
  }

  useEffect(() => {
    handleMount()
    return handleUnmount
  }, [])

  useEffect(() => {
    handleUpdate()
  })

  return <div>Component</div>
}
```

## Common Mistakes

### Mistake 1. Unclear Names

```tsx
// DON'T - Unclear names
function Component() {
  const click = () => console.log('Clicked')
  const change = () => console.log('Changed')
  const submit = () => console.log('Submitted')

  return (
    <div>
      <button onClick={click}>Click</button>
      <input onChange={change} />
      <button onClick={submit}>Submit</button>
    </div>
  )
}

// DO - Clear names
function Component() {
  const handleClick = () => console.log('Clicked')
  const handleChange = () => console.log('Changed')
  const handleSubmit = () => console.log('Submitted')

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      <input onChange={handleChange} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  )
}
```

### Mistake 2. Inconsistent Naming

```tsx
// DON'T - Inconsistent naming
function Component() {
  const handleClick = () => {}
  const onChange = () => {}
  const submit = () => {}

  return <div>Component</div>
}

// DO - Consistent naming
function Component() {
  const handleClick = () => {}
  const handleChange = () => {}
  const handleSubmit = () => {}

  return <div>Component</div>
}
```

### Mistake 3. Too Generic

```tsx
// DON'T - Too generic
function Component() {
  const handleEvent = () => {}
  const handleAction = () => {}

  return <div>Component</div>
}

// DO - Descriptive names
function Component() {
  const handleButtonClick = () => {}
  const handleFormSubmit = () => {}

  return <div>Component</div>
}
```

## Naming Guidelines

### 1. Use handle or on Prefix

```tsx
const handleClick = () => {}
const onSubmit = () => {}
```

### 2. Be Specific

```tsx
const handleButtonClick = () => {}
const handleFormSubmit = () => {}
```

### 3. Use Action Verbs

```tsx
const handleIncrement = () => {}
const handleDecrement = () => {}
const handleReset = () => {}
```

### 4. Include Context

```tsx
const handleEmailChange = () => {}
const handlePasswordChange = () => {}
```

### 5. Be Consistent

```tsx
const handleClick = () => {}
const handleChange = () => {}
const handleSubmit = () => {}
```

## Key Takeaways

- Use 'handle' or 'on' prefix for event handlers
- Be descriptive and specific
- Use action verbs
- Include context when needed
- Be consistent with naming
- Use clear, self-explanatory names
- Avoid generic names
- Follow React conventions
