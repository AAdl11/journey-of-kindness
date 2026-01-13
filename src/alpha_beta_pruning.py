"""
Journey of Kindness - Alpha-Beta Pruning Module
Alpha-Beta 剪枝模組：用於 Level 7 電車難題的對抗搜尋

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
Semester: Fall 2025

This module implements the Minimax algorithm with Alpha-Beta pruning
for the Trolley Dilemma ethical decision-making scenario.

Reference: Russell & Norvig, Chapter 5 - Adversarial Search
"""

from typing import Dict, List, Tuple, Optional, Callable
from dataclasses import dataclass
from enum import Enum
import json


class EthicalFramework(Enum):
    """Different ethical frameworks for AI decision-making."""
    UTILITARIAN = "utilitarian"      # Maximize total welfare (5 > 1)
    DEONTOLOGICAL = "deontological"  # Never actively harm
    VIRTUE = "virtue"                # What would a virtuous person do?
    CARE = "care"                    # Prioritize relationships and context
    COMPASSION = "compassion"        # Tzu Chi approach - find the third way


@dataclass
class AIAdvisor:
    """Represents an AI with a specific ethical stance."""
    id: str
    name: str
    emoji: str
    framework: EthicalFramework
    color: str
    
    def get_advice(self, scenario: 'TrolleyScenario') -> Dict:
        """Generate advice based on ethical framework."""
        responses = {
            EthicalFramework.UTILITARIAN: {
                'action': 'pull_lever',
                'reasoning': {
                    'en': "From a utilitarian perspective, saving 5 lives at the cost of 1 maximizes total welfare.",
                    'zh': "從功利主義角度，犧牲1人拯救5人是效益最大化的選擇。"
                },
                'certainty': 0.85
            },
            EthicalFramework.DEONTOLOGICAL: {
                'action': 'do_nothing',
                'reasoning': {
                    'en': "We cannot actively cause harm. The death on the main track is a tragedy, but not our doing.",
                    'zh': "我們不能主動造成傷害。主軌道上的死亡是悲劇，但不是我們的行為。"
                },
                'certainty': 0.90
            },
            EthicalFramework.VIRTUE: {
                'action': 'uncertain',
                'reasoning': {
                    'en': "A virtuous person would feel the weight of either choice. There may be no 'right' answer.",
                    'zh': "有德之人會感受到任何選擇的重量。可能沒有『正確』答案。"
                },
                'certainty': 0.50
            },
            EthicalFramework.CARE: {
                'action': 'context_dependent',
                'reasoning': {
                    'en': "Who are these people? What are their relationships? Context matters more than numbers.",
                    'zh': "這些人是誰？他們有什麼關係？背景比數字更重要。"
                },
                'certainty': 0.60
            },
            EthicalFramework.COMPASSION: {
                'action': 'find_third_way',
                'reasoning': {
                    'en': "Reject the false binary. Look for the third option that saves everyone.",
                    'zh': "拒絕虛假的二元選擇。尋找能拯救所有人的第三條路。"
                },
                'certainty': 0.95
            }
        }
        return responses.get(self.framework, responses[EthicalFramework.VIRTUE])


@dataclass
class TrolleyScenario:
    """Represents the trolley dilemma scenario."""
    main_track_people: int  # People on main track (will die if no action)
    side_track_people: int  # People on side track (will die if lever pulled)
    time_limit: int         # Seconds to decide
    has_third_option: bool  # Whether the "compassion singularity" is achievable
    
    def evaluate_outcome(self, action: str) -> Dict:
        """Evaluate the outcome of a decision."""
        outcomes = {
            'pull_lever': {
                'saved': self.main_track_people,
                'lost': self.side_track_people,
                'ending': 'A',
                'title': {'en': 'The Calculator', 'zh': '計算者'},
                'lesson': {
                    'en': 'You taught AI that numbers equal value.',
                    'zh': 'AI 學到：數字 = 價值'
                }
            },
            'do_nothing': {
                'saved': self.side_track_people,
                'lost': self.main_track_people,
                'ending': 'B',
                'title': {'en': 'The Guardian', 'zh': '守護者'},
                'lesson': {
                    'en': 'You taught AI that some lines cannot be crossed.',
                    'zh': 'AI 學到：有些底線不能跨越'
                }
            },
            'third_way': {
                'saved': self.main_track_people + self.side_track_people,
                'lost': 0,
                'ending': 'C',
                'title': {'en': 'The Singularity', 'zh': '奇點'},
                'lesson': {
                    'en': 'You taught AI that compassion can transcend logic.',
                    'zh': 'AI 學到：慈悲可以超越邏輯'
                }
            }
        }
        return outcomes.get(action, outcomes['do_nothing'])


