import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    let images: any[] = [];
    try {
      images = await db.heroImage.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
    } catch (dbError) {
      console.log('Public hero images API: Database error, returning empty array:', dbError);
      // If database is not available, return empty array
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: images });

  } catch (error) {
    console.error('Get public hero images error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения изображений' },
      { status: 500 }
    );
  }
}
