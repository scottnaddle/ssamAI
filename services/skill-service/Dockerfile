FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install \
    "fastapi>=0.115.4" \
    "uvicorn[standard]>=0.32.0" \
    "pydantic>=2.9.2" \
    "pydantic-settings>=2.6.1" \
    "httpx>=0.27.2" \
    "neo4j>=5.25.0" \
    "python-pptx>=1.0.2" \
    "python-multipart>=0.0.17" \
    "olefile>=0.47"

COPY app ./app

EXPOSE 8300
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8300"]
