// Game configuration for Kingdom's Rise

export type ResourceType = 'food' | 'wood' | 'gold';
export type TroopType = 'swordsman' | 'archer' | 'knight' | 'cavalry';
export type BuildingId = 'castle' | 'farm' | 'sawmill' | 'goldMine' | 'barracks' | 'stable' | 'archery' | 'walls' | 'warehouse';
export type ResearchId = 'farming' | 'logging' | 'mining' | 'swordsmanTraining' | 'archerTraining' | 'knightTraining' | 'cavalryTraining' | 'stoneWalls' | 'siegeWeapons' | 'merchantGuild';

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  baseCost: Record<ResourceType, number>;
  costMultiplier: number;
  buildTime: number; // seconds per level
  production?: { resource: ResourceType; baseRate: number }; // per minute at level 1
  storageBonus?: number; // per level
  defenseBonus?: number; // per level
  unlockRequires?: { buildingId: BuildingId; level: number };
}

export interface TroopConfig {
  id: TroopType;
  name: string;
  icon: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  power: number;
  trainTime: number; // seconds
  requires: BuildingId;
  requiresLevel: number;
  upkeep: Partial<Record<ResourceType, number>>; // per minute
}

export interface EnemyCamp {
  id: string;
  name: string;
  icon: string;
  description: string;
  power: number;
  loot: Partial<Record<ResourceType, number>>;
  cooldown: number; // seconds before you can attack again
  minCastleLevel: number;
}

export interface ResearchConfig {
  id: ResearchId;
  name: string;
  icon: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  researchTime: number; // seconds
  effect: string;
  requires?: ResearchId;
}

export const BUILDINGS: Record<BuildingId, BuildingConfig> = {
  castle: {
    id: 'castle',
    name: 'Замок',
    icon: '🏰',
    description: 'Главное здание королевства. Определяет максимальный уровень остальных построек.',
    maxLevel: 10,
    baseCost: { food: 0, wood: 200, gold: 100 },
    costMultiplier: 2.5,
    buildTime: 60,
  },
  farm: {
    id: 'farm',
    name: 'Ферма',
    icon: '🌾',
    description: 'Производит еду для ваших воинов.',
    maxLevel: 10,
    baseCost: { food: 0, wood: 80, gold: 0 },
    costMultiplier: 1.8,
    buildTime: 30,
    production: { resource: 'food', baseRate: 20 },
  },
  sawmill: {
    id: 'sawmill',
    name: 'Лесопилка',
    icon: '🪵',
    description: 'Заготавливает древесину для строительства.',
    maxLevel: 10,
    baseCost: { food: 50, wood: 0, gold: 0 },
    costMultiplier: 1.8,
    buildTime: 30,
    production: { resource: 'wood', baseRate: 15 },
  },
  goldMine: {
    id: 'goldMine',
    name: 'Золотой рудник',
    icon: '⛏️',
    description: 'Добывает золото из недр земли.',
    maxLevel: 10,
    baseCost: { food: 100, wood: 100, gold: 0 },
    costMultiplier: 2.0,
    buildTime: 45,
    production: { resource: 'gold', baseRate: 8 },
    unlockRequires: { buildingId: 'castle', level: 2 },
  },
  barracks: {
    id: 'barracks',
    name: 'Казармы',
    icon: '⚔️',
    description: 'Здесь тренируются мечники и рыцари.',
    maxLevel: 10,
    baseCost: { food: 0, wood: 150, gold: 50 },
    costMultiplier: 2.0,
    buildTime: 45,
    unlockRequires: { buildingId: 'castle', level: 1 },
  },
  stable: {
    id: 'stable',
    name: 'Конюшня',
    icon: '🐴',
    description: 'Обучает кавалерию — мощных всадников.',
    maxLevel: 10,
    baseCost: { food: 100, wood: 200, gold: 50 },
    costMultiplier: 2.0,
    buildTime: 60,
    unlockRequires: { buildingId: 'castle', level: 3 },
  },
  archery: {
    id: 'archery',
    name: 'Стрельбище',
    icon: '🏹',
    description: 'Тренирует меткострелов — лучников.',
    maxLevel: 10,
    baseCost: { food: 50, wood: 120, gold: 30 },
    costMultiplier: 1.9,
    buildTime: 40,
    unlockRequires: { buildingId: 'castle', level: 2 },
  },
  walls: {
    id: 'walls',
    name: 'Стены',
    icon: '🧱',
    description: 'Защищают замок от нападений. Каждый уровень усиливает оборону.',
    maxLevel: 10,
    baseCost: { food: 0, wood: 100, gold: 50 },
    costMultiplier: 2.2,
    buildTime: 50,
    defenseBonus: 15,
    unlockRequires: { buildingId: 'castle', level: 2 },
  },
  warehouse: {
    id: 'warehouse',
    name: 'Склад',
    icon: '📦',
    description: 'Увеличивает максимальный запас ресурсов.',
    maxLevel: 10,
    baseCost: { food: 0, wood: 100, gold: 20 },
    costMultiplier: 1.7,
    buildTime: 25,
    storageBonus: 500,
  },
};

