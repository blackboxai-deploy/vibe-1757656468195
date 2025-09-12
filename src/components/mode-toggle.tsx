"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Detectar tema del sistema
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <span className="h-[1.2rem] w-[1.2rem]">🌙</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
    >
      {theme === "light" ? (
        <span className="h-[1.2rem] w-[1.2rem]">🌙</span>
      ) : (
        <span className="h-[1.2rem] w-[1.2rem]">☀️</span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}