---
name: animation-css-transitions
description: Use CSS transitions for smooth animations in React.
---

# CSS Transitions

Use CSS transitions for smooth animations in React.

## The Problem

```tsx
// DON'T - Not using transitions
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray'
      }}
    >
      Click me
    </button>
  )
}
// Abrupt color change!
```

## The Solution

```tsx
// DO - Using CSS transitions
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: 'background-color 0.3s ease'
      }}
    >
      Click me
    </button>
  )
}
// Smooth color transition!
```

## Common Patterns

### 1. Basic Transition

```tsx
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: 'background-color 0.3s ease'
      }}
    >
      Click me
    </button>
  )
}
```

### 2. Multiple Transitions

```tsx
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}
```

### 3. Transition with Delay

```tsx
function MenuItem({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease 0.1s'
      }}
    >
      Menu item
    </div>
  )
}
```

### 4. Conditional Transitions

```tsx
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}
```

### 5. Transition with State

```tsx
function Accordion({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease'
      }}
    >
      <p>Accordion content</p>
    </div>
  )
}
```

### 6. Transition with Class Names

```tsx
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button className={isActive ? 'active' : ''}>
      Click me
    </button>
  )
}

// CSS
// .button {
//   background-color: gray;
//   transition: background-color 0.3s ease;
// }
// .button.active {
//   background-color: blue;
// }
```

### 7. Transition with CSS-in-JS

```tsx
function Button({ isActive }: { isActive: boolean }) {
  const buttonStyle = {
    backgroundColor: isActive ? 'blue' : 'gray',
    transition: 'background-color 0.3s ease'
  }

  return <button style={buttonStyle}>Click me</button>
}
```

### 8. Transition with Tailwind CSS

```tsx
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button className={`transition-colors duration-300 ease ${isActive ? 'bg-blue-500' : 'bg-gray-500'}`}>
      Click me
    </button>
  )
}
```

## Common Mistakes

### Mistake 1. Not Using Transition

```tsx
// DON'T - Not using transition
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button style={{ backgroundColor: isActive ? 'blue' : 'gray' }}>
      Click me
    </button>
  )
}

// DO - Using transition
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: 'background-color 0.3s ease'
      }}
    >
      Click me
    </button>
  )
}
```

### Mistake 2. Not Handling Visibility

```tsx
// DON'T - Not handling visibility
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}

// DO - Handling visibility
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}
```

### Mistake 3. Using Wrong Timing Function

```tsx
// DON'T - Using wrong timing function
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s linear'
      }}
    >
      Click me
    </button>
  )
}

// DO - Using correct timing function
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
    >
      Click me
    </button>
  )
}
```

## Best Practices

### 1. Use Appropriate Duration

```tsx
// DO - Use appropriate duration
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: 'background-color 0.2s ease'
      }}
    >
      Click me
    </button>
  )
}
```

### 2. Use Correct Timing Function

```tsx
// DO - Use correct timing function
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
    >
      Click me
    </button>
  )
}
```

### 3. Use Hardware Acceleration

```tsx
// DO - Use hardware acceleration
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
        willChange: 'transform'
      }}
    >
      Card content
    </div>
  )
}
```

### 4. Use CSS Variables

```tsx
// DO - Use CSS variables
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        '--transition-duration': '0.3s',
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: `background-color var(--transition-duration) ease`
      } as React.CSSProperties}
    >
      Click me
    </button>
  )
}
```

## Performance Tips

### 1. Animate Transform and Opacity

```tsx
// DO - Animate transform and opacity
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        opacity: isHovered ? 1 : 0.8,
        transition: 'transform 0.3s ease, opacity 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}
```

### 2. Avoid Layout Triggers

```tsx
// DON'T - Avoid layout triggers
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        width: isHovered ? '200px' : '180px',
        height: isHovered ? '200px' : '180px',
        transition: 'width 0.3s ease, height 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}

// DO - Use transform instead
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}
```

### 3. Use will-change

```tsx
// DO - Use will-change sparingly
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease',
        willChange: 'transform'
      }}
    >
      Card content
    </div>
  )
}
```

## Key Takeaways

- Use transitions for smooth state changes
- Use appropriate duration
- Use correct timing function
- Animate transform and opacity
- Avoid layout triggers
- Use hardware acceleration
- Handle visibility properly
- Use CSS variables
- Use will-change sparingly
