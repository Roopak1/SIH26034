"""AI Extraction Service using Google Gemini via the official google-genai SDK."""
import os
import json
import logging
from typing import Any, Dict, List, Optional
from PIL import Image
from ..schemas import AIConsistencyInfo, ProductData

logger = logging.getLogger(__name__)

LEGACY_EXTRACTION_SYSTEM_PROMPT = """You are an information extraction system for packaged commodity labels under Legal Metrology compliance regulations.

Your sole duty is to extract visible label declarations from the provided package image and output structured JSON.

CRITICAL INSTRUCTIONS:
1. Inspect ONLY visible information present in the image.
2. NEVER invent, extrapolate, or hallucinate missing information.
3. If a field or detail is not clearly visible or absent, return null (None).
4. Distinguish carefully between Brand Name (trade name) and Generic Product Name (commodity category e.g., 'Biscuits', 'Atta', 'Soap', 'Edible Oil').
4A. For generic_name, extract ONLY the actual generic commodity/product type printed on the package.
    Examples: "Biscuits", "Atta", "Soap", "Shampoo", "Edible Oil".
    Do NOT use slogans, advertisements, descriptions, claims, or marketing sentences.
    For example, if the package says "Patanjali Doodh Biscuits are Easy to Digest",
    the generic_name should be "Biscuits", not "Patanjali Doodh Biscuits are Easy to Digest".

4B. For product_name, extract the actual product name only.
    Do NOT include slogans, advertising claims, or descriptive sentences.

4C. For raw_evidence, the "evidence" value MUST be an exact verbatim quote
    from the visible package image that directly supports that field.
    Do NOT paraphrase, reconstruct, shorten incorrectly, or combine unrelated text.

4D. The raw_evidence for product_name and generic_name must directly support the
    corresponding extracted value. Do not use a marketing sentence merely because
    it contains the product name.

4E. Before producing the final JSON, verify every raw_evidence entry against the
    actual visible text in the image. If exact supporting text is not visible,
    do not create evidence for that field.

4F. Never guess missing information. If the exact information cannot be read,
    return null.
4G. raw_evidence must use the SMALLEST exact visible text span that directly proves
the extracted field.

4H. Do NOT reuse one long sentence as evidence for multiple fields when smaller
exact text is visible.

4I. For example, if the image visibly contains:
"Patanjali Doodh Biscuits are Easy to Digest"
then:
- brand_name value "Patanjali" should use evidence "Patanjali"
- product_name value "Doodh Biscuits" should use evidence "Doodh Biscuits"
- generic_name value "Biscuits" should use evidence "Biscuits"

4J. Evidence may be a substring of a larger printed sentence, but it must be copied
EXACTLY from the image and must directly support the field.

4K. Never use the same evidence sentence for brand_name, product_name, and
generic_name when the individual words or phrases are visibly identifiable.

4L. Before returning JSON, check that every raw_evidence item's evidence contains
the exact extracted value or is an exact directly-supporting label phrase.
5. Extract Manufacturer / Packer / Importer information:

Search the ENTIRE package image carefully, including the front, back,
left side, right side, top, bottom, corners, and all small-print areas.

Look specifically for:
"Manufactured by"
"Manufactured & Packed by"
"Manufactured and Packed by"
"Mfd. by"
"Mfg. by"
"Packed by"
"Pkd. by"
"Imported by"
"Importer"
"Marketed by"
"Manufactured for"

If an explicit manufacturer/packer/importer declaration is visible,
extract:

- role: the exact visible declaration
- name: the company or firm associated with the declaration
- address: the complete visible address associated with that entity

IMPORTANT:
- Do NOT infer the manufacturer from the brand name.
- Do NOT infer the manufacturer from a logo.
- Do NOT infer the manufacturer from a barcode.
- Do NOT infer the manufacturer from a phone number or website.
- Do NOT use consumer-care information as manufacturer information.
- Do NOT use "ADDRESS AS PER REGD. OFFICE" alone as manufacturer evidence.
- Do NOT invent or guess missing information.

If the declaration and company name are visible but the address is
unreadable, return the company name and set address to null.

If no explicit manufacturer/packer/importer declaration is visible,
return role, name, and address as null.

If text is too small, blurry, cropped, folded, or unreadable,
return null rather than guessing.
6. Extract Net Quantity:
   - value: numeric amount (e.g., '200', '1.5', '10')
   - unit: standardized SI unit (e.g., 'g', 'kg', 'ml', 'L', 'N', 'units')
   - raw_text: verbatim text snippet
7. Extract Maximum Retail Price (MRP):
   - value: numeric price only (e.g., '80', '120.50')
   - currency: 'INR'
   - inclusive_of_taxes: true if words like 'inclusive of all taxes' or 'incl. of all taxes' appear, false if absent, null if unclear
   - raw_text: verbatim text snippet
8. Extract Dates:
   - manufacture_date: date or month/year of manufacture
   - packing_date: date or month/year of packing
   - best_before: best before duration (e.g., '6 months from manufacture')
   - use_by: expiry date if present
9. Extract Consumer Care:
   - phone: customer care toll-free/telephone number
   - email: contact email
   - address: consumer complaints address/website
10. Extract Country of Origin ONLY if it is explicitly printed on the package.
   Accept declarations such as:
   - "Country of Origin: India"
   - "Made in India"
   - "Product of India"
   - "Country of Origin: China"
   Do NOT infer the country from the manufacturer address, company name, brand name, website, phone number, barcode, or any other indirect information.
   If there is no explicit country-of-origin declaration visible on the package, return null.
11. Extract raw_evidence array: For each detected field, include an object:
    {"field": "<field_name>", "value": "<extracted_val>", "evidence": "<exact verbatim quote from package>"}

12. Perform a complete visual scan of the ENTIRE package image before producing JSON.

13. Inspect every visible area of the package, including front, back, side, top, bottom, corners, and small-print areas.

14. Manufacturer, packer, importer, and marketer information may appear in very small text. Search the ENTIRE package image carefully, including the bottom, back, side panels, corners, and all small-print areas.

    Search specifically for these declarations:
    "Manufactured by"
    "Manufactured & Packed by"
    "Manufactured and Packed by"
    "Mfd. by"
    "Mfg. by"
    "Packed by"
    "Pkd. by"
    "Imported by"
    "Importer"
    "Marketed by"
    "Manufactured for"

    If any of these declarations are clearly visible, extract the corresponding company/firm name and complete visible address.

    Do NOT return manufacturer.name as null when a manufacturer/packer/importer declaration and its company name are clearly visible anywhere in the image.

    Do NOT treat "FOR CONSUMER CARE CONTACT" or "CONSUMER CARE" as manufacturer information unless the same text explicitly identifies the manufacturer, packer, or importer.

    Do NOT infer the manufacturer from the brand name. The manufacturer relationship must be explicitly visible on the package.

15. Do not assume a field is missing merely because it is not near the product name or MRP.

16. Search the entire image specifically for:
    MRP, Net Weight, Net Qty, Net Quantity, Manufactured, Packed,
    Imported, Marketed, Batch, Lot, PKD, MFD, Best Before,
    Use By, Expiry, Customer Care, Consumer Care, Helpline,
    Email, Address, Made in, Country of Origin.

16A. IMPORTANT: Manufacturer information must be extracted whenever ANY visible manufacturer/packer/importer declaration is present. Do not return manufacturer as null if the image visibly contains a company name associated with "Manufactured by", "Mfd. by", "Manufactured & Packed by", "Packed by", "Pkd. by", "Imported by", or "Importer".

16B. When reading manufacturer information, inspect the entire image at high attention, especially the bottom, back, side panels, and small-print text. Manufacturer information may be much smaller than the product name.

16C. If a declaration such as "Manufactured by [COMPANY NAME]" is visible, extract:
    role = "Manufactured by"
    name = "[COMPANY NAME]"
    address = the complete address visible after the company name.

16D. Do not use consumer-care text as manufacturer information. "FOR CONSUMER CARE CONTACT" is a consumer-care declaration unless the same text explicitly identifies the manufacturer/packer/importer.

16E. Do not infer manufacturer information from the brand name alone. Only extract it when the company/manufacturer relationship is visibly declared.
16F. IMPORTANT: If none of the manufacturer/packer/importer/marketer declarations listed above are visibly present in the image, manufacturer.role, manufacturer.name, and manufacturer.address MUST remain null. Do not infer or guess the manufacturer from the brand name, logo, barcode, consumer-care text, registered-office wording, or any other indirect information.

17. Distinguish carefully between:
    - manufacture date
    - packing date
    - best-before duration
    - use-by/expiry date

18. Distinguish manufacturer/packer/importer information from marketer information.

19. For every detected field, include the exact visible wording in raw_evidence.

20. Do not reconstruct text that is not visible or readable.

21. If a field is genuinely not visible, return null.

22. Never mark a field as present simply because the field would normally be legally required.

23. Before returning the final JSON, perform a second visual pass specifically looking for:
    manufacturer, packer, importer, consumer care, dates, MRP,
    quantity, and country-of-origin declarations.
24. Evidence must come only from text that is actually visible and readable in the supplied image. Do not create a manufacturer, company name, address, phone number, email, or country of origin that is not visibly printed on the package.

25. If the image shows only "FOR CONSUMER CARE CONTACT", "ADDRESS AS PER REGD. OFFICE", or similar consumer-care wording without explicitly naming a manufacturer/packer/importer, keep manufacturer fields null.

26. For manufacturer extraction, the declaration and company relationship must be visible together. For example, "Manufactured by ABC Foods" is valid evidence. A standalone company name or brand name is NOT sufficient evidence.

27. If text is too small, blurry, cropped, folded, hidden, or unreadable, return null rather than reconstructing or guessing the text.
Output ONLY valid JSON matching this exact structure:
{
  "product_name": null,
  "brand_name": null,
  "generic_name": null,
  "category": "Food | Cosmetics | Household | Electronics | Other",
  "manufacturer": {
    "role": null,
    "name": null,
    "address": null
  },
  "quantity": {
    "value": null,
    "unit": null,
    "raw_text": null
  },
  "mrp": {
    "value": null,
    "currency": "INR",
    "inclusive_of_taxes": null,
    "raw_text": null
  },
  "dates": {
    "manufacture_date": null,
    "packing_date": null,
    "best_before": null,
    "use_by": null
  },
  "consumer_care": {
    "phone": null,
    "email": null,
    "address": null
  },
  "country_of_origin": null,
  "package_type": "normal",
  "raw_evidence": [
    {"field": "mrp", "value": "80", "evidence": "MRP Rs. 80.00 (Incl. of all taxes)"}
  ]
}
"""

