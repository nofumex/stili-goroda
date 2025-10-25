import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Отсутствует refresh токен' },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken);

    // Update cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://') || false;
    
    // For HTTP in production, we need to set secure: false
    const isSecure = isProduction && isHttps;
    
    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    cookieStore.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true, data: { accessToken } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Не удалось обновить токен' },
      { status: 401 }
    );
  }
}


