export const formatStrings = (template?: string, data?: any): string => {
  return (
    (template ?? "").replace(/{(\w+)}/g, (_, key) =>
      data[key] ? data[key] : ""
    ) ?? ""
  );
};