EXTRACTION_SYSTEM_PROMPT = """You are a forensic packaged-commodity label auditor. Analyze the supplied image conservatively and return ONLY the JSON object defined below.

This task has two strictly separate tracks:

TRACK A — IMAGE EVIDENCE
1. Read only text and visual features that are actually visible and readable in the supplied image. Never fill a missing field from what a normal package would usually contain.
2. Scan the complete image: front, back, side panels, top, bottom, seams, corners, batch/date blocks, and fine print. Classify the visible surface as FRONT, BACK, SIDE, TOP, BOTTOM, MULTI_PANEL, or UNKNOWN.
3. Preserve the distinction between brand name, commercial product name, generic commodity name, manufacturer/packer/importer, marketer, consumer-care contact, and country of origin.
4. A manufacturer address is valid only when the entity relationship and address are visibly connected to wording such as Manufactured by, Packed by, Imported by, or equivalent. Never infer the manufacturer from a logo, brand, barcode, phone number, website, or a standalone address.
5. Country of origin is valid only when explicitly printed on the package (for example Made in, Product of, or Country of Origin). Never infer it from an address, domain, phone number, company name, barcode, or web search.
6. MRP and manufacture/packing date are mandatory checks. If MRP, manufacture date, or packing date is not visible, return null and let the rule engine flag it. Do not use a public web price or a guessed current date to fill it. If this is only the front panel, set needs_more_images=true rather than pretending the back panel was checked.
7. Every raw_evidence item must be the smallest exact, verbatim, visible quote that supports its field. Web text is NEVER valid raw_evidence.

TRACK B — PUBLIC WEB CROSS-CHECK
8. When a brand, product, manufacturer, importer, or distinctive package identity is visible, you MUST use the enabled Google Search grounding tool to search for public references. Prefer the official manufacturer/brand site, official product catalogue, regulator/registrar pages, and then reputable retailers. Search the exact visible names and the exact manufacturer/address combination.
9. Compare the image with public references for product identity: brand, product name, generic type, pack design, logo, package colour/layout, quantity, manufacturer, address, and other distinctive declarations. If the uploaded image conflicts with the strongest public references, report MISMATCH. If no trustworthy reference is found, report UNVERIFIED. A MATCH means only that the visible identity is consistent with public references; it is NOT proof that the physical product is genuine.
10. If only a front image is supplied, look for official product images or product pages and compare the visible front. Do not claim to have verified hidden back-panel declarations or exact batch/date/MRP values from the web. Set needs_more_images=true when the visible surface is insufficient.
11. Use web sources to cross-check an address or company identity, but do not convert an address lookup into a country-of-origin declaration. Web evidence belongs only in web_verification, with source URLs and the claim checked.
12. If search grounding is unavailable, the key is invalid, or sources are weak, return UNVERIFIED and never report the product as real, genuine, authentic, or verified.
12A. Set web_verification.confidence as a number from 0.0 to 1.0 and keep it low when only a front image or weak reference is available.

ANTI-HALLUCINATION AND DECISION RULES
13. Do not use the words real, genuine, authentic, or verified for product identity. Use only MATCH, MISMATCH, UNVERIFIED, NOT_APPLICABLE, or NOT_RUN.
14. Do not treat a clear-looking image as proof of authenticity. Counterfeit screening is a risk signal, not a certificate.
15. If any visible value conflicts internally (for example two different MRP values, dates, quantities, or names), preserve both in evidence where possible and mark the relevant web/identity check UNVERIFIED or MISMATCH.
16. If a field is not visible, return null. If a declaration is visible but unreadable, return null and explain the limitation in web_verification.summary or the relevant field check.

Return exactly this shape. Do not add prose outside JSON:
{
  "product_name": null,
  "brand_name": null,
  "generic_name": null,
  "category": "Food | Cosmetics | Household | Electronics | Other",
  "manufacturer": {"role": null, "name": null, "address": null},
  "quantity": {"value": null, "unit": null, "raw_text": null},
  "mrp": {"value": null, "currency": "INR", "inclusive_of_taxes": null, "raw_text": null},
  "dates": {"manufacture_date": null, "packing_date": null, "best_before": null, "use_by": null},
  "consumer_care": {"phone": null, "email": null, "address": null},
  "country_of_origin": null,
  "package_type": "normal",
  "date_applicability": "REQUIRED | NOT_REQUIRED | UNKNOWN",
  "import_status": "IMPORTED | DOMESTIC | UNKNOWN",
  "web_verification": {
    "image_view": "FRONT | BACK | SIDE | TOP | BOTTOM | MULTI_PANEL | UNKNOWN",
    "search_performed": false,
    "identity_status": "MATCH | MISMATCH | UNVERIFIED | NOT_APPLICABLE | NOT_RUN",
    "confidence": 0.0,
    "needs_more_images": false,
    "summary": "",
    "searched_queries": [],
    "sources": [{"title": "", "url": "", "source_type": "OFFICIAL | REGULATOR | RETAILER | OTHER", "checked_claim": ""}],
    "field_checks": [{"field": "product_identity | manufacturer_address | country_consistency | quantity | package_design", "status": "MATCH | MISMATCH | UNVERIFIED", "observed_value": "", "web_value": "", "reason": "", "sources": []}]
  },
  "raw_evidence": [{"field": "", "value": null, "evidence": ""}]
}
"""


