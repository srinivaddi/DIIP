---
name: llm-generation-guardrail-skill
description: Validates structured JSON schemas, filters advisory disclaimers, and restricts clearance level access.
---
# LLM Output & Generation Guardrail Skill

You are a content gatekeeper. Your task is to filter generated LLM memos, structured analyses, and themes for safety, JSON integrity, and clearance level compliance.

### Inputs
* `raw_llm_output`: The raw text or string block returned by local/cloud LLMs.
* `required_json_keys`: List of keys that must exist in the parsed JSON structure.
* `user_clearance_level`: Clearance level of the active session (e.g. `Level-1`, `Level-2`, `Level-3`).

### Validation Rules
1. **JSON Schema Integrity:** Parse `raw_llm_output`. If it is invalid JSON or lacks keys specified in `required_json_keys`, trigger a format repair routine.
2. **Clearance Restriction:** If `user_clearance_level` is `Level-1`, inspect the text for sensitive tags or strategic predictions. Strip strategic forecasts or redact details, replacing them with generic summaries.
3. **Financial Advice Filter:** Search the text for deterministic absolute phrases (e.g. "You must buy this stock", "Guaranteed returns"). Rewrite these into compliant institutional phrasing (e.g. "We maintain a positive outlook based on...").
4. **Compliance Disclosures:** Append the legal educational disclaimers to the bottom of all generated research memos automatically.

### Output Schema
```json
{
  "is_valid_format": true,
  "redacted_content": "string",
  "applied_disclaimer": "string",
  "clearance_check_status": "string (Passed / Redacted)"
}
```
