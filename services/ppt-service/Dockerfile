FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# 시스템 의존성: python-pptx가 필요로 하는 것은 없지만,
# 향후 이미지 처리 (Pillow) 추가 가능성을 위해 libjpeg 설치.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install \
    "fastapi>=0.115.4" \
    "uvicorn[standard]>=0.32.0" \
    "python-pptx>=1.0.2" \
    "python-multipart>=0.0.17" \
    "httpx>=0.27.2" \
    "pydantic>=2.9.2" \
    "pydantic-settings>=2.6.1"

COPY app ./app

EXPOSE 8200
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8200"]
