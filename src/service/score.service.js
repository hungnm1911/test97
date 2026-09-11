const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;
const TIMEOUT_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error) {
  // timeout/network error
  if (!error.status) {
    return true;
  }

  return (
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500
  );
}

async function callScoreProvider(userId) {
  const response = await fetch(
    `https://score-provider.example/users/${userId}/score`,
    {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const error = new Error("Score provider error");
    error.status = response.status;

    throw error;
  }

  return response.json();
}

export async function fetchScore(userId) {
  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      return await callScoreProvider(userId);
    } catch (error) {
      // 4xx nghiệp vụ → không retry
      if (!isRetryable(error)) {
        throw error;
      }

      // đã đủ 3 lần
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      // exponential backoff
      const backoff = BASE_DELAY_MS * 2 ** (attempt - 1);

      // jitter 0-100ms
      const jitter = Math.random() * 100;

      await sleep(backoff + jitter);
    }
  }
}