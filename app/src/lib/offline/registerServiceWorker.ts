interface RegisterOptions {
  isProd?: boolean;
  serviceWorker?: ServiceWorkerContainer | undefined;
  baseUrl?: string;
}

export function shouldRegisterServiceWorker(isProd: boolean, serviceWorker?: ServiceWorkerContainer): boolean {
  return isProd && typeof window !== "undefined" && Boolean(serviceWorker);
}

export function registerServiceWorker({
  isProd = import.meta.env.PROD,
  serviceWorker = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined,
  baseUrl = import.meta.env.BASE_URL,
}: RegisterOptions = {}): Promise<ServiceWorkerRegistration | undefined> {
  const sw = serviceWorker;

  if (!isProd || typeof window === "undefined" || !sw) {
    return Promise.resolve(undefined);
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return sw.register(`${normalizedBase}sw.js`);
}
