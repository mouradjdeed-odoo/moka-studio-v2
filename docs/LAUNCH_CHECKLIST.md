# Checkliste bis zum Livegang

Stand: 17.11.2026. ✅ erledigt · ⏳ offen · 🔴 Pflicht vor dem Livegang

## A. Rechtliches (Pflicht)
- ✅ Impressum-Seite `/impressum` (24.11.2026): MoKa Service UG (haftungsbeschränkt), Amtsgericht Charlottenburg HRB 286570 B, Geschäftsführer Kamel Fehmi Allam. ⏳ USt-IdNr. ergänzen, sobald vorhanden.
- ✅ Datenschutzerklärung `/datenschutz` veröffentlicht (Text aus `docs/legal/Datenschutz.md`). 🔴 Sie nennt AV-Verträge mit IONOS, Make und Odoo als abgeschlossen: vor dem Livegang tatsächlich abschließen.
- 🔴 AV-Verträge (Auftragsverarbeitung) mit IONOS, Make und Odoo abschließen; Odoo-Rechenzentrum (EU) prüfen.
- 🔴 AGB und Rahmenvertrag (`docs/legal/`) anwaltlich prüfen; danach `moka.contract_active = 1` in Odoo.
- ✅ Firmenname „MoKa Service UG (haftungsbeschränkt)“ und HRB in E-Mail-Fußzeile, AGB, Rahmenvertrag, Datenschutz und Odoo (24.11.2026). 🔴 Noch offen: Pflichtangaben in geschäftlichen E-Mails und auf Angeboten/Rechnungen (Registergericht, HRB, Geschäftsführer, USt-IdNr., Bankverbindung).
- 🔴 Google Fonts lokal einbinden statt von Google laden.
- ⏳ Cookie-Banner nur nötig, falls Analytics/Tracking ergänzt wird.

## B. Inhalte
- 🔴 Website-Leistungen und Formularoptionen an `docs/SERVICES.md` anpassen.
- 🔴 Preise für Build, Verwaltung und Gartenpflege in Odoo festlegen; Preisformel vom Inhaber bestätigen lassen.
- ⏳ Fehlende Videos (`/videos/*.mp4`) ergänzen oder entfernen.
- ⏳ Vorschaubild für Social Media (og:image), deutsche 404-Seite.
- ⏳ Echte Fotos (Team, Fahrzeuge, Vorher/Nachher) statt Stockbilder.

## C. Sicherheit und Betrieb
- 🔴 Spam-Schutz für das Formular (Cloudflare Turnstile o. ä.), sonst kann jeder über unser Formular E-Mails an fremde Adressen auslösen.
- 🔴 API-Schlüssel für die Einrichtung löschen (IONOS-DNS-Schlüssel, Odoo-Schlüssel „Claude Setup“), sobald nicht mehr gebraucht.
- ⏳ Make-Fehlermeldungen zusätzlich an leitung@ senden.
- ⏳ Zweiter Odoo-Benutzer für die Leitung (Angebote prüfen/senden geht nur mit Odoo-Login).

## D. Sichtbarkeit
- ⏳ Google-Unternehmensprofil (Maps + Bewertungen), Google Search Console, sitemap.xml, strukturierte Daten (LocalBusiness).
- ⏳ WhatsApp Business und Social-Media-Profile; Links in `src/lib/site.ts` eintragen.
- ⏳ Bewertungsanfrage automatisch nach Projektabschluss.

## E. Livegang
1. Alle 🔴-Punkte erledigt und ein kompletter Testdurchlauf (Anfrage → Angebot → Unterschrift → Projekt) bestanden.
2. GitHub: Secret `SITE_PASSWORD` löschen, Variable `SITE_PUBLIC = true` anlegen, Workflow „Deploy to IONOS“ erneut ausführen.
3. Testdaten in Odoo löschen.
