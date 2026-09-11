import { jest } from "@jest/globals";
import request from "supertest";

const getUserByIdMock = jest.fn();

jest.unstable_mockModule(
  "../service/user.service.js",
  () => ({
    getUserById: getUserByIdMock,
  }),
);

const { saveScoreCache } = await import(
  "../service/score-cache.service.js"
);

const { getUserSummary } = await import(
  "../service/summary.service.js"
);

const { default: app } = await import(
  "../app.js"
);

describe("GET /users/:id/summary", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;

    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("success", async () => {
    getUserByIdMock.mockResolvedValueOnce({
      id: 1,
      name: "Hung",
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        score: 90,
      }),
    });

    const logSpy = jest
      .spyOn(console, "info")
      .mockImplementation(() => {});

    const response = await request(app)
      .get("/users/1/summary")
      .set(
        "Authorization",
        "Bearer secret-token",
      )
      .set(
        "X-User-Email",
        "hung@example.com",
      );

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      data: {
        user: {
          id: 1,
          name: "Hung",
        },
        score: 90,
        meta: {
          degraded: false,
          stale: false,
        },
      },
    });

    expect(
      response.headers["x-correlation-id"],
    ).toEqual(expect.any(String));

    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(logSpy).toHaveBeenCalledTimes(1);

    const log = JSON.parse(
      logSpy.mock.calls[0][0],
    );

    expect(log).toEqual({
      event: "http_request",
      correlationId:
        response.headers["x-correlation-id"],
      method: "GET",
      statusCode: 200,
    });

    const serializedLog = JSON.stringify(log);

    expect(serializedLog).not.toContain(
      "secret-token",
    );

    expect(serializedLog).not.toContain(
      "hung@example.com",
    );
  });

  test("timeout-fallback", async () => {
    jest.useFakeTimers();

    jest
      .spyOn(Math, "random")
      .mockReturnValue(0.5);

    const userId = 2;

    getUserByIdMock.mockResolvedValueOnce({
      id: userId,
      name: "Hung",
    });

    saveScoreCache(userId, 80);

    const timeoutError = new Error(
      "Score provider timeout",
    );

    timeoutError.name = "TimeoutError";

    global.fetch.mockRejectedValue(
      timeoutError,
    );

    const resultPromise =
      getUserSummary(userId);

    // cho getUserById và lần fetch đầu chạy
    await Promise.resolve();
    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(1);

    /*
     * BASE_DELAY = 200
     * jitter = 0.5 * 100 = 50
     *
     * retry 1 = 250ms
     */
    await jest.advanceTimersByTimeAsync(249);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    /*
     * retry 2:
     * 400 + 50 = 450ms
     */
    await jest.advanceTimersByTimeAsync(449);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(1);

    const result = await resultPromise;

    // lần đầu + tối đa 2 retry
    expect(global.fetch).toHaveBeenCalledTimes(3);

    expect(result).toEqual({
      user: {
        id: userId,
        name: "Hung",
      },
      score: 80,
      meta: {
        degraded: true,
        stale: true,
      },
    });
  });

  test("invalid id", async () => {
    const response = await request(app)
      .get("/users/abc/summary");

    expect(response.statusCode).toBe(400);

    expect(response.body).toMatchObject({
      error: {
        message: "Invalid user id",
      },
    });

    expect(
      response.headers["x-correlation-id"],
    ).toEqual(expect.any(String));

    expect(
      getUserByIdMock,
    ).not.toHaveBeenCalled();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});