interface OmegleStartProps {
  onStart: (mode: "text" | "video") => void;
}

export function OmegleStart({ onStart }: OmegleStartProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#4d90fe] text-white py-3 px-4">
        <h1 className="text-4xl">Omegle</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="mb-4 text-black">
            Omegle (oh·meg·ull) is a great way to meet new friends, even while practicing social distancing. When you use Omegle, you are paired randomly with another person to talk one-on-one. If you prefer, you can add your interests and you'll be randomly paired with someone who selected some of the same interests.
          </p>
          <p className="mb-4 text-black">
            To help you stay safe, chats are anonymous unless you tell someone who you are (not suggested!), and you can stop a chat at any time. Predators have been known to use Omegle, so please be careful.
          </p>
          <p className="mb-4 text-black">
            If you prefer, you can add your interests, and Omegle will look for someone who's into some of the same things as you instead of someone completely random.
          </p>
        </div>

        {/* Chat Options */}
        <div className="border-2 border-[#4d90fe] rounded p-6 mb-6 bg-[#f0f7ff]">
          <h2 className="mb-4 text-black">Start chatting:</h2>
          
          <div className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Add your interests (optional)"
                className="w-full px-3 py-2 border border-gray-400 rounded text-black placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Type in some interests (example: football, music, tv, movies, or just type random). Separate them with commas.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => onStart("text")}
                className="bg-[#4d90fe] hover:bg-[#357ae8] text-white px-6 py-2 rounded"
              >
                Text
              </button>
              <button
                onClick={() => onStart("video")}
                className="bg-[#4d90fe] hover:bg-[#357ae8] text-white px-6 py-2 rounded"
              >
                Video
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="college" className="w-4 h-4" />
              <label htmlFor="college" className="text-sm text-black">
                College student? Check out the college student chat (must have .edu email)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="unmoderated" className="w-4 h-4" />
              <label htmlFor="unmoderated" className="text-sm text-black">
                18+? Try the adult chat - Unmoderated Section
              </label>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-sm text-gray-700 space-y-4">
          <p>
            <strong>Note:</strong> Adult content is not allowed on Omegle. Please read and comply with the Community Guidelines and Terms of Service before using Omegle.
          </p>
          <p>
            By using Omegle, you accept the practices outlined in the Privacy policy.
          </p>
          <p>
            Omegle video chat is moderated but no moderation is perfect. Users are solely responsible for their behavior while using Omegle.
          </p>
        </div>
      </div>
    </div>
  );
}