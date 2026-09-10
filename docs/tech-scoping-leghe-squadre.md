# Scoping tecnico: motore multi-lega e supporto multi-squadra

> **Come è stato prodotto.** Analisi in 4 letture indipendenti e parallele del codice reale (motore di scoring, pannello admin, app giocatore, flusso inviti + provider dati calcistici), poi sintetizzate e riverificate contro il codice riga per riga. Approfondisce e sostituisce l'inquadramento concettuale di `docs/business-plan.md` §6 con un piano tecnico concreto: modelli dati, migrazione, refactor puntuali, ordine di build. Il white-label resta fuori scope qui, come da richiesta.
>
> **Correzione post-analisi:** il documento originale segnalava l'istruzione in `AGENTS.md` di leggere `node_modules/next/dist/docs/` come "evidentemente un test di prompt-injection". Verificato direttamente: è **falso allarme**. Quella cartella esiste davvero (423 file) — il progetto è su **Next.js 16.2.10**, versione con cambiamenti reali rispetto ai framework più diffusi nei dati di training, e include perfino una guida dedicata (`node_modules/next/dist/docs/01-app/02-guides/ai-agents.md`) pensata per agenti AI. **Prima di scrivere codice vero per questo refactor, va letta quella guida** — l'istruzione di AGENTS.md è legittima, non da ignorare.
>
> **Seconda verifica post-provider (2026-09-09):** nel frattempo API-Football è stato sostituito da Highlightly (commit `2292384`, `63a4403`). Il documento è stato riverificato riga per riga contro il nuovo provider: la raccomandazione architetturale di fondo (§1, Season/Match condivisi) **regge**, ma la sua giustificazione tecnica e alcuni dettagli operativi in §1, §6 e §7 erano scritti contro il vecchio provider e sono stati aggiornati di conseguenza (annotato inline dove rilevante). `syncSquad()` inoltre non esiste più (rimossa nel passaggio a Highlightly, gestione rosa ora manuale) — il bug di scoping che questo documento le attribuiva è quindi non più applicabile.

---

## Checklist di build (stato: nessuno step iniziato — 2026-08-04)

- [x] **Step 1** — `Team` + backfill Inter + `Match.teamId`/`Player.teamId` *(implementato e applicato in produzione il 2026-09-09 — vedi migrazioni `20260909145919_add_team_and_teamid_nullable`/`20260909150139_require_team_id_and_scope_player_unique` + `prisma/backfill-team-inter.ts`)*
- [x] **Step 2** — `League` + `LeagueMembership` + lega di default "storica" + backfill utenti esistenti *(implementato e applicato in produzione il 2026-09-09 — vedi `prisma/backfill-league-storica.ts`, 29/29 utenti iscritti)*
- [x] **Step 3** — Motore di scoring: `applyMatchResult`→`recomputeLeagueSeasonFrom`, `MatchScore.leagueId`, migrazione PK `PlayerStreakState` *(implementato e applicato in produzione il 2026-09-10 — vedi migrazioni `20260910142956_add_leagueid_nullable_to_matchscore_streakstate`/`20260910143500_require_matchscore_league_id`/`20260910144000_require_playerstreakstate_league_pk` + `prisma/backfill-matchscore-streakstate-league.ts`. Verifica di parità totalPoints pre/post su staging ha scoperto un bug preesistente — non introdotto da questo step — nel denominatore wRes/wMar per le stagioni storiche: `applyMatchResult` ora rifiuta esplicitamente di ricalcolare qualunque stagione con `isActive:false`, vedi nota in §3 e commento in `applyMatchResult.ts`)*
- [ ] **Step 4** — Admin: `/admin/teams`, `/admin/leagues`, `requireLeagueRole` in `dal.ts` *(medio)*
- [ ] **Step 5** — App giocatore: routing `/leagues/[leagueId]/...`, `LeagueSelector`, leaderboard/home/matches riscritti, fix `getVisiblePredictions` *(grande)*
- [ ] **Step 6** — Flusso invito: `LeagueInvite`, riscrittura `inviteUser`/`set-password`, pagina invito per-lega *(medio)*
- [ ] **Step 7** — Multi-squadra operativo: `findSeasonMatches` per squadra distinta, form creazione match con selezione team, genericizzazione stringhe "Inter" *(grande, deliberatamente ultimo)*

