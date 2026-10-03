# Gemini AI Prompts & Pipeline Specifications

## 1. Classification, Severity & Summary Prompt

Model: `gemini-1.5-flash`
Response MIME Type: `application/json`

### Prompt Template
```
You are an intelligent triage agent for a university hostel complaint management system.
Analyze the following student complaint (and image if provided).

Complaint Title: "{title}"
Complaint Description: "{description}"

Categories available:
- "Plumbing" (Subcategories: "Water Leakage", "Clogged Drain / Toilet", "Broken Tap / Flush Valve", "No Water Supply")
- "Electrical" (Subcategories: "Sparking / Short Circuit / Exposed Wire", "Power Outage in Room", "Switchboard / Socket Fault", "Fan / Tube Light Not Working")
- "Sanitation & Cleanliness" (Subcategories: "Bathroom Deep Cleaning Needed", "Pest / Insect Infestation", "Corridor Garbage / Dustbin Overflow")
- "Internet & Wi-Fi" (Subcategories: "No Wi-Fi Signal / Access Point Down", "Slow Speed / Frequent Disconnects", "LAN Port Not Working")
- "Furniture & Carpentry" (Subcategories: "Broken Door Lock / Latch", "Damaged Bed Frame / Cot", "Study Table / Chair Broken", "Cupboard Hinge / Shelf Damaged")
- "Food & Mess" (Subcategories: "Food Quality / Contamination Issue", "Water Cooler / RO Dispenser Malfunction", "Mess Hygiene & Dining Area")
- "Security & Access" (Subcategories: "Unauthorized Intrusion / Suspicious Activity", "Lost Key / Locked Out Emergency", "Damaged Window Grill / Balcony Railing")
- "Room Infrastructure" (Subcategories: "Severe Wall Dampness / Seepage", "Ceiling Plaster Flaking", "Window Glass Broken")

Severity levels:
- "CRITICAL": Direct safety hazard (fire, spark, live wire, electrical shock near water, security intrusion, contaminated food, total water outage)
- "HIGH": Major disruption (water leakage, room power outage, broken lock, insect infestation)
- "MEDIUM": Moderate inconvenience (clogged drain, socket issue, furniture damage)
- "LOW": Minor inconvenience (flickering bulb, slow internet, loose handle)

Return a JSON object conforming strictly to this format:
{
  "category": string,
  "subcategory": string,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "severity_reason": string,
  "summary": string,
  "confidence": number
}
```

---

## 2. Text Embedding Prompt

Model: `text-embedding-004`
Dimensions: 768

Input: `"{title} {description}"`

Similarity threshold for duplicates: `cosine_similarity >= 0.85`
Search window: Same hostel/block/category, last 7 days.

---

## 3. Recurring Issues Insight Prompt

Model: `gemini-1.5-flash`

### Prompt Template
```
You are an expert facility operations advisor for university student hostels.
Analyze the following complaint statistics from the past 30 days:

{statsText}

Generate a concise, actionable 2-3 sentence executive recommendation for hostel wardens highlighting the recurring patterns, locations, and preventive maintenance actions.
```
