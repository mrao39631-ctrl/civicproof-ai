import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from backend.app.config import GEMINI_API_KEY

logger = logging.getLogger("civicproof.ai")

VERIFICATION_DISCLAIMER = (
    "AI verification provides automated observational analysis comparing visual evidence. "
    "It does not guarantee structural integrity, subsurface completion, or long-term durability. "
    "Citizen confirmation and official human oversight remain the final authority."
)

VERIFICATION_PROMPT = """
You are CivicProof AI, an independent, objective visual verification auditor for civic complaints (potholes, garbage, water leaks, streetlights, public infrastructure).
You are comparing two images:
IMAGE 1: The original BEFORE photo submitted by a citizen reporting a civic defect.
IMAGE 2: The AFTER photo submitted by the municipal contractor / repair team claiming the issue has been resolved.

Carefully inspect both images and evaluate:
1. Location Match: Do both photos appear to show the exact same physical scene, road angle, wall, curbing, background buildings, or pavement?
2. Landmarks Match: Are key reference objects (poles, trees, manhole covers, painted lines, building corners) consistent between both photos?
3. Problem Visibility: Is the reported defect (e.g., garbage pile, asphalt pothole crater, gushing water pipe) still visible in the AFTER photo?
4. Repair Completeness: Does the repair appear properly finished (e.g., asphalt flush and compacted, waste entirely cleared, pipe sealed), or does it look temporary/partial/incomplete?
5. Image Clarity: Are both photos sufficiently clear, well-lit, and in focus to make a confident determination?

Decide strictly on ONE of these three verdicts:
- "VERIFIED_FIXED": High confidence that the defect in Image 1 is resolved in Image 2 at the same location.
- "NOT_VERIFIED": The problem is still clearly visible, the work is obviously incomplete/substandard, or the photos clearly show two completely different locations.
- "INSUFFICIENT_EVIDENCE": Image 2 is too blurry, dark, zoomed in too close to establish context, obstructed, or lacking sufficient background landmarks to confirm location.

You MUST respond strictly with valid JSON conforming to this schema (no extra formatting or markdown outside JSON):
{
  "verdict": "VERIFIED_FIXED" | "NOT_VERIFIED" | "INSUFFICIENT_EVIDENCE",
  "confidence_score": <float between 0.0 and 100.0>,
  "location_match": <boolean true/false>,
  "landmarks_match": <boolean true/false>,
  "problem_still_visible": <boolean true/false>,
  "repair_complete": <boolean true/false>,
  "image_clarity_sufficient": <boolean true/false>,
  "explanation": "<2-4 sentences explaining the reasoning behind the verdict>",
  "evidence_comparison": "<detailed breakdown comparing specific elements in BEFORE vs AFTER: landmark alignment, surface state, cleanup perimeter>",
  "human_review_recommended": <boolean true/false - true if verdict is NOT_VERIFIED, INSUFFICIENT_EVIDENCE, or confidence < 80>
}
"""

