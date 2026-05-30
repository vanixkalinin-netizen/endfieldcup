const avatarGradients = [
  "from-[#641318] to-[#ba2f36]",
  "from-[#4b0f14] to-[#9e252d]",
  "from-[#231015] to-[#6c1d22]",
  "from-[#811a21] to-[#d24845]",
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
