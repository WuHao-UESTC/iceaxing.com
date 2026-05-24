const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_READ_TOKEN',
] as const;

const optionalEnvVars = ['SANITY_WEBHOOK_SECRET', 'RESEND_API_KEY', 'RESEND_SEGMENT_ID'] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`
    );
  }

  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      const features: Record<string, string> = {
        SANITY_WEBHOOK_SECRET: 'ISR on-demand revalidation',
        RESEND_API_KEY: 'email subscription & notification',
        RESEND_SEGMENT_ID: 'Resend contact segment',
      };
      console.warn(
        `[env] Missing optional environment variable: ${key}. ${features[key] || 'Some features'} will not work.`
      );
    }
  }
}
