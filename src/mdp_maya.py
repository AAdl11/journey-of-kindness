"""
Journey of Kindness - Markov Decision Process Module
馬可夫決策過程模組：用於 Level 3 Sister Maya 的故事

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
Semester: Fall 2025

This module implements the Markov Decision Process for modeling
Maya's transformation from aid recipient to community volunteer.

Reference: Russell & Norvig, Chapter 17 - Making Complex Decisions

Core Lesson: 「甘願做，歡喜受」
"Willing to do, happy to receive"
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import random
import json


class MayaState(Enum):
    """States in Maya's journey."""
    STRUGGLING = "struggling"           # Receiving food assistance
    CURIOUS = "curious"                 # Interested in volunteering
    LEARNING = "learning"               # Training as volunteer
    HELPING = "helping"                 # Active volunteer
    LEADING = "leading"                 # Community leader
    INSPIRING = "inspiring"             # Inspiring others


class MayaAction(Enum):
    """Actions available in each state."""
    STAY = "stay"                       # Remain in current state
    ACCEPT_HELP = "accept_help"         # Accept offered help
    ASK_QUESTIONS = "ask_questions"     # Show curiosity
    VOLUNTEER = "volunteer"             # Offer to help
    MENTOR = "mentor"                   # Help train others
    SHARE_STORY = "share_story"         # Share transformation story


@dataclass
class MDPTransition:
    """Represents a state transition in the MDP."""
    from_state: MayaState
    action: MayaAction
    to_state: MayaState
    probability: float
    reward: float
    narrative: Dict[str, str]  # Story text in en/zh


