# Omegle Clone - Real Video Chat

This is a fully functional Omegle clone with real-time video chat capabilities using WebRTC and Socket.io.

## Features

✅ **Real-time Video Chat** - WebRTC peer-to-peer video/audio streaming  
✅ **Text Chat** - Real-time messaging between strangers  
✅ **User Matching** - Automatic pairing of random strangers  
✅ **Instant Connection** - No waiting, connects immediately when 2+ users online  
✅ **Modern UI** - Clean, responsive interface  

## How It Works

1. **User visits website** → Gets added to matching queue
2. **When 2+ users in queue** → Server automatically matches them
3. **WebRTC connection established** → Direct video/audio between users
4. **Real-time chat** → Messages sent through WebSocket server

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + Socket.io
- **Video/Audio**: WebRTC (peer-to-peer)
- **Signaling**: WebSocket server for connection setup

## Quick Start

### Option 1: Run Everything (Recommended)
```bash
npm run dev:full
```

### Option 2: Run Separately
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## Testing with Real People

1. **Open multiple browser tabs/windows** to `http://localhost:5173`
2. **Click "Video" or "Text"** to start searching
3. **Wait for matching** - when 2+ users are searching, they'll be connected instantly
4. **Chat with real strangers** - video/audio works between different browser tabs

## What's Different from Static Version

- ❌ **Before**: Simulated responses, fake video feeds
- ✅ **Now**: Real people, real video streams, real-time communication

## Server Endpoints

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## Troubleshooting

- **Camera not working**: Check browser permissions
- **No connection**: Ensure both frontend and backend are running
- **Can't find stranger**: Open multiple browser tabs to test locally

The system is now fully functional for real-time video chat with actual people!
