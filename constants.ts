import { ItemType, LineType } from './types';
import { 
  User, 
  CircleDot,
  Triangle,
  Goal,
  UserCircle,
  AlignJustify,
  StickyNote
} from 'lucide-react';

export const FIELD_ASPECT_RATIO = 1.5; // Standard pitch ratio approx

export const ITEM_CONFIG = {
  [ItemType.PLAYER_HOME]: {
    label: 'Home Player',
    icon: User,
    color: 'bg-blue-600',
    textColor: 'text-white',
    defaultSize: 32, // px
  },
  [ItemType.PLAYER_AWAY]: {
    label: 'Away Player',
    icon: User,
    color: 'bg-red-600',
    textColor: 'text-white',
    defaultSize: 32,
  },
  [ItemType.GK]: {
    label: 'Goalkeeper',
    icon: UserCircle,
    color: 'bg-yellow-400',
    textColor: 'text-black',
    defaultSize: 32,
  },
  [ItemType.BALL]: {
    label: 'Ball',
    icon: CircleDot,
    color: 'bg-white',
    textColor: 'text-black',
    defaultSize: 20,
  },
  [ItemType.CONE]: {
    label: 'Cone',
    icon: Triangle,
    color: 'bg-orange-500',
    textColor: 'text-white',
    defaultSize: 24,
  },
  [ItemType.GOAL]: {
    label: 'Goal',
    icon: Goal,
    color: 'bg-white/80',
    textColor: 'text-black',
    defaultSize: 60,
  },
  [ItemType.LADDER]: {
    label: 'Agility Ladder',
    icon: AlignJustify,
    color: 'bg-yellow-300', // Used for sidebar, custom render on pitch
    textColor: 'text-black',
    defaultSize: 40, // Fallback
    width: 30,
    height: 120
  },
  [ItemType.NOTE]: {
    label: 'Note',
    icon: StickyNote,
    color: 'bg-amber-200',
    textColor: 'text-amber-900',
    defaultSize: 28,
  }
};

export const LINE_CONFIG = {
  [LineType.MOVEMENT]: {
    label: 'Movement',
    color: '#fbbf24', // amber-400
    dashArray: '0',
    strokeWidth: 1.5
  },
  [LineType.PASS]: {
    label: 'Pass',
    color: '#38bdf8', // sky-400
    dashArray: '4, 4',
    strokeWidth: 1.5
  },
  [LineType.DRIBBLE]: {
    label: 'Dribble',
    color: '#ffffff',
    dashArray: '1, 3', // dotted looks like small dribble touches
    strokeWidth: 1.5
  }
};

export const INITIAL_ITEMS: any[] = [];