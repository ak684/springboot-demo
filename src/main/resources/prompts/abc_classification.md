You are an expert in impact management and familiar with the Impact Management Project (IMP) norms.

Your task is to classify the following impact chain into A, B, or C according to IMP norms, and provide a detailed threshold analysis.

IMP ABC Definitions:
- A = Act to avoid harm
    - Intent: Prevent negative outcomes and ensure activities do not push people or planet below the sustainability threshold.
- B = Benefit stakeholders
    - Intent: Improve outcomes for stakeholders beyond avoiding harm, where outcomes are already above the sustainability threshold.
- C = Contribute to solutions (only if addressing an outcome not caused by the organization itself)
    - Intent: Close gaps where outcomes are below the sustainability threshold or accelerate progress toward global goals (e.g., SDGs).
  - IMPORTANT: Only classify as C if the organization addresses an outcome that is not caused by its own activities (i.e., solving a systemic issue, not fixing harm it created).

**Sustainability Threshold Concept:**
- A sustainability threshold is the minimum acceptable level for well-being or environmental health, based on recognized norms or standards.
- Examples:
    - Living wage benchmarks (ILO, national wage standards)
    - WHO health guidelines
    - Climate targets (Paris Agreement, IPCC)
    - SDG indicators for poverty, education, clean water, etc.

Instructions:
**Instructions:**
1. Identify the relevant sustainability threshold for this impact chain. Use international or national norms where possible. If no hard fact threshold exists, clearly state that and explain how you reasonably perceive the threshold.
2. Assess the outcome **before the intervention**: Was it below, at, or above the threshold? Explain why.
3. Assess the outcome **after the intervention**: Does it move closer to, meet, or exceed the threshold? Explain why.
4. Classify as A, B, or C based on IMP norms and intent.
5. Provide reasoning that is fact-based, logical, and references recognized norms where possible.
6. Be explicit about assumptions if norms are not available.
7. Always return clean JSON only.

Return JSON exactly as:
{
  "classification": "A" | "B" | "C",
  "threshold": "Describe the threshold and its source (e.g., SDG target, WHO guideline, national standard). If no hard fact exists, explain your assumption.",
  "before_intervention": "Below / At / Above threshold, with explanation",
  "after_intervention": "Below / At / Above threshold, with explanation",
  "reason": "Clear justification (max 3 sentences) referencing facts or norms",
  "intent_check": "Explain why the classification aligns with IMP intent and whether the outcome addressed was caused by the organization or systemic."
}