def analyze_complaint_evidence(
    before_image_path: str,
    after_image_path: str,
    complaint_title: str,
    complaint_category: str,
    repair_notes: str = ""
) -> Dict[str, Any]:
    """
    Compares BEFORE and AFTER images using Google Gemini Multimodal API.
    If GEMINI_API_KEY is not configured or an error occurs, falls back to clearly labeled DEMO MODE.
    """
    # Check if Gemini API Key is available
    if not GEMINI_API_KEY:
        logger.info("No GEMINI_API_KEY configured. Executing clearly labeled DEMO MODE.")
        return _generate_demo_mode_result(
            before_image_path=before_image_path,
            after_image_path=after_image_path,
            complaint_title=complaint_title,
            complaint_category=complaint_category,
            repair_notes=repair_notes,
            reason="DEMO MODE (Simulated Analysis): No GEMINI_API_KEY set in backend/.env"
        )
    
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)

        # Read binary files
        with open(before_image_path, "rb") as f:
            before_bytes = f.read()
        with open(after_image_path, "rb") as f:
            after_bytes = f.read()

        # Determine MIME types
        def get_mime(path_str):
            lower = path_str.lower()
            if lower.endswith(".png"):
                return "image/png"
            if lower.endswith(".webp"):
                return "image/webp"
            return "image/jpeg"

        before_part = types.Part.from_bytes(data=before_bytes, mime_type=get_mime(before_image_path))
        after_part = types.Part.from_bytes(data=after_bytes, mime_type=get_mime(after_image_path))

        context_prompt = (
            f"{VERIFICATION_PROMPT}\n\n"
            f"Complaint Category: {complaint_category}\n"
            f"Complaint Title: {complaint_title}\n"
            f"Contractor Repair Notes: {repair_notes or 'Not provided'}\n\n"
            f"Please analyze Image 1 (BEFORE) and Image 2 (AFTER) now."
        )

        # Call Gemini multimodal model
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[context_prompt, before_part, after_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        response_text = response.text or "{}"
        parsed = json.loads(response_text)

        # Validate required fields
        verdict = parsed.get("verdict", "INSUFFICIENT_EVIDENCE")
        if verdict not in ["VERIFIED_FIXED", "NOT_VERIFIED", "INSUFFICIENT_EVIDENCE"]:
            verdict = "INSUFFICIENT_EVIDENCE"

        return {
            "verdict": verdict,
            "confidence_score": float(parsed.get("confidence_score", 85.0)),
            "location_match": bool(parsed.get("location_match", True)),
            "landmarks_match": bool(parsed.get("landmarks_match", True)),
            "problem_still_visible": bool(parsed.get("problem_still_visible", False)),
            "repair_complete": bool(parsed.get("repair_complete", True)),
            "image_clarity_sufficient": bool(parsed.get("image_clarity_sufficient", True)),
            "explanation": str(parsed.get("explanation", "Gemini multimodal verification concluded.")),
            "evidence_comparison": str(parsed.get("evidence_comparison", "Visual comparison of BEFORE and AFTER landmarks and surface conditions completed.")),
            "human_review_recommended": bool(parsed.get("human_review_recommended", verdict != "VERIFIED_FIXED")),
            "raw_response": response_text,
            "is_demo_mode": False,
            "disclaimer": VERIFICATION_DISCLAIMER
        }

    except Exception as exc:
        logger.warning(f"Gemini API verification failed or fell back: {exc}. Falling back to clearly labeled DEMO MODE.")
        return _generate_demo_mode_result(
            before_image_path=before_image_path,
            after_image_path=after_image_path,
            complaint_title=complaint_title,
            complaint_category=complaint_category,
            repair_notes=repair_notes,
            reason=f"DEMO MODE (Simulated Analysis): Live API returned '{type(exc).__name__}'. Using realistic heuristic engine."
        )

def _generate_demo_mode_result(
    before_image_path: str,
    after_image_path: str,
    complaint_title: str,
    complaint_category: str,
    repair_notes: str = "",
    reason: str = "DEMO MODE (Simulated Analysis)"
) -> Dict[str, Any]:
    """
    Provides an intelligent, realistic, and clearly labeled simulated verification result for hackathon demonstrations.
    NEVER claims to be actual live AI without explicit labeling.
    """
    title_lower = (complaint_title + " " + repair_notes).lower()
    cat_lower = complaint_category.lower()

    # Intelligent heuristics for demo datasets:
    # 1. Potholes with partial/incomplete keywords or specific demo case
    if "incomplete" in title_lower or "partial" in title_lower or "unpaved" in title_lower or "hazard" in title_lower and "pothole" in title_lower and "patch" not in title_lower:
        verdict = "NOT_VERIFIED"
        confidence = 88.5
        loc_match = True
        landmarks_match = True
        prob_visible = True
        repair_comp = False
        clarity = True
        explanation = (
            "[DEMO SIMULATION] While background curb lines and adjacent sidewalk match the reported location, "
            "the asphalt patch appears sunken and significant perimeter cracking remains unresolved. "
            "The hazardous road surface has not been brought to municipal flush grade."
        )
        comparison = (
            "BEFORE: Deep asphalt depression (~14 inches diameter) with loose aggregate.\n"
            "AFTER: Cold-mix filler applied unevenly without proper compaction; edge fissures still open to water infiltration."
        )
        human_review = True

    # 2. Insufficient clarity / blurry demo
    elif "blur" in title_lower or "night" in title_lower or "unclear" in title_lower or "dark" in title_lower:
        verdict = "INSUFFICIENT_EVIDENCE"
        confidence = 52.0
        loc_match = False
        landmarks_match = False
        prob_visible = False
        repair_comp = False
        clarity = False
        explanation = (
            "[DEMO SIMULATION] The submitted AFTER image lacks adequate lighting and distinctive physical landmarks "
            "to establish geometric correlation with the original incident location. Image resolution or angle is insufficient."
        )
        comparison = (
            "BEFORE: Clear daylight image with distinct store awning and utility pole.\n"
            "AFTER: Low-light, high-ISO image tightly framed on pavement with no visible surrounding landmarks."
        )
        human_review = True

    # 3. Standard successful repair (e.g. Garbage cleared, water leak fixed, streetlight restored)
    else:
        verdict = "VERIFIED_FIXED"
        confidence = 94.2
        loc_match = True
        landmarks_match = True
        prob_visible = False
        repair_comp = True
        clarity = True
        explanation = (
            "[DEMO SIMULATION] Both images verify the identical municipal coordinates via matched reference landmarks. "
            f"The reported {complaint_category.lower()} issue is no longer detected, and the surrounding zone is restored."
        )
        comparison = (
            f"BEFORE: Severe {complaint_category.lower()} defect documented with visible obstruction.\n"
            "AFTER: Defect completely eliminated; surface swept/sanitized; adjacent curbs and infrastructure intact."
        )
        human_review = False

    return {
        "verdict": verdict,
        "confidence_score": confidence,
        "location_match": loc_match,
        "landmarks_match": landmarks_match,
        "problem_still_visible": prob_visible,
        "repair_complete": repair_comp,
        "image_clarity_sufficient": clarity,
        "explanation": explanation,
        "evidence_comparison": comparison,
        "human_review_recommended": human_review,
        "raw_response": json.dumps({"mode": "simulation", "note": reason}),
        "is_demo_mode": True,
        "disclaimer": f"{VERIFICATION_DISCLAIMER} (Note: {reason})"
    }