export const TROOPS: Record<TroopType, TroopConfig> = {
  swordsman: {
    id: 'swordsman',
    name: 'Мечник',
    icon: '🗡️',
    description: 'Базовая пехота. Дёшевы и обучаются быстро.',
    cost: { food: 50, wood: 30 },
    power: 10,
    trainTime: 20,
    requires: 'barracks',
    requiresLevel: 1,
    upkeep: { food: 1 },
  },
  archer: {
    id: 'archer',
    name: 'Лучник',
    icon: '🏹',
    description: 'Дальнобойный боец. Эффективен против лёгкой брони.',
    cost: { food: 40, wood: 60 },
    power: 14,
    trainTime: 30,
    requires: 'archery',
    requiresLevel: 1,
    upkeep: { food: 1 },
  },
  knight: {
    id: 'knight',
    name: 'Рыцарь',
    icon: '🛡️',
    description: 'Тяжёлая пехота в доспехах. Высокая защита и атака.',
    cost: { food: 100, wood: 80, gold: 50 },
    power: 28,
    trainTime: 60,
    requires: 'barracks',
    requiresLevel: 3,
    upkeep: { food: 2, gold: 1 },
  },
  cavalry: {
    id: 'cavalry',
    name: 'Кавалерия',
    icon: '🐎',
    description: 'Быстрые всадники. Смертоносны в атаке.',
    cost: { food: 80, wood: 50, gold: 80 },
    power: 35,
    trainTime: 90,
    requires: 'stable',
    requiresLevel: 1,
    upkeep: { food: 3, gold: 1 },
  },
};

export const ENEMY_CAMPS: EnemyCamp[] = [
  {
    id: 'banditCamp',
    name: 'Лагерь разбойников',
    icon: '🏕️',
    description: 'Шайка дорожных грабителей. Слабо вооружены.',
    power: 30,
    loot: { food: 200, wood: 150 },
    cooldown: 300,
    minCastleLevel: 1,
  },
  {
    id: 'goblinWarren',
    name: 'Логово гоблинов',
    icon: '👺',
    description: 'Мелкие, но многочисленные существа.',
    power: 70,
    loot: { food: 400, wood: 300, gold: 50 },
    cooldown: 600,
    minCastleLevel: 1,
  },
  {
    id: 'darkForest',
    name: 'Тёмный лес',
    icon: '🌲',
    description: 'Логово лесных разбойников и волков.',
    power: 120,
    loot: { food: 300, wood: 600, gold: 80 },
    cooldown: 900,
    minCastleLevel: 2,
  },
  {
    id: 'orcTribe',
    name: 'Племя орков',
    icon: '👹',
    description: 'Дикие орки — жестокие и сильные.',
    power: 200,
    loot: { food: 500, wood: 400, gold: 150 },
    cooldown: 1200,
    minCastleLevel: 3,
  },
  {
    id: 'abandonedMine',
    name: 'Заброшенный рудник',
    icon: '⛏️',
    description: 'Занят бандитами, охраняющими золото.',
    power: 250,
    loot: { food: 200, wood: 200, gold: 400 },
    cooldown: 1800,
    minCastleLevel: 3,
  },
  {
    id: 'trollBridge',
    name: 'Мост троллей',
    icon: '🌉',
    description: 'Тролли взимают непомерную плату за проезд.',
    power: 350,
    loot: { food: 600, wood: 600, gold: 300 },
    cooldown: 2400,
    minCastleLevel: 4,
  },
  {
    id: 'blackKnight',
    name: 'Замок Чёрного Рыцаря',
    icon: '🖤',
    description: 'Опытный полководец на службе тьмы.',
    power: 500,
    loot: { food: 800, wood: 500, gold: 500 },
    cooldown: 3600,
    minCastleLevel: 5,
  },
  {
    id: 'dragonLair',
    name: 'Логово дракона',
    icon: '🐉',
    description: 'Древний дракон охраняет несметные сокровища.',
    power: 800,
    loot: { food: 1000, wood: 1000, gold: 1500 },
    cooldown: 7200,
    minCastleLevel: 7,
  },
];

