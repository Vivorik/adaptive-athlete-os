import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev генерирует AGENTS.md и CLAUDE.md, если в окружении детектится ИИ-агент.
  // Отключаем, чтобы файлы не появлялись и не загрязняли рабочее дерево.
  agentRules: false,
};

export default nextConfig;
