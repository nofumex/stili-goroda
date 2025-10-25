'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useApi';
import { authorizedFetch } from '@/lib/authorized-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Save, 
  RefreshCw,
  Phone,
  Link,
  Image as ImageIcon,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    // Branding
    logo: '',
    favicon: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socialLinks: [] as { label: string; url: string }[],
    extraContacts: [] as { title: string; values: string[] }[],
    photoPricesUrl: '',
    popupEnabled: false,
    popupTemplate: 'center',
    popupTitle: '',
    popupText: '',
    popupImageUrl: '',
    popupButtonLabel: '',
    popupButtonUrl: '',
    popupDelaySeconds: 3,
    minOrderTotal: 0,
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      companyEmail: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<any>(null);
  
  // Hero images state
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [heroImagesLoading, setHeroImagesLoading] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageAlt, setNewImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // In-memory storage for testing when database is not available
  const [mockImages, setMockImages] = useState<any[]>([]);

  const { data: settingsData, loading: dataLoading, error } = useSettings();

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  // Test email connection
  const testEmailConnection = async () => {
    setTestingEmail(true);
    setEmailTestResult(null);
    
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setEmailTestResult(result);
    } catch (error) {
      setEmailTestResult({
        success: false,
        message: 'Ошибка тестирования: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Load hero images
  useEffect(() => {
    loadHeroImages();
  }, []);

  const loadHeroImages = async () => {
    setHeroImagesLoading(true);
    try {
      const response = await fetch('/api/admin/hero-images', {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setHeroImages(result.data);
      } else {
        // If API fails, use mock data
        setHeroImages(mockImages);
      }
    } catch (error) {
      console.error('Error loading hero images:', error);
      // If API fails, use mock data
      setHeroImages(mockImages);
    } finally {
      setHeroImagesLoading(false);
    }
  };

  const addHeroImage = async () => {
    if (!newImageFile) return;
    
    setUploading(true);
    try {
      // First upload the file
      const formData = new FormData();
      formData.append('file', newImageFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) {
        setMessage(`Ошибка загрузки файла: ${uploadResult.error}`);
        return;
      }
      
      // Then add to hero images
      const response = await fetch('/api/admin/hero-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url: uploadResult.path,
          alt: newImageAlt,
          order: heroImages.length,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Add to mock storage as well
        const newImage = {
          id: result.data.id,
          url: uploadResult.path,
          alt: newImageAlt,
          order: heroImages.length,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMockImages(prev => [...prev, newImage]);
        
        setNewImageFile(null);
        setNewImageAlt('');
        loadHeroImages();
        setMessage('Изображение добавлено');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      setMessage('Ошибка при добавлении изображения');
    } finally {
      setUploading(false);
    }
  };

  const updateHeroImage = async (id: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/hero-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...updates }),
      });
      
      const result = await response.json();
      if (result.success) {
        loadHeroImages();
        setMessage('Изображение обновлено');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      setMessage('Ошибка при обновлении изображения');
    }
  };

  const deleteHeroImage = async (id: string) => {
    if (!confirm('Удалить изображение?')) return;
    
    try {
      const response = await fetch(`/api/admin/hero-images?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const result = await response.json();
      if (result.success) {
        loadHeroImages();
        setMessage('Изображение удалено');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      setMessage('Ошибка при удалении изображения');
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  // Dynamic helpers
  const updateSocial = (index: number, key: 'label' | 'url', value: string) => {
    setSettings((prev: any) => {
      const next = [...(prev.socialLinks || [])];
      next[index] = { ...(next[index] || { label: '', url: '' }), [key]: value };
      return { ...prev, socialLinks: next };
    });
  };

  const addSocial = () => {
    setSettings((prev: any) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { label: '', url: '' }],
    }));
  };

  const removeSocial = (index: number) => {
    setSettings((prev: any) => ({
      ...prev,
      socialLinks: (prev.socialLinks || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updateExtraTitle = (index: number, value: string) => {
    setSettings((prev: any) => {
      const next = [...(prev.extraContacts || [])];
      next[index] = { ...(next[index] || { title: '', values: [] }), title: value };
      return { ...prev, extraContacts: next };
    });
  };

  const addExtraGroup = () => {
    setSettings((prev: any) => ({
      ...prev,
      extraContacts: [...(prev.extraContacts || []), { title: '', values: [''] }],
    }));
  };

  const removeExtraGroup = (index: number) => {
    setSettings((prev: any) => ({
      ...prev,
      extraContacts: (prev.extraContacts || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updateExtraValue = (groupIndex: number, valueIndex: number, value: string) => {
    setSettings((prev: any) => {
      const groups = [...(prev.extraContacts || [])];
      const group = groups[groupIndex] || { title: '', values: [] };
      const values = [...(group.values || [])];
      values[valueIndex] = value;
      groups[groupIndex] = { ...group, values };
      return { ...prev, extraContacts: groups };
    });
  };

  const addExtraValue = (groupIndex: number) => {
    setSettings((prev: any) => {
      const groups = [...(prev.extraContacts || [])];
      const group = groups[groupIndex] || { title: '', values: [] };
      groups[groupIndex] = { ...group, values: [...(group.values || []), ''] };
      return { ...prev, extraContacts: groups };
    });
  };

  const removeExtraValue = (groupIndex: number, valueIndex: number) => {
    setSettings((prev: any) => {
      const groups = [...(prev.extraContacts || [])];
      const group = groups[groupIndex] || { title: '', values: [] };
      groups[groupIndex] = { ...group, values: (group.values || []).filter((_: any, i: number) => i !== valueIndex) };
      return { ...prev, extraContacts: groups };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await authorizedFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Настройки сохранены успешно');
        // Обновляем локальное состояние с сохраненными данными
        setSettings(result.data);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      setMessage('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Ошибка загрузки настроек: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Сохранить
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('Ошибка') 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Общие настройки удалены по требованию */}

      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Контактная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="info@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <Input
                value={settings.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="+7 (495) 123-45-67"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <Input
              value={settings.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="г. Москва, ул. Примерная, д. 123"
            />
          </div>
          {/* Режим работы удалён по требованию */}
        </CardContent>
      </Card>

      {/* Branding: Logo & Favicon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Брендинг: Логотип и иконка сайта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Логотип (для хедера)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
                    const json = await res.json();
                    if (json.success) {
                      handleInputChange('logo', json.path);
                      setMessage('Логотип загружен');
                      setTimeout(() => setMessage(''), 3000);
                    } else {
                      setMessage(`Ошибка загрузки: ${json.error}`);
                    }
                  } catch {
                    setMessage('Ошибка при загрузке файла');
                  } finally {
                    setUploading(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
              {settings.logo && (
                <div className="flex items-center gap-2">
                  <img src={settings.logo} alt="Logo preview" className="h-10 object-contain rounded border bg-white p-1" />
                  <button onClick={() => handleInputChange('logo', '')} className="text-red-600 hover:text-red-700 text-sm">Удалить</button>
                </div>
              )}
            </div>
            <Input
              value={settings.logo || ''}
              onChange={(e) => handleInputChange('logo', e.target.value)}
              placeholder="/uploads/your-logo.png или абсолютный URL"
            />
          </div>

          {/* Favicon upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Иконка вкладки (favicon)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/png,image/webp,image/jpeg"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
                    const json = await res.json();
                    if (json.success) {
                      handleInputChange('favicon', json.path);
                      setMessage('Favicon загружен');
                      setTimeout(() => setMessage(''), 3000);
                    } else {
                      setMessage(`Ошибка загрузки: ${json.error}`);
                    }
                  } catch {
                    setMessage('Ошибка при загрузке файла');
                  } finally {
                    setUploading(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
              {settings.favicon && (
                <div className="flex items-center gap-2">
                  <img src={settings.favicon} alt="Favicon preview" className="h-8 w-8 object-contain rounded border bg-white p-1" />
                  <button onClick={() => handleInputChange('favicon', '')} className="text-red-600 hover:text-red-700 text-sm">Удалить</button>
                </div>
              )}
            </div>
            <Input
              value={settings.favicon || ''}
              onChange={(e) => handleInputChange('favicon', e.target.value)}
              placeholder="/uploads/favicon.png или абсолютный URL"
            />
            <p className="text-xs text-gray-500">Рекомендуется квадратное изображение 32×32 или 48×48.</p>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Почтовые уведомления о заказах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <Input value={settings.emailSettings?.smtpHost || ''} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), smtpHost: e.target.value } }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <Input type="number" value={settings.emailSettings?.smtpPort ?? 587} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), smtpPort: Number(e.target.value) } }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
              <Input value={settings.emailSettings?.smtpUser || ''} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), smtpUser: e.target.value } }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
              <Input type="password" value={settings.emailSettings?.smtpPassword || ''} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), smtpPassword: e.target.value } }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">От кого (from)</label>
              <Input type="email" value={settings.emailSettings?.fromEmail || ''} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), fromEmail: e.target.value } }))} placeholder="noreply@domain.ru" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Почта администратора</label>
              <Input type="email" value={settings.emailSettings?.companyEmail ?? ''} onChange={(e) => setSettings((p: any) => ({ ...p, emailSettings: { ...(p.emailSettings || {}), companyEmail: e.target.value } }))} placeholder="admin@domain.ru" />
            </div>
          </div>
          <p className="text-xs text-gray-500">Письмо администратору отправляется на этот адрес. Если поле пустое — письмо администратору не отправляется.</p>
          
          {/* Test Email Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={testEmailConnection}
              disabled={testingEmail}
              variant="outline"
              className="w-full"
            >
              {testingEmail ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Тестирование...
                </>
              ) : (
                'Тестировать SMTP соединение'
              )}
            </Button>
            {emailTestResult && (
              <div className={`mt-2 p-3 rounded text-sm ${
                emailTestResult.success 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {emailTestResult.message}
                {emailTestResult.suggestions && (
                  <div className="mt-2">
                    <p className="font-medium">Рекомендуемые настройки:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {Object.entries(emailTestResult.suggestions).map(([key, config]: [string, any]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {config.host}:{config.port} - {config.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Социальные сети
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(settings.socialLinks || []).map((item: any, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Название сети</label>
                <Input value={item?.label || ''} onChange={(e) => updateSocial(idx, 'label', e.target.value)} placeholder="Напр.: ВК, WB, Telegram" />
              </div>
              <div className="md:col-span-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                <Input value={item?.url || ''} onChange={(e) => updateSocial(idx, 'url', e.target.value)} placeholder="https://vk.com/yourpage" />
              </div>
              <div className="md:col-span-1">
                <Button variant="outline" onClick={() => removeSocial(idx)}>Удалить</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addSocial}>Добавить соцсеть</Button>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительные настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Минимальная сумма заказа (₽)</label>
              <Input
                type="number"
                min={0}
                value={Number(settings.minOrderTotal ?? 0)}
                onChange={(e) => {
                  const v = e.target.value;
                  const num = v === '' ? 0 : Number(v);
                  handleInputChange('minOrderTotal', isNaN(num) || num < 0 ? 0 : num);
                }}
                placeholder="Например: 1000"
              />
              <p className="text-xs text-gray-500 mt-1">0 — ограничение отключено.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на Фотопрайсы (Google Drive)</label>
              <Input
                value={settings.photoPricesUrl || ''}
                onChange={(e) => handleInputChange('photoPricesUrl', e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site popup */}
      <Card>
        <CardHeader>
          <CardTitle>Всплывающее окно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              id="popupEnabled"
              type="checkbox"
              checked={!!settings.popupEnabled}
              onChange={(e) => handleInputChange('popupEnabled', e.target.checked)}
            />
            <label htmlFor="popupEnabled" className="text-sm text-gray-700">Включить всплывающее окно</label>
          </div>
          {settings.popupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Шаблон всплывающего окна</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  settings.popupTemplate === 'center' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => handleInputChange('popupTemplate', 'center')}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    </div>
                    <h4 className="font-medium text-sm">По центру</h4>
                    <p className="text-xs text-gray-500 mt-1">Изображение сверху, текст снизу</p>
                  </div>
                </div>
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  settings.popupTemplate === 'image-right' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => handleInputChange('popupTemplate', 'image-right')}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-between p-2">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    </div>
                    <h4 className="font-medium text-sm">Изображение справа</h4>
                    <p className="text-xs text-gray-500 mt-1">Текст слева, изображение справа</p>
                  </div>
                </div>
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  settings.popupTemplate === 'image-left' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`} onClick={() => handleInputChange('popupTemplate', 'image-left')}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-between p-2">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    </div>
                    <h4 className="font-medium text-sm">Изображение слева</h4>
                    <p className="text-xs text-gray-500 mt-1">Изображение слева, текст справа</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
              <Input value={settings.popupTitle || ''} onChange={(e) => handleInputChange('popupTitle', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Задержка показа (секунды)</label>
              <Input type="number" value={settings.popupDelaySeconds || 3} onChange={(e) => handleInputChange('popupDelaySeconds', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Текст</label>
            <textarea
              value={settings.popupText || ''}
              onChange={(e) => handleInputChange('popupText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
              placeholder="Текст всплывающего окна"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Картинка (необязательно)</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setUploading(true);
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const uploadResponse = await fetch('/api/upload', {
                      method: 'POST',
                      credentials: 'include',
                      body: formData,
                    });
                    
                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.success) {
                      handleInputChange('popupImageUrl', uploadResult.path);
                      setMessage('Изображение загружено');
                      setTimeout(() => setMessage(''), 3000);
                    } else {
                      setMessage(`Ошибка загрузки: ${uploadResult.error}`);
                    }
                  } catch (error) {
                    setMessage('Ошибка при загрузке изображения');
                  } finally {
                    setUploading(false);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={uploading}
              />
              {settings.popupImageUrl && (
                <div className="flex items-center gap-2">
                  <img src={settings.popupImageUrl} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                  <button
                    onClick={() => handleInputChange('popupImageUrl', '')}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Кнопка: надпись</label>
              <Input value={settings.popupButtonLabel || ''} onChange={(e) => handleInputChange('popupButtonLabel', e.target.value)} placeholder="Например: Открыть" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Кнопка: ссылка</label>
              <Input value={settings.popupButtonUrl || ''} onChange={(e) => handleInputChange('popupButtonUrl', e.target.value)} placeholder="https://... или /catalog" />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Hero Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Изображения на главной странице
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new image */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Добавить новое изображение</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выберите файл</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {newImageFile && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      Выбран: {newImageFile.name} ({(newImageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    <div className="mt-2">
                      <img 
                        src={URL.createObjectURL(newImageFile)} 
                        alt="Предварительный просмотр" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt текст (описание)</label>
                <Input
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  placeholder="Описание изображения"
                />
              </div>
            </div>
            <Button 
              onClick={addHeroImage} 
              disabled={!newImageFile || uploading}
              className="mt-3"
            >
              {uploading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Загрузка...' : 'Добавить изображение'}
            </Button>
          </div>

          {/* Existing images */}
          <div>
            <h4 className="font-medium mb-3">Текущие изображения</h4>
            {heroImagesLoading ? (
              <div className="text-center py-4">Загрузка...</div>
            ) : heroImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Изображения не добавлены
              </div>
            ) : (
              <div className="space-y-4">
                {heroImages.map((image, index) => (
                  <div key={image.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={image.url} 
                        alt={image.alt || ''} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=No+Image';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{image.alt || 'Без описания'}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {image.url.startsWith('/uploads/') ? 'Загруженный файл' : image.url}
                      </div>
                      <div className="text-xs text-gray-400">Порядок: {image.order}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={image.isActive ? "default" : "outline"}
                        onClick={() => updateHeroImage(image.id, { isActive: !image.isActive })}
                      >
                        {image.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateHeroImage(image.id, { order: index - 1 })}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateHeroImage(image.id, { order: index + 1 })}
                        disabled={index === heroImages.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteHeroImage(image.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Data */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительные данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(settings.extraContacts || []).map((group: any, gIdx: number) => (
            <div key={gIdx} className="space-y-3 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                  <Input value={group?.title || ''} onChange={(e) => updateExtraTitle(gIdx, e.target.value)} placeholder="Напр.: Отдел продаж готовых изделий" />
                </div>
                <Button variant="outline" onClick={() => removeExtraGroup(gIdx)}>Удалить блок</Button>
              </div>

              <div className="space-y-2">
                {(group?.values || []).map((val: string, vIdx: number) => (
                  <div key={vIdx} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Значение</label>
                      <Input value={val || ''} onChange={(e) => updateExtraValue(gIdx, vIdx, e.target.value)} placeholder="+7 (___) ___-__-__" />
                    </div>
                    <Button variant="outline" onClick={() => removeExtraValue(gIdx, vIdx)}>Удалить</Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => addExtraValue(gIdx)}>Добавить значение</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addExtraGroup}>Добавить блок</Button>
        </CardContent>
      </Card>
    </div>
  );
}


