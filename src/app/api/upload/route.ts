import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    // Require admin/manager for product image uploads - temporarily disabled for debugging
    // await verifyRole(request, ['ADMIN', 'MANAGER']);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не выбран' },
        { status: 400 }
      );
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Недопустимый тип файла' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Файл слишком большой (макс. 10MB)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    // Public URL path
    const publicPath = `/uploads/${filename}`;

    return NextResponse.json({ success: true, path: publicPath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки файла' },
      { status: 500 }
    );
  }
}




