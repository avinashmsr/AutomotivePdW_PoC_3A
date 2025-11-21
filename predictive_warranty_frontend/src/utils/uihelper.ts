export const riskBadgeClass = (bucket: string) => {
  switch (bucket) {
    case "High":
      return "risk-badge risk-high";
    case "Medium":
      return "risk-badge risk-medium";
    default:
      return "risk-badge risk-low";
  }
};