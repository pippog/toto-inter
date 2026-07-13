// Soglie sostitutive (non cumulative): si prende la percentuale della
// soglia raggiunta dallo streak *dopo* questa partita. Uno streak di 0
// (componente non indovinato o pronostico mancante) restituisce 0% qui,
// il che permette di chiamare questa funzione incondizionatamente sul
// nuovo valore di streak senza un ramo if separato per "non indovinato".
export function streakBonusPct(streakLenAfter: number): number {
  if (streakLenAfter >= 4) return 1.0;
  if (streakLenAfter === 3) return 0.6;
  if (streakLenAfter === 2) return 0.3;
  return 0;
}
