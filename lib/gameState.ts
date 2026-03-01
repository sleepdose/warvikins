"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BuildingId, TroopType, ResearchId, ResourceType,
  BUILDINGS, TROOPS, RESEARCH, ENEMY_CAMPS,
  BASE_STORAGE, INITIAL_RESOURCES, RESOURCE_TICK_MS,
  getBuildingCost, getBuildingBuildTime, getProductionRate
} from './gameConfig';

export interface BuildingState {
  level: number;
  upgrading: boolean;
  upgradeFinish: number | null;
}

export interface TrainingEntry {
  id: string;
  troopType: TroopType;
  count: number;
  finishTime: number;
}

export interface ResearchEntry {
  id: ResearchId;
  finishTime: number;
}

export interface EnemyCampState {
  cooldown: number; // timestamp when cooldown ends (0 = ready)
}

export interface BattleResult {
  victory: boolean;
  loot: Partial<Record<ResourceType, number>>;
  troopsLost: Partial<Record<TroopType, number>>;
  enemyName: string;
  enemyIcon: string;
}

export interface GameState {
  resources: Record<ResourceType, number>;
  buildings: Record<BuildingId, BuildingState>;
  troops: Record<TroopType, number>;
  trainingQueue: TrainingEntry[];
  researchQueue: ResearchEntry | null;
  completedResearch: ResearchId[];
  enemyCamps: Record<string, EnemyCampState>;
  lastTick: number;
  playerName: string;
}

const defaultBuildings: Record<BuildingId, BuildingState> = {
  castle: { level: 1, upgrading: false, upgradeFinish: null },
  farm: { level: 1, upgrading: false, upgradeFinish: null },
  sawmill: { level: 0, upgrading: false, upgradeFinish: null },
  goldMine: { level: 0, upgrading: false, upgradeFinish: null },
  barracks: { level: 0, upgrading: false, upgradeFinish: null },
  stable: { level: 0, upgrading: false, upgradeFinish: null },
  archery: { level: 0, upgrading: false, upgradeFinish: null },
  walls: { level: 0, upgrading: false, upgradeFinish: null },
  warehouse: { level: 0, upgrading: false, upgradeFinish: null },
};

const defaultEnemyCamps: Record<string, EnemyCampState> = {};
ENEMY_CAMPS.forEach(c => { defaultEnemyCamps[c.id] = { cooldown: 0 }; });

function createDefaultState(): GameState {
  return {
    resources: { ...INITIAL_RESOURCES },
    buildings: { ...defaultBuildings },
    troops: { swordsman: 0, archer: 0, knight: 0, cavalry: 0 },
    trainingQueue: [],
    researchQueue: null,
    completedResearch: [],
    enemyCamps: { ...defaultEnemyCamps },
    lastTick: Date.now(),
    playerName: 'Правитель',
  };
}

function loadState(): GameState {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const saved = localStorage.getItem('kingdom_rise_save');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new fields
      return {
        ...createDefaultState(),
        ...parsed,
        buildings: { ...defaultBuildings, ...parsed.buildings },
        troops: { swordsman: 0, archer: 0, knight: 0, cavalry: 0, ...parsed.troops },
        enemyCamps: { ...defaultEnemyCamps, ...parsed.enemyCamps },
      };
    }
  } catch (e) {
    console.log('Failed to load save, starting fresh:', e);
  }
  return createDefaultState();
}

function saveState(state: GameState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kingdom_rise_save', JSON.stringify(state));
  } catch (e) {
    console.log('Failed to save state:', e);
  }
}

export function getMaxStorage(state: GameState): number {
  const warehouseLevel = state.buildings.warehouse.level;
  const warehouseCfg = BUILDINGS.warehouse;
  const baseBonus = (warehouseCfg.storageBonus || 0) * warehouseLevel;
  const hasGuild = state.completedResearch.includes('merchantGuild');
  return Math.floor((BASE_STORAGE + baseBonus) * (hasGuild ? 1.15 : 1));
}

export function getTotalArmyPower(state: GameState): number {
  let power = 0;
  (Object.entries(state.troops) as [TroopType, number][]).forEach(([type, count]) => {
    const cfg = TROOPS[type];
    const bonus = getResearchBonus(state, `${type}_power`);
    power += count * cfg.power * (1 + bonus / 100);
  });
  return Math.floor(power);
}

