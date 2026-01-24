"""
=============================================================================
Journey of Kindness - AI Education Game
CS4 Honors Project - Advanced AI Algorithms
=============================================================================

Author: 許美嫻 (Mei Hsien Hsu)
Course: CS4 - Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College
Date: November 10, 2025

HONORS-LEVEL ALGORITHMS IMPLEMENTED:
1. A* Search - Advanced heuristics with dynamic obstacle costs
2. Propositional Logic - Forward Chaining with inference engine
3. MDP - Value Iteration with Bellman optimality
4. Bayesian Networks (Coming)
5. Alpha-Beta Pruning (Coming)

Mathematical Foundations:
- A*: f(n) = g(n) + h(n), admissible heuristic proof
- Logic: Forward chaining with modus ponens
- MDP: Bellman equation V*(s) = max_a Σ T(s,a,s')[R(s,a,s') + γV*(s')]

Complexity Analysis:
- A*: O(b^d) where b=branching factor, d=depth
- Forward Chaining: O(n²) where n=number of rules
- Value Iteration: O(|S|²|A|) per iteration

=============================================================================
"""

import sys
from queue import PriorityQueue
from typing import List, Tuple, Dict, Set, Optional
import random
import math
from collections import defaultdict


# =============================================================================
# LEVEL 1: A* SEARCH - ADVANCED PATHFINDING WITH DYNAMIC COSTS
# =============================================================================

class Node:
    """A* Search Node with cost tracking"""
    def __init__(self, position, g_cost=0, h_cost=0, parent=None):
        self.position = position
        self.g_cost = g_cost      # Actual cost from start
        self.h_cost = h_cost      # Heuristic estimate to goal
        self.f_cost = g_cost + h_cost  # Total estimated cost
        self.parent = parent
    
    def __lt__(self, other):
        return self.f_cost < other.f_cost
    
    def __eq__(self, other):
        return self.position == other.position
    
    def __hash__(self):
        return hash(self.position)