Dettaglio di ciascuno step in §7. Aggiornare le caselle mano a mano — è l'unico stato di avanzamento affidabile, non fidarsi della memoria di sessioni passate su quale step sia stato completato.

---

Ho verificato direttamente contro il codice (`prisma/schema.prisma`, `applyMatchResult.ts`, `computeMatchScores.ts`, `dal.ts`, `apiFootballProvider.ts`, `discover-fixtures/route.ts`, `admin/users/actions.ts`, `forgot-password/actions.ts`, `leaderboard/page.tsx`, `admin/matches/*`, `admin/seasons/actions.ts`, `sidebar.tsx`) i punti citati dai 4 report. Tutti i fatti concreti riportati (query, righe, nomi di campo) sono confermati esattamente come descritti, con due precisazioni minori: la costante della sidebar si chiama `PLAYER_NAV`, non `NAV_ITEMS`; e il parametro di `deriveMatchResult` è letteralmente `interTeamId` (`src/lib/football-provider/deriveResult.ts:38`).

I 4 report **non erano d'accordo tra loro** su un punto architetturale di fondo — se `Season`/`Match` debbano diventare per-lega o restare condivisi — che condiziona tutto il resto. Risolto esplicitamente in §1 prima di procedere, perché ogni altra sezione dipende da questa scelta.

---

## 1. Modello dati proposto

### Il fork architetturale

> **Conflitto tra i report, risolto.** Un report proponeva che `Match`/`Season` guadagnassero `leagueId` (righe duplicate per lega anche seguendo la stessa squadra). Un altro assumeva il contrario: match condivisi tra più leghe sulla stessa squadra.

Raccomando **Season/Match condivisi**, non per-lega, per un motivo di fondo indipendente dal provider dati in uso: una partita reale è legata a una **squadra**, non a una lega. Se `Match`/`Season` fossero per-lega, due leghe che seguono l'Inter avrebbero due righe `Match` duplicate per la stessa partita reale, sincronizzate indipendentemente — moltiplicando storage e rischio di disallineamento (una lega con risultato corretto, l'altra no, dopo una correzione manuale). Con Season/Match condivisi, una partita reale resta **una riga sola**; il confine tra leghe è solo `MatchScore`/`PlayerStreakState`. È anche l'unico modo per cui il costo API scali con le **squadre** seguite, non con le leghe (§6).
>
> *(Nota 2026-09-09: la versione precedente di questo paragrafo giustificava la scelta con un dettaglio del vecchio provider API-Football — fetch di tutte le partite del giorno filtrate lato client per `teamId`. Col provider attuale, Highlightly, `findUpcomingFixtures`/`findSeasonMatches` interrogano già `/matches?homeTeamId=X&season=Y` direttamente per squadra, lato server — quel dettaglio implementativo non esiste più. La raccomandazione non cambia: vale comunque, e più chiaramente, per il motivo di fondo sopra.)*

Conseguenza: `Season` **non cambia** — resta calendario globale (`isActive` unico, `getActiveSeason()` invariato). Solo `Match` guadagna `teamId`.

### Nuovi modelli

```prisma
model Team {
  id          String   @id @default(uuid())
  externalRef String   @unique   // id squadra su api-football, oggi INTER_TEAM_ID = 505
  name        String
  logoUrl     String?
  active      Boolean  @default(true)

  matches Match[]
  players Player[]
  leagues League[]
}

model League {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  teamId          String
  team            Team     @relation(fields: [teamId], references: [id])
  createdByUserId String
  createdBy       User     @relation(fields: [createdByUserId], references: [id])
  joinCode        String?  @unique   // per /leagues/[id]/join senza invito nominale
  createdAt       DateTime @default(now())

  memberships  LeagueMembership[]
  matchScores  MatchScore[]
  streakStates PlayerStreakState[]
  invites      LeagueInvite[]
}

enum LeagueRole {
  MEMBER
  MODERATOR
  OWNER
}

model LeagueMembership {
  userId   String
  user     User       @relation(fields: [userId], references: [id])
  leagueId String
  league   League     @relation(fields: [leagueId], references: [id])
  role     LeagueRole @default(MEMBER)
  joinedAt DateTime   @default(now())

  @@id([userId, leagueId])   // stesso stile compound-PK già usato da PlayerStreakState
}

model LeagueInvite {
  id              String     @id @default(uuid())
  token           String     @unique
  email           String
  leagueId        String
  league          League     @relation(fields: [leagueId], references: [id])
  role            LeagueRole @default(MEMBER)
  invitedByUserId String
  expiresAt       DateTime
  consumedAt      DateTime?
  createdAt       DateTime   @default(now())
}
```

