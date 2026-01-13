"""
Journey of Kindness - A* Search Algorithm Module
A* 搜尋演算法模組：用於 Level 1 Mrs. Garcia 送餐路徑規劃

Author: Mei Hsien Hsu 許美嫻
Course: CS4 Introduction to Artificial Intelligence
Professor: An Lam
Institution: Las Positas College, Honors Transfer Program
Semester: Fall 2025

This module implements the A* Search algorithm for finding optimal
paths in the community meal delivery scenario.

Reference: Russell & Norvig, Chapter 3 - Solving Problems by Searching
"""

import heapq
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
import json


@dataclass
class Location:
    """Represents a location on the community map."""
    id: str
    name: str
    name_zh: str
    x: int
    y: int
    is_destination: bool = False
    has_resident: bool = False
    resident_name: Optional[str] = None
    
    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        if isinstance(other, Location):
            return self.id == other.id
        return False


@dataclass(order=True)
class SearchNode:
    """
    Node in the A* search tree.
    
    f(n) = g(n) + h(n)
    where:
    - g(n) = actual cost from start to n
    - h(n) = heuristic estimate from n to goal
    """
    f_score: float
    location: Location = field(compare=False)
    g_score: float = field(compare=False)
    parent: Optional['SearchNode'] = field(default=None, compare=False)
    
    @property
    def h_score(self) -> float:
        """Heuristic score (estimated cost to goal)."""
        return self.f_score - self.g_score


class HeuristicType(Enum):
    """Different heuristic functions for A*."""
    MANHATTAN = "manhattan"
    EUCLIDEAN = "euclidean"
    COMPASSION = "compassion"  # Custom heuristic considering human factors


class CommunityMap:
    """
    Represents the Hunters Point community map for path planning.
    
    The map is a grid where:
    - Each cell can be passable or blocked
    - Some cells contain residents who need meal delivery
    - The AI calculates optimal paths, but...
    - Sometimes the "suboptimal" path saves a life (Mrs. Garcia story)
    """
    
    def __init__(self, width: int = 10, height: int = 10):
        self.width = width
        self.height = height
        self.locations: Dict[str, Location] = {}
        self.edges: Dict[str, List[Tuple[str, float]]] = {}  # adjacency list
        self._initialize_community()
    
    def _initialize_community(self):
        """Initialize the Bayview-Hunters Point community locations."""
        
        # Key locations
        locations_data = [
            ('start', 'Tzu Chi Center', '慈濟中心', 0, 0, False, False, None),
            ('market', 'Hunters Point Market', '獵人角市場', 3, 2, False, False, None),
            ('park', 'Community Park', '社區公園', 5, 4, False, False, None),
            ('garcia', "Mrs. Garcia's Home", 'Garcia 太太家', 7, 3, True, True, 'Mrs. Garcia'),
            ('johnson', "Mr. Johnson's Home", 'Johnson 先生家', 2, 5, True, True, 'Mr. Johnson'),
            ('chen', "Mrs. Chen's Home", '陳奶奶家', 8, 7, True, True, 'Mrs. Chen'),
            ('school', 'John Muir Elementary', 'John Muir 小學', 4, 1, False, False, None),
            ('clinic', 'Community Clinic', '社區診所', 6, 6, False, False, None),
        ]
        
        for loc_data in locations_data:
            loc = Location(*loc_data)
            self.locations[loc.id] = loc
        
        # Define edges (connections between locations)
        self._add_edge('start', 'market', 3.5)
        self._add_edge('start', 'school', 4.2)
        self._add_edge('market', 'park', 3.0)
        self._add_edge('market', 'johnson', 3.2)
        self._add_edge('school', 'park', 3.5)
        self._add_edge('park', 'garcia', 2.5)
        self._add_edge('park', 'clinic', 2.8)
        self._add_edge('garcia', 'chen', 4.5)
        self._add_edge('clinic', 'chen', 2.0)
        self._add_edge('johnson', 'park', 3.0)
    
    def _add_edge(self, loc1_id: str, loc2_id: str, cost: float):
        """Add bidirectional edge between two locations."""
        if loc1_id not in self.edges:
            self.edges[loc1_id] = []
        if loc2_id not in self.edges:
            self.edges[loc2_id] = []
        
        self.edges[loc1_id].append((loc2_id, cost))
        self.edges[loc2_id].append((loc1_id, cost))
    
    def get_neighbors(self, loc_id: str) -> List[Tuple[str, float]]:
        """Get neighboring locations and travel costs."""
        return self.edges.get(loc_id, [])
    
    def manhattan_distance(self, loc1: Location, loc2: Location) -> float:
        """Manhattan distance heuristic."""
        return abs(loc1.x - loc2.x) + abs(loc1.y - loc2.y)
    
    def euclidean_distance(self, loc1: Location, loc2: Location) -> float:
        """Euclidean distance heuristic."""
        return ((loc1.x - loc2.x) ** 2 + (loc1.y - loc2.y) ** 2) ** 0.5
    
    def compassion_heuristic(self, loc1: Location, loc2: Location, 
                             days_since_visit: Dict[str, int]) -> float:
        """
        Custom heuristic that considers human factors.
        
        This heuristic adjusts the estimated cost based on:
        - How long since we last visited nearby residents
        - Whether there are vulnerable residents along the path
        
        This is what the game teaches: sometimes the "suboptimal" 
        path according to pure distance is actually the better choice.
        """
        base_distance = self.euclidean_distance(loc1, loc2)
        
        # Reduce estimated cost if there are unvisited residents nearby
        compassion_factor = 1.0
        for loc_id, days in days_since_visit.items():
            loc = self.locations.get(loc_id)
            if loc and loc.has_resident:
                if self.euclidean_distance(loc1, loc) < 3:
                    # Nearby resident hasn't been visited
                    compassion_factor -= 0.1 * min(days, 7) / 7
        
        return base_distance * max(compassion_factor, 0.5)