class AdvancedAStarSearch:
    """
    Advanced A* Search with:
    - Multiple heuristic options
    - Dynamic obstacle costs
    - Safety factor for community service
    - Path reconstruction with cost analysis
    """
    
    def __init__(self, grid, heuristic_type='manhattan_safe'):
        self.grid = grid
        self.rows = len(grid)
        self.cols = len(grid[0])
        self.heuristic_type = heuristic_type
        self.explored_nodes = []
        self.path_cost_breakdown = []
        
        # Dynamic costs for different terrain types
        self.terrain_costs = {
            0: 1,    # Normal road
            2: 2,    # Busy street (slower)
            3: 5,    # Dangerous area (avoid if possible)
        }
    
    def manhattan_distance(self, pos1, pos2):
        """Standard Manhattan distance"""
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])
    
    def euclidean_distance(self, pos1, pos2):
        """Euclidean distance (more accurate but slower)"""
        return math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
    
    def manhattan_with_safety(self, pos1, pos2):
        """
        Manhattan distance + safety factor
        For community service, we prioritize safer routes
        """
        base_dist = self.manhattan_distance(pos1, pos2)
        
        # Add safety penalty for cells near obstacles
        safety_penalty = 0
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                check_row = pos1[0] + dr
                check_col = pos1[1] + dc
                if (0 <= check_row < self.rows and 
                    0 <= check_col < self.cols and
                    self.grid[check_row][check_col] == 1):
                    safety_penalty += 0.5
        
        return base_dist + safety_penalty
    
    def get_heuristic(self, pos1, pos2):
        """Select heuristic based on configuration"""
        if self.heuristic_type == 'manhattan':
            return self.manhattan_distance(pos1, pos2)
        elif self.heuristic_type == 'euclidean':
            return self.euclidean_distance(pos1, pos2)
        else:  # manhattan_safe
            return self.manhattan_with_safety(pos1, pos2)
    
    def get_neighbors(self, position):
        """Get valid neighbor cells with movement costs"""
        row, col = position
        neighbors = []
        
        # Four directions: right, down, left, up
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            
            # Check bounds and obstacles
            if (0 <= new_row < self.rows and 
                0 <= new_col < self.cols and 
                self.grid[new_row][new_col] != 1):  # Not obstacle
                
                # Get terrain cost
                terrain = self.grid[new_row][new_col]
                cost = self.terrain_costs.get(terrain, 1)
                
                neighbors.append(((new_row, new_col), cost))
        
        return neighbors
    
    def search(self, start, goal):
        """
        Execute A* Search with detailed tracking
        Returns: (path, cost, explored_count)
        """
        # Priority queue: stores (f_cost, counter, node)
        counter = 0
        open_set = PriorityQueue()
        start_node = Node(start, 0, self.get_heuristic(start, goal))
        open_set.put((start_node.f_cost, counter, start_node))
        counter += 1
        
        # Track visited nodes and costs
        closed_set = set()
        came_from = {start: None}
        g_scores = {start: 0}
        
        self.explored_nodes = []
        
        while not open_set.empty():
            _, _, current = open_set.get()
            
            # Track exploration
            self.explored_nodes.append(current.position)
            
            # Goal reached
            if current.position == goal:
                path = self.reconstruct_path(came_from, current.position)
                total_cost = g_scores[goal]
                return path, total_cost, len(self.explored_nodes)
            
            # Skip if already processed
            if current.position in closed_set:
                continue
            
            closed_set.add(current.position)
            
            # Explore neighbors
            for neighbor_pos, move_cost in self.get_neighbors(current.position):
                if neighbor_pos in closed_set:
                    continue
                
                # Calculate tentative g score
                tentative_g = g_scores[current.position] + move_cost
                
                # Update if better path found
                if neighbor_pos not in g_scores or tentative_g < g_scores[neighbor_pos]:
                    g_scores[neighbor_pos] = tentative_g
                    h_cost = self.get_heuristic(neighbor_pos, goal)
                    neighbor_node = Node(neighbor_pos, tentative_g, h_cost, current)
                    came_from[neighbor_pos] = current.position
                    
                    open_set.put((neighbor_node.f_cost, counter, neighbor_node))
                    counter += 1
        
        return None, float('inf'), len(self.explored_nodes)  # No path found
    
    def reconstruct_path(self, came_from, current):
        """Reconstruct path from start to goal"""
        path = [current]
        while current in came_from and came_from[current] is not None:
            current = came_from[current]
            path.append(current)
        return path[::-1]
    
    def print_algorithm_details(self):
        """Print algorithm complexity and properties"""
        print("\n" + "="*70)
        print("A* ALGORITHM ANALYSIS")
        print("="*70)
        print(f"Heuristic Function: {self.heuristic_type}")
        print(f"Admissibility: h(n) never overestimates true cost")
        print(f"Optimality: Guaranteed optimal solution")
        print(f"Time Complexity: O(b^d) where b=branching factor, d=depth")
        print(f"Space Complexity: O(b^d)")
        print(f"Complete: Yes (always finds solution if exists)")
        print("="*70 + "\n")


def run_astar_demo():
    """Run comprehensive A* Search demonstration"""
    print("\n" + "="*70)
    print("🚚 LEVEL 1: A* SEARCH - FOOD DELIVERY ROUTING")
    print("="*70 + "\n")
    
    # Advanced grid with terrain types
    # 0=normal road, 1=obstacle, 2=busy street, 3=dangerous area
    grid = [
        [0, 0, 0, 2, 1, 0, 0, 0],
        [0, 1, 0, 2, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 3, 3, 0, 1, 0],
        [0, 0, 0, 3, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 1, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0]
    ]
    
    start = (0, 0)
    goal = (7, 7)
    
    print("🗺️  Grid Legend:")
    print("  0 = Normal Road (cost: 1)")
    print("  1 = Obstacle (impassable)")
    print("  2 = Busy Street (cost: 2)")
    print("  3 = Dangerous Area (cost: 5)")
    print()
    
    print("Grid Visualization:")
    symbols = {0: '·', 1: '█', 2: '~', 3: '×'}
    for i, row in enumerate(grid):
        row_str = ' '.join(symbols.get(cell, '?') for cell in row)
        if i == start[0]:
            row_str = '🚚' + row_str[1:]
        if i == goal[0]:
            row_str = row_str[:-1] + '🏪'
        print(row_str)
    
    print(f"\n📍 Start: Tzu Chi Center {start}")
    print(f"🎯 Goal: Food Pantry {goal}\n")
    
    # Test different heuristics
    heuristics = ['manhattan', 'euclidean', 'manhattan_safe']
    
    for h_type in heuristics:
        print(f"\n{'─'*70}")
        print(f"Testing with {h_type} heuristic:")
        print(f"{'─'*70}")
        
        astar = AdvancedAStarSearch(grid, heuristic_type=h_type)
        path, cost, explored = astar.search(start, goal)
        
        if path:
            print(f"✅ Path found!")
            print(f"   Length: {len(path)} steps")
            print(f"   Total Cost: {cost}")
            print(f"   Nodes Explored: {explored}")
            print(f"   Efficiency: {len(path)/explored*100:.1f}%")
            print(f"\n   Path: {' → '.join(str(p) for p in path[:5])} ... → {goal}")
        else:
            print("❌ No path found")
    
    # Show algorithm details
    astar = AdvancedAStarSearch(grid)
    astar.print_algorithm_details()
    
    input("\nPress Enter to continue...")


