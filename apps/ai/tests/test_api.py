from uuid import uuid4

from fastapi.testclient import TestClient

from app.config import get_settings


def test_stream_contract(monkeypatch) -> None:
    monkeypatch.setenv("INTERNAL_TOKEN", "test-internal-token-value")
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    get_settings.cache_clear()
    from app.main import app

    client = TestClient(app)
    response = client.post(
        "/internal/v1/runs/stream",
        headers={"x-internal-token": "test-internal-token-value"},
        json={
            "organization_id": str(uuid4()),
            "user_id": str(uuid4()),
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert response.status_code == 200
    assert "event: started" in response.text
    assert "event: token" in response.text
    assert "event: completed" in response.text
    assert "Test response: hello" in response.text


def test_rejects_missing_internal_token(monkeypatch) -> None:
    monkeypatch.setenv("INTERNAL_TOKEN", "test-internal-token-value")
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    get_settings.cache_clear()
    from app.main import app

    response = TestClient(app).post(
        "/internal/v1/runs/stream",
        json={
            "organization_id": str(uuid4()),
            "user_id": str(uuid4()),
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert response.status_code == 401
