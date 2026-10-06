import type { ThemeRegistration } from "shiki";

// The light code colors of the site (Xcode's), as a TextMate theme.
export const xcodeLight: ThemeRegistration = {
  name: "xcode-light",
  type: "light",
  colors: { "editor.foreground": "#000000", "editor.background": "#f6f7f9" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#177500" } },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "constant.language", "support.function.builtin", "support.type"],
      settings: { foreground: "#A90D91" },
    },
    { scope: ["keyword.operator", "punctuation"], settings: { foreground: "#000000" } },
    { scope: ["keyword.operator.logical.python", "keyword.operator.word"], settings: { foreground: "#A90D91" } },
    { scope: ["constant.numeric", "constant.other.date"], settings: { foreground: "#1C01CE" } },
    { scope: ["string", "punctuation.definition.string", "string.regexp"], settings: { foreground: "#C41A16" } },
    { scope: ["constant.character"], settings: { foreground: "#2300CE" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#836C28" } },
    { scope: ["entity.name.type", "entity.name.class", "entity.other.inherited-class"], settings: { foreground: "#3F6E75" } },
    { scope: ["variable.language", "variable.parameter.function.language.special"], settings: { foreground: "#5B269A" } },
    { scope: ["meta.preprocessor", "keyword.control.directive"], settings: { foreground: "#633820" } },
  ],
};