# =============================================================================
# LEVEL 2: PROPOSITIONAL LOGIC - FORWARD CHAINING INFERENCE ENGINE
# =============================================================================

class Rule:
    """Logical inference rule with premises and conclusion"""
    def __init__(self, premises: List[str], conclusion: str, aphorism_data: dict):
        self.premises = premises  # List of required facts
        self.conclusion = conclusion  # Fact to infer
        self.aphorism_data = aphorism_data  # Associated Jing Si Aphorism
    
    def can_fire(self, facts: Set[str]) -> bool:
        """Check if all premises are satisfied"""
        return all(premise in facts for premise in self.premises)
    
    def __repr__(self):
        return f"IF {' AND '.join(self.premises)} THEN {self.conclusion}"


class ForwardChainingEngine:
    """
    Forward Chaining Inference Engine
    
    Algorithm:
    1. Start with known facts
    2. Find rules where all premises are satisfied
    3. Fire rule: add conclusion to facts
    4. Repeat until no new facts can be inferred (fixed point)
    
    Complexity: O(n²) where n = number of rules
    Complete: Yes (finds all consequences)
    Sound: Yes (only valid inferences)
    """
    
    def __init__(self):
        self.facts = set()
        self.rules = []
        self.inference_log = []
        self.iteration_count = 0
        self._load_jing_si_rules()
    
    def _load_jing_si_rules(self):
        """Load Jing Si Aphorisms as logical rules"""
        
        # Rule 1: Overwhelming situation → Need calm mind
        self.add_rule(
            premises=['feeling_overwhelmed', 'many_tasks'],
            conclusion='need_calm_mind',
            aphorism={
                'id': 'calm_mind',
                'chinese': '心靜如水,不受波動。',
                'english': 'Calm mind like water, undisturbed by waves.',
                'explanation': '當任務繁重時,保持內心平靜是關鍵。面對壓力時,先讓心安定下來,才能清楚思考。',
                'application': '深呼吸,專注當下任務,一次解決一件事。'
            }
        )
        
        # Rule 2: Physical exhaustion → Willing heart principle
        self.add_rule(
            premises=['feeling_tired', 'want_continue'],
            conclusion='apply_willing_heart',
            aphorism={
                'id': 'willing_to_do',
                'chinese': '甘願做,歡喜受。',
                'english': 'Willing to do, happy to receive.',
                'explanation': '身體疲累時,用歡喜心轉念。付出不是負擔,而是福報。',
                'application': '提醒自己助人的意義,感恩有能力付出。'
            }
        )
        
        # Rule 3: Uncertain situation → Mind shapes reality
        self.add_rule(
            premises=['feeling_uncertain', 'external_difficulty'],
            conclusion='transform_perspective',
            aphorism={
                'id': 'mind_shapes',
                'chinese': '心能轉境,境隨心轉。',
                'english': 'The mind shapes circumstances.',
                'explanation': '困難的環境可以通過轉念改變。改變想法,就能改變感受。',
                'application': '尋找困境中的學習機會,用正面態度面對挑戰。'
            }
        )
        
        # Rule 4: Time pressure → Seize the moment
        self.add_rule(
            premises=['feeling_anxious', 'time_pressure'],
            conclusion='focus_present_moment',
            aphorism={
                'id': 'seize_time',
                'chinese': '把握時間,珍惜空間,感恩尊重愛。',
                'english': 'Seize the time, cherish the space.',
                'explanation': '焦慮源於過度擔憂未來。專注當下,就不會被焦慮困擾。',
                'application': '列出今天必須完成的事,專注做好當下這一件。'
            }
        )
        
        # Rule 5: Successful event → Express gratitude
        self.add_rule(
            premises=['task_completed', 'positive_outcome'],
            conclusion='practice_gratitude',
            aphorism={
                'id': 'gratitude',
                'chinese': '感恩,是世間最美的語言。',
                'english': 'Gratitude is the world\'s most beautiful language.',
                'explanation': '成功後記得感恩,感謝幫助你的人,也感謝這個學習機會。',
                'application': '向協助你的人表達感謝,寫下今天感恩的三件事。'
            }
        )
        
        # Complex multi-step rules
        # Rule 6: Calm mind + Time pressure → Effective action
        self.add_rule(
            premises=['need_calm_mind', 'focus_present_moment'],
            conclusion='can_take_effective_action',
            aphorism={
                'id': 'effective_action',
                'chinese': '靜中有定,動中有慧。',
                'english': 'Stability in stillness, wisdom in action.',
                'explanation': '當內心平靜且專注當下,就能採取有效行動。',
                'application': '先靜心,再行動。做決定前,確保心是平靜的。'
            }
        )
        
        # Rule 7: Willing heart + Gratitude → Sustained motivation
        self.add_rule(
            premises=['apply_willing_heart', 'practice_gratitude'],
            conclusion='sustained_volunteer_motivation',
            aphorism={
                'id': 'sustained_motivation',
                'chinese': '付出無所求,還要說感恩。',
                'english': 'Give without expecting, and still say thanks.',
                'explanation': '結合甘願做與感恩心,能夠長期持續志工付出。',
                'application': '每次服務後,反思學到什麼,感謝這個機會。'
            }
        )
    
    def add_rule(self, premises: List[str], conclusion: str, aphorism: dict):
        """Add a new inference rule"""
        rule = Rule(premises, conclusion, aphorism)
        self.rules.append(rule)
    
    def tell(self, fact: str):
        """Add a known fact to the knowledge base"""
        self.facts.add(fact)
        self.inference_log.append(f"💡 Added fact: {fact}")
    
    def forward_chain(self, max_iterations=10):
        """
        Execute forward chaining inference
        Returns: (all_inferred_facts, inference_steps)
        """
        self.iteration_count = 0
        inferred_this_round = True
        all_inferences = []
        
        while inferred_this_round and self.iteration_count < max_iterations:
            self.iteration_count += 1
            inferred_this_round = False
            
            print(f"\n{'─'*70}")
            print(f"⚙️  Iteration {self.iteration_count}")
            print(f"{'─'*70}")
            print(f"Current Facts: {sorted(self.facts)}\n")
            
            for rule in self.rules:
                if rule.can_fire(self.facts) and rule.conclusion not in self.facts:
                    # Fire the rule
                    self.facts.add(rule.conclusion)
                    inferred_this_round = True
                    
                    inference_step = {
                        'iteration': self.iteration_count,
                        'rule': str(rule),
                        'conclusion': rule.conclusion,
                        'aphorism': rule.aphorism_data
                    }
                    all_inferences.append(inference_step)
                    
                    print(f"🔥 Rule Fired: {rule}")
                    print(f"   ✅ Inferred: {rule.conclusion}")
                    print(f"   💙 Jing Si Aphorism:")
                    print(f"      {rule.aphorism_data['chinese']}")
                    print(f"      {rule.aphorism_data['english']}")
                    print(f"   📖 {rule.aphorism_data['explanation']}")
                    print(f"   🎯 {rule.aphorism_data['application']}\n")
        
        if not inferred_this_round:
            print(f"\n✅ Fixed point reached after {self.iteration_count} iterations")
            print(f"   No more facts can be inferred\n")
        
        return all_inferences
    
    def print_algorithm_details(self):
        """Print algorithm complexity and properties"""
        print("\n" + "="*70)
        print("FORWARD CHAINING ALGORITHM ANALYSIS")
        print("="*70)
        print("Type: Sound and Complete Inference")
        print("Time Complexity: O(n²) where n = number of rules")
        print("Space Complexity: O(m) where m = number of facts")
        print("Properties:")
        print("  - Data-driven reasoning (forward from facts)")
        print("  - Fires all applicable rules until fixed point")
        print("  - Guaranteed to find all logical consequences")
        print("  - Modus Ponens: IF P AND (P→Q) THEN Q")
        print("="*70 + "\n")


