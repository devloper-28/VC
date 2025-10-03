# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account
- Railway account (for backend)

## Step 1: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `server`
6. Deploy and note the URL (e.g., `https://your-project.railway.app`)

## Step 2: Deploy Frontend to Vercel

### Method 1: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `build`

### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts
```

## Step 3: Configure Environment Variables

### In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add: `VITE_SOCKET_URL` = `wss://your-railway-backend-url.railway.app`

### In Railway Dashboard:
1. Go to your backend project → Variables
2. Add: `CORS_ORIGIN` = `https://your-vercel-frontend-url.vercel.app`

## Step 4: Test Deployment

1. Visit your Vercel URL
2. Check browser console for connection status
3. Test video chat functionality

## Troubleshooting

### Common Issues:
- **CORS errors**: Make sure CORS_ORIGIN is set correctly in Railway
- **WebSocket connection failed**: Check if VITE_SOCKET_URL uses `wss://` for HTTPS
- **Video not working**: Ensure HTTPS is enabled (required for camera access)

### Environment Variables Reference:
- Frontend (Vercel): `VITE_SOCKET_URL`
- Backend (Railway): `CORS_ORIGIN`, `PORT`

