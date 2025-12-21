FROM python:3.12-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libjpeg-dev \
    libpng-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем uv
RUN pip install uv

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY pyproject.toml ./

# Устанавливаем зависимости с помощью uv
RUN uv pip install --system .

# Создаем пользователя для безопасности
RUN useradd -m -u 1000 appuser

# Копируем код приложения
COPY . .

# Устанавливаем правильные права на директории
RUN mkdir -p /app/src/static /app/src/media && chown -R appuser:appuser /app
USER appuser

# Открываем порт
EXPOSE 8000

# Команда по умолчанию
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
