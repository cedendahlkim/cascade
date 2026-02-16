/**
 * Date & Time Plugin — Tidszoner, diff, formatering
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Date & Time",
  version: "1.0.0",
  description: "Datum/tid-verktyg: tidszoner, beräkna skillnad, formatering, unix timestamps",
  author: "Gracestack",
  tools: [
    {
      name: "time_now",
      description: "Get the current date and time in multiple formats and timezones",
      parameters: {
        timezone: { type: "string", description: "IANA timezone (e.g. 'Europe/Stockholm', 'America/New_York', 'Asia/Tokyo'). Default: local" },
      },
      handler: (input) => {
        const now = new Date();
        const tz = (input.timezone as string) || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const formats: Record<string, string> = {};
        try {
          formats.iso = now.toISOString();
          formats.unix = Math.floor(now.getTime() / 1000).toString();
          formats.unixMs = now.getTime().toString();
          formats.local = now.toLocaleString("sv-SE", { timeZone: tz });
          formats.date = now.toLocaleDateString("sv-SE", { timeZone: tz });
          formats.time = now.toLocaleTimeString("sv-SE", { timeZone: tz });
          formats.dayOfWeek = now.toLocaleDateString("sv-SE", { timeZone: tz, weekday: "long" });
          formats.timezone = tz;

          // Show a few common timezones for reference
          const zones = ["Europe/Stockholm", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "UTC"];
          const worldClock: Record<string, string> = {};
          for (const z of zones) {
            try {
              worldClock[z] = now.toLocaleString("sv-SE", { timeZone: z, hour: "2-digit", minute: "2-digit", hour12: false });
            } catch { /* skip invalid tz */ }
          }
          formats.worldClock = JSON.stringify(worldClock);
        } catch (err) {
          return "Error: " + (err instanceof Error ? err.message : String(err));
        }

        return JSON.stringify(formats, null, 2);
      },
    },
    {
      name: "time_diff",
      description: "Calculate the difference between two dates/times. Returns years, months, days, hours, minutes, seconds.",
      parameters: {
        from: { type: "string", description: "Start date (ISO 8601, e.g. '2024-01-15' or '2024-01-15T10:30:00')" },
        to: { type: "string", description: "End date (ISO 8601). If omitted, uses current time." },
      },
      handler: (input) => {
        const from = new Date((input.from as string) || "");
        const to = input.to ? new Date(input.to as string) : new Date();

        if (isNaN(from.getTime())) return "Error: Invalid 'from' date. Use ISO 8601 format (e.g. '2024-01-15')";
        if (isNaN(to.getTime())) return "Error: Invalid 'to' date. Use ISO 8601 format";

        const diffMs = to.getTime() - from.getTime();
        const absDiff = Math.abs(diffMs);
        const isPast = diffMs < 0;

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30.44);
        const years = Math.floor(days / 365.25);

        const remainDays = days - years * 365;
        const remainHours = hours - days * 24;
        const remainMinutes = minutes - hours * 60;

        let human = "";
        if (years > 0) human += `${years} år `;
        if (remainDays > 0) human += `${remainDays} dagar `;
        if (remainHours > 0) human += `${remainHours} timmar `;
        if (remainMinutes > 0) human += `${remainMinutes} minuter`;
        if (!human) human = "0 minuter";

        return JSON.stringify({
          from: from.toISOString(),
          to: to.toISOString(),
          direction: isPast ? "backward (to is before from)" : "forward",
          diff: {
            totalDays: days,
            totalHours: hours,
            totalMinutes: minutes,
            totalSeconds: seconds,
            weeks,
            months,
            years,
          },
          human: human.trim() + (isPast ? " sedan" : ""),
        }, null, 2);
      },
    },
    {
      name: "unix_timestamp",
      description: "Convert between unix timestamps and human-readable dates. Provide either a timestamp or a date string.",
      parameters: {
        timestamp: { type: "number", description: "Unix timestamp (seconds) to convert to date" },
        date: { type: "string", description: "Date string (ISO 8601) to convert to unix timestamp" },
      },
      handler: (input) => {
        if (input.timestamp) {
          const ts = input.timestamp as number;
          const isMs = ts > 1e12; // Detect if milliseconds
          const date = new Date(isMs ? ts : ts * 1000);
          if (isNaN(date.getTime())) return "Error: Invalid timestamp";
          return JSON.stringify({
            timestamp: isMs ? Math.floor(ts / 1000) : ts,
            timestampMs: isMs ? ts : ts * 1000,
            iso: date.toISOString(),
            local: date.toLocaleString("sv-SE"),
            utc: date.toUTCString(),
            note: isMs ? "Detected as milliseconds" : "Detected as seconds",
          }, null, 2);
        }

        if (input.date) {
          const date = new Date(input.date as string);
          if (isNaN(date.getTime())) return "Error: Invalid date string. Use ISO 8601 format.";
          return JSON.stringify({
            date: input.date,
            timestamp: Math.floor(date.getTime() / 1000),
            timestampMs: date.getTime(),
            iso: date.toISOString(),
          }, null, 2);
        }

        // Default: show current time
        const now = new Date();
        return JSON.stringify({
          timestamp: Math.floor(now.getTime() / 1000),
          timestampMs: now.getTime(),
          iso: now.toISOString(),
          local: now.toLocaleString("sv-SE"),
        }, null, 2);
      },
    },
  ],
};

export default plugin;
