import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearStoredAuthTokens, getStoredAuthTokens, setStoredAuthTokens } from "./auth";

describe("auth token storage", () => {
  it("reads the current access and refresh token keys", () => {
    const original = globalThis.localStorage;
    const storageMap = new Map<string, string>();
    const storage = {
      getItem(key: string) {
        return storageMap.has(key) ? storageMap.get(key)! : null;
      },
      setItem(key: string, value: string) {
        storageMap.set(key, value);
      },
      removeItem(key: string) {
        storageMap.delete(key);
      },
      clear() {
        storageMap.clear();
      },
    } as unknown as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    try {
      setStoredAuthTokens("new-access", "new-refresh");
      assert.deepEqual(getStoredAuthTokens(), {
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });

  it("falls back to legacy access key names when needed", () => {
    const original = globalThis.localStorage;
    const storageMap = new Map<string, string>([["access", "legacy-access"], ["refresh", "legacy-refresh"]]);
    const storage = {
      getItem(key: string) {
        return storageMap.has(key) ? storageMap.get(key)! : null;
      },
      setItem(key: string, value: string) {
        storageMap.set(key, value);
      },
      removeItem(key: string) {
        storageMap.delete(key);
      },
      clear() {
        storageMap.clear();
      },
    } as unknown as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    try {
      assert.deepEqual(getStoredAuthTokens(), {
        accessToken: "legacy-access",
        refreshToken: "legacy-refresh",
      });
      clearStoredAuthTokens();
      assert.deepEqual(getStoredAuthTokens(), { accessToken: null, refreshToken: null });
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});
