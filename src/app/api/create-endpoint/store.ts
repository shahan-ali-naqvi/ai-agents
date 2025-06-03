// This is the in-memory store for chain data
// Note: This will be cleared when the server restarts or during hot reloads

// Using a Map to store chain data
let chainsStoreMap = new Map<string, any>();

// Use localStorage if in browser environment to persist between hot reloads
if (typeof window !== 'undefined') {
  try {
    // Try to load from localStorage on initialization
    const savedChains = localStorage.getItem('chainsStore');
    if (savedChains) {
      const parsed = JSON.parse(savedChains);
      Object.keys(parsed).forEach(key => {
        chainsStoreMap.set(key, parsed[key]);
      });
      console.log('Loaded chains from localStorage:', chainsStoreMap.size);
    }
  } catch (e) {
    console.error('Error loading chains from localStorage:', e);
  }
}

// Define a type for the store
interface ChainStore {
  [key: string]: any;
}

// Create a proxy object that behaves like an object but uses the Map underneath
export const chainsStore: ChainStore = new Proxy<ChainStore>({}, {
  get(target, prop) {
    if (typeof prop === 'string') {
      return chainsStoreMap.get(prop);
    }
    return undefined;
  },
  set(target, prop, value) {
    if (typeof prop === 'string') {
      chainsStoreMap.set(prop, value);
      
      // Persist to localStorage if in browser environment
      if (typeof window !== 'undefined') {
        try {
          const toSave: Record<string, any> = {};
          chainsStoreMap.forEach((value, key) => {
            toSave[key] = value;
          });
          localStorage.setItem('chainsStore', JSON.stringify(toSave));
        } catch (e) {
          console.error('Error saving chains to localStorage:', e);
        }
      }
    }
    return true;
  },
  deleteProperty(target, prop) {
    if (typeof prop === 'string') {
      chainsStoreMap.delete(prop);
    }
    return true;
  },
  ownKeys() {
    return Array.from(chainsStoreMap.keys());
  },
  getOwnPropertyDescriptor(target, prop) {
    if (typeof prop === 'string' && chainsStoreMap.has(prop)) {
      return {
        enumerable: true,
        configurable: true,
      };
    }
    return undefined;
  },
});

// Types for chain data (can be expanded as needed)
export interface ChainStep {
  id: number;
  inputStatement: string;
  instructions: string;
  requiredOutput: string;
}

export interface ChainData {
  steps: ChainStep[];
}

export interface StoredChain {
  userId: string;
  userEmail: string;
  chainData: ChainData;
  createdAt: string;
} 