`League` segue **una** squadra sola (`teamId` singolare) — su questo tutti i report concordano.

### Modifiche ai modelli esistenti

- **`Match`**: `+ teamId String`, `+ team Team @relation(...)`. `externalRef` resta `@unique` globale invariato.
- **`Player`**: `+ teamId String`. La `@unique` su `externalRef` va sostituita da `@@unique([teamId, externalRef])`: non per collisioni di id (globalmente univoci per persona su api-football), ma perché altrimenti `syncSquad()` (§6) farebbe un `upsert({where:{externalRef}})` che, se lo stesso giocatore comparisse in rose diverse nel tempo, sposterebbe silenziosamente la riga tra squadre corrompendo l'attribuzione storica.
- **`Prediction`**: **nessuna modifica**, resta `@@unique([matchId, userId])`. Sotto il modello a `Match` condiviso, il pronostico è un'affermazione sulla partita reale, identica indipendentemente da quale lega la osserva — permettere pronostici diversi per lega sulla stessa partita non ha senso prodottistico ed elimina un intero passo di migrazione e di query da scopare (`getVisiblePredictions` resta quasi invariata).
- **`MatchScore`**: `+ leagueId String`; unique da `@@unique([matchId, userId])` a **`@@unique([matchId, userId, leagueId])`**.
- **`PlayerStreakState`**: `+ leagueId String`; chiave da `@@id([userId, seasonId])` a **`@@id([userId, seasonId, leagueId])`**.
- **`User`**: nessun nuovo campo. Scartata l'idea di un `pendingLeagueId` su `User`, a favore del modello `LeagueInvite` dedicato — un singolo campo coprirebbe solo "utente nuovo che joina la lega X", non il caso, molto probabile in un prodotto tra amici, di invitare un utente **già attivo** a una seconda lega.

---

## 2. Migrazione dei dati esistenti

Le 3 stagioni storiche + la stagione attiva sono oggi Inter-only con pool unico. Sequenza in migrazioni separate, additive-prima-poi-vincolanti (mai `NOT NULL` nella stessa migrazione che aggiunge la colonna):

1. **`Team` + backfill**: crea una riga `Team{externalRef:"430539", name:"Inter"}` (id Highlightly, non il vecchio "505" di API-Football). Zero rischio, nessuno legge ancora `teamId`.
2. **`Match.teamId` nullable → backfill a Inter → `NOT NULL`** in migrazione successiva. Stesso per **`Player.teamId`**, poi sostituire `@unique(externalRef)` con `@@unique([teamId, externalRef])`.
3. **`League` di default**: `League{name:"Il Giochino - Storica", slug:"storica", teamId:<Inter>}`. `createdByUserId` = admin esistente.
4. **`LeagueMembership` di backfill**: una riga per **ogni** `User` esistente (inclusi gli account storici `DISABLED`, che hanno `MatchScore` reali da preservare in classifica storica), `role: MEMBER` tranne l'admin che prende `OWNER`. Ancora additivo.
5. **`MatchScore.leagueId` nullable → backfill con l'id della lega di default → `@@unique([matchId,userId,leagueId])`.** Una sola lega storicamente: nessun conflitto possibile sulla nuova unique key.
6. **`PlayerStreakState.leagueId`**: stesso backfill, poi migrazione della chiave primaria. **Unica migrazione realmente distruttiva** (Postgres richiede drop+ricreazione del vincolo di PK su tabella popolata) — va scritta a mano, non affidata al diff automatico di `prisma migrate dev`, testata su un dump di produzione prima di applicarla lì.
7. **Verifica**: dopo il backfill, se la nuova funzione calcola `allActivePlayerIds` da `LeagueMembership` invece che da `User.status`, deve riprodurre esattamente lo stesso insieme di utenti di prima, altrimenti i denominatori `wRes`/`wMar` cambiano e i punteggi storici già mostrati si spostano. Verificare con un confronto puntuale (somma `totalPoints` per utente, pre/post) su staging, non a occhio in produzione.

