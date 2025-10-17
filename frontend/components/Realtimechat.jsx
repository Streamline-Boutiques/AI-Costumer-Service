import React, { useEffect, useRef } from "react";

export default function RealtimeChat() {
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("wss://your-vercel-backend.vercel.app/realtime");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("AI:", data);
    };

    ws.onopen = () => {
      console.log("Connected to realtime backend ✅");
      ws.send(JSON.stringify({ type: "input_text", text: "Hello there!" }));
    };

    ws.onclose = () => console.log("WebSocket closed ❌");
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">🎧 Realtime Chat Test</h2>
      <p>Check your console for streaming responses!</p>
    </div>
  );
}
