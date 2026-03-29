from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode

import requests
from fastapi import HTTPException

from app.config import settings
from app.services.token_store import get_token


@dataclass
class CanvasAuthContext:
    user_id: str
    access_token: str
    mode: str  # 'user_token', 'manual_token', or 'oauth'


class CanvasClient:
    def __init__(self) -> None:
        self.base_url = settings.canvas_base_url.rstrip("/")
        self.default_token = settings.canvas_token
        # Optional in-memory OAuth token store for demo use.
        self.oauth_tokens: dict[str, str] = {}

    def _headers(self, token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json+canvas-string-ids",
        }

    def _parse_next_link(self, link_header: str | None) -> str | None:
        if not link_header:
            return None

        for part in link_header.split(","):
            if 'rel="next"' in part:
                start = part.find("<")
                end = part.find(">")
                if start != -1 and end != -1 and end > start:
                    return part[start + 1 : end]

        return None

    def _resolve_token(self, user_id: str | None = None) -> CanvasAuthContext:
        # 1. Prefer a stored per-user token from SQLite
        if user_id:
            stored_token = get_token(user_id)
            if stored_token:
                return CanvasAuthContext(
                    user_id=user_id,
                    access_token=stored_token,
                    mode="user_token",
                )

        # 2. Optional fallback to in-memory OAuth token
        if user_id and user_id in self.oauth_tokens:
            return CanvasAuthContext(
                user_id=user_id,
                access_token=self.oauth_tokens[user_id],
                mode="oauth",
            )

        # 3. Final fallback to a single default token from .env
        if self.default_token:
            return CanvasAuthContext(
                user_id=user_id or "demo_user",
                access_token=self.default_token,
                mode="manual_token",
            )

        raise HTTPException(
            status_code=401,
            detail="Canvas is not connected for this user.",
        )

    def get(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        user_id: str | None = None,
    ) -> Any:
        auth = self._resolve_token(user_id)
        url = f"{self.base_url}/api/v1{path}"

        try:
            response = requests.get(
                url,
                headers=self._headers(auth.access_token),
                params=params,
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Canvas connection failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.text,
            )

        return response.json()

    def get_all(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        user_id: str | None = None,
    ) -> list[Any]:
        auth = self._resolve_token(user_id)
        url = f"{self.base_url}/api/v1{path}"
        items: list[Any] = []
        next_params = params.copy() if params else None

        while url:
            try:
                response = requests.get(
                    url,
                    headers=self._headers(auth.access_token),
                    params=next_params,
                    timeout=30,
                )
            except requests.exceptions.RequestException as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Canvas connection failed: {exc}",
                ) from exc

            if response.status_code >= 400:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text,
                )

            payload = response.json()

            if isinstance(payload, list):
                items.extend(payload)
            else:
                return [payload]

            url = self._parse_next_link(response.headers.get("Link"))
            next_params = None

        return items

    def get_courses(self, *, user_id: str | None = None) -> list[dict[str, Any]]:
        params = {
            "enrollment_state": "active",
            "state[]": ["available"],
            "include[]": ["term", "total_scores"],
        }
        return self.get_all("/courses", params=params, user_id=user_id)

    def get_enrollments(self, *, user_id: str | None = None) -> list[dict[str, Any]]:
        params = {
            "state[]": ["active"],
            "include[]": ["current_points"],
        }
        return self.get_all("/users/self/enrollments", params=params, user_id=user_id)

    def get_assignments(
        self,
        course_id: str,
        *,
        user_id: str | None = None,
    ) -> list[dict[str, Any]]:
        params = {
            "order_by": "due_at",
            "per_page": 100,
        }
        return self.get_all(
            f"/courses/{course_id}/assignments",
            params=params,
            user_id=user_id,
        )

    def get_submissions(
        self,
        course_id: str,
        *,
        user_id: str | None = None,
    ) -> list[dict[str, Any]]:
        params = {
            "include[]": ["assignment"],
            "per_page": 100,
        }
        return self.get_all(
            f"/courses/{course_id}/students/submissions",
            params=params,
            user_id=user_id,
        )

    def verify_token(self, token: str) -> dict[str, Any]:
        """
        Verify a token before saving it by making a small Canvas API call.
        Returns the current user profile if valid.
        """
        url = f"{self.base_url}/api/v1/users/self"

        try:
            response = requests.get(
                url,
                headers=self._headers(token),
                timeout=30,
            )
        except requests.exceptions.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Canvas connection failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            # Extract Canvas's own error message for better debugging
            canvas_msg = "Invalid Canvas token."
            try:
                err_body = response.json()
                errors = err_body.get("errors", [])
                if errors and isinstance(errors, list):
                    canvas_msg = errors[0].get("message", canvas_msg)
                elif err_body.get("message"):
                    canvas_msg = err_body["message"]
            except Exception:
                canvas_msg = response.text[:200] if response.text else canvas_msg
            raise HTTPException(
                status_code=400,
                detail=f"Canvas rejected the token (HTTP {response.status_code}): {canvas_msg}. "
                       f"Make sure you copied the full token from Canvas → Account → Settings → Approved Integrations → New Access Token.",
            )

        return response.json()

    def build_oauth_login_url(self, user_id: str) -> str:
        if not settings.canvas_client_id or not settings.canvas_redirect_uri:
            raise HTTPException(
                status_code=500,
                detail="OAuth is not configured. Set CANVAS_CLIENT_ID and CANVAS_REDIRECT_URI.",
            )

        state = self._sign_state(user_id)
        query = urlencode(
            {
                "client_id": settings.canvas_client_id,
                "response_type": "code",
                "redirect_uri": settings.canvas_redirect_uri,
                "state": state,
            }
        )
        return f"{self.base_url}/login/oauth2/auth?{query}"

    def exchange_code_for_token(self, code: str) -> dict[str, Any]:
        if (
            not settings.canvas_client_id
            or not settings.canvas_client_secret
            or not settings.canvas_redirect_uri
        ):
            raise HTTPException(
                status_code=500,
                detail="OAuth is not fully configured.",
            )

        token_url = f"{self.base_url}/login/oauth2/token"
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.canvas_client_id,
            "client_secret": settings.canvas_client_secret,
            "redirect_uri": settings.canvas_redirect_uri,
            "code": code,
        }

        try:
            response = requests.post(token_url, data=data, timeout=30)
        except requests.exceptions.RequestException as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Canvas OAuth token exchange failed: {exc}",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=response.status_code,
                detail=response.text,
            )

        return response.json()

    def store_oauth_token(self, user_id: str, token: str) -> None:
        self.oauth_tokens[user_id] = token

    def get_connection_status(self, user_id: str | None) -> CanvasAuthContext:
        return self._resolve_token(user_id)

    def _sign_state(self, user_id: str) -> str:
        nonce = secrets.token_urlsafe(12)
        raw = f"{user_id}:{nonce}"
        signature = hmac.new(
            settings.oauth_state_secret.encode(),
            raw.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{raw}:{signature}"

    def verify_state(self, state: str) -> str:
        try:
            user_id, nonce, signature = state.split(":", 2)
            raw = f"{user_id}:{nonce}"
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid OAuth state.") from exc

        expected = hmac.new(
            settings.oauth_state_secret.encode(),
            raw.encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            raise HTTPException(
                status_code=400,
                detail="Invalid OAuth state signature.",
            )

        return user_id


canvas_client = CanvasClient()