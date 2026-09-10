# Business plan – Il Giochino (v3)

> Aggiorna la v2 con il motore multi-lega e la scelta della squadra seguita (tra tutte quelle di Serie A) come parte della piattaforma. Restano fuori scope, trattati come lavoro residuo in §6: white-label e le competizioni internazionali (Champions League, Nazionale, tornei).

---

## 0. Stato attuale del prodotto

* **Motore multi-lega**: gruppi di utenti isolati, ciascuno con classifica, streak e storico separati.
* **Scelta della squadra**: ogni lega segue una squadra a scelta tra le 20 di Serie A. Champions League, Nazionale e altre competizioni non sono ancora coperte (§6) — richiedono un modello di competizione diverso da "una squadra che segue un campionato continuo".
* **PWA e notifiche push** in produzione: un solo codice per iPhone/Android/PC, diffusione via link WhatsApp, aggiornamenti senza approvazione store.
* **API-Football**: il costo di sincronizzazione scala con il numero di squadre distinte effettivamente seguite da almeno una lega, non con il numero di leghe — un unico fetch giornaliero filtrato lato client contro l'intero insieme di squadre seguite. Con poche squadre distinte il piano Free resta sufficiente; superata una soglia (da monitorare con l'uso reale, non nota a priori) serve il piano Pro (≈19 USD/mese).
* **3 stagioni di dati storici** del gruppo originale, disponibili nella lega di quel gruppo.
* **Da costruire**: Il Giochino Supporter (indipendente dal motore lega, costruibile in autonomia), white-label (isolamento multi-tenant tra clienti esterni, oltre il motore lega/squadra), Champions League/Nazionale (modello di competizione a parte).

Il fattore che oggi determina la velocità di crescita è la capacità commerciale di raggiungere e convertire nuove tifoserie (§14) — non un vincolo tecnico.

---

## 1. Sintesi del progetto

**Il Giochino** è una piattaforma di pronostici calcistici sociali nella quale gli utenti:

* indicano il primo marcatore;
* pronosticano il risultato esatto;
* competono in classifiche stagionali;
* creano leghe private con amici e colleghi, scegliendo la squadra di Serie A che la lega segue;
* visualizzano i pronostici degli altri solamente dopo il calcio d'inizio;
* accumulano bonus, serie positive e statistiche personali.

Il valore principale non è il pronostico in sé, ma la **competizione ricorrente tra persone che si conoscono**. Il prodotto copre già tutte le squadre di Serie A (una per lega); restano da aggiungere Champions League, Nazionale, Mondiali/Europei e competizioni personalizzate (§6).

---

## 2. Panorama competitivo

| Categoria | Esempi | Perché non è lo stesso prodotto |
| --- | --- | --- |
| Fantacalcio | Fantacalcio.it, Fantamaster, Leghe Fantacalcio | Gestione rosa stagionale, non pronostico partita-per-partita; pubblico enorme ma abitudine di gioco diversa e settimanale, non quotidiana |
| Pronostici "free-to-play" di bookmaker | SNAI, Sisal (pronostici gratuiti/pool) | Stessa meccanica di base ma legata a un operatore di scommesse, con relativo posizionamento e vincoli ADM |
| Prediction feature dentro app sportive | Sofascore, OneFootball, app ufficiali di club | Feature accessoria dentro un prodotto più grande, non l'esperienza principale; poca identità di gruppo/lega privata |
| Giochi social generici tra amici | Gruppi WhatsApp "a mano", fogli Excel condivisi | È letteralmente quello che Il Giochino sostituisce — è il concorrente più diretto e il più facile da battere |

La tesi differenziante: **Il Giochino non compete su "chi ha i dati calcistici migliori" ma su "chi rende più semplice e divertente la sfida ricorrente tra un gruppo di persone che si conoscono già".** Con la scelta della squadra, questa tesi vale per **qualunque tifoseria di Serie A**, non solo per l'Inter — il mercato indirizzabile è quello di tutta la Serie A; la vera domanda restano i canali per raggiungere davvero altre tifoserie (§8).

