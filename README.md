# Portale Offerte XML

Tool web locale per compilare i dati del tracciato offerte retail, generare l'XML e scaricare il relativo archivio ZIP con la nomenclatura richiesta.

## File principali
- `index.html`: interfaccia principale del tool
- `xml_form_builder.html`: pagina di compatibilita che reindirizza all'entrypoint principale
- `xml_form_builder.css`: stile dell'applicazione
- `xml_form_builder.js`: logica di compilazione, validazione e generazione XML/ZIP
- `api/`: endpoint Vercel per Stripe e Supabase
- `payment-success.html`: landing page di conferma pagamento
- `supabase_schema.sql`: schema iniziale per il tracciamento pay-per-use

## Utilizzo
1. Apri `index.html` in un browser.
2. Compila oppure importa un XML esistente.
3. Genera l'XML.
4. Scarica lo ZIP finale con il nome conforme alle regole configurate.

## Setup paywall Stripe + Supabase
1. Crea la tabella Supabase eseguendo `supabase_schema.sql`.
2. Configura in Vercel le variabili di ambiente presenti in `.env.example`.
3. Crea in Stripe un prezzo una tantum e usa il relativo `STRIPE_PRICE_ID`.
4. Configura il webhook Stripe verso `/api/stripe-webhook`.
5. Dopo il pagamento, l'utente viene reindirizzato a `payment-success.html` e sblocca un solo download ZIP.

## Note
Il repository contiene solo il software del tool. I PDF, gli ZIP di supporto e gli output generati localmente restano esclusi dal versionamento.