PRIMARY_GEMINI_MODEL = "gemini-3.1-flash-lite"
CANDIDATE_GEMINI_MODELS = [
    # Current flash aliases are fallbacks when the higher-quality Pro model
    # is rate-limited or temporarily unavailable for the user's project.
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
]


class AIService:
    """Service to interact with Gemini Vision for structured label extraction."""

    def __init__(self):
        self._load_env()
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model_name = os.getenv("GEMINI_MODEL", PRIMARY_GEMINI_MODEL)
        self._client = None
        self.last_call_metadata: Dict[str, Any] = {
            "provider": "Google Gemini",
            "model": self.model_name,
            "web_grounding_used": False,
            "search_queries": [],
            "sources": [],
        }

    def _load_env(self):
        """Ensure environment variables are loaded from available .env files."""
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(backend_dir)
        for p in [
            os.path.join(backend_dir, ".env"),
            os.path.join(backend_dir, ".env.txt"),
            os.path.join(root_dir, ".env"),
            os.path.join(root_dir, ".env.txt"),
            ".env",
            ".env.txt",
        ]:
            if os.path.exists(p):
                from dotenv import load_dotenv
                load_dotenv(p, override=False)

    def _get_client(self):
        self._load_env()
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")
        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except ImportError:
                raise RuntimeError("google-genai package is not installed. Please install with 'pip install google-genai'.")
        return self._client

    def is_configured(self) -> bool:
        self._load_env()
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        return bool(self.api_key and self.api_key != "your_gemini_api_key_here")

    @staticmethod
    def _parse_json_response(response_text: str) -> Dict[str, Any]:
        """Parse strict JSON while tolerating an accidental markdown wrapper."""
        cleaned = (response_text or "").strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            # Some models add a short sentence despite the JSON-only instruction.
            # Recover only the outermost object; never invent missing fields.
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start < 0 or end <= start:
                raise
            parsed = json.loads(cleaned[start:end + 1])

        if not isinstance(parsed, dict):
            raise ValueError("Gemini returned a JSON value instead of an object.")
        return parsed

    @staticmethod
    def _normalise_grounding(candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Gemini grounding metadata into auditable source records."""
        metadata = candidate.get("groundingMetadata") or candidate.get("grounding_metadata") or {}
        queries = metadata.get("webSearchQueries") or metadata.get("web_search_queries") or []
        chunks = metadata.get("groundingChunks") or metadata.get("grounding_chunks") or []
        sources: List[Dict[str, Any]] = []
        for chunk in chunks:
            web = chunk.get("web") if isinstance(chunk, dict) else None
            if not isinstance(web, dict):
                continue
            uri = web.get("uri") or web.get("url")
            title = web.get("title")
            if uri:
                sources.append({
                    "title": title or uri,
                    "url": uri,
                    "source_type": "OTHER",
                    "checked_claim": None,
                })
        return {
            "search_performed": bool(queries or sources),
            "search_queries": [str(q) for q in queries if q],
            "sources": sources,
        }

    @staticmethod
    def _safe_confidence(value: Any) -> float:
        try:
            return max(0.0, min(float(value), 1.0))
        except (TypeError, ValueError):
            return 0.0

    @staticmethod
    def _sanitise_field_checks(
        field_checks: Any,
        grounded_urls: set[str],
    ) -> List[Dict[str, Any]]:
        """Keep only schema-safe field checks backed by grounded URLs."""
        if not isinstance(field_checks, list):
            return []
        allowed_statuses = {"MATCH", "MISMATCH", "UNVERIFIED"}
        safe_checks: List[Dict[str, Any]] = []
        for check in field_checks:
            if not isinstance(check, dict) or not check.get("field"):
                continue
            safe_sources = []
            for source in check.get("sources") or []:
                if not isinstance(source, dict) or source.get("url") not in grounded_urls:
                    continue
                safe_sources.append({
                    "title": source.get("title") or source.get("url"),
                    "url": source.get("url"),
                    "source_type": source.get("source_type") or "OTHER",
                    "checked_claim": source.get("checked_claim"),
                })
            safe_checks.append({
                "field": str(check.get("field")),
                "status": str(check.get("status") or "UNVERIFIED").upper()
                if str(check.get("status") or "UNVERIFIED").upper() in allowed_statuses
                else "UNVERIFIED",
                "observed_value": check.get("observed_value"),
                "web_value": check.get("web_value"),
                "reason": str(check.get("reason") or ""),
                "sources": safe_sources,
            })
        return safe_checks

    def extract_product_data(self, image: Image.Image, category_hint: Optional[str] = None) -> ProductData:
        """Call Gemini to extract structured label information from the package image."""
        self._load_env()
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not configured.")

        user_prompt = (
            "Extract all packaged commodity declarations from this label image "
            "and perform the required conservative public-web cross-check. "
            "Use Google Search grounding for identity and company/address lookups."
        )
        if category_hint and category_hint.lower() != "auto detect":
            user_prompt += f" User indicated declared category is '{category_hint}'."

        combined_prompt = f"{EXTRACTION_SYSTEM_PROMPT}\n\n{user_prompt}"

        # Convert PIL image to base64 JPEG
        import base64
        import io
        import urllib.request
        import urllib.error

        try:
            if image.mode in ("RGBA", "P"):
                rgb_img = image.convert("RGB")
            else:
                rgb_img = image
            buf = io.BytesIO()
            rgb_img.save(buf, format="JPEG", quality=90)
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            mime_type = "image/jpeg"
        except Exception as img_err:
            print(f"[AI Service] PIL image conversion note: {img_err}")
            buf = io.BytesIO()
            image.save(buf, format="JPEG")
            img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
            mime_type = "image/jpeg"

        last_error = None
        quota_error_seen = False
        models_to_try = [self.model_name] + [m for m in CANDIDATE_GEMINI_MODELS if m != self.model_name]
        attempts = [(model, True) for model in models_to_try]
        attempt_index = 0

        # 1. Direct REST API with Google Search grounding. The API key is sent
        # in a header instead of a URL query string so it is not copied into
        # proxy/access logs.
        while attempt_index < len(attempts):
            model, use_grounding = attempts[attempt_index]
            attempt_index += 1
            attempt_prompt = combined_prompt
            if not use_grounding:
                attempt_prompt += (
                    "\n\nSEARCH FALLBACK: Google Search grounding is unavailable for this request. "
                    "Do not claim that a web search was performed, do not invent sources, "
                    "and set web_verification.identity_status to UNVERIFIED."
                )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": img_b64,
                                }
                            },
                            {"text": attempt_prompt},
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.0,
                    "responseMimeType": "application/json",
                },
            }
            if use_grounding:
                payload["tools"] = [{"google_search": {}}]

            try:
                print(f"[AI Service] Initiating Gemini Vision API call using model: {model}")
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Content-Type": "application/json",
                        "x-goog-api-key": api_key,
                    },
                )
                # urllib automatically honors HTTP(S)_PROXY/ALL_PROXY. Some
                # local environments expose a dead proxy (for example
                # 127.0.0.1:9), which makes an otherwise reachable Gemini API
                # fail with WinError 10061. Use a direct connection by default;
                # callers that genuinely require a proxy can opt in with
                # GEMINI_PROXY_URL.
                proxy_url = os.getenv("GEMINI_PROXY_URL", "").strip()
                if proxy_url:
                    opener = urllib.request.build_opener(
                        urllib.request.ProxyHandler({
                            "http": proxy_url,
                            "https": proxy_url,
                        })
                    )
                else:
                    opener = urllib.request.build_opener(
                        urllib.request.ProxyHandler({})
                    )
                with opener.open(req, timeout=20) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError(f"No candidates returned by model {model}")

                    parts = candidates[0].get("content", {}).get("parts", [])
                    if not parts:
                        raise ValueError(f"No content parts in response from {model}")

                    response_text = "\n".join(
                        part.get("text", "")
                        for part in parts
                        if isinstance(part, dict) and part.get("text")
                    ).strip()
                    raw_json = self._parse_json_response(response_text)

                    grounding = self._normalise_grounding(candidates[0])
                    model_web_verification = raw_json.get("web_verification")
                    if not isinstance(model_web_verification, dict):
                        model_web_verification = {}

                    # Only the API's grounding metadata is trusted as proof that
                    # search happened. URLs typed by the model are not evidence.
                    allowed_identity_statuses = {
                        "MATCH", "MISMATCH", "UNVERIFIED", "NOT_APPLICABLE", "NOT_RUN"
                    }
                    identity_status = str(
                        model_web_verification.get("identity_status") or "UNVERIFIED"
                    ).upper()
                    if identity_status not in allowed_identity_statuses:
                        identity_status = "UNVERIFIED"
                    grounded_urls = {
                        source.get("url")
                        for source in grounding["sources"]
                        if source.get("url")
                    }
                    web_verification = {
                        "image_view": str(
                            model_web_verification.get("image_view") or "UNKNOWN"
                        ).upper(),
                        "search_performed": bool(grounding["search_performed"]),
                        "identity_status": identity_status,
                        "confidence": self._safe_confidence(
                            model_web_verification.get("confidence")
                        ),
                        "needs_more_images": bool(
                            model_web_verification.get("needs_more_images")
                        ),
                        "summary": str(model_web_verification.get("summary") or ""),
                        "searched_queries": grounding["search_queries"],
                        "sources": grounding["sources"],
                        "field_checks": self._sanitise_field_checks(
                            model_web_verification.get("field_checks"),
                            grounded_urls,
                        ),
                    }
                    if not web_verification["search_performed"] or not web_verification["sources"]:
                        web_verification["identity_status"] = "UNVERIFIED"
                    raw_json["web_verification"] = web_verification

                    # Override/enrich category
                    if category_hint and category_hint.lower() != "auto detect":
                        if not raw_json.get("category"):
                            raw_json["category"] = category_hint

                    # Ensure string types for quantity & mrp value
                    if isinstance(raw_json.get("quantity"), dict) and "value" in raw_json["quantity"]:
                        if raw_json["quantity"]["value"] is not None:
                            raw_json["quantity"]["value"] = str(raw_json["quantity"]["value"])
                    if isinstance(raw_json.get("mrp"), dict) and "value" in raw_json["mrp"]:
                        if raw_json["mrp"]["value"] is not None:
                            raw_json["mrp"]["value"] = str(raw_json["mrp"]["value"])

                    product_data = ProductData(**raw_json)
                    self.last_call_metadata = {
                        "provider": "Google Gemini",
                        "model": model,
                        "web_grounding_used": bool(grounding["search_performed"]),
                        "search_queries": grounding["search_queries"],
                        "sources": grounding["sources"],
                    }
                    print(f"[AI Service] Successfully extracted product data using model '{model}'.")
                    return product_data

            except urllib.error.HTTPError as http_err:
                error_body = http_err.read().decode("utf-8", errors="replace")
                if "API_KEY_INVALID" in error_body or "API key not valid" in error_body:
                    last_error = (
                        "Gemini rejected GEMINI_API_KEY (API_KEY_INVALID). "
                        "Replace backend/.env with a valid Google AI Studio key."
                    )
                else:
                    last_error = f"HTTP {http_err.code} on {model}: {error_body[:200]}"
                print(f"[AI Service] Model '{model}' returned HTTP error: {last_error}")
                if http_err.code == 429:
                    quota_error_seen = True
                    if use_grounding:
                        # Search grounding can have a separate quota from
                        # ordinary multimodal generation. Preserve image
                        # extraction, but fail closed on the web result.
                        attempts.insert(attempt_index, (model, False))
                        continue
                if (
                    http_err.code in (401, 403)
                    or "API_KEY_INVALID" in error_body
                    or "API key not valid" in error_body
                ):
                    # Trying other models cannot repair an invalid credential
                    # and only wastes quota/time.
                    break
                continue
            except urllib.error.URLError as url_err:
                last_error = (
                    "Cannot reach the Gemini API from the backend. "
                    "Check the server's network/proxy settings. "
                    f"({url_err.reason})"
                )
                print(f"[AI Service] Model '{model}' network call failed: {last_error}")
                # A network failure affects every model; retrying aliases only
                # makes the user wait and produces a noisy error.
                break
            except Exception as e:
                last_error = f"Error on {model}: {str(e)}"
                print(f"[AI Service] Model '{model}' call failed: {last_error}")
                continue

        if quota_error_seen:
            last_error = (
                "Gemini quota exhausted for the configured project. "
                "Enable billing/increase quota or wait for the quota window to reset."
            )
        logger.error(f"All Gemini extraction model attempts failed: {last_error}")
        self.last_call_metadata = {
            "provider": "Google Gemini",
            "model": self.model_name,
            "web_grounding_used": False,
            "search_queries": [],
            "sources": [],
            "error": str(last_error),
        }
        raise ValueError(f"AI label extraction failed across models {models_to_try}: {str(last_error)}")

    def compare_repeated_extractions(
        self,
        image: Image.Image,
        category_hint: Optional[str] = None,
    ):
        """Run two independent extractions and measure core-field agreement."""
        first = self.extract_product_data(image.copy(), category_hint)
        first_meta = dict(self.last_call_metadata)
        second = self.extract_product_data(image.copy(), category_hint)
        second_meta = dict(self.last_call_metadata)

        def value_at(product: ProductData, path: str):
            value: Any = product
            for part in path.split("."):
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = getattr(value, part, None)
                if value is None:
                    return None
            if isinstance(value, str):
                return " ".join(value.lower().split())
            return value

        fields = [
            "product_name",
            "brand_name",
            "generic_name",
            "category",
            "manufacturer.role",
            "manufacturer.name",
            "manufacturer.address",
            "quantity.value",
            "quantity.unit",
            "mrp.value",
            "mrp.inclusive_of_taxes",
            "dates.manufacture_date",
            "dates.packing_date",
            "dates.best_before",
            "dates.use_by",
            "country_of_origin",
            "web_verification.identity_status",
        ]
        differing_fields = [
            field for field in fields
            if value_at(first, field) != value_at(second, field)
        ]
        if first_meta.get("model") != second_meta.get("model"):
            differing_fields.append("model")
        agreement_score = round(
            ((len(fields) - len(differing_fields)) / len(fields)) * 100,
            2,
        )
        consistency = AIConsistencyInfo(
            # A single changed identity, quantity, date, or web status is
            # material for an inspection. The score remains useful context,
            # but it must not hide a disagreement behind a 90% threshold.
            status="CONSISTENT" if not differing_fields else "INCONSISTENT",
            agreement_score=agreement_score,
            differing_fields=differing_fields,
            note=(
                "Repeated extraction agrees on the core fields."
                if not differing_fields
                else "The two runs used different models because the preferred model was temporarily unavailable or rate-limited; same-model consistency could not be established."
                if differing_fields == ["model"]
                else "Repeated extraction disagrees on core fields; manual review is required."
            ),
        )
        return first, second, consistency, first_meta, second_meta


ai_service = AIService()
