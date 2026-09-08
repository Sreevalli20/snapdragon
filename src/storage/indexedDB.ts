import { InspectionRecord, EvidenceRecord, WorkPack, FindingRecord, TelemetrySample } from '../types';

const DB_NAME = 'SnapOpsVisionDB';
const DB_VERSION = 2;

class SnapOpsDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('inspections')) {
          const inspStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspStore.createIndex('status', 'status', { unique: false });
          inspStore.createIndex('startTime', 'startTime', { unique: false });
        }

        if (!db.objectStoreNames.contains('evidence')) {
          const evStore = db.createObjectStore('evidence', { keyPath: 'id' });
          evStore.createIndex('inspectionId', 'inspectionId', { unique: false });
          evStore.createIndex('stepId', 'stepId', { unique: false });
          evStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('workpacks')) {
          const wpStore = db.createObjectStore('workpacks', { keyPath: 'id' });
          wpStore.createIndex('industry', 'industry', { unique: false });
        }

        if (!db.objectStoreNames.contains('findings')) {
          const fStore = db.createObjectStore('findings', { keyPath: 'id' });
          fStore.createIndex('inspectionId', 'inspectionId', { unique: false });
          fStore.createIndex('severity', 'severity', { unique: false });
        }

        if (!db.objectStoreNames.contains('telemetry')) {
          const tStore = db.createObjectStore('telemetry', { keyPath: 'timestamp' });
          tStore.createIndex('aiRuntime', 'aiRuntime', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Inspections ---
  async saveInspection(inspection: InspectionRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inspections', 'readwrite');
      tx.objectStore('inspections').put(inspection);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getInspection(id: string): Promise<InspectionRecord | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inspections', 'readonly');
      const req = tx.objectStore('inspections').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllInspections(): Promise<InspectionRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('inspections', 'readonly');
      const req = tx.objectStore('inspections').getAll();
      req.onsuccess = () => {
        const list: InspectionRecord[] = req.result || [];
        // Sort descending by startTime
        list.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteInspection(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['inspections', 'evidence', 'findings'], 'readwrite');
      tx.objectStore('inspections').delete(id);

      // Clean up linked evidence and findings
      const evStore = tx.objectStore('evidence');
      const evIndex = evStore.index('inspectionId');
      const evReq = evIndex.openCursor(IDBKeyRange.only(id));
      evReq.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      const fStore = tx.objectStore('findings');
      const fIndex = fStore.index('inspectionId');
      const fReq = fIndex.openCursor(IDBKeyRange.only(id));
      fReq.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Evidence ---
  async saveEvidence(evidence: EvidenceRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readwrite');
      tx.objectStore('evidence').put(evidence);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getEvidenceForInspection(inspectionId: string): Promise<EvidenceRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readonly');
      const index = tx.objectStore('evidence').index('inspectionId');
      const req = index.getAll(inspectionId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllEvidence(): Promise<EvidenceRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readonly');
      const req = tx.objectStore('evidence').getAll();
      req.onsuccess = () => {
        const list: EvidenceRecord[] = req.result || [];
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- WorkPacks ---
  async saveWorkPack(workpack: WorkPack): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workpacks', 'readwrite');
      tx.objectStore('workpacks').put(workpack);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllWorkPacks(): Promise<WorkPack[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workpacks', 'readonly');
      const req = tx.objectStore('workpacks').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Findings ---
  async saveFinding(finding: FindingRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('findings', 'readwrite');
      tx.objectStore('findings').put(finding);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllFindings(): Promise<FindingRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('findings', 'readonly');
      const req = tx.objectStore('findings').getAll();
      req.onsuccess = () => {
        const list: FindingRecord[] = req.result || [];
        list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- Telemetry ---
  async recordTelemetry(sample: TelemetrySample): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('telemetry', 'readwrite');
      tx.objectStore('telemetry').put(sample);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getRecentTelemetry(limit = 60): Promise<TelemetrySample[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('telemetry', 'readonly');
      const req = tx.objectStore('telemetry').getAll();
      req.onsuccess = () => {
        const list: TelemetrySample[] = req.result || [];
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(list.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['inspections', 'evidence', 'findings', 'telemetry'], 'readwrite');
      tx.objectStore('inspections').clear();
      tx.objectStore('evidence').clear();
      tx.objectStore('findings').clear();
      tx.objectStore('telemetry').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new SnapOpsDatabase();