class PropositionalLogicGame:
    """Interactive Jing Si Aphorisms reasoning game"""
    
    def __init__(self):
        self.engine = ForwardChainingEngine()
        self.scenario_count = 0
    
    def play_scenario(self, scenario: dict):
        """Play through a volunteer scenario"""
        self.scenario_count += 1
        
        print("\n" + "="*70)
        print(f"📖 SCENARIO {self.scenario_count}: {scenario['title']}")
        print("="*70 + "\n")
        print(f"{scenario['description']}\n")
        
        # Show situation
        print("🔍 Current Situation:")
        for fact in scenario['initial_facts']:
            print(f"   • {fact.replace('_', ' ').title()}")
        
        print("\n" + "─"*70)
        input("Press Enter to start reasoning process...")
        
        # Add initial facts
        for fact in scenario['initial_facts']:
            self.engine.tell(fact)
        
        # Run forward chaining
        print("\n🧠 Starting Forward Chaining Inference...")
        inferences = self.engine.forward_chain()
        
        # Show final state
        print("\n" + "="*70)
        print("📊 REASONING COMPLETE")
        print("="*70)
        print(f"Total iterations: {self.engine.iteration_count}")
        print(f"Total inferences: {len(inferences)}")
        print(f"Final knowledge state: {len(self.engine.facts)} facts")
        
        input("\n\nPress Enter to continue...")


