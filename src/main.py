"""
Journey of Kindness - Main Application Entry Point
善的旅程 - 主程式入口

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
Semester: Fall 2025

This is the main entry point for the Journey of Kindness AI education game.
It demonstrates the integration of multiple AI algorithms with real
community service stories from Bayview-Hunters Point, San Francisco.

Algorithms Implemented:
- Level 1: A* Search (Mrs. Garcia's Meal Delivery)
- Level 2: Propositional Logic (Happy Campus Perfect Attendance)
- Level 3: Markov Decision Process (Sister Maya's Transformation)
- Level 4: Knowledge-Based Agent / Wumpus World (RV Park Exploration)
- Level 5: Bayesian Network (Community Care Prediction)
- Level 6: First-Order Logic (Marcus's Volunteer Matching)
- Level 7: Alpha-Beta Pruning (Trolley Dilemma / AI Ethics)

Reference: Russell & Norvig, "Artificial Intelligence: A Modern Approach"
"""

import sys
import json
from pathlib import Path

# Import all algorithm modules
from astar_search import AStarSearch, CommunityMap
from bayesian_network import BayesianCareNetwork, calculate_care_probability
from alpha_beta_pruning import TrolleyMinimaxTree, TrolleyScenario
from mdp_maya import MayaMDP


def print_banner():
    """Print the Journey of Kindness banner."""
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║     🪷  Journey of Kindness  善的旅程  🪷                      ║
    ║                                                               ║
    ║     AI Education Game                                         ║
    ║     Learn 7 AI algorithms through real community stories      ║
    ║                                                               ║
    ║     Author: Mei Hsien Hsu 許美嫻                               ║
    ║     Course: CS4 Introduction to AI                            ║
    ║     Professor: An Lam                                         ║
    ║     Institution: Las Positas College, Honors Program          ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def demo_all_algorithms():
    """Run demonstrations of all implemented algorithms."""
    
    print("\n" + "=" * 70)
    print("DEMONSTRATION OF ALL AI ALGORITHMS")
    print("=" * 70)
    
    # Level 1: A* Search
    print("\n📍 LEVEL 1: A* Search - Mrs. Garcia's Meal Delivery")
    print("-" * 50)
    community = CommunityMap()
    search = AStarSearch(community)
    path = search.search('start', 'garcia')
    print(f"   Optimal path: {' → '.join(path)}")
    print(f"   Lesson: 最短路徑，不一定是最好的路")
    
    # Level 3: MDP
    print("\n📍 LEVEL 3: MDP - Sister Maya's Transformation")
    print("-" * 50)
    mdp = MayaMDP()
    mdp.value_iteration()
    policy = mdp.extract_policy()
    print(f"   States: {len(mdp.states)}, Optimal policy computed")
    print(f"   Lesson: 甘願做，歡喜受")
    
    # Level 5: Bayesian Network
    print("\n📍 LEVEL 5: Bayesian Network - Community Care")
    print("-" * 50)
    network = BayesianCareNetwork()
    for name, prob in network.get_all_probabilities()[:3]:
        print(f"   {name}: {prob:.0f}% care probability")
    print(f"   Lesson: 被愛的人，學會去愛")
    
    # Level 7: Alpha-Beta Pruning
    print("\n📍 LEVEL 7: Alpha-Beta Pruning - Trolley Dilemma")
    print("-" * 50)
    scenario = TrolleyScenario(5, 1, 15, True)
    tree = TrolleyMinimaxTree(scenario)
    recommendations = tree.get_ai_recommendations()
    print(f"   AI Advisors: {len(recommendations)} different perspectives")
    print(f"   Lesson: AI 可以計算，但只有人可以選擇慈悲")
    
    print("\n" + "=" * 70)
    print("END OF DEMONSTRATION")
    print("=" * 70)


def export_all_data():
    """Export all algorithm data as JSON for frontend integration."""
    
    data = {
        'metadata': {
            'title': 'Journey of Kindness',
            'title_zh': '善的旅程',
            'author': 'Mei Hsien Hsu 許美嫻',
            'course': 'CS4 Introduction to AI',
            'professor': 'An Lam',
            'institution': 'Las Positas College',
            'semester': 'Fall 2025'
        },
        'algorithms': {}
    }
    
    # A* Search
    community = CommunityMap()
    search = AStarSearch(community)
    search.search('start', 'garcia')
    data['algorithms']['astar'] = json.loads(search.export_search_visualization())
    
    # Bayesian Network
    network = BayesianCareNetwork()
    data['algorithms']['bayesian'] = json.loads(network.export_to_json())
    
    # MDP
    mdp = MayaMDP()
    mdp.value_iteration()
    mdp.extract_policy()
    data['algorithms']['mdp'] = json.loads(mdp.export_for_frontend())
    
    # Alpha-Beta
    scenario = TrolleyScenario(5, 1, 15, True)
    tree = TrolleyMinimaxTree(scenario)
    data['algorithms']['alpha_beta'] = json.loads(tree.export_tree_visualization())
    
    return json.dumps(data, ensure_ascii=False, indent=2)


def main():
    """Main entry point."""
    print_banner()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'demo':
            demo_all_algorithms()
        elif command == 'export':
            print(export_all_data())
        elif command == 'help':
            print("Usage: python main.py [command]")
            print("Commands:")
            print("  demo   - Run demonstrations of all algorithms")
            print("  export - Export algorithm data as JSON")
            print("  help   - Show this help message")
        else:
            print(f"Unknown command: {command}")
            print("Use 'python main.py help' for usage information")
    else:
        # Default: run demo
        demo_all_algorithms()
        
        print("\n🪷 Thank you for exploring Journey of Kindness!")
        print("   Visit: https://aadl11.github.io/journey-of-kindness/")
        print()


if __name__ == "__main__":
    main()
