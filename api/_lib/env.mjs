export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getBaseUrl(request) {
  return process.env.APP_BASE_URL || new URL(request.url).origin;
}
