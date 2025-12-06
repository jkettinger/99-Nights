
export enum GamePhase {
  START_SCREEN = 'START_SCREEN',
  INTRO_DIALOGUE = 'INTRO_DIALOGUE',
  CLASSROOM_LESSON = 'CLASSROOM_LESSON',
  GRAMMAR_TASK = 'GRAMMAR_TASK',
  GRADING_WAIT = 'GRADING_WAIT',
  GRADING_RESULT = 'GRADING_RESULT',
  NIGHT_TRANSITION = 'NIGHT_TRANSITION',
  NIGHT_SURVIVAL = 'NIGHT_SURVIVAL',
  NIGHT_NOTE_READ = 'NIGHT_NOTE_READ',
  NIGHT_JOURNAL_ENTRY = 'NIGHT_JOURNAL_ENTRY',
  
  // Day 2 Phases
  SCIENCE_INTRO = 'SCIENCE_INTRO',
  SCIENCE_VIDEO = 'SCIENCE_VIDEO',
  SCIENCE_ACCUSATION = 'SCIENCE_ACCUSATION',
  EMPTY_CLASSROOM_EXPLORE = 'EMPTY_CLASSROOM_EXPLORE',

  // Day 3 Phases
  PRINCIPAL_OFFICE = 'PRINCIPAL_OFFICE',
  AFTERNOON_SPEECH = 'AFTERNOON_SPEECH',
  JUMPSCARE_SNICKERDOODLE = 'JUMPSCARE_SNICKERDOODLE',
  
  // Day 4 Phases
  HALLWAY_WALK = 'HALLWAY_WALK',
  BULLY_ENCOUNTER = 'BULLY_ENCOUNTER',
  NIGHT_4_NOTE = 'NIGHT_4_NOTE',
  NIGHT_4_JOURNAL = 'NIGHT_4_JOURNAL',

  // Day 5 Phases
  MRS_GRIM_NO_REACTION = 'MRS_GRIM_NO_REACTION',
  LUNCH_CONVERSATION = 'LUNCH_CONVERSATION',
  LUNCH_DETENTION_TASK = 'LUNCH_DETENTION_TASK',
  NIGHT_5_INTRO = 'NIGHT_5_INTRO',
  LIBRARY_WALK = 'LIBRARY_WALK',
  LIBRARY_REVEAL = 'LIBRARY_REVEAL',

  // Day 6 Phases
  DAY_6_SNICKERDOODLE_INTRO = 'DAY_6_SNICKERDOODLE_INTRO',
  DAY_6_PRINCIPAL_OFFICE = 'DAY_6_PRINCIPAL_OFFICE',
  DAY_6_WALK_TO_LIBRARY = 'DAY_6_WALK_TO_LIBRARY',
  DAY_6_LIBRARY_EMPTY = 'DAY_6_LIBRARY_EMPTY',
  
  // Night 6 Phases
  NIGHT_6_INTRO = 'NIGHT_6_INTRO',
  NIGHT_6_MUSIC_WALK = 'NIGHT_6_MUSIC_WALK',
  NIGHT_6_MUSIC_REVEAL = 'NIGHT_6_MUSIC_REVEAL',

  // Day 7 Phases
  DAY_7_THARNETT_INTRO = 'DAY_7_THARNETT_INTRO',
  DAY_7_PINKY_MOVIE = 'DAY_7_PINKY_MOVIE',
  DAY_7_HALLWAY_ESCAPE = 'DAY_7_HALLWAY_ESCAPE',
  DAY_7_GRIM_SUFFIX_INTRO = 'DAY_7_GRIM_SUFFIX_INTRO',
  DAY_7_GRIM_SUFFIX_TASK = 'DAY_7_GRIM_SUFFIX_TASK',
  DAY_7_GRIM_FAILURE = 'DAY_7_GRIM_FAILURE',
  
  // Night 7 Phases
  NIGHT_7_INTRO = 'NIGHT_7_INTRO',
  NIGHT_7_LOBBY_SEARCH = 'NIGHT_7_LOBBY_SEARCH',
  NIGHT_7_THEATER_END = 'NIGHT_7_THEATER_END',

  GAME_OVER = 'GAME_OVER',
}

export enum ItemType {
  PENCIL = 'Old Pencil',
  BACKPACK = 'Old Backpack',
  PAPER_A_PLUS = 'Graded Paper (A+)',
  PAPER_F_MINUS = 'Graded Paper (F-)',
  STRANGE_NOTE = 'Strange Note',
  VHS_TAPE = 'VHS Tape',
}

export interface InventoryItem {
  id: string;
  type: ItemType;
  description: string;
  icon: string;
}

export enum GrammarRole {
  NOUN = 'Noun',
  ARTICLE = 'Article',
  PREPOSITION = 'Preposition',
  NONE = 'None',
  TARGET_WORD = 'Target Word' // For Day 7
}

export interface WordToken {
  id: number;
  text: string;
  cleanText: string; // Text without punctuation for checking
  correctRoles: GrammarRole[];
}

export interface GrammarSubmission {
  nounId: number | null;
  articleId: number | null;
  prepositionId: number | null;
  singleWordId?: number | null; // For Day 7
}

export interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: 'neutral' | 'angry' | 'happy' | 'scary';
}
