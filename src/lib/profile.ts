const avatarGradients = [
  "from-[#4f5fff] to-[#7960ff]",
  "from-[#2378ff] to-[#47b2ff]",
  "from-[#6a55ff] to-[#8e7cff]",
  "from-[#3f55cc] to-[#6f7bff]",
];

export function getInitials(nickname: string) {
  const parts = nickname
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);

  if (!parts.length) {
    return "??";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getAvatarGradient(nickname: string) {
  const hash = [...nickname].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarGradients[hash % avatarGradients.length];
}
