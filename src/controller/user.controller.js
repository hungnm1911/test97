import {  getUserSummary } from "../service/summary.service.js";

// import { getUserById } from "../service/user.service.js";

export async function getUserSummaryController(req, res) {
  const summary = await getUserSummary(req.userId);

  return res.status(200).json({
    data: summary,
  });
}

// export async function getUser(req, res) {
//   const user = await getUserById(req.userId);

//   return res.status(200).json({
//     data: user,
//   });
// }