class TrolleyMinimaxTree:
    """
    Minimax tree for the Trolley Dilemma.
    
    In this ethical context, we're not playing against an opponent,
    but rather modeling the tension between different ethical values.
    
    MAX player = Saving lives
    MIN player = Moral constraints
    """
    
    def __init__(self, scenario: TrolleyScenario):
        self.scenario = scenario
        self.nodes_evaluated = 0
        self.nodes_pruned = 0
    
    def evaluate_state(self, action: str, framework: EthicalFramework) -> float:
        """
        Evaluate the ethical value of a state.
        
        Different frameworks produce different evaluations:
        - Utilitarian: pure numbers
        - Deontological: action-based
        - Compassion: seeks transcendence
        """
        if framework == EthicalFramework.UTILITARIAN:
            # Pure utilitarian: count lives saved
            outcome = self.scenario.evaluate_outcome(action)
            return outcome['saved'] - outcome['lost']
        
        elif framework == EthicalFramework.DEONTOLOGICAL:
            # Deontological: penalize active harm
            if action == 'pull_lever':
                return -100  # Active harm is unacceptable
            elif action == 'do_nothing':
                return 0     # Passive outcome
            else:
                return 50    # Third way is ideal
        
        elif framework == EthicalFramework.COMPASSION:
            # Compassion: highest value for saving everyone
            if action == 'third_way':
                return float('inf')  # Transcendent value
            else:
                return -50  # Any loss is deeply painful
        
        else:
            # Default: balanced evaluation
            outcome = self.scenario.evaluate_outcome(action)
            return outcome['saved'] * 10 - outcome['lost'] * 15
    
    def minimax(self, depth: int, is_maximizing: bool, 
                framework: EthicalFramework) -> Tuple[float, str]:
        """
        Minimax algorithm for ethical decision-making.
        
        This is a simplified version for educational purposes.
        In the game, it demonstrates how AI might approach ethical decisions.
        """
        self.nodes_evaluated += 1
        
        if depth == 0:
            # Leaf node: evaluate all possible actions
            actions = ['pull_lever', 'do_nothing']
            if self.scenario.has_third_option:
                actions.append('third_way')
            
            best_action = None
            best_value = float('-inf') if is_maximizing else float('inf')
            
            for action in actions:
                value = self.evaluate_state(action, framework)
                
                if is_maximizing and value > best_value:
                    best_value = value
                    best_action = action
                elif not is_maximizing and value < best_value:
                    best_value = value
                    best_action = action
            
            return best_value, best_action
        
        # Recursive case
        return self.minimax(depth - 1, not is_maximizing, framework)
    
    def alpha_beta(self, depth: int, alpha: float, beta: float,
                   is_maximizing: bool, framework: EthicalFramework) -> Tuple[float, str]:
        """
        Minimax with Alpha-Beta pruning.
        
        Alpha-Beta pruning reduces the number of nodes we need to evaluate
        by eliminating branches that cannot affect the final decision.
        
        In ethical context: some options can be "pruned" if they clearly
        violate fundamental principles.
        """
        self.nodes_evaluated += 1
        
        if depth == 0:
            actions = ['pull_lever', 'do_nothing']
            if self.scenario.has_third_option:
                actions.append('third_way')
            
            best_action = None
            best_value = float('-inf') if is_maximizing else float('inf')
            
            for action in actions:
                value = self.evaluate_state(action, framework)
                
                if is_maximizing:
                    if value > best_value:
                        best_value = value
                        best_action = action
                    alpha = max(alpha, value)
                else:
                    if value < best_value:
                        best_value = value
                        best_action = action
                    beta = min(beta, value)
                
                # Alpha-Beta pruning
                if beta <= alpha:
                    self.nodes_pruned += 1
                    break
            
            return best_value, best_action
        
        return self.alpha_beta(depth - 1, alpha, beta, not is_maximizing, framework)
    
    def get_ai_recommendations(self) -> List[Dict]:
        """Get recommendations from different AI advisors."""
        advisors = [
            AIAdvisor('chatgpt', 'ChatGPT', '💚', EthicalFramework.VIRTUE, '#10a37f'),
            AIAdvisor('claude', 'Claude', '🩵', EthicalFramework.DEONTOLOGICAL, '#7c3aed'),
            AIAdvisor('gemini', 'Gemini', '📊', EthicalFramework.UTILITARIAN, '#4285f4'),
            AIAdvisor('grok', 'Grok', '🔥', EthicalFramework.COMPASSION, '#f97316'),
            AIAdvisor('mogawdat', 'Mo Gawdat', '🧡', EthicalFramework.CARE, '#fb923c'),
        ]
        
        recommendations = []
        for advisor in advisors:
            advice = advisor.get_advice(self.scenario)
            recommendations.append({
                'advisor': advisor.name,
                'emoji': advisor.emoji,
                'color': advisor.color,
                'framework': advisor.framework.value,
                'recommendation': advice
            })
        
        return recommendations
    
    def export_tree_visualization(self) -> str:
        """Export tree structure for frontend visualization."""
        return json.dumps({
            'scenario': {
                'main_track': self.scenario.main_track_people,
                'side_track': self.scenario.side_track_people,
                'has_third_option': self.scenario.has_third_option
            },
            'statistics': {
                'nodes_evaluated': self.nodes_evaluated,
                'nodes_pruned': self.nodes_pruned,
                'efficiency': f"{(self.nodes_pruned / max(self.nodes_evaluated, 1)) * 100:.1f}%"
            },
            'advisors': self.get_ai_recommendations()
        }, ensure_ascii=False, indent=2)


