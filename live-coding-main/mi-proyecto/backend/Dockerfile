FROM python:3.10-slim

WORKDIR /app

# Copiamos primero SOLO el archivo de requerimientos
COPY requirements.txt .

# Instalamos las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Ahora copiamos el resto del código (incluyendo tu app.py, bbdd.json y package.json)
COPY . .

# Exponemos el puerto 3000 como pide la guía
EXPOSE 3000

# Arrancamos Flask en el puerto 3000
CMD ["flask", "--app", "app.py", "run", "--host=0.0.0.0", "--port=3000"]