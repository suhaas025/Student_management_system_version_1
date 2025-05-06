import { useEffect, useState } from 'react';
import { getUserPreferences, saveUserPreferences } from '../services/dashboardApi';

// Stub: Replace with real user ID from auth context
const userId = 'student123';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUserPreferences(userId)
      .then(data => {
        setPreferences(data?.preferencesJson ? JSON.parse(data.preferencesJson) : {});
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load preferences');
        setLoading(false);
      });
  }, []);

  const savePreferences = async (prefs) => {
    setLoading(true);
    try {
      await saveUserPreferences(userId, JSON.stringify(prefs));
      setPreferences(prefs);
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Failed to save preferences');
      setLoading(false);
    }
  };

  return { preferences, loading, error, savePreferences };
} 