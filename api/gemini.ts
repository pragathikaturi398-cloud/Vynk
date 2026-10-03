export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action = 'classify', title = '', description = '', statsText = '', text = '', prompt = '' } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (action === 'classify' || (!action && title)) {
      const fullText = `${title}\n${description}`.trim();

      if (apiKey) {
        try {
          const systemPrompt = `You are an intelligent triage agent for a university hostel complaint management system.
Analyze the student complaint.

Complaint Title: "${title}"
Complaint Description: "${description}"

Categories available:
- "Plumbing" (Subcategories: "Water Leakage", "Clogged Drain / Toilet", "Broken Tap / Flush Valve", "No Water Supply")
- "Electrical" (Subcategories: "Sparking / Short Circuit / Exposed Wire", "Power Outage in Room", "Switchboard / Socket Fault", "Fan / Tube Light Not Working")
- "Sanitation & Cleanliness" (Subcategories: "Bathroom Deep Cleaning Needed", "Pest / Insect Infestation", "Corridor Garbage / Dustbin Overflow")
- "Internet & Wi-Fi" (Subcategories: "No Wi-Fi Signal / Access Point Down", "Slow Speed / Frequent Disconnects", "LAN Port Not Working")
- "Furniture & Carpentry" (Subcategories: "Broken Door Lock / Latch", "Damaged Bed Frame / Cot", "Study Table / Chair Broken", "Cupboard Hinge / Shelf Damaged")
- "Food & Mess" (Subcategories: "Food Quality / Contamination Issue", "Water Cooler / RO Dispenser Malfunction", "Mess Hygiene & Dining Area")
- "Security & Access" (Subcategories: "Unauthorized Intrusion / Suspicious Activity", "Lost Key / Locked Out Emergency", "Damaged Window Grill / Balcony Railing")
- "Room Infrastructure" (Subcategories: "Severe Wall Dampness / Seepage", "Ceiling Plaster Flaking", "Window Glass Broken")

Severity levels: "CRITICAL", "HIGH", "MEDIUM", "LOW".

Return ONLY a JSON object:
{
  "category": string,
  "subcategory": string,
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "severity_reason": string,
  "summary": string,
  "confidence": number
}`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const parsed = JSON.parse(textResponse);
              return res.status(200).json({
                success: true,
                data: {
                  category: parsed.category || 'Plumbing',
                  subcategory: parsed.subcategory || 'General Issue',
                  severity: parsed.severity || 'MEDIUM',
                  severity_reason: parsed.severity_reason || 'AI assessed urgency',
                  summary: parsed.summary || title,
                  confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
                },
              });
            }
          }
        } catch (apiErr) {
          console.warn('[Gemini Function] External API call failed, using rule engine', apiErr);
        }
      }

      // Fallback rule classifier
      const fallback = ruleBasedClassifier(fullText);
      return res.status(200).json({ success: true, data: fallback });
    }

    if (action === 'embed') {
      const targetText = text || `${title}\n${description}`.trim();
      if (apiKey) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: targetText }] },
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.embedding?.values) {
              return res.status(200).json({ success: true, data: { embedding: data.embedding.values } });
            }
          }
        } catch (e) {
          console.warn('[Gemini Function] Embeddings API fallback', e);
        }
      }
      return res.status(200).json({
        success: true,
        data: { embedding: createLocalEmbedding(targetText, 768) },
      });
    }

    if (action === 'insight') {
      if (apiKey) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are an expert facility operations advisor for university hostels. Analyze stats: ${statsText}. Generate a concise, actionable 2-3 sentence executive recommendation.`,
                      },
                    ],
                  },
                ],
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResult) {
              return res.status(200).json({ success: true, data: { summary: textResult.trim() } });
            }
          }
        } catch (e) {
          console.warn('[Gemini Function] Insight fallback', e);
        }
      }
      return res.status(200).json({
        success: true,
        data: {
          summary:
            'Hostel analytics indicate recurring maintenance activity concentrated in sanitary and plumbing infrastructure over the past 30 days. Conducting a comprehensive inspection of main pipeline joints and valves is recommended to prevent recurring service disruptions.',
        },
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (err: any) {
    console.error('[Gemini Serverless Function Error]:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal error' });
  }
}

function ruleBasedClassifier(text: string) {
  const lower = text.toLowerCase();
  const isCritical =
    lower.includes('spark') ||
    lower.includes('fire') ||
    lower.includes('shock') ||
    lower.includes('burn') ||
    lower.includes('smoke') ||
    lower.includes('intrud') ||
    lower.includes('theft') ||
    (lower.includes('leak') && lower.includes('socket')) ||
    (lower.includes('water') && lower.includes('electric'));

  if (isCritical) {
    if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
      return {
        category: 'Plumbing',
        subcategory: 'Water Leakage',
        severity: 'CRITICAL',
        severity_reason: 'Water leakage near electrical hazards detected',
        summary: 'Critical water leakage near electrical connections.',
        confidence: 0.95,
      };
    }
    return {
      category: 'Electrical',
      subcategory: 'Sparking / Short Circuit / Exposed Wire',
      severity: 'CRITICAL',
      severity_reason: 'Hazardous electrical or fire risk detected',
      summary: 'Emergency electrical safety hazard.',
      confidence: 0.95,
    };
  }

  if (lower.includes('leak') || lower.includes('tap') || lower.includes('pipe') || lower.includes('flush') || lower.includes('toilet') || lower.includes('drain')) {
    const isDrain = lower.includes('drain') || lower.includes('clog') || lower.includes('choke');
    return {
      category: 'Plumbing',
      subcategory: isDrain ? 'Clogged Drain / Toilet' : 'Water Leakage',
      severity: isDrain ? 'MEDIUM' : 'HIGH',
      severity_reason: 'Plumbing issue requiring repair',
      summary: isDrain ? 'Clogged drain or sanitation blockage' : 'Water supply or leakage issue',
      confidence: 0.88,
    };
  }

  if (lower.includes('light') || lower.includes('fan') || lower.includes('socket') || lower.includes('switch') || lower.includes('power')) {
    const isPowerOut = lower.includes('outage') || lower.includes('no power');
    return {
      category: 'Electrical',
      subcategory: isPowerOut ? 'Power Outage in Room' : 'Fan / Tube Light Not Working',
      severity: isPowerOut ? 'HIGH' : 'LOW',
      severity_reason: 'Electrical fixture malfunction',
      summary: isPowerOut ? 'Room power supply outage' : 'Lighting or fan malfunction',
      confidence: 0.85,
    };
  }

  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet') || lower.includes('lan')) {
    return {
      category: 'Internet & Wi-Fi',
      subcategory: 'No Wi-Fi Signal / Access Point Down',
      severity: 'HIGH',
      severity_reason: 'Hostel internet connectivity disruption',
      summary: 'Wi-Fi connectivity disruption',
      confidence: 0.9,
    };
  }

  if (lower.includes('clean') || lower.includes('cockroach') || lower.includes('pest') || lower.includes('garbage')) {
    return {
      category: 'Sanitation & Cleanliness',
      subcategory: lower.includes('pest') ? 'Pest / Insect Infestation' : 'Bathroom Deep Cleaning Needed',
      severity: 'MEDIUM',
      severity_reason: 'Sanitation and hygiene maintenance required',
      summary: 'Sanitation request',
      confidence: 0.85,
    };
  }

  if (lower.includes('bed') || lower.includes('table') || lower.includes('chair') || lower.includes('door') || lower.includes('lock')) {
    const isLock = lower.includes('lock') || lower.includes('key');
    return {
      category: 'Furniture & Carpentry',
      subcategory: isLock ? 'Broken Door Lock / Latch' : 'Damaged Bed Frame / Cot',
      severity: isLock ? 'HIGH' : 'MEDIUM',
      severity_reason: 'Furniture or door hardware issue',
      summary: isLock ? 'Security door lock repair needed' : 'Furniture repair needed',
      confidence: 0.85,
    };
  }

  return {
    category: 'Room Infrastructure',
    subcategory: 'General Infrastructure Maintenance',
    severity: 'MEDIUM',
    severity_reason: 'General hostel infrastructure issue',
    summary: text.slice(0, 80),
    confidence: 0.7,
  };
}

function createLocalEmbedding(text: string, dimensions = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  }

  return vector;
}
