export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: any = null;

  constructor(socket: any) {
    this.socket = socket;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      this.remoteStream = event.streams[0];
      
      // Trigger a custom event to notify components
      window.dispatchEvent(new CustomEvent('remoteStreamReceived', { 
        detail: { stream: event.streams[0] } 
      }));
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        this.socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };
  }

  async startLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection || !this.localStream) {
      throw new Error('Peer connection or local stream not initialized');
    }

    // Add local stream to peer connection
    this.localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    console.log('Creating WebRTC offer...');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    console.log('WebRTC offer created:', offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection || !this.localStream) {
      throw new Error('Peer connection or local stream not initialized');
    }

    // Add local stream to peer connection
    this.localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }
    await this.peerConnection.addIceCandidate(candidate);
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  stop() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.remoteStream = null;
  }
}
