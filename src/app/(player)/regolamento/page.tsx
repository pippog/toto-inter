export default function RegolamentoPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-inter-navy">Regolamento</h1>
        <p className="mt-1 text-zinc-500">
          Come funzionano pronostici, punteggio e classifica.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Come si gioca</h2>
        <p>
          Prima di ogni partita dell&apos;Inter (tutte le competizioni: Serie A, Coppa
          Italia, Champions/Europa League, amichevoli), pronostica il <strong>risultato
          esatto</strong> e il <strong>primo marcatore dell&apos;Inter</strong> in quella
          partita. Puoi modificare il pronostico finché vuoi, ma tutto si blocca
          <strong> 5 minuti prima del calcio d&apos;inizio</strong>: da quel momento non è
          più possibile né inviare né modificare nulla.
        </p>
        <p>
          Il risultato conta sempre <strong>ai 90 minuti</strong>: tempi supplementari e
          rigori non modificano il punteggio, anche nelle partite a eliminazione diretta.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Primo marcatore: solo l&apos;Inter</h2>
        <p>
          Non conta il primo gol assoluto della partita, ma solo <strong>chi apre le
          marcature per l&apos;Inter</strong>: un giocatore dell&apos;Inter, oppure un
          autogol dell&apos;avversario a favore dell&apos;Inter. Se l&apos;Inter non segna
          in quella partita, la risposta corretta è &quot;Nessun marcatore&quot; — anche
          se l&apos;avversario ha segnato prima.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Punteggio base: 1 punto diviso tra chi indovina</h2>
        <p>
          Per ogni partita c&apos;è <strong>1 punto per il risultato esatto</strong> e{" "}
          <strong>1 punto per il primo marcatore</strong>, e ognuno dei due punti si
          divide tra tutti quelli che indovinano quel componente. Se in 3 indovinano il
          risultato, ciascuno prende 1/3 di punto; se nessuno indovina, quel punto non
          va a nessuno.
        </p>
        <p>
          Un pronostico mancante conta sempre come sbagliato su entrambi i componenti.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Bonus combo: indovinare entrambi</h2>
        <p>
          Se indovini <strong>sia il risultato sia il marcatore</strong> nella stessa
          partita, prendi un bonus del <strong>+50%</strong> sul totale dei due punti di
          quella partita.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Bonus streak: indovinare di fila</h2>
        <p>
          Risultato e marcatore hanno ciascuno una propria &quot;striscia&quot;: quante
          partite di fila hai indovinato <em>quel singolo componente</em>. Le soglie non
          si sommano tra loro (non è 30+60+100), si applica solo quella più alta
          raggiunta:
        </p>
        <ul className="ml-4 list-disc">
          <li>2 di fila → +30%</li>
          <li>3 di fila → +60%</li>
          <li>4 o più di fila → +100%</li>
        </ul>
        <p>
          Il bonus si applica al totale dei due punti base di quella partita, sommando
          la percentuale dello streak risultato e quella dello streak marcatore. Uno
          sbaglio (o un pronostico mancante) azzera subito la striscia di quel
          componente.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-black/10 p-4">
        <h2 className="font-medium text-inter-navy">Esempio</h2>
        <p>
          Siete in 4 a pronosticare. Indovini sia il risultato (in 2 su 4) sia il
          marcatore (unico a indovinarlo), e sei alla tua 3ª partita di fila indovinata
          sul risultato (streak marcatore azzerato la partita precedente):
        </p>
        <ul className="ml-4 list-disc">
          <li>Risultato: 1/2 = 0.5 pt</li>
          <li>Marcatore: 1/1 = 1 pt</li>
          <li>Base B = 0.5 + 1 = 1.5 pt</li>
          <li>Bonus combo (+50% su B) = 0.75 pt</li>
          <li>Bonus streak risultato (3 di fila, +60% su B) = 0.9 pt — streak marcatore a 0%</li>
          <li>
            <strong>Totale: 1.5 + 0.75 + 0.9 = 3.15 pt</strong>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Riservatezza dei pronostici</h2>
        <p>
          Il tuo pronostico è <strong>visibile solo a te</strong> fino al deadline (5
          minuti prima del calcio d&apos;inizio) — vale anche per l&apos;admin, che non
          può vedere i pronostici altrui in anticipo. Dopo il deadline, i pronostici di
          tutti per quella partita diventano visibili insieme.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Partite rinviate o recuperate</h2>
        <p>
          Se una partita viene rinviata, conta semplicemente il risultato alla nuova
          data di recupero: i pronostici già fatti restano validi, cambia solo
          l&apos;orario del deadline.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-inter-navy">Correzioni</h2>
        <p>
          Se un risultato viene corretto (anche di una partita passata), classifica e
          streak si ricalcolano automaticamente da quella partita in poi, per tutta la
          stagione.
        </p>
      </section>
    </div>
  );
}
