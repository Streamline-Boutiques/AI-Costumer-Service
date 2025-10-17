import React, { useEffect, useRef, useState } from "react";
import RecordRTC from "recordrtc";

export default function VoiceRealtimeChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Connect to your FastAPI backend websocket
  useEffect(() => {
    const ws = new WebSocket("wss://your-vercel-backend.vercel.app/realtime");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ Connected to Realtime API");
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "response.audio.delta" && data.delta) {
          // Realtime API streams base64 audio chunks
          const audioChunk = base64ToArrayBuffer(data.delta);
          playAudioChunk(audioChunk);
        } else if (data.type === "response.text.delta" && data.delta) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.delta }]);
        } else if (data.error) {
          console.error("OpenAI Error:", data.error);
        }
      } catch (err) {
        console.log("Non-JSON message:", event.data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("❌ Disconnected from backend");
    };

    return () => ws.close();
  }, []);

  // Helper: decode base64 → audio buffer
  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  };

  // Helper: play streamed audio chunk
  const playAudioChunk = async (arrayBuffer) => {
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }
    const audio = audioPlayerRef.current;
    audio.src = url;
    await audio.play().catch(() => {});
  };

  // Start microphone streaming
  const startRecording = async () => {
    if (!isConnected) return alert("Not connected to AI backend yet.");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new RecordRTC(stream, {
      type: "audio",
      mimeType: "audio/webm",
      recorderType: RecordRTC.StereoAudioRecorder,
      timeSlice: 1000, // send audio every 1 second
      ondataavailable: (blob) => sendAudioChunk(blob),
    });
    recorder.startRecording();
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stopRecording(() => {
      setIsRecording(false);
    });
  };

  const sendAudioChunk = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const base64data = arrayBufferToBase64(arrayBuffer);
    wsRef.current?.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: base64data,
    }));
    // End of the audio sequence
    wsRef.current?.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    wsRef.current?.send(JSON.stringify({
      type: "response.create",
      response: { modalities: ["audio", "text"] },
    }));
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-semibold mb-4">🎙️ Realtime Voice Chat</h2>

      <div className="space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!isConnected}
            className="bg-green-500 text-white px-5 py-2 rounded-lg shadow hover:bg-green-600"
          >
            Start Talking
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-5 py-2 rounded-lg shadow hover:bg-red-600"
          >
            Stop
          </button>
        )}
      </div>

      <div className="mt-6 text-left max-w-md mx-auto">
        {messages.map((m, i) => (
          <p key={i} className={m.role === "assistant" ? "text-blue-600" : ""}>
            {m.role === "assistant" ? "🤖 " : "🗣️ "}
            {m.content}
          </p>
        ))}
      </div>
    </div>
  );
}
