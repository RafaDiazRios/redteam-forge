#!/bin/bash

# Iniciar el backend FastAPI
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Iniciar el frontend React
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "RedTeam Forge está ejecutándose."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

# Esperar a que los procesos terminen
wait $BACKEND_PID $FRONTEND_PID
