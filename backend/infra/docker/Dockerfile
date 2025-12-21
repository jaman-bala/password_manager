# Use Python 3.12 Alpine image
FROM python:3.12-alpine

# Install system dependencies for Alpine
RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    postgresql-dev \
    jpeg-dev \
    zlib-dev \
    freetype-dev \
    lcms2-dev \
    openjpeg-dev \
    tiff-dev \
    tk-dev \
    tcl-dev \
    harfbuzz-dev \
    fribidi-dev \
    libffi-dev \
    curl \
    netcat-openbsd

# Install uv for faster dependency management
RUN pip install uv

# Set work directory
WORKDIR /app

# Copy requirements first for better caching
COPY pyproject.toml ./

# Install Python dependencies
RUN uv pip install --system .

# Create app user
RUN adduser -D -u 1000 appuser

# Copy project files
COPY . .

# Create directories and set permissions
RUN mkdir -p /app/src/staticfiles /app/src/media/product_images /app/src/media/category_images && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app/src/staticfiles && \
    chmod -R 777 /app/src/media  # Более открытые права для записи файлов

# Switch to app user
USER appuser

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
