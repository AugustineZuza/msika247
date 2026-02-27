// In-memory session storage for demo purposes
// In production, this would use a database or Redis

interface UserSession {
  id: string
  email: string
  role: 'ADMIN' | 'SELLER' | 'BUYER'
  businessName?: string
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  subscriptionEndDate?: Date
}

const sessions = new Map<string, UserSession>()

export function createSession(userData: UserSession): string {
  const sessionId = Math.random().toString(36).substring(7)
  sessions.set(sessionId, userData)
  return sessionId
}

export function getSession(sessionId: string): UserSession | null {
  return sessions.get(sessionId) || null
}

export function updateSession(sessionId: string, updates: Partial<UserSession>) {
  const session = sessions.get(sessionId)
  if (session) {
    sessions.set(sessionId, { ...session, ...updates })
  }
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId)
}

export function getAllSessions(): UserSession[] {
  return Array.from(sessions.values())
}

export function getSellerSessions(): UserSession[] {
  return Array.from(sessions.values()).filter(s => s.role === 'SELLER')
}

export function getActiveSellers(): UserSession[] {
  return getSellerSessions().filter(s => s.subscriptionStatus === 'ACTIVE')
}
