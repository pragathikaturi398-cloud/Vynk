import { GoogleGenerativeAI } from '@google/generative-ai';
import { Severity } from '../../types';
import fs from 'fs';
import { ENV } from '../../config/env';
import { cosineSimilarity } from '../../utils/vector';

export interface AIClassificationResult {
  category: string;
  subcategory: string;
  severity: Severity;
  severity_reason: string;
  summary: string;
  confidence: number;
}

export class AIService {
  private static genAI: GoogleGenerativeAI | null = ENV.GEMINI_API_KEY
    ? new GoogleGenerativeAI(ENV.GEMINI_API_KEY)
    : null;

  /**
   * Classify complaint using Gemini API with strict JSON schema, or fallback to keyword rules
   */
  static async classifyComplaint(
    title: string,
    description: string,
    imagePath?: string
  ): Promise<AIClassificationResult> {
    const fullText = `${title}\n${description}`;

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `
You are an intelligent triage agent for a university hostel complaint management system.
Analyze the following student complaint (and image if provided).

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
  "confidence": number (between 0.0 and 1.0)
}
`;

        let contents: any[] = [prompt];

        if (imagePath && fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          contents.push({
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType,
            },
          });
        }

        const result = await model.generateContent(contents);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        return {
          category: parsed.category || 'Plumbing',
          subcategory: parsed.subcategory || 'General Issue',
          severity: (parsed.severity as Severity) || Severity.MEDIUM,
          severity_reason: parsed.severity_reason || 'AI assessed complaint urgency',
          summary: parsed.summary || title,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        };
      } catch (err) {
        console.warn('[AIService] Gemini API call failed or timed out. Using keyword fallback rule engine.', err);
      }
    }

    // Deterministic keyword-based fallback rule engine
    return this.ruleBasedClassifier(fullText);
  }

  /**
   * Deterministic rule-based fallback when Gemini API is unavailable
   */
  static ruleBasedClassifier(text: string): AIClassificationResult {
    const lower = text.toLowerCase();

    // Critical safety triggers
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
          severity: Severity.CRITICAL,
          severity_reason: 'Water leakage near electrical hazards detected',
          summary: 'Critical water leakage near electrical connections.',
          confidence: 0.95,
        };
      }
      return {
        category: 'Electrical',
        subcategory: 'Sparking / Short Circuit / Exposed Wire',
        severity: Severity.CRITICAL,
        severity_reason: 'Hazardous electrical or fire risk detected',
        summary: 'Emergency electrical safety hazard.',
        confidence: 0.95,
      };
    }

    // Plumbing
    if (
      lower.includes('leak') ||
      lower.includes('tap') ||
      lower.includes('pipe') ||
      lower.includes('flush') ||
      lower.includes('toilet') ||
      lower.includes('drain') ||
      lower.includes('plumb')
    ) {
      const isDrain = lower.includes('drain') || lower.includes('clog') || lower.includes('choke');
      return {
        category: 'Plumbing',
        subcategory: isDrain ? 'Clogged Drain / Toilet' : 'Water Leakage',
        severity: isDrain ? Severity.MEDIUM : Severity.HIGH,
        severity_reason: 'Plumbing issue requiring repair',
        summary: isDrain ? 'Clogged drain or sanitation blockage' : 'Water supply or leakage issue',
        confidence: 0.88,
      };
    }

    // Electrical
    if (
      lower.includes('light') ||
      lower.includes('fan') ||
      lower.includes('socket') ||
      lower.includes('switch') ||
      lower.includes('power') ||
      lower.includes('electricity')
    ) {
      const isPowerOut = lower.includes('outage') || lower.includes('no power');
      return {
        category: 'Electrical',
        subcategory: isPowerOut ? 'Power Outage in Room' : 'Fan / Tube Light Not Working',
        severity: isPowerOut ? Severity.HIGH : Severity.LOW,
        severity_reason: 'Electrical fixture malfunction',
        summary: isPowerOut ? 'Room power supply outage' : 'Lighting or fan malfunction',
        confidence: 0.85,
      };
    }

    // Internet
    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet') || lower.includes('lan')) {
      return {
        category: 'Internet & Wi-Fi',
        subcategory: 'No Wi-Fi Signal / Access Point Down',
        severity: Severity.HIGH,
        severity_reason: 'Hostel internet connectivity disruption',
        summary: 'Wi-Fi connectivity disruption',
        confidence: 0.9,
      };
    }

    // Sanitation
    if (
      lower.includes('clean') ||
      lower.includes('cockroach') ||
      /\brats?\b/i.test(text) ||
      lower.includes('rodent') ||
      lower.includes('pest') ||
      lower.includes('garbage')
    ) {
      return {
        category: 'Sanitation & Cleanliness',
        subcategory: lower.includes('pest') || lower.includes('cockroach') ? 'Pest / Insect Infestation' : 'Bathroom Deep Cleaning Needed',
        severity: Severity.MEDIUM,
        severity_reason: 'Sanitation and hygiene maintenance required',
        summary: 'Sanitation request',
        confidence: 0.85,
      };
    }

    // Furniture
    if (lower.includes('bed') || lower.includes('table') || lower.includes('chair') || lower.includes('door') || lower.includes('lock')) {
      const isLock = lower.includes('lock') || lower.includes('key');
      return {
        category: 'Furniture & Carpentry',
        subcategory: isLock ? 'Broken Door Lock / Latch' : 'Damaged Bed Frame / Cot',
        severity: isLock ? Severity.HIGH : Severity.MEDIUM,
        severity_reason: 'Furniture or door hardware issue',
        summary: isLock ? 'Security door lock repair needed' : 'Furniture repair needed',
        confidence: 0.85,
      };
    }

    // HVAC & Air Conditioning
    if (
      /\bac\b/i.test(text) ||
      lower.includes('a/c') ||
      lower.includes('air conditioner') ||
      lower.includes('air conditioning') ||
      lower.includes('cooler') ||
      lower.includes('hvac') ||
      lower.includes('compressor')
    ) {
      return {
        category: 'HVAC & Air Conditioning',
        subcategory: lower.includes('compressor') ? 'Compressor / Refrigerant Fault' : 'Air Conditioner Cooling Fault',
        severity: Severity.HIGH,
        severity_reason: 'Room temperature control or AC malfunction',
        summary: 'Air conditioning / room cooling service needed',
        confidence: 0.9,
      };
    }

    // Appliances & Laundry
    if (
      lower.includes('washing machine') ||
      lower.includes('laundry') ||
      lower.includes('dryer') ||
      lower.includes('geyser') ||
      lower.includes('refrigerator') ||
      lower.includes('fridge') ||
      lower.includes('microwave') ||
      lower.includes('water heater')
    ) {
      return {
        category: 'Appliances & Laundry',
        subcategory: lower.includes('washing machine')
          ? 'Washing Machine Breakdown'
          : lower.includes('geyser')
          ? 'Geyser / Water Heater Fault'
          : 'Hostel Appliance Malfunction',
        severity: Severity.HIGH,
        severity_reason: 'Hostel electrical appliance breakdown',
        summary: 'Hostel appliance repair request',
        confidence: 0.9,
      };
    }

    // Elevator & Lift
    if (lower.includes('elevator') || lower.includes('lift')) {
      return {
        category: 'Elevator & Lift Services',
        subcategory: 'Elevator Breakdown / Maintenance',
        severity: Severity.CRITICAL,
        severity_reason: 'Elevator safety and mobility service required',
        summary: 'Elevator breakdown or maintenance request',
        confidence: 0.95,
      };
    }

    // Water Purifier & Drinking Water
    if (lower.includes('purifier') || lower.includes('ro filter') || lower.includes('water cooler') || lower.includes('drinking water')) {
      return {
        category: 'Water Purifier & RO Systems',
        subcategory: 'RO Filter / Water Dispenser Malfunction',
        severity: Severity.HIGH,
        severity_reason: 'Drinking water access disruption',
        summary: 'Drinking water purification unit issue',
        confidence: 0.9,
      };
    }

    // Gym & Sports Equipment
    if (lower.includes('gym') || lower.includes('treadmill') || lower.includes('weights') || lower.includes('badminton')) {
      return {
        category: 'Gym & Sports Equipment',
        subcategory: 'Fitness Machine / Sports Facility Fault',
        severity: Severity.MEDIUM,
        severity_reason: 'Sports or gym facility equipment repair',
        summary: 'Hostel recreational equipment maintenance',
        confidence: 0.85,
      };
    }

    // Civil & Structural
    if (lower.includes('plaster') || lower.includes('seepage') || lower.includes('tile') || lower.includes('wall') || lower.includes('ceiling')) {
      return {
        category: 'Civil & Wall Infrastructure',
        subcategory: 'Wall Plaster Flaking / Seepage',
        severity: Severity.MEDIUM,
        severity_reason: 'Structural masonry or wall maintenance required',
        summary: 'Civil repair and plaster maintenance',
        confidence: 0.85,
      };
    }

    // Default general
    return {
      category: 'Room Infrastructure',
      subcategory: 'General Infrastructure Maintenance',
      severity: Severity.MEDIUM,
      severity_reason: 'General hostel infrastructure issue',
      summary: text.slice(0, 80),
      confidence: 0.65,
    };
  }

  /**
   * Generates a 768-dimensional text embedding for title + description
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        if (result.embedding?.values && result.embedding.values.length > 0) {
          return result.embedding.values;
        }
      } catch (err) {
        console.warn('[AIService] Gemini embedding generation failed, using local hash-vector fallback.', err);
      }
    }

    // Local deterministic pseudo-embedding (768 dimensions) based on character n-grams
    return this.createLocalEmbedding(text, 768);
  }

  /**
   * Creates a deterministic 768-dimensional normalized pseudo-embedding
   */
  private static createLocalEmbedding(text: string, dimensions = 768): number[] {
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

      // Bigram projection
      if (i > 0) {
        const bigram = tokens[i - 1] + '_' + word;
        let bHash = 0;
        for (let k = 0; k < bigram.length; k++) {
          bHash = (bHash << 5) - bHash + bigram.charCodeAt(k);
          bHash |= 0;
        }
        const bIdx = Math.abs(bHash) % dimensions;
        vector[bIdx] += 1.5;
      }
    }

    // Normalize vector
    let norm = 0;
    for (let v of vector) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  /**
   * Priority score calculator according to section 6.2:
   * priority = severity_weight + safety_flag + duplicate_count + age_factor
   * Safety issues are always Critical.
   */
  static calculatePriorityScore(params: {
    severity: Severity;
    isSafetyIssue?: boolean;
    duplicateCount?: number;
    ageHours?: number;
  }): number {
    const weights: Record<Severity, number> = {
      [Severity.CRITICAL]: 8.0,
      [Severity.HIGH]: 5.0,
      [Severity.MEDIUM]: 3.0,
      [Severity.LOW]: 1.0,
    };

    let score = weights[params.severity] || 3.0;

    if (params.isSafetyIssue || params.severity === Severity.CRITICAL) {
      score += 2.0;
    }

    const duplicates = params.duplicateCount || 0;
    score += Math.min(duplicates * 0.75, 3.0);

    const age = params.ageHours || 0;
    score += Math.min(age * 0.05, 2.0);

    return parseFloat(score.toFixed(2));
  }

  /**
   * Plain-language recurring issue insight generator
   */
  static async generateInsightSummary(statsText: string): Promise<string> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
You are an expert facility operations advisor for university student hostels.
Analyze the following complaint statistics from the past 30 days:

${statsText}

Generate a concise, actionable 2-3 sentence executive recommendation for hostel wardens highlighting the recurring patterns, locations, and preventive maintenance actions.
`;
        const res = await model.generateContent(prompt);
        return res.response.text().trim();
      } catch (e) {
        console.warn('[AIService] Failed to generate AI summary for insights, using template.', e);
      }
    }

    return `Hostel analytics indicate recurring maintenance activity concentrated in sanitary and plumbing infrastructure over the past 30 days. Conducting a comprehensive inspection of main pipeline joints and valves is recommended to prevent recurring service disruptions.`;
  }
}
