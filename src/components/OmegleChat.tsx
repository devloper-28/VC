import { useEffect, useRef } from "react";
import { OmegleVideoSection } from "./OmegleVideoSection";

interface Message {
  text: string;
  sender: "you" | "stranger" | "system";
}

interface OmegleChatProps {
  mode: "text" | "video";
  isConnected: boolean;
  isSearching: boolean;
  messages: Message[];
  currentMessage: string;
  setCurrentMessage: (msg: string) => void;
  onSend: () => void;
  onStop: () => void;
  onNew: () => void;
  onReallyNew: () => void;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
}

export function OmegleChat({
  mode,
  isConnected,
  isSearching,
  messages,
  currentMessage,
  setCurrentMessage,
  onSend,
  onStop,
  onNew,
  onReallyNew,
  localStream,
  remoteStream,
}: OmegleChatProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-[#4d90fe] text-white py-3 px-4 flex items-center justify-between">
        <h1 className="text-4xl">Omegle</h1>
        <div className="flex gap-3">
          <button
            onClick={onReallyNew}
            className="bg-white text-[#4d90fe] px-4 py-1 rounded hover:bg-gray-100"
          >
            Really?
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4">
        {mode === "video" && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <OmegleVideoSection 
                label="Stranger" 
                isSearching={isSearching} 
                isConnected={isConnected} 
                stream={remoteStream}
              />
              <OmegleVideoSection 
                label="You" 
                isSearching={false} 
                isConnected={isConnected} 
                isLocalVideo 
                stream={localStream}
              />
            </div>
          </div>
        )}

        {/* Status/Search Message */}
        {isSearching && (
          <div className="mb-4 text-center">
            <p className="text-black">Looking for someone you can chat with. Hang on.</p>
          </div>
        )}

        {/* Chat Log */}
        <div
          ref={logRef}
          className="flex-1 border-2 border-gray-400 rounded p-4 mb-4 bg-white overflow-y-auto min-h-[400px] max-h-[500px]"
        >
          {messages.map((msg, index) => (
            <div key={index} className="mb-2">
              {msg.sender === "system" ? (
                <p className="text-red-600">{msg.text}</p>
              ) : (
                <p className="text-black">
                  <span className="text-blue-600">{msg.sender === "you" ? "You" : "Stranger"}:</span>{" "}
                  {msg.text}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            placeholder={isConnected ? "Type your message..." : "Connect to start chatting"}
            className="flex-1 px-3 py-2 border-2 border-gray-400 rounded text-black placeholder:text-gray-500 disabled:bg-gray-100"
          />
          <button
            onClick={onSend}
            disabled={!isConnected || !currentMessage.trim()}
            className="bg-[#4d90fe] hover:bg-[#357ae8] text-white px-6 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onStop}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Stop
          </button>
          <button
            onClick={onNew}
            disabled={!isConnected}
            className="bg-[#4d90fe] hover:bg-[#357ae8] text-white px-6 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            New
          </button>
          {mode === "video" && (
            <>
              <button className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded">
                Stop Cam
              </button>
              <button className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-2 rounded">
                Mute
              </button>
            </>
          )}
        </div>

        {/* Footer Text */}
        <div className="mt-6 text-xs text-gray-600">
          <p>
            By using Omegle, you accept the practices outlined in our Privacy policy. Adult content is not allowed on Omegle.
          </p>
        </div>
      </div>
    </div>
  );
}