import { useEffect, useRef, useState } from "react";

interface OmegleVideoSectionProps {
  label: string;
  isSearching: boolean;
  isConnected: boolean;
  isLocalVideo?: boolean;
  stream?: MediaStream | null;
}

export function OmegleVideoSection({ 
  label, 
  isSearching, 
  isConnected, 
  isLocalVideo = false,
  stream = null
}: OmegleVideoSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    // Use provided stream or get local stream
    if (stream) {
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } else if (isLocalVideo) {
      console.log('Requesting camera access for local video...');
      
      // Check if getUserMedia is supported (with fallback for older browsers)
      const getUserMedia = navigator.mediaDevices?.getUserMedia || 
                          navigator.webkitGetUserMedia || 
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia;
      
      if (!getUserMedia) {
        console.error('getUserMedia not supported');
        setCameraError(true);
        simulateVideoFeed();
        return;
      }
      
      // Mobile-friendly camera constraints
      const constraints = {
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: { ideal: 'user' },
          frameRate: { ideal: 30, max: 60 }
        }, 
        audio: true 
      };
      
      console.log('Requesting camera with constraints:', constraints);
      
      // Use the compatible getUserMedia function
      const mediaPromise = navigator.mediaDevices ? 
        navigator.mediaDevices.getUserMedia(constraints) :
        new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      
      mediaPromise
        .then((mediaStream) => {
          console.log('Camera access granted');
          setLocalStream(mediaStream);
          setCameraError(false);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(e => console.log('Video play error:', e));
          }
        })
        .catch((error) => {
          console.error('Camera access denied:', error);
          setCameraError(true);
          simulateVideoFeed();
          
          // Show user-friendly error message
          if (error.name === 'NotAllowedError') {
            alert('Camera access denied. Please:\n1. Allow camera permission in your browser\n2. Make sure you are using HTTPS\n3. Refresh the page');
          } else if (error.name === 'NotFoundError') {
            alert('No camera found. Please check your device has a camera.');
          } else if (error.name === 'NotSupportedError') {
            alert('Camera not supported. Please use a modern browser like Chrome or Safari.');
          } else {
            alert('Camera error: ' + error.message + '\n\nTry using HTTPS: https://' + window.location.hostname + ':5173');
          }
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLocalVideo, stream]);

  const simulateVideoFeed = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    let hue = 0;
    const animate = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsl(${hue}, 30%, 25%)`);
      gradient.addColorStop(1, `hsl(${hue + 60}, 30%, 20%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 8 - 4;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);

      hue = (hue + 0.3) % 360;
      
      if (isConnected && isLocalVideo) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return (
    <div className="relative bg-black aspect-video border-2 border-gray-400">
      {isSearching && !isLocalVideo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <p className="text-white">Connecting...</p>
        </div>
      ) : (
        <>
          {cameraError && isLocalVideo ? (
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
          ) : (isLocalVideo && localStream) ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : isLocalVideo ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 p-4">
              <p className="text-white text-sm mb-2">Requesting camera...</p>
              <p className="text-gray-400 text-xs text-center">
                If permission dialog doesn't appear, check your browser settings
              </p>
            </div>
          ) : isConnected ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <p className="text-white text-sm">Stranger's video</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <p className="text-gray-400 text-sm">Not connected</p>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-sm">
            {label}
          </div>
        </>
      )}
    </div>
  );
}