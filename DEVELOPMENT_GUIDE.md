# Development Guide

This guide provides comprehensive instructions for understanding and developing this ecommerce platform from scratch. It covers architecture, setup, development workflow, and best practices.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Initial Setup](#initial-setup)
4. [Database Setup](#database-setup)
5. [Frontend Development](#frontend-development)
6. [Backend Integration](#backend-integration)
7. [Payment Integration](#payment-integration)
8. [State Management](#state-management)
9. [Styling and UI](#styling-and-ui)
10. [Testing and Debugging](#testing-and-debugging)
11. [Deployment](#deployment)
12. [Best Practices](#best-practices)

---

## Project Overview

This is a modern ecommerce platform built with a React frontend and Supabase backend. The application follows a component-based architecture with clear separation of concerns.

### Key Principles
- **Type Safety**: Full TypeScript implementation
- **Component Reusability**: Modular, reusable components
- **State Management**: Context API for global state
- **Data Fetching**: TanStack Query for efficient data management
- **Security**: Row Level Security and role-based access control
- **Performance**: Optimized queries, lazy loading, and code splitting

---

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│           React Application              │
├─────────────────────────────────────────┤
│  App.tsx (Root Component)               │
│  ├── QueryClientProvider                 │
│  ├── BrowserRouter                       │
│  ├── AuthProvider                        │
│  ├── CartProvider                        │
│  ├── ThemeProvider                       │
│  └── Routes                              │
│      ├── Public Routes                   │
│      └── Protected Routes                │
└─────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Component
2. **Component** → Context/Hook
3. **Hook** → Supabase Client
4. **Supabase Client** → Database/API
5. **Response** → TanStack Query Cache
6. **Cache Update** → Component Re-render

### Component Hierarchy

```
App
├── Header (Navigation)
├── Routes
│   ├── Index (Home)
│   ├── Products
│   ├── ProductDetail
│   ├── Cart
│   ├── Checkout
│   ├── Auth
│   ├── Orders
│   ├── Settings
│   └── Admin Routes
└── Toaster (Notifications)
```

---

## Initial Setup

### Step 1: Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm/yarn/bun** (package manager)
- **Git** (version control)
- **VS Code** (recommended editor with extensions)

### Step 2: Project Initialization

```bash
# Clone the repository
git clone <repository-url>
cd Ecommerce

# Install dependencies
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Optional: Development settings
VITE_APP_ENV=development
```

**Important**: Never commit `.env` files to version control. They are already in `.gitignore`.

### Step 4: Verify Setup

```bash
# Start development server
npm run dev

# Should start on http://localhost:8080
```

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### Step 2: Run Migrations

Migrations are located in `supabase/migrations/`. They must be run in chronological order:

1. **20251111110946_bda723fd-3b91-43ef-bfe9-839c003ea66e.sql**
   - Creates core tables (profiles, products, orders, etc.)
   - Sets up RLS policies
   - Creates helper functions

2. **20251220110604_9332d958-8135-4811-9d06-fd862a287642.sql**
   - Additional schema updates

3. **20251221051922_f58e151c-2544-468c-8ca2-dc2355959be9.sql**
   - Additional schema updates

4. **20251221052137_7ae3ba6b-11de-409c-9ce0-295686607ad9.sql**
   - Additional schema updates

5. **20251222165022_b20055a7-88e3-45a2-bd81-9846969d7ff7.sql**
   - Additional schema updates

6. **20251223042725_22d99cf4-856d-4230-93c1-2f46d4156eb1.sql**
   - Creates product_reviews table

**To run migrations:**
- Use Supabase Dashboard → SQL Editor
- Copy and paste each migration file in order
- Execute each migration

### Step 3: Database Schema Overview

#### Core Tables

**profiles**
```sql
- id (UUID, PK, references auth.users)
- email (TEXT)
- full_name (TEXT)
- avatar_url (TEXT)
- theme_mode (TEXT: 'light'|'dark')
- custom_accent_color (TEXT)
- created_at, updated_at
```

**products**
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- category (ENUM: 'shirts'|'pants'|'outerwear')
- base_price (DECIMAL)
- image_url (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at
```

**product_variants**
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- size (TEXT)
- color (TEXT)
- stock_quantity (INTEGER)
- price_adjustment (DECIMAL)
- created_at, updated_at
- UNIQUE(product_id, size, color)
```

**orders**
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- status (TEXT: 'pending'|'processing'|'shipped'|'delivered'|'cancelled')
- subtotal (DECIMAL)
- shipping_cost (DECIMAL)
- total (DECIMAL)
- shipping_address (JSONB)
- payment_method (TEXT)
- created_at, updated_at
```

**order_items**
```sql
- id (UUID, PK)
- order_id (UUID, FK → orders)
- product_id (UUID, FK → products)
- variant_id (UUID, FK → product_variants)
- product_name (TEXT)
- variant_details (JSONB)
- quantity (INTEGER)
- unit_price (DECIMAL)
- total_price (DECIMAL)
- created_at
```

**product_reviews**
```sql
- id (UUID, PK)
- product_id (UUID, FK → products)
- user_id (UUID)
- rating (INTEGER: 1-5)
- title (TEXT)
- content (TEXT)
- created_at, updated_at
- UNIQUE(product_id, user_id)
```

### Step 4: Row Level Security (RLS)

RLS policies are automatically created in migrations. Key policies:

- **Products**: Public read for active products, admin write
- **Orders**: Users can only see their own orders
- **Reviews**: Users can create/update their own reviews
- **Admin Access**: Admins have full access via `has_role()` function

### Step 5: Create Admin User

To create an admin user:

```sql
-- After user signs up, run this in SQL Editor:
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

---

## Frontend Development

### Project Structure Explained

#### `/src/components`
Reusable UI components. Organized by:
- `ui/` - shadcn/ui base components (Button, Card, Dialog, etc.)
- Root level - Feature-specific components (Header, ProductCard, etc.)

#### `/src/pages`
Page-level components that represent routes:
- Each page is a complete view
- Pages use components from `/components`
- Pages interact with contexts and hooks

#### `/src/contexts`
Global state management using React Context:
- `AuthContext` - User authentication state
- `CartContext` - Shopping cart state
- `ThemeContext` - Theme preferences

#### `/src/hooks`
Custom React hooks:
- `useRecentlyViewed` - Track viewed products
- `use-mobile` - Detect mobile devices

#### `/src/integrations`
Third-party service integrations:
- `supabase/client.ts` - Supabase client configuration
- `supabase/types.ts` - Generated TypeScript types

#### `/src/lib`
Utility functions and helpers:
- `utils.ts` - General utilities (cn function for class merging)
- `imageCompression.ts` - Image optimization utilities

### Creating a New Component

1. **Create component file**
   ```typescript
   // src/components/MyComponent.tsx
   import { Button } from '@/components/ui/button';
   
   interface MyComponentProps {
     title: string;
     onClick: () => void;
   }
   
   export const MyComponent = ({ title, onClick }: MyComponentProps) => {
     return (
       <div>
         <h2>{title}</h2>
         <Button onClick={onClick}>Click me</Button>
       </div>
     );
   };
   ```

2. **Use in a page**
   ```typescript
   import { MyComponent } from '@/components/MyComponent';
   
   const MyPage = () => {
     return <MyComponent title="Hello" onClick={() => {}} />;
   };
   ```

### Creating a New Page

1. **Create page file**
   ```typescript
   // src/pages/MyPage.tsx
   import { Header } from '@/components/Header';
   
   const MyPage = () => {
     return (
       <div className="min-h-screen flex flex-col">
         <Header />
         <div className="container py-8">
           <h1>My Page</h1>
         </div>
       </div>
     );
   };
   
   export default MyPage;
   ```

2. **Add route in App.tsx**
   ```typescript
   import MyPage from './pages/MyPage';
   
   // In Routes:
   <Route path="/my-page" element={<MyPage />} />
   ```

### Working with Supabase

#### Querying Data

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const MyComponent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
};
```

#### Mutating Data

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

const MyComponent = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (newProduct: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  
  return (
    <button onClick={() => mutation.mutate({ name: 'New Product' })}>
      Create Product
    </button>
  );
};
```

### Using Contexts

#### Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { user, isAdmin, signOut } = useAuth();
  
  if (!user) return <div>Please sign in</div>;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      {isAdmin && <p>You are an admin</p>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};
```

#### Cart Context

```typescript
import { useCart } from '@/contexts/CartContext';

const MyComponent = () => {
  const { items, addItem, removeItem, total } = useCart();
  
  const handleAdd = () => {
    addItem({
      productId: 'product-id',
      variantId: 'variant-id',
      name: 'Product Name',
      size: 'M',
      color: 'Blue',
      price: 29.99,
      quantity: 1,
    });
  };
  
  return (
    <div>
      <p>Items in cart: {items.length}</p>
      <p>Total: ${total}</p>
      <button onClick={handleAdd}>Add to Cart</button>
    </div>
  );
};
```

---

## Backend Integration

### Supabase Client Setup

The Supabase client is configured in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Authentication Flow

1. **Sign Up**
   ```typescript
   const { error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password123',
     options: {
       data: { full_name: 'John Doe' }
     }
   });
   ```

2. **Sign In**
   ```typescript
   const { error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password123',
   });
   ```

3. **OAuth (Google)**
   ```typescript
   const { error } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: {
       redirectTo: `${window.location.origin}/`,
     },
   });
   ```

4. **Sign Out**
   ```typescript
   await supabase.auth.signOut();
   ```

### Real-time Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('orders')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('New order:', payload.new);
      }
    )
    .subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Payment Integration

### Razorpay Setup

1. **Create Razorpay Account**
   - Sign up at [razorpay.com](https://razorpay.com)
   - Get your Key ID and Key Secret

2. **Configure Edge Function**
   - In Supabase Dashboard → Edge Functions
   - Set environment variables:
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`

3. **Deploy Edge Function**
   ```bash
   supabase functions deploy razorpay
   ```

### Payment Flow

1. **User clicks "Pay"** → Checkout page
2. **Order created** → Database
3. **Razorpay order created** → Edge Function
4. **Payment modal opens** → Razorpay SDK
5. **Payment processed** → Razorpay
6. **Payment verified** → Edge Function
7. **Order updated** → Database
8. **Cart cleared** → Local storage

### Testing Payments

Use Razorpay test credentials:
- Test cards available in Razorpay dashboard
- Test mode doesn't charge real money

---

## State Management

### Context API Pattern

The app uses React Context for global state:

1. **Create Context**
   ```typescript
   const MyContext = createContext<MyContextType | undefined>(undefined);
   ```

2. **Create Provider**
   ```typescript
   export const MyProvider = ({ children }: { children: ReactNode }) => {
     const [state, setState] = useState(initialState);
     
     return (
       <MyContext.Provider value={{ state, setState }}>
         {children}
       </MyContext.Provider>
     );
   };
   ```

3. **Create Hook**
   ```typescript
   export const useMyContext = () => {
     const context = useContext(MyContext);
     if (!context) {
       throw new Error('useMyContext must be used within MyProvider');
     }
     return context;
   };
   ```

### TanStack Query

Used for server state management:

- **Caching**: Automatic caching of queries
- **Refetching**: Automatic refetch on window focus
- **Optimistic Updates**: Update UI before server response
- **Error Handling**: Built-in error states

---

## Styling and UI

### Tailwind CSS

The project uses Tailwind CSS for styling:

```typescript
<div className="container mx-auto px-4 py-8">
  <h1 className="text-3xl font-bold text-primary">Title</h1>
</div>
```

### shadcn/ui Components

Components are in `src/components/ui/`:

- Pre-built, accessible components
- Customizable via Tailwind
- Based on Radix UI primitives

### Adding a New UI Component

```bash
npx shadcn-ui@latest add [component-name]
```

### Theme System

The app supports theming via CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

Dark mode variables are in `.dark` class.

---

## Testing and Debugging

### Development Tools

1. **React DevTools** - Component inspection
2. **TanStack Query DevTools** - Query inspection
3. **Supabase Dashboard** - Database inspection
4. **Browser DevTools** - Network, console, etc.

### Common Issues

#### Issue: Supabase connection errors
- Check `.env` variables
- Verify Supabase project is active
- Check network tab for errors

#### Issue: RLS policy blocking queries
- Verify user is authenticated
- Check RLS policies in Supabase
- Use Supabase logs to debug

#### Issue: Type errors
- Run `npm run build` to see all errors
- Check `supabase/types.ts` is up to date
- Regenerate types if needed

### Debugging Tips

1. **Console Logging**
   ```typescript
   console.log('Debug:', { data, error });
   ```

2. **React Query DevTools**
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
   
   // Add to App.tsx
   <ReactQueryDevtools initialIsOpen={false} />
   ```

3. **Supabase Logs**
   - Dashboard → Logs → API Logs
   - View all database queries

---

## Deployment

### Building for Production

```bash
npm run build
```

Output is in `dist/` directory.

### Environment Variables

Ensure production environment variables are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Deployment Options

1. **Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Supabase Hosting**
   - Use Supabase's built-in hosting

### Post-Deployment

1. Update Supabase redirect URLs
2. Update Razorpay redirect URLs
3. Test all features in production
4. Monitor error logs

---

## Best Practices

### Code Organization

1. **Component Structure**
   - One component per file
   - Export default for pages
   - Named exports for components

2. **File Naming**
   - PascalCase for components: `ProductCard.tsx`
   - camelCase for utilities: `imageCompression.ts`
   - kebab-case for assets: `hero-image.jpg`

3. **Import Organization**
   ```typescript
   // 1. React imports
   import { useState, useEffect } from 'react';
   
   // 2. Third-party imports
   import { useQuery } from '@tanstack/react-query';
   
   // 3. Internal imports (absolute paths)
   import { Button } from '@/components/ui/button';
   import { useAuth } from '@/contexts/AuthContext';
   
   // 4. Relative imports
   import './styles.css';
   ```

### TypeScript Best Practices

1. **Type Everything**
   ```typescript
   interface Product {
     id: string;
     name: string;
     price: number;
   }
   ```

2. **Use Type Inference**
   ```typescript
   const products = await fetchProducts(); // Type inferred
   ```

3. **Avoid `any`**
   ```typescript
   // Bad
   const data: any = fetchData();
   
   // Good
   const data: Product[] = fetchData();
   ```

### Performance Optimization

1. **Code Splitting**
   - Lazy load routes
   - Dynamic imports for heavy components

2. **Memoization**
   ```typescript
   const MemoizedComponent = React.memo(Component);
   ```

3. **Query Optimization**
   - Use `select` to limit fields
   - Implement pagination
   - Use `staleTime` appropriately

### Security Best Practices

1. **Never expose secrets**
   - Use environment variables
   - Don't commit `.env` files

2. **Validate inputs**
   - Use Zod schemas
   - Validate on client and server

3. **Use RLS policies**
   - Never disable RLS
   - Test policies thoroughly

### Git Workflow

1. **Branch Naming**
   - `feature/add-product-reviews`
   - `fix/cart-calculation-bug`
   - `refactor/auth-context`

2. **Commit Messages**
   ```
   feat: add product review functionality
   fix: correct cart total calculation
   refactor: simplify auth context
   docs: update development guide
   ```

---

## Additional Resources

### Documentation Links

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Razorpay Docs](https://razorpay.com/docs)

### Useful Commands

```bash
# Generate Supabase types
npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts

# Run linter
npm run lint

# Format code (if using Prettier)
npm run format
```

---

## Getting Help

If you encounter issues:

1. Check this guide
2. Review Supabase logs
3. Check browser console
4. Review React Query DevTools
5. Search existing issues
6. Create a new issue with details

---

## Conclusion

This development guide covers the essential aspects of developing this ecommerce platform. For specific implementation details, refer to the codebase and inline comments. Happy coding!
