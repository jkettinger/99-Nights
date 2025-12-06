
import { ItemType, InventoryItem, WordToken, GrammarRole } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    type: ItemType.PENCIL,
    description: 'A chewed up yellow pencil. The lead is dull.',
    icon: '✏️'
  },
  {
    id: '2',
    type: ItemType.BACKPACK,
    description: 'Faded canvas backpack. smells like old gym socks.',
    icon: '🎒'
  }
];

export const INITIAL_SENTENCE = "The temperature on the driveway is hotter than the sun.";

export const PARSED_SENTENCE_TOKENS: WordToken[] = [
  { id: 0, text: "The", cleanText: "the", correctRoles: [GrammarRole.ARTICLE] },
  { id: 1, text: "temperature", cleanText: "temperature", correctRoles: [GrammarRole.NOUN] },
  { id: 2, text: "on", cleanText: "on", correctRoles: [GrammarRole.PREPOSITION] },
  { id: 3, text: "the", cleanText: "the", correctRoles: [GrammarRole.ARTICLE] },
  { id: 4, text: "driveway", cleanText: "driveway", correctRoles: [GrammarRole.NOUN] },
  { id: 5, text: "is", cleanText: "is", correctRoles: [] },
  { id: 6, text: "hotter", cleanText: "hotter", correctRoles: [] }, 
  { id: 7, text: "than", cleanText: "than", correctRoles: [] },
  { id: 8, text: "the", cleanText: "the", correctRoles: [GrammarRole.ARTICLE] },
  { id: 9, text: "sun.", cleanText: "sun", correctRoles: [GrammarRole.NOUN] },
];

export const DAY_7_SENTENCE = "Chris is going to the UK to and hes going to speak with the employess.";

export const DAY_7_TOKENS: WordToken[] = [
    { id: 0, text: "Chris", cleanText: "Chris", correctRoles: [] },
    { id: 1, text: "is", cleanText: "is", correctRoles: [] },
    { id: 2, text: "going", cleanText: "going", correctRoles: [] },
    { id: 3, text: "to", cleanText: "to", correctRoles: [] },
    { id: 4, text: "the", cleanText: "the", correctRoles: [] },
    { id: 5, text: "UK", cleanText: "UK", correctRoles: [] },
    { id: 6, text: "to", cleanText: "to", correctRoles: [] },
    { id: 7, text: "and", cleanText: "and", correctRoles: [] },
    { id: 8, text: "hes", cleanText: "hes", correctRoles: [] },
    { id: 9, text: "going", cleanText: "going", correctRoles: [] },
    { id: 10, text: "to", cleanText: "to", correctRoles: [] },
    { id: 11, text: "speak", cleanText: "speak", correctRoles: [GrammarRole.TARGET_WORD] },
    { id: 12, text: "with", cleanText: "with", correctRoles: [] },
    { id: 13, text: "the", cleanText: "the", correctRoles: [] },
    { id: 14, text: "employess.", cleanText: "employess", correctRoles: [] },
];