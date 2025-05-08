# OrderKaro - Grocery Delivery App

A Next.js based grocery delivery application.

## 🌐 Live Demo

**Live App**: [https://grocery-app-y6ty.onrender.com](https://grocery-app-y6ty.onrender.com)

Experience the full functionality of OrderKaro without setting up anything locally!

## Features

- User authentication with Supabase Auth
- Product browsing and searching
- Shopping cart functionality
- Order management
- User profiles

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Deployment**: Render

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

## Deployment

The application is deployed on Render. To deploy your own instance:

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the following settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `NODE_ENV`: production
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `PORT`: 10000
     - `NEXT_PUBLIC_SITE_URL`: Your Render app URL

5. Deploy the service

The deployment process will automatically set up continuous deployments from your main branch.

## Folder Structure

```
OrderKaro/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── (pages)/      # App pages
│   │   └── config/       # Configuration files
│   ├── components/       # React components
│   ├── context/          # Context providers
│   │   ├── AuthContext.js   # Authentication context
│   │   └── CartContext.js   # Shopping cart context
│   ├── utils/            # Utility functions
│   │   └── supabase.js   # Supabase client
│   └── config/           # Configuration files
├── .env.local            # Environment variables (create this)
├── server.js             # Custom server for production
└── README.md             # Project documentation
```

## Authentication

The app uses Supabase Authentication. To test:

1. Create an account at [http://localhost:3000/register](http://localhost:3000/register)
2. Login at [http://localhost:3000/login](http://localhost:3000/login)

## Troubleshooting

### Database Connection Issues

If you're experiencing database connection issues:

1. Check your Supabase URL and API keys in `.env.local`
2. Verify your Supabase project is active
3. Check that the required tables are created

### Table Creation Error

If you get errors about missing tables:

1. Check the Supabase SQL Editor and verify the tables exist
2. Run the SQL setup script again
3. Check if there are any permission issues

### Authentication Issues

If authentication is not working:

1. Check the Supabase Auth settings
2. Verify the redirect URLs are configured correctly
3. Check browser console for specific error messages

## License

This project is licensed under the MIT License.

## Acknowledgements

- Next.js Team for the amazing framework
- Supabase for the powerful backend platform
- Tailwind CSS for the utility-first CSS framework
- Render for hosting the application

## Database Setup Issues

If you're seeing errors like `relation "public.profiles" does not exist` or `Could not create user profile`, you need to set up the Supabase database tables.

### Option 1: Manual SQL Setup (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to the SQL Editor
3. Create a new query
4. Paste the contents of [supabase/migrations/20240508_create_initial_tables.sql](supabase/migrations/20240508_create_initial_tables.sql)
5. Run the query

### Option 2: Using the Helper Script

This requires the service role key to be set in your `.env` file.

```bash
# Create .env file with your Supabase credentials
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" > .env
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env

# Run the helper script
node scripts/create-db-tables.js
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
