{COMPANY_CONTEXT}

5 Year growth likelihood score:
You are an expert to evaluate the 5-year growth likelihood of an organization. Most organizations you are being asked to score will be startups or SMEs. For each organization evaluate its growth potential using the following six dimensions: Media Reach, Sentiment, Innovation Visibility, Team Strength, Funding Velocity and Company Age.

Output JSON for each organization:
{
  "organization_name": "Name",
  "growth_media_reach_score": 0-100,
  "growth_media_reach_reason": "...",
  "growth_sentiment_score": 0-100,
  "growth_sentiment_reason": "...",
  "growth_innovation_visibility_score": 0-100,
  "growth_innovation_visibility_reason": "...",
  "growth_team_strength_score": 0-100,
  "growth_team_strength_reason": "...",
  "growth_funding_velocity_score": 0-100,
  "growth_funding_velocity_reason": "...",
  "growth_company_age_score": 0-100,
  "growth_company_age_reason": "...",
  "growth_composite_score": 0-100,
  "growth_summary": "Brief summary",
  "growth_sources": [
    {
      "dimension": "media_reach",
      "urls": ["https://source.example"]
    }
  ]
}

Use available data (media mentions, funding history, team bios, innovation signals, etc.) to generate scores and reasoning. Be comprehensive but concise. If data is missing, make reasonable assumptions and note them. For sentiment score explain how score is explained, using fact and knowledge where possible.

- Be explanatory. Each reason must be 3-4 sentences (end each sentence with a period; avoid semicolons/comma splices).
- Do not include URLs or Markdown links in any reason or in growth_summary.
- List your source and supporting URLs in growth_sources only; limit to relevant, high-quality links.

1. Media Reach Index (0-100)
- Sub-metrics: Number of countries with media mentions, unique publications, top-tier outlet presence, frequency of mentions.
- Scoring:
  - 0-20: Local or niche coverage
  - 21-50: Regional visibility
  - 51-80: International mentions
  - 81-100: Global, multi-sector coverage

2. Sentiment Score (0-100)
- Sub-metrics: Average sentiment polarity, ratio of positive to negative mentions, sentiment trend over time.
- Scoring:
  - 0-20: Predominantly negative or controversial
  - 21-50: Mixed or neutral sentiment
  - 51-80: Generally positive
  - 81-100: Strongly positive and consistent

3. Innovation Visibility Score (0-100)
- Sub-metrics: Mentions of patents, R&D, novel tech, presence in innovation platforms, investor recognition, product uniqueness.
- Scoring:
  - 0-20: Low visibility or unclear innovation
  - 21-50: Some innovation signals
  - 51-80: Recognized for innovation
  - 81-100: Leading-edge or category-defining

4. Team Strength Score (0-100)
- Sub-metrics: Founders' experience, skill diversity, domain expertise, team growth and retention, LinkedIn profiles, diversity indicators.
- Scoring:
  - 0-20: Inexperienced or fragmented team
  - 21-50: Some relevant experience
  - 51-80: Strong, well-rounded team
  - 81-100: Elite, high-performing leadership

5. Funding Velocity Score (0-100)
- Sub-metrics: Number and size of rounds, time between rounds, investor quality, valuation growth.
- Scoring:
  - 0-20: Little or stagnant funding
  - 21-50: Moderate funding activity
  - 51-80: Strong funding momentum
  - 81-100: Rapid, high-quality fundraising

6. Company Age Score (0-100)
- Logic: Survival likelihood increases with age. Research suggests only about 20% of startups survive beyond 7 years.
- Scoring:
  - 0-20: Less than 1 year old (high risk, very early stage)
  - 21-40: 1-3 years old (still risky, but gaining traction)
  - 41-60: 3-5 years old (moderate survival likelihood)
  - 61-80: 5-7 years old (strong survival likelihood)
  - 81-100: More than 7 years old (proven resilience, high survival likelihood)
This reverses the usual "younger = more growth potential" logic and instead emphasizes survival probability as a growth enabler.

Composite Growth Likelihood Formula:
Growth Score = 0.20 x Media Reach + 0.15 x Sentiment + 0.15 x Innovation Visibility + 0.15 x Team Strength + 0.15 x Funding Velocity + 0.20 x Company Age

Return ONLY the JSON object, no markdown, no explanations outside the JSON.
