import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';
import { 
  Building2, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  User,
  GoogleIcon,
  LogOut
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [establishments, setEstablishments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
      await loadEstablishments();
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };
  
  const loadEstablishments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API}/establishments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEstablishments(response.data);
    } catch (error) {
      console.error('Failed to load establishments:', error);
    }
  };
  
  const handleGoogleLogin = async () => {
    // Mock Google login for demo
    toast({
      title: "Google Login",
      description: "Google OAuth integration coming soon. Using demo login.",
    });
    
    // Simulate successful login
    const mockUser = {
      id: 'demo-user-123',
      email: 'demo@restaurant.com',
      name: 'Demo Restaurant Owner',
      provider: 'google'
    };
    
    const mockToken = 'demo-jwt-token';
    
    localStorage.setItem('auth_token', mockToken);
    setUser(mockUser);
    setIsAuthenticated(true);
    
    // Load demo establishment
    const demoEstablishment = {
      id: 'demo-est-123',
      user_id: mockUser.id,
      name: 'Bella Vista Restaurant',
      type: 'restaurant',
      address: '123 Main Street, Downtown, CA 90210',
      phone: '(555) 123-4567',
      email: 'info@bellavista.com',
      hours: {
        monday: '11:00-22:00',
        tuesday: '11:00-22:00',
        wednesday: '11:00-22:00',
        thursday: '11:00-23:00',
        friday: '11:00-23:00',
        saturday: '10:00-23:00',
        sunday: '10:00-21:00'
      },
      menu_items: [
        { name: 'Margherita Pizza', price: '$18', description: 'Fresh mozzarella, tomatoes, basil' },
        { name: 'Caesar Salad', price: '$12', description: 'Romaine lettuce, parmesan, croutons' },
        { name: 'Grilled Salmon', price: '$28', description: 'Atlantic salmon with seasonal vegetables' }
      ],
      services: ['reservations', 'takeout', 'delivery'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEstablishments([demoEstablishment]);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    setEstablishments([]);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
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
              <h1 className="text-xl font-semibold text-gray-900">Client Dashboard</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        {/* Login Form */}
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md w-full mx-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to manage your restaurant's AI customer service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    This is a demo dashboard. Click "Continue with Google" to see sample data.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center space-x-2"
                  size="lg"
                  data-testid="google-login-btn"
                >
                  <User className="h-5 w-5" />
                  <span>Continue with Google</span>
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  Don't have an account? Google OAuth will create one automatically.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
                data-testid="back-to-home-btn"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.name}
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('overview')}
                data-testid="overview-tab-btn"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'establishments' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('establishments')}
                data-testid="establishments-tab-btn"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Establishments
              </Button>
              <Button
                variant={activeTab === 'conversations' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('conversations')}
                data-testid="conversations-tab-btn"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversations
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('settings')}
                data-testid="settings-tab-btn"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Establishments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{establishments.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">AI Conversations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">247</div>
                      <p className="text-xs text-green-600">+12% this week</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Reservations Made</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">89</div>
                      <p className="text-xs text-green-600">+8% this week</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Reservation confirmed</p>
                            <p className="text-xs text-gray-500">Table for 4, Friday 7:00 PM</p>
                          </div>
                          <div className="text-xs text-gray-400">2 min ago</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Menu inquiry answered</p>
                            <p className="text-xs text-gray-500">Customer asked about gluten-free options</p>
                          </div>
                          <div className="text-xs text-gray-400">5 min ago</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Hours inquiry</p>
                            <p className="text-xs text-gray-500">Customer checked Sunday hours</p>
                          </div>
                          <div className="text-xs text-gray-400">8 min ago</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" onClick={() => navigate('/demo')} data-testid="try-demo-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Try AI Demo
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('establishments')} data-testid="manage-establishments-btn">
                        <Edit className="h-4 w-4 mr-2" />
                        Manage Establishments
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('conversations')} data-testid="view-conversations-btn">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Conversations
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === 'establishments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Your Establishments</h2>
                  <Button data-testid="add-establishment-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
                
                {establishments.length > 0 ? (
                  <div className="space-y-4">
                    {establishments.map((est) => (
                      <Card key={est.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{est.name}</CardTitle>
                              <CardDescription className="capitalize">
                                {est.type} • {est.address}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" data-testid={`edit-establishment-${est.id}-btn`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" data-testid={`delete-establishment-${est.id}-btn`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-gray-600">Contact</Label>
                              <div>{est.phone}</div>
                              <div>{est.email}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Services</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {est.services.map(service => (
                                  <Badge key={service} variant="secondary" className="text-xs capitalize">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Menu Items</Label>
                              <div className="text-xs text-gray-500">
                                {est.menu_items.length} items configured
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Establishments Yet</h3>
                      <p className="text-gray-600 mb-4">
                        Add your first restaurant or bar to get started with AI customer service.
                      </p>
                      <Button data-testid="add-first-establishment-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Establishment
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {activeTab === 'conversations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">AI Conversations</h2>
                
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversation History</h3>
                    <p className="text-gray-600 mb-4">
                      View and analyze AI conversations with your customers.
                    </p>
                    <Alert>
                      <AlertDescription>
                        Conversation history and analytics features coming soon.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={user?.name || ''} disabled />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={user?.email || ''} disabled />
                      </div>
                    </div>
                    <Alert>
                      <AlertDescription>
                        Account settings and preferences will be available in the full version.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertDescription>
                        AI behavior customization, voice settings, and integration preferences coming soon.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;