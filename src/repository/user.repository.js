const users = [
  { id: 1, name: "Hung" },
  { id: 2, name: "An" },
];

export async function findUserById(id) {
  return users.find((user) => user.id === id) ?? null;
}