# Journey of Kindness 善的旅程

An AI education game — learning algorithms through real community stories.

🎮 **[Play Now](https://aadl11.github.io/journey-of-kindness/)**

---

## About

This project bridges **computational thinking** with **compassionate action** — demonstrating how classical AI algorithms can serve humanitarian purposes.

Built as a capstone project for CS4: Introduction to AI at Las Positas College, the game draws from twenty years of Tzu Chi volunteer service across San Francisco — beginning in 2006, and reaching Bayview–Hunters Point in 2009.

---

## A Nonviolent Wumpus World 非暴力的 Wumpus 世界

Every level retells its algorithm through community service, and nothing in this game shoots, kills, or dies. Level 4 is the clearest example: it keeps the computational structure of the classic Wumpus World (AIMA Ch. 7) — one-use resources, hidden hazards, percept-based inference — and replaces every violent element with its community counterpart:

| Classic Wumpus World | Journey of Kindness | What is preserved |
|---|---|---|
| Wumpus | Rumor source 謠言源 | a hidden hazard, locatable only by inference |
| Stench | Rumor's unease 謠言氣息 | adjacency percept, emitted **only** by the rumor source |
| — (cf. Bump) | Murmur 雜音 — unfamiliar words near a language barrier | an independent adjacency percept, so the two hazards stay logically distinguishable |
| Pit / Breeze | Danger / unease 危險・不安 | unchanged |
| Arrow | Clarity 澄清力 (one use) | the scarce, single-use resource |
| Shoot | Dispel 澄清 — aimed at one adjacent cell inferred from the knowledge base | a JOK-defined action model, **not** the original directional long-range Shoot |
| Scream | RumorCleared — a global percept that the rumor is gone | outdated Stench facts are retracted from the KB |
| Gold | A family to find — then **escort safely home** | the goal, extended with an escort phase |

The mapping preserves the design intent — scarce resources, hidden danger, reasoning under partial observability. Its logical soundness rests on the percept, policy, and knowledge-base implementation itself, which this repository documents and tests. When no cell can be proven safe, the demo agent stops and says so: a deliberate JOK *safe-only* policy, stricter than AIMA's hybrid agent, which may take calculated risks.

---

## The Question This Project Asks

> *"If I give you three hours of my limited monthly availability, will you coordinate those hours well enough to create genuine impact?"*

---

## The Levels

| Level | Algorithm | AIMA Chapter | What You'll Learn |
|-------|-----------|--------------|-------------------|
| 1 | **A* Search** | Ch. 3 · Solving Problems by Searching | Finding the best path to deliver meals to elderly neighbors |
| 2 | **Propositional Logic** | Ch. 7 · Logical Agents | Making fair decisions about who receives resources |
| 3 | **MDP** | Ch. 17 · Making Complex Decisions | Planning actions when outcomes are uncertain |
| 4 | **Knowledge-Based Agent** | Ch. 7 · Logical Agents (Wumpus World) | Exploring new communities safely and respectfully |
| 5 | **Bayesian Networks** | Ch. 12–13 · Probabilistic Reasoning | Understanding what keeps volunteers engaged |
| 6 | **First-Order Logic** | Ch. 8–9 · First-Order Logic & Inference | Matching the right people to the right tasks |
| 7 | **AI Alignment & Safety** | Ch. 27.3 · The Ethics of AI | An aligned AI treats human choices as evidence, not commands |
| 8 | **Minimax · Alpha-Beta · MCTS** — *coming soon* | Ch. 5 · Adversarial Search and Games | Adversarial search: when the other side is also thinking |

All levels are grounded in Russell & Norvig, *Artificial Intelligence: A Modern Approach* (4th ed., Pearson 2021).

---

## Design Philosophy

**Ataraxy Portico (靜心之門)** — Between each level, players pause for breath and reflection with a Jing Si Aphorism. Each gate carries a different aphorism, chosen to match the algorithm that level teaches:

「前腳走，後腳放」  
*As we put the front foot down, we lift the back foot up. We let yesterday go, and focus on today.*

---

## Jing Si Aphorisms — Sources

Every aphorism attributed to Master Cheng Yen in this game carries a verifiable source, and no translation in this project is our own.

- **Eleven** are quoted verbatim — Chinese text and official English translation — from 《讀靜思語，學英文》(*Learning English through Jing Si Aphorisms*, Still Thoughts Cultural Mission), with page numbers recorded in the project's quotation archive.
- **One** (homepage footer) is from *Tzu Chi Monthly* No. 646, 〈三十一日 最美的語言〉, recording a Dharma talk given to alumni of the Menahel International School.
- **Two** are drawn from Tzu Chi's widely circulated collections; they were checked against eight chapters (52 aphorisms) of the volume above and are not included in that edition.
- **Four** aphorisms originally present in this game were **removed or replaced** during verification because no source could be established, or because the circulating text differed from the official record.

A verification script checks every attributed quotation in the codebase before release.

---

## Documentation

📄 **[Research Paper: "When Algorithms Remember What We Forget"](docs/Hsu_Final_Complete.pdf)**  
*Computational Thinking as Infrastructure for Sustainable Community Service*

📋 **[Development Timeline](docs/DEVELOPMENT_TIMELINE.docx)**  
*The journey from concept to implementation*

---

## Tech Stack

`HTML5` `CSS3` `JavaScript` `Python`

No framework, no build step, no runtime dependencies. Every level is a single self-contained HTML file that runs offline — a deliberate choice, so that a school with old laptops and unreliable Wi-Fi can still open it. The Python files hold the simulation and verification harnesses used during development, not the game itself.

---

## Acknowledgments

**Professor An Lam** — who taught CS4: Introduction to AI at Las Positas College, where this project first took shape.

**Roxanne Buchwitz 黃淑雲師姊 (法號慈昂)** — My mentor. The handful of raw rice you witnessed at John Muir Elementary in 2006 became the seed of all this.

**Sacramento Tzu Chi Volunteers Chou & Joe** — Who drove my family home from UC Davis Medical Center after my 2015 surgery, though we had never met. We were strangers connected only as Tzu Chi dharma family (法親).

**My Daughter** — Who donated her kidney to me and believes her mother can do anything. I'm trying.

**The Families of Hunters Point** — This work is for you.

**All Tzu Chi Dharma Family (法親)** — For walking this path together.

---

## License

MIT License — Feel free to adapt for your own community service projects.

---

*"Computational thinking does not replace compassion — it provides the structure compassion needs to become sustainable service."*

---

**© 2025-2026 Mei Hsien Hsu 許美嫻**  
Las Positas College · AI Certificate Program
