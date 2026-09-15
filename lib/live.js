import { DateTime } from "luxon";
export const SHOW_DRAFTS = process.env.SHOW_DRAFTS === "1";
export const NOW = DateTime.now().setZone("America/Chicago");
export function isLive(data) {
  if (SHOW_DRAFTS) return true;
  if (!data.date) return false;
  const d = DateTime.fromJSDate(data.date, { zone: "America/Chicago" });
  if (data.status === "published") return true;
  if (data.status === "scheduled" && d <= NOW) return true;
  return false;
}
