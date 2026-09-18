"""Inspection API routes for package compliance screening."""
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from ..schemas import ConsistencyCheckResponse, InspectionResponse
from ..services.compliance_service import compliance_service
from ..services.storage_service import storage_service
from ..services.ai_service import ai_service
from ..utils.image_utils import validate_and_inspect_image

router = APIRouter(prefix="/api/inspection", tags=["Inspection"])


class DemoAnalyzeRequest(BaseModel):
    sample_type: str = "sample_compliant"


@router.post("/analyze", response_model=InspectionResponse)
async def analyze_package(
    image: UploadFile = File(...),
    category: Optional[str] = Form("Auto Detect"),
    demo_sample: Optional[str] = Form(None),
):
    """Analyze an uploaded packaged commodity image for Quality Assurance compliance."""
    try:
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file received. Please upload a clear package image.",
            )

        result = compliance_service.process_inspection(
            image_bytes=image_bytes,
            category_hint=category,
            force_demo_sample=demo_sample,
        )
        return result

    except HTTPException:
        # Preserve intentional client errors instead of converting them to 500s.
        raise
    except ValueError as ve:
        message = str(ve)
        if "AI label extraction failed" in message or "GEMINI_API_KEY" in message:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to complete package analysis: {str(e)}",
        )


@router.post("/demo-analyze", response_model=InspectionResponse)
async def demo_analyze_package(payload: DemoAnalyzeRequest):
    """Instant demo inspection without requiring image upload or external API quota."""
    try:
        return compliance_service.run_sample_inspection(payload.sample_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo simulation failed: {str(e)}",
        )


@router.post("/consistency-check", response_model=ConsistencyCheckResponse)
async def consistency_check(
    image: UploadFile = File(...),
    category: Optional[str] = Form("Auto Detect"),
):
    """Repeat the same live extraction twice to measure model stability."""
    try:
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file received.",
            )
        pil_image, _ = validate_and_inspect_image(image_bytes)
        first, second, consistency, first_meta, second_meta = ai_service.compare_repeated_extractions(
            pil_image,
            category,
        )
        return ConsistencyCheckResponse(
            model=str(first_meta.get("model") or ai_service.model_name),
            second_model=str(second_meta.get("model") or ai_service.model_name),
            consistency=consistency,
            first_identity_status=first.web_verification.identity_status,
            second_identity_status=second.web_verification.identity_status,
        )
    except HTTPException:
        raise
    except ValueError as ve:
        message = str(ve)
        if "AI label extraction failed" in message or "GEMINI_API_KEY" in message:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))


@router.get("/history", response_model=List[dict])
async def get_inspection_history():
    """Retrieve all historical inspections."""
    return storage_service.list_all()


@router.get("/samples")
async def get_demo_samples():
    """Retrieve list of pre-configured demo sample scenarios."""
    return [
        {
            "id": "sample_compliant",
            "name": "Sample Biscuits (Compliant Pack)",
            "product_name": "Royal Butter Delight Biscuits",
            "category": "Food",
            "expected_status": "COMPLIANT",
            "description": "Standard packaged biscuits with full manufacturer address, SI net weight (200g), MRP with tax clause, mfg date, and consumer care phone.",
        },
        {
            "id": "sample_non_compliant",
            "name": "Sample Snack (Non-Compliant Pack)",
            "product_name": "Crunchy Masala Bites",
            "category": "Food",
            "expected_status": "NON_COMPLIANT",
            "description": "Packaged snack missing manufacturer address, generic product name, mfg/packing date, best-before declaration, and consumer care contacts.",
        },
    ]


@router.get("/status/config")
async def get_system_config():
    """Check AI service configuration and system readiness."""
    return {
        "ai_service_configured": ai_service.is_configured(),
        "ai_connectivity": "not_tested",
        "model": ai_service.model_name,
        "compliance_rules_loaded": 10,
        "storage_mode": "local_json_memory",
        "prototype_version": "1.1.0-grounded-verification",
        "web_grounding_enabled": True,
        "authenticity_claims": "conservative public-reference mismatch screening only",
    }


@router.get("/{inspection_id}", response_model=InspectionResponse)
async def get_inspection_by_id(inspection_id: str):
    """Fetch an individual inspection by reference ID."""
    inspection = storage_service.get(inspection_id)
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection record '{inspection_id}' not found.",
        )
    return inspection
