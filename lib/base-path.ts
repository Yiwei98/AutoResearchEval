const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const BASE_PATH = configuredBasePath.replace(/\/$/, "");

export function withBasePath(path: string): string {
  if (!path.startsWith("/") || !BASE_PATH) return path;
  return `${BASE_PATH}${path}`;
}
