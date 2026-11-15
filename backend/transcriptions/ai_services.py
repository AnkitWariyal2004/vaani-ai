import os
import json
import requests
from typing import List, Dict, Any, Optional

DEFAULT_FREE_MODEL = "google/gemini-2.0-flash-exp:free"
FALLBACK_FREE_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "deepseek/deepseek-r1:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
]

class OpenRouterService:
    """
    Zero-Cost AI Engine powered by OpenRouter Free Tier Models:
    - google/gemini-2.0-flash-exp:free
    - meta-llama/llama-3.3-70b-instruct:free
    - qwen/qwen-2.5-72b-instruct:free
    - deepseek/deepseek-r1:free
    """

    API_URL = "https://openrouter.ai/api/v1/chat/completions"

    @classmethod
    def get_api_key(cls, provided_key: Optional[str] = None) -> str:
        key = provided_key or os.environ.get("OPENROUTER_API_KEY", "")
        return key.strip()

    @classmethod
    def call_openrouter(
        cls,
        messages: List[Dict[str, str]],
        model: str = DEFAULT_FREE_MODEL,
        api_key: Optional[str] = None,
        response_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        resolved_key = cls.get_api_key(api_key)
        if not resolved_key:
            raise ValueError(
                "OpenRouter API Key not provided. Please provide your free OpenRouter API key from openrouter.ai/keys."
            )

        headers = {
            "Authorization": f"Bearer {resolved_key}",
            "HTTP-Referer": "https://frontend-kappa-gray-54.vercel.app",
            "X-Title": "VAANI AI Multilingual Studio",
            "Content-Type": "application/json",
        }

        # Try primary free model and fallback if rate limited
        models_to_try = [model] + [m for m in FALLBACK_FREE_MODELS if m != model]
        last_error = None

        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.3,
            }
            if response_format == "json":
                payload["response_format"] = {"type": "json_object"}

            try:
                response = requests.post(cls.API_URL, headers=headers, json=payload, timeout=45)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return {"content": content, "model_used": model_name}
                elif response.status_code in (429, 503):
                    # Rate limit or temporary free quota overload on this specific model, try next free model
                    last_error = f"Model {model_name} busy (Status {response.status_code})."
                    continue
                else:
                    err_msg = response.text
                    try:
                        err_json = response.json()
                        err_msg = err_json.get("error", {}).get("message", err_msg)
                    except Exception:
                        pass
                    raise RuntimeError(f"OpenRouter Error ({response.status_code}): {err_msg}")
            except requests.RequestException as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"All free OpenRouter models failed. Last error: {last_error}")

    @classmethod
    def polish_and_punctuate(
        cls,
        segments: List[Dict[str, Any]],
        language: str = "hi",
        api_key: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Refines transcript segments: fixes grammar, Devanagari spelling, and proper punctuation
        without altering timing boundaries.
        """
        system_prompt = (
            "You are an expert multilingual subtitle editor specializing in Indian languages (Hindi Devanagari, "
            "Gujarati, Bengali, Punjabi, English). You receive an array of timestamped subtitle segments.\n"
            "Your task:\n"
            "1. Fix grammar, spelling errors, and homophones.\n"
            "2. Add proper punctuation (commas, periods/purna viram |, question marks).\n"
            "3. If Hindi, retain authentic Devanagari script (हिन्दी).\n"
            "4. NEVER alter or remove start_time or end_time.\n"
            "5. Return strictly a JSON object: {\"segments\": [{\"segment_index\": 0, \"text\": \"...\"}, ...]}"
        )

        user_content = json.dumps([
            {"segment_index": s.get("segment_index", i), "text": s.get("text", "")}
            for i, s in enumerate(segments)
        ], ensure_ascii=False)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Language: {language}\nSegments to polish:\n{user_content}"},
        ]

        result = cls.call_openrouter(messages, api_key=api_key, response_format="json")
        try:
            parsed = json.loads(result["content"])
            polished_map = {item["segment_index"]: item["text"] for item in parsed.get("segments", [])}
            
            output = []
            for i, seg in enumerate(segments):
                idx = seg.get("segment_index", i)
                updated_text = polished_map.get(idx, seg.get("text", ""))
                output.append({
                    **seg,
                    "text": updated_text,
                })
            return output
        except Exception:
            return segments

    @classmethod
    def translate_segments(
        cls,
        segments: List[Dict[str, Any]],
        target_language: str = "en",
        api_key: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Translates subtitle segments into target language while maintaining synchronization.
        """
        system_prompt = (
            f"You are a professional film subtitle translator. Translate the given subtitle segments into '{target_language}'.\n"
            "Rules:\n"
            "1. Preserve original emotional tone and idiomatic nuance.\n"
            "2. Keep the translations concise so they fit subtitle screen length.\n"
            "3. Maintain exact segment indices.\n"
            "4. Return strictly JSON: {\"translated\": [{\"segment_index\": 0, \"text\": \"...\"}, ...]}"
        )

        user_content = json.dumps([
            {"segment_index": s.get("segment_index", i), "text": s.get("text", "")}
            for i, s in enumerate(segments)
        ], ensure_ascii=False)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Target Language: {target_language}\nSegments:\n{user_content}"},
        ]

        result = cls.call_openrouter(messages, api_key=api_key, response_format="json")
        try:
            parsed = json.loads(result["content"])
            trans_map = {item["segment_index"]: item["text"] for item in parsed.get("translated", [])}
            
            output = []
            for i, seg in enumerate(segments):
                idx = seg.get("segment_index", i)
                translated_text = trans_map.get(idx, seg.get("text", ""))
                output.append({
                    **seg,
                    "text": translated_text,
                })
            return output
        except Exception:
            return segments

    @classmethod
    def generate_summary(
        cls,
        full_text: str,
        language: str = "auto",
        api_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates executive summary, key takeaways, and action points.
        """
        system_prompt = (
            "You are an AI research assistant. Given a video transcript, generate a structured summary.\n"
            "Return strictly a JSON object with this schema:\n"
            "{\n"
            "  \"title\": \"Catchy title of the video content\",\n"
            "  \"overview\": \"2-3 sentence executive summary\",\n"
            "  \"key_takeaways\": [\"point 1\", \"point 2\", \"point 3\"],\n"
            "  \"topics\": [\"topic 1\", \"topic 2\"],\n"
            "  \"sentiment\": \"Inspirational / Educational / Informative / etc.\"\n"
            "}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Transcript:\n{full_text}"},
        ]

        result = cls.call_openrouter(messages, api_key=api_key, response_format="json")
        try:
            parsed = json.loads(result["content"])
            parsed["model_used"] = result.get("model_used", DEFAULT_FREE_MODEL)
            return parsed
        except Exception:
            return {
                "title": "Transcript Summary",
                "overview": result.get("content", ""),
                "key_takeaways": [],
                "topics": [],
                "model_used": result.get("model_used", DEFAULT_FREE_MODEL),
            }
