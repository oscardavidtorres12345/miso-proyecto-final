from fastapi import FastAPI
import redis.asyncio as redis
import os

app = FastAPI()
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"), decode_responses=True)

@app.get("/logs/{ip}")
async def get_fraud_logs(ip: str):
    attempts = await redis_client.get(f"attempts:{ip}")
    is_blocked = await redis_client.get(f"blacklist:{ip}")
    return {"ip": ip, "attempts": attempts, "blocked": bool(is_blocked)}
