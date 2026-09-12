#!/usr/bin/env python3
"""
CLI inference script for Team Synergy Prediction
Input (JSON via stdin or argv):
{
  "gapFillRatio": 0.8,
  "candidateAvgScore": 85.0,
  "teamAvgScore": 75.0,
  "skillOverlapRatio": 0.2,
  "rosterFullness": 0.5
}
Output (JSON):
{
  "synergyScore": 92,
  "synergyLabel": "Exceptional Fit",
  "probabilities": { "exceptional": 0.82, "high": 0.15, "moderate": 0.03 }
}
"""

import sys
import os
import json
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "team_synergy_model.joblib")

def main():
    try:
        raw_input = sys.stdin.read().strip()
        if not raw_input and len(sys.argv) > 1:
            raw_input = sys.argv[1]

        if not raw_input:
            data = {}
        else:
            data = json.loads(raw_input)

        gap_fill = float(data.get("gapFillRatio", 0.5))
        cand_score = float(data.get("candidateAvgScore", 70.0))
        team_score = float(data.get("teamAvgScore", 70.0))
        score_delta = cand_score - team_score
        skill_overlap = float(data.get("skillOverlapRatio", 0.3))
        roster_fullness = float(data.get("rosterFullness", 0.5))

        if not os.path.exists(MODEL_PATH):
            # Fallback heuristic if model not yet trained
            base = int(gap_fill * 50 + (cand_score / 100) * 35 + 15)
            print(json.dumps({
                "synergyScore": min(98, max(40, base)),
                "synergyLabel": "High Synergy" if base >= 75 else "Moderate Fit",
                "isFallback": True
            }))
            return

        model = joblib.load(MODEL_PATH)
        features = np.array([[gap_fill, cand_score, team_score, score_delta, skill_overlap, roster_fullness]])
        
        probs = model.predict_proba(features)[0]
        # Classes: 0: Low/Mod, 1: High, 2: Exceptional
        prob_mod = float(probs[0]) if len(probs) > 0 else 0.1
        prob_high = float(probs[1]) if len(probs) > 1 else 0.4
        prob_exec = float(probs[2]) if len(probs) > 2 else 0.5

        # Calculate a continuous percentage synergy score (40 to 98%)
        continuous_score = int(np.clip(
            (prob_exec * 95) + (prob_high * 78) + (prob_mod * 50),
            35, 99
        ))

        if continuous_score >= 82:
            label = "Exceptional Synergy"
        elif continuous_score >= 65:
            label = "High Synergy"
        else:
            label = "Moderate Fit"

        result = {
            "synergyScore": continuous_score,
            "synergyLabel": label,
            "probabilities": {
                "exceptional": round(prob_exec, 3),
                "high": round(prob_high, 3),
                "moderate": round(prob_mod, 3)
            }
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "synergyScore": 75,
            "synergyLabel": "Good Fit",
            "error": str(e)
        }))

if __name__ == "__main__":
    main()
