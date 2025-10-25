import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth';
import { validateFileWithContent, FileType } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Определяем ожидаемые типы файлов
    let expectedTypes: FileType[] = ['csv', 'xml', 'zip', 'json'];
    if (fileType) {
      const requestedType = fileType as FileType;
      if (['csv', 'xml', 'zip', 'json'].includes(requestedType)) {
        expectedTypes = [requestedType];
      }
    }

    // Валидация файла
    const validation = await validateFileWithContent(file, expectedTypes);

    return NextResponse.json({
      success: validation.isValid,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: validation.fileType,
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      },
      message: validation.isValid ? 'Файл прошел валидацию' : 'Файл не прошел валидацию'
    });

  } catch (error) {
    console.error('File validation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка валидации файла',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
