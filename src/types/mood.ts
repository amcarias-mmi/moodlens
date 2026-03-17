export type MoodLevel = 1 | 2 | 3 | 4 | 5;
// 1=Rough 😞  2=Low 😔  3=Okay 😐  4=Good 😊  5=Great 😄

export interface MoodEntry {
  id: string;
  date: string;                      // "YYYY-MM-DD"
  timestamp: number;                 // Unix ms
  mood: MoodLevel;
  note: string;                      // max 500 chars
  sentimentScore: number | null;     // normalized −1.0 to 1.0
  sentimentComparative: number | null;
  divergenceFlag: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NewEntryInput = Pick<MoodEntry, 'mood' | 'note'>;