Azione consigliata: mezza giornata di analisi diretta (screenshot, prezzi, recensioni) di 2-3 concorrenti reali nella categoria "pronostici free-to-play", per calibrare posizionamento prezzo e aspettative degli utenti sul piano gratuito.

---

## 3. Tesi commerciale

La pubblicità tradizionale produce ricavi significativi solo con decine di migliaia di utenti attivi. Il modello:

1. app gratuita per i giocatori;
2. funzioni premium personali (Supporter);
3. abbonamento per gli organizzatori delle leghe (Lega Pro);
4. tornei sponsorizzati;
5. versione personalizzata per bar, fan club, creator e aziende (white-label).

Il pronostico base resta gratuito: ogni nuovo giocatore aumenta il valore della piattaforma invitando altri.

---

## 4. Clienti target

**Giocatori** — tifosi che vogliono competere con amici/colleghi, non necessariamente interessati alle scommesse: cercano divertimento, rivalità, classifiche.

**Organizzatori** — chi crea e gestisce il gruppo (admin di gruppo WhatsApp, presidente fan club, organizzatore fantacalcio, titolare bar, creator, referente aziendale), libero di scegliere quale squadra di Serie A la propria lega segue. È il cliente più disposto a pagare perché riceve strumenti che gli evitano di gestire manualmente risultati e classifiche.

**Sponsor** — bar, negozi sportivi, e-commerce abbigliamento, ristoranti, fan club, creator, aziende con torneo interno, indirizzabili anche per tifoseria specifica (§5).

---

## 5. Modello di monetizzazione

### Piano gratuito

Partecipazione ai pronostici, **una** lega privata (su una squadra di Serie A a scelta), classifica generale, storico essenziale, notifiche, condivisione WhatsApp, badge e serie positive.

**Decisione di prodotto ancora da prendere:** il limite esatto di membri di una lega gratuita che fa scattare la conversione a Lega Pro non è ancora un numero fissato. Senza un numero preciso non si può vendere Lega Pro con un argomento concreto ("il tuo gruppo ha 15 persone, il piano gratuito si ferma a N").

### Il Giochino Supporter — 14,99 €/anno

Nessuna pubblicità, statistiche personali complete, storico multi-stagione, confronto diretto 1-vs-1, grafici andamento, badge esclusivi, temi/avatar, più leghe contemporaneamente, notifiche personalizzate, riepilogo stagionale condivisibile.

Abbonamento **annuale**, non mensile: su un prezzo basso la commissione fissa per transazione pesa molto e l'annuale riduce cancellazioni e costi amministrativi. Stripe applica oggi, per carte standard SEPA, circa 1,5% + 0,25 € a transazione.

Da costruire, indipendentemente da tutto il resto — nessuna dipendenza da altre parti della piattaforma.

