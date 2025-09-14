// Generate a random username for anonymous chat
export function generateUsername(): string {
  const adjectives = [
    "Happy", "Sunny", "Bright", "Swift", "Clever", "Kind", "Brave", "Calm",
    "Gentle", "Warm", "Cool", "Quick", "Smart", "Wise", "Bold", "Free",
    "Pure", "Fresh", "Noble", "Magic", "Golden", "Silver", "Crystal", "Diamond"
  ];
  
  const animals = [
    "Tiger", "Eagle", "Wolf", "Bear", "Fox", "Owl", "Hawk", "Lion",
    "Dolphin", "Whale", "Shark", "Falcon", "Raven", "Swan", "Deer", "Rabbit",
    "Panda", "Phoenix", "Dragon", "Unicorn", "Pegasus", "Griffin", "Lynx", "Orca"
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  
  return `${adjective}${animal}`;
}

// Generate a consistent color for a username
export function generateUserColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
  ];
  
  return colors[Math.abs(hash) % colors.length];
}

// Calculate distance between two coordinates in miles
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Basic content filtering for inappropriate content
export function filterContent(content: string): { isAllowed: boolean; reason?: string } {
  const bannedWords = [
    'spam', 'scam', 'fake', 'bot', 'advertisement',
    // Add more inappropriate words as needed
  ];
  
  const lowerContent = content.toLowerCase();
  
  for (const word of bannedWords) {
    if (lowerContent.includes(word)) {
      return { isAllowed: false, reason: 'Contains inappropriate content' };
    }
  }
  
  // Check for excessive caps (potential shouting)
  const capsRatio = content.replace(/[^A-Z]/g, '').length / content.length;
  if (capsRatio > 0.7 && content.length > 10) {
    return { isAllowed: false, reason: 'Excessive use of capital letters' };
  }
  
  // Check for excessive repetition
  if (/(.)\1{4,}/.test(content)) {
    return { isAllowed: false, reason: 'Excessive character repetition' };
  }
  
  return { isAllowed: true };
}

// Rate limiting for messages
class RateLimiter {
  private userLimits = new Map<string, { count: number; resetTime: number }>();
  
  isAllowed(userId: string, maxMessages: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const userLimit = this.userLimits.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.userLimits.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userLimit.count >= maxMessages) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }
}

export const rateLimiter = new RateLimiter();
