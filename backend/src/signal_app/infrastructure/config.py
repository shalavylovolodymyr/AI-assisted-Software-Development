import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://signal:signal@127.0.0.1:54329/signal")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5178,http://127.0.0.1:5178").split(",")