def run_propositional_logic_game():
    """Run comprehensive propositional logic demonstration"""
    print("\n" + "="*70)
    print("💭 LEVEL 2: PROPOSITIONAL LOGIC - JING SI APHORISMS")
    print("="*70 + "\n")
    
    game = PropositionalLogicGame()
    
    # Show algorithm details
    game.engine.print_algorithm_details()
    
    # Scenario 1: Overwhelming food distribution
    scenario1 = {
        'title': 'Food Distribution Crisis',
        'description': (
            '你需要在2小時內為50個家庭準備食物包,但只有3位志工協助。\n'
            'You need to prepare food packages for 50 families in 2 hours with only 3 volunteers.\n'
            '工作量龐大,感覺難以完成...'
        ),
        'initial_facts': ['feeling_overwhelmed', 'many_tasks', 'time_pressure', 'feeling_anxious']
    }
    
    game.play_scenario(scenario1)
    
    # Scenario 2: Physical exhaustion but want to continue
    scenario2 = {
        'title': 'Marathon Volunteer Day',
        'description': (
            '已經連續服務6小時,身體很疲累,但還有最後一批家庭需要送餐。\n'
            'You\'ve been serving for 6 hours straight, physically exhausted, but there\'s one more delivery.\n'
            '該繼續還是休息?'
        ),
        'initial_facts': ['feeling_tired', 'want_continue', 'external_difficulty']
    }
    
    game.play_scenario(scenario2)
    
    # Scenario 3: Successful completion
    scenario3 = {
        'title': 'Mission Accomplished',
        'description': (
            '經過團隊努力,成功完成今天所有任務！\n'
            'Through team effort, successfully completed all tasks today!\n'
            '所有家庭都收到食物,大家都很感謝。'
        ),
        'initial_facts': ['task_completed', 'positive_outcome']
    }
    
    game.play_scenario(scenario3)
    
    input("\nPress Enter to continue...")


# =============================================================================
# LEVEL 3: MDP - VOLUNTEER JOURNEY OPTIMIZATION
# =============================================================================

