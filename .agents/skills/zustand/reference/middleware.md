# Middleware

Learn how to use Zustand middleware for enhanced functionality.

## DevTools Middleware

Integrate with Redux DevTools for debugging:

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    { name: 'CounterStore' }
  )
)
```

## Persist Middleware

Persist state to localStorage:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
)
```

### Persist with Partial State

Persist only specific parts of the state:

```ts
const useStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
```

### Persist with Custom Storage

Use custom storage (e.g., AsyncStorage for React Native):

```ts
const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

## Immer Middleware

Use Immer for easier immutable updates:

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  immer((set) => ({
    todos: [],
    
    addTodo: (text) => set((state) => {
      state.todos.push({ id: Date.now(), text, completed: false })
    }),
    
    removeTodo: (id) => set((state) => {
      state.todos = state.todos.filter((todo) => todo.id !== id)
    }),
    
    toggleTodo: (id) => set((state) => {
      const todo = state.todos.find((t) => t.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    }),
    
    updateTodo: (id, updates) => set((state) => {
      const todo = state.todos.find((t) => t.id === id)
      if (todo) {
        Object.assign(todo, updates)
      }
    }),
  }))
)
```

## Combining Multiple Middleware

Combine multiple middleware:

```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
      }),
      { name: 'user-storage' }
    ),
    { name: 'UserStore' }
  )
)
```

## Combining with Immer

Combine Immer with other middleware:

```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        todos: [],
        addTodo: (text) => set((state) => {
          state.todos.push({ id: Date.now(), text, completed: false })
        }),
      })),
      { name: 'todo-storage' }
    ),
    { name: 'TodoStore' }
  )
)
```

## Custom Middleware

Create custom middleware:

```ts
import { create } from 'zustand'

const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    api
  )

const useStore = create(
  logger((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
)
```

## Best Practices

1. **Use devtools**: For debugging and time-travel
2. **Persist important state**: Save user preferences and auth
3. **Use Immer**: For complex state updates
4. **Combine middleware**: Use multiple middleware together
5. **Custom middleware**: Create reusable middleware for common patterns

## Common Mistakes

❌ **Not using persist for important state**

```ts
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
})) // ❌ Lost on refresh
```

✅ **Using persist for important state**

```ts
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: 'user-storage' }
  )
) // ✅ Persisted
```

❌ **Mutating state directly**

```ts
const useStore = create((set) => ({
  todos: [],
  addTodo: (text) => set((state) => {
    state.todos.push({ id: Date.now(), text }) // ❌ Mutation
    return state
  }),
}))
```

✅ **Using Immer for mutations**

```ts
import { immer } from 'zustand/middleware/immer'

const useStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((state) => {
      state.todos.push({ id: Date.now(), text }) // ✅ Allowed with Immer
    }),
  }))
)
```

❌ **Persisting everything**

```ts
const useStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
    }),
    { name: 'storage' }
  ) // ❌ Persists loading states
)
```

✅ **Persisting only necessary state**

```ts
const useStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
    }),
    {
      name: 'storage',
      partialize: (state) => ({ user: state.user }), // ✅ Only persist user
    }
  )
)
```
