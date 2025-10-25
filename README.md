# Stili Goroda

Интернет-магазин строительных материалов и товаров для дома.

## Технологии

- **Next.js 14** - React фреймворк
- **TypeScript** - типизация
- **Prisma** - ORM для работы с базой данных
- **Tailwind CSS** - стилизация
- **SQLite** - база данных

## Функционал

- 🛍️ Каталог товаров с фильтрацией и поиском
- 🛒 Корзина покупок
- ❤️ Избранное
- 👤 Личный кабинет пользователя
- 📦 История заказов
- 🔐 Аутентификация и авторизация
- 👨‍💼 Административная панель
- 📊 Аналитика продаж
- 📥 Импорт товаров из Wildberries
- 📤 Экспорт данных в CSV

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/nofumex/stili-goroda.git

# Перейти в директорию
cd stili-goroda

# Установить зависимости
npm install

# Создать файл .env и настроить переменные окружения
cp .env.example .env

# Инициализировать базу данных
npx prisma migrate dev

# Запустить проект в режиме разработки
npm run dev
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm start
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

```
stili-goroda/
├── prisma/              # Схема БД и миграции
├── public/              # Статические файлы
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # React компоненты
│   ├── lib/            # Утилиты и хелперы
│   ├── store/          # Zustand хранилища
│   └── types/          # TypeScript типы
├── .gitignore
├── package.json
└── README.md
```

## Лицензия

MIT

