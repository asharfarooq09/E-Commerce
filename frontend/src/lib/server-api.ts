const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ServerApiInit = RequestInit & {
  next?: { revalidate?: number | false };
};

export async function serverApi<T>(path: string, init?: ServerApiInit): Promise<T> {
  const { next, ...rest } = init ?? {};
  const fetchInit: RequestInit & { next?: { revalidate?: number | false } } = { ...rest };

  const bypassCache = rest.cache === "no-store" || rest.cache === "no-cache";
  if (!bypassCache) {
    fetchInit.next = next ?? { revalidate: 30 };
  }

  const response = await fetch(`${API_URL}${path}`, fetchInit);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (${response.status})`);
  }

  return response.json() as Promise<T>;
}
