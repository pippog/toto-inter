// Il form ammin invia un <input type="datetime-local"> ("2026-08-01T13:30"),
// senza fuso orario: va sempre interpretato come ora italiana, a prescindere
// dal fuso del processo che esegue il codice (in locale è Europe/Rome, ma su
// Vercel il runtime di produzione gira in UTC — senza questa conversione un
// admin che scrive "13:30" si ritroverebbe la partita salvata alle 13:30 UTC,
// cioè le 15:30 italiane).
const ITALY_TZ = "Europe/Rome";

// Offset reale (minuti, positivo a est di UTC) di `timeZone` nell'istante
// `date` — calcolato dal nome esplicito ("GMT+2"/"GMT+1") invece di far
// ri-parsare una stringa locale a new Date(), che dipenderebbe a sua volta
// dal fuso del runtime (bug del primo tentativo: coincide con Europe/Rome in
// locale, quindi sembra funzionare, ma su Vercel/UTC produce un offset zero).
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(raw);
  if (!match) return 0;
  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

export function parseItalianLocalDateTime(value: string): Date {
  // value è "YYYY-MM-DDTHH:mm" (senza secondi, formato standard di
  // datetime-local senza step) oppure, più raramente, con i secondi già inclusi.
  const isoLocal = value.length === 16 ? `${value}:00` : value;
  // Ancora: tratta i numeri scritti come se fossero UTC, solo per avere un
  // istante su cui calcolare l'offset italiano di quel giorno (gestisce CET/CEST).
  const anchorUtc = new Date(`${isoLocal}Z`);
  const offsetMinutes = getTimeZoneOffsetMinutes(anchorUtc, ITALY_TZ);
  return new Date(anchorUtc.getTime() - offsetMinutes * 60_000);
}

// Formatta sempre in ora italiana, a prescindere dal fuso del runtime che
// esegue il rendering (Vercel gira in UTC): senza timeZone esplicito,
// toLocaleString userebbe il fuso del server, non quello degli utenti.
export function formatItalianDateTime(date: Date): string {
  return date.toLocaleString("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ITALY_TZ,
  });
}
