Stai lavorando a una nuova repository privata per una web app personale chiamata `Motorlog`.

L'app deve riutilizzare la stessa filosofia ingegneristica già definita nel repository in /root/Mealbook:
- repo semplice
- niente over-engineering
- mobile-first
- Firebase Auth + Firestore + Hosting
- React + TypeScript + Vite + Tailwind
- workflow preview-first
- deploy live solo da `main`

Leggi e segui `AGENTS.md` come fonte di verità per:
- vincoli di prodotto
- stack tecnico
- struttura del progetto
- workflow di sviluppo
- linguaggio visivo
- UI e comportamento mobile

## Obiettivo del prodotto
`Motorlog` è un tracker personale e leggero per i costi dei veicoli.
L'utente possiede uno o più veicoli e vuole registrare:
- veicoli
- rifornimenti
- spese generiche

L'app è single-user o al più con qualche utente, ed è limitata per un primo momento a un solo account Google autorizzato.

## Funzionalità principali
L'app deve avere queste sezioni principali:
- `Riepilogo`
- `Veicoli`
- `Rifornimenti`
- `Spese`

Deve inoltre avere un pulsante flottante `+` in basso a destra che, quando premuto, effettua blur dello sfondo e si espande in:
- `Veicolo`
- `Rifornimento`
- `Spesa`

## Requisiti di dominio
### Veicoli
Supporta solo:
- auto
- moto

Campi:
- marca
- modello
- nickname (opzionale)
- targa
- anno (opzionale)
- colore (opzionale)
- capacità serbatoio in litri
- tipo di carburante / motorizzazione
- logo opzionale in una fase successiva, senza anticipare ora una soluzione pesante

### Rifornimenti
Campi:
- veicolo collegato
- litri
- costo totale
- costo al litro
- km del contachilometri
- data
- toggle pieno / non pieno
- stazione di servizio opzionale
- note opzionali

### Spese
Campi:
- veicolo collegato
- categoria
- importo
- data
- note opzionali

Categorie iniziali consigliate:
- rata
- assicurazione
- bollo
- revisione
- tagliando
- meccanico
- pedaggio
- multa
- accessori
- altro

## Regole dati
Usa collections Firestore sotto:
- `users/{uid}/vehicles/{vehicleId}`
- `users/{uid}/refuels/{refuelId}`
- `users/{uid}/expenses/{expenseId}`

Ogni rifornimento e ogni spesa devono essere collegati a un veicolo tramite `vehicle_id`.

## Regola importante di prodotto
Non provare a costruire tutta l'app in un colpo solo.

Implementa per fasi.
Alla fine di ogni fase:
- esegui i controlli locali
- pubblica in preview così posso testare le funzionalità
- mantieni il diff leggibile

## Fase da implementare adesso
Implementa solo la base del progetto e il primo slice davvero utile. Guidami su Firebase se devo fare qualcosa io, altrimenti usa la tua CLI, se devo loggarmi fammelo presente.

### Fase 0
- scaffold progetto e creazione progetto su Firebase
- wiring Firebase tramite env vars
- login Google
- auth guard single-user
- Firestore rules
- shell con bottom navigation
- placeholder vuoti per le sezioni principali
- script di preview deploy
- GitHub Actions per preview PR e deploy live
- `.env.local.example`

### Fase 1
- tipi dominio per i veicoli
- create/edit/delete veicoli
- schermata lista veicoli
- card veicolo compatte
- modal per aggiunta e modifica veicolo

Non implementare ancora rifornimenti o spese, salvo eventuali placeholder minimi se servono alla shell.

## Struttura repository consigliata
Preferisci una struttura piccola come questa:
- `src/App.tsx`
- `src/components/AuthScreen.tsx`
- `src/components/AddEntryModal.tsx`
- `src/sections/OverviewSection.tsx`
- `src/sections/VehiclesSection.tsx`
- `src/sections/RefuelsSection.tsx`
- `src/sections/ExpensesSection.tsx`
- `src/lib/firebase.ts`
- `src/lib/data.ts`
- `src/types/domain.ts`
- `src/index.css`
- `.github/workflows/firebase-deploy.yml`

## Quality bar
- nessun backend extra
- nessuna state library
- nessuna esplosione di cartelle
- nessuna astrazione generica per feature future immaginarie
- niente deriva grafica rispetto alle regole definite in `AGENTS.md`
- modali e header sicuri su mobile
- preview prima del merge

## Deliverable richiesti per questa fase
Quando hai finito, fornisci:
- breve riassunto del lavoro implementato
- file modificati
- verifiche locali eseguite
- URL preview
- eventuali elementi rimandati intenzionalmente