import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Settings, Send, AlertTriangle, Smile, Image, CircleDot, Lightbulb, ThumbsUp, Phone, Video } from "lucide-react";
import { SettingsModal } from "@/components/settings-modal";
import { ReportModal } from "@/components/report-modal";
import CallInterface from "@/components/call-interface";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGeolocation } from "@/hooks/use-geolocation";
import { generateUsername, generateUserColor } from "@/lib/proximity";
import type { Message } from "@shared/schema";

interface ChatMessage extends Message {
  isOwn?: boolean;
  color?: string;
  initials?: string;
}

export function ChatInterface() {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showProximityDropdown, setShowProximityDropdown] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [currentRadius, setCurrentRadius] = useState(2);
  const [currentUsername] = useState(() => generateUsername());
  const [userId] = useState(() => crypto.randomUUID());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { location } = useGeolocation();
  const { sendMessage: sendWsMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'new_message') {
        const newMessage: ChatMessage = {
          id: data.id,
          userId: data.userId,
          username: data.username,
          content: data.content,
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
          isOwn: data.userId === userId,
          color: generateUserColor(data.username),
          initials: data.username.substring(0, 2).toUpperCase()
        };
        setMessages(prev => [...prev, newMessage]);
      } else if (data.type === 'message_history') {
        const historyMessages = data.messages.map((msg: Message) => ({
          ...msg,
          isOwn: msg.userId === userId,
          color: generateUserColor(msg.username),
          initials: msg.username.substring(0, 2).toUpperCase()
        }));
        setMessages(historyMessages);
      } else if (data.type === 'typing_start') {
        if (data.userId !== userId) {
          setTypingUsers(prev => new Set([...Array.from(prev), data.username]));
        }
      } else if (data.type === 'typing_stop') {
        if (data.userId !== userId) {
          setTypingUsers(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(data.username);
            return newSet;
          });
        }
      }
    },
    userId,
    location,
    radius: currentRadius
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    // Fetch nearby user count
    if (location) {
      fetch(`/api/nearby-users?latitude=${location.latitude}&longitude=${location.longitude}&radius=${currentRadius}`)
        .then(res => res.json())
        .then(data => setActiveUserCount(data.count))
        .catch(console.error);
    }
  }, [location, currentRadius]);

  const handleSendMessage = () => {
    if (message.trim() && isConnected && location) {
      sendWsMessage({
        type: 'send_message',
        username: currentUsername,
        content: message.trim()
      });
      
      setMessage("");
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      sendWsMessage({
        type: 'typing_stop',
        username: currentUsername
      });
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    
    if (value.trim() && isConnected) {
      // Send typing indicator
      sendWsMessage({
        type: 'typing_start',
        username: currentUsername
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendWsMessage({
          type: 'typing_stop',
          username: currentUsername
        });
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const sendIceBreaker = (type: string) => {
    const messages = {
      'coffee': '☕ Best coffee spots?',
      'events': '🎉 Local events tonight?',
      'parking': '🚗 Good parking here?',
      'food': '🍕 Food recommendations?'
    };
    
    const iceBreaker = messages[type as keyof typeof messages];
    if (iceBreaker && isConnected && location) {
      sendWsMessage({
        type: 'send_message',
        username: currentUsername,
        content: iceBreaker
      });
    }
  };

  const setRadius = (radius: number) => {
    setCurrentRadius(radius);
    setShowProximityDropdown(false);
    
    if (isConnected) {
      sendWsMessage({
        type: 'update_radius',
        radius: radius
      });
    }
  };

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return 'just now';
    
    const now = new Date();
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    
    // Validate that messageDate is a valid Date object
    if (isNaN(messageDate.getTime())) return 'just now';
    
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
    return `${Math.floor(diffInMinutes / 1440)} day ago`;
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="chat-interface">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="text-sm text-primary-foreground" size={16} />
            </div>
            <div>
              <h1 className="font-semibold text-sm" data-testid="text-area-name">
                {location ? "Downtown Area" : "Finding location..."}
              </h1>
              <p className="text-xs text-muted-foreground" data-testid="text-user-count">
                {activeUserCount} people nearby
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Proximity Selector */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowProximityDropdown(!showProximityDropdown)}
              className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-xs font-medium"
              data-testid="button-proximity-selector"
            >
              <CircleDot className="text-xs mr-1" size={12} />
              {currentRadius} mi
            </Button>
            
            {/* Proximity Dropdown */}
            {showProximityDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 p-2 min-w-[120px]">
                <div className="space-y-1">
                  {[0.5, 1, 2, 5].map(radius => (
                    <button
                      key={radius}
                      onClick={() => setRadius(radius)}
                      className={`w-full text-left px-3 py-2 hover:bg-muted rounded text-sm flex items-center justify-between ${currentRadius === radius ? 'bg-muted' : ''}`}
                      data-testid={`button-radius-${radius}`}
                    >
                      <span className="flex items-center">
                        <CircleDot className="text-accent mr-2" size={12} />
                        {radius} mile{radius !== 1 ? 's' : ''}
                      </span>
                      {currentRadius === radius && <span className="text-accent">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-muted rounded-lg"
            data-testid="button-settings"
          >
            <Settings className="text-muted-foreground" size={16} />
          </Button>
        </div>
      </header>

      {/* Ice Breaker Suggestions */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center space-x-2 mb-2">
          <Lightbulb className="text-accent" size={16} />
          <span className="text-sm font-medium">What's happening nearby?</span>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendIceBreaker('coffee')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs"
            data-testid="button-icebreaker-coffee"
          >
            ☕ Best coffee spots?
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendIceBreaker('events')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs"
            data-testid="button-icebreaker-events"
          >
            🎉 Local events tonight?
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendIceBreaker('parking')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs"
            data-testid="button-icebreaker-parking"
          >
            🚗 Good parking here?
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => sendIceBreaker('food')}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs"
            data-testid="button-icebreaker-food"
          >
            🍕 Food recommendations?
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
        {/* System Welcome Message */}
        {location && (
          <div className="text-center">
            <div className="inline-block bg-muted text-muted-foreground px-4 py-2 rounded-full text-xs">
              Welcome to Downtown Area chat! {activeUserCount} people are nearby
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.isOwn ? 'flex-row-reverse' : ''} flex items-start space-x-2`}>
            {msg.isOwn ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-white">You</span>
                </div>
                <div className="flex-1">
                  <div className={`flex items-center space-x-2 mb-1 ${msg.isOwn ? 'justify-end' : ''}`}>
                    {msg.isOwn && <span className="text-xs text-muted-foreground">{formatTimeAgo(msg.createdAt!)}</span>}
                    <span className="text-sm font-medium">You</span>
                    {!msg.isOwn && <span className="text-xs text-muted-foreground">{formatTimeAgo(msg.createdAt!)}</span>}
                  </div>
                  <div className={`rounded-lg p-3 max-w-xs ${msg.isOwn ? 'bg-primary text-primary-foreground rounded-tr-none ml-auto' : 'bg-card border border-border rounded-tl-none'}`}>
                    <p className="text-sm" data-testid={`message-${msg.id}`}>{msg.content}</p>
                  </div>
                  {msg.isOwn && (
                    <div className="flex items-center space-x-3 mt-2 justify-end">
                      <span className="text-xs text-muted-foreground">✓ Sent</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${msg.color}, ${msg.color}dd)` }}
                >
                  <span className="text-xs font-medium text-white">{msg.initials}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">{msg.username}</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(msg.createdAt!)}</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg rounded-tl-none p-3 max-w-xs">
                    <p className="text-sm" data-testid={`message-${msg.id}`}>{msg.content}</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
                      <ThumbsUp size={12} />
                      <span>0</span>
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground">Reply</button>
                    <button 
                      className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCallInterface(true)}
                      data-testid={`button-audio-call-${msg.id}`}
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </button>
                    <button 
                      className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCallInterface(true)}
                      data-testid={`button-video-call-${msg.id}`}
                    >
                      <Video size={12} />
                      <span>Video</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="chat-bubble typing-indicator">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {Array.from(typingUsers)[0]?.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">{Array.from(typingUsers)[0]}</span>
                </div>
                <div className="bg-card border border-border rounded-lg rounded-tl-none p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="bg-background border border-border rounded-lg px-4 py-3">
              <Textarea
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full bg-transparent resize-none text-sm focus:outline-none border-none shadow-none p-0 min-h-0"
                rows={1}
                data-testid="input-message"
              />
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || !isConnected}
            className="p-3 rounded-lg"
            data-testid="button-send-message"
          >
            <Send size={16} />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4">
            <button className="text-muted-foreground hover:text-foreground text-sm">
              <Smile size={16} />
            </button>
            <button className="text-muted-foreground hover:text-foreground text-sm">
              <Image size={16} />
            </button>
          </div>
          
          {/* Emergency Report Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReport(true)}
            className="flex items-center space-x-1 text-destructive hover:text-destructive/80 text-xs p-1"
            data-testid="button-report"
          >
            <AlertTriangle size={14} />
            <span>Report</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentUsername={currentUsername}
        currentRadius={currentRadius}
        onRadiusChange={setRadius}
      />
      
      <ReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
