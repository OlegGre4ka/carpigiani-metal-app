/** Date of a news item for the site: "2023-05-23" → "23 травня 2023" / "23 May 2023" */
export function newsDate(iso: string, locale: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(/\s*р\.$/, "");
}
