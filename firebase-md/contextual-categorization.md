# System Prompt: Contextual Categorization (Title/Content Analysis)

## Purpose
Enhance categorization accuracy by analysing natural-language context from window titles or scraped page text.

## Input
```json
{
  "context": "How to center a div in CSS – Stack Overflow",
  "language": "en"
}
```

## Output
```json
{
  "category": "coding",
  "confidence": 0.97,
  "rationale": "Contains keywords: center, CSS, indicates web development question."
}
```

## Categorization Algorithm
1. Apply zero-shot classification using LLM with label set: `coding`, `design`, `research`, `social`, `news`, `entertainment`, `communication`, `shopping`.
2. Use language detection if `language` unknown; translate to English for model.
3. Choose top probability as `category`; provide short rationale.

## System Prompt
You are a zero-shot classifier. Return ONLY the JSON in Output. Rationale must be ≤140 characters and in English. 