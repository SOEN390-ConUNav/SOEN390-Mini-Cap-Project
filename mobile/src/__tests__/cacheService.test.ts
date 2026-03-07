import AsyncStorage from "@react-native-async-storage/async-storage";
import cacheService from "../services/cacheService";

describe("cacheService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    cacheService.clearMemoryNamespace("cache-service-test");
    cacheService.clearMemoryNamespace("cache-service-other");
  });

  it("sets and gets memory values without TTL", () => {
    cacheService.setMemory("cache-service-test", "k1", { value: 1 });

    expect(
      cacheService.getMemory<{ value: number }>("cache-service-test", "k1"),
    ).toEqual({ value: 1 });
  });

  it("returns null for expired memory values", () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);

    cacheService.setMemory("cache-service-test", "exp", "stale", 5);
    dateNowSpy.mockReturnValue(2_000);

    expect(cacheService.getMemory("cache-service-test", "exp")).toBeNull();
    expect(cacheService.getMemory("cache-service-test", "exp")).toBeNull();

    dateNowSpy.mockRestore();
  });

  it("clears only the target memory namespace", () => {
    cacheService.setMemory("cache-service-test", "k1", "a");
    cacheService.setMemory("cache-service-other", "k2", "b");

    cacheService.clearMemoryNamespace("cache-service-test");

    expect(cacheService.getMemory("cache-service-test", "k1")).toBeNull();
    expect(cacheService.getMemory("cache-service-other", "k2")).toBe("b");
  });

  it("gets persistent cached value and stores it in memory", async () => {
    const key = "cache-service-test:persist";
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value: { ok: true }, expiresAt: null }),
    );

    const value = await cacheService.getPersistent<{ ok: boolean }>(
      "cache-service-test",
      "persist",
    );

    expect(value).toEqual({ ok: true });
    expect(
      cacheService.getMemory<{ ok: boolean }>("cache-service-test", "persist"),
    ).toEqual({ ok: true });
  });

  it("removes expired persistent values", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(10_000);
    const removeSpy = jest.spyOn(AsyncStorage, "removeItem");
    const key = "cache-service-test:expired";

    await AsyncStorage.setItem(
      key,
      JSON.stringify({ value: { ok: false }, expiresAt: 5_000 }),
    );

    const value = await cacheService.getPersistent(
      "cache-service-test",
      "expired",
    );

    expect(value).toBeNull();
    expect(removeSpy).toHaveBeenCalledWith(key);

    dateNowSpy.mockRestore();
  });

  it("sets persistent and raw persistent values", async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, "setItem");

    await cacheService.setPersistent(
      "cache-service-test",
      "p1",
      { a: 1 },
      1000,
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      "cache-service-test:p1",
      expect.any(String),
    );

    await cacheService.setPersistentRaw("cache-service-test", "raw1", {
      b: 2,
    });
    const raw = await cacheService.getPersistentRaw<{ b: number }>(
      "cache-service-test",
      "raw1",
    );

    expect(raw).toEqual({ b: 2 });
    expect(
      cacheService.getMemory<{ b: number }>("cache-service-test", "raw1"),
    ).toEqual({ b: 2 });
  });

  it("sets persistent values without TTL as non-expiring envelopes", async () => {
    await cacheService.setPersistent("cache-service-test", "no-ttl", { c: 3 });

    const raw = await AsyncStorage.getItem("cache-service-test:no-ttl");
    const parsed = JSON.parse(raw as string) as {
      value: { c: number };
      expiresAt: number | null;
    };

    expect(parsed).toEqual({ value: { c: 3 }, expiresAt: null });
  });

  it("returns null when persistent keys are missing", async () => {
    await expect(
      cacheService.getPersistent("cache-service-test", "missing"),
    ).resolves.toBeNull();
    await expect(
      cacheService.getPersistentRaw("cache-service-test", "missing-raw"),
    ).resolves.toBeNull();
  });
});
