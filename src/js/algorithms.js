// Journey of Kindness - AI Algorithm Visualizations
// Educational game engine for teaching 7 AI algorithms

class AStarPathfinder {
    constructor(grid, start, goal) {
        this.grid = grid;
        this.start = start;
        this.goal = goal;
        this.openSet = [start];
        this.closedSet = [];
        this.cameFrom = new Map();
        this.gScore = new Map();
        this.fScore = new Map();
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    findPath() {
        this.gScore.set(this.start, 0);
        this.fScore.set(this.start, this.heuristic(this.start, this.goal));

        while (this.openSet.length > 0) {
            let current = this.getLowestFScore();
            if (current === this.goal) {
                return this.reconstructPath(current);
            }

            this.openSet = this.openSet.filter(n => n !== current);
            this.closedSet.push(current);

            for (let neighbor of this.getNeighbors(current)) {
                if (this.closedSet.includes(neighbor)) continue;

                let tentativeGScore = this.gScore.get(current) + 1;

                if (!this.openSet.includes(neighbor)) {
                    this.openSet.push(neighbor);
                } else if (tentativeGScore >= this.gScore.get(neighbor)) {
                    continue;
                }

                this.cameFrom.set(neighbor, current);
                this.gScore.set(neighbor, tentativeGScore);
                this.fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, this.goal));
            }
        }
        return null;
    }

    getLowestFScore() {
        return this.openSet.reduce((min, node) => 
            this.fScore.get(node) < this.fScore.get(min) ? node : min
        );
    }

    getNeighbors(node) {
        const directions = [{x:0,y:1}, {x:1,y:0}, {x:0,y:-1}, {x:-1,y:0}];
        return directions
            .map(d => ({x: node.x + d.x, y: node.y + d.y}))
            .filter(n => this.isValid(n));
    }

    isValid(node) {
        return node.x >= 0 && node.x < this.grid.length &&
               node.y >= 0 && node.y < this.grid[0].length &&
               this.grid[node.x][node.y] !== 1;
    }

    reconstructPath(current) {
        const path = [current];
        while (this.cameFrom.has(current)) {
            current = this.cameFrom.get(current);
            path.unshift(current);
        }
        return path;
    }
}

class PropositionalLogic {
    constructor() {
        this.knowledgeBase = [];
    }

    addClause(clause) {
        this.knowledgeBase.push(clause);
    }

    evaluate(assignment) {
        return this.knowledgeBase.every(clause =>
            clause.some(literal => {
                const variable = literal.replace('-', '');
                const isNegated = literal.startsWith('-');
                return isNegated ? !assignment[variable] : assignment[variable];
            })
        );
    }

    resolve(clause1, clause2) {
        for (let lit1 of clause1) {
            for (let lit2 of clause2) {
                if (lit1 === '-' + lit2 || lit2 === '-' + lit1) {
                    const newClause = [...clause1, ...clause2]
                        .filter(l => l !== lit1 && l !== lit2);
                    return [...new Set(newClause)];
                }
            }
        }
        return null;
    }
}

class MarkovDecisionProcess {
    constructor(states, actions, transitions, rewards, gamma = 0.9) {
        this.states = states;
        this.actions = actions;
        this.transitions = transitions;
        this.rewards = rewards;
        this.gamma = gamma;
        this.values = new Map();
        this.policy = new Map();
    }

    valueIteration(epsilon = 0.001) {
        this.states.forEach(s => this.values.set(s, 0));

        let delta;
        do {
            delta = 0;
            for (let state of this.states) {
                const oldValue = this.values.get(state);
                const newValue = Math.max(...this.actions.map(action =>
                    this.getQValue(state, action)
                ));
                this.values.set(state, newValue);
                delta = Math.max(delta, Math.abs(oldValue - newValue));
            }
        } while (delta > epsilon);

        this.extractPolicy();
    }

    getQValue(state, action) {
        let qValue = 0;
        const transitions = this.transitions[state][action] || [];
        for (let [nextState, prob] of transitions) {
            const reward = this.rewards[state][action] || 0;
            qValue += prob * (reward + this.gamma * this.values.get(nextState));
        }
        return qValue;
    }

    extractPolicy() {
        for (let state of this.states) {
            let bestAction = null;
            let bestValue = -Infinity;
            for (let action of this.actions) {
                const qValue = this.getQValue(state, action);
                if (qValue > bestValue) {
                    bestValue = qValue;
                    bestAction = action;
                }
            }
            this.policy.set(state, bestAction);
        }
    }
}

class BayesianNetwork {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }

    addNode(name, probabilities) {
        this.nodes.set(name, { name, probabilities, parents: [] });
    }

    addEdge(parent, child) {
        this.edges.push([parent, child]);
        this.nodes.get(child).parents.push(parent);
    }

    getProbability(node, value, evidence = {}) {
        const nodeData = this.nodes.get(node);
        if (nodeData.parents.length === 0) {
            return value ? nodeData.probabilities.true : nodeData.probabilities.false;
        }

        const parentValues = nodeData.parents.map(p => evidence[p] ? 'T' : 'F').join('');
        const prob = nodeData.probabilities[parentValues];
        return value ? prob : 1 - prob;
    }

    inference(query, evidence) {
        // Simple enumeration inference
        let result = 0;
        const hiddenVars = [...this.nodes.keys()].filter(
            n => n !== query && !(n in evidence)
        );

        const enumerate = (vars, assignment) => {
            if (vars.length === 0) {
                let prob = 1;
                for (let [node] of this.nodes) {
                    prob *= this.getProbability(node, assignment[node], assignment);
                }
                return prob;
            }

            const [first, ...rest] = vars;
            return enumerate(rest, {...assignment, [first]: true}) +
                   enumerate(rest, {...assignment, [first]: false});
        };

        const probTrue = enumerate(hiddenVars, {...evidence, [query]: true});
        const probFalse = enumerate(hiddenVars, {...evidence, [query]: false});
        return probTrue / (probTrue + probFalse);
    }
}

class AlphaBetaPruning {
    constructor(maxDepth = 5) {
        this.maxDepth = maxDepth;
        this.nodesExplored = 0;
    }

    search(state, depth, alpha, beta, isMaximizing, evaluate, getChildren) {
        this.nodesExplored++;

        if (depth === 0 || getChildren(state).length === 0) {
            return { value: evaluate(state), move: null };
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            let bestMove = null;

            for (let child of getChildren(state)) {
                const result = this.search(child.state, depth - 1, alpha, beta, false, evaluate, getChildren);
                if (result.value > maxEval) {
                    maxEval = result.value;
                    bestMove = child.move;
                }
                alpha = Math.max(alpha, result.value);
                if (beta <= alpha) break; // Beta cutoff
            }
            return { value: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            let bestMove = null;

            for (let child of getChildren(state)) {
                const result = this.search(child.state, depth - 1, alpha, beta, true, evaluate, getChildren);
                if (result.value < minEval) {
                    minEval = result.value;
                    bestMove = child.move;
                }
                beta = Math.min(beta, result.value);
                if (beta <= alpha) break; // Alpha cutoff
            }
            return { value: minEval, move: bestMove };
        }
    }

    findBestMove(state, evaluate, getChildren) {
        this.nodesExplored = 0;
        return this.search(state, this.maxDepth, -Infinity, Infinity, true, evaluate, getChildren);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AStarPathfinder,
        PropositionalLogic,
        MarkovDecisionProcess,
        BayesianNetwork,
        AlphaBetaPruning
    };
}
