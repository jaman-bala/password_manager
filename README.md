# Password Manager

Веб-приложение для управления паролями с Django backend и React frontend.

## Структура проекта

```
password_manager/
├── backend/                 # Django backend
│   ├── src/
│   │   ├── apps/
│   │   │   ├── user/       # Пользователи и аутентификация
│   │   │   ├── product/    # Продукты/пароли
│   │   │   └── references/ # Справочники
│   │   └── config/         # Настройки Django
│   ├── infra/
│   │   └── docker/         # Docker конфигурация
│   └── pyproject.toml      # Python зависимости
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # React компоненты
    │   ├── hooks/         # Custom hooks
    │   └── types/         # TypeScript типы
    └── package.json       # Node.js зависимости
```

## Быстрый запуск через Docker

### Предварительные требования

- Docker
- Docker Compose

### Запуск

1. Перейдите в папку с docker-compose.yml:
```bash
cd backend/infra/docker
```

2. Создайте файл .env (скопируйте из env.example):
```bash
cp ../envs/env.example .env
```

3. Запустите все сервисы:
```bash
docker-compose up --build
```

### Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin панель**: http://localhost:8000/admin
- **Nginx (основной)**: http://localhost:80

### Учетные данные по умолчанию

- **Username**: admin
- **Password**: admin123

## Разработка

### Backend (Django)

1. Установите зависимости:
```bash
cd backend
uv sync
```

2. Запустите миграции:
```bash
cd src
python manage.py migrate
```

3. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

4. Запустите сервер:
```bash
python manage.py runserver
```

### Frontend (React)

1. Установите зависимости:
```bash
cd frontend
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

## API Endpoints

### Аутентификация

- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/verify-token` - Проверка токена
- `GET /api/auth/profile` - Профиль пользователя

### Продукты

- `GET /api/index/` - Список продуктов
- `POST /api/index/` - Создание продукта
- `PUT /api/index/{id}` - Обновление продукта
- `DELETE /api/index/{id}` - Удаление продукта

## Технологии

### Backend
- Django 4.2+
- Django REST Framework
- SimpleJWT для аутентификации
- PostgreSQL
- Redis (для кэширования)
- Docker

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (иконки)

### Инфраструктура
- Docker Compose
- Nginx (reverse proxy)
- PostgreSQL
- Redis

## Особенности

- Кастомная модель пользователя с полями FIO, email, username
- JWT аутентификация с refresh токенами
- Поддержка ролей пользователей
- Админ панель с Unfold
- CORS настроен для фронтенда
- Health checks для Docker
- Автоматические миграции при запуске

## Безопасность

- JWT токены с настраиваемым временем жизни
- Rate limiting через Nginx
- CORS настроен для конкретных доменов
- Безопасные заголовки HTTP
- Валидация паролей Django

## Мониторинг

- Health check endpoints для всех сервисов
- Логирование через Docker
- Метрики доступности через health checks
