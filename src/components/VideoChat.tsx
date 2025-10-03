import { useState, useEffect, useRef } from "react";
import { OmegleStart } from "./OmegleStart";
import { OmegleChat } from "./OmegleChat";
import { SocketService } from "../services/socketService";
import { WebRTCService } from "../services/webrtc";

export function VideoChat() {
  const [mode, setMode] = useState<"start" | "text" | "video" | null>("start");
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; sender: "you" | "stranger" | "system" }>>([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const socketService = useRef<SocketService | null>(null);
  const webrtcService = useRef<WebRTCService | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Define event handlers first
  const handleStrangerFound = async (data: any) => {
    console.log('Stranger found:', data);
    console.log('Current mode:', mode);
    console.log('Stranger mode:', data.stranger?.mode);
      setIsSearching(false);
      setIsConnected(true);
      setMessages([{ 
        text: "You're now chatting with a random stranger. Say hi!", 
        sender: "system" 
      }]);

    // Initialize WebRTC for video mode - use the stranger's mode or current mode
    const isVideoMode = data.stranger?.mode === 'video' || mode === 'video';
    console.log('Checking if mode is video:', isVideoMode);
    if (isVideoMode) {
      try {
        console.log('Initializing WebRTC for video mode...');
        webrtcService.current = new WebRTCService(socketService.current!);
        
        // Always start local stream for WebRTC
        console.log('Starting local stream for WebRTC...');
        const stream = await webrtcService.current.startLocalStream();
        setLocalStream(stream);
        console.log('Local stream set for WebRTC');
        
        // Create offer
        console.log('Creating WebRTC offer...');
        const offer = await webrtcService.current.createOffer();
        console.log('Sending WebRTC offer:', offer);
        socketService.current!.sendWebRTCOffer(offer);
        
        // Set up remote stream monitoring
        const checkRemoteStream = () => {
          if (webrtcService.current) {
            const remoteStream = webrtcService.current.getRemoteStream();
            if (remoteStream) {
              console.log('Remote stream found!', remoteStream);
              setRemoteStream(remoteStream);
            } else {
              setTimeout(checkRemoteStream, 100);
            }
          }
        };
        checkRemoteStream();
        
        // Also listen for the custom event
        const handleRemoteStreamReceived = (event: any) => {
          console.log('Remote stream received via event:', event.detail.stream);
          setRemoteStream(event.detail.stream);
        };
        window.addEventListener('remoteStreamReceived', handleRemoteStreamReceived);
        
        return () => {
          window.removeEventListener('remoteStreamReceived', handleRemoteStreamReceived);
        };
      } catch (error) {
        console.error('Error starting video:', error);
      }
    } else {
      console.log('Not video mode, skipping WebRTC initialization');
    }
  };

  const handleStrangerDisconnected = () => {
    setMessages(prev => [...prev, { 
      text: "Stranger has disconnected.", 
      sender: "system" 
    }]);
    setIsConnected(false);
    setRemoteStream(null);
    if (webrtcService.current) {
      webrtcService.current.stop();
      webrtcService.current = null;
    }
  };

  const handleSearchStopped = () => {
    setIsSearching(false);
    setIsConnected(false);
  };

  const handleChatDisconnected = () => {
    setIsConnected(false);
    setRemoteStream(null);
    if (webrtcService.current) {
      webrtcService.current.stop();
      webrtcService.current = null;
    }
  };

  const handleSearchingForStranger = () => {
    setIsSearching(true);
    setIsConnected(false);
    setMessages([]);
  };

  const handleWebRTCOffer = async (data: any) => {
    console.log('Received WebRTC offer:', data);
    
    // If WebRTC service is not ready, create it
    if (!webrtcService.current) {
      console.log('Creating WebRTC service for offer handling...');
      webrtcService.current = new WebRTCService(socketService.current!);
      
      // Start local stream if not already started
      if (!localStream) {
        console.log('Starting local stream for offer handling...');
        const stream = await webrtcService.current.startLocalStream();
        setLocalStream(stream);
      }
    }
    
    if (webrtcService.current) {
      try {
        console.log('Creating WebRTC answer...');
        const answer = await webrtcService.current.createAnswer(data.offer);
        console.log('Sending WebRTC answer:', answer);
        socketService.current!.sendWebRTCAnswer(answer);
        console.log('WebRTC answer sent successfully');
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    } else {
      console.log('Failed to create WebRTC service');
    }
  };

  const handleWebRTCAnswer = async (data: any) => {
    console.log('Received WebRTC answer:', data);
    if (webrtcService.current) {
      try {
        console.log('Handling WebRTC answer...');
        await webrtcService.current.handleAnswer(data.answer);
        console.log('WebRTC answer handled successfully');
        
        // Check for remote stream after answer is handled
        setTimeout(() => {
          const remoteStream = webrtcService.current?.getRemoteStream();
          console.log('Remote stream after answer:', remoteStream);
          if (remoteStream) {
            setRemoteStream(remoteStream);
          }
        }, 1000);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (data: any) => {
    console.log('Received ICE candidate:', data);
    if (webrtcService.current) {
      try {
        await webrtcService.current.handleIceCandidate(data.candidate);
        console.log('ICE candidate handled successfully');
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const handleNewMessage = (message: any) => {
    const sender = message.sender === socketService.current?.socket?.id ? 'you' : 'stranger';
    setMessages(prev => [...prev, { 
      text: message.text, 
      sender: sender as "you" | "stranger" | "system"
    }]);
  };


  // Initialize socket connection
  useEffect(() => {
    socketService.current = new SocketService();
    socketService.current.connect();

    // Set up event listeners
    socketService.current.on('connected', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });
    socketService.current.on('connect-error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });
    socketService.current.on('disconnected', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });
    socketService.current.on('stranger-found', handleStrangerFound);
    socketService.current.on('stranger-disconnected', handleStrangerDisconnected);
    socketService.current.on('search-stopped', handleSearchStopped);
    socketService.current.on('chat-disconnected', handleChatDisconnected);
    socketService.current.on('searching-for-stranger', handleSearchingForStranger);
    socketService.current.on('webrtc-offer', handleWebRTCOffer);
    socketService.current.on('webrtc-answer', handleWebRTCAnswer);
    socketService.current.on('webrtc-ice-candidate', handleIceCandidate);
    socketService.current.on('new-message', handleNewMessage);

    return () => {
      if (socketService.current) {
        socketService.current.disconnect();
      }
      if (webrtcService.current) {
        webrtcService.current.stop();
      }
    };
  }, []);

  const handleStart = async (chatMode: "text" | "video") => {
    console.log('Starting chat in mode:', chatMode);
    setMode(chatMode);
    setIsSearching(true);
    setMessages([]);
    
    // For video mode, start local stream immediately
    if (chatMode === 'video') {
      try {
        // Check if we're on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('Is mobile device:', isMobile);
        
        webrtcService.current = new WebRTCService(socketService.current!);
        const stream = await webrtcService.current.startLocalStream();
        setLocalStream(stream);
        console.log('Local video stream started');
      } catch (error) {
        console.error('Error starting local video:', error);
        // Show user-friendly error for mobile
        if (error.name === 'NotAllowedError') {
          alert('Camera access denied. Please allow camera permission in your browser settings and refresh the page.');
        } else {
          alert('Camera error: ' + error.message);
        }
      }
    }
    
    if (socketService.current) {
      socketService.current.startChat(chatMode);
    }
  };

  const handleStop = () => {
    if (isConnected) {
      setMessages(prev => [...prev, { 
        text: "You have disconnected.", 
        sender: "system" 
      }]);
    }
    
    if (socketService.current) {
      socketService.current.disconnectChat();
    }
    
    setIsConnected(false);
    setIsSearching(false);
    setRemoteStream(null);
    
    if (webrtcService.current) {
      webrtcService.current.stop();
      webrtcService.current = null;
    }
  };

  const handleNew = () => {
    if (socketService.current) {
      socketService.current.findNewStranger();
    }
  };

  const handleSendMessage = () => {
    if (currentMessage.trim() && isConnected && socketService.current) {
      socketService.current.sendMessage(currentMessage);
      setCurrentMessage("");
    }
  };

  const handleReallyNew = () => {
    setMode("start");
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
    setCurrentMessage("");
    setRemoteStream(null);
    
    if (webrtcService.current) {
      webrtcService.current.stop();
      webrtcService.current = null;
    }
  };

  if (mode === "start") {
    return (
      <div>
        <OmegleStart onStart={handleStart} />
        {!socketConnected && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">
            Backend not connected
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
    <OmegleChat
      mode={mode!}
      isConnected={isConnected}
      isSearching={isSearching}
      messages={messages}
      currentMessage={currentMessage}
      setCurrentMessage={setCurrentMessage}
      onSend={handleSendMessage}
      onStop={handleStop}
      onNew={handleNew}
      onReallyNew={handleReallyNew}
        localStream={localStream}
        remoteStream={remoteStream}
      />
      {!socketConnected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">
          Backend not connected
        </div>
      )}
    </div>
  );
}