const higher = ["@/pages/**", "@/views/**", "@/app/**"];

export const fsdBoundaryConfigs = [
  {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [{
            group: ["@/entities/**", "@/features/**", "@/widgets/**", ...higher],
            message: "FSD violation: shared cannot import from higher layers.",
          }],
        },
      ],
    },
  },
  {
    files: ["src/entities/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [{
            group: ["@/features/**", "@/widgets/**", ...higher],
            message: "FSD violation: entities cannot import from features/widgets/pages.",
          }],
        },
      ],
    },
  },
  {
    files: ["src/features/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [{
            group: ["@/widgets/**", ...higher],
            message: "FSD violation: features cannot import from widgets/pages.",
          }],
        },
      ],
    },
  },
  {
    files: ["src/widgets/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [{
            group: higher,
            message: "FSD violation: widgets cannot import from pages/app.",
          }],
        },
      ],
    },
  },
];
