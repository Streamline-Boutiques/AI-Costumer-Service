import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Send, Mic, MicOff, Plus, Trash2, Bot, User } from "lucide-react";
import axios from "axios";
import RecordRTC from "recordrtc";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DemoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [sending, setSending] = useState(false);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  const [establishmentData, setEstablishmentData] = useState({
    establishment_name: "",
    establishment_type: "restaurant",
    address: "",
    phone: "",
    email: "",
    hours: {
      monday: "9:00-22:00",
      tuesday: "9:00-22:00",
      wednesday: "9:00-22:00",
      thursday: "9:00-22:00",
      friday: "9:00-23:00",
      saturday: "9:00-23:00",
      sunday: "10:00-21:00",
    },
    menu_items: [],
    services: ["reservations"],
  });

  const [newMenuItem, setNewMenuItem] = useState({ name: "", price: "", description: "" });
  const serviceOptions = ["reservations", "takeout", "delivery", "catering", "events", "bar service"];

  const handleInputChange = (field, value) => {
    setEstablishmentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (day, hours) => {
    setEstablishmentData((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: hours },
    }));
  };

  const addMenuItem = () => {
    if (newMenuItem.name && newMenuItem.price) {
      setEstablishmentData((prev) => ({
        ...prev,
        menu_items: [...prev.menu_items, { ...newMenuItem, id: Date.now() }],
      }));
      setNewMenuItem({ name: "", price: "", description: "" });
    }
  };

  const removeMenuItem = (index) => {
    setEstablishmentData((prev) => ({
      ...prev,
      menu_items: prev.menu_items.filter((_, i) => i !== index),
    }));
  };

  const toggleService = (service) => {
    setEstablishmentData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const startDemo = async () => {
    if (!establishmentData.establishment_name || !establishmentData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the restaurant name and address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/demo/session`, establishmentData);
      setSessionId(res.data.id);
      setStep(2);
      setChatMessages([
        {
          role: "assistant",
          content: `Hello! I'm the AI assistant for ${establishmentData.establishment_name}. Ask me about reservations, menu, or hours!`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      toast({ title: "Demo Error", description: "Failed to start demo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || sending) return;
    const message = userMessage.trim();
    setUserMessage("");
    setSending(true);

    const userMsg = { role: "user", content: message, timestamp: new Date().toISOString() };
    setChatMessages((p) => [...p, userMsg]);

    try {
      const res = await axios.post(`${API}/demo/chat`, {
        session_id: sessionId,
        message,
        is_voice: false,
      });
      const aiMsg = {
        role: "assistant",
        content: res.data.response,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((p) => [...p, aiMsg]);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Message failed.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // 🎙️ New: Voice Chat Integration
  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      recorderRef.current?.stopRecording(() => {});
      toast({ title: "Voice Chat", description: "Stopped recording." });
    } else {
      try {
        const ws = new WebSocket(
          "wss://ai-costumer-service-4ef494zsz-streamline-boutiques-projects.vercel.app/realtime"
        );
        wsRef.current = ws;
        ws.onopen = async () => {
          toast({ title: "Voice Connected", description: "Start speaking..." });
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new RecordRTC(stream, {
            type: "audio",
            mimeType: "audio/webm",
            recorderType: RecordRTC.StereoAudioRecorder,
            timeSlice: 1000,
            ondataavailable: (blob) => sendAudioChunk(blob),
          });
          recorder.startRecording();
          recorderRef.current = recorder;
          setIsRecording(true);
        };
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "response.audio.delta" && data.delta) {
              const audioChunk = base64ToArrayBuffer(data.delta);
              playAudioChunk(audioChunk);
            } else if (data.type === "response.text.delta" && data.delta) {
              setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.delta, timestamp: new Date().toISOString() },
              ]);
            }
          } catch (e) {
            console.log("Raw:", event.data);
          }
        };
      } catch (err) {
        console.error(err);
        toast({ title: "Voice Error", description: "Microphone or socket error.", variant: "destructive" });
      }
    }
  };

  const sendAudioChunk = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const base64data = arrayBufferToBase64(arrayBuffer);
    wsRef.current?.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64data }));
    wsRef.current?.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    wsRef.current?.send(
      JSON.stringify({
        type: "response.create",
        response: { modalities: ["audio", "text"] },
      })
    );
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const playAudioChunk = async (arrayBuffer) => {
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    await audioRef.current.play().catch(() => {});
  };

  const resetDemo = () => {
    setStep(1);
    setSessionId(null);
    setChatMessages([]);
    setUserMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">VoiceServe AI Demo</h1>
          {step === 2 && (
            <Button variant="outline" onClick={resetDemo}>
              New Demo
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {step === 1 ? (
          /* Setup form (unchanged) */
          <div className="text-center">
            <Button onClick={startDemo} disabled={loading} size="lg">
              {loading ? "Starting Demo..." : "Start AI Demo"}
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <span>AI Customer Service Chat</span>
                  <Badge variant="secondary" className="text-xs">
                    Live Demo
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto">
                {chatMessages.map((m, i) => (
                  <div key={i} className="mb-3 flex items-start space-x-2">
                    {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <div>
                      <p>{m.content}</p>
                      <p className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="p-4 border-t flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button
                  onClick={handleVoiceToggle}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button onClick={sendMessage} disabled={!userMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPage;
