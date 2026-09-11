import { findUserById } from "../repository/user.repository.js";
import AppError from "../util/app-error.js";

export async function getUserById(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
}

// const MAX_ATTEMPTS = 3;
// const BASE_DELAY_MS = 200;

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const isRetryableError = (error) => {
//   const status = error.response?.status;

//   return (
//     !status ||
//     status === 408 ||
//     status === 429 ||
//     status >= 500
//   );
// };

// async function getPrice(id) {
//   for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
//     try {
//       const response = await provider.get(`/prices/${id}`, {
//         timeout: 2000,
//       });

//       return response.data;
//     } catch (error) {
//       if (!isRetryableError(error)) {
//         throw error;
//       }

//       if (attempt === MAX_ATTEMPTS) {
//         throw error;
//       }

//       const backoff = BASE_DELAY_MS * 2 ** (attempt - 1);
//       const jitter = Math.random() * 100;

//       await sleep(backoff + jitter);
//     }
//   }
// }