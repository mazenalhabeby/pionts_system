import { useState, useEffect } from 'react';
import { projectApi } from '../api';
import { useProject } from '../context/ProjectContext';

interface IntegrationConfig {
  publicKey: string;
  hmacSecret: string;
  apiBase: string;
  webhookBase: string;
  domain: string;
  platform: string;
  projectName: string;
  loading: boolean;
  configured: boolean;
}

/**
 * Fetches the current project's full integration config from the backend.
 * Returns real keys, HMAC secret, API base URL, and webhook URLs
 * so guide code snippets can be fully populated with zero manual editing.
 */
export function useProjectKeys(): IntegrationConfig {
  const { currentProject } = useProject();
  const [config, setConfig] = useState<Omit<IntegrationConfig, 'loading'>>({
    publicKey: '',
    hmacSecret: '',
    apiBase: '',
    webhookBase: '',
    domain: '',
    platform: '',
    projectName: '',
    configured: false,
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
        const data = await projectApi.getIntegrationConfig(currentProject.id);
        if (cancelled) return;

        if (data.configured) {
          setConfig({
            publicKey: data.publicKey || '',
            hmacSecret: data.hmacSecret || '',
            apiBase: data.apiBase || '',
            webhookBase: data.webhookBase || '',
            domain: data.domain || '',
            platform: data.platform || '',
            projectName: data.projectName || '',
            configured: true,
          });
        }
      } catch {
        // silently fail — will show placeholders
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentProject?.id]);

  // Fallback values when config not available
  const fallbackBase = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://your-server.com';

  return {
    publicKey: config.publicKey || 'pk_live_YOUR_PUBLIC_KEY',
    hmacSecret: config.hmacSecret || 'YOUR_HMAC_SECRET',
    apiBase: config.apiBase || fallbackBase,
    webhookBase: config.webhookBase || `${fallbackBase}/api/v1`,
    domain: config.domain || currentProject?.domain || 'yourstore.com',
    platform: config.platform || currentProject?.platform || '',
    projectName: config.projectName || currentProject?.name || 'Your Project',
    loading,
    configured: config.configured,
  };
}
