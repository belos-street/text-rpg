---
name: event-handlers-propagation
description: Use stopPropagation and preventDefault to control event flow when needed.
---

# Event Handlers Propagation

Use stopPropagation and preventDefault to control event flow when needed.

## Event Bubbling

```tsx
function Parent() {
  const handleParentClick = () => console.log('Parent clicked')

  return (
    <div onClick={handleParentClick}>
      <Child />
    </div>
  )
}

function Child() {
  const handleChildClick = () => console.log('Child clicked')

  return <button onClick={handleChildClick}>Click me</button>
}

// Output when clicking button:
// Child clicked
// Parent clicked
```

## stopPropagation

```tsx
function Parent() {
  const handleParentClick = () => console.log('Parent clicked')

  return (
    <div onClick={handleParentClick}>
      <Child />
    </div>
  )
}

function Child() {
  const handleChildClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Child clicked')
  }

  return <button onClick={handleChildClick}>Click me</button>
}

// Output when clicking button:
// Child clicked
// (Parent click is prevented)
```

## preventDefault

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}
// Form submission is prevented, page doesn't reload
```

## Common Patterns

### 1. Stopping Propagation

```tsx
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div>
      <button onClick={handleToggle}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}

function Modal() {
  const [isOpen, setIsOpen] = useState(false)

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleOverlayClick = () => {
    setIsOpen(false)
  }

  return (
    isOpen && (
      <div className="overlay" onClick={handleOverlayClick}>
        <div className="modal" onClick={handleModalClick}>
          Modal content
        </div>
      </div>
    )
  )
}
```

### 2. Preventing Default Behavior

```tsx
function Link() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    console.log('Link clicked')
  }

  return (
    <a href="https://example.com" onClick={handleClick}>
      Click me
    </a>
  )
}

function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}

function Input() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      console.log('Enter pressed')
    }
  }

  return <input onKeyDown={handleKeyDown} />
}
```

### 3. Combining stopPropagation and preventDefault

```tsx
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Form submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}

function Link() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Link clicked')
  }

  return (
    <div onClick={() => console.log('Parent clicked')}>
      <a href="https://example.com" onClick={handleClick}>
        Click me
      </a>
    </div>
  )
}
```

### 4. Event Delegation

```tsx
function List({ items }: { items: string[] }) {
  const handleListClick = (e: React.MouseEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'LI') {
      console.log('Item clicked:', target.textContent)
    }
  }

  return (
    <ul onClick={handleListClick}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}
```

### 5. Custom Event Handlers

```tsx
function Button() {
  const handleClick = (e: React.MouseEvent) => {
    console.log('Mouse button:', e.button)
    console.log('Coordinates:', e.clientX, e.clientY)
    console.log('Modifiers:', e.ctrlKey, e.shiftKey, e.altKey)
  }

  return <button onClick={handleClick}>Click me</button>
}

function Input() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('Key:', e.key)
    console.log('Code:', e.code)
    console.log('Modifiers:', e.ctrlKey, e.shiftKey, e.altKey)
  }

  return <input onKeyDown={handleKeyDown} />
}
```

### 6. Keyboard Shortcuts

```tsx
function Component() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      console.log('Save shortcut triggered')
    }

    if (e.key === 'Escape') {
      console.log('Escape pressed')
    }
  }

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      Press Ctrl+S to save
    </div>
  )
}
```

### 7. Drag and Drop

```tsx
function DragDrop() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Dropped at:', e.clientX, e.clientY)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      draggable
      style={{
        background: isDragging ? 'lightblue' : 'lightgray',
        padding: '20px'
      }}
    >
      Drag me
    </div>
  )
}
```

### 8. Click Outside Detection

```tsx
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef}>
      <button onClick={handleToggle}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Not Preventing Default Behavior

```tsx
// DON'T - Not preventing default
function Form() {
  const handleSubmit = () => {
    console.log('Form submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}
// Page reloads on submit!

// DO - Preventing default
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted')
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Mistake 2. Overusing stopPropagation

```tsx
// DON'T - Stopping propagation unnecessarily
function Button() {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Button clicked')
  }

  return <button onClick={handleClick}>Click</button>
}

// DO - Only stop when needed
function Button() {
  const handleClick = () => {
    console.log('Button clicked')
  }

  return <button onClick={handleClick}>Click</button>
}
```

### Mistake 3. Forgetting to Stop Propagation

```tsx
// DON'T - Not stopping propagation when needed
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div onClick={() => console.log('Parent clicked')}>
      <button onClick={handleToggle}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}
// Parent click fires when clicking dropdown!

// DO - Stopping propagation
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  return (
    <div onClick={() => console.log('Parent clicked')}>
      <button onClick={handleToggle}>Toggle</button>
      {isOpen && <div>Dropdown content</div>}
    </div>
  )
}
```

## Key Takeaways

- Use stopPropagation to prevent event bubbling
- Use preventDefault to prevent default browser behavior
- Combine both when needed
- Use event delegation for performance
- Handle keyboard events for shortcuts
- Implement drag and drop with proper event handling
- Detect clicks outside components
- Don't overuse stopPropagation
