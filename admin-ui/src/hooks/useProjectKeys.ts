import { useState, useEffect } from 'react';
import { projectApi } from '../api';
import { useProject } from '../context/ProjectContext';

interface ProjectKeys {
  publicKey: string;
  secretKey: string;
  apiBase: string;
  domain: string;
  loading: boolean;
}

/**
 * Fetches the current project's API keys and domain.
 * Returns actual values when available, placeholder strings otherwise.
 */
export function useProjectKeys(): ProjectKeys {
  const { currentProject } = useProject();
  const [keys, setKeys] = useState<{ publicKey: string; secretKey: string }>({
    publicKey: '',
    secretKey: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const apiKeys = await projectApi.getKeys(currentProject.id);
        if (cancelled) return;

        const pub = apiKeys.find((k) => k.type === 'public' && !k.revoked);
        const sec = apiKeys.find((k) => k.type === 'secret' && !k.revoked);

        setKeys({
          publicKey: pub?.keyPrefix ? `${pub.keyPrefix}...` : '',
          secretKey: sec?.keyPrefix ? `${sec.keyPrefix}...` : '',
        });
      } catch {
        // silently fail — will show placeholders
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentProject?.id]);

  const apiBase = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://your-server.com';

  return {
    publicKey: keys.publicKey || 'pk_live_YOUR_PUBLIC_KEY',
    secretKey: keys.secretKey || 'sk_live_YOUR_SECRET_KEY',
    apiBase,
    domain: currentProject?.domain || 'yourstore.com',
    loading,
  };
}
