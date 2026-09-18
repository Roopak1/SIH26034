from PIL import Image

from app.schemas import ProductData, WebVerification
from app.services.ai_service import AIService


def test_repeat_extraction_reports_consistent_core_fields(monkeypatch):
    service = AIService()
    calls = []

    def fake_extract(image, category_hint=None):
        calls.append(category_hint)
        service.last_call_metadata = {"model": "test-model"}
        return ProductData(
            product_name="Example Biscuits",
            category="Food",
            web_verification=WebVerification(identity_status="MATCH"),
        )

    monkeypatch.setattr(service, "extract_product_data", fake_extract)

    _, _, consistency, metadata, second_metadata = service.compare_repeated_extractions(
        Image.new("RGB", (32, 32)),
        "Food",
    )

    assert calls == ["Food", "Food"]
    assert metadata["model"] == "test-model"
    assert second_metadata["model"] == "test-model"
    assert consistency.status == "CONSISTENT"
    assert consistency.agreement_score == 100
    assert consistency.differing_fields == []


def test_repeat_extraction_flags_inconsistent_core_fields(monkeypatch):
    service = AIService()
    products = iter([
        ProductData(product_name="Example Biscuits"),
        ProductData(product_name="Different Biscuits"),
    ])

    def fake_extract(image, category_hint=None):
        service.last_call_metadata = {"model": "test-model"}
        return next(products)

    monkeypatch.setattr(service, "extract_product_data", fake_extract)

    _, _, consistency, _, _ = service.compare_repeated_extractions(
        Image.new("RGB", (32, 32)),
    )

    assert consistency.status == "INCONSISTENT"
    assert "product_name" in consistency.differing_fields