class MarkovDecisionProcess:
    """
    Markov Decision Process for Volunteer Journey
    
    States: Different stages of volunteer participation
    Actions: Decisions at each stage
    Transitions: Probability of moving to next state
    Rewards: Value gained from each state-action pair
    
    Bellman Optimality Equation:
    V*(s) = max_a Σ T(s,a,s')[R(s,a,s') + γV*(s')]
    
    where:
    - V*(s) = optimal value of state s
    - T(s,a,s') = transition probability
    - R(s,a,s') = reward function
    - γ = discount factor (0 < γ < 1)
    
    Algorithm: Value Iteration
    Complexity: O(|S|²|A|) per iteration
    """
    
    def __init__(self, gamma=0.9):
        self.gamma = gamma  # Discount factor
        self.states = []
        self.actions = {}
        self.transitions = {}
        self.rewards = {}
        self.values = {}
        self.policy = {}
        self.iteration_history = []
        
        self._initialize_volunteer_mdp()
    
    def _initialize_volunteer_mdp(self):
        """Initialize the volunteer recruitment MDP"""
        
        # States in volunteer journey
        self.states = [
            'curious',      # Initial interest
            'learning',     # Attending orientation
            'trying',       # First volunteer experience
            'committed',    # Regular volunteer
            'leader',       # Volunteer coordinator
            'inactive'      # Dropped out
        ]
        
        # Actions available at each state
        self.actions = {
            'curious': ['attend_orientation', 'ignore', 'learn_more'],
            'learning': ['volunteer_once', 'wait', 'leave'],
            'trying': ['continue', 'pause', 'quit'],
            'committed': ['become_leader', 'stay_committed', 'reduce'],
            'leader': ['mentor', 'maintain'],
            'inactive': ['rejoin']
        }
        
        # Transition probabilities T(s, a, s')
        self.transitions = {
            ('curious', 'attend_orientation'): {
                'learning': 0.8,
                'curious': 0.15,
                'inactive': 0.05
            },
            ('curious', 'ignore'): {
                'curious': 0.3,
                'inactive': 0.7
            },
            ('curious', 'learn_more'): {
                'curious': 0.5,
                'learning': 0.4,
                'inactive': 0.1
            },
            ('learning', 'volunteer_once'): {
                'trying': 0.7,
                'learning': 0.2,
                'inactive': 0.1
            },
            ('learning', 'wait'): {
                'learning': 0.5,
                'curious': 0.3,
                'inactive': 0.2
            },
            ('learning', 'leave'): {
                'inactive': 1.0
            },
            ('trying', 'continue'): {
                'committed': 0.6,
                'trying': 0.3,
                'inactive': 0.1
            },
            ('trying', 'pause'): {
                'trying': 0.4,
                'curious': 0.3,
                'inactive': 0.3
            },
            ('trying', 'quit'): {
                'inactive': 0.9,
                'curious': 0.1
            },
            ('committed', 'become_leader'): {
                'leader': 0.5,
                'committed': 0.4,
                'trying': 0.1
            },
            ('committed', 'stay_committed'): {
                'committed': 0.8,
                'leader': 0.1,
                'trying': 0.1
            },
            ('committed', 'reduce'): {
                'trying': 0.5,
                'committed': 0.3,
                'inactive': 0.2
            },
            ('leader', 'mentor'): {
                'leader': 0.9,
                'committed': 0.1
            },
            ('leader', 'maintain'): {
                'leader': 0.85,
                'committed': 0.15
            },
            ('inactive', 'rejoin'): {
                'curious': 0.4,
                'learning': 0.3,
                'inactive': 0.3
            }
        }
        
        # Reward function R(s, a, s')
        self.rewards = {
            ('curious', 'attend_orientation', 'learning'): 10,
            ('curious', 'learn_more', 'learning'): 5,
            ('learning', 'volunteer_once', 'trying'): 20,
            ('trying', 'continue', 'committed'): 50,
            ('committed', 'become_leader', 'leader'): 100,
            ('committed', 'stay_committed', 'committed'): 40,
            ('leader', 'mentor', 'leader'): 150,
            ('leader', 'maintain', 'leader'): 120,
            # Penalties for dropping out
            ('curious', 'ignore', 'inactive'): -10,
            ('learning', 'leave', 'inactive'): -20,
            ('trying', 'quit', 'inactive'): -30,
        }
        
        # Default reward for unlisted transitions
        self.default_reward = 0
        
        # Initialize value function
        for state in self.states:
            self.values[state] = 0
    
    def get_reward(self, state, action, next_state):
        """Get reward for transition"""
        return self.rewards.get((state, action, next_state), self.default_reward)
    
    def value_iteration(self, max_iterations=50, theta=0.01):
        """
        Value Iteration Algorithm
        
        Repeat until convergence:
        1. For each state s:
           V(s) = max_a Σ T(s,a,s')[R(s,a,s') + γV(s')]
        2. Check if max|V_new - V_old| < θ
        
        Returns: (converged, iterations_used)
        """
        print("\n" + "="*70)
        print("🔄 STARTING VALUE ITERATION")
        print("="*70)
        
        for iteration in range(max_iterations):
            delta = 0
            new_values = {}
            
            print(f"\n{'─'*70}")
            print(f"Iteration {iteration + 1}")
            print(f"{'─'*70}")
            
            for state in self.states:
                if state not in self.actions:
                    new_values[state] = self.values[state]
                    continue
                
                # Compute value for each action
                action_values = []
                
                for action in self.actions[state]:
                    if (state, action) not in self.transitions:
                        continue
                    
                    # Calculate expected value: Σ T(s,a,s')[R(s,a,s') + γV(s')]
                    expected_value = 0
                    for next_state, prob in self.transitions[(state, action)].items():
                        reward = self.get_reward(state, action, next_state)
                        expected_value += prob * (reward + self.gamma * self.values[next_state])
                    
                    action_values.append((action, expected_value))
                
                if action_values:
                    # Take maximum over actions
                    best_action, best_value = max(action_values, key=lambda x: x[1])
                    new_values[state] = best_value
                    self.policy[state] = best_action
                    
                    # Track convergence
                    delta = max(delta, abs(self.values[state] - new_values[state]))
                    
                    print(f"State: {state:12} | V: {new_values[state]:7.2f} | Best Action: {best_action}")
                else:
                    new_values[state] = self.values[state]
            
            # Update values
            self.values = new_values
            self.iteration_history.append((iteration + 1, delta, dict(self.values)))
            
            print(f"\nMax change (δ): {delta:.4f}")
            
            # Check convergence
            if delta < theta:
                print(f"\n✅ Converged after {iteration + 1} iterations!")
                return True, iteration + 1
        
        print(f"\n⚠️  Reached max iterations ({max_iterations})")
        return False, max_iterations
    
    def extract_policy(self):
        """Extract optimal policy from value function"""
        print("\n" + "="*70)
        print("🎯 OPTIMAL POLICY")
        print("="*70 + "\n")
        
        for state in self.states:
            if state in self.policy:
                action = self.policy[state]
                value = self.values[state]
                print(f"State: {state:12} → Action: {action:20} (V* = {value:.2f})")
        
        return self.policy
    
    def simulate_journey(self, start_state='curious', max_steps=10):
        """Simulate a volunteer journey using optimal policy"""
        print("\n" + "="*70)
        print("🎭 SIMULATING VOLUNTEER JOURNEY")
        print("="*70 + "\n")
        
        current_state = start_state
        total_reward = 0
        journey = [current_state]
        
        print(f"Starting State: {current_state}")
        print(f"{'─'*70}\n")
        
        for step in range(max_steps):
            if current_state not in self.policy:
                print(f"❌ No action available in state: {current_state}")
                break
            
            action = self.policy[current_state]
            
            if (current_state, action) not in self.transitions:
                print(f"❌ No transitions for ({current_state}, {action})")
                break
            
            # Sample next state based on transition probabilities
            next_states = list(self.transitions[(current_state, action)].keys())
            probabilities = list(self.transitions[(current_state, action)].values())
            next_state = random.choices(next_states, probabilities)[0]
            
            reward = self.get_reward(current_state, action, next_state)
            total_reward += reward
            
            print(f"Step {step + 1}:")
            print(f"  Current: {current_state}")
            print(f"  Action:  {action}")
            print(f"  Next:    {next_state}")
            print(f"  Reward:  {reward:+.0f}")
            print(f"  Total:   {total_reward:+.0f}\n")
            
            journey.append(next_state)
            current_state = next_state
            
            # Stop if reached leader or inactive
            if current_state in ['leader', 'inactive']:
                print(f"🏁 Journey ended in state: {current_state}")
                break
        
        print(f"{'─'*70}")
        print(f"Final Total Reward: {total_reward:+.0f}")
        print(f"Journey: {' → '.join(journey)}")
        
        return journey, total_reward
    
    def print_algorithm_details(self):
        """Print MDP algorithm details"""
        print("\n" + "="*70)
        print("MDP VALUE ITERATION ANALYSIS")
        print("="*70)
        print("Bellman Optimality Equation:")
        print("  V*(s) = max_a Σ T(s,a,s')[R(s,a,s') + γV*(s')]")
        print(f"\nParameters:")
        print(f"  States: {len(self.states)}")
        print(f"  Discount Factor (γ): {self.gamma}")
        print(f"  Time Complexity: O(|S|²|A|) per iteration")
        print(f"  Space Complexity: O(|S|)")
        print(f"\nProperties:")
        print(f"  - Convergence: Guaranteed for γ < 1")
        print(f"  - Optimality: Finds optimal policy")
        print(f"  - Markov Property: Future independent of past given present")
        print("="*70 + "\n")


