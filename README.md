# Ecommerce Platform

A modern, full-stack ecommerce application built with React, TypeScript, and Supabase. This platform provides a complete shopping experience with user authentication, product management, shopping cart, payment processing, and an admin dashboard.

## 🚀 Features

### Customer Features
- **Product Browsing**: Browse products by category (Shirts, Pants, Outerwear)
- **Product Details**: View detailed product information with variants (size, color)
- **Shopping Cart**: Add items to cart with persistent storage
- **User Authentication**: Sign up, sign in, and Google OAuth integration
- **Order Management**: View order history and track order status
- **Product Reviews**: Rate and review products
- **Recently Viewed**: Track recently viewed products
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Mobile-first, fully responsive UI

### Admin Features
- **Dashboard**: Overview of products, orders, users, and revenue
- **Product Management**: Create, update, and delete products and variants
- **Order Management**: View and update order statuses
- **User Management**: View and manage user accounts
- **Inventory Management**: Track and update stock quantities

### Technical Features
- **Real-time Data**: Powered by Supabase for real-time database operations
- **Payment Integration**: Razorpay payment gateway integration
- **Image Optimization**: Image compression utilities
- **Type Safety**: Full TypeScript support
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **State Management**: React Context API for global state
- **Data Fetching**: TanStack Query (React Query) for efficient data management

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Edge Functions
  - Real-time subscriptions

### Payment
- **Razorpay** - Payment gateway integration via Supabase Edge Functions

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
Ecommerce/
├── public/                 # Static assets
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/            # Images and media files
│   ├── components/        # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── Header.tsx     # Navigation header
│   │   ├── ProductCard.tsx
│   │   ├── ProductReviews.tsx
│   │   └── ...
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useRecentlyViewed.ts
│   │   └── use-mobile.tsx
│   ├── integrations/      # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts  # Supabase client
│   │       └── types.ts   # Database types
│   ├── lib/               # Utility functions
│   │   ├── utils.ts
│   │   └── imageCompression.ts
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── Index.tsx      # Home page
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Cart.tsx
│   │   ├── Checkout.tsx
│   │   ├── Auth.tsx
│   │   ├── Orders.tsx
│   │   └── Settings.tsx
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── supabase/
│   ├── functions/         # Edge Functions
│   │   └── razorpay/      # Payment processing
│   └── migrations/        # Database migrations
├── .env                   # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profile information
- **user_roles** - User role management (admin/user)
- **products** - Product catalog
- **product_variants** - Product variants (size, color, stock)
- **orders** - Order records
- **order_items** - Order line items
- **product_reviews** - Product reviews and ratings
- **payments** - Payment transaction records

### Key Features
- Row Level Security (RLS) enabled on all tables
- Automatic profile creation on user signup
- Role-based access control
- Automatic timestamp updates via triggers
- Optimized indexes for performance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/bun
- Supabase account and project
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` in order
   - Set up the Razorpay Edge Function with environment variables:
     - `RAZORPAY_KEY_ID`
     - `RAZORPAY_KEY_SECRET`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:8080`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Authentication

The app uses Supabase Authentication with support for:
- Email/Password authentication
- Google OAuth
- Session management with automatic token refresh

## 💳 Payment Integration

Payment processing is handled through Razorpay:
1. Order is created in the database
2. Razorpay order is created via Edge Function
3. Payment modal opens for user
4. Payment is verified server-side
5. Order status is updated upon successful payment

## 🎨 Theming

The app supports:
- Light and dark themes
- Customizable accent colors
- Theme persistence in user profile

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Mobile devices
- Tablets
- Desktop screens

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Role-based access control
- Secure payment processing
- Environment variable protection
- Input validation with Zod

## 📚 Documentation

For detailed development guide, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions, please open an issue in the repository.