export const RESEARCH: ResearchConfig[] = [
  {
    id: 'farming',
    name: 'Агрокультура',
    icon: '🌾',
    description: '+25% к производству еды',
    cost: { food: 500, wood: 300 },
    researchTime: 120,
    effect: 'food_production_+25',
  },
  {
    id: 'logging',
    name: 'Лесозаготовка',
    icon: '🪵',
    description: '+25% к производству древесины',
    cost: { food: 300, wood: 500 },
    researchTime: 120,
    effect: 'wood_production_+25',
  },
  {
    id: 'mining',
    name: 'Горное дело',
    icon: '⛏️',
    description: '+25% к добыче золота',
    cost: { food: 500, wood: 500, gold: 100 },
    researchTime: 180,
    effect: 'gold_production_+25',
    requires: 'farming',
  },
  {
    id: 'swordsmanTraining',
    name: 'Военная подготовка',
    icon: '🗡️',
    description: '+20% к силе мечников',
    cost: { food: 400, wood: 200, gold: 100 },
    researchTime: 150,
    effect: 'swordsman_power_+20',
  },
  {
    id: 'archerTraining',
    name: 'Меткая стрельба',
    icon: '🎯',
    description: '+20% к силе лучников',
    cost: { food: 300, wood: 400, gold: 100 },
    researchTime: 150,
    effect: 'archer_power_+20',
  },
  {
    id: 'knightTraining',
    name: 'Рыцарский кодекс',
    icon: '🛡️',
    description: '+20% к силе рыцарей',
    cost: { food: 600, wood: 400, gold: 300 },
    researchTime: 240,
    effect: 'knight_power_+20',
    requires: 'swordsmanTraining',
  },
  {
    id: 'cavalryTraining',
    name: 'Конные манёвры',
    icon: '🐎',
    description: '+20% к силе кавалерии',
    cost: { food: 500, wood: 300, gold: 400 },
    researchTime: 240,
    effect: 'cavalry_power_+20',
    requires: 'swordsmanTraining',
  },
  {
    id: 'stoneWalls',
    name: 'Каменные стены',
    icon: '🏰',
    description: '+50% к защите стен',
    cost: { food: 200, wood: 800, gold: 200 },
    researchTime: 300,
    effect: 'wall_defense_+50',
    requires: 'logging',
  },
  {
    id: 'siegeWeapons',
    name: 'Осадные орудия',
    icon: '⚙️',
    description: '+30% к добыче при победе в бою',
    cost: { food: 400, wood: 600, gold: 400 },
    researchTime: 360,
    effect: 'loot_+30',
    requires: 'knightTraining',
  },
  {
    id: 'merchantGuild',
    name: 'Купеческая гильдия',
    icon: '💰',
    description: '+15% к хранилищу всех ресурсов',
    cost: { food: 600, wood: 600, gold: 600 },
    researchTime: 420,
    effect: 'storage_+15',
    requires: 'mining',
  },
];

export const BASE_STORAGE = 2000;
export const INITIAL_RESOURCES = { food: 500, wood: 500, gold: 200 };
export const RESOURCE_TICK_MS = 5000; // 5 seconds

export function getBuildingCost(building: BuildingConfig, targetLevel: number): Record<ResourceType, number> {
  const mult = Math.pow(building.costMultiplier, targetLevel - 1);
  return {
    food: Math.floor(building.baseCost.food * mult),
    wood: Math.floor(building.baseCost.wood * mult),
    gold: Math.floor(building.baseCost.gold * mult),
  };
}

export function getBuildingBuildTime(building: BuildingConfig, targetLevel: number): number {
  return Math.floor(building.buildTime * Math.pow(1.5, targetLevel - 1));
}

export function getProductionRate(building: BuildingConfig, level: number): number {
  if (!building.production || level === 0) return 0;
  return building.production.baseRate * level;
}