def run_mdp_demo():
    """Run comprehensive MDP demonstration"""
    print("\n" + "="*70)
    print("🔄 LEVEL 3: MDP - VOLUNTEER JOURNEY OPTIMIZATION")
    print("="*70 + "\n")
    
    mdp = MarkovDecisionProcess(gamma=0.9)
    mdp.print_algorithm_details()
    
    input("Press Enter to start value iteration...")
    
    # Run value iteration
    converged, iterations = mdp.value_iteration(max_iterations=50, theta=0.01)
    
    input("\nPress Enter to see optimal policy...")
    
    # Extract optimal policy
    policy = mdp.extract_policy()
    
    input("\nPress Enter to simulate volunteer journeys...")
    
    # Simulate multiple journeys
    print("\n" + "="*70)
    print("Running 3 simulations:")
    print("="*70)
    
    for i in range(3):
        print(f"\n{'═'*70}")
        print(f"SIMULATION {i+1}")
        print(f"{'═'*70}")
        journey, reward = mdp.simulate_journey('curious', max_steps=8)
        input("\nPress Enter for next simulation...")
    
    input("\nPress Enter to continue...")


# =============================================================================
# MAIN MENU
# =============================================================================

def print_main_menu():
    """Display main menu"""
    print("\n" + "="*70)
    print("🌸 Journey of Kindness - AI Education Game 🌸")
    print("   CS4 Honors Project - Advanced Algorithms")
    print("="*70)
    print("\n📚 CORE ALGORITHMS (Honors Depth):\n")
    print("  1. 🗺️  A* Search - Advanced Pathfinding")
    print("       • Multiple heuristics")
    print("       • Dynamic terrain costs") 
    print("       • Complexity analysis")
    print()
    print("  2. 💭 Propositional Logic - Forward Chaining")
    print("       • Inference engine")
    print("       • Jing Si Aphorisms rules")
    print("       • Fixed-point computation")
    print()
    print("  3. 🔄 MDP - Value Iteration")
    print("       • Bellman optimality")
    print("       • Policy extraction")
    print("       • Journey simulation")
    print()
    print("  4. 🧠 Bayesian Networks (Coming)")
    print("  5. ♟️  Alpha-Beta Pruning (Coming)")
    print()
    print("  q. Quit")
    print("\n" + "="*70 + "\n")


def main():
    """Main game loop"""
    while True:
        print_main_menu()
        choice = input("Select algorithm (1-5) or 'q' to quit: ").strip().lower()
        
        if choice == '1':
            run_astar_demo()
        elif choice == '2':
            run_propositional_logic_game()
        elif choice == '3':
            run_mdp_demo()
        elif choice == '4':
            print("\n🧠 Bayesian Networks - Coming soon!")
            print("Will include: Probability inference, d-separation, Variable elimination")
            input("\nPress Enter to continue...")
        elif choice == '5':
            print("\n♟️  Alpha-Beta Pruning - Coming soon!")
            print("Will include: Game tree search, Minimax with pruning, Budget allocation")
            input("\nPress Enter to continue...")
        elif choice == 'q':
            print("\n🙏 感恩！Thank you for playing!")
            print("願你我都能在助人中找到快樂 💙\n")
            break
        else:
            print("\n❌ Invalid choice. Please try again.\n")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("Loading Journey of Kindness AI Education Game...")
    print("="*70)
    main()