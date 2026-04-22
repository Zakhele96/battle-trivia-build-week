import { useContext } from "react";
import { ThemeContext } from "../context/theme-context-base";

export function useTheme() {
  return useContext(ThemeContext);
}
