import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, insertReportSchema, insertCallSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  interface ClientConnection {
    ws: WebSocket;
    userId?: string;
    location?: { latitude: number; longitude: number };
    radius?: number;
  }
  
  const clients = new Set<ClientConnection>();

  wss.on('connection', (ws) => {
    const client: ClientConnection = { ws };
    clients.add(client);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'user_join':
            client.userId = message.userId;
            client.location = message.location;
            client.radius = message.radius || 2;
            
            if (client.location) {
              await storage.updateUserLocation(client.userId!, client.location.latitude, client.location.longitude);
              await storage.updateUserRadius(client.userId!, client.radius);
            }
            
            // Send recent messages to the new user
            if (client.location) {
              const recentMessages = await storage.getMessages(
                client.location.latitude, 
                client.location.longitude, 
                client.radius, 
                20
              );
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'message_history',
                  messages: recentMessages
                }));
              }
            }
            break;

          case 'send_message':
            if (client.userId && client.location) {
              const newMessage = await storage.createMessage({
                userId: client.userId,
                username: message.username,
                content: message.content,
                latitude: client.location.latitude,
                longitude: client.location.longitude,
                radius: client.radius || 2
              });

              // Broadcast message to nearby users
              broadcastToNearbyUsers(newMessage, client.location.latitude, client.location.longitude, client.radius || 2);
            }
            break;

          case 'typing_start':
          case 'typing_stop':
            if (client.userId && client.location) {
              broadcastToNearbyUsers({
                type: message.type,
                userId: client.userId,
                username: message.username
              }, client.location.latitude, client.location.longitude, client.radius || 2, client.userId);
            }
            break;

          case 'update_location':
            client.location = message.location;
            if (client.userId && client.location) {
              await storage.updateUserLocation(client.userId, client.location.latitude, client.location.longitude);
            }
            break;

          case 'update_radius':
            client.radius = message.radius;
            if (client.userId) {
              await storage.updateUserRadius(client.userId, client.radius);
            }
            break;

          case 'initiate_call':
            if (client.userId) {
              const newCall = await storage.createCall({
                callerId: client.userId,
                callerUsername: message.callerUsername,
                receiverId: message.receiverId,
                receiverUsername: message.receiverUsername,
                callType: message.callType
              });

              // Send call invitation to receiver
              const receiverClient = findClientByUserId(message.receiverId);
              if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
                receiverClient.ws.send(JSON.stringify({
                  type: 'incoming_call',
                  callId: newCall.id,
                  callerId: client.userId,
                  callerUsername: message.callerUsername,
                  callType: message.callType
                }));
              }
            }
            break;

          case 'accept_call':
            await storage.updateCallStatus(message.callId, 'accepted', new Date());
            broadcastCallUpdate(message.callId, 'call_accepted');
            break;

          case 'decline_call':
            await storage.updateCallStatus(message.callId, 'declined');
            broadcastCallUpdate(message.callId, 'call_declined');
            break;

          case 'end_call':
            await storage.updateCallStatus(message.callId, 'ended', undefined, new Date());
            broadcastCallUpdate(message.callId, 'call_ended');
            break;

          case 'webrtc_offer':
          case 'webrtc_answer':
          case 'webrtc_ice_candidate':
            // Forward WebRTC signaling messages
            if (message.targetUserId) {
              const targetClient = findClientByUserId(message.targetUserId);
              if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
                targetClient.ws.send(JSON.stringify({
                  type: message.type,
                  ...message.data
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(client);
    });
  });

  function broadcastToNearbyUsers(message: any, latitude: number, longitude: number, radius: number, excludeUserId?: string) {
    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN && 
          client.location && 
          client.userId !== excludeUserId) {
        
        const distance = calculateDistance(
          latitude, longitude,
          client.location.latitude, client.location.longitude
        );
        
        if (distance <= Math.max(radius, client.radius || 2)) {
          client.ws.send(JSON.stringify({
            type: 'new_message',
            ...message
          }));
        }
      }
    });
  }

  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Radius of the Earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  function findClientByUserId(userId: string): ClientConnection | undefined {
    return Array.from(clients).find(client => client.userId === userId);
  }

  function broadcastCallUpdate(callId: string, eventType: string) {
    storage.getActiveCall(callId).then(call => {
      if (call) {
        const callerClient = findClientByUserId(call.callerId);
        const receiverClient = findClientByUserId(call.receiverId);

        [callerClient, receiverClient].forEach(client => {
          if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
              type: eventType,
              callId: call.id,
              status: call.status
            }));
          }
        });
      }
    });
  }

  // REST API endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const { latitude, longitude, radius = 2, limit = 50 } = req.query;
      
      if (!latitude || !longitude) {
        res.status(400).json({ message: "Latitude and longitude are required" });
        return;
      }

      const messages = await storage.getMessages(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string),
        parseInt(limit as string)
      );
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid report data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  });

  app.get("/api/nearby-users", async (req, res) => {
    try {
      const { latitude, longitude, radius = 2 } = req.query;
      
      if (!latitude || !longitude) {
        // Return demo users if no location provided for testing
        const demoUsers = [
          { id: "demo1", username: "CoolPanda" },
          { id: "demo2", username: "SwiftEagle" },
          { id: "demo3", username: "BrightFox" },
          { id: "demo4", username: "WarmWolf" },
          { id: "demo5", username: "HappyDolphin" }
        ];
        res.json({ count: demoUsers.length, users: demoUsers });
        return;
      }

      const users = await storage.getNearbyUsers(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string)
      );
      
      res.json({ count: users.length, users: users.map(u => ({ id: u.id, username: u.username })) });
    } catch (error) {
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });

  return httpServer;
}