class MayaMDP:
    """
    Markov Decision Process for Maya's Transformation Story.
    
    This MDP models how small acts of kindness compound over time,
    transforming a person from someone who needs help to someone
    who helps others.
    
    The key insight: The optimal policy isn't just about maximizing
    reward - it's about recognizing that giving and receiving are
    part of the same cycle.
    """
    
    def __init__(self, discount_factor: float = 0.9):
        self.gamma = discount_factor
        self.states = list(MayaState)
        self.actions = list(MayaAction)
        self.transitions: List[MDPTransition] = []
        self.values: Dict[MayaState, float] = {}
        self.policy: Dict[MayaState, MayaAction] = {}
        
        self._initialize_transitions()
        self._initialize_values()
    
    def _initialize_transitions(self):
        """Define the transition model with narratives."""
        
        # From STRUGGLING
        self.transitions.extend([
            MDPTransition(
                MayaState.STRUGGLING, MayaAction.STAY, MayaState.STRUGGLING,
                0.7, -5,
                {'en': "Maya continues to struggle alone.",
                 'zh': "Maya 繼續獨自掙扎。"}
            ),
            MDPTransition(
                MayaState.STRUGGLING, MayaAction.ACCEPT_HELP, MayaState.CURIOUS,
                0.8, 10,
                {'en': "Maya accepts the food box. Sister Roxanne smiles: 'Would you like to help next time?'",
                 'zh': "Maya 接受了食物箱。Roxanne 師姊微笑：『下次要不要一起來幫忙？』"}
            ),
        ])
        
        # From CURIOUS
        self.transitions.extend([
            MDPTransition(
                MayaState.CURIOUS, MayaAction.ASK_QUESTIONS, MayaState.LEARNING,
                0.9, 15,
                {'en': "Maya asks how she can help. She joins the volunteer training.",
                 'zh': "Maya 問她可以怎麼幫忙。她加入了志工培訓。"}
            ),
            MDPTransition(
                MayaState.CURIOUS, MayaAction.STAY, MayaState.STRUGGLING,
                0.3, -10,
                {'en': "Without connection, Maya drifts back to isolation.",
                 'zh': "沒有連結，Maya 又回到孤立。"}
            ),
        ])
        
        # From LEARNING
        self.transitions.extend([
            MDPTransition(
                MayaState.LEARNING, MayaAction.VOLUNTEER, MayaState.HELPING,
                0.85, 25,
                {'en': "Maya helps pack food boxes. She feels useful for the first time in years.",
                 'zh': "Maya 幫忙打包食物箱。多年來第一次感到自己有用。"}
            ),
            MDPTransition(
                MayaState.LEARNING, MayaAction.STAY, MayaState.CURIOUS,
                0.4, 0,
                {'en': "Maya hesitates. Maybe she's not ready yet.",
                 'zh': "Maya 猶豫了。也許她還沒準備好。"}
            ),
        ])
        
        # From HELPING
        self.transitions.extend([
            MDPTransition(
                MayaState.HELPING, MayaAction.MENTOR, MayaState.LEADING,
                0.8, 40,
                {'en': "Maya now trains new volunteers. Her son joins her every Saturday.",
                 'zh': "Maya 現在培訓新志工。她的兒子每週六都跟她一起來。"}
            ),
            MDPTransition(
                MayaState.HELPING, MayaAction.VOLUNTEER, MayaState.HELPING,
                0.9, 20,
                {'en': "Maya continues to serve with joy.",
                 'zh': "Maya 繼續歡喜地服務。"}
            ),
        ])
        
        # From LEADING
        self.transitions.extend([
            MDPTransition(
                MayaState.LEADING, MayaAction.SHARE_STORY, MayaState.INSPIRING,
                0.95, 100,
                {'en': "Maya shares her story at the community center. Three new volunteers sign up.",
                 'zh': "Maya 在社區中心分享她的故事。三位新志工報名加入。"}
            ),
            MDPTransition(
                MayaState.LEADING, MayaAction.MENTOR, MayaState.LEADING,
                0.85, 50,
                {'en': "Maya continues to guide others on their journey.",
                 'zh': "Maya 繼續引導其他人走上旅程。"}
            ),
        ])
        
        # From INSPIRING (terminal state with ongoing impact)
        self.transitions.extend([
            MDPTransition(
                MayaState.INSPIRING, MayaAction.SHARE_STORY, MayaState.INSPIRING,
                1.0, 200,
                {'en': "The cycle continues. Those Maya helped now help others.",
                 'zh': "循環繼續。Maya 幫助過的人現在幫助其他人。"}
            ),
        ])
    
    def _initialize_values(self):
        """Initialize state values for value iteration."""
        for state in self.states:
            self.values[state] = 0.0
    
    def get_transitions(self, state: MayaState, action: MayaAction) -> List[MDPTransition]:
        """Get all possible transitions for a state-action pair."""
        return [t for t in self.transitions 
                if t.from_state == state and t.action == action]
    
    def get_available_actions(self, state: MayaState) -> List[MayaAction]:
        """Get available actions in a state."""
        return list(set(t.action for t in self.transitions if t.from_state == state))
    
    def value_iteration(self, iterations: int = 100, threshold: float = 0.01) -> Dict[MayaState, float]:
        """
        Perform value iteration to find optimal values.
        
        V(s) = max_a Σ P(s'|s,a) [R(s,a,s') + γV(s')]
        """
        for _ in range(iterations):
            delta = 0
            new_values = {}
            
            for state in self.states:
                if not self.get_available_actions(state):
                    new_values[state] = self.values[state]
                    continue
                
                max_value = float('-inf')
                
                for action in self.get_available_actions(state):
                    action_value = 0
                    for trans in self.get_transitions(state, action):
                        action_value += trans.probability * (
                            trans.reward + self.gamma * self.values[trans.to_state]
                        )
                    max_value = max(max_value, action_value)
                
                new_values[state] = max_value
                delta = max(delta, abs(new_values[state] - self.values[state]))
            
            self.values = new_values
            
            if delta < threshold:
                break
        
        return self.values
    
    def extract_policy(self) -> Dict[MayaState, MayaAction]:
        """Extract optimal policy from computed values."""
        for state in self.states:
            actions = self.get_available_actions(state)
            if not actions:
                continue
            
            best_action = None
            best_value = float('-inf')
            
            for action in actions:
                action_value = 0
                for trans in self.get_transitions(state, action):
                    action_value += trans.probability * (
                        trans.reward + self.gamma * self.values[trans.to_state]
                    )
                
                if action_value > best_value:
                    best_value = action_value
                    best_action = action
            
            self.policy[state] = best_action
        
        return self.policy
    
    def simulate_journey(self, start_state: MayaState = MayaState.STRUGGLING) -> List[Dict]:
        """
        Simulate Maya's journey following the optimal policy.
        
        Returns a narrative of her transformation.
        """
        current_state = start_state
        journey = []
        max_steps = 10
        
        for step in range(max_steps):
            if current_state not in self.policy:
                break
            
            action = self.policy[current_state]
            transitions = self.get_transitions(current_state, action)
            
            if not transitions:
                break
            
            # Choose transition based on probability
            r = random.random()
            cumulative = 0
            chosen_trans = transitions[0]
            
            for trans in transitions:
                cumulative += trans.probability
                if r <= cumulative:
                    chosen_trans = trans
                    break
            
            journey.append({
                'step': step + 1,
                'state': current_state.value,
                'action': action.value,
                'next_state': chosen_trans.to_state.value,
                'reward': chosen_trans.reward,
                'narrative': chosen_trans.narrative
            })
            
            current_state = chosen_trans.to_state
            
            if current_state == MayaState.INSPIRING:
                break
        
        return journey
    
    def export_for_frontend(self) -> str:
        """Export MDP data for frontend visualization."""
        return json.dumps({
            'states': [s.value for s in self.states],
            'values': {s.value: round(v, 2) for s, v in self.values.items()},
            'policy': {s.value: a.value for s, a in self.policy.items()},
            'transitions': [
                {
                    'from': t.from_state.value,
                    'action': t.action.value,
                    'to': t.to_state.value,
                    'probability': t.probability,
                    'reward': t.reward,
                    'narrative': t.narrative
                }
                for t in self.transitions
            ],
            'lesson': {
                'en': "Willing to do, happy to receive",
                'zh': "甘願做，歡喜受"
            }
        }, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    print("=" * 60)
    print("Journey of Kindness - MDP Demo")
    print("Level 3: Sister Maya's Transformation")
    print("=" * 60)
    print()
    
    mdp = MayaMDP()
    
    print("Running Value Iteration...")
    values = mdp.value_iteration()
    print()
    
    print("Optimal State Values:")
    print("-" * 40)
    for state, value in sorted(values.items(), key=lambda x: x[1], reverse=True):
        print(f"  {state.value:15} : {value:8.2f}")
    print()
    
    print("Extracting Optimal Policy...")
    policy = mdp.extract_policy()
    print()
    
    print("Optimal Policy:")
    print("-" * 40)
    for state, action in policy.items():
        print(f"  {state.value:15} → {action.value}")
    print()
    
    print("Simulating Maya's Journey:")
    print("-" * 40)
    journey = mdp.simulate_journey()
    for step in journey:
        print(f"Step {step['step']}: {step['state']} --[{step['action']}]--> {step['next_state']}")
        print(f"         {step['narrative']['zh']}")
        print()
    
    print("=" * 60)
    print("Core Lesson 核心教訓: 「甘願做，歡喜受」")
    print("Willing to do, happy to receive")
    print("=" * 60)
