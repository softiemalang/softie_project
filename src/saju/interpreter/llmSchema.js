export const FORTUNE_REPORT_SCHEMA = {
  name: "fortune_report",
  strict: true,
  schema: {
    type: "object",
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      sections: {
        type: "object",
        properties: {
          work: { type: "string" },
          money: { type: "string" },
          relationships: { type: "string" },
          love: { type: "string" },
          health: { type: "string" },
          mind: { type: "string" }
        },
        required: ["work", "money", "relationships", "love", "health", "mind"],
        additionalProperties: false
      },
      cautions: {
        type: "array",
        items: { type: "string" }
      },
      action_tip: { type: "string" }
    },
    required: ["headline", "summary", "sections", "cautions", "action_tip"],
    additionalProperties: false
  }
};
