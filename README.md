# LocalChat

A proximity-based anonymous chat application that connects users with people nearby for local conversations. Features real-time messaging, voice/video calling, and privacy-focused design with no registration required.

![LocalChat Demo](https://img.shields.io/badge/Status-Active-green) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### Core Messaging
- **Real-time Chat**: WebSocket-powered instant messaging with typing indicators
- **Location-based Matching**: Connect with users within 1-5 mile radius
- **Anonymous System**: No registration required, temporary usernames generated
- **Message Expiration**: 24-hour automatic message deletion for privacy
- **Proximity Controls**: Adjustable radius settings (1-5 miles)

### Voice & Video Calling
- **Audio Calls**: High-quality peer-to-peer voice calling
- **Video Calls**: WebRTC-powered video communication
- **Call Controls**: Mute, camera toggle, and call management
- **Real-time Signaling**: Instant call notifications and status updates

### Privacy & Safety
- **Anonymous Users**: No personal data collection or storage
- **Location Privacy**: Coordinates encrypted, no exact addresses shared
- **Content Moderation**: User reporting system with multiple categories
- **Temporary Data**: All messages and calls automatically expire

### User Experience
- **Mobile-first Design**: Optimized for smartphones and tablets
- **Dark/Light Themes**: Automatic theme switching support
- **Ice Breaker Messages**: Quick conversation starters
- **Live Activity Feed**: See who's nearby and active
- **Typing Indicators**: Real-time user activity feedback

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Wouter** for lightweight routing
- **TanStack Query** for state management
- **Vite** for development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **WebSocket** (ws library) for real-time communication
- **Drizzle ORM** for database operations
- **Zod** for schema validation

### Real-time & Communication
- **WebRTC** for peer-to-peer video/audio
- **WebSocket** for messaging and signaling
- **STUN servers** for NAT traversal

### Database & Storage
- **In-memory storage** for current implementation
- **PostgreSQL** (Neon serverless) configured for future production use
- **Drizzle ORM** ready for database migration
- **Manual cleanup** for demo data (automatic expiration planned)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Modern web browser with WebRTC support
- **HTTPS required** for WebRTC in production (camera/microphone access)

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd localchat
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Configuration
- **WebSocket endpoint**: `/ws` (automatically configured)
- **STUN servers**: Google's public STUN server (stun.l.google.com:19302)
- **Storage**: In-memory (resets on server restart)

### Production Deployment
**Note**: Current version uses in-memory storage. For production:
1. **Set up PostgreSQL database** (Drizzle schema ready)
2. **Configure environment variables** for database connection
3. **Enable HTTPS** (required for WebRTC camera/microphone access)
4. **Update storage** from MemStorage to database implementation

## 🎯 Usage Guide

### Getting Started
1. **Open the application** in your web browser
2. **Allow location access** when prompted
3. **Choose a proximity radius** (1-5 miles)
4. **Start chatting** with nearby users

### Messaging
- Type your message in the input field
- Press Enter or click Send to post
- Use ice breaker buttons for quick conversation starters
- Messages automatically expire after 24 hours

### Voice & Video Calls
- Click the **phone icon** on any message to start an audio call with that user
- Click the **video icon** to start a video call with that user
- **Accept or decline** incoming calls using the call interface
- Use **mute/unmute** and **camera controls** during calls
- **End calls** using the red phone button

**Testing calls**: Open two browser tabs/windows and allow location + camera/microphone permissions in both

### Privacy Controls
- **Adjust proximity radius** in the header dropdown
- **Report inappropriate content** using the flag button
- **Block users** through the report system
- All data is **automatically deleted** after 24 hours

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │   PostgreSQL    │
│                 │    │                 │    │    Database     │
│  - Chat UI      │◄──►│  - REST API     │◄──►│                 │
│  - WebRTC       │    │  - WebSocket    │    │  - Messages     │
│  - Geolocation  │    │  - Call Signal  │    │  - Users        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User connects** → WebSocket established
2. **Location shared** → Proximity matching begins
3. **Messages sent** → Broadcast to nearby users
4. **Calls initiated** → WebRTC signaling via WebSocket
5. **Data cleanup** → Automatic expiration handling

### Security Measures
- **No persistent user data** storage
- **Encrypted location** coordinates
- **Temporary session** management
- **Content filtering** and reporting
- **WebRTC encryption** for calls

## 🔧 Development

### Project Structure
```
├── client/src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions
│   └── pages/         # Application pages
├── server/
│   ├── routes.ts      # API routes & WebSocket
│   ├── storage.ts     # Data persistence layer
│   └── index.ts       # Server entry point
├── shared/
│   └── schema.ts      # Shared type definitions
└── package.json
```

### Key Components
- **ChatInterface**: Main chat UI with messaging
- **CallInterface**: Voice/video call management
- **SettingsModal**: Proximity and user settings
- **ReportModal**: Content moderation interface

### WebSocket Events
```typescript
// Messaging
'user_join', 'send_message', 'typing_start', 'typing_stop'

// Calling  
'initiate_call', 'accept_call', 'decline_call', 'end_call'

// WebRTC Signaling
'webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate'
```

### API Endpoints
```
GET  /api/nearby-users     # Get users in proximity
GET  /api/messages         # Get location-based messages
POST /api/reports          # Submit content reports
POST /api/users           # Create user session
```

## 🛡️ Privacy & Security

### Data Protection
- **No personal information** collected or stored
- **Location data** encrypted and approximate only
- **Automatic data deletion** after 24 hours
- **No message history** persistence
- **Anonymous user sessions** only

### Safety Features
- **Content reporting** system
- **User blocking** capabilities
- **Community guidelines** enforcement
- **Automatic moderation** tools
- **Safe communication** practices

### Technical Security
- **WebRTC encryption** for all calls
- **WebSocket** connections (WSS recommended for production)
- **Input validation** and sanitization
- **Basic message validation** (full rate limiting planned)

## ⚠️ Current Limitations

### Development State
- **In-memory storage**: Data resets on server restart
- **No authentication**: Anonymous-only system
- **No persistent data**: Messages/calls don't survive restarts
- **Basic moderation**: Reporting system in place, enforcement planned

### Browser Requirements
- **HTTPS required** for camera/microphone access in production
- **Modern WebRTC support** needed for calls
- **Location services** must be enabled
- **Two users needed** for testing call functionality

## 🤝 Contributing

### Development Guidelines
1. **Follow TypeScript** best practices
2. **Use existing UI components** from Shadcn/ui
3. **Write tests** for new features
4. **Document API changes** thoroughly
5. **Respect privacy** principles in all implementations

### Contribution Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Code Style
- **ESLint** and **Prettier** configured
- **TypeScript strict mode** enabled
- **Functional components** with hooks preferred
- **Descriptive variable names** and comments

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting

**Camera/Microphone not working?**
- Check browser permissions for camera and microphone access
- Ensure you're using HTTPS (required for WebRTC)
- Try refreshing the page and allowing permissions again

**Not seeing nearby users?**
- Verify location services are enabled
- Check if you're in an area with other users
- Try increasing your proximity radius

**Messages not sending?**
- Check your internet connection
- Ensure WebSocket connection is established
- Try refreshing the page

**Call quality issues?**
- Check your internet connection speed
- Ensure other applications aren't using bandwidth
- Try switching between audio and video calls

### Browser Compatibility
- **Chrome 80+** (recommended)
- **Firefox 75+**
- **Safari 14+**
- **Edge 80+**

### System Requirements
- **Internet connection** required
- **Location services** enabled
- **Camera/microphone** for voice/video calls
- **Modern browser** with WebRTC support

## 🔮 Roadmap

### Upcoming Features
- [ ] **Group conversations** with multiple nearby users
- [ ] **Message reactions** and emoji responses
- [ ] **Photo sharing** with automatic expiration
- [ ] **Voice messages** for asynchronous communication
- [ ] **Event creation** for local meetups
- [ ] **Interest-based matching** beyond just proximity
- [ ] **Push notifications** for important updates

### Technical Improvements
- [ ] **Progressive Web App** (PWA) support
- [ ] **Offline message queuing** 
- [ ] **Advanced moderation** tools
- [ ] **Performance optimizations**
- [ ] **Enhanced security** measures
- [ ] **Multi-language support**

---

**LocalChat** - Connecting people through proximity, one conversation at a time. 🗨️📍