Idee aggiuntive da valutare (non urgenti): regalo di un abbonamento a un altro giocatore della lega; sconto/bundle per chi acquista Lega Pro (Supporter incluso per l'organizzatore).

### Lega Pro — 19,99 €/stagione per lega

Paga solo l'organizzatore; gli invitati giocano gratis. Partecipanti illimitati/alto limite, branding lega, regolamento e punteggi personalizzabili, competizioni selezionabili, moderatori aggiuntivi, export Excel/PDF, storico permanente, comunicazioni automatiche, pagina pubblica della lega, premi virtuali/certificati, no pubblicità per tutti i membri.

Vendibile da subito, senza dipendenze tecniche residue. La priorità è commerciale: chi la vende attivamente, e a quali gruppi/tifoserie (§14).

**Attenzione privacy sulla "pagina pubblica della lega":** se la lega passa da privata a pubblicamente condivisibile, i nickname e (se presenti) le foto profilo dei membri diventano visibili senza autenticazione. Va deciso esplicitamente cosa è pubblico (solo classifica e nomi alias, mai email/nome reale) e va raccolto un consenso esplicito dell'organizzatore e/o dei membri prima di abilitare la funzione.

### Tornei sponsorizzati

| Pacchetto | Prezzo indicativo |
| --- | ---: |
| Sponsorizzazione di una giornata | 150–300 € |
| Torneo mensile | 500–1.000 € |
| Campionato stagionale | 1.500–3.500 € |
| Torneo aziendale personalizzato | 1.000–3.000 € |

Lo sponsor riceve logo/banner non invasivo, messaggio pre-partita, coupon partecipanti, statistiche aggregate, presenza nelle condivisioni social, eventuale premio fornito dallo sponsor.

Ogni lega è legata a una squadra specifica: questo apre sponsorizzazioni **verticali per tifoseria** — "Il Giochino dei tifosi del Torino", sponsorizzato da un'attività di Torino — un pitch più mirato di una sponsorizzazione generica, più facile da chiudere a livello locale. Resta comunque lavoro di *sales* (telefonate, incontri, follow-up): il piano deve dire chi lo fa e quante ore/settimana ci dedica (§14).

### White-label

Richiede un lavoro aggiuntivo di isolamento multi-tenant tra clienti esterni (branding completo, dominio custom, eventuale necessità di dati non condivisi nemmeno a livello di squadra), distinto dal motore lega/squadra già in piattaforma. Configurazione iniziale indicativamente **2.000-6.000 €**, gestione annuale 600-1.500 €, personalizzazioni a progetto — da ricalibrare sul tempo reale alla prima integrazione.

### Affiliazioni commerciali

Offerte contestuali e poco invasive (es. sconto locale partner la sera di una partita). Ricavo complementare, non modello principale.

### Pubblicità

Solo nel piano gratuito, con limiti netti: niente video obbligatori pre-pronostico, niente banner che coprono l'interfaccia, massimo uno spazio sponsor per schermata partita, preferenza per sponsor diretti su reti automatiche.

### I prezzi sono corretti?

Nessuno dei prezzi è stato validato con dati reali. Valutandoli uno per uno:

* **Supporter, 14,99 €/anno — probabilmente sottoprezzato, ma difendibile come prezzo di lancio.** Il pubblico target è già socialmente coinvolto in una rivalità con amici/colleghi, e tipicamente tollera prezzi più alti per prodotti "identitari" di questo tipo. Suggerimento: alzarlo a 19,99-24,99 €/anno da subito, oppure tenerlo esplicitamente come prezzo "founding member" da alzare una volta dimostrata la retention.
* **Lega Pro, 19,99 €/stagione — sottoprezzato rispetto al valore.** Conveniente in modo sproporzionato per un organizzatore aziendale o di fan club con budget reale. Suggerimento: prezzo unico più alto (29,99-39,99 €) oppure una fascia legata al numero di partecipanti (fino a 20 membri = 19,99 €, oltre = 39,99-49,99 €).
* **Manca un livello intermedio tra Lega Pro (~20 €, self-serve) e white-label/torneo aziendale (1.000 €+, venduto a mano).** Vale la pena introdurre una fascia "Lega Pro Business" intermedia (indicativamente 99-199 €/stagione) per il "referente aziendale" che oggi o sotto-paga o affronta una trattativa da migliaia di euro.
* **Sponsorizzazioni a giornata/mese (150-300 €, 500-1.000 €) — ragionevoli per un pubblico iper-locale**, vendute con l'argomento "sostieni la community locale" piuttosto che "paghi per impression". Il "campionato stagionale" (1.500-3.500 €) implica uno sconto ripido rispetto al prezzo a giornata — va bene per chiudere il primo sponsor "title" di ogni tifoseria, da rivedere al primo rinnovo.
* **White-label, 2.000-6.000 € di setup — probabilmente ancora sottoprezzato** per un cliente business con budget reale.

L'azione più utile resta testare i prezzi con utenti reali (a partire dal gruppo storico e da una prima lega su una seconda squadra), non ridiscuterli sulla carta.

---

## 6. Cosa resta da costruire

| Feature | Stato |
| --- | --- |
| Il Giochino Supporter | Da costruire — indipendente da tutto il resto |
| White-label | Da costruire — isolamento multi-tenant oltre il motore lega/squadra |
| Champions League / Nazionale / tornei internazionali | Da costruire — modello di competizione diverso (calendario non continuo tipo campionato) |
| Pubblicazione sugli store | Non ancora fatta (§7) |

Dettaglio tecnico del motore lega/squadra già in piattaforma, incluse le scelte architetturali fatte (`Match`/`Season` condivisi, `MatchScore`/`PlayerStreakState` scoped per lega) in [`docs/tech-scoping-leghe-squadre.md`](tech-scoping-leghe-squadre.md).

Con Lega Pro vendibile da subito e leghe apribili su qualunque squadra di Serie A, il fattore che decide la velocità di crescita è quante tifoserie si riesce davvero a raggiungere e convertire (§14) — non la disponibilità del prodotto.

---

## 7. Strategia PWA e store

Un solo codice per iPhone/Android/PC, diffusione via link WhatsApp, aggiornamenti senza approvazione store, pagamenti web, nessun obbligo di installazione, costi iniziali bassi.

Gli store restano un passo successivo, quando il prodotto ha già dimostrato utenti ricorrenti. Apple richiede 99 USD/anno (Apple Developer Program), Google 25 USD una tantum. Sugli acquisti digitali da store, Apple offre 15% agli sviluppatori nello Small Business Program e Google indica 15% sulla prima fascia di ricavi — condizioni da riverificare al momento della pubblicazione.

---

## 8. Strategia di crescita

### Fase 1 — Validazione (3 mesi)

Portare il gruppo storico attuale sull'app, verificare la partecipazione giornata-per-giornata, misurare gli inviti, correggere l'onboarding, raccogliere feedback. Nessun paywall aggressivo. Rischio basso a sperimentare già in questa fase con **una seconda lega di test su un'altra squadra**, per verificare che l'esperienza regga anche fuori dal contesto Inter-only prima di spingere sul resto.

**Metriche minime — da validare/ricalibrare sui 3 storici già disponibili:**

* ≥ 50% degli iscritti effettua il primo pronostico;
* ≥ 35% torna dopo 4 settimane;
* ≥ 1 nuovo utente ogni 4 inviti;
* ≥ 30% degli utenti attivi gioca in giornate consecutive.

### Fase 2 — Crescita e monetizzazione

Canali di crescita:

* **Contattare fan page/community di altre squadre di Serie A** proponendo di aprire una loro lega dedicata — un pitch naturale, dato che ogni lega segue in isolamento la propria squadra.
* Sponsorizzazioni verticali per tifoseria (§5).
* Passaparola WhatsApp e referral.
* Partnership con content creator/fan page calcistiche: ciascuno può avere "la propria" lega sulla "propria" squadra.
* Micro-budget di test su social a pagamento per stimare il CAC reale prima di scalare il marketing in Fase 3.

Il Giochino Supporter (una volta costruito) e Lega Pro restano le due monetizzazioni principali di questa fase; la prima sponsorizzazione è vendibile anche con poche centinaia di utenti se geograficamente/tematicamente pertinente.

### Fase 3 — Espansione

Champions League, Nazionale, tornei creator, versione aziendale/white-label, pubblicazione sugli store, landing page per squadra.

---

## 9. Unit economics essenziali

* **LTV Supporter, stima indicativa:** se un abbonato resta in media 2 stagioni, LTV lordo ≈ 2 × 14,99 € ≈ 30 €; netto commissioni ≈ 29 €. CAC sostenibile per questa riga da sola è basso: il canale principale deve restare organico/referral, non acquisizione a pagamento.
* **CAC:** non stimabile in modo affidabile finché non si testano canali a pagamento con budget reale. Prima di allocare il budget marketing previsto in §10, vale la pena riservarne una piccola quota a un test controllato.
* **Lega Pro** ha un LTV per cliente potenzialmente molto più alto (rinnovo stagionale + minore sensibilità al prezzo per un organizzatore che risparmia tempo) — priorità commerciale immediata, venderla attivamente.

---

## 10. Piano economico triennale

Le cifre restano uno **scenario operativo illustrativo**, da ricalibrare appena disponibili i numeri reali di retention dai 3 storici (§0).

### Ipotesi

| Voce | Anno 1 | Anno 2 | Anno 3 |
| --- | ---: | ---: | ---: |
| Utenti registrati | 5.000 | 25.000 | 80.000 |
| Utenti attivi mensili | 1.500 | 8.000 | 25.000 |
| Abbonati Supporter | 150 | 1.000 | 4.000 |
| Leghe Pro | 200† | 600 | 2.000 |

† *Stima prudente: il prodotto è vendibile per l'intero anno, ma venderlo richiede comunque lavoro commerciale attivo (§14) — non è un numero raggiunto automaticamente.*

### Ricavi

| Fonte | Anno 1 | Anno 2 | Anno 3 |
| --- | ---: | ---: | ---: |
| Supporter, 14,99 € | 2.249 € | 14.990 € | 59.960 € |
| Leghe Pro, 19,99 € | 3.998 € | 11.994 € | 39.980 € |
| Sponsorizzazioni e white-label | 3.000 € | 16.000 € | 52.500 € |
| Pubblicità e affiliazioni | 1.000 € | 8.000 € | 30.000 € |
| **Ricavi complessivi** | **10.247 €** | **50.984 €** | **182.440 €** |

Costo medio dell'8% sui ricavi ipotizzato per commissioni di pagamento/store/rimborsi.

### Costi operativi ipotizzati

| Costo | Anno 1 | Anno 2 | Anno 3 |
| --- | ---: | ---: | ---: |
| Hosting, database, monitoraggio | 600 € | 3.000 € | 12.000 € |
| API calcistiche | 250 €† | 400 € | 600 € |
| Marketing | 2.500 € | 12.000 € | 40.000 € |
| Assistenza e sviluppo | — | 6.000 € | 35.000 € |
| Amministrazione e consulenza | 1.500 € | 3.000 € | 6.000 € |
| Store, domini e strumenti | 600 € | 1.550 € | 4.900 € |
| **Costi complessivi** | **5.450 €** | **25.950 €** | **98.500 €** |

† *Il costo effettivo dipende da quante squadre distinte sono seguite da almeno una lega, non dal numero di leghe. 250 € è una stima prudente per un numero moderato di squadre distinte — da monitorare man mano che cresce l'adozione multi-squadra.*

### Margine operativo indicativo

| Risultato | Anno 1 | Anno 2 | Anno 3 |
| --- | ---: | ---: | ---: |
| Ricavi dopo commissioni (-8%) | 9.427 € | 46.905 € | 167.845 € |
| Costi operativi | 5.450 € | 25.950 € | 98.500 € |
| **Margine prima di imposte e compensi dei fondatori** | **3.977 €** | **20.955 €** | **69.345 €** |

Il primo anno serve soprattutto a dimostrare che gli utenti tornano. Il risultato economico rilevante arriva dal secondo anno, quando sponsorizzazioni e versioni personalizzate diventano vendibili su scala.

### Sensitività — le variabili che spostano di più il risultato

1. **Conversione a Supporter.** 150 abbonati su 1.500 MAU è un 10%: alto per un'app freemium consumer (benchmark tipico 2-5%). Con conversione al 5%, i ricavi Supporter dell'Anno 1 si dimezzano e il margine Anno 1 scende di conseguenza.
2. **Capacità di raggiungere tifoserie diverse dall'Inter.** Se nell'Anno 1 si riescono a coinvolgere attivamente solo 1-2 tifoserie diverse da quella storica, gran parte della crescita resta concentrata sul gruppo Inter originale, e i benefici del multi-squadra restano soprattutto teorici — la spinta reale arriverebbe solo Anno 2-3.
3. **Diffusione su molte squadre distinte** spinge il costo API oltre la stima prudente di 250 € prima del previsto. Segnale da monitorare: quante squadre distinte sono effettivamente seguite, non quante leghe esistono.

---

## 11. Punto di pareggio

Un abbonamento Supporter da 14,99 €, dopo commissione Stripe standard ipotizzata, produce circa **14,52 €** netti.

Con **5.450 €** di costi operativi Anno 1, il pareggio richiede circa una di queste combinazioni:

* **~376 abbonati Supporter**, oppure
* **~280 Leghe Pro**, oppure
* un mix più realistico: **~150 Supporter + ~170 Leghe Pro**, oppure
* **2 sponsorizzazioni stagionali da 2.000-2.500 € l'una**.

La via Lega Pro è oggi la più direttamente attuabile, dato che non ci sono dipendenze tecniche da attendere — resta comunque lavoro di vendita attiva (§14).

---

## 12. Aspetti legali da trattare con attenzione

### Premi e denaro

Non introdurre quote obbligatorie di partecipazione, montepremi finanziati dai giocatori, premi in denaro o meccanismi simili alle scommesse.

**Due regimi distinti da non confondere:**

* **Concorsi a premio (disciplina MIMIT):** si applica quando è la piattaforma/uno sponsor a mettere in palio un premio promozionale. Richiede eventualmente regolamento, adempimenti Prema on-line, in casi complessi cauzione e intervento di notaio/Camera di Commercio. Niente premi in denaro in questo regime.
* **Gioco d'azzardo/scommessa (disciplina ADM):** rischio distinto e più serio, che scatta quando c'è una **puntata di denaro dei giocatori** il cui esito dipende dal pronostico. "Niente denaro dai giocatori, niente quote di ingresso" è la linea che tiene il prodotto fuori dal perimetro ADM. Se una lega vuole organizzare autonomamente una posta simbolica tra amici, va reso esplicito che **non è la piattaforma a gestire, trattenere o distribuire quel denaro**.

La soluzione più semplice: classifica senza premio economico, coppe/badge virtuali, coupon aperti a tutti, eventuali premi sponsorizzati solo dopo verifica legale specifica.

### Privacy, GDPR e termini di servizio

Con più leghe reali attive su tifoserie diverse, non un solo gruppo storico, servono:

* Privacy policy conforme GDPR (base giuridica del trattamento, conservazione, diritti dell'interessato);
* Termini di servizio, in particolare per le pagine pubbliche di lega (§5) che espongono dati a utenti non autenticati;
* Policy minima di moderazione per nomi/avatar inappropriati.

### Struttura societaria e fisco

Prima di incassare pagamenti ricorrenti in modo continuativo su più leghe/tifoserie va chiarito con un commercialista:

* soglia oltre la quale serve aprire una P.IVA;
* trattamento IVA delle vendite di abbonamenti digitali B2C (regole e-commerce/OSS se gli acquirenti sono in altri paesi UE);
* regole di trasparenza sul rinnovo automatico degli abbonamenti (normativa consumatori UE/Italia).

### Marchio "Il Giochino"

Verificare che **"Il Giochino" sia effettivamente registrabile/protetto** come marchio proprio (nome piuttosto generico), oltre a evitare di usare marchi/loghi ufficiali delle squadre (nome/grafica originali, icone generiche, disclaimer di non affiliazione, nessuno stemma ufficiale) — rilevante ora per **20 squadre diverse**, non solo per l'Inter.

---

## 13. Principali rischi

* **Gli utenti giocano solo una volta.** Notifiche, serie positive, rivalità dirette, riepilogo settimanale.
* **Nessuno vuole pagare.** Far pagare l'organizzatore, non tutti i partecipanti.
* **Il gioco resta limitato al calcio di club italiano.** Mitigato per la Serie A (qualunque squadra, non solo l'Inter); resta vero per Champions League, Nazionale, competizioni internazionali (§6).
* **Frammentazione tra tante leghe piccole mono-squadra.** Con tante leghe isolate su squadre diverse, il prodotto rischia di diventare tante isole scollegate invece di una community con effetto rete. Vale la pena pensare, senza urgenza, a un minimo layer cross-lega (confronti tra organizzatori, eventi cross-team).
* **La pubblicità infastidisce gli utenti.** Sponsor contestuali, pochi spazi ben integrati.
* **Costi API o problemi sui dati**, più probabili se l'adozione si diffonde su molte squadre distinte (§10). Caching, sincronizzazioni schedulate, salvataggio locale, correzione amministrativa.
* **Questioni legali sui premi.** Niente denaro/quote di ingresso, verifica professionale prima di premi materiali (§12).
* **Rischio "founder unico".** Sviluppo, vendita Lega Pro/sponsorizzazioni, supporto e amministrazione ricadono su una persona sola: è questo, più della tecnologia, a determinare la velocità di crescita realistica (§14).
* **Stagionalità.** I ricavi seguono il calendario calcistico; l'estate resta strutturalmente debole.
* **Dipendenza da policy di piattaforma per la PWA.** Le notifiche push web su iOS sono relativamente recenti e Apple potrebbe cambiarne le condizioni.

---

## 14. Team ed esecuzione

Il fattore che oggi determina la velocità di crescita più di ogni altro: vendere Lega Pro, chiudere sponsorizzazioni verticali, contattare fan page di altre tifoserie, costruire Supporter — è lavoro di esecuzione, non di ingegneria. Prima di impegnarsi sulle tempistiche di §8/§10 va scritto, anche in poche righe:

* chi sviluppa (Supporter, white-label) e quante ore/settimana sono realisticamente disponibili oltre ad altri impegni;
* chi fa la vendita di Lega Pro/sponsorizzazioni (competenza distinta da quella di sviluppo prodotto) e chi contatta fan page/community di altre tifoserie;
* a che punto (quale fatturato/complessità) diventa necessario coinvolgere una seconda persona o esternalizzare un pezzo (assistenza clienti, contabilità, vendite);
* cosa succede al servizio se il founder è indisponibile per un periodo.

---

## 15. Priorità operative

1. Estrarre le metriche di retention/engagement reali dai 3 storici già presenti.
2. **Il Giochino Supporter** — l'unica cosa "di prodotto" ancora da costruire senza altre dipendenze.
3. **Vendita attiva di Lega Pro** a nuovi gruppi/tifoserie — azione commerciale, non sviluppo (§14).
4. Pannello sponsor, per abilitare le sponsorizzazioni verticali per tifoseria (§5).
5. Analytics su utenti/leghe/inviti.
6. Pagina condivisibile della classifica (con le attenzioni privacy di §12 già considerate in fase di design).
7. **White-label** — isolamento multi-tenant oltre il motore lega/squadra esistente.
8. **Champions League / Nazionale** — nuovo modello di competizione da progettare.
9. Pubblicazione sugli store.

---

## Valutazione finale

Il Giochino difficilmente diventerà redditizio affidandosi solo alla pubblicità. Diventa un'attività sostenibile attraverso tre prodotti — **Supporter (14,99 €/anno)**, **Lega Pro (19,99 €/stagione)**, **tornei sponsorizzati e white-label (1.000–6.000 €)** — con due condizioni chiave:

1. **Le metriche di Fase 1 non vanno stimate: ci sono già 3 stagioni di dati reali per calcolarle.** È il modo più veloce, a costo quasi zero, di rendere l'intero piano più credibile — sia per uso interno sia per un eventuale interlocutore esterno (sponsor, socio, banca).
2. **La velocità di crescita è oggi decisa dalla capacità commerciale di raggiungere e convertire nuove tifoserie, non dalla tecnologia.** Quante ore/settimana, quali competenze di vendita, quale disponibilità a fare telefonate e incontri (§14) — questo, non il prodotto, fissa il ritmo.

Il primo obiettivo resta dimostrare che 500-1.000 persone giocano regolarmente per un'intera stagione. Una volta verificata la retention — con dati reali, non stime — il prodotto si vende non solo ai tifosi ma a bar, community, fan club, creator e aziende, su qualunque squadra di Serie A.
