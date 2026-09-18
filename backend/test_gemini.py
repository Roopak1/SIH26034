"""Small, non-secret Gemini configuration and model-availability diagnostic."""

import sys

from google import genai

from app.services.ai_service import ai_service


def main() -> int:
    if not ai_service.is_configured():
        print("Gemini is not configured: set GEMINI_API_KEY in backend/.env")
        return 1

    configured_model = ai_service.model_name
    client = genai.Client(api_key=ai_service.api_key)

    try:
        models = list(client.models.list())
    except Exception as exc:
        message = str(exc)
        if "API_KEY_INVALID" in message or "API key not valid" in message:
            print("Gemini authentication failed: the configured API key is invalid.")
        else:
            print(f"Gemini connectivity check failed: {message[:240]}")
        return 1

    model_names = {str(model.name).removeprefix("models/") for model in models}
    print(f"Configured model: {configured_model}")
    print(f"Configured model available: {'yes' if configured_model in model_names else 'no'}")
    print(f"Models returned by Gemini: {len(model_names)}")
    if configured_model not in model_names:
        print("Choose a model returned by the API or update GEMINI_MODEL in backend/.env")
        return 2

    try:
        client.models.generate_content(
            model=configured_model,
            contents="Reply with exactly OK.",
        )
    except Exception as exc:
        message = str(exc)
        if "429" in message or "quota" in message.lower():
            print("Model generation failed: Gemini quota is exhausted for this project.")
        else:
            print(f"Model generation failed: {message[:240]}")
        return 1

    print("Model generation smoke test: passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
