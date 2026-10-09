/* =========================================================
   theme.js
   Vanilla JS dark/light theme system.
   Pattern: one class ("dark_mode") on <body> is the single
   source of truth for which theme is active. CSS variables
   in style.css respond to that class, so this file never
   touches colors directly — it only adds/removes the class
   and remembers the choice in localStorage.
   ========================================================= */

// Key used to store the user's choice in localStorage so it
// survives page reloads and future visits.
const THEME_STORAGE_KEY = "site-theme";
const DARK_VALUE = "dark";
const DEFAULT_VALUE = "default";

/**
 * Reads the saved theme from localStorage and applies it to
 * <body> by adding or removing the "dark_mode" class.
 * Runs on first page load, and again whenever another tab
 * changes the theme (see the "storage" listener below).
 */
function applySavedTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);

  // Start from a clean slate, then add the class back only
  // if the saved preference is "dark".
  document.body.classList.remove("dark_mode");
  if (saved === DARK_VALUE) {
    document.body.classList.add("dark_mode");
  }

  updateToggleLabel();
}

/**
 * Flips the theme: toggles the class on <body>, then saves
 * whichever state we ended up in so it persists.
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark_mode");
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? DARK_VALUE : DEFAULT_VALUE);
  updateToggleLabel();
}

/**
 * Keeps the toggle button's text in sync with the current
 * theme, so it reads "Switch to dark" / "Switch to light"
 * instead of a static label.
 */
function updateToggleLabel() {
  const toggleButton = document.getElementById("theme-toggle");
  if (!toggleButton) return;

  const isDark = document.body.classList.contains("dark_mode");
  toggleButton.textContent = isDark ? "☀️ Light mode" : "🌙 Dark mode";
}

// Apply the saved theme as soon as this script runs, so the
// page opens in the right theme instead of flashing light
// mode first.
applySavedTheme();

// Wait for the DOM so the toggle button definitely exists
// before we try to attach a click listener to it.
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleTheme);
  }
  updateToggleLabel();
});

// If the theme is changed in another browser tab, localStorage
// fires a "storage" event in this tab. Re-applying here keeps
// every open tab in sync with each other.
window.addEventListener("storage", (event) => {
  if (event.key === THEME_STORAGE_KEY) {
    applySavedTheme();
  }
});
