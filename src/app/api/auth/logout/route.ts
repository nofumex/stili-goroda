import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (refreshToken) {
      // Revoke the refresh token
      await revokeSession(refreshToken);
    }

    // Clear cookies
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json({
      success: true,
      message: 'Успешный выход из системы'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookies
    const cookieStore = cookies();
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    return NextResponse.json({
      success: true,
      message: 'Выход из системы'
    });
  }
}


