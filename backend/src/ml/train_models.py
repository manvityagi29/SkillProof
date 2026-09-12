#!/usr/bin/env python3
"""
SkillProof ML Training Pipeline
Trains two specialized Scikit-Learn models:
1. Team Synergy Classifier (RandomForestClassifier):
   Predicts hackathon team-candidate compatibility based on skill coverage,
   score balance, cognitive diversity, and critical gap resolution.
2. Code Quality & Maintainability Regressor (GradientBoostingRegressor):
   Predicts code quality (0-100) from structural features like AST depth,
   token entropy, cyclomatic complexity, and Halstead volume.
"""

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_team_synergy_model():
    print("--> Training Team Synergy Random Forest Model...")
    np.random.seed(42)
    n_samples = 2500

    # Features:
    # 0: Gap Fill Ratio (0.0 to 1.0) - does candidate fill missing gaps?
    # 1: Candidate Average Verification Score (0.0 to 100.0)
    # 2: Team Existing Average Score (0.0 to 100.0)
    # 3: Score Delta (Candidate - Team) (-50.0 to +50.0)
    # 4: Skill Overlap Ratio (0.0 to 1.0) - redundancy vs synergy
    # 5: Team Roster Fullness (0.0 to 1.0)
    X = []
    y = []

    for _ in range(n_samples):
        gap_fill = np.random.uniform(0.0, 1.0)
        cand_score = np.random.uniform(30.0, 100.0)
        team_score = np.random.uniform(40.0, 95.0)
        score_delta = cand_score - team_score
        skill_overlap = np.random.uniform(0.0, 0.8)
        roster_fullness = np.random.uniform(0.2, 0.9)

        # High synergy formula:
        # High gap fill is paramount; high candidate score improves synergy;
        # excessive overlap without filling gaps lowers synergy.
        synergy_latent = (
            (gap_fill * 0.45) +
            (cand_score / 100.0 * 0.30) +
            (max(0, score_delta + 20) / 70.0 * 0.15) +
            ((1.0 - skill_overlap) * 0.10)
        )
        # Add slight natural noise
        synergy_latent += np.random.normal(0, 0.04)

        # Class labels:
        # 2: Exceptional Synergy (>= 0.70)
        # 1: High Synergy (0.45 <= score < 0.70)
        # 0: Moderate / Low Synergy (< 0.45)
        if synergy_latent >= 0.70:
            label = 2
        elif synergy_latent >= 0.45:
            label = 1
        else:
            label = 0

        X.append([gap_fill, cand_score, team_score, score_delta, skill_overlap, roster_fullness])
        y.append(label)

    X = np.array(X)
    y = np.array(y)

    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X, y)

    model_path = os.path.join(MODELS_DIR, "team_synergy_model.joblib")
    joblib.dump(clf, model_path)
    print(f"✓ Saved Team Synergy Model: {model_path} (Training accuracy: {clf.score(X, y):.2%})")


def train_code_quality_model():
    print("--> Training Code Quality Gradient Boosting Regressor...")
    np.random.seed(42)
    n_samples = 3000

    # Features:
    # 0: Normalized AST Depth (0 to 15)
    # 1: Cyclomatic Complexity (1 to 20)
    # 2: Token Diversity (Unique tokens / total tokens) (0.1 to 0.9)
    # 3: Lines of Code (5 to 150)
    # 4: Average Identifier Length (3 to 25 chars)
    # 5: Structure to Logic Ratio (0.1 to 1.0)
    X = []
    y = []

    for _ in range(n_samples):
        ast_depth = np.random.uniform(2, 12)
        cyclomatic = np.random.uniform(1, 15)
        token_diversity = np.random.uniform(0.2, 0.85)
        loc = np.random.uniform(8, 100)
        ident_len = np.random.uniform(4, 18)
        struct_ratio = np.random.uniform(0.2, 0.9)

        # Target quality score:
        # Moderate depth, reasonable cyclomatic complexity (not excessively convoluted),
        # high token diversity (expressive naming), good identifier length.
        quality = 50.0
        # Reward healthy modular depth (3 to 8)
        if 3 <= ast_depth <= 8:
            quality += 15
        elif ast_depth > 10:
            quality -= 10

        # Penalize excessive cyclomatic complexity (spaghetti nesting)
        if cyclomatic > 8:
            quality -= (cyclomatic - 8) * 3
        else:
            quality += 10

        # Reward token diversity (clean decomposition)
        quality += (token_diversity - 0.3) * 30

        # Reward descriptive identifiers (6-14 chars)
        if 6 <= ident_len <= 14:
            quality += 15
        else:
            quality -= 5

        quality += np.random.normal(0, 3)
        quality = np.clip(quality, 10.0, 98.0)

        X.append([ast_depth, cyclomatic, token_diversity, loc, ident_len, struct_ratio])
        y.append(quality)

    X = np.array(X)
    y = np.array(y)

    reg = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    reg.fit(X, y)

    model_path = os.path.join(MODELS_DIR, "code_quality_model.joblib")
    joblib.dump(reg, model_path)
    print(f"✓ Saved Code Quality Model: {model_path} (R² score: {reg.score(X, y):.2%})")


if __name__ == "__main__":
    train_team_synergy_model()
    train_code_quality_model()
    print("All ML models successfully trained and serialized.")
