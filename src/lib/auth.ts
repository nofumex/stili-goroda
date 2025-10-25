import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { db } from './db';
import { JWTPayload, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new AuthError('Invalid access token');
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (error) {
    throw new AuthError('Invalid refresh token');
  }
}

export async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check for token in cookies
  const token = request.cookies.get('access_token')?.value;
  
  // Debug logging for production issues
  if (process.env.NODE_ENV === 'production') {
    console.log('Auth Debug:', {
      hasAuthHeader: !!authHeader,
      hasCookie: !!token,
      cookieValue: token ? `${token.substring(0, 10)}...` : 'none',
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });
  }
  
  return token || null;
}

export async function verifyAuth(request: NextRequest): Promise<JWTPayload> {
  try {
    const token = await getTokenFromRequest(request);
    
    if (!token) {
      throw new AuthError('No token provided');
    }
    
    return verifyAccessToken(token);
  } catch (error) {
    console.error('Auth verification error:', error);
    throw new AuthError('Authentication failed');
  }
}

export async function verifyRole(request: NextRequest, allowedRoles: UserRole[]): Promise<JWTPayload> {
  const payload = await verifyAuth(request);
  
  if (!allowedRoles.includes(payload.role)) {
    throw new AuthError('Insufficient permissions', 403);
  }
  
  return payload;
}

export async function createSession(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });
  
  if (!user) {
    throw new AuthError('User not found');
  }
  
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole
  });
  
  const refreshToken = generateRefreshToken(userId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  // Store refresh token in database
  await db.session.create({
    data: {
      userId,
      refreshToken,
      expiresAt
    }
  });
  
  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    
    // Check if refresh token exists in database
    const session = await db.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });
    
    if (!session || session.expiresAt < new Date()) {
      throw new AuthError('Invalid or expired refresh token');
    }
    
    // Delete old session
    await db.session.delete({
      where: { id: session.id }
    });
    
    // Create new session
    return createSession(session.userId);
  } catch (error) {
    throw new AuthError('Invalid refresh token');
  }
}

export async function revokeSession(refreshToken: string): Promise<void> {
  await db.session.deleteMany({
    where: { refreshToken }
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({
    where: { userId }
  });
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
}


