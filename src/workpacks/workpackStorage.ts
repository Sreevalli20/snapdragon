import { WorkPack } from '../types';
import { db } from '../storage/indexedDB';
import { DEFAULT_WORKPACKS } from './defaultWorkpacks';

const LOCAL_STORAGE_KEY = 'snapops_workpacks_registry';

/**
 * Robust WorkPack Storage Manager
 * Manages WorkPack persistence across IndexedDB with seamless localStorage fallback
 */
export class WorkPackStorageManager {
  /**
   * Initializes WorkPack storage. Ensures the initial 'Industrial Equipment Inspection'
   * WorkPack is stored and persisted in IndexedDB and localStorage.
   */
  async initializeWorkPacks(): Promise<WorkPack[]> {
    let workpacks: WorkPack[] = [];

    // 1. Attempt to load from IndexedDB
    try {
      workpacks = await db.getAllWorkPacks();
    } catch (err) {
      console.warn('[WorkPackStorage] IndexedDB read failed, falling back to localStorage:', err);
    }

    // 2. Fallback to localStorage if IndexedDB returned nothing
    if (!workpacks || workpacks.length === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) {
            workpacks = JSON.parse(raw);
          }
        }
      } catch (err) {
        console.warn('[WorkPackStorage] localStorage read failed:', err);
      }
    }

    // 3. Seed initial default workpacks including 'Industrial Equipment Inspection' if empty
    if (!workpacks || workpacks.length === 0) {
      workpacks = [...DEFAULT_WORKPACKS];

      // Save to IndexedDB
      try {
        for (const wp of workpacks) {
          await db.saveWorkPack(wp);
        }
      } catch (err) {
        console.warn('[WorkPackStorage] IndexedDB seed failed:', err);
      }

      // Save to localStorage as dual persistence backup
      this.saveToLocalStorage(workpacks);
    } else {
      // Ensure the initial 'Industrial Equipment Inspection' workpack exists in the set
      const hasIndustrial = workpacks.some((w) => w.name === 'Industrial Equipment Inspection' || w.id === 'wp-industrial-equipment');
      if (!hasIndustrial) {
        const industrialWp = DEFAULT_WORKPACKS.find((w) => w.name === 'Industrial Equipment Inspection') || DEFAULT_WORKPACKS[0];
        workpacks.unshift(industrialWp);
        try {
          await db.saveWorkPack(industrialWp);
        } catch {}
        this.saveToLocalStorage(workpacks);
      }
    }

    return workpacks;
  }

  /**
   * Retrieve a specific WorkPack by ID
   */
  async getWorkPack(id: string): Promise<WorkPack | null> {
    try {
      const all = await this.getAllWorkPacks();
      return all.find((w) => w.id === id) || null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve all registered WorkPacks
   */
  async getAllWorkPacks(): Promise<WorkPack[]> {
    try {
      const list = await db.getAllWorkPacks();
      if (list && list.length > 0) return list;
    } catch {
      // fallback
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    return DEFAULT_WORKPACKS;
  }

  /**
   * Persist a new or modified WorkPack
   */
  async saveWorkPack(workpack: WorkPack): Promise<void> {
    try {
      await db.saveWorkPack(workpack);
    } catch (err) {
      console.warn('[WorkPackStorage] IndexedDB save error:', err);
    }

    try {
      const current = await this.getAllWorkPacks();
      const index = current.findIndex((w) => w.id === workpack.id);
      if (index >= 0) {
        current[index] = workpack;
      } else {
        current.push(workpack);
      }
      this.saveToLocalStorage(current);
    } catch (err) {
      console.warn('[WorkPackStorage] localStorage backup error:', err);
    }
  }

  private saveToLocalStorage(workpacks: WorkPack[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(workpacks));
        // Also save standalone industrial equipment WorkPack specifically
        const industrial = workpacks.find((w) => w.name === 'Industrial Equipment Inspection');
        if (industrial) {
          localStorage.setItem('snapops_workpack_industrial', JSON.stringify(industrial));
        }
      } catch (err) {
        console.warn('[WorkPackStorage] Failed to write localStorage:', err);
      }
    }
  }
}

export const workpackStorage = new WorkPackStorageManager();
