FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# ✅ Fix: Ensure correct repo certificates + update + install
RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    libpq-dev \
    gcc \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "anfu_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
