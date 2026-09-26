"use client";

import * as React from "react";

export function useHeaderTheme() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("fsp-theme");
    const dark = savedTheme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    const dark = !isDark;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    window.localStorage.setItem("fsp-theme", dark ? "dark" : "light");
    setIsDark(dark);
  };

  return { isDark, toggleTheme };
}
