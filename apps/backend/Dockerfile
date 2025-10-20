FROM jrottenberg/ffmpeg:latest AS ffmpeg
FROM python:3.11-slim

COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=ffmpeg /usr/local/bin/ffprobe /usr/local/bin/ffprobe
COPY --from=ffmpeg /usr/local/lib/ /usr/local/lib/

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

RUN mkdir -p /app/data \
    && useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app
# USER appuser

ENV BASE_PATH=/app/data
EXPOSE 4000
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","4000"]