export function getResearchBonus(state: GameState, effectPrefix: string): number {
  let bonus = 0;
  state.completedResearch.forEach(rid => {
    const r = RESEARCH.find(r => r.id === rid);
    if (r && r.effect.startsWith(effectPrefix)) {
      const match = r.effect.match(/\+(\d+)$/);
      if (match) bonus += parseInt(match[1]);
    }
  });
  return bonus;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => loadState());
  const stateRef = useRef(state);
  stateRef.current = state;

  // Passive resource generation tick
  useEffect(() => {
    const tick = () => {
      setState(prev => {
        const now = Date.now();
        const elapsed = (now - prev.lastTick) / 1000 / 60; // minutes
        const maxStorage = getMaxStorage(prev);

        let newResources = { ...prev.resources };

        // Generate resources from buildings
        (['farm', 'sawmill', 'goldMine'] as BuildingId[]).forEach(bid => {
          const building = BUILDINGS[bid];
          const level = prev.buildings[bid].level;
          if (building.production && level > 0) {
            const rate = getProductionRate(building, level);
            const resourceType = building.production.resource;
            const bonus = getResearchBonus(prev, `${resourceType}_production`);
            const produced = rate * elapsed * (1 + bonus / 100);
            newResources[resourceType] = Math.min(maxStorage, newResources[resourceType] + produced);
          }
        });

        // Process training queue
        let newTroops = { ...prev.troops };
        let newTrainingQueue = [...prev.trainingQueue];
        const completedTraining: string[] = [];
        
        newTrainingQueue.forEach(entry => {
          if (now >= entry.finishTime) {
            newTroops[entry.troopType] = (newTroops[entry.troopType] || 0) + entry.count;
            completedTraining.push(entry.id);
            console.log(`Training complete: ${entry.count} ${entry.troopType}`);
          }
        });
        newTrainingQueue = newTrainingQueue.filter(e => !completedTraining.includes(e.id));

        // Process building upgrades
        let newBuildings = { ...prev.buildings };
        let anyBuildingDone = false;
        (Object.keys(newBuildings) as BuildingId[]).forEach(bid => {
          const b = newBuildings[bid];
          if (b.upgrading && b.upgradeFinish && now >= b.upgradeFinish) {
            newBuildings[bid] = { level: b.level + 1, upgrading: false, upgradeFinish: null };
            anyBuildingDone = true;
            console.log(`Building upgrade complete: ${bid} -> level ${b.level + 1}`);
          }
        });

        // Process research queue
        let newResearchQueue = prev.researchQueue;
        let newCompletedResearch = [...prev.completedResearch];
        if (newResearchQueue && now >= newResearchQueue.finishTime) {
          if (!newCompletedResearch.includes(newResearchQueue.id)) {
            newCompletedResearch.push(newResearchQueue.id);
            console.log(`Research complete: ${newResearchQueue.id}`);
          }
          newResearchQueue = null;
        }

        const newState = {
          ...prev,
          resources: newResources,
          troops: newTroops,
          trainingQueue: newTrainingQueue,
          buildings: anyBuildingDone ? newBuildings : prev.buildings,
          researchQueue: newResearchQueue,
          completedResearch: newCompletedResearch,
          lastTick: now,
        };

        saveState(newState);
        return newState;
      });
    };

    const interval = setInterval(tick, RESOURCE_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const upgradeBuilding = useCallback((buildingId: BuildingId) => {
    setState(prev => {
      const building = BUILDINGS[buildingId];
      const currentLevel = prev.buildings[buildingId].level;
      const targetLevel = currentLevel + 1;

      if (targetLevel > building.maxLevel) return prev;
      if (prev.buildings[buildingId].upgrading) return prev;

      // Check castle level requirement for other buildings
      if (buildingId !== 'castle') {
        const castleLevel = prev.buildings.castle.level;
        if (targetLevel > castleLevel) return prev;
      }

      const cost = getBuildingCost(building, targetLevel);
      if (
        prev.resources.food < cost.food ||
        prev.resources.wood < cost.wood ||
        prev.resources.gold < cost.gold
      ) return prev;

      const buildTime = getBuildingBuildTime(building, targetLevel);

      const newState = {
        ...prev,
        resources: {
          food: prev.resources.food - cost.food,
          wood: prev.resources.wood - cost.wood,
          gold: prev.resources.gold - cost.gold,
        },
        buildings: {
          ...prev.buildings,
          [buildingId]: {
            ...prev.buildings[buildingId],
            upgrading: true,
            upgradeFinish: Date.now() + buildTime * 1000,
          },
        },
      };
      saveState(newState);
      console.log(`Started upgrading ${buildingId} to level ${targetLevel}`);
      return newState;
    });
  }, []);

  const trainTroops = useCallback((troopType: TroopType, count: number) => {
    setState(prev => {
      const troop = TROOPS[troopType];
      const totalCost = {
        food: (troop.cost.food || 0) * count,
        wood: (troop.cost.wood || 0) * count,
        gold: (troop.cost.gold || 0) * count,
      };

      if (
        prev.resources.food < totalCost.food ||
        prev.resources.wood < totalCost.wood ||
        prev.resources.gold < totalCost.gold
      ) return prev;

      const lastInQueue = prev.trainingQueue[prev.trainingQueue.length - 1];
      const startTime = lastInQueue ? lastInQueue.finishTime : Date.now();
      const finishTime = startTime + troop.trainTime * count * 1000;

      const entry: TrainingEntry = {
        id: `${troopType}_${Date.now()}`,
        troopType,
        count,
        finishTime,
      };

      const newState = {
        ...prev,
        resources: {
          food: prev.resources.food - totalCost.food,
          wood: prev.resources.wood - totalCost.wood,
          gold: prev.resources.gold - totalCost.gold,
        },
        trainingQueue: [...prev.trainingQueue, entry],
      };
      saveState(newState);
      console.log(`Training ${count} ${troopType}, finishes in ${troop.trainTime * count}s`);
      return newState;
    });
  }, []);

  const startResearch = useCallback((researchId: ResearchId) => {
    setState(prev => {
      if (prev.researchQueue) return prev;
      if (prev.completedResearch.includes(researchId)) return prev;

      const research = RESEARCH.find(r => r.id === researchId);
      if (!research) return prev;

      if (research.requires && !prev.completedResearch.includes(research.requires)) return prev;

      if (
        prev.resources.food < (research.cost.food || 0) ||
        prev.resources.wood < (research.cost.wood || 0) ||
        prev.resources.gold < (research.cost.gold || 0)
      ) return prev;

      const newState = {
        ...prev,
        resources: {
          food: prev.resources.food - (research.cost.food || 0),
          wood: prev.resources.wood - (research.cost.wood || 0),
          gold: prev.resources.gold - (research.cost.gold || 0),
        },
        researchQueue: {
          id: researchId,
          finishTime: Date.now() + research.researchTime * 1000,
        },
      };
      saveState(newState);
      console.log(`Started research: ${researchId}`);
      return newState;
    });
  }, []);

  const attackEnemy = useCallback((enemyId: string): BattleResult | null => {
    const prev = stateRef.current;
    const camp = ENEMY_CAMPS.find(c => c.id === enemyId);
    if (!camp) return null;

    const now = Date.now();
    const campState = prev.enemyCamps[enemyId];
    if (campState && campState.cooldown > now) return null;

    if (prev.buildings.castle.level < camp.minCastleLevel) return null;

    const armyPower = getTotalArmyPower(prev);
    const totalTroops = Object.values(prev.troops).reduce((a, b) => a + b, 0);
    if (totalTroops === 0) return null;

    const wallDefense = (prev.buildings.walls.level) * (BUILDINGS.walls.defenseBonus || 0);
    const effectivePower = armyPower;
    const victory = effectivePower >= camp.power;

    const hasSiegeWeapons = prev.completedResearch.includes('siegeWeapons');
    const lootMultiplier = victory ? (hasSiegeWeapons ? 1.3 : 1.0) : 0.1;

    const maxStorage = getMaxStorage(prev);
    const loot: Partial<Record<ResourceType, number>> = {};
    (Object.entries(camp.loot) as [ResourceType, number][]).forEach(([resource, amount]) => {
      loot[resource] = Math.floor(amount * lootMultiplier);
    });

    // Calculate troop losses
    const troopsLost: Partial<Record<TroopType, number>> = {};
    const lossRate = victory ? Math.min(0.3, camp.power / (effectivePower * 3)) : 0.5;

    let newTroops = { ...prev.troops };
    (Object.entries(newTroops) as [TroopType, number][]).forEach(([type, count]) => {
      if (count > 0) {
        const lost = Math.ceil(count * lossRate);
        troopsLost[type] = lost;
        newTroops[type] = Math.max(0, count - lost);
      }
    });

    // Apply loot
    let newResources = { ...prev.resources };
    (Object.entries(loot) as [ResourceType, number][]).forEach(([resource, amount]) => {
      newResources[resource] = Math.min(maxStorage, newResources[resource] + amount);
    });

    const newState = {
      ...prev,
      resources: newResources,
      troops: newTroops,
      enemyCamps: {
        ...prev.enemyCamps,
        [enemyId]: { cooldown: now + camp.cooldown * 1000 },
      },
    };
    setState(newState);
    saveState(newState);

    console.log(`Battle result: ${victory ? 'VICTORY' : 'DEFEAT'} vs ${camp.name}, power ${effectivePower} vs ${camp.power}`);

    return {
      victory,
      loot,
      troopsLost,
      enemyName: camp.name,
      enemyIcon: camp.icon,
    };
  }, []);

  const resetGame = useCallback(() => {
    const fresh = createDefaultState();
    setState(fresh);
    saveState(fresh);
    console.log('Game reset');
  }, []);

  const setPlayerName = useCallback((name: string) => {
    setState(prev => {
      const newState = { ...prev, playerName: name };
      saveState(newState);
      return newState;
    });
  }, []);

  return {
    state,
    upgradeBuilding,
    trainTroops,
    startResearch,
    attackEnemy,
    resetGame,
    setPlayerName,
  };
}
