import { NextRequest, NextResponse } from 'next/server';
import { verifyRole } from '@/lib/auth';
import { ExportService } from '@/lib/export-service';

export async function GET(request: NextRequest) {
  try {
    // Verify admin/manager role
    await verifyRole(request, ['ADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') as 'zip' | 'json' | 'xlsx') || 'zip';

    const exportService = new ExportService();
    const buffer = await exportService.exportData(format);

    // Определяем MIME type и расширение файла
    let mimeType: string;
    let extension: string;
    
    switch (format) {
      case 'json':
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'zip':
      default:
        mimeType = 'application/zip';
        extension = 'zip';
        break;
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="export-${new Date().toISOString().split('T')[0]}.${extension}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка экспорта данных',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}