# MOKA – Automatisierung Website → Make → Odoo

Logik und Daten liegen in **Odoo**; **Make** nimmt nur Anfragen entgegen und leitet sie weiter.
Das System läuft ohne Claude.

## Ablauf

```
Website-Formular ──POST (JSON als text/plain)──▶ Make „MOKA – Neue Anfrage“
   └─▶ Odoo-Serveraktion „MOKA: Neue Anfrage“ (id 662)
         ├─ Kontakt suchen/anlegen (Sprache Deutsch)
         ├─ Verkaufschance anlegen: Felder x_moka_*, Anfrage-Nr. A-00000, Anhänge
         ├─ interne Preisschätzung (Koeffizienten: Systemparameter moka.pricing)
         ├─ E-Mail an Kunden (Vorlage „MOKA: Anfrage erhalten“, im Chatter sichtbar)
         └─ E-Mail an Empfänger aus moka.notify_emails mit 3 Buttons
               [Angebot erstellen] [Besichtigung] [Ablehnen]
                    │ Link öffnet Bestätigungsseite (Schutz vor Link-Scannern)
                    ▼
Make „MOKA – Entscheidung“ ─▶ Odoo-Serveraktion „MOKA: Entscheidung“ (id 663)
   ├─ Angebot     → Phase „In Bearbeitung“ + Aufgabe „Angebot erstellen“
   ├─ Besichtigung → Phase „Besichtigung“ + Aufgabe + E-Mail „MOKA: Besichtigung“
   └─ Ablehnen    → Verloren mit Grund + E-Mail „MOKA: Absage“ (Text je nach Grund)

Odoo-Automatisierungsregeln (Verkauf):
   Angebot gesendet  → Chance „Angebot gesendet“, Datum x_moka_sent_on
   Angebot bestätigt/unterschrieben → Chance „Gewonnen“ (+ Projekt & Aufgaben durch das Produkt)
   4 Tage nach Versand, noch nicht angenommen → E-Mail „MOKA: Angebotserinnerung“
```

## Wo ändere ich was?

| Was | Wo |
|---|---|
| Empfänger der neuen Anfragen (mehrere mit Komma) | Odoo → Einstellungen → Technisch → Systemparameter → `moka.notify_emails` |
| Preise der Schätzung | Systemparameter `moka.pricing` (JSON) |
| Texte der Kunden-E-Mails | Odoo → Einstellungen → Technisch → E-Mail-Vorlagen → „MOKA: …“ |
| Ablauf/Logik | Serveraktionen „MOKA: …“ bzw. Dateien in `automation/odoo/` und `python3 automation/odoo/setup.py` |

`setup.py` ist wiederholbar (idempotent) und überschreibt `moka.pricing` nie.

## Make

| | ID | Webhook-URL |
|---|---|---|
| Szenario „MOKA – Neue Anfrage“ | 8623101 | `https://hook.eu1.make.com/8hl0vmgwqtdacmgqathaj58i9jbfk3sg` |
| Szenario „MOKA – Entscheidung“ | 8623108 | `https://hook.eu1.make.com/s3ovwhrj6qj82sv5ebitn9isthsqywco` |
| Odoo-Verbindung | 13119969 | API-Schlüssel vom Typ **RPC** |
| Datenstruktur „MOKA – Entscheidung (Odoo kwargs)“ | 706000 | |

Blueprints: `automation/make/*.blueprint.json`. Bei Fehlern sendet Make eine E-Mail an das Make-Konto;
der Website-Aufruf bekommt dann `{"ok": false}` (HTTP 502).

## Website-Schnittstelle

`POST https://hook.eu1.make.com/8hl0vmgwqtdacmgqathaj58i9jbfk3sg` mit `Content-Type: text/plain`
(vermeidet CORS-Preflight) und JSON-Body:

```json
{"service":"clear","objectScope":"unit","objectType":"wohnung","cleanScope":"","buildScope":"","serviceType":"onetime",
 "units":"1","area":"","floor":"3","elevator":"no","distance":"",
 "clearMode":"dispose","clearAreas":"living,keller","livingArea":"60","livingFill":"full","rooms":"2",
 "kellerArea":"8","kellerFill":"normal","atticArea":"","atticFill":"","garageArea":"","garageFill":"",
 "officeArea":"","officeFill":"","disposeShare":"","newAddress":"","newFloor":"","newElevator":"","clearExtras":"heavy",
 "buildDeadline":"","renoWorks":"","renoArea":"","renoRooms":"","wallCondition":"","floorArea":"","doors":"",
 "fiberUnits":"","fiberStoreys":"","fiberEntrances":"","fiberConnection":"","fiberDucts":"",
 "mgmtTypes":"","mgmtFlats":"","mgmtCommercial":"","mgmtParking":"","mgmtStart":"","mgmtSwitch":"",
 "stairwells":"","storeys":"","stairFrequency":"","bins":"","sidewalk":"","gardenArea":"",
 "interiorArea":"","interiorFrequency":"","windows":"","glassArea":"","windowFrequency":"",
 "name":"…","company":"","address":"…","email":"…","phone":"","notes":"…",
 "website":"",            // Honeypot, muss leer bleiben
 "files":[{"name":"foto.jpg","type":"image/jpeg","data":"<base64>"}]}
```

`objectType`: mfh, efh, gewerbeobjekt (objectScope building) oder wohnung, gewerbe (objectScope unit).
Die Clean-Felder werden nur zur gewählten Leistung gesendet und in Odoo als JSON in `x_moka_clean_input` gespeichert,
die Clear-Felder in `x_moka_clear_input`, die Build-Felder in `x_moka_build_input`, die Verwaltungs-Felder in `x_moka_mgmt_input` (`distance` = km zwischen alter und neuer Adresse beim Umzug).

Antwort: `{"ok": true, "ref": "A-00012"}`. Make-Webhooks nehmen höchstens ca. 5 MB pro Anfrage an;
`src/lib/quote-submit.ts` verkleinert Fotos deshalb im Browser (max. 1600 px, JPEG) und begrenzt die Anhänge auf 3,4 MB.

## Website-Chat (Odoo Live Chat)

- Kanal „MOKA Website“ (Live Chat, id 1) mit dem regelbasierten Chatbot „MOKA Assistent“ (keine KI, keine Preise).
- Einrichtung und Änderungen der Texte: `odoo/livechat_setup.py` (idempotent, baut die Chatbot-Schritte neu auf).
- Pfade: „Angebot anfragen“ zeigt den Link zum Anfrageformular (`/#kontakt`); „Frage zu unseren Leistungen“ zeigt
  die Bereiche; „Rückruf vereinbaren“ und „Sonstiges“ fragen Anliegen, E-Mail (bei Rückruf auch Telefon) ab und
  legen einen Lead im Team „Sales“ an.
- Navigation: nach jeder Bereichsinfo „Frage stellen“, „Anderen Bereich ansehen“ (bis zu 3-mal hintereinander) und
  „Zurück zum Hauptmenü“. Letzteres öffnet `/?chat=neu`; die Website vergisst dann den alten Chat und startet neu.
- Auf der Website: gibt es schon einen Chat, bietet die Karte „Chat fortsetzen“ und „Neuen Chat starten“.
- Die Website lädt den Chat erst nach Klick auf „Chat starten“ (`src/components/chat-launcher.tsx`, Zwei-Klick-Lösung,
  siehe Datenschutzerklärung Abschnitt 6).
- Odoo-Besonderheit: Ein Schritt erscheint nur, wenn für jede Frage, zu der seine Auslöser gehören, eine passende Antwort
  gewählt wurde. Die Auslöser eines Schritts müssen deshalb alle aus derselben Frage stammen.
