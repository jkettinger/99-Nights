import {
  Axe,
  Beer,
  Bird,
  BookOpen,
  Castle,
  Church,
  Compass,
  Crown,
  Dices,
  Eye,
  Feather,
  Fish,
  Flag,
  Flame,
  FlameKindling,
  Gem,
  Ghost,
  Hammer,
  Heart,
  Home,
  Key,
  Library,
  Lock,
  Map,
  Moon,
  MoonStar,
  Mountain,
  MountainSnow,
  Pickaxe,
  Scroll,
  ScrollText,
  Shield,
  ShieldHalf,
  Skull,
  Sparkles,
  Star,
  Sun,
  Sword,
  Swords,
  Target,
  Tent,
  TentTree,
  TowerControl,
  TreeDeciduous,
  TreePine,
  Trees,
  Trophy,
  Wand,
  WandSparkles,
  Wine,
  Zap,
  Anchor,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface IconEntry {
  component: LucideIcon
  label: string
  category: string
}

export const ICON_MAP: Record<string, IconEntry> = {
  // Fortifications
  castle:         { component: Castle,         label: 'Castle',         category: 'Fortifications' },
  'tower-control':{ component: TowerControl,   label: 'Tower',          category: 'Fortifications' },
  church:         { component: Church,          label: 'Church',         category: 'Fortifications' },
  home:           { component: Home,            label: 'Home',           category: 'Fortifications' },

  // Weapons & Combat
  sword:          { component: Sword,           label: 'Sword',          category: 'Combat' },
  swords:         { component: Swords,          label: 'Crossed Swords', category: 'Combat' },
  axe:            { component: Axe,             label: 'Axe',            category: 'Combat' },
  shield:         { component: Shield,          label: 'Shield',         category: 'Combat' },
  'shield-half':  { component: ShieldHalf,      label: 'Shield Half',    category: 'Combat' },
  target:         { component: Target,          label: 'Target',         category: 'Combat' },

  // Knowledge
  'book-open':    { component: BookOpen,        label: 'Book',           category: 'Knowledge' },
  library:        { component: Library,         label: 'Library',        category: 'Knowledge' },
  scroll:         { component: Scroll,          label: 'Scroll',         category: 'Knowledge' },
  'scroll-text':  { component: ScrollText,      label: 'Scroll Text',    category: 'Knowledge' },

  // Magic
  wand:           { component: Wand,            label: 'Wand',           category: 'Magic' },
  'wand-sparkles':{ component: WandSparkles,    label: 'Wand Sparkles',  category: 'Magic' },
  sparkles:       { component: Sparkles,        label: 'Sparkles',       category: 'Magic' },
  eye:            { component: Eye,             label: 'Eye',            category: 'Magic' },
  gem:            { component: Gem,             label: 'Gem',            category: 'Magic' },
  flame:          { component: Flame,           label: 'Flame',          category: 'Magic' },
  'flame-kindling':{ component: FlameKindling,  label: 'Campfire',       category: 'Magic' },
  zap:            { component: Zap,             label: 'Lightning',      category: 'Magic' },

  // Royalty & Treasure
  crown:          { component: Crown,           label: 'Crown',          category: 'Treasure' },
  key:            { component: Key,             label: 'Key',            category: 'Treasure' },
  lock:           { component: Lock,            label: 'Lock',           category: 'Treasure' },
  trophy:         { component: Trophy,          label: 'Trophy',         category: 'Treasure' },
  heart:          { component: Heart,           label: 'Heart',          category: 'Treasure' },

  // Nature
  'tree-pine':    { component: TreePine,        label: 'Pine Tree',      category: 'Nature' },
  'tree-deciduous':{ component: TreeDeciduous,  label: 'Oak Tree',       category: 'Nature' },
  trees:          { component: Trees,           label: 'Forest',         category: 'Nature' },
  mountain:       { component: Mountain,        label: 'Mountain',       category: 'Nature' },
  'mountain-snow':{ component: MountainSnow,    label: 'Snowy Peak',     category: 'Nature' },
  moon:           { component: Moon,            label: 'Moon',           category: 'Nature' },
  'moon-star':    { component: MoonStar,        label: 'Moon & Star',    category: 'Nature' },
  star:           { component: Star,            label: 'Star',           category: 'Nature' },
  sun:            { component: Sun,             label: 'Sun',            category: 'Nature' },
  feather:        { component: Feather,         label: 'Feather',        category: 'Nature' },
  bird:           { component: Bird,            label: 'Bird',           category: 'Nature' },
  fish:           { component: Fish,            label: 'Fish',           category: 'Nature' },

  // Tavern & Trade
  beer:           { component: Beer,            label: 'Tankard',        category: 'Tavern' },
  wine:           { component: Wine,            label: 'Wine',           category: 'Tavern' },
  dices:          { component: Dices,           label: 'Dice',           category: 'Tavern' },

  // Travel & Tools
  compass:        { component: Compass,         label: 'Compass',        category: 'Travel' },
  map:            { component: Map,             label: 'Map',            category: 'Travel' },
  flag:           { component: Flag,            label: 'Flag',           category: 'Travel' },
  tent:           { component: Tent,            label: 'Tent',           category: 'Travel' },
  'tent-tree':    { component: TentTree,        label: 'Camp',           category: 'Travel' },
  anchor:         { component: Anchor,          label: 'Anchor',         category: 'Travel' },
  hammer:         { component: Hammer,          label: 'Hammer',         category: 'Travel' },
  pickaxe:        { component: Pickaxe,         label: 'Pickaxe',        category: 'Travel' },

  // Dark
  skull:          { component: Skull,           label: 'Skull',          category: 'Dark' },
  ghost:          { component: Ghost,           label: 'Ghost',          category: 'Dark' },
}

export const ICON_NAMES = Object.keys(ICON_MAP)

export const CATEGORIES = [...new Set(Object.values(ICON_MAP).map((e) => e.category))]
