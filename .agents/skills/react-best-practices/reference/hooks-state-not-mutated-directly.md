---
name: hooks-state-not-mutated-directly
description: Never mutate state directly in React. Always create a new object/array when updating state.
---

# Never Mutate State Directly

React state should be treated as immutable. Never modify state directly - always create a new copy.

## The Problem

```tsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false }
  ])

  const addTodo = (text: string) => {
    // DON'T - Mutating state directly
    todos.push({ id: Date.now(), text, done: false })
    setTodos(todos)  // React won't detect the change!
  }

  return <ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```

## The Solution: Immutability

```tsx
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React', done: false }
  ])

  const addTodo = (text: string) => {
    // DO - Create a new array
    setTodos([...todos, { id: Date.now(), text, done: false }])
  }

  return <ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```

## Array Operations

### Adding Items

```tsx
// Add to end
setTodos([...todos, newTodo])

// Add to beginning
setTodos([newTodo, ...todos])

// Add at specific index
setTodos([
  ...todos.slice(0, index),
  newTodo,
  ...todos.slice(index)
])
```

### Removing Items

```tsx
// Remove by index
setTodos(todos.filter((_, i) => i !== index))

// Remove by id
setTodos(todos.filter(todo => todo.id !== id))

// Remove first item
setTodos(todos.slice(1))

// Remove last item
setTodos(todos.slice(0, -1))
```

### Updating Items

```tsx
// Update by index
setTodos(todos.map((todo, i) =>
  i === index ? { ...todo, done: !todo.done } : todo
))

// Update by id
setTodos(todos.map(todo =>
  todo.id === id ? { ...todo, done: !todo.done } : todo
))

// Update all items
setTodos(todos.map(todo => ({ ...todo, done: true })))
```

### Reordering Items

```tsx
// Move item from one index to another
function moveItem(fromIndex: number, toIndex: number) {
  const newTodos = [...todos]
  const [removed] = newTodos.splice(fromIndex, 1)
  newTodos.splice(toIndex, 0, removed)
  setTodos(newTodos)
}
```

## Object Operations

### Updating Nested Properties

```tsx
function UserProfile() {
  const [user, setUser] = useState({
    name: 'Alice',
    profile: {
      age: 25,
      address: {
        city: 'New York',
        country: 'USA'
      }
    }
  })

  const updateAge = (newAge: number) => {
    // DON'T - Mutating directly
    user.profile.age = newAge
    setUser(user)

    // DO - Create new objects
    setUser({
      ...user,
      profile: {
        ...user.profile,
        age: newAge
      }
    })
  }

  const updateCity = (newCity: string) => {
    setUser({
      ...user,
      profile: {
        ...user.profile,
        address: {
          ...user.profile.address,
          city: newCity
        }
      }
    })
  }
}
```

### Using Immer for Complex Updates

```tsx
import { produce } from 'immer'

function UserProfile() {
  const [user, setUser] = useState({
    name: 'Alice',
    profile: {
      age: 25,
      address: {
        city: 'New York',
        country: 'USA'
      }
    }
  })

  const updateCity = (newCity: string) => {
    setUser(produce(user, draft => {
      draft.profile.address.city = newCity
    }))
  }
}
```

## Common Mistakes

### Mistake 1: Push/Pop/Shift/Unshift

```tsx
// DON'T
todos.push(newTodo)
todos.pop()
todos.shift()
todos.unshift(newTodo)

// DO
setTodos([...todos, newTodo])
setTodos(todos.slice(0, -1))
setTodos(todos.slice(1))
setTodos([newTodo, ...todos])
```

### Mistake 2: Splice

```tsx
// DON'T
todos.splice(index, 1)

// DO
setTodos(todos.filter((_, i) => i !== index))
```

### Mistake 3: Sort/Reverse

```tsx
// DON'T - Mutates in place
todos.sort((a, b) => a.id - b.id)

// DO - Creates new array
setTodos([...todos].sort((a, b) => a.id - b.id))
```

### Mistake 4: Direct Property Assignment

```tsx
// DON'T
user.name = 'Bob'
user.profile.age = 30

// DO
setUser({ ...user, name: 'Bob' })
setUser({ ...user, profile: { ...user.profile, age: 30 } })
```

## Why Immutability Matters

### 1. Change Detection

```tsx
// React uses shallow comparison
const prev = { id: 1 }
const next = { id: 1 }

console.log(prev === next)  // false - different references

// React can detect changes
const prev = { id: 1 }
const next = prev  // same reference

console.log(prev === next)  // true - no change detected
```

### 2. Performance Optimizations

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  // Only re-renders when todo reference changes
  return <li>{todo.text}</li>
}

// With immutable updates, React can optimize
```

### 3. Time Travel Debugging

```tsx
// Immutable state makes undo/redo easy
const history = [state1, state2, state3]
const currentState = history[history.length - 1]
```

## Key Takeaways

- Never mutate state directly in React
- Always create new objects/arrays when updating state
- Use spread operator (...) for shallow copies
- Use map/filter for array transformations
- Consider Immer for complex nested updates
- Immutability enables better performance and debugging