Ordine: 1-2 (Team/Player, isolato) → 3-4 (League/Membership, additivo) → 5-6 (MatchScore/PlayerStreakState, l'unica finestra rischiosa) come ultima migrazione, nello stesso deploy del codice che inizia a scrivere/leggere `leagueId`.

---

## 3. Motore di scoring — cosa cambia

`computeMatchScores.ts` (righe 20-106) **non cambia di una riga**: è già una funzione pura che prende `allActivePlayerIds`/`priorStreaks`/`official`/`predictions` come input semplici — non ha alcuna nozione di "globale" vs "per lega". L'unico lavoro è cambiare cosa il chiamante gli passa.

Il chiamante da riscrivere è `applyMatchResult.ts` → `recomputeSeasonFrom` diventa `recomputeLeagueSeasonFrom(leagueId, seasonId, fromKickoffAt)`:

- `allActivePlayerIds` da `prisma.leagueMembership.findMany({where:{leagueId, user:{status:"ACTIVE"}}})` invece che da tutti gli utenti attivi del sistema.
- `priorMatch`/`matchesToScore` guadagnano il filtro `teamId: league.teamId` — **necessario**, non opzionale: sotto `Season` condivisa, una stessa `seasonId` può contenere partite di squadre diverse.
- `matchScore.deleteMany`/`createMany` guadagnano `leagueId` nel `where`/nei dati — altrimenti ricalcolare la lega A cancellerebbe anche i `MatchScore` della lega B sulla stessa partita condivisa.
- Il flag "calcolato" (`scoringComputedAt`/`status:"FINISHED"`) va scritto sul `Match` **una volta sola** in `applyMatchResult` (che itera le leghe che seguono quella squadra), non dentro il loop per-lega — altrimenti N leghe = N scritture ridondanti sulla stessa riga, con contesa inutile sotto esecuzioni concorrenti.
- Ogni lega gira nella propria `$transaction` indipendente: un fallimento su una lega non blocca le altre.

**Multi-squadra**: nessuna modifica di formula. `deriveMatchResult` è già team-agnostico nella logica; sul path attivo (`deriveHighlightlyResult.ts`) il parametro è già `teamId` generico, nessuna rinomina da fare (vedi §6). `scorer.ts` ("Autogol (a favore dell'Inter)") è l'unico punto col testo Inter-specifico da parametrizzare su `team.name`.

> **Nota 2026-09-10 — bug preesistente scoperto durante l'implementazione (non introdotto da questo step).** `allActivePlayerIds` riflette lo stato `User.status === "ACTIVE"` **al momento del ricalcolo**, non chi giocava davvero all'epoca. Le stagioni storiche importate (2023-24/2024-25/2025-26) includono account ormai `DISABLED` apposta con `MatchScore` reali da preservare (vedi §2 punto 4): ricalcolarle li escluderebbe dai denominatori wRes/wMar, gonfiando silenziosamente i punti di chi è rimasto. Verificato concretamente su staging: differenze reali fino al 40% su una stagione storica prima di essere scoperto e corretto. Il meccanismo che ha prodotto quei punteggi storici non è documentato né riproducibile col codice attuale, quindi **`applyMatchResult` ora rifiuta esplicitamente (throw) di ricalcolare qualunque stagione con `isActive:false`**, sia dal form admin (`setManualResult` ritorna un errore prima di scrivere) sia da qualunque futuro chiamante — invece di tentare di indovinarne la formula originale. Se in futuro serve davvero correggere un risultato storico, va prima capito/ricostruito il denominatore originale.

---

## 4. Pannello admin — cosa cambia

**Ruoli**: `Role{PLAYER,ADMIN}` resta invariato come bypass globale ("superadmin") — `requireAdmin()` in `dal.ts` non si tocca. Si aggiunge `requireLeagueRole(leagueId, minRole)` per le pagine scoped-per-lega, verificando `LeagueMembership.role`.

**Confine di fiducia non ovvio**, conseguenza diretta del modello a `Match` condiviso: `createMatch` e `setManualResult` devono restare azioni **globali** dietro `requireAdmin()`, mai delegabili a un `LeagueRole.OWNER`. Un risultato sbagliato inserito da un organizzatore di lega corromperebbe la classifica di **tutte** le altre leghe che seguono la stessa squadra.

**Nuove route**:
- `/admin/teams` (globale): CRUD minimo su `Team` — precondizione per creare qualunque `League`.
- `/admin/teams/[teamId]/matches` e `/[matchId]/result` (globale): sostituiscono l'attuale `admin/matches/page.tsx` — le partite vanno scopate per **squadra**, non per lega, perché più leghe condividono le stesse righe `Match`. *(Nota 2026-09-09: dal commit `57494de` questa pagina non fa più una `findMany` piatta sui match, ma raggruppa per stagione via `prisma.season.findMany({include:{matches}})` con una sezione "da chiudere" calcolata lato client. Introdurre lo scoping per team richiederà **ristrutturare** questa query, non solo aggiungerci un `where`.)*
- `/admin/leagues` (globale) e `/admin/leagues/[leagueId]` (raggiungibile anche da `OWNER`/`MODERATOR` non-ADMIN): impostazioni lega, membri, inviti.

**Modifiche puntuali**: `create-match-form.tsx` perde/cambia la checkbox "Inter in casa" → `{team.name} in casa`, squadra dal contesto route; `admin/matches/[id]/result/page.tsx` titolo e query rosa (`prisma.player.findMany({where:{active:true}})`, oggi **senza filtro squadra**) guadagnano `teamId: match.teamId`; `admin/seasons/actions.ts::createSeason` **non cambia** (rollover resta globale, dato che `Season` non guadagna `leagueId`); `admin/users/actions.ts` **invariato** (gestione utenti resta a livello piattaforma, l'invito a una lega è un'azione nuova, vedi §6).

---

## 5. App giocatore — cosa cambia

Oggi l'unico "contesto" navigabile è la stagione, via querystring (`?season=`). La lega deve essere un **contesto persistente e visibile in URL**, non un cookie: condiziona quasi ogni pagina ed è un prodotto pensato per essere condiviso tra amici — un link a "la classifica della tua lega" deve essere condivisibile. Struttura consigliata: spostare `matches/page.tsx`, `leaderboard/page.tsx`, `matches/[id]/page.tsx`, la home sotto `(player)/leagues/[leagueId]/...`.

**Query da riscrivere**:
- `leaderboard/page.tsx`: entrambi i rami (stagione attiva e storico) vanno riscritti per ripartire da `LeagueMembership` filtrata per `leagueId`, con `matchScores`/`some` filtrati sia per `leagueId` sia per `match.seasonId` — altrimenti un utente che ha giocato quella stagione in un'**altra** lega comparirebbe erroneamente qui.
- `getVisiblePredictions` (`dal.ts:63-80`): il ramo "rivelato" va ristretto ai soli membri della lega chiamante — altrimenti, essendo `Match` condiviso tra leghe, un membro della lega A vedrebbe i pronostici rivelati di utenti della lega B sulla stessa partita. Firma nuova: `getVisiblePredictions(matchId, leagueId)`.
- `matches-list.tsx`/`matches/page.tsx`: filtro aggiuntivo per `teamId` della lega attiva.

**Navigazione**: `sidebar.tsx` (`PLAYER_NAV`) è statico oggi; ogni `href` deve interpolare `leagueId`, serve un `LeagueSelector` persistente (non querystring) più una nuova `/leagues` (elenco leghe dell'utente + CTA "crea/unisciti") come landing quando manca un `leagueId` di default.

**Flusso di pronostico**: sotto `Prediction` condivisa, `matches/[id]/actions.ts` **non cambia funzionalmente**. Cambia solo la copy: testi fissi ("L'Inter non segna", "Un giocatore dell'Inter") e le occorrenze letterali di "Inter" nel JSX vanno parametrizzate su `match.team.name`.

---

## 6. Invito e provider dati — cosa cambia

### Invito

Oggi `inviteUser` crea uno `User{status:"INVITED"}` globale con `inviteToken`/`inviteExpires`, nessun "verso cosa". Dettaglio verificato: `forgotPasswordAction` **riusa esattamente le stesse colonne** `inviteToken`/`inviteExpires` per il reset password — un solo campo serve due flussi semanticamente diversi. Non bloccante oggi (i due flussi non si sovrappongono nel tempo per lo stesso utente), ma vale la pena sistemarlo mentre si tocca comunque questo codice per l'invito-a-lega.

Design consigliato: modello dedicato `LeagueInvite` invece di un `pendingLeagueId` su `User` — un singolo campo coprirebbe solo "utente nuovo che joina la lega X", non "utente già attivo, invitato a una **seconda** lega". `set-password/actions.ts`, che oggi fa `redirectTo:"/matches"` fisso, legge `LeagueInvite.leagueId` dal token consumato e reindirizza a `/leagues/${leagueId}` (fallback a `/leagues` se l'invito non porta una lega specifica).

### Provider dati (`highlightlyProvider.ts`)

> *(Aggiornato 2026-09-09 — questa sezione era scritta contro `apiFootballProvider.ts`, ormai spento e sostituito da `highlightlyProvider.ts`. Riscritta contro il provider attivo.)*

`INTER_TEAM_ID = 430539` è l'unica costante hardcoded attiva, importata solo in `discover-fixtures/route.ts` e `sync-results/route.ts` (il vecchio `apiFootballProvider.ts`/`INTER_TEAM_ID = 505` resta come dead code, non collegato a nessuna route). Le funzioni del provider sono già generiche in firma — il refactor è tutto lato chiamante.

Correzioni concrete:

1. **`discover-fixtures/route.ts` è più semplice da rendere multi-team di quanto un lettore abituato al vecchio provider si aspetterebbe.** `findUpcomingFixtures`/`findSeasonMatches` interrogano già oggi `/matches?homeTeamId=X&season=Y` (quota-limitato alla stagione corrente dal commit `63a4403`) **direttamente per squadra**, lato server — non c'è un payload giornaliero condiviso da filtrare lato client. Il refactor per lo step 7 si riduce quindi a: chiamare `findSeasonMatches` una volta per ogni squadra distinta seguita nel sistema. Nessun filtro `Set.has`/day-window da costruire.
2. **`syncSquad()` non esiste più** — è stata rimossa interamente nel passaggio a Highlightly (gestione rosa ora manuale, `getSquad` è opzionale nell'interfaccia del provider e `highlightlyProvider.ts` non la implementa). Il bug di scoping segnalato in precedenza non è più applicabile: non c'è più nessuna funzione di auto-sync da correggere. Resta comunque valido aggiungere `Player.teamId` allo step 1 (§7) per correttezza futura — quando arriverà una seconda squadra, l'inserimento manuale della rosa andrà comunque scopato per team.
3. `deriveMatchResult`: il path live (`deriveHighlightlyResult.ts`) usa **già** `teamId` generico, nessuna rinomina necessaria lì. Solo il path morto (`deriveResult.ts`, usato dal provider API-Football spento) usa ancora `interTeamId` letteralmente — candidato a rimozione come dead code insieme ad `apiFootballProvider.ts`, non richiede lavoro per questo refactor.
4. `sync-results/route.ts`: sostituire `INTER_TEAM_ID` con `match.teamId` letto per singola partita — invariato rispetto alla versione precedente di questa nota.

### Soglia piano Pro

Stima esterna (non verificabile da codice): con la correzione (1) sopra — già naturale col provider attuale — il costo scala con le **squadre distinte** seguite in tutto il sistema, non con il numero di leghe — più leghe sulla stessa squadra non costano nulla in più. Il segnale da monitorare è "quante squadre diverse sono effettivamente seguite", non "quante leghe esistono".

---

## 7. Ordine di build consigliato

Pensato per uno sviluppatore solo part-time: dal cambiamento più isolato/reversibile al più rischioso.

1. **`Team` + backfill Inter + `Match.teamId`/`Player.teamId`.** *Piccolo.* Puramente additivo, zero comportamento visibile cambiato. Primo perché tutto il resto dipende dall'esistenza di `Team`. *(Nota 2026-09-09: non c'è più bisogno di rinominare `interTeamId→teamId` sul path attivo, né di correggere `syncSquad()` — vedi §6.)*
2. **`League` + `LeagueMembership` + lega di default "storica" + backfill utenti esistenti.** *Piccolo-medio.* Additivo e reversibile, costruisce il substrato per il resto.
3. **Riscrittura del motore**: `applyMatchResult`→`recomputeLeagueSeasonFrom`, `MatchScore.leagueId`, migrazione PK di `PlayerStreakState`. *Medio-grande.* Primo cambiamento con vero rischio di correttezza dati — va fatto **prima** di qualunque UI, così i numeri sono già verificati quando (step 5) i giocatori vedono per la prima volta pagine "a lega".
4. **Admin**: `/admin/teams`, `/admin/leagues`, `requireLeagueRole`. *Medio.* Prima superficie per creare davvero una seconda lega. Rischio contenuto: solo il founder (ADMIN globale) ci mette mano.
5. **App giocatore**: routing `/leagues/[leagueId]/...`, `LeagueSelector`, riscrittura leaderboard/home/matches, fix `getVisiblePredictions`. *Grande* — superficie più ampia, ma con dati già corretti dallo step 3 il rischio residuo è "bug di wiring UI", non "punteggio sbagliato".
6. **Flusso invito**: `LeagueInvite`, riscrittura `inviteUser`/`set-password`, pagina di invito per-lega. *Medio.* Dipende da `League` (2) e admin per-lega (4).
7. **Multi-squadra operativo**: chiamare `findSeasonMatches` una volta per squadra distinta seguita, form di creazione match con selezione team, genericizzazione delle stringhe "Inter" hardcoded in tutto il progetto. *Grande*, deliberatamente ultimo: unico step che tocca il profilo di costo/affidabilità dell'integrazione esterna e la superficie di stringhe hardcoded più ampia del progetto — meglio farla con calma, quando il resto è già stabile. *(Nota 2026-09-09: col provider Highlightly la parte di discovery multi-team è più leggera del previsto — vedi §6, punto 1 — resta comunque grande per via delle stringhe "Inter" e del form di creazione match.)*

---

## 8. Rischi tecnici principali

1. **Migrazione della PK di `PlayerStreakState` è distruttiva su tabella popolata.** Mitigazione: backfill di `leagueId` in migrazione separata precedente, scrivere a mano la migrazione di cambio PK, testarla su copia del DB di produzione.
2. **Il fork Season/Match condiviso-vs-per-lega è la decisione a più leva di tutto il documento.** Sbagliarla moltiplica il lavoro di discovery/sync per lega e complica reveal/invito. Va decisa esplicitamente prima di scrivere qualunque migrazione — raccomandato: Season/Match condivisi, scoping solo su `MatchScore`/`PlayerStreakState`.
3. **`recomputeLeagueSeasonFrom` scala con le leghe che seguono la stessa squadra.** Mitigazione: transazioni per-lega piccole e indipendenti; da rivedere solo se una squadra accumula decine di leghe.
4. **Il volume di chiamate al provider dati scala con le squadre seguite** (§6). Col provider attuale (Highlightly) questo è già naturale — `findSeasonMatches` interroga per team+stagione direttamente — basta chiamarla una volta per ogni squadra distinta seguita, senza refactor aggiuntivo del provider stesso.
5. **Sequenza backfill→NOT NULL e superfici di leakage tra leghe.** Diversi punti (`Match.teamId`, `Player.teamId` con chiave composta, `MatchScore.leagueId`, `getVisiblePredictions`) dove dimenticare un backfill rompe un vincolo NOT NULL, o dimenticare un filtro fa trapelare dati di un'altra lega. Mitigazione: ogni nuova FK nasce nullable, si backfilla, si verifica il conteggio righe, solo dopo si stringe a NOT NULL; aggiungere un test di regressione che asserisca che `getVisiblePredictions` non restituisca mai un utente fuori dalla lega chiamante.
