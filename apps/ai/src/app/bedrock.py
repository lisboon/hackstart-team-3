"""Bearer authentication for Amazon Bedrock's OpenAI-compatible endpoint.

Bedrock speaks the OpenAI wire protocol on the `bedrock-mantle` host, so the
OpenAI SDK works against it unchanged except for the credential. Bedrock wants a
short-lived API key, while the client resolves `api_key` once when it is built.
Signing per request from the ambient AWS credentials is what keeps a long-running
container from turning 401 a few hours in, and it means no key is ever written to
an image, a parameter store or a .env.
"""

import threading
import time
from collections.abc import Callable, Generator
from datetime import timedelta
from typing import Any

import httpx
from aws_bedrock_token_generator import provide_token
from botocore.session import Session

# Minted well inside the 12h ceiling and replaced at half life. The bound that
# actually bites is not the token's own expiry but the credentials behind it: a
# task role rotates on a schedule of its own, and a token signed with credentials
# that have since rotated is dead on arrival.
TOKEN_LIFETIME = timedelta(hours=1)
REFRESH_AFTER_SECONDS = 1800.0


class MissingAwsCredentialsError(RuntimeError):
    """Raised when there is nothing to sign a token with.

    The likeliest failure on a fresh clone, and the generic handler would report
    it as "AI provider failed" -- true, useless, and indistinguishable from the
    model being down.
    """


def mantle_base_url(region: str) -> str:
    """The endpoint that serves /chat/completions.

    Not `bedrock-runtime`: that host answers OpenAI traffic only under /openai/v1,
    only for the openai.* models, and against a separate daily token quota.
    """
    return f"https://bedrock-mantle.{region}.api.aws/v1"


class _PooledCredentials:
    """Hands the token generator one long-lived botocore session.

    provide_token constructs a fresh Session on every call, so each mint would be
    another round trip to the container credential endpoint. Holding a single
    session lets botocore return the cached, self-refreshing credentials it has
    already resolved.
    """

    def __init__(self) -> None:
        self._session = Session()

    def load(self) -> Any:
        return self._session.get_credentials()


class BedrockTokenAuth(httpx.Auth):
    """Attaches a freshly minted Amazon Bedrock API key to every request."""

    def __init__(
        self,
        region: str,
        clock: Callable[[], float] = time.monotonic,
        mint: Callable[..., str] = provide_token,
    ) -> None:
        self._region = region
        self._clock = clock
        self._mint = mint
        self._credentials = _PooledCredentials()
        self._lock = threading.Lock()
        self._token: str | None = None
        self._minted_at = 0.0

    def token(self, *, force: bool = False) -> str:
        with self._lock:
            aged = self._clock() - self._minted_at >= REFRESH_AFTER_SECONDS
            if self._token is None or force or aged:
                try:
                    self._token = self._mint(
                        region=self._region,
                        aws_credentials_provider=self._credentials,
                        expiry=TOKEN_LIFETIME,
                    )
                except RuntimeError as error:
                    # provide_token raises a bare RuntimeError for this one case.
                    raise MissingAwsCredentialsError(
                        "no AWS credentials to sign the Bedrock token; export the "
                        "AWS_* variables or use LLM_PROVIDER=fake"
                    ) from error
                self._minted_at = self._clock()
            return self._token

    def auth_flow(self, request: httpx.Request) -> Generator[httpx.Request, httpx.Response]:
        request.headers["Authorization"] = f"Bearer {self.token()}"
        response = yield request
        if response.status_code in {401, 403}:
            # Either the credentials rotated under us or the token lapsed early.
            # One forced remint separates that from a real permission problem,
            # which simply fails the same way twice.
            request.headers["Authorization"] = f"Bearer {self.token(force=True)}"
            yield request
