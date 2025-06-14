/// <reference types="@docusaurus/module-type-aliases" />

import * as path from "path";

import type { ChatPluginContent, OpenAIConfig } from "./types";
import { LoadContext, Plugin } from "@docusaurus/types";

import type { EmbeddingCacheConfig } from "./types";
import { loadContent } from "./content";
import { normalizeUrl } from "@docusaurus/utils";

export interface PluginOptions {
  label?: string;
  path?: string;
  openai?: OpenAIConfig;
  embeddingCache?: EmbeddingCacheConfig;
}

export default function pluginChatPage(
  context: LoadContext,
  options: PluginOptions = {}
): Plugin<ChatPluginContent> {
  const {
    siteConfig: { baseUrl },
  } = context;

  // Default options
  const {
    label = "Chat",
    path: inputPath = "chat",
    openai,
    embeddingCache,
  } = options;

  // Normalize the path
  const routePath = normalizeUrl([baseUrl, inputPath]);

  return {
    name: "docusaurus-plugin-chat-page",

    getThemePath() {
      return "../lib/theme";
    },

    getTypeScriptThemePath() {
      return "./theme";
    },

    getPathsToWatch() {
      return [
        path.join("src", "theme", "**", "*.{ts,tsx}"),
        path.join("src", "utils", "**", "*.{ts,tsx}"),
      ];
    },

    getClientModules() {
      return [path.join("theme", "ChatPage", "styles.module.css")];
    },

    async loadContent() {
      if (!openai?.apiKey) {
        throw new Error(
          "OpenAI API key is required. Please add it to your docusaurus.config.js"
        );
      }
      return loadContent({ ...context, options: { openai, embeddingCache } });
    },

    async contentLoaded({ content, actions }) {
      const { createData, addRoute, setGlobalData } = actions;

      setGlobalData({
        pluginId: "docusaurus-plugin-chat-page",
        ...content,
        config: {
          openai,
        },
      });

      const embeddingsPath = await createData(
        "embeddings.json",
        JSON.stringify({
          ...content,
          config: {
            openai,
          },
        })
      );

      addRoute({
        path: routePath,
        component: "@theme/ChatPage",
        modules: {
          embeddings: embeddingsPath,
        },
        exact: true,
      });
    },
  };
}
