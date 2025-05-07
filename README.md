# OrderKaro - Grocery Delivery App

OrderKaro is a complete grocery delivery application built with Next.js, Supabase, and Tailwind CSS.

## Features

- User authentication (signup, login, profile management)
- Product browsing and searching
- Shopping cart functionality
- Order placement and tracking
- Admin dashboard for managing products and orders

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/OrderKaro.git
   cd OrderKaro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://itetzcqolezorrcegtkf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Visit [http://localhost:3000/db-setup](http://localhost:3000/db-setup) after starting the development server
2. Follow the instructions on the page to set up your Supabase database

## Folder Structure

```
OrderKaro/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── (pages)/      # App pages
│   ├── components/       # React components
│   ├── context/          # Context providers
│   │   ├── AuthContext.js   # Authentication context
│   │   └── CartContext.js   # Shopping cart context
│   ├── utils/            # Utility functions
│   │   └── supabase.js   # Supabase client
│   └── config/           # Configuration files
├── .env.local            # Environment variables (create this)
└── README.md             # Project documentation
```

## Authentication

The app uses Supabase Authentication. To test:

1. Create an account at [http://localhost:3000/register](http://localhost:3000/register)
2. Login at [http://localhost:3000/login](http://localhost:3000/login)

## Troubleshooting

If you encounter any issues with the database setup:

1. Navigate to the `/db-setup` page in the app
2. Check if the tables exist in your Supabase project
3. If needed, manually run the SQL setup script through the Supabase dashboard

## License

This project is licensed under the MIT License.

## Acknowledgements

- Next.js Team for the amazing framework
- Supabase for the powerful backend platform
- Tailwind CSS for the utility-first CSS framework
