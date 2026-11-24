# Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO)

> **Internes Dokument, nicht veröffentlichen. ENTWURF, Stand 17.11.2026. Bei Änderungen der Abläufe aktualisieren.**

**Verantwortlicher:** MoKa Service UG (haftungsbeschränkt), Lietzenburger Straße 29, 10789 Berlin (Amtsgericht Charlottenburg, HRB 286570 B)
**Vertreten durch:** Kamel Fehmi Allam (Geschäftsführer) · **Datenschutz-Kontakt:** info@moka-objektservice.de
**Datenschutzbeauftragter:** nicht bestellt (weniger als 20 Personen mit ständiger Datenverarbeitung, § 38 BDSG)

## 1. Anfragen und Angebote
| | |
|---|---|
| Zweck | Bearbeitung von Angebotsanfragen über die Website, Kalkulation, Angebotserstellung |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO |
| Betroffene | Interessenten (Privatpersonen, Hausverwaltungen, Unternehmen) |
| Daten | Name, Firma, E-Mail, Telefon, Objekt- und Rechnungsadresse, Objektangaben, Nachricht, Fotos/PDF |
| Empfänger (Auftragsverarbeiter) | IONOS SE (Hosting, E-Mail, DE) · Make/Celonis (Weiterleitung, EU-Region eu1; Inhalte nicht gespeichert) · Odoo S.A. (CRM, BE/EU; Backups EU + Kanada) |
| Drittlandtransfer | Kanada (Angemessenheitsbeschluss); US-Unterauftragnehmer von Make/Odoo über EU-US Data Privacy Framework bzw. Standardvertragsklauseln |
| Löschfrist | Abgelehnte Anfragen ohne Angebot: automatisch nach 180 Tagen (Odoo-Job „MOKA: Datenschutz – abgelehnte Anfragen löschen“) |
| TOM | TLS-Verschlüsselung, Zugriff nur für berechtigte Mitarbeiter, Zwei-Faktor-Anmeldung empfohlen, TOM der Dienstleister laut AV-Vertrag |

## 2. Kunden, Aufträge und Abrechnung
| | |
|---|---|
| Zweck | Vertragsdurchführung, elektronische Unterschrift, Projekte/Aufgaben, Rechnungen, Mahnungen |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b und lit. c DSGVO (steuer- und handelsrechtliche Pflichten) |
| Betroffene | Kunden, Ansprechpartner von Kunden |
| Daten | Stammdaten, Vertrags- und Leistungsdaten, Unterschrift mit Zeit und IP, Rechnungs- und Zahlungsdaten |
| Empfänger | Odoo S.A., IONOS SE (E-Mail); künftig Steuerberater |
| Löschfrist | 6 bzw. 10 Jahre nach Ende des Kalenderjahres (§ 257 HGB, § 147 AO) |

## 3. Website-Betrieb
| | |
|---|---|
| Zweck | Bereitstellung und Sicherheit der Website |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. f DSGVO |
| Daten | IP-Adresse, Zeitpunkt, aufgerufene Seiten, Browserdaten (Server-Logs) |
| Empfänger | IONOS SE (DE) |
| Löschfrist | gemäß IONOS-Logrotation |

## Offene Punkte
- [ ] AV-Verträge abschließen bzw. ablegen: IONOS, Make, Odoo
- [ ] Odoo-Datenbankregion „Europe“ in odoo.com → My Databases bestätigen
- [ ] Geschäftliche Daten nicht über private Gmail-Konten verarbeiten (Odoo-Login, Make-Konto, Benachrichtigungen auf Firmenadressen umstellen)
- [ ] Zwei-Faktor-Anmeldung für Odoo, Make und IONOS aktivieren
- [ ] Einrichtungs-API-Schlüssel (Odoo „Claude Setup“, IONOS DNS) nach Abschluss löschen
