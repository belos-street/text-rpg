---
name: animation-best-practices
description: Follow animation best practices for better UX in React.
---

# Animation Best Practices

Follow animation best practices for better UX in React.

## Common Patterns

### 1. Keep Animations Short

```tsx
// DO - Keep animations short
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

### 2. Use Appropriate Easing

```tsx
// DO - Use appropriate easing
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
    >
      Card content
    </div>
  )
}
```

### 3. Respect User Preferences

```tsx
function AnimatedComponent({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
```

### 4. Provide Feedback

```tsx
function Button({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s ease'
      }}
    >
      {isLoading ? 'Loading...' : 'Click me'}
    </button>
  )
}
```

### 5. Use Consistent Timing

```tsx
// DO - Use consistent timing
const TRANSITION_DURATION = 0.3

function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered
          ? '0 10px 20px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: `transform ${TRANSITION_DURATION}s ease, box-shadow ${TRANSITION_DURATION}s ease`
      }}
    >
      Card content
    </div>
  )
}
```

### 6. Use Subtle Animations

```tsx
// DO - Use subtle animations
function Button({ isHovered }: { isHovered: boolean }) {
  return (
    <button
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease'
      }}
    >
      Click me
    </button>
  )
}
```

### 7. Animate Purposefully

```tsx
// DO - Animate purposefully
function Notification({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
      transition={{ duration: 0.3 }}
    >
      Notification message
    </motion.div>
  )
}
```

### 8. Test Animations

```tsx
// DO - Test animations
function AnimatedComponent({ children }: { children: ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.15s ease'
      }}
    >
      {children}
    </div>
  )
}
```

## Common Mistakes

### Mistake 1. Animations Too Long

```tsx
// DON'T - Animations too long
function Button({ isActive }: { isActive: boolean }) {
  return (
    <button
      style={{
        backgroundColor: isActive ? 'blue' : 'gray',
        transition: 'background-color 1s ease'
      }}
    >
      Click me
    </button>
  )
}

// DO - Keep animations short
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

### Mistake 2. Not Respecting User Preferences

```tsx
// DON'T - Not respecting user preferences
function AnimatedComponent({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// DO - Respecting user preferences
function AnimatedComponent({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
```

### Mistake 3. Over-Animating

```tsx
// DON'T - Over-animating
function Button({ isHovered }: { isHovered: boolean }) {
  return (
    <button
      style={{
        transform: isHovered
          ? 'scale(1.2) rotate(5deg) translateX(10px) translateY(-10px)'
          : 'scale(1) rotate(0deg) translateX(0) translateY(0)',
        backgroundColor: isHovered ? 'blue' : 'gray',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0,0,0,0.3)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.5s ease'
      }}
    >
      Click me
    </button>
  )
}

// DO - Keep it subtle
function Button({ isHovered }: { isHovered: boolean }) {
  return (
    <button
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        backgroundColor: isHovered ? 'blue' : 'gray',
        transition: 'transform 0.2s ease, background-color 0.2s ease'
      }}
    >
      Click me
    </button>
  )
}
```

## Best Practices

### 1. Keep Animations Short

```tsx
// DO - Keep animations short (0.1s - 0.3s)
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

### 2. Use Appropriate Easing

```tsx
// DO - Use appropriate easing
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
    >
      Card content
    </div>
  )
}
```

### 3. Respect User Preferences

```tsx
// DO - Respect user preferences
function AnimatedComponent({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
```

### 4. Provide Feedback

```tsx
// DO - Provide feedback
function Button({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        opacity: isLoading ? 0.7 : 1,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s ease'
      }}
    >
      {isLoading ? 'Loading...' : 'Click me'}
    </button>
  )
}
```

### 5. Use Consistent Timing

```tsx
// DO - Use consistent timing
const TRANSITION_DURATION = 0.3

function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered
          ? '0 10px 20px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: `transform ${TRANSITION_DURATION}s ease, box-shadow ${TRANSITION_DURATION}s ease`
      }}
    >
      Card content
    </div>
  )
}
```

### 6. Use Subtle Animations

```tsx
// DO - Use subtle animations
function Button({ isHovered }: { isHovered: boolean }) {
  return (
    <button
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease'
      }}
    >
      Click me
    </button>
  )
}
```

### 7. Animate Purposefully

```tsx
// DO - Animate purposefully
function Notification({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
      transition={{ duration: 0.3 }}
    >
      Notification message
    </motion.div>
  )
}
```

### 8. Test Animations

```tsx
// DO - Test animations
function AnimatedComponent({ children }: { children: ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.15s ease'
      }}
    >
      {children}
    </div>
  )
}
```

## Performance Tips

### 1. Use GPU-Accelerated Properties

```tsx
// DO - Use GPU-accelerated properties
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'translateX(100px)',
        opacity: 0.5,
        transition: 'all 0.3s ease'
      }}
    >
      Content
    </div>
  )
}
```

### 2. Avoid Layout Triggers

```tsx
// DON'T - Avoid layout triggers
function AnimatedComponent() {
  return (
    <div
      style={{
        width: 200,
        height: 200,
        transition: 'all 0.3s ease'
      }}
    >
      Content
    </div>
  )
}

// DO - Use transform instead
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'scale(1.5)',
        transition: 'transform 0.3s ease'
      }}
    >
      Content
    </div>
  )
}
```

### 3. Use will-change Sparingly

```tsx
// DO - Use will-change sparingly
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'translateX(100px)',
        willChange: 'transform'
      }}
    >
      Content
    </div>
  )
}
```

## Key Takeaways

- Keep animations short (0.1s - 0.3s)
- Use appropriate easing
- Respect user preferences
- Provide feedback
- Use consistent timing
- Use subtle animations
- Animate purposefully
- Test animations
- Use GPU-accelerated properties
- Avoid layout triggers
- Use will-change sparingly
