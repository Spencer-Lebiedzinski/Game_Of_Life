import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Loads tab-specific data from MongoDB on mount and saves it back
 * with a 600ms debounce on every change.
 *
 * Usage:
 *   const [assignments, setAssignments] = useTabData(userId, 'school', []);
 */
export function useTabData(userId, tab, defaultValue) {
  const [data, setDataState] = useState(defaultValue);
  const loadedRef  = useRef(false);
  const saveTimer  = useRef(null);
  const latestData = useRef(defaultValue);

  useEffect(() => {
    if (!userId || userId === 'frontend-user') {
      loadedRef.current = true;
      return;
    }
    fetch(`http://localhost:8000/api/tab-data/${userId}/${tab}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.data !== undefined && res.data !== null) {
          setDataState(res.data);
          latestData.current = res.data;
        }
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [userId, tab]);

  const setData = useCallback((updater) => {
    setDataState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestData.current = next;

      if (loadedRef.current && userId && userId !== 'frontend-user') {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          fetch(`http://localhost:8000/api/tab-data/${userId}/${tab}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: latestData.current }),
          }).catch(() => {});
        }, 600);
      }

      return next;
    });
  }, [userId, tab]);

  return [data, setData];
}
