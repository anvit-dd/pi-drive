FROM python:3.11-alpine3.20

RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY requirements.txt .

ENV PIP_DEFAULT_TIMEOUT=121 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN mkdir -p /app/data \
        && adduser -D -u 1000 appuser \
        && chown -R appuser:appuser /app

ENV BASE_PATH=/app/data
EXPOSE 4000
USER appuser
# CMD ["uvicorn","main:app","--host","0.0.0.0","--port","4000"]