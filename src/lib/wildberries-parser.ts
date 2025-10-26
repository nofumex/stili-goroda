/**
 * WildBerries API Parser
 * Сервис для получения данных о товарах с WildBerries
 */

export interface WBProductData {
  id: number;
  name: string;
  brand: string;
  description: string;
  category?: string; // Категория товара (предмет)
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
  category?: string; // Категория товара с WB
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
  
  // Полная схема распределения корзин
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
  if (vol >= 3918 && vol <= 4133) return '23';
  if (vol >= 4134 && vol <= 4349) return '24';
  if (vol >= 4350 && vol <= 4599) return '25';
  if (vol >= 4600 && vol <= 4849) return '26';
  if (vol >= 4850 && vol <= 5099) return '27';
  if (vol >= 5100 && vol <= 5349) return '28';
  if (vol >= 5350 && vol <= 5699) return '29'; // Для товара 569741805 (vol=5697)
  if (vol >= 5700 && vol <= 5999) return '30';
  if (vol >= 6000 && vol <= 6299) return '31';
  if (vol >= 6100 && vol <= 6349) return '32';
  if (vol >= 6350 && vol <= 6599) return '33';
  if (vol >= 6600 && vol <= 6849) return '34';
  if (vol >= 6850 && vol <= 7099) return '35';
  
  // Для более новых товаров используем упрощенную формулу
  return String(Math.min(Math.floor(vol / 250) + 1, 99)).padStart(2, '0');
}

/**
 * Формирует URL изображения товара WildBerries
 * @param productId - ID товара
 * @param imageIndex - Номер изображения (1-14)
 * @returns Массив возможных URL изображения (для fallback)
 */
function getImageUrls(productId: number, imageIndex: number = 1): string[] {
  const basket = getBasketNumber(productId);
  const idStr = String(productId);
  const volStr = idStr.substring(0, Math.min(4, idStr.length));
  const partStr = idStr.substring(0, Math.min(6, idStr.length));
  
  // WildBerries использует формат: wbbasket.ru с big и webp
  // Пример: https://basket-29.wbbasket.ru/vol5697/part569741/569741805/images/big/1.webp
  const urls = [
    // Формат 1: wbbasket.ru с big/webp (основной, рабочий)
    `https://basket-${basket}.wbbasket.ru/vol${volStr}/part${partStr}/${productId}/images/big/${imageIndex}.webp`,
    
    // Формат 2: wbbasket.ru с big/jpg
    `https://basket-${basket}.wbbasket.ru/vol${volStr}/part${partStr}/${productId}/images/big/${imageIndex}.jpg`,
    
    // Формат 3: wbbasket.ru с c516x688
    `https://basket-${basket}.wbbasket.ru/vol${volStr}/part${partStr}/${productId}/images/c516x688/${imageIndex}.jpg`,
    
    // Формат 4: wb.ru с big/webp
    `https://basket-${basket}.wb.ru/vol${volStr}/part${partStr}/${productId}/images/big/${imageIndex}.webp`,
    
    // Формат 5: wb.ru с tm
    `https://basket-${basket}.wb.ru/vol${volStr}/part${partStr}/${productId}/images/tm/${imageIndex}.jpg`,
  ];
  
  return urls;
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
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://www.wildberries.ru',
          'Referer': 'https://www.wildberries.ru/',
        },
      });

      if (!response.ok) {
        lastError = new Error(`WB API error: ${response.status} ${response.statusText}`);
        continue; // Пробуем следующий endpoint
      }

      const data = await response.json();

      // Проверяем наличие данных о товаре
      if (!data.data || !data.data.products || data.data.products.length === 0) {
        lastError = new Error('Product not found in API response');
        continue;
      }

      const product = data.data.products[0];
      
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
 * Получает дополнительные данные товара из публичного API WildBerries
 * @param productId - ID товара
 * @returns Характеристики, описание и категория товара
 */
