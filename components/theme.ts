export type Theme = "light" | "dark";

export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function watchTheme(apply: () => void) {
  const run = () => apply();
  window.addEventListener("themechange", run);
  return () => window.removeEventListener("themechange", run);
}
