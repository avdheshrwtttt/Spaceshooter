export interface Avatar {
  id: string;
  name: string;
  gender: "boy" | "girl";
  hue: number;
  primary: string;
  secondary: string;
}

export const AVATARS: Avatar[] = [
  { id: "cyclops", name: "CYCLOPS", gender: "boy", hue: 0, primary: "#38e8ff", secondary: "#9af6ff" },
  { id: "eren", name: "EREN", gender: "boy", hue: 190, primary: "#ff7a3d", secondary: "#ffbd8a" },
  { id: "ixia", name: "IXIA", gender: "girl", hue: 320, primary: "#7affc6", secondary: "#c8ffe6" },
  { id: "nana", name: "NANA", gender: "girl", hue: 140, primary: "#ff7ad1", secondary: "#ffc2ea" },
];

const KEY = "nebula-strike-avatar";

export function getSelectedAvatar(): Avatar {
  const id = localStorage.getItem(KEY);
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function setSelectedAvatar(id: string): void {
  localStorage.setItem(KEY, id);
}
