import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

_client = None


def get_db():
    """Return the game_of_life database. Client is created once and reused."""
    global _client
    if _client is None:
        uri = os.environ.get("MONGODB_URI")
        if not uri:
            raise RuntimeError("MONGODB_URI environment variable is not set.")
        # tlsCAFile=certifi.where() fixes macOS SSL cert verification
        _client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    return _client["game_of_life"]
