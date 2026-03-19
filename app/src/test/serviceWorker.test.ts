import { describe, expect, it, vi } from "vitest";
import {
  registerServiceWorker,
  shouldRegisterServiceWorker,
} from "../lib/offline/registerServiceWorker";

describe("service worker registration", () => {
  it("registers only in production when the service worker API exists", async () => {
    const register = vi.fn<(scriptUrl: string) => Promise<ServiceWorkerRegistration>>(() =>
      Promise.resolve({ scope: "/swe-vocab/" } as ServiceWorkerRegistration),
    );

    const registration = await registerServiceWorker({
      isProd: true,
      serviceWorker: { register } as unknown as ServiceWorkerContainer,
      baseUrl: "/swe-vocab/",
    });

    expect(register).toHaveBeenCalledWith("/swe-vocab/sw.js");
    expect(registration?.scope).toBe("/swe-vocab/");
  });

  it("skips registration outside production", async () => {
    const register = vi.fn();

    const registration = await registerServiceWorker({
      isProd: false,
      serviceWorker: { register } as unknown as ServiceWorkerContainer,
      baseUrl: "/",
    });

    expect(shouldRegisterServiceWorker(false, { register } as unknown as ServiceWorkerContainer)).toBe(
      false,
    );
    expect(register).not.toHaveBeenCalled();
    expect(registration).toBeUndefined();
  });
});
