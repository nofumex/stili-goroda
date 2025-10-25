import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfig } from '@/lib/email';
import { verifyRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const result = await testEmailConfig();
    
    return NextResponse.json({
      success: result.success,
      message: result.message || result.error,
      suggestions: result.suggestions || null
    });

  } catch (error: any) {
    console.error('Test email error:', error);
    
    if (error?.statusCode === 401 || error?.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: 'Не авторизовано' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка тестирования email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
