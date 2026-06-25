FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# build-essential: graphiti-core의 일부 의존성이 컴파일 필요할 수 있음
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install \
    "fastapi>=0.115.4" \
    "uvicorn[standard]>=0.32.0" \
    "pydantic>=2.9.2" \
    "pydantic-settings>=2.6.1" \
    "httpx>=0.27.2" \
    "neo4j>=5.25.0"

COPY app ./app

EXPOSE 8100
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
