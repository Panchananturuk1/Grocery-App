# OrderKaro Deployment Guide for Render

This guide explains how to deploy your OrderKaro grocery app to Render.

## Prerequisites

- A GitHub repository with your OrderKaro code
- A Supabase project (already set up)
- A Render account

## Deployment Steps

### 1. Connect Your Repository to Render

1. Log in to your [Render dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the deployment settings:
   - **Name**: OrderKaro (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 (or your preferred version)

### 2. Add Environment Variables

Add the following environment variables in the Render dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://itetzcqolezorrcegtkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZXR6Y3FvbGV6b3JyY2VndGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NDYwNjgsImV4cCI6MjA2MjEyMjA2OH0.f_RecDERFMBYzffSAzkx3vgENZuaRT5WiFXoL6Na-ss
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://grocery-app-y6ty.onrender.com
```

### 3. Deploy Your Application

1. Click "Create Web Service"
2. Wait for the build and deployment process to complete
3. Your app will be available at: `https://grocery-app-y6ty.onrender.com`

### 4. Configure Supabase Authentication

To ensure authentication works properly, update your Supabase authentication settings:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to "Authentication" → "URL Configuration"
3. Add your Render URL as the Site URL: `https://grocery-app-y6ty.onrender.com`
4. Under "Redirect URLs", add:
   - `https://grocery-app-y6ty.onrender.com/auth/callback`
   - `https://grocery-app-y6ty.onrender.com/login`
   - `https://grocery-app-y6ty.onrender.com/`

### 5. Update CORS Settings

1. In your Supabase dashboard, go to "API" → "Settings"
2. Add your Render URL to the "Additional Allowed Websites" section: `https://grocery-app-y6ty.onrender.com`

## Troubleshooting Build Issues

If you encounter build issues on Render, try these solutions:

### Tailwind CSS Errors

If you see errors like `Cannot find module '@tailwindcss/postcss'`:

1. Make sure Tailwind CSS is properly installed:
   ```
   npm install -D tailwindcss postcss autoprefixer
   ```

2. Create or update `postcss.config.js`:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

3. Create or update `tailwind.config.js`:
   ```js
   module.exports = {
     content: [
       "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

### Module Resolution Errors

If you see errors like `Can't resolve '@/components/layout/MainLayout'`:

1. Fix import paths in your files by using relative imports:
   ```js
   // Change from:
   import MainLayout from '@/components/layout/MainLayout';
   
   // To:
   import MainLayout from '../../components/layout/MainLayout';
   ```

2. Update your `tsconfig.json` to properly set up path aliases:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

3. Update your `next.config.js` with experimental flags:
   ```js
   experimental: {
     externalDir: true,
     esmExternals: 'loose',
   }
   ```

## Database Connection Strings (If Needed)

If your app requires direct database connections:

```
DATABASE_URL=postgresql://postgres.itetzcqolezorrcegtkf:Monumartinez@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.itetzcqolezorrcegtkf:Monumartinez@123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

## Monitoring

Monitor your application's performance and logs through the Render dashboard. Regularly check for any errors or issues in the logs to ensure your app is running smoothly. 