// Type definitions for Journey of Kindness
interface GameLevel {
    id: number;
    name: string;
    algorithm: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface Player {
    name: string;
    score: number;
    completedLevels: number[];
}

type Language = 'en' | 'zh' | 'es';

export { GameLevel, Player, Language };
