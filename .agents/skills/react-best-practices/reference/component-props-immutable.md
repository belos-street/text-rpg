---
name: component-props-immutable
description: Never mutate props directly. Treat props as read-only and use state for changes.
---

# Props Are Immutable

Never mutate props directly. Treat props as read-only and use state for changes.

## The Problem

```tsx
// DON'T - Mutating props directly
function Counter({ count }: { count: number }) {
  const increment = () => {
    count++  // Error: Cannot assign to 'count' because it is a read-only property
  }

  return <button onClick={increment}>{count}</button>
}
```

## The Solution

```tsx
// DO - Use state for changes
function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)

  const increment = () => {
    setCount(c => c + 1)
  }

  return <button onClick={increment}>{count}</button>
}
```

## Common Scenarios

### 1. Lifting State Up

```tsx
// DON'T - Trying to mutate props
function Child({ count }: { count: number }) {
  const increment = () => {
    // count++  // Can't do this
  }
}

// DO - Parent manages state
function Parent() {
  const [count, setCount] = useState(0)

  return <Child count={count} onIncrement={() => setCount(c => c + 1)} />
}

function Child({ count, onIncrement }: { count: number; onIncrement: () => void }) {
  return <button onClick={onIncrement}>{count}</button>
}
```

### 2. Derived State from Props

```tsx
// DON'T - Trying to modify props
function UserCard({ user }: { user: User }) {
  const displayName = user.name.toUpperCase()  // This is fine - deriving new value

  return <div>{displayName}</div>
}

// DO - Use computed values or state
function UserCard({ user }: { user: User }) {
  const displayName = useMemo(() => user.name.toUpperCase(), [user.name])

  return <div>{displayName}</div>
}
```

### 3. Initializing State from Props

```tsx
// DON'T - Updating state when props change
function Input({ value }: { value: string }) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)  // Sync with props
  }, [value])

  return <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
}

// DO - Use key prop or controlled component
function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />
}

// OR - Use key for reset
function Input({ value }: { value: string }) {
  const [inputValue, setInputValue] = useState(value)

  return (
    <input
      key={value}
      value={inputValue}
      onChange={e => setInputValue(e.target.value)}
    />
  )
}
```

### 4. Array Props

```tsx
// DON'T - Mutating array props
function TodoList({ todos }: { todos: Todo[] }) {
  const addTodo = (text: string) => {
    todos.push({ id: Date.now(), text, done: false })  // Error!
  }
}

// DO - Create new array
function TodoList({ todos, onAdd }: { todos: Todo[]; onAdd: (todo: Todo) => void }) {
  const addTodo = (text: string) => {
    onAdd({ id: Date.now(), text, done: false })
  }

  return (
    <>
      <button onClick={() => addTodo('New todo')}>Add</button>
      <ul>
        {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>
    </>
  )
}
```

### 5. Object Props

```tsx
// DON'T - Mutating object props
function UserProfile({ user }: { user: User }) {
  const updateAge = (newAge: number) => {
    user.age = newAge  // Error!
  }
}

// DO - Create new object or use callback
function UserProfile({ user, onUpdate }: { user: User; onUpdate: (user: User) => void }) {
  const updateAge = (newAge: number) => {
    onUpdate({ ...user, age: newAge })
  }

  return (
    <>
      <p>Age: {user.age}</p>
      <button onClick={() => updateAge(user.age + 1)}>Update Age</button>
    </>
  )
}
```

## Common Mistakes

### Mistake 1: Direct Assignment

```tsx
// DON'T
function Component({ count }: { count: number }) {
  count = 5  // Error
}

// DO
function Component({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount)
  setCount(5)
}
```

### Mistake 2: Array Mutation

```tsx
// DON'T
function List({ items }: { items: string[] }) {
  items.push('new')  // Error
}

// DO
function List({ items, onAdd }: { items: string[]; onAdd: (item: string) => void }) {
  onAdd('new')
}
```

### Mistake 3: Object Mutation

```tsx
// DON'T
function Card({ data }: { data: Data }) {
  data.active = true  // Error
}

// DO
function Card({ data, onUpdate }: { data: Data; onUpdate: (data: Data) => void }) {
  onUpdate({ ...data, active: true })
}
```

## Key Takeaways

- Props are read-only and should never be mutated
- Use state for values that need to change
- Lift state up to parent for shared state
- Derive computed values from props using useMemo
- Initialize state from props using useState or key prop
- Pass callbacks to parent to update parent state
- Always create new arrays/objects when updating data
