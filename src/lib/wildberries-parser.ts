/**
 * WildBerries API Parser
 * Сервис для получения данных о товарах с WildBerries
 */

export interface WBProductData {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: string[];
  characteristics: Record<string, string>;
  colors?: string[];
  sizes?: Array<{
    name: string;
    origName: string;
    price: number;
    stock: number;
  }>;
}

export interface ParsedProductData {
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: string[];
  stock: number;
  material?: string;
  tags: string[];
  variants: Array<{
    size?: string;
    color?: string;
    price: number;
    stock: number;
    sku: string;
  }>;
}

/**
 * Извлекает ID товара из ссылки WildBerries
 * @param url - Ссылка на товар WildBerries (например: https://www.wildberries.ru/catalog/407325131)
 * @returns ID товара или null если не удалось извлечь
 */
export function extractProductId(url: string): number | null {
  try {
    // Убираем пробелы
    url = url.trim();
    
    // Паттерны для разных форматов ссылок WB
    const patterns = [
      /wildberries\.ru\/catalog\/(\d+)/i,
      /wb\.ru\/catalog\/(\d+)/i,
      /^(\d+)$/, // Если передали просто ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const id = parseInt(match[1], 10);
        if (!isNaN(id) && id > 0) {
          return id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting product ID:', error);
    return null;
  }
}

/**
 * Вычисляет basket URL для изображений WildBerries
 * Новая схема: basket зависит от vol (первые цифры ID)
 * @param productId - ID товара
 * @returns Номер корзины для URL изображения
 */
function getBasketNumber(productId: number): string {
  // WildBerries использует схему на основе vol
  const vol = Math.floor(productId / 100000);
  
  // Новая схема распределения корзин (проверено на реальных товарах)
  if (vol >= 0 && vol <= 143) return '01';
  if (vol >= 144 && vol <= 287) return '02';
  if (vol >= 288 && vol <= 431) return '03';
  if (vol >= 432 && vol <= 719) return '04';
  if (vol >= 720 && vol <= 1007) return '05';
  if (vol >= 1008 && vol <= 1061) return '06';
  if (vol >= 1062 && vol <= 1115) return '07';
  if (vol >= 1116 && vol <= 1169) return '08';
  if (vol >= 1170 && vol <= 1313) return '09';
  if (vol >= 1314 && vol <= 1601) return '10';
  if (vol >= 1602 && vol <= 1655) return '11';
  if (vol >= 1656 && vol <= 1919) return '12';
  if (vol >= 1920 && vol <= 2045) return '13';
  if (vol >= 2046 && vol <= 2189) return '14';
  if (vol >= 2190 && vol <= 2405) return '15';
  if (vol >= 2406 && vol <= 2621) return '16';
  if (vol >= 2622 && vol <= 2837) return '17';
  if (vol >= 2838 && vol <= 3053) return '18';
  if (vol >= 3054 && vol <= 3269) return '19';
  if (vol >= 3270 && vol <= 3485) return '20';
  if (vol >= 3486 && vol <= 3701) return '21';
  if (vol >= 3702 && vol <= 3917) return '22';
  if (vol >= 3918 && vol <= 4133) return '23'; // Для товара 406112046 (vol=4)
  if (vol >= 4134 && vol <= 4349) return '24';
  
  // Для более новых товаров продолжаем схему
  return String(Math.min(Math.floor((vol - 143) / 216) + 2, 99)).padStart(2, '0');
}

/**
 * Формирует URL изображения товара WildBerries
 * @param productId - ID товара
 * @param imageIndex - Номер изображения (1-14)
 * @returns URL изображения
 */
function getImageUrl(productId: number, imageIndex: number = 1): string {
  const basket = getBasketNumber(productId);
  
  // WildBerries использует специальную структуру URL
  // Пример: https://basket-23.wbbasket.ru/vol4061/part406112/406112046/images/big/1.webp
  // vol - первые 4 цифры ID, part - первые 6 цифр ID
  const idStr = String(productId);
  const volStr = idStr.substring(0, 4);  // Первые 4 цифры: "4061"
  const partStr = idStr.substring(0, 6); // Первые 6 цифр: "406112"
  
  return `https://basket-${basket}.wbbasket.ru/vol${volStr}/part${partStr}/${productId}/images/big/${imageIndex}.webp`;
}

/**
 * Получает данные о товаре с WildBerries API
 * @param productId - ID товара
 * @returns Данные о товаре
 */
export async function fetchWBProduct(productId: number): Promise<WBProductData | null> {
  // Список возможных API endpoints для fallback (в порядке приоритета)
  const apiUrls = [
    `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${productId}`,
    `https://card.wb.ru/cards/v1/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${productId}`,
    `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${productId}`,
    `https://card.wb.ru/cards/detail?nm=${productId}`,
  ];

  let lastError: Error | null = null;
  
  // Пробуем разные endpoints
  for (let i = 0; i < apiUrls.length; i++) {
    const apiUrl = apiUrls[i];
    
    try {
      console.log(`[WB Parser] Попытка ${i + 1}/${apiUrls.length}: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.wildberries.ru',
          'Referer': 'https://www.wildberries.ru/',
        },
      });

      console.log(`[WB Parser] Ответ: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        lastError = new Error(`WB API error: ${response.status} ${response.statusText}`);
        continue; // Пробуем следующий endpoint
      }

      const data = await response.json();
      console.log(`[WB Parser] Получены данные:`, JSON.stringify(data).substring(0, 200));

      // Проверяем наличие данных о товаре
      if (!data.data || !data.data.products || data.data.products.length === 0) {
        console.log(`[WB Parser] Товар не найден в ответе API`);
        lastError = new Error('Product not found in API response');
        continue;
      }

      const product = data.data.products[0];
      console.log(`[WB Parser] Товар найден: ${product.name || product.id}`);
      
      // Если нашли товар - обрабатываем данные
      return await processWBProductData(product, productId);
      
    } catch (error) {
      console.error(`[WB Parser] Ошибка при запросе ${i + 1}:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      continue; // Пробуем следующий endpoint
    }
  }
  
  // Если все endpoint'ы не сработали
  console.error(`[WB Parser] Все попытки исчерпаны. Последняя ошибка:`, lastError);
  return null;
}

/**
 * Обрабатывает данные товара из WB API
 * @param product - Объект товара из API
 * @param productId - ID товара
 * @returns Обработанные данные товара
 */
async function processWBProductData(product: any, productId: number): Promise<WBProductData> {

  // Извлекаем характеристики
  const characteristics: Record<string, string> = {};
  if (product.options) {
    product.options.forEach((option: any) => {
      if (option.name && option.value) {
        characteristics[option.name] = option.value;
      }
    });
  }

  // Извлекаем изображения
  const images: string[] = [];
  const imageCount = product.pics || 10; // Обычно до 10-14 изображений
  for (let i = 1; i <= Math.min(imageCount, 14); i++) {
    images.push(getImageUrl(productId, i));
  }

  // Извлекаем размеры и цены (с поддержкой разных версий API)
  const sizes = product.sizes?.map((size: any) => {
    // Цена может быть в разных местах в зависимости от версии API
    let price = 0;
    if (size.price?.total) {
      price = size.price.total / 100;
    } else if (size.price?.product) {
      price = size.price.product / 100;
    } else if (size.salePriceU) {
      price = size.salePriceU / 100;
    } else if (product.salePriceU) {
      price = product.salePriceU / 100;
    } else if (product.priceU) {
      price = product.priceU / 100;
    }
    
    // Остаток также может быть в разных форматах
    let stock = 0;
    if (size.stocks) {
      stock = size.stocks.reduce((sum: number, s: any) => sum + (s.qty || 0), 0);
    } else if (size.qty !== undefined) {
      stock = size.qty;
    }
    
    // Фильтруем невалидные значения размера
    const sizeName = size.name || size.origName || '';
    const cleanSizeName = sizeName.trim();
    
    return {
      name: (cleanSizeName && cleanSizeName !== '0') ? cleanSizeName : null,
      origName: size.origName || size.name || null,
      price,
      stock,
    };
  }) || [];

  // Извлекаем цвета
  const colors = product.colors?.map((color: any) => color.name).filter(Boolean) || [];

  // Вычисляем цену товара (берем из первого размера если нет в корневом объекте)
  let productPrice = 0;
  let productOldPrice: number | undefined = undefined;
  
  if (product.salePriceU) {
    productPrice = product.salePriceU / 100;
  } else if (sizes.length > 0 && sizes[0].price > 0) {
    productPrice = sizes[0].price;
  }
  
  if (product.priceU && product.priceU > product.salePriceU) {
    productOldPrice = product.priceU / 100;
  }

  return {
    id: product.id,
    name: product.name || '',
    brand: product.brand || characteristics['Бренд'] || '',
    description: product.description || '',
    price: productPrice,
    oldPrice: productOldPrice,
    images,
    characteristics,
    colors,
    sizes,
  };
}

/**
 * Преобразует данные WildBerries в формат для создания товара
 * @param wbData - Данные товара с WildBerries
 * @returns Преобразованные данные для создания товара
 */
export function mapWBToProduct(wbData: WBProductData): ParsedProductData {
  // Формируем описание из характеристик
  let description = wbData.description || '';
  
  if (Object.keys(wbData.characteristics).length > 0) {
    description += '\n\nХарактеристики:\n';
    Object.entries(wbData.characteristics).forEach(([key, value]) => {
      description += `- ${key}: ${value}\n`;
    });
  }

  // Формируем теги из характеристик и бренда
  const tags: string[] = [];
  if (wbData.brand) tags.push(wbData.brand);
  if (wbData.colors) tags.push(...wbData.colors);
  
  // Добавляем некоторые характеристики как теги
  const tagCharacteristics = ['Состав', 'Материал', 'Сезон', 'Пол', 'Цвет'];
  tagCharacteristics.forEach(char => {
    if (wbData.characteristics[char]) {
      tags.push(wbData.characteristics[char]);
    }
  });

  // Вычисляем общий остаток
  const totalStock = wbData.sizes?.reduce((sum, size) => sum + size.stock, 0) || 0;

  // Создаем варианты товара
  const variants: ParsedProductData['variants'] = [];
  
  // Генерируем уникальный суффикс для SKU (timestamp + случайное число)
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  // Фильтруем размеры с валидными значениями
  const validSizes = wbData.sizes?.filter(size => size.name && size.name !== '0') || [];
  
  if (validSizes.length > 0) {
    // Если есть размеры, создаем варианты для каждого размера
    validSizes.forEach((size, sizeIndex) => {
      if (wbData.colors && wbData.colors.length > 0) {
        // Если есть и размеры и цвета
        wbData.colors.forEach((color, colorIndex) => {
          variants.push({
            size: size.name,
            color: color,
            price: size.price,
            stock: Math.floor(size.stock / wbData.colors.length), // Распределяем остаток на цвета
            sku: `WB${wbData.id}-S${sizeIndex}-C${colorIndex}-${uniqueSuffix}`,
          });
        });
      } else {
        // Только размеры
        variants.push({
          size: size.name,
          price: size.price,
          stock: size.stock,
          sku: `WB${wbData.id}-S${sizeIndex}-${uniqueSuffix}`,
        });
      }
    });
  } else if (wbData.colors && wbData.colors.length > 0) {
    // Только цвета, без размеров
    wbData.colors.forEach((color, colorIndex) => {
      variants.push({
        color: color,
        price: wbData.price,
        stock: Math.floor(totalStock / wbData.colors.length),
        sku: `WB${wbData.id}-C${colorIndex}-${uniqueSuffix}`,
      });
    });
  }

  return {
    title: `${wbData.brand ? wbData.brand + ' - ' : ''}${wbData.name}`,
    description: description.trim(),
    price: wbData.price,
    oldPrice: wbData.oldPrice && wbData.oldPrice > wbData.price ? wbData.oldPrice : undefined,
    images: wbData.images,
    stock: totalStock,
    material: wbData.characteristics['Материал'] || wbData.characteristics['Состав'],
    tags: [...new Set(tags)], // Убираем дубликаты
    variants,
  };
}

/**
 * Главная функция для импорта товара с WildBerries
 * @param url - Ссылка на товар WildBerries
 * @returns Преобразованные данные товара или null
 */
export async function importFromWildberries(url: string): Promise<ParsedProductData | null> {
  try {
    // Извлекаем ID товара
    const productId = extractProductId(url);
    if (!productId) {
      throw new Error('Не удалось извлечь ID товара из ссылки');
    }

    // Получаем данные с WildBerries
    const wbData = await fetchWBProduct(productId);
    if (!wbData) {
      throw new Error('Не удалось получить данные товара с WildBerries');
    }

    // Преобразуем данные
    const productData = mapWBToProduct(wbData);
    
    return productData;
  } catch (error) {
    console.error('Error importing from WildBerries:', error);
    return null;
  }
}

