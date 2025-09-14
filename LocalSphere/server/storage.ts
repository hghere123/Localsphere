import { type User, type InsertUser, type Message, type InsertMessage, type Report, type InsertReport, type Call, type InsertCall } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocation(id: string, latitude: number, longitude: number): Promise<void>;
  updateUserRadius(id: string, radius: number): Promise<void>;
  updateUserLastSeen(id: string): Promise<void>;
  getNearbyUsers(latitude: number, longitude: number, radius: number): Promise<User[]>;
  
  // Message methods
  getMessages(latitude: number, longitude: number, radius: number, limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteExpiredMessages(): Promise<void>;
  
  // Report methods
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  
  // Call methods
  createCall(call: InsertCall): Promise<Call>;
  updateCallStatus(id: string, status: string, startedAt?: Date, endedAt?: Date): Promise<void>;
  getActiveCall(userId: string): Promise<Call | undefined>;
  getUserCalls(userId: string): Promise<Call[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private reports: Map<string, Report>;
  private calls: Map<string, Call>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.reports = new Map();
    this.calls = new Map();
    
    // Add some demo users and messages for testing
    this.seedDemoUsers();
    this.seedDemoMessages();
    
    // Clean up expired messages every hour
    setInterval(() => {
      this.deleteExpiredMessages();
    }, 60 * 60 * 1000);
  }

  private seedDemoUsers() {
    // Add demo users in a general downtown area
    const demoUsers = [
      {
        username: "CoolPanda",
        latitude: 40.7589,
        longitude: -73.9851,
        radius: 2
      },
      {
        username: "SwiftEagle",
        latitude: 40.7614,
        longitude: -73.9776,
        radius: 1
      },
      {
        username: "BrightFox",
        latitude: 40.7505,
        longitude: -73.9934,
        radius: 2
      },
      {
        username: "WarmWolf",
        latitude: 40.7648,
        longitude: -73.9808,
        radius: 5
      },
      {
        username: "HappyDolphin",
        latitude: 40.7580,
        longitude: -73.9855,
        radius: 1
      }
    ];

    demoUsers.forEach(demoUser => {
      const id = randomUUID();
      const user: User = {
        id,
        username: demoUser.username,
        latitude: demoUser.latitude,
        longitude: demoUser.longitude,
        radius: demoUser.radius,
        isActive: true,
        createdAt: new Date(),
        lastSeen: new Date()
      };
      this.users.set(id, user);
    });
  }

  private seedDemoMessages() {
    const demoMessages = [
      {
        username: "CoolPanda",
        content: "Anyone know what time the farmer's market closes today?",
        latitude: 40.7589,
        longitude: -73.9851,
        minutesAgo: 15
      },
      {
        username: "SwiftEagle", 
        content: "Just saw a food truck on 42nd street with amazing tacos! 🌮",
        latitude: 40.7614,
        longitude: -73.9776,
        minutesAgo: 8
      },
      {
        username: "BrightFox",
        content: "Is anyone else hearing that street musician by the park? They're incredible!",
        latitude: 40.7505,
        longitude: -73.9934,
        minutesAgo: 25
      },
      {
        username: "WarmWolf",
        content: "Coffee shop on the corner has free WiFi if anyone needs it",
        latitude: 40.7648,
        longitude: -73.9808,
        minutesAgo: 5
      }
    ];

    demoMessages.forEach(demoMessage => {
      const id = randomUUID();
      const messageTime = new Date();
      messageTime.setMinutes(messageTime.getMinutes() - demoMessage.minutesAgo);
      
      const message: Message = {
        id,
        userId: `demo-${demoMessage.username}`,
        username: demoMessage.username,
        content: demoMessage.content,
        latitude: demoMessage.latitude,
        longitude: demoMessage.longitude,
        radius: 2,
        createdAt: messageTime,
        expiresAt: new Date(messageTime.getTime() + 24 * 60 * 60 * 1000)
      };
      this.messages.set(id, message);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      lastSeen: new Date(),
      isActive: true
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLocation(id: string, latitude: number, longitude: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.latitude = latitude;
      user.longitude = longitude;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async updateUserRadius(id: string, radius: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.radius = radius;
      this.users.set(id, user);
    }
  }

  async updateUserLastSeen(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async getNearbyUsers(latitude: number, longitude: number, radius: number): Promise<User[]> {
    const users = Array.from(this.users.values());
    const nearbyUsers = users.filter(user => {
      if (!user.latitude || !user.longitude || !user.isActive) return false;
      const distance = this.calculateDistance(latitude, longitude, user.latitude, user.longitude);
      return distance <= radius;
    });
    return nearbyUsers;
  }

  async getMessages(latitude: number, longitude: number, radius: number, limit: number = 50): Promise<Message[]> {
    const messages = Array.from(this.messages.values());
    const nearbyMessages = messages
      .filter(message => {
        // Check if message is not expired
        if (message.expiresAt && message.expiresAt < new Date()) return false;
        
        if (!message.latitude || !message.longitude) return false;
        const distance = this.calculateDistance(latitude, longitude, message.latitude, message.longitude);
        return distance <= Math.max(radius, message.radius || 2);
      })
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    
    return nearbyMessages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteExpiredMessages(): Promise<void> {
    const now = new Date();
    for (const [id, message] of this.messages.entries()) {
      if (message.expiresAt && message.expiresAt < now) {
        this.messages.delete(id);
      }
    }
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = randomUUID();
    const call: Call = {
      ...insertCall,
      id,
      status: "pending",
      startedAt: null,
      endedAt: null,
      createdAt: new Date(),
    };
    this.calls.set(id, call);
    return call;
  }

  async updateCallStatus(id: string, status: string, startedAt?: Date, endedAt?: Date): Promise<void> {
    const call = this.calls.get(id);
    if (call) {
      call.status = status;
      if (startedAt) call.startedAt = startedAt;
      if (endedAt) call.endedAt = endedAt;
      this.calls.set(id, call);
    }
  }

  async getActiveCall(userId: string): Promise<Call | undefined> {
    const calls = Array.from(this.calls.values());
    return calls.find(call => 
      (call.callerId === userId || call.receiverId === userId) && 
      (call.status === "pending" || call.status === "accepted")
    );
  }

  async getUserCalls(userId: string): Promise<Call[]> {
    const calls = Array.from(this.calls.values());
    return calls
      .filter(call => call.callerId === userId || call.receiverId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Radius of the Earth in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const storage = new MemStorage();
