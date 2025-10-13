import React from "react";
import LanguageSelector from "./LanguageSelector";
import translations from "../translations";

export default function Navbar({
  setCurrentPage,
  currentLanguage,
  onLanguageChange,
}) {
  const t = (key) => translations[currentLanguage][key] || key;

  return (
    <nav>
      <div className="brand">
        <div className="logo"></div>
        Physics Sim
      </div>
      <div className="nav-actions">
        <LanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={onLanguageChange}
        />
        <button onClick={() => setCurrentPage("home")} className="nav-link">
          {t("home")}
        </button>
        <button onClick={() => setCurrentPage("modes")} className="nav-link">
          {t("play")}
        </button>
        <button onClick={() => setCurrentPage("sandbox")} className="nav-link">
          {t("sandboxMode")}
        </button>
        <button
          onClick={() => setCurrentPage("leaderboard")}
          className="nav-link"
        >
          {t("leaderboard")}
        </button>
        <button onClick={() => setCurrentPage("about")} className="nav-link">
          {t("about")}
        </button>
      </div>
    </nav>
  );
}