async function fetchAdditionalProductData(productId: number): Promise<{
  characteristics: Record<string, string>;
  description: string;
  category: string;
}> {
  try {
    console.log(`[WB Parser] Получение дополнительных данных для товара ${productId}...`);
    
    const basketNum = getBasketNumber(productId);
    const vol = String(productId).substring(0, 4);
    const part = String(productId).substring(0, 6);
    
    // Список возможных endpoints для получения полных данных
    const apiUrls = [
      // Метод 1: card.json в CDN
      `https://basket-${basketNum}.wbbasket.ru/vol${vol}/part${part}/${productId}/info/ru/card.json`,
      // Метод 2: Старый формат без /info
      `https://basket-${basketNum}.wbbasket.ru/vol${vol}/part${part}/${productId}/ru/card.json`,
      // Метод 3: Детальный endpoint
      `https://wbx-content-v2.wbstatic.net/ru/${productId}.json`,
    ];
    
    // Пробуем каждый endpoint
    for (let i = 0; i < apiUrls.length; i++) {
      const apiUrl = apiUrls[i];
      console.log(`[WB Parser] Попытка ${i + 1}/${apiUrls.length}: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://www.wildberries.ru',
            'Referer': 'https://www.wildberries.ru/',
          },
        });
        
        if (!response.ok) {
          console.log(`[WB Parser] Попытка ${i + 1} не удалась: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`[WB Parser] Получены данные, структура:`, Object.keys(data));
        
        // Извлекаем характеристики
        const characteristics: Record<string, string> = {};
        
        // Характеристики могут быть в разных местах
        if (data.options) {
          data.options.forEach((option: any) => {
            if (option.name && option.value) {
              characteristics[option.name] = Array.isArray(option.value) ? option.value.join(', ') : String(option.value);
            }
          });
        }
        
        if (data.characteristics) {
          data.characteristics.forEach((char: any) => {
            if (char.name && char.value) {
              characteristics[char.name] = Array.isArray(char.value) ? char.value.join(', ') : String(char.value);
            }
          });
        }
        
        if (data.grouped_options) {
          data.grouped_options.forEach((group: any) => {
            if (group.options && Array.isArray(group.options)) {
              group.options.forEach((option: any) => {
                if (option.name && option.value) {
                  characteristics[option.name] = Array.isArray(option.value) ? option.value.join(', ') : String(option.value);
                }
              });
            }
          });
        }
        
        // Извлекаем описание
        let description = '';
        if (data.description) {
          description = data.description;
        } else if (data.full_description) {
          description = data.full_description;
        } else if (data.desc) {
          description = data.desc;
        }
        
        // Извлекаем категорию
        let category = '';
        if (data.subj_name) {
          category = data.subj_name;
        } else if (data.subject_name) {
          category = data.subject_name;
        } else if (data.category) {
          category = data.category;
        } else if (data.subjectName) {
          category = data.subjectName;
        }
        
        // Если нашли хоть что-то - возвращаем
        if (Object.keys(characteristics).length > 0 || description || category) {
          console.log(`[WB Parser] Успех на попытке ${i + 1}: характеристик=${Object.keys(characteristics).length}, описание=${description.length} символов, категория="${category}"`);
          return { characteristics, description, category };
        }
        
        console.log(`[WB Parser] Попытка ${i + 1}: данные получены, но пусты`);
        
      } catch (error) {
        console.log(`[WB Parser] Ошибка на попытке ${i + 1}:`, error);
        continue;
      }
    }
    
    console.log(`[WB Parser] Все попытки исчерпаны, данные не получены`);
    return { characteristics: {}, description: '', category: '' };
    
  } catch (error) {
    console.error(`[WB Parser] Критическая ошибка при получении дополнительных данных:`, error);
    return { characteristics: {}, description: '', category: '' };
  }
}

/**
 * Обрабатывает данные товара из WB API
 * @param product - Объект товара из API
 * @param productId - ID товара
 * @returns Обработанные данные товара
 */
