# LocalChat

## Overview

LocalChat is a location-based anonymous chat application that allows users to communicate with others in their immediate vicinity. The app provides real-time messaging within customizable proximity ranges, featuring temporary usernames, message expiration, and content moderation tools. Built as a full-stack web application with a mobile-first design approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

The frontend follows a component-based architecture with separate concerns for UI components, business logic hooks, and utility functions. The application uses a mobile-first responsive design with dark/light theme support.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live messaging
- **API Design**: RESTful endpoints with WebSocket integration
- **Session Management**: In-memory storage with planned database migration
- **Middleware**: Custom logging, error handling, and request parsing

The server implements a hybrid storage pattern using an in-memory storage class that implements a standardized interface, making it easy to swap for database-backed storage later.

### Data Storage
- **Development**: In-memory storage using Map collections
- **Production Ready**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema validation

The data layer uses a repository pattern with interfaces that abstract storage implementation details. The schema includes users, messages, and reports with proper relationships and constraints.

### Real-time Features
- **WebSocket Communication**: Real-time message delivery
- **Location-based Filtering**: Messages filtered by geographic proximity
- **Typing Indicators**: Live user activity feedback
- **User Presence**: Active user count and connection status
- **Message Expiration**: Automatic cleanup of old messages (24-hour TTL)

### Authentication & Privacy
- **Anonymous System**: No user registration required
- **Temporary Identities**: Generated usernames with consistent color coding
- **Location Services**: Browser geolocation API integration
- **Privacy Controls**: Customizable proximity radius settings

### Content Moderation
- **Reporting System**: User-initiated content and behavior reports
- **Report Categories**: Spam, harassment, safety concerns, and policy violations
- **Administrative Interface**: Backend support for report management

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon database
- **drizzle-orm** & **drizzle-kit**: Type-safe database ORM and migration tools
- **express**: Web application framework for Node.js
- **ws**: WebSocket library for real-time communication

### Frontend UI Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Server state management and caching
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **wouter**: Minimalist routing library for React

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution environment for Node.js
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Utility Libraries
- **zod**: Schema validation library
- **date-fns**: Date manipulation utilities
- **clsx** & **tailwind-merge**: Conditional CSS class utilities
- **nanoid**: Unique ID generation
- **cmdk**: Command palette interface component

The application is designed to be deployment-ready for Replit environments with specific plugins and configurations for the platform's development workflow.