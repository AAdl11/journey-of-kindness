"""
Journey of Kindness - Bayesian Network Module
貝氏網路模組：用於社區關懷需求預測

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
Semester: Fall 2025

This module implements Bayesian Network inference for predicting
community care needs based on observable evidence.

Reference: Russell & Norvig, Chapter 13 - Probabilistic Reasoning
"""

import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class EvidenceLevel(Enum):
    """Evidence levels for Bayesian inference."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    NONE = "none"


@dataclass
class CommunityMember:
    """Represents a community member with observable attributes."""
    id: str
    name: str
    name_zh: str
    location: str
    location_zh: str
    
    # Observable evidence (parent nodes)
    life_stress: EvidenceLevel
    social_connection: EvidenceLevel
    recent_interaction: EvidenceLevel
    visible_behavior: EvidenceLevel
    
    # Hidden truth (for game validation)
    actual_needs_care: bool
    story_type: str  # 'surprise' or 'touching'
    
    def __post_init__(self):
        """Calculate initial probability based on evidence."""
        self._base_probability = self._calculate_base_probability()
    
    def _calculate_base_probability(self) -> float:
        """
        Calculate P(NeedsCare | Evidence) using simplified Bayesian inference.
        
        In a full implementation, this would use:
        P(NeedsCare | E1, E2, E3, E4) = P(E1|NC) * P(E2|NC) * P(E3|NC) * P(E4|NC) * P(NC)
                                        / P(E1, E2, E3, E4)
        
        For game purposes, we use a weighted scoring system.
        """
        weights = {
            'life_stress': {'high': 0.3, 'medium': 0.15, 'low': 0.05, 'none': 0.0},
            'social_connection': {'low': 0.25, 'medium': 0.1, 'high': 0.0, 'none': 0.3},
            'recent_interaction': {'none': 0.25, 'low': 0.15, 'medium': 0.05, 'high': 0.0},
            'visible_behavior': {'high': 0.2, 'medium': 0.1, 'low': 0.05, 'none': 0.0}
        }
        
        score = 0.0
        score += weights['life_stress'].get(self.life_stress.value, 0)
        score += weights['social_connection'].get(self.social_connection.value, 0)
        score += weights['recent_interaction'].get(self.recent_interaction.value, 0)
        score += weights['visible_behavior'].get(self.visible_behavior.value, 0)
        
        # Normalize to percentage
        return min(score * 100, 100)
    
    @property
    def care_probability(self) -> float:
        """Return the calculated probability of needing care."""
        return self._base_probability
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'name': {'en': self.name, 'zh': self.name_zh},
            'location': {'en': self.location, 'zh': self.location_zh},
            'bayesian': {
                'stress': self.life_stress.value,
                'connection': self.social_connection.value,
                'interaction': self.recent_interaction.value,
                'behavior': self.visible_behavior.value,
                'probability': round(self.care_probability)
            },
            'truth': self.story_type
        }


class BayesianCareNetwork:
    """
    Bayesian Network for Community Care Need Assessment.
    
    Network Structure:
    
        Life_Stress    Social_Connection
              \\            /
               \\          /
                v        v
              Needs_Care (Hidden)
                /        \\
               /          \\
              v            v
        Recent_Interaction  Visible_Behavior
    
    The hidden variable 'Needs_Care' is what we're trying to infer
    from the observable evidence nodes.
    """
    
    def __init__(self):
        self.members: List[CommunityMember] = []
        self._initialize_community()
    
    def _initialize_community(self):
        """Initialize the Bayview-Hunters Point community members."""
        
        # Mr. Johnson - Hidden grief (algorithm says fine, but needs care)
        self.members.append(CommunityMember(
            id='johnson',
            name='Mr. Johnson',
            name_zh='Johnson 先生',
            location='Park Bench',
            location_zh='公園長椅',
            life_stress=EvidenceLevel.LOW,
            social_connection=EvidenceLevel.HIGH,
            recent_interaction=EvidenceLevel.HIGH,  # Daily visits
            visible_behavior=EvidenceLevel.LOW,
            actual_needs_care=True,  # Wife passed away
            story_type='surprise'
        ))
        
        # Maria - High stress but improving (algorithm says needs care, but she's okay)
        self.members.append(CommunityMember(
            id='maria',
            name='Maria',
            name_zh='Maria',
            location='Apartment',
            location_zh='公寓門口',
            life_stress=EvidenceLevel.HIGH,
            social_connection=EvidenceLevel.LOW,
            recent_interaction=EvidenceLevel.LOW,
            visible_behavior=EvidenceLevel.HIGH,  # Rushing
            actual_needs_care=False,  # Just got new job
            story_type='touching'
        ))
        
        # Tane - Withdrawn teen who actually wants to help
        self.members.append(CommunityMember(
            id='tane',
            name='Tane',
            name_zh='Tane',
            location='Basketball Court',
            location_zh='籃球場',
            life_stress=EvidenceLevel.MEDIUM,
            social_connection=EvidenceLevel.LOW,
            recent_interaction=EvidenceLevel.LOW,
            visible_behavior=EvidenceLevel.MEDIUM,
            actual_needs_care=False,  # He's a hidden helper!
            story_type='surprise'
        ))
        
        # Mrs. Chen - Smiling but lonely
        self.members.append(CommunityMember(
            id='chen',
            name='Mrs. Chen',
            name_zh='陳奶奶',
            location='Community Garden',
            location_zh='社區菜園',
            life_stress=EvidenceLevel.LOW,
            social_connection=EvidenceLevel.HIGH,
            recent_interaction=EvidenceLevel.HIGH,
            visible_behavior=EvidenceLevel.LOW,  # Happy
            actual_needs_care=True,  # Misses Taiwan
            story_type='touching'
        ))
        
        # Devon - New neighbor, high stress, needs welcome
        self.members.append(CommunityMember(
            id='devon',
            name='Devon',
            name_zh='Devon',
            location='Moving Truck',
            location_zh='搬家卡車旁',
            life_stress=EvidenceLevel.HIGH,
            social_connection=EvidenceLevel.NONE,  # New to area
            recent_interaction=EvidenceLevel.NONE,
            visible_behavior=EvidenceLevel.HIGH,  # Busy
            actual_needs_care=True,
            story_type='touching'
        ))
    
    def get_member(self, member_id: str) -> Optional[CommunityMember]:
        """Get a community member by ID."""
        for member in self.members:
            if member.id == member_id:
                return member
        return None
    
    def get_all_probabilities(self) -> List[Tuple[str, float]]:
        """Get all members sorted by care probability."""
        return sorted(
            [(m.name, m.care_probability) for m in self.members],
            key=lambda x: x[1],
            reverse=True
        )
    
    def evaluate_decision(self, selected_ids: List[str]) -> Dict:
        """
        Evaluate the player's care decisions.
        
        Returns scoring based on:
        - Finding hidden needs (high score)
        - Using override correctly (bonus)
        - Avoiding false positives (minor score)
        """
        results = {
            'total_elo': 0,
            'decisions': [],
            'insights': []
        }
        
        for member_id in selected_ids:
            member = self.get_member(member_id)
            if not member:
                continue
            
            decision = {
                'member': member.name,
                'probability': member.care_probability,
                'actual_need': member.actual_needs_care,
                'story_type': member.story_type
            }
            
            # Scoring logic
            if member.care_probability < 30 and member.actual_needs_care:
                # Override success - found hidden need!
                decision['elo'] = 50
                decision['insight'] = "數據看不見的需求 - Override 成功！"
            elif member.actual_needs_care:
                # Correct identification
                decision['elo'] = 30
                decision['insight'] = "正確識別需要關懷的人"
            else:
                # False positive but still caring
                decision['elo'] = 20
                decision['insight'] = "關心永遠不嫌多"
            
            results['total_elo'] += decision['elo']
            results['decisions'].append(decision)
        
        return results
    
    def export_to_json(self) -> str:
        """Export network data for frontend consumption."""
        return json.dumps({
            'members': [m.to_dict() for m in self.members],
            'network_info': {
                'name': 'Bayview-Hunters Point Care Network',
                'algorithm': 'Bayesian Inference',
                'reference': 'Russell & Norvig Ch.13'
            }
        }, indent=2, ensure_ascii=False)


# Game Integration Functions
def calculate_care_probability(evidence: Dict) -> float:
    """
    Calculate P(NeedsCare | Evidence) for dynamic game scenarios.
    
    Args:
        evidence: Dict with keys 'stress', 'connection', 'interaction', 'behavior'
    
    Returns:
        Probability as percentage (0-100)
    """
    member = CommunityMember(
        id='dynamic',
        name='Dynamic',
        name_zh='動態',
        location='Unknown',
        location_zh='未知',
        life_stress=EvidenceLevel(evidence.get('stress', 'medium')),
        social_connection=EvidenceLevel(evidence.get('connection', 'medium')),
        recent_interaction=EvidenceLevel(evidence.get('interaction', 'medium')),
        visible_behavior=EvidenceLevel(evidence.get('behavior', 'medium')),
        actual_needs_care=False,
        story_type='dynamic'
    )
    return member.care_probability


if __name__ == "__main__":
    # Demo: Initialize network and show probabilities
    network = BayesianCareNetwork()
    
    print("=" * 60)
    print("Journey of Kindness - Bayesian Network Demo")
    print("貝氏網路社區關懷需求預測")
    print("=" * 60)
    print()
    
    print("Community Members & Care Probabilities:")
    print("-" * 40)
    for name, prob in network.get_all_probabilities():
        bar = "█" * int(prob / 5) + "░" * (20 - int(prob / 5))
        print(f"{name:15} [{bar}] {prob:.0f}%")
    
    print()
    print("Key Insight: High probability ≠ actual need")
    print("關鍵洞察：高機率 ≠ 實際需求")
    print()
    
    # Export for frontend
    print("JSON Export for Frontend:")
    print(network.export_to_json()[:500] + "...")
