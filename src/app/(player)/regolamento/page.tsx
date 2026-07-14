import { Timeline, TimelineItem } from "@/components/timeline";

export default function RegolamentoPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-8 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Regolamento</h1>
        <p className="mt-1 text-zinc-500">
          Come funzionano pronostici, punteggio e classifica.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Come si gioca</h2>
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
        <h2 className="font-medium text-heading">Primo marcatore: solo l&apos;Inter</h2>
        <p>
          Non conta il primo gol assoluto della partita, ma solo <strong>chi apre le
          marcature per l&apos;Inter</strong>: un giocatore dell&apos;Inter, oppure un
          autogol dell&apos;avversario a favore dell&apos;Inter. Se l&apos;Inter non segna
          in quella partita, la risposta corretta è &quot;Nessun marcatore&quot; — anche
          se l&apos;avversario ha segnato prima.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Punteggio base: 1 punto diviso tra chi indovina</h2>
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
        <h2 className="font-medium text-heading">Bonus combo: indovinare entrambi</h2>
        <p>
          Se indovini <strong>sia il risultato sia il marcatore</strong> nella stessa
          partita, prendi un bonus del <strong>+50%</strong> sul totale dei due punti di
          quella partita.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Bonus streak: indovinare di fila</h2>
        <p>
          Risultato e marcatore hanno ciascuno una propria &quot;striscia&quot;: quante
          partite di fila hai indovinato <em>quel singolo componente</em>. Le soglie non
          si sommano tra loro (non è 30+60+100), si applica solo quella più alta
          raggiunta:
        </p>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <Timeline>
            <TimelineItem title="2 di fila" trailing={<span className="font-semibold text-heading">+30%</span>} />
            <TimelineItem title="3 di fila" trailing={<span className="font-semibold text-heading">+60%</span>} />
            <TimelineItem
              title="4 o più di fila"
              trailing={<span className="font-semibold text-heading">+100%</span>}
              tone="success"
              last
            />
          </Timeline>
        </div>
        <p>
          Il bonus si applica al totale dei due punti base di quella partita, sommando
          la percentuale dello streak risultato e quella dello streak marcatore. Uno
          sbaglio (o un pronostico mancante) azzera subito la striscia di quel
          componente.
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-surface shadow-card p-4">
        <h2 className="font-medium text-heading">Esempio</h2>
        <p>
          Siete in 4 a pronosticare quella partita. Indovini sia il risultato (in 2 su
          4 a indovinarlo) sia il marcatore (l&apos;unico a indovinarlo). È la tua 3ª
          partita di fila con il risultato giusto, mentre sul marcatore avevi sbagliato
          la partita precedente — quindi questa è la 1ª partita della tua nuova
          striscia sul marcatore, non ancora sufficiente per un bonus (che parte da 2
          di fila):
        </p>
        <ul className="ml-4 list-disc">
          <li>Risultato: 1 punto diviso tra i 2 che lo indovinano = 0.5 pt</li>
          <li>Marcatore: 1 punto diviso tra l&apos;unico che lo indovina = 1 pt</li>
          <li>Base B = 0.5 + 1 = 1.5 pt</li>
          <li>Bonus combo, hai indovinato entrambi (+50% su B) = 0.75 pt</li>
          <li>Bonus streak risultato, 3 di fila (+60% su B) = 0.9 pt</li>
          <li>Bonus streak marcatore, 1 di fila: 0% (nessun bonus sotto le 2 di fila)</li>
          <li>
            <strong>Totale: 1.5 + 0.75 + 0.9 = 3.15 pt</strong>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Riservatezza dei pronostici</h2>
        <p>
          Il tuo pronostico è <strong>visibile solo a te</strong> fino al deadline (5
          minuti prima del calcio d&apos;inizio). Dopo il deadline, i pronostici di
          tutti per quella partita diventano visibili insieme, uno accanto all&apos;altro.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Quando compaiono le partite</h2>
        <p>
          Le partite dell&apos;Inter entrano di solito in calendario in automatico
          qualche giorno prima del calcio d&apos;inizio. Se una partita che sai essere
          in programma non compare ancora, è solo perché è troppo lontana nel tempo:
          verrà aggiunta comunque in tempo utile per pronosticare.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Partite rinviate o recuperate</h2>
        <p>
          Se una partita viene rinviata, conta semplicemente il risultato alla nuova
          data di recupero: i pronostici già fatti restano validi, cambia solo
          l&apos;orario del deadline.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium text-heading">Correzioni</h2>
        <p>
          Se un risultato viene corretto (anche di una partita passata), classifica e
          streak si ricalcolano automaticamente da quella partita in poi, per tutta la
          stagione.
        </p>
      </section>
    </div>
  );
}
