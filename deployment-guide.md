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

### Package Lock Mismatches

If you see errors related to package-lock.json mismatches like:

```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
```

Solutions:
1. Use `npm install` instead of `npm ci` in your build command:
   ```
   buildCommand: npm install && npm run build
   ```
2. If you're developing locally, update your package-lock.json before pushing:
   ```
   npm install
   ```
3. Make sure your package.json and package-lock.json are both committed to your repository

## Troubleshooting Common Deployment Issues

### Tailwind CSS Module Not Found

If you encounter errors related to Tailwind CSS modules not being found:

```
Error: Cannot find module 'tailwindcss'
```

Solutions:
1. Make sure Tailwind CSS is added to your dependencies in package.json (not just devDependencies)
2. Verify that tailwind.config.js and postcss.config.js are properly configured
3. Update the build command in render.yaml to explicitly install Tailwind:
   ```
   npm ci && npm install tailwindcss postcss autoprefixer && npm run build
   ```

### Path Alias Resolution Problems

If you see errors like:

```
Module not found: Can't resolve '@/components/layout/MainLayout'
Module not found: Can't resolve '@/context/CartContext'
```

Solutions:
1. Update all import statements to use relative paths instead of path aliases:
   ```js
   // Change from:
   import { useCart } from '@/context/CartContext';
   
   // To:
   import { useCart } from '../../context/CartContext';
   ```
   
2. Use grep or search functionality to find all instances of path aliases:
   ```
   grep -r "from '@/" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" src/
   ```

3. Make sure tsconfig.json has the proper path configuration:
   ```json
   "paths": {
     "@/*": ["./src/*"]
   }
   ```

4. Add a jsconfig.json file if working primarily with JavaScript

### Other Common Issues

- If images aren't loading, check your next.config.js for proper image configuration
- For API endpoint issues, verify environment variables are correctly set
- For database connection issues, check Supabase credentials are properly configured

## Database Connection Strings (If Needed)

If your app requires direct database connections:

```
DATABASE_URL=postgresql://postgres.itetzcqolezorrcegtkf:Monumartinez@123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.itetzcqolezorrcegtkf:Monumartinez@123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

## Monitoring

Monitor your application's performance and logs through the Render dashboard. Regularly check for any errors or issues in the logs to ensure your app is running smoothly.

### Next.js Configuration Issues

If you see errors related to your next.config.js file, such as:

```
⚠ Invalid next.config.js options detected: 
⚠     Unrecognized key(s) in object: 'swcMinify'
⚠ The "experimental.esmExternals" option has been modified.
```

Solutions:
1. Update your next.config.js to remove deprecated options:
   ```js
   const nextConfig = {
     // Keep only supported options for your Next.js version
     output: 'standalone',
     images: {
       domains: ['images.unsplash.com', 'img.icons8.com'],
     },
     // Remove problematic experimental options
     experimental: {
       externalDir: true,
       // Remove: esmExternals: 'loose',
     },
     // Remove: swcMinify: true,
   }
   ```

2. If you see build failure errors due to memory issues, add the NODE_OPTIONS environment variable:
   ```
   NODE_OPTIONS=--max-old-space-size=4096
   ```

### Build Not Found Errors

If you see errors like:

```
[Error: Could not find a production build in the '.next' directory]
```

Solutions:
1. Make sure your build command is properly configured in render.yaml:
   ```
   buildCommand: npm install && npm run build
   ```
2. Check that your package.json has the correct build script:
   ```json
   "scripts": {
     "build": "next build"
   }
   ```
3. Check the build logs for any errors that might have caused the build to fail 

### TypeScript Configuration Issues

If you see TypeScript-related errors during build:

```
It looks like you're trying to use TypeScript but do not have the required package(s) installed.
Please install typescript and @types/react by running:
```

Solutions:
1. Install the required TypeScript dependencies:
   ```
   npm install --save-dev typescript @types/react @types/react-dom @types/node
   ```

2. Update your next.config.js to bypass TypeScript checking:
   ```js
   typescript: {
     ignoreBuildErrors: true,
     tsconfigPath: false,
   }
   ```

3. For more severe cases, consider creating a build-specific script:
   ```json
   "scripts": {
     "build": "SKIP_TYPESCRIPT_CHECK=true next build"
   }
   ``` 