async function processWBProductData(product: any, productId: number): Promise<WBProductData> {

  // Извлекаем характеристики из API
  const characteristics: Record<string, string> = {};
  if (product.options) {
    product.options.forEach((option: any) => {
      if (option.name && option.value) {
        characteristics[option.name] = option.value;
      }
    });
  }
  
  // Для скорости пропускаем попытку получения дополнительных данных
  // (они все равно таймаутятся)
  const allCharacteristics = characteristics;

  // Извлекаем изображения
  const images: string[] = [];
  
  // Проверяем есть ли готовые URL в API ответе
  let foundDirectUrls = false;
  
  if (product.media?.images && Array.isArray(product.media.images) && product.media.images.length > 0) {
    product.media.images.forEach((img: any) => {
      let imgUrl = '';
      if (typeof img === 'string') {
        imgUrl = img;
      } else if (img?.big) {
        imgUrl = img.big;
      } else if (img?.c516x688) {
        imgUrl = img.c516x688;
      } else if (img?.c246x328) {
        imgUrl = img.c246x328;
      }
      
      if (imgUrl) {
        if (!imgUrl.startsWith('http')) {
          imgUrl = `https:${imgUrl}`;
        }
        images.push(imgUrl);
      }
    });
    foundDirectUrls = images.length > 0;
  }
  
  // Если прямых URL нет, генерируем их
  if (!foundDirectUrls) {
    const imageCount = product.pics || 10;
  for (let i = 1; i <= Math.min(imageCount, 14); i++) {
      const possibleUrls = getImageUrls(productId, i);
      images.push(possibleUrls[0]); // Используем первый URL
    }
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
  
  // Создаем базовое описание из названия товара
  let finalDescription = product.description || '';
  if (!finalDescription && product.name) {
    finalDescription = product.name;
    if (product.brand) {
      finalDescription = `${product.brand} - ${finalDescription}`;
    }
  }
  
  // Определяем категорию
  let finalCategory = '';
  
  // Логирование для отладки (можно отключить позже)
  // console.log(`[WB Parser] Товар: ${product.name}, subjectId: ${product.subjectId}`);
  
  // Приоритет 1: Прямое название категории из API
  if (product.subjectName) {
    finalCategory = product.subjectName;
  } else if (product.subject) {
    finalCategory = product.subject;
  }
  
  // Приоритет 2: Из характеристик
  if (!finalCategory) {
    finalCategory = allCharacteristics['Категория'] || allCharacteristics['Предмет'] || allCharacteristics['Тип'] || '';
  }
  
  // Приоритет 3: Mapping по subjectId (ПОЛНЫЙ список из логов)
  if (!finalCategory && product.subjectId) {
    const subjectMapping: Record<number, string> = {
      // Одежда женская
      162: 'Пижамы',
      192: 'Футболки',
      159: 'Свитшоты',
      150: 'Туники',
      // Аксессуары
      138: 'Рюкзаки',
      297: 'Брелоки',
      // Товары для дома
      908: 'Ножи',
    };
    finalCategory = subjectMapping[product.subjectId] || '';
  }

  return {
    id: product.id,
    name: product.name || '',
    brand: product.brand || allCharacteristics['Бренд'] || '',
    description: finalDescription,
    category: finalCategory,
    price: productPrice,
    oldPrice: productOldPrice,
    images,
    characteristics: allCharacteristics,
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
  // Формируем расширенное описание из характеристик
  let description = wbData.description || '';
  
  if (Object.keys(wbData.characteristics).length > 0) {
    const chars = wbData.characteristics;
    
    // Состав/Материал (если есть)
    const composition = chars['Состав'] || chars['Материал'] || chars['Материал верха'] || chars['Материал подкладки'];
    if (composition) {
      description += `\n\nСостав: ${composition}`;
    }
    
    // Добавляем важные характеристики
    const importantChars = [
      'Количество отделений',
      'Количество карманов',
      'Размер рюкзака',
      'Вместимость рюкзака',
      'Вместимость',
      'Объем',
      'Размер',
      'Размер на модели',
      'Рост модели на фото',
      'Особенности',
      'Особенности рюкзака',
      'Тип',
      'Назначение',
      'Материал подкладки',
      'Страна производства',
      'Пол',
      'Возраст',
      'Сезон',
      'Комплектация'
    ];
    
    importantChars.forEach(charName => {
      if (chars[charName]) {
        description += `\n${charName}: ${chars[charName]}`;
      }
    });
    
    // Размеры (если есть)
    const dimensions = chars['Длина'] || chars['Ширина'] || chars['Высота'] || chars['Размеры'];
    if (dimensions || (chars['Длина'] && chars['Ширина'])) {
      if (chars['Длина'] && chars['Ширина']) {
        let dimStr = `${chars['Ширина']}х${chars['Длина']}`;
        if (chars['Высота']) dimStr += `х${chars['Высота']}`;
        description += `\n\nРазмеры: ${dimStr}`;
      } else if (dimensions) {
        description += `\n\nРазмеры: ${dimensions}`;
      }
    }
    
    // Вес (если есть)
    const weight = chars['Вес'] || chars['Вес товара'] || chars['Вес товара с упаковкой'];
    if (weight) {
      description += `\nВес: ${weight}`;
    }
    
    // Добавляем остальные характеристики, которые еще не были добавлены
    const addedChars = [
      'Состав', 'Материал', 'Материал верха', 'Материал подкладки',
      'Количество отделений', 'Количество карманов', 'Размер рюкзака',
      'Вместимость рюкзака', 'Вместимость', 'Объем', 'Размер',
      'Размер на модели', 'Рост модели на фото',
      'Особенности', 'Особенности рюкзака', 'Тип', 'Назначение',
      'Длина', 'Ширина', 'Высота', 'Размеры',
      'Вес', 'Вес товара', 'Вес товара с упаковкой',
      'Страна производства', 'Пол', 'Возраст', 'Сезон', 'Комплектация',
      'Бренд', 'Цвет' // Эти идут в теги
    ];
    
    const otherChars = Object.entries(chars).filter(([key]) => !addedChars.includes(key));
    if (otherChars.length > 0) {
      description += '\n\nДополнительные характеристики:';
      otherChars.forEach(([key, value]) => {
        description += `\n${key}: ${value}`;
      });
    }
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
    category: wbData.category,
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
 * Парсит множественные URL товаров из текста
 * @param text - Текст со ссылками (по одной на строку или через запятую)
 * @returns Массив ссылок на товары
 */
export function parseMultipleProductUrls(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Разбиваем по переносам строк и запятым
  const lines = text.split(/[\n,]/);
  
  // Фильтруем и очищаем ссылки
  const urls = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => {
      // Проверяем, что это действительно ссылка на товар WB
      const productId = extractProductId(line);
      return productId !== null;
    });

  return urls;
}

/**
 * Импортирует несколько товаров по списку ссылок
 * @param urls - Массив ссылок на товары WildBerries
 * @returns Массив преобразованных данных товаров
 */
export async function importMultipleProducts(urls: string[]): Promise<ParsedProductData[]> {
  const products: ParsedProductData[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    try {
      const productData = await importFromWildberries(url);
      if (productData) {
        products.push(productData);
        
        // Небольшая задержка между запросами (150мс для скорости)
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    } catch (error) {
      console.error(`[WB Import Error] ${url}:`, error);
    }
  }

  return products;
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

