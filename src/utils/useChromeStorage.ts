import { useState, useEffect } from 'react';

type StorageArea = 'local' | 'sync';

export function useChromeStorage<T>(
  key: string,
  initialValue: T,
  storageArea: StorageArea = 'sync'
): [T, (value: T) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  const storage = chrome.storage[storageArea];

  useEffect(() => {
    setIsLoading(true);
    storage.get(key).then((result) => {
      if (result[key] !== undefined) {
        setStoredValue(result[key]);
      }
      setIsLoading(false);
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === storageArea && changes[key]) {
        setStoredValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key, storageArea, storage]);

  const setValue = (value: T) => {
    storage.set({ [key]: value }).then(() => {
      setStoredValue(value);
    });
  };

  return [storedValue, setValue, isLoading];
}
