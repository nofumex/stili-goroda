'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
  Database, 
  Package,
  Folder,
  Settings,
  Image,
  AlertCircle,
  Info
} from 'lucide-react';
import { authorizedFetch } from '@/lib/authorized-fetch';
import { useToast } from '@/components/ui/toast';

interface ImportResult {
  success: boolean;
  processed: {
    products: number;
    categories: number;
    media: number;
  };
  errors: string[];
  warnings: string[];
  skipped: {
    products: string[];
    categories: string[];
    media: string[];
  };
}

export default function ImportExportPage() {
  const { success, error } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [importOptions, setImportOptions] = useState({
    skipExisting: false,
    updateExisting: true,
    importMedia: true,
  });
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExport = async (format: 'zip' | 'json' | 'xlsx') => {
    try {
      setLoading(true);
      const res = await authorizedFetch(`/api/admin/export?format=${format}`);
      if (!res.ok) throw new Error('Ошибка экспорта');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const extension = format === 'xlsx' ? 'xlsx' : format === 'json' ? 'json' : 'zip';
      a.download = `export_${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      success('Экспорт выполнен', `${format.toUpperCase()} файл сформирован и скачан`);
    } catch (e: any) {
      error('Ошибка экспорта', e.message || 'Не удалось экспортировать данные');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!files || files.length === 0) {
      error('Ошибка', 'Выберите файл для импорта');
      return;
    }

    setLoading(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('options', JSON.stringify(importOptions));

      const res = await authorizedFetch('/api/admin/import', { 
        method: 'POST', 
        body: formData 
      });
      
      const json = await res.json();
      
      if (json.success) {
        setImportResult(json.data);
        success('Импорт выполнен', json.message || 'Данные успешно импортированы');
      } else {
        error('Ошибка импорта', json.error || 'Не удалось импортировать данные');
      }
    } catch (e: any) {
      error('Ошибка импорта', e.message || 'Не удалось импортировать данные');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад в админ-панель
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Импорт/Экспорт данных</h1>
            <p className="text-gray-600">Управление импортом и экспортом товаров, категорий и настроек</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Экспорт данных */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Экспорт данных</h2>
              <p className="text-sm text-gray-600">Экспорт всех товаров, категорий и настроек в различных форматах</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Экспорт включает:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Все товары с вариантами
              </li>
              <li className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Категории и их иерархию
              </li>
              <li className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Изображения товаров
              </li>
              <li className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Настройки сайта
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                JSON файл с данными
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => handleExport('zip')} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Формирование...' : 'Скачать ZIP архив'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => handleExport('xlsx')} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                XLSX
              </Button>
              <Button 
                onClick={() => handleExport('json')} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Импорт данных */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Импорт данных</h2>
              <p className="text-sm text-gray-600">Импорт данных из ZIP архива или JSON файла</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Выберите ZIP или JSON файл</label>
              <div className="flex gap-2">
                <Input 
                  type="file" 
                  accept=".zip,.json" 
                  onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Поддерживаются ZIP архивы (с data.json и медиафайлами) или отдельные JSON файлы
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Параметры импорта</h3>
              
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={importOptions.skipExisting} 
                  onChange={(e) => setImportOptions(prev => ({ ...prev, skipExisting: e.target.checked }))}
                />
                Пропускать существующие товары
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={importOptions.updateExisting} 
                  onChange={(e) => setImportOptions(prev => ({ ...prev, updateExisting: e.target.checked }))}
                />
                Обновлять существующие товары
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={importOptions.importMedia} 
                  onChange={(e) => setImportOptions(prev => ({ ...prev, importMedia: e.target.checked }))}
                />
                Импортировать изображения
              </label>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={loading || files.length === 0}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Импортирование...' : 'Импортировать данные'}
            </Button>
          </div>
        </div>
      </div>

      {/* Результат импорта */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className={importResult.success ? 'text-green-600' : 'text-red-600'} />
            <span className="font-medium text-lg">Результат импорта</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Товаров</div>
              <div className="text-lg font-semibold text-gray-900">{importResult.processed.products}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600">Категорий</div>
              <div className="text-lg font-semibold text-blue-700">{importResult.processed.categories}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600">Медиафайлов</div>
              <div className="text-lg font-semibold text-green-700">{importResult.processed.media}</div>
            </div>
          </div>
          
          {importResult.warnings.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="font-medium text-yellow-700">Предупреждения:</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                  {importResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {importResult.errors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="font-medium text-red-600">Ошибки:</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {importResult.skipped.products.length > 0 && (
            <div>
              <p className="font-medium text-gray-700 mb-2">Пропущенные товары:</p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {importResult.skipped.products.map((product, idx) => (
                    <li key={idx}>{product}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Дополнительная информация */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Информация о форматах экспорта</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <strong>ZIP архив:</strong> Полный экспорт с JSON данными и медиафайлами. Рекомендуется для резервного копирования и переноса на другой сервер.
              </div>
              <div>
                <strong>XLSX файл:</strong> Табличный формат для редактирования в Excel. Включает отдельные листы для товаров, категорий и настроек.
              </div>
              <div>
                <strong>JSON файл:</strong> Структурированные данные в формате JSON. Подходит для программной обработки и интеграции с другими системами.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
