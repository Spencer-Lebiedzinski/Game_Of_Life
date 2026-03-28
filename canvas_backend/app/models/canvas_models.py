from pydantic import BaseModel


class ConnectCanvasTokenRequest(BaseModel):
    user_id: str
    token: str


class DisconnectCanvasRequest(BaseModel):
    user_id: str