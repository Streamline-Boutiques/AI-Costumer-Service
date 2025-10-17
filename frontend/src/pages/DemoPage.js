import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Send, Mic, MicOff, Plus, Trash2, Bot, User } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DemoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Setup, 2: Chat
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Form data
  const [establishmentData, setEstablishmentData] = useState({
    establishment_name: '',
    establishment_type: 'restaurant',
    address: '',
    phone: '',
    email: '',
    hours: {
      monday: '9:00-22:00',
      tuesday: '9:00-22:00',
      wednesday: '9:00-22:00',
      thursday: '9:00-22:00',
      friday: '9:00-23:00',
      saturday: '9:00-23:00',
      sunday: '10:00-21:00'
    },
    menu_items: [],
    services: ['reservations']
  });
  
  const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', description: '' });
  
  const serviceOptions = [
    'reservations',
    'takeout', 
    'delivery',
    'catering',
    'events',
    'bar service'
  ];
  
  const handleInputChange = (field, value) => {
    setEstablishmentData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleHoursChange = (day, hours) => {
    setEstablishmentData(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: hours }
    }));
  };
  
  const addMenuItem = () => {
    if (newMenuItem.name && newMenuItem.price) {
      setEstablishmentData(prev => ({
        ...prev,
        menu_items: [...prev.menu_items, { ...newMenuItem, id: Date.now() }]
      }));
      setNewMenuItem({ name: '', price: '', description: '' });
    }
  };
  
  const removeMenuItem = (index) => {
    setEstablishmentData(prev => ({
      ...prev,
      menu_items: prev.menu_items.filter((_, i) => i !== index)
    }));
  };
  
  const toggleService = (service) => {
    setEstablishmentData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };
  
  const startDemo = async () => {
    if (!establishmentData.establishment_name || !establishmentData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the restaurant name and address to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/demo/session`, establishmentData);
      setSessionId(response.data.id);
      setStep(2);
      
      // Add initial AI greeting
      setChatMessages([{
        role: 'assistant',
        content: `Hello! I'm the AI assistant for ${establishmentData.establishment_name}. I'm here to help with reservations, menu questions, hours, and anything else you'd like to know about our ${establishmentData.establishment_type}. How can I assist you today?`,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      console.error('Error starting demo:', error);
      toast({
        title: "Demo Error", 
        description: "Failed to start demo session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!userMessage.trim() || sending) return;
    
    const message = userMessage.trim();
    setUserMessage('');
    setSending(true);
    
    // Add user message to chat
    const userMsg = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    
    try {
      const response = await axios.post(`${API}/demo/chat`, {
        session_id: sessionId,
        message: message,
        is_voice: false
      });
      
      // Add AI response to chat
      const aiMsg = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Message Error",
        description: "Failed to send message. Please try again.", 
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast({
        title: "Voice Recording",
        description: "Voice recording stopped. (Voice integration coming soon)",
      });
    } else {
      // Start recording
      setIsRecording(true);
      toast({
        title: "Voice Recording",
        description: "Voice recording started. (Voice integration coming soon)",
      });
      
      // Auto-stop after 5 seconds for demo
      setTimeout(() => {
        setIsRecording(false);
      }, 5000);
    }
  };
  
  const resetDemo = () => {
    setStep(1);
    setSessionId(null);
    setChatMessages([]);
    setUserMessage('');
    setEstablishmentData({
      establishment_name: '',
      establishment_type: 'restaurant',
      address: '',
      phone: '',
      email: '',
      hours: {
        monday: '9:00-22:00',
        tuesday: '9:00-22:00',
        wednesday: '9:00-22:00',
        thursday: '9:00-22:00',
        friday: '9:00-23:00',
        saturday: '9:00-23:00',
        sunday: '10:00-21:00'
      },
      menu_items: [],
      services: ['reservations']
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
              data-testid="back-to-home-btn"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              VoiceServe AI Demo
            </h1>
            {step === 2 && (
              <Button 
                variant="outline" 
                onClick={resetDemo}
                data-testid="new-demo-btn"
              >
                New Demo
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 ? (
          /* Setup Form */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Setup Your Establishment</CardTitle>
                <CardDescription>
                  Enter your restaurant or bar details to customize the AI demo experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Establishment Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Bella Vista Restaurant"
                      value={establishmentData.establishment_name}
                      onChange={(e) => handleInputChange('establishment_name', e.target.value)}
                      data-testid="establishment-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={establishmentData.establishment_type}
                      onValueChange={(value) => handleInputChange('establishment_type', value)}
                    >
                      <SelectTrigger data-testid="establishment-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="cafe">Cafe</SelectItem>
                        <SelectItem value="bistro">Bistro</SelectItem>
                        <SelectItem value="pub">Pub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="123 Main Street, City, State"
                      value={establishmentData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      data-testid="establishment-address-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 123-4567"
                      value={establishmentData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      data-testid="establishment-phone-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@restaurant.com"
                    value={establishmentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    data-testid="establishment-email-input"
                  />
                </div>
                
                {/* Hours */}
                <div className="space-y-4">
                  <Label>Hours of Operation</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(establishmentData.hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Label className="w-20 text-sm capitalize">{day}</Label>
                        <Input
                          placeholder="9:00-22:00"
                          value={hours}
                          onChange={(e) => handleHoursChange(day, e.target.value)}
                          className="flex-1"
                          data-testid={`hours-${day}-input`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Services */}
                <div className="space-y-4">
                  <Label>Services Offered</Label>
                  <div className="flex flex-wrap gap-2">
                    {serviceOptions.map((service) => (
                      <Badge
                        key={service}
                        variant={establishmentData.services.includes(service) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => toggleService(service)}
                        data-testid={`service-${service}-badge`}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="space-y-4">
                  <Label>Menu Items (Optional)</Label>
                  
                  {/* Add new menu item */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <Input
                      placeholder="Item name"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem(prev => ({...prev, name: e.target.value}))}
                      data-testid="menu-item-name-input"
                    />
                    <Input
                      placeholder="Price"
                      value={newMenuItem.price}
                      onChange={(e) => setNewMenuItem(prev => ({...prev, price: e.target.value}))}
                      data-testid="menu-item-price-input"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem(prev => ({...prev, description: e.target.value}))}
                      data-testid="menu-item-description-input"
                    />
                    <Button onClick={addMenuItem} data-testid="add-menu-item-btn">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Existing menu items */}
                  {establishmentData.menu_items.length > 0 && (
                    <div className="space-y-2">
                      {establishmentData.menu_items.map((item, index) => (
                        <div key={item.id || index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-blue-600 ml-2">{item.price}</span>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeMenuItem(index)}
                            data-testid={`remove-menu-item-${index}-btn`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={startDemo} 
                    disabled={loading}
                    className={`w-full md:w-auto ${loading ? 'button-loading' : ''}`}
                    size="lg"
                    data-testid="start-demo-btn"
                  >
                    {loading ? 'Starting Demo...' : 'Start AI Demo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Chat Interface */
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Establishment Info */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{establishmentData.establishment_name}</CardTitle>
                    <CardDescription className="capitalize">
                      {establishmentData.establishment_type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">{establishmentData.address}</p>
                    </div>
                    {establishmentData.phone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <p className="text-sm">{establishmentData.phone}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Services</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {establishmentData.services.map(service => (
                          <Badge key={service} variant="secondary" className="text-xs capitalize">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {establishmentData.menu_items.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Sample Menu</Label>
                        <div className="space-y-1 mt-1">
                          {establishmentData.menu_items.slice(0, 3).map((item, index) => (
                            <div key={index} className="text-xs">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-blue-600 ml-1">{item.price}</span>
                            </div>
                          ))}
                          {establishmentData.menu_items.length > 3 && (
                            <p className="text-xs text-gray-500">+{establishmentData.menu_items.length - 3} more items</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <span>AI Customer Service Chat</span>
                      <Badge variant="secondary" className="text-xs">Live Demo</Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  {/* Chat Messages */}
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="chat-container h-full" data-testid="chat-container">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`chat-message ${message.role}`}
                          data-testid={`chat-message-${message.role}-${index}`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' ? (
                              <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                            ) : (
                              <User className="h-4 w-4 mt-1 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p>{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {sending && (
                        <div className="chat-message assistant">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-4 w-4" />
                            <span>AI is typing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {/* Chat Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={sending}
                        data-testid="chat-input"
                      />
                      <Button
                        onClick={handleVoiceToggle}
                        variant={isRecording ? "destructive" : "outline"}
                        size="icon"
                        className={isRecording ? "recording-pulse" : ""}
                        data-testid="voice-toggle-btn"
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={sendMessage}
                        disabled={!userMessage.trim() || sending}
                        data-testid="send-message-btn"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Try asking about reservations, menu items, hours, or services
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPage;