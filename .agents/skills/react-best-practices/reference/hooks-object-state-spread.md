---
name: hooks-object-state-spread
description: Use spread operator to update object state while preserving other properties.
---

# Object State Spread

When updating object state, use the spread operator to preserve existing properties while updating specific ones.

## Basic Pattern

```tsx
function UserProfile() {
  const [user, setUser] = useState({
    name: 'Alice',
    age: 25,
    email: 'alice@example.com'
  })

  const updateName = (newName: string) => {
    // DO - Spread to preserve other properties
    setUser({
      ...user,
      name: newName
    })
  }

  const updateAge = (newAge: number) => {
    setUser({
      ...user,
      age: newAge
    })
  }

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

## Common Mistake

```tsx
// DON'T - Overwrites all properties
function UserProfile() {
  const [user, setUser] = useState({
    name: 'Alice',
    age: 25,
    email: 'alice@example.com'
  })

  const updateName = (newName: string) => {
    setUser({
      name: newName
      // age and email are lost!
    })
  }
}
```

## Updating Multiple Properties

```tsx
function Form() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: 0
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      [name]: value
    })
  }

  return (
    <form>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
      />
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleInputChange}
      />
    </form>
  )
}
```

## Nested Objects

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

## Functional Updates with Objects

```tsx
function Counter() {
  const [state, setState] = useState({
    count: 0,
    doubled: 0
  })

  const increment = () => {
    setState(prev => ({
      ...prev,
      count: prev.count + 1,
      doubled: (prev.count + 1) * 2
    }))
  }

  return <div>{state.count} - {state.doubled}</div>
}
```

## Conditional Updates

```tsx
function UserProfile() {
  const [user, setUser] = useState({
    name: 'Alice',
    age: 25,
    email: null as string | null
  })

  const setEmail = (email: string) => {
    setUser(prev => ({
      ...prev,
      email: email || null
    }))
  }

  const clearEmail = () => {
    setUser(prev => ({
      ...prev,
      email: null
    }))
  }
}
```

## Resetting State

```tsx
function Form() {
  const initialState = {
    name: '',
    email: '',
    message: ''
  }

  const [formData, setFormData] = useState(initialState)

  const resetForm = () => {
    setFormData(initialState)
  }

  const resetPartial = () => {
    setFormData({
      ...formData,
      message: ''
    })
  }
}
```

## Adding New Properties

```tsx
function DynamicForm() {
  const [data, setData] = useState<Record<string, string>>({
    field1: 'value1'
  })

  const addField = (name: string, value: string) => {
    setData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const removeField = (name: string) => {
    setData(prev => {
      const { [name]: removed, ...rest } = prev
      return rest
    })
  }
}
```

## Common Patterns

### Toggle Boolean

```tsx
function Toggle() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false
  })

  const toggleNotifications = () => {
    setSettings(prev => ({
      ...prev,
      notifications: !prev.notifications
    }))
  }
}
```

### Increment/Decrement

```tsx
function Counter() {
  const [state, setState] = useState({
    count: 0,
    step: 1
  })

  const increment = () => {
    setState(prev => ({
      ...prev,
      count: prev.count + prev.step
    }))
  }

  const updateStep = (newStep: number) => {
    setState(prev => ({
      ...prev,
      step: newStep
    }))
  }
}
```

### Array in Object

```tsx
function TodoApp() {
  const [state, setState] = useState({
    todos: [] as Todo[],
    filter: 'all'
  })

  const addTodo = (text: string) => {
    setState(prev => ({
      ...prev,
      todos: [...prev.todos, { id: Date.now(), text, done: false }]
    }))
  }

  const setFilter = (filter: string) => {
    setState(prev => ({
      ...prev,
      filter
    }))
  }
}
```

## Using Immer for Complex Updates

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

## Key Takeaways

- Always use spread operator to preserve existing properties
- Order matters: spread first, then override specific properties
- For nested objects, spread at each level
- Use functional updates when new state depends on previous state
- Consider Immer for deeply nested objects
- Never directly mutate state properties
