export const sortNewestFirst = (items, fields = ["createdAt", "requestedAt", "submittedAt", "eventTime", "occurredAt", "updatedAt", "id"]) => {
  const list = Array.isArray(items) ? [...items] : [];

  const toValue = (item) => {
    for (const field of fields) {
      const value = item?.[field];
      if (value === null || value === undefined || value === "") continue;
      if (field.toLowerCase().includes("at") || field.toLowerCase().includes("date") || typeof value === "string") {
        const time = new Date(value).getTime();
        if (!Number.isNaN(time)) return time;
      }
      const numberValue = Number(value);
      if (!Number.isNaN(numberValue)) return numberValue;
    }
    return 0;
  };

  return list.sort((a, b) => toValue(b) - toValue(a));
};
