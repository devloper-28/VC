import { io, Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect() {
    // Use environment variable for socket URL, fallback to localhost for development
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (window.location.hostname === 'localhost' 
        ? `ws://localhost:3001` 
        : `wss://${window.location.hostname}:3001`);
    console.log('Connecting to socket server:', socketUrl);
    
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.emit('connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connect-error', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.emit('disconnected');
    });

    this.socket.on('stranger-found', (data) => {
      console.log('Stranger found:', data);
      this.emit('stranger-found', data);
    });

    this.socket.on('stranger-disconnected', () => {
      console.log('Stranger disconnected');
      this.emit('stranger-disconnected');
    });

    this.socket.on('search-stopped', () => {
      console.log('Search stopped');
      this.emit('search-stopped');
    });

    this.socket.on('chat-disconnected', () => {
      console.log('Chat disconnected');
      this.emit('chat-disconnected');
    });

    this.socket.on('searching-for-stranger', () => {
      console.log('Searching for new stranger');
      this.emit('searching-for-stranger');
    });

    this.socket.on('webrtc-offer', (data) => {
      console.log('Received WebRTC offer');
      this.emit('webrtc-offer', data);
    });

    this.socket.on('webrtc-answer', (data) => {
      console.log('Received WebRTC answer');
      this.emit('webrtc-answer', data);
    });

    this.socket.on('webrtc-ice-candidate', (data) => {
      console.log('Received ICE candidate');
      this.emit('webrtc-ice-candidate', data);
    });

    this.socket.on('new-message', (message) => {
      console.log('New message:', message);
      this.emit('new-message', message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startChat(mode: 'text' | 'video') {
    if (this.socket) {
      this.socket.emit('start-chat', { mode });
    }
  }

  stopSearch() {
    if (this.socket) {
      this.socket.emit('stop-search');
    }
  }

  disconnectChat() {
    if (this.socket) {
      this.socket.emit('disconnect-chat');
    }
  }

  findNewStranger() {
    if (this.socket) {
      this.socket.emit('find-new-stranger');
    }
  }

  sendWebRTCOffer(offer: RTCSessionDescriptionInit) {
    if (this.socket) {
      console.log('Sending WebRTC offer via socket:', offer);
      this.socket.emit('webrtc-offer', { offer });
    }
  }

  sendWebRTCAnswer(answer: RTCSessionDescriptionInit) {
    if (this.socket) {
      this.socket.emit('webrtc-answer', { answer });
    }
  }

  sendIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.socket) {
      this.socket.emit('webrtc-ice-candidate', { candidate });
    }
  }

  sendMessage(message: string) {
    if (this.socket) {
      this.socket.emit('send-message', message);
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}
