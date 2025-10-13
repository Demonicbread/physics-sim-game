import React from "react";

export default function GameModeSelector({ onSelectMode, onBack, t }) {
  const modes = [
    {
      id: "sandbox",
      name: t("sandboxMode"),
      icon: "🎨",
      description: t("sandboxDescription"),
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "challenge",
      name: t("challengeMode"),
      icon: "🎯",
      description: t("challengeDescription"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "survival",
      name: t("survivalMode"),
      icon: "🌊",
      description: t("survivalDescription"),
      color: "from-red-500 to-orange-500",
    },
    {
      id: "collection",
      name: t("collectionMode"),
      icon: "🎯",
      description: t("collectionDescription"),
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "reaction",
      name: t("reactionMode"),
      icon: "⚡",
      description: t("reactionDescription"),
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <div className="py-12 min-h-screen text-white px-4">
      <div className="max-w-6xl mx-auto">
        <div className="h-16"></div>
        <button onClick={onBack} className="btn btn-ghost mb-8">
          ← {t("backToHome")}
        </button>

        <h2 className="text-6xl font-extrabold text-center mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text tracking-tight">
          {t("selectGameMode")}
        </h2>
        <p className="text-center text-slate-300 mb-12">
          {t("chooseAdventure")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="card p-8 hover:scale-105 hover:shadow-2xl transition-all duration-300 text-left group cursor-pointer backdrop-blur-xl relative overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${
                    mode.color.split(" ")[1]
                  }, ${mode.color.split(" ")[3]})`,
                }}
              ></div>
              <div className="relative z-10">
                <div className="text-7xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {mode.icon}
                </div>
                <h3
                  className={`text-2xl font-bold mb-3 bg-gradient-to-r ${mode.color} text-transparent bg-clip-text`}
                >
                  {mode.name}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
