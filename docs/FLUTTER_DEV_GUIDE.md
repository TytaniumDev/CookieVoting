# The Flutter Developer's Guide to Looking at This Codebase

Welcome! If you speak **Dart/Flutter**, this guide will help you read this **TypeScript/React** codebase fluently.

---

## 🗺️ The Architecture: 10,000 Ft View

We use a **Functional, Component-Based** architecture. Classes are rarely used.

| Concept              | This App (React)                      | Flutter Equivalent                        |
| :------------------- | :------------------------------------ | :---------------------------------------- |
| **Framework**        | **React 19**                          | **Flutter**                               |
| **Language**         | **TypeScript**                        | **Dart**                                  |
| **UI Definition**    | **JSX** (`<div>...</div>`)            | **Widget Tree** (`Container(child: ...)`) |
| **Routing**          | **React Router (`react-router-dom`)** | **Navigator 2.0 / GoRouter**              |
| **State Management** | **Zustand**                           | **Riverpod / Provider**                   |
| **Styling**          | **Tailwind CSS** (Utility classes)    | **BoxDecoration / Theme.of(context)**     |
| **Backend**          | **Firebase**                          | **Firebase** (Identical SDK structure)    |

---

## 🏗️ Project Structure Mapping

This project follows a "Clean Architecture" style, similar to what you might see in a scaling Flutter app.

| Directory          | Purpose                        | Flutter Equivalent                 |
| :----------------- | :----------------------------- | :--------------------------------- |
| `src/main.tsx`     | Entry point                    | `void main() => runApp(App);`      |
| `src/App.tsx`      | Specific Routing / Theme Setup | `MaterialApp.router(...)`          |
| `src/pages/`       | Top-level Screens              | `lib/screens/` or `lib/ui/pages/`  |
| `src/components/`  | Reusable UI widgets            | `lib/widgets/`                     |
| `src/lib/stores/`  | Global State containers        | `lib/providers/` or `lib/blocs/`   |
| `src/lib/hooks/`   | Business Logic / Controllers   | `lib/controllers/` or Custom Hooks |
| `src/lib/types.ts` | Data Models / Interfaces       | `lib/models/`                      |

---

## 🔄 App Deep Dive

### 1. Routing (`src/App.tsx`)

In Flutter, you define routes in `MaterialApp`. In React, we use `BrowserRouter`.

**React:**

```tsx
// App.tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="vote/:eventId" element={<VotingPage />} />
</Routes>
```

**Flutter:**

```dart
// GoRouter config
GoRoute(path: '/', builder: (_, __) => HomeScreen()),
GoRoute(path: '/vote/:eventId', builder: (_, state) => VotingPage(id: state.params['eventId'])),
```

> **Note:** We use `lazy(() => import(...))` and `Suspense`. This is "Lazy Loading" (Code Splitting). In Flutter, all code is usually compiled into one binary (unless using deferred loading), but web apps download code in chunks to be faster.

### 2. State Management

This app uses **Zustand**. It is extremely similar to **Riverpod** (global, decoupling state from UI).

#### Global State Example: `useAuthStore.ts`

**Zustand (This App):**

```typescript
export const useAuthStore = create((set) => ({
  user: null,
  signIn: async () => {
    set({ loading: true });
    await firebaseSignIn();
    set({ loading: false });
  },
}));
```

**Riverpod (Flutter):**

```dart
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(Initial());
  Future<void> signIn() async {
    state = Loading();
    await firebaseSignIn();
    state = Loaded();
  }
}
```

#### Consuming State in UI

**React:**

```typescript
const user = useAuthStore((state) => state.user);
```

**Flutter:**

```dart
final user = ref.watch(authProvider.select((s) => s.user));
```

### 3. Local State & Controllers (`Hooks`)

We don't use `TextEditingController` or `AnimationController` classes. We use **Hooks**.

**The "Controller" Pattern:**
Look at `src/lib/hooks/useVotingFlow.ts`. This file manages the logic for `VotingPage.tsx`.

- It holds state (`useState` ≈ `ValueNotifier`)
- It exposes methods (`handleVote`)
- It handles lifecycle (`useEffect` ≈ `initState`)

**React Hook:**

```typescript
const [count, setCount] = useState(0);
// count is the value, setCount is the setter.
```

**Flutter:**

```dart
final count = ValueNotifier<int>(0);
// count.value, count.value = x
```

### 4. Side Effects (`useEffect`)

The biggest mental shift. `useEffect` replaces `initState`, `didUpdateWidget`, and `dispose`.

**React:**

```typescript
useEffect(() => {
  console.log('Component mounted');
  const timer = setInterval(tick, 1000);

  return () => {
    console.log('Component unmounting');
    clearInterval(timer); // Clean up!
  };
}, []); // Empty array = "run once on mount"
```

**Flutter:**

```dart
@override
void initState() {
  super.initState();
  print('Component mounted');
  timer = Timer.periodic(tik);
}
@override
void dispose() {
  timer.cancel(); // Clean up!
  super.dispose();
}
```

---

## 🎨 UI & Styling

### 1. JSX vs Widget Tree

You write code that _looks_ like HTML, but it's actually JavaScript syntax extension (JSX).

**React:**

```tsx
<div className="p-4 bg-white">
  <h1>Hello {name}</h1>
  <button onClick={handleTap}>Tap me</button>
</div>
```

**Flutter:**

```dart
Container(
  padding: EdgeInsets.all(16),
  color: Colors.white,
  child: Column(
    children: [
      Text('Hello $name', style: TextStyle(fontSize: 32)),
      GestureDetector(onTap: handleTap, child: Text('Tap me')),
    ],
  ),
)
```

### 2. Props vs Constructor Args

Data flows **down**.

**React:**

```tsx
// Definition
function CookieCard({ name, price, onBuy }: CookieCardProps) { ... }

// Usage
<CookieCard name="Choc Chip" price={2.50} onBuy={...} />
```

**Flutter:**

```dart
// Definition
class CookieCard extends StatelessWidget {
  final String name;
  final double price;
  final VoidCallback onBuy;
  const CookieCard({required this.name, ...});
}

// Usage
CookieCard(name: 'Choc Chip', price: 2.50, onBuy: ...);
```

### 3. Tailwind CSS

We don't use `BoxDecoration` objects. We use utility strings.

- `flex` = `Row` / `Column`
- `justify-center` = `MainAxisAlignment.center`
- `items-center` = `CrossAxisAlignment.center`
- `p-4` = `Padding(padding: EdgeInsets.all(16))` (1 unit = 4px usually)
- `bg-red-500` = `color: Colors.red[500]`

Example:

```tsx
<div className="flex justify-center items-center h-screen bg-black text-white">Loading...</div>
```

Is exactly:

```dart
Container(
  color: Colors.black,
  child: Center(
    child: Text('Loading...', style: TextStyle(color: Colors.white)),
  ),
)
```

(Assuming `h-screen` makes it fill the screen).

---

## ⚡️ Cheat Sheet

- **`useState`** ➡ Local state (`setState` / `ValueNotifier`).
- **`useEffect`** ➡ Lifecycle (`initState` / `dispose`).
- **`useRef`** ➡ Persistent logic that doesn't trigger rebuilds (like storing a `Timer` or `FocusNode`).
- **`useMemo`** ➡ Caching expensive calculations.
- **`useCallback`** ➡ Preventing functions from being re-created on every rebuild.
- **`Zustand`** ➡ Global State (`Riverpod`).
