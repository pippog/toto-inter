// Stub per i test (Vitest): il pacchetto reale "server-only" lancia
// sempre un errore quando non è risolto tramite il bundler di Next.js, che
// sostituisce l'import con un no-op solo nel layer server. Sotto Vitest non
// c'è quel bundler, quindi qui basta un modulo vuoto.
export {};