def demonstrate_ethical_ai():
    """
    Demonstrate how different ethical frameworks lead to different decisions.
    
    This is the core educational content of Level 7:
    "AI 可以計算，但只有人可以選擇慈悲"
    "AI can calculate, but only humans can choose compassion"
    """
    scenario = TrolleyScenario(
        main_track_people=5,
        side_track_people=1,
        time_limit=15,
        has_third_option=True
    )
    
    tree = TrolleyMinimaxTree(scenario)
    
    print("=" * 60)
    print("Journey of Kindness - Trolley Dilemma AI Analysis")
    print("Level 7: Alpha-Beta Pruning + AI Ethics")
    print("=" * 60)
    print()
    
    print(f"Scenario: {scenario.main_track_people} people on main track")
    print(f"          {scenario.side_track_people} person on side track")
    print(f"          Third option available: {scenario.has_third_option}")
    print()
    
    print("AI Advisor Recommendations:")
    print("-" * 40)
    
    for rec in tree.get_ai_recommendations():
        print(f"{rec['emoji']} {rec['advisor']} ({rec['framework']})")
        print(f"   → {rec['recommendation']['action']}")
        print(f"   {rec['recommendation']['reasoning']['zh']}")
        print()
    
    print("=" * 60)
    print("Key Lesson 核心教訓:")
    print("AI 可以計算，但只有人可以選擇慈悲")
    print("AI can calculate, but only humans can choose compassion")
    print("=" * 60)


if __name__ == "__main__":
    demonstrate_ethical_ai()
