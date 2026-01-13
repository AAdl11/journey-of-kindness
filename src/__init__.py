"""
Journey of Kindness - AI Algorithm Package
善的旅程 - AI 演算法套件

This package contains Python implementations of AI algorithms
demonstrated in the Journey of Kindness educational game.

Modules:
- astar_search: A* Search algorithm (Level 1)
- bayesian_network: Bayesian Network inference (Level 5)
- mdp_maya: Markov Decision Process (Level 3)
- alpha_beta_pruning: Minimax with Alpha-Beta (Level 7)

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
"""

from .astar_search import AStarSearch, CommunityMap
from .bayesian_network import BayesianCareNetwork
from .mdp_maya import MayaMDP
from .alpha_beta_pruning import TrolleyMinimaxTree, TrolleyScenario

__version__ = "1.0.0"
__author__ = "Mei Hsien Hsu"
__all__ = [
    'AStarSearch',
    'CommunityMap', 
    'BayesianCareNetwork',
    'MayaMDP',
    'TrolleyMinimaxTree',
    'TrolleyScenario'
]
