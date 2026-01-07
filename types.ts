export enum ItemType {
  PLAYER_HOME = 'PLAYER_HOME',
  PLAYER_AWAY = 'PLAYER_AWAY',
  GK = 'GK',
  BALL = 'BALL',
  CONE = 'CONE',
  GOAL = 'GOAL',
  LADDER = 'LADDER',
  NOTE = 'NOTE'
}

export enum LineType {
  MOVEMENT = 'MOVEMENT',
  PASS = 'PASS',
  DRIBBLE = 'DRIBBLE'
}

export enum PitchType {
  FULL = 'FULL',
  HALF = 'HALF',
  BOX = 'BOX',
  EMPTY = 'EMPTY'
}

export interface Position {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface TacticalItem {
  id: string;
  type: ItemType;
  pos: Position;
  label?: string; // Jersey number or name
  rotation: number; // Degrees
  text?: string; // For notes
}

export interface TacticalLine {
  id: string;
  type: LineType;
  start: Position;
  end: Position;
}

export interface SavedTactic {
  id: string;
  name: string;
  createdAt: number;
  items: TacticalItem[];
  lines: TacticalLine[];
  pitchType?: PitchType;
  description?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
  tacticData?: {
    items: TacticalItem[];
    lines: TacticalLine[];
  };
}