class AStarSearch:
    """
    A* Search Algorithm Implementation.
    
    The algorithm finds the optimal path from start to goal,
    but in the game context, we also track the "compassionate detour"
    that might save Mrs. Garcia's life.
    """
    
    def __init__(self, community_map: CommunityMap):
        self.map = community_map
        self.search_history: List[str] = []  # For visualization
    
    def search(self, start_id: str, goal_id: str, 
               heuristic: HeuristicType = HeuristicType.EUCLIDEAN) -> Optional[List[str]]:
        """
        Find optimal path using A* search.
        
        Args:
            start_id: Starting location ID
            goal_id: Goal location ID
            heuristic: Which heuristic function to use
        
        Returns:
            List of location IDs representing the path, or None if no path exists
        """
        start = self.map.locations.get(start_id)
        goal = self.map.locations.get(goal_id)
        
        if not start or not goal:
            return None
        
        # Priority queue: (f_score, node)
        open_set: List[SearchNode] = []
        closed_set: Set[str] = set()
        
        # Initialize with start node
        h_start = self._calculate_heuristic(start, goal, heuristic)
        start_node = SearchNode(f_score=h_start, location=start, g_score=0)
        heapq.heappush(open_set, start_node)
        
        # Track best g_score for each location
        g_scores: Dict[str, float] = {start_id: 0}
        
        # Track search history for visualization
        self.search_history = []
        
        while open_set:
            current = heapq.heappop(open_set)
            current_id = current.location.id
            
            self.search_history.append(current_id)
            
            if current_id == goal_id:
                # Reconstruct path
                return self._reconstruct_path(current)
            
            if current_id in closed_set:
                continue
            
            closed_set.add(current_id)
            
            # Explore neighbors
            for neighbor_id, edge_cost in self.map.get_neighbors(current_id):
                if neighbor_id in closed_set:
                    continue
                
                neighbor = self.map.locations.get(neighbor_id)
                if not neighbor:
                    continue
                
                tentative_g = current.g_score + edge_cost
                
                if neighbor_id not in g_scores or tentative_g < g_scores[neighbor_id]:
                    g_scores[neighbor_id] = tentative_g
                    h = self._calculate_heuristic(neighbor, goal, heuristic)
                    f = tentative_g + h
                    
                    neighbor_node = SearchNode(
                        f_score=f,
                        location=neighbor,
                        g_score=tentative_g,
                        parent=current
                    )
                    heapq.heappush(open_set, neighbor_node)
        
        return None  # No path found
    
    def _calculate_heuristic(self, loc: Location, goal: Location, 
                             heuristic: HeuristicType) -> float:
        """Calculate heuristic value based on selected type."""
        if heuristic == HeuristicType.MANHATTAN:
            return self.map.manhattan_distance(loc, goal)
        elif heuristic == HeuristicType.EUCLIDEAN:
            return self.map.euclidean_distance(loc, goal)
        else:  # COMPASSION
            return self.map.compassion_heuristic(loc, goal, {})
    
    def _reconstruct_path(self, node: SearchNode) -> List[str]:
        """Reconstruct path from goal node to start."""
        path = []
        current = node
        while current:
            path.append(current.location.id)
            current = current.parent
        return list(reversed(path))
    
    def compare_paths(self, start_id: str, goal_id: str) -> Dict:
        """
        Compare optimal path vs compassionate detour.
        
        This is the core lesson of Level 1:
        "最短路徑，不一定是最好的路"
        "The shortest path isn't always the best path"
        """
        optimal_path = self.search(start_id, goal_id, HeuristicType.EUCLIDEAN)
        compassion_path = self.search(start_id, goal_id, HeuristicType.COMPASSION)
        
        return {
            'optimal': {
                'path': optimal_path,
                'cost': self._calculate_path_cost(optimal_path) if optimal_path else None
            },
            'compassionate': {
                'path': compassion_path,
                'cost': self._calculate_path_cost(compassion_path) if compassion_path else None
            },
            'lesson': {
                'en': "The shortest path isn't always the best path",
                'zh': "最短路徑，不一定是最好的路"
            }
        }
    
    def _calculate_path_cost(self, path: List[str]) -> float:
        """Calculate total cost of a path."""
        if not path or len(path) < 2:
            return 0
        
        total = 0
        for i in range(len(path) - 1):
            for neighbor_id, cost in self.map.get_neighbors(path[i]):
                if neighbor_id == path[i + 1]:
                    total += cost
                    break
        return total
    
    def export_search_visualization(self) -> str:
        """Export search history for frontend visualization."""
        return json.dumps({
            'history': self.search_history,
            'locations': {
                loc_id: {'x': loc.x, 'y': loc.y, 'name': loc.name_zh}
                for loc_id, loc in self.map.locations.items()
            }
        }, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    # Demo: A* Search in Hunters Point community
    print("=" * 60)
    print("Journey of Kindness - A* Search Demo")
    print("Level 1: Mrs. Garcia's Meal Delivery")
    print("=" * 60)
    print()
    
    community = CommunityMap()
    search = AStarSearch(community)
    
    # Compare paths
    comparison = search.compare_paths('start', 'garcia')
    
    print("Optimal Path (純距離):")
    print(f"  Route: {' → '.join(comparison['optimal']['path'])}")
    print(f"  Cost: {comparison['optimal']['cost']:.1f}")
    print()
    
    print("Compassionate Path (考慮人心):")
    if comparison['compassionate']['path']:
        print(f"  Route: {' → '.join(comparison['compassionate']['path'])}")
        print(f"  Cost: {comparison['compassionate']['cost']:.1f}")
    print()
    
    print(f"Lesson: {comparison['lesson']['zh']}")
    print(f"        {comparison['lesson']['en']}")
