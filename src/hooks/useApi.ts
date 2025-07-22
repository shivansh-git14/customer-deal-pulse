import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  apiFunc: (...args: any[]) => Promise<T>;
  initialData?: T;
  isManual?: boolean;
}

/**
 * A generic hook for fetching data from an API function.
 * Manages loading, error, and data states.
 * @param apiFunc The API function to call.
 * @param initialData Optional initial data.
 * @param isManual If true, the fetch must be triggered manually.
 */
export const useApi = <T>(apiFunc: (...args: any[]) => Promise<T>, isManual = false) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!isManual);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (!isManual) {
      execute();
    }
  }, [execute, isManual]);

  return { data, isLoading, error, execute };
};
