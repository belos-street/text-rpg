# Selectors

Learn how to use selectors for efficient state subscriptions in Zustand.

## Basic Selectors

Subscribe to a single piece of state:

```tsx
function CountDisplay() {
  const count = useCounterStore((state) => state.count)
  return <p>Count: {count}</p>
}
```

## Multiple Selectors

Subscribe to multiple pieces of state:

```tsx
function UserInfo() {
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

## Object Selectors

Subscribe to multiple values as an object:

```tsx
function UserCard() {
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

> ⚠️ **Note**: Object selectors create a new object on every render, which may cause unnecessary re-renders. Use [shallow equality](#shallow-equality) to optimize:

## Shallow Equality

Use shallow equality for object selectors to avoid unnecessary re-renders:

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

## Computed Selectors

Create computed selectors outside components:

```ts
const useTodoStore = create((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, completed: false }]
  })),
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })),
}))

const activeTodosSelector = (state) => state.todos.filter((todo) => !todo.completed)
const completedTodosSelector = (state) => state.todos.filter((todo) => todo.completed)
const todoCountSelector = (state) => state.todos.length
```

```tsx
function ActiveTodos() {
  const activeTodos = useTodoStore(activeTodosSelector)
  return <ul>{activeTodos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>
}

function CompletedTodos() {
  const completedTodos = useTodoStore(completedTodosSelector)
  return <ul>{completedTodos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```

## Selector Functions

Create reusable selector functions:

```ts
interface User {
  id: number
  name: string
}

interface UserState {
  users: User[]
  addUser: (user: User) => void
}

const useUserStore = create<UserState>((set) => ({
  users: [],
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
}))

const selectUserById = (id: number) => (state: UserState) =>
  state.users.find((user) => user.id === id)
```

```tsx
function UserDetail({ userId }: { userId: number }) {
  const user = useUserStore(selectUserById(userId))
  return <div>{user?.name}</div>
}
```

## Memoized Selectors

Memoize expensive computations:

```ts
import { createSelector } from 'zustand'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface TodoState {
  todos: Todo[]
  filter: 'all' | 'active' | 'completed'
  setFilter: (filter: 'all' | 'active' | 'completed') => void
}

const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}))

const filteredTodosSelector = createSelector(
  [(state) => state.todos, (state) => state.filter],
  (todos, filter) => {
    if (filter === 'active') return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) => t.completed)
    return todos
  }
)
```

```tsx
function TodoList() {
  const filteredTodos = useTodoStore(filteredTodosSelector)
  return <ul>{filteredTodos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```

## Conditional Selectors

Subscribe conditionally:

```tsx
function UserComponent({ showEmail }: { showEmail: boolean }) {
  const name = useUserStore((state) => state.name)
  const email = useUserStore((state) => showEmail ? state.email : null)
  
  return (
    <div>
      <h3>{name}</h3>
      {showEmail && <p>{email}</p>}
    </div>
  )
}
```

## Best Practices

1. **Use selective subscription**: Subscribe only to what you need
2. **Use shallow equality**: For object selectors
3. **Create reusable selectors**: For common patterns
4. **Memoize expensive computations**: For performance
5. **Keep selectors simple**: Avoid complex logic in selectors

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

❌ **Complex selector logic**

```tsx
function TodoList() {
  const filteredTodos = useTodoStore((state) => {
    const filtered = state.todos.filter((todo) => {
      if (state.filter === 'active') return !todo.completed
      if (state.filter === 'completed') return todo.completed
      return true
    })
    return filtered.sort((a, b) => a.id - b.id) // ❌ Complex logic in selector
  })
  return <ul>{filteredTodos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```

✅ **Extract selector logic**

```ts
const filteredTodosSelector = createSelector(
  [(state) => state.todos, (state) => state.filter],
  (todos, filter) => {
    if (filter === 'active') return todos.filter((t) => !t.completed)
    if (filter === 'completed') return todos.filter((t) => t.completed)
    return todos.sort((a, b) => a.id - b.id)
  }
)

function TodoList() {
  const filteredTodos = useTodoStore(filteredTodosSelector) // ✅ Clean selector
  return <ul>{filteredTodos.map((todo) => <li key={todo.id}>{todo.text}</li>)}</ul>
}
```
