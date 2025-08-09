import dayjs, { Dayjs } from "dayjs";

export default function formatDate(
  date?: string | Date | Dayjs,
  includeTime: boolean = false
): string {
  if (!date) return "Unknown date";
  const d = dayjs(date);
  return d.isValid()
    ? includeTime
      ? d.format("DD MMM YYYY HH:mm")
      : d.format("DD MMM YYYY")
    : "Invalid date";
}
