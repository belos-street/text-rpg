# Store Definition and Basic Usage

Learn how to create and use Zustand stores.

## Creating a Store

```ts
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

## Using the Store in Components

```tsx
import { useCounterStore } from './store'

function Counter() {
  const { count, increment, decrement, reset } = useCounterStore()
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

## Selective Subscription

Subscribe only to the state you need to avoid unnecessary re-renders:

```tsx
function CountDisplay() {
  const count = useCounterStore((state) => state.count)
  return <p>Count: {count}</p>
}

function Controls() {
  const { increment, decrement } = useCounterStore()
  return (
    <>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </>
  )
}
```

## Multiple Selectors

```tsx
function UserCard() {
  const name = useUserStore((state) => state.name)
  const email = useUserStore((state) => state.email)
  
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}
```

## Object Selector

```tsx
function UserInfo() {
  const { name, email } = useUserStore((state) => ({
    name: state.name,
    email: state.email
  }))
  
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}
```

## Equality Function

Use shallow equality for object selectors:

```ts
import { shallow } from 'zustand/shallow'

function UserCard() {
  const { name, email } = useUserStore(
    (state) => ({ name: state.name, email: state.email }),
    shallow
  )
  
  return (
    <div>
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  )
}
```

## Store with Initial State

```ts
interface TodoState {
  todos: Todo[]
  addTodo: (text: string) => void
  removeTodo: (id: number) => void
}

const useTodoStore = create<TodoState>((set) => ({
  todos: [
    { id: 1, text: 'Learn Zustand', completed: false },
    { id: 2, text: 'Build something cool', completed: false }
  ],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, completed: false }]
  })),
  removeTodo: (id) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id)
  })),
}))
```

## Best Practices

1. **Use TypeScript**: Define interfaces for your state
2. **Selective subscription**: Subscribe only to what you need
3. **Shallow equality**: Use shallow for object selectors
4. **Keep stores focused**: One store per domain
5. **Use descriptive names**: Clear action names

## Common Mistakes

❌ **Not using selectors**

```tsx
function Counter() {
  const store = useCounterStore() // ❌ Re-renders on any change
  return <p>{store.count}</p>
}
```

✅ **Using selectors**

```tsx
function Counter() {
  const count = useCounterStore((state) => state.count) // ✅ Only re-renders when count changes
  return <p>{count}</p>
}
```

❌ **Not using shallow equality**

```tsx
function UserCard() {
  const { name, email } = useUserStore((state) => ({
    name: state.name,
    email: state.email
  })) // ❌ Re-renders on any change
  return <div>{name} - {email}</div>
}
```

✅ **Using shallow equality**

```tsx
import { shallow } from 'zustand/shallow'

function UserCard() {
  const { name, email } = useUserStore(
    (state) => ({ name: state.name, email: state.email }),
    shallow // ✅ Only re-renders when name or email changes
  )
  return <div>{name} - {email}</div>
}
```
