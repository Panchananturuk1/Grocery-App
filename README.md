# OrderKaro - Fresh Grocery Delivery App

OrderKaro is a full-stack grocery delivery application built with Next.js, Express, and Supabase, allowing users to browse and order fresh groceries online.

## Features

- **User Authentication**: Secure login and registration using JWT
- **Product Browsing**: Browse products by categories with search and filtering
- **Shopping Cart**: Add products to cart, update quantities, and checkout
- **Order Management**: View order history and track current orders
- **User Profile**: Manage account details and delivery addresses
- **Responsive Design**: Works seamlessly on both mobile and desktop

## Tech Stack

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- React Context for state management
- React Hot Toast for notifications

### Backend
- Express.js server
- Supabase (PostgreSQL database)
- JWT for authentication
- Multer for file uploads
- Razorpay for payment processing

## Project Structure

```
/
├── src/                  # Frontend source code
│   ├── app/              # Next.js app directory
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers
│   ├── utils/            # Utility functions
│   └── providers/        # Providers wrapper
│
├── backend/              # Backend source code
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── config/           # Configuration files
│   ├── database/         # Database schema and migrations
│   └── index.js          # Server entry point
│
├── public/               # Static assets
└── package.json          # Project dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/Panchananturuk1/Grocery-App.git
cd Grocery-App
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
npm install
```

4. Set up environment variables:

Create `.env.local` in the root directory with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` in the backend directory with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the backend server
```bash
cd backend
npm run dev
```

6. Start the frontend development server
```bash
# From the root directory
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contact

- [Panchanan Turuk](https://github.com/Panchananturuk1) - Developer
