import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Phone, MessageSquare, Calendar, Clock, Star, ArrowRight, Bot, Headphones, Zap } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-blue-600" />,
      title: "AI-Powered Conversations",
      description: "Natural language processing handles customer inquiries, reservations, and questions 24/7 with human-like responses."
    },
    {
      icon: <Phone className="h-8 w-8 text-blue-600" />,
      title: "Voice & Text Support", 
      description: "Seamlessly handle both phone calls and text messages with advanced voice recognition and synthesis capabilities."
    },
    {
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      title: "Smart Reservations",
      description: "Automatically manage bookings, check availability, and send confirmations while understanding complex scheduling requests."
    },
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "24/7 Availability",
      description: "Never miss a customer again. Your AI assistant works around the clock to capture every opportunity."
    },
    {
      icon: <Headphones className="h-8 w-8 text-blue-600" />,
      title: "Multi-Channel Support",
      description: "Integrate with your existing phone system, website chat, and messaging platforms for unified customer service."
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Instant Setup",
      description: "Get your AI assistant running in minutes. Simply input your restaurant details and start serving customers better."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Owner, Bella Vista Restaurant", 
      content: "Our reservations increased by 40% after implementing the AI system. It never sleeps and handles complex requests perfectly.",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      role: "Manager, The Craft Bar",
      content: "The voice quality is incredible - customers can't tell they're talking to an AI. It's revolutionized our customer service.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Director, Fine Dining Group", 
      content: "We've deployed this across 8 locations. The consistency and professionalism is exactly what we needed.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">VoiceServe AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 transition-colors">Demo</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                data-testid="nav-login-btn"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Zap className="h-3 w-3 mr-1" />
                AI-Powered Customer Service
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Never Miss Another
                <span className="text-blue-600"> Customer Call</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your restaurant or bar with AI that handles reservations, 
                answers questions, and provides exceptional customer service through 
                natural voice and text conversations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate('/demo')}
                  data-testid="hero-try-demo-btn"
                >
                  Try Live Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => navigate('/dashboard')}
                  data-testid="hero-get-started-btn"
                >
                  Get Started
                </Button>
              </div>
            </div>
            <div className="lg:text-center">
              <div className="relative">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-auto">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">AI Assistant</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Active
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="chat-message assistant">
                      Hello! I'd be happy to help you make a reservation at Bella Vista. What day and time works for you?
                    </div>
                    <div className="chat-message user">
                      I'd like a table for 4 people this Friday at 7 PM
                    </div>
                    <div className="chat-message assistant">
                      Perfect! I have availability for 4 people this Friday at 7:00 PM. May I have your name for the reservation?
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Live Demo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose VoiceServe AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI technology designed specifically for restaurants and bars, 
              delivering exceptional customer experiences while you focus on what you do best.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="feature-card border-0 shadow-sm">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section id="demo" className="py-16 lg:py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Experience the power of AI customer service firsthand. 
            Try our interactive demo with your own restaurant details.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-50"
            onClick={() => navigate('/demo')}
            data-testid="demo-cta-btn"
          >
            Try Interactive Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Restaurant Owners
            </h2>
            <p className="text-xl text-gray-600">
              Join hundreds of establishments already using VoiceServe AI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Bot className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">VoiceServe AI</span>
              </div>
              <p className="text-gray-400">
                Revolutionary AI customer service for restaurants and bars.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VoiceServe AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;