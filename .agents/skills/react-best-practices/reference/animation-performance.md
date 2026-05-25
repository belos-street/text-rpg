---
name: animation-performance
description: Optimize animations for better performance in React.
---

# Animation Performance

Optimize animations for better performance in React.

## The Problem

```tsx
// DON'T - Poor performance animation
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        width: isHovered ? 220 : 200,
        height: isHovered ? 220 : 200,
        margin: isHovered ? 10 : 20,
        transition: 'all 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}
// Triggers layout on every frame!
```

## The Solution

```tsx
// DO - Optimized animation
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
// Uses GPU acceleration!
```

## Common Patterns

### 1. Use Transform Instead of Layout Properties

```tsx
// DON'T - Using layout properties
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        width: isHovered ? 220 : 200,
        height: isHovered ? 220 : 200,
        transition: 'width 0.3s ease, height 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}

// DO - Using transform
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

### 2. Use Opacity Instead of Visibility

```tsx
// DON'T - Using visibility
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'visibility 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}

// DO - Using opacity
function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease'
      }}
    >
      Modal content
    </div>
  )
}
```

### 3. Use will-change Sparingly

```tsx
// DO - Use will-change sparingly
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease',
        willChange: 'transform'
      }}
    >
      Card content
    </div>
  )
}
```

### 4. Use requestAnimationFrame

```tsx
function SmoothScroll() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <div>Scroll position: {scrollY}</div>
}
```

### 5. Use CSS Transforms for Animations

```tsx
// DO - Use CSS transforms
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'translateX(100px) rotate(45deg) scale(1.5)',
        transition: 'transform 0.3s ease'
      }}
    >
      Content
    </div>
  )
}
```

### 6. Avoid Expensive Properties

```tsx
// DON'T - Avoid expensive properties
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        boxShadow: isHovered
          ? '0 10px 20px rgba(0,0,0,0.2)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s ease'
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
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'transform 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}
```

### 7. Use CSS Variables for Dynamic Values

```tsx
// DO - Use CSS variables
function AnimatedComponent({ value }: { value: number }) {
  return (
    <div
      style={{
        '--rotation': `${value}deg`,
        transform: `rotate(var(--rotation))`,
        transition: 'transform 0.3s ease'
      } as React.CSSProperties}
    >
      Content
    </div>
  )
}
```

### 8. Use Offscreen Canvas for Complex Animations

```tsx
function ComplexAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Draw complex animation
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return <canvas ref={canvasRef} width={800} height={600} />
}
```

## Common Mistakes

### Mistake 1. Using Layout Properties

```tsx
// DON'T - Using layout properties
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        width: isHovered ? 220 : 200,
        height: isHovered ? 220 : 200,
        transition: 'all 0.3s ease'
      }}
    >
      Card content
    </div>
  )
}

// DO - Using transform
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

### Mistake 2. Not Using requestAnimationFrame

```tsx
// DON'T - Not using requestAnimationFrame
function SmoothScroll() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return <div>Scroll position: {scrollY}</div>
}

// DO - Using requestAnimationFrame
function SmoothScroll() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <div>Scroll position: {scrollY}</div>
}
```

### Mistake 3. Overusing will-change

```tsx
// DON'T - Overusing will-change
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        willChange: 'transform, opacity, width, height, margin'
      }}
    >
      Card content
    </div>
  )
}

// DO - Using will-change sparingly
function Card({ isHovered }: { isHovered: boolean }) {
  return (
    <div
      style={{
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        willChange: 'transform'
      }}
    >
      Card content
    </div>
  )
}
```

## Best Practices

### 1. Use GPU-Accelerated Properties

```tsx
// DO - Use GPU-accelerated properties
function AnimatedComponent() {
  return (
    <div
      style={{
        transform: 'translateX(100px) rotate(45deg) scale(1.5)',
        opacity: 0.5,
        transition: 'all 0.3s ease'
      }}
    >
      Content
    </div>
  )
}
```

### 2. Use requestAnimationFrame

```tsx
// DO - Use requestAnimationFrame
function SmoothScroll() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <div>Scroll position: {scrollY}</div>
}
```

### 3. Use CSS Variables

```tsx
// DO - Use CSS variables
function AnimatedComponent({ value }: { value: number }) {
  return (
    <div
      style={{
        '--rotation': `${value}deg`,
        transform: `rotate(var(--rotation))`,
        transition: 'transform 0.3s ease'
      } as React.CSSProperties}
    >
      Content
    </div>
  )
}
```

### 4. Use Offscreen Canvas

```tsx
// DO - Use offscreen canvas
function ComplexAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return <canvas ref={canvasRef} width={800} height={600} />
}
```

## Performance Tips

### 1. Animate Transform and Opacity

```tsx
// DO - Animate transform and opacity
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

- Use transform instead of layout properties
- Use opacity instead of visibility
- Use requestAnimationFrame
- Use GPU-accelerated properties
- Avoid expensive properties
- Use CSS variables
- Use offscreen canvas
- Use will-change sparingly
- Animate transform and opacity
- Avoid layout triggers
