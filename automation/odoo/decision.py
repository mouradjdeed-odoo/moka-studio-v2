# Odoo server action "MOKA: Entscheidung" (model crm.lead).
# Called by the Make scenario "MOKA – Entscheidung" after the manager confirmed a button
# from the notification email. Context: {"moka": {"lead": id, "t": token, "a": "offer"|"visit"|"lost",
# "r": lost reason id, "note": optional text}}. Returns {"ok": bool, "message": text for the confirmation page}.
p = env.context.get('moka') or {}
STAGE_NEW, STAGE_WORK, STAGE_VISIT = 1, 2, 5
lead = env['crm.lead'].with_context(active_test=False).browse(int(p.get('lead') or 0)).exists()
t = str(p.get('t') or '')
a = str(p.get('a') or '')
note = str(p.get('note') or '').strip()
esc = lambda x: x.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
if not lead or not t or lead.x_moka_token != t:
    action = {'ok': False, 'message': 'Link ungültig oder abgelaufen.'}
elif not lead.active or lead.stage_id.id != STAGE_NEW:
    action = {'ok': False, 'message': 'Anfrage %s wurde bereits bearbeitet (Status: %s).' % (lead.x_moka_ref, 'Abgelehnt' if not lead.active else lead.stage_id.name)}
else:
    todo = env.ref('mail.mail_activity_data_todo')
    send = lambda name: lead.with_context(lang='de_DE').message_post_with_source(
        env['mail.template'].search([('name', '=', name)], limit=1), subtype_xmlid='mail.mt_comment', partner_ids=lead.partner_id.ids)
    if note:
        lead.message_post(body='Notiz zur Entscheidung: %s' % esc(note), subtype_xmlid='mail.mt_note')
    if a == 'offer':
        lead.write({'stage_id': STAGE_WORK})
        # ---- draft quotation from the request data (the manager reviews and sends it) ----
        cfg = json.loads(env['ir.config_parameter'].sudo().get_param('moka.pricing') or '{}')
        P = lambda name: env['product.template'].search([('name', '=', name)], limit=1).product_variant_id
        services, scope = lead.x_moka_services or '', lead.x_moka_scope or ''
        units, area, floor, dist = lead.x_moka_units or 0, lead.x_moka_area or 0.0, lead.x_moka_floor or 0, lead.x_moka_distance or 0.0
        lines = []  # (product, qty, unit price or None for the list price, extra description)
        winter = None
        if 'MOKA Clean' in services:
            c = cfg.get('clean', {})
            ci = json.loads(lead.x_moka_clean_input or '{}')
            n = lambda k: float(str(ci.get(k) or '0').replace(',', '.') or 0)
            picked = [x.strip() for x in scope.split(',')]
            FREQ = {'twice_weekly': '2× pro Woche', 'daily': 'täglich (Mo–Fr)', 'three_weekly': '3× pro Woche',
                    'weekly': 'wöchentlich', 'biweekly': 'alle 2 Wochen', 'quarterly': 'alle 3 Monate', 'monthly': 'monatlich'}
            if 'Treppenhausreinigung' in picked and 'per_floor' in c.get('treppenhaus', {}):
                t = c['treppenhaus']
                floors = int(n('stairwells')) * int(n('storeys'))
                lines.append((P('Treppenhausreinigung, Monatspauschale'), 1,
                              (t['base'] + t['per_floor'] * floors) * t['freq'].get(ci.get('stairFrequency'), 1),
                              '%d Treppenhäuser × %d Etagen, Reinigung %s' % (n('stairwells'), n('storeys'), FREQ.get(ci.get('stairFrequency'), ''))))
            if 'Müllservice' in picked and 'per_bin' in c.get('muell', {}):
                lines.append((P('Mülltonnenservice, Monatspauschale'), 1, c['muell']['base'] + c['muell']['per_bin'] * n('bins'), '%d Mülltonnen' % n('bins')))
            if 'Hausmeisterservice' in picked and 'per_unit' in c.get('hausmeister', {}):
                lines.append((P('Hausmeisterservice, Monatspauschale'), 1, c['hausmeister']['base'] + c['hausmeister']['per_unit'] * units, '%d Einheiten' % units))
            if 'Winterdienst' in picked and 'per_m' in c.get('winter', {}):
                # Billed only during the season, so it gets its own subscription quote (see below).
                w = c['winter']
                winter = (P('Winterdienst (Nov.–März), Monatspauschale'), 1, (w['base'] + w['per_m'] * n('sidewalk')) / w['months'],
                          'ca. %.0f m Gehweg und Wege' % n('sidewalk'))
            if 'Gartenpflege' in picked:
                lines.append((P('Gartenpflege, Monatspauschale'), 1, 0.0, 'ca. %.0f m² Grünfläche, Preis nach Besichtigung' % n('gardenArea')))
            if 'Unterhaltsreinigung' in picked and 'innen' in c:
                i = c['innen']
                rate = i['per_m2_visit']['gewerbe' if lead.x_moka_object_type in ('gewerbe', 'gewerbeobjekt') else 'wohnen']
                visit = max(i['min_visit'], rate * n('interiorArea'))
                lines.append((P('Unterhaltsreinigung, Monatspauschale'), 1, visit * i['visits'].get(ci.get('interiorFrequency'), 0),
                              'ca. %.0f m², Reinigung %s' % (n('interiorArea'), FREQ.get(ci.get('interiorFrequency'), ''))))
            if 'Endreinigung' in picked and 'endreinigung' in c:
                e = c['endreinigung']
                lines.append((P('Endreinigung, Pauschale'), 1, e['base'] + e['per_m2'] * n('interiorArea'), 'ca. %.0f m²' % n('interiorArea')))
            if 'Fensterreinigung' in picked and 'fenster' in c:
                fz = c['fenster']
                per = fz['base'] + fz['per_window'] * n('windows') + fz['per_m2_glass'] * n('glassArea')
                what = ' und '.join(x for x in ('%d Fenster' % n('windows') if n('windows') else '',
                                                 'ca. %.0f m² Glasflächen' % n('glassArea') if n('glassArea') else '') if x)
                yearly = fz['per_year'].get(ci.get('windowFrequency'), 1)
                if yearly > 1:
                    lines.append((P('Fensterreinigung, Monatspauschale'), 1, per * yearly / 12,
                                  '%s, Reinigung %s (%.2f € je Reinigung)' % (what, FREQ.get(ci.get('windowFrequency'), ''), per)))
                else:
                    lines.append((P('Fensterreinigung, je Reinigung'), 1, per, what))
            if 'Sonderreinigung' in picked or not any(x in picked for x in (
                    'Treppenhausreinigung', 'Müllservice', 'Hausmeisterservice', 'Winterdienst', 'Gartenpflege',
                    'Unterhaltsreinigung', 'Endreinigung', 'Fensterreinigung')):
                lines.append((P('Reinigung / Hausmeister, Einzelauftrag (Std.)'), 1, None, 'Stunden nach Aufwand anpassen'))
        if 'MOKA Clear' in services:
            cc = cfg.get('clear', {})
            ci = json.loads(lead.x_moka_clear_input or '{}')
            if not ci and lead.x_moka_area:
                # Requests from the old form: one area with one fill level.
                ci = {'clearMode': 'dispose', 'clearAreas': 'living', 'livingArea': str(lead.x_moka_area),
                      'livingFill': lead.x_moka_fill_level or 'normal'}
            cl_addr, cl_floor, cl_elev = lead.x_moka_object_address or '', floor, bool(lead.x_moka_elevator)
            # ---- MOKA Clear calculation (same block in new_request.py and decision.py) ----
            # Input: cc (pricing "clear"), ci (dict of form strings), cl_addr, cl_floor (int), cl_elev (bool).
            cl_n = lambda k: float(str(ci.get(k) or '0').replace(',', '.') or 0)
            cl_mode = ci.get('clearMode') or 'dispose'
            cl_places = [x for x in (ci.get('clearAreas') or '').split(',') if x]
            cl_extras = [x for x in (ci.get('clearExtras') or '').split(',') if x]
            cl_up_old = max(0, cl_floor - 1) if not cl_elev else 0
            cl_up_new = max(0, int(cl_n('newFloor')) - 1) if ci.get('newElevator') != 'yes' else 0
            cl_raw, cl_adj, cl_parts = 0.0, 0.0, []
            for cl_key, cl_label in [('living', 'Wohnräume'), ('keller', 'Keller'), ('attic', 'Dachboden'), ('garage', 'Garage'), ('office', 'Büro-/Gewerberäume')]:
                if cl_key in cl_places:
                    cl_fill = cc['fill'].get(ci.get(cl_key + 'Fill'), cc['fill']['normal'])
                    cl_vol = cl_n(cl_key + 'Area') * cl_fill
                    cl_pct = cc['keller_pct'] if cl_key == 'keller' else (0 if cl_key == 'garage' else cc['floor_pct'] * cl_up_old)
                    cl_raw += cl_vol
                    cl_adj += cl_vol * (1 + cl_pct)
                    cl_parts.append('%s ca. %.0f m² × %s = %.1f m³%s%s' % (
                        cl_label, cl_n(cl_key + 'Area'), cl_fill, cl_vol, ' (+%d %%)' % round(cl_pct * 100) if cl_pct else '',
                        ', %d Zimmer' % cl_n('rooms') if cl_key == 'living' else ''))
            cl_share = 1.0 if cl_mode == 'dispose' else (0.0 if cl_mode == 'move' else cl_n('disposeShare') or 0.5)
            # Zone from the postcode of the property address: Berlin free, nearby Brandenburg flat fee, else manual.
            cl_plz = ([t for t in cl_addr.replace(',', ' ').split() if len(t) == 5 and t.isdigit()] or [''])[0]
            cl_zone = 'berlin' if cl_plz and '10000' <= cl_plz <= '14199' else ('umland' if cl_plz[:2] in ('14', '15', '16') else 'manuell')
            cl_zone_fee = cc['zone'].get(cl_zone, 0) if cl_share else 0
            cl_disp = cl_adj * cl_share * cc['per_m3']
            cl_disp_total = cl_disp + cl_zone_fee if cl_share else 0.0
            if cl_mode == 'dispose':
                cl_disp_total = max(cc['min'], cl_disp_total)
            mv = cc['move']
            cl_handling = cl_adj * (1 - cl_share) / mv['m3_per_hour'] * (1 + cc['floor_pct'] * cl_up_new)
            cl_handling *= 1 + (mv['montage_pct'] if 'montage' in cl_extras else 0) + (mv['packing_pct'] if 'packing' in cl_extras else 0)
            cl_drive = cl_n('distance') / mv['kmh']
            cl_hours = (max(mv['min_hours'], cl_handling + cl_drive) * 2 + 0.999) // 1 / 2 if cl_share < 1 else 0.0
            cl_halte = len([x for x in ('haltverbotOld', 'haltverbotNew') if x in cl_extras]) if cl_share < 1 else 0
            cl_move_total = cl_hours * mv['hourly'] + cl_halte * mv['halteverbot']
            cl_notes = [l for x, l in [('heavy', 'schwere Gegenstände'), ('hazardous', 'Sondermüll'), ('noParking', 'kein Parkplatz vor dem Eingang')] if x in cl_extras]
            if cl_share and cl_raw:
                qty = round(cl_raw * cl_share, 1) or 1.0
                lines.append((P('Entrümpelung / Haushaltsauflösung inkl. Entsorgung (je m³)'), qty, (cl_disp_total - cl_zone_fee) / qty,
                              '; '.join(cl_parts) + ('; davon ca. %d %% Entsorgung' % (cl_share * 100) if cl_share < 1 else '')
                              + ('; inkl. Etagen-/Kellerzuschlag' if cl_adj > cl_raw else '')
                              + ('; Mindestpreis %s €' % cc['min'] if cl_mode == 'dispose' and cl_disp_total == cc['min'] else '')))
                if cl_zone_fee:
                    lines.append((P('Anfahrt Umland (pauschal)'), 1, cl_zone_fee, 'PLZ %s' % cl_plz))
                elif cl_zone == 'manuell':
                    lines.append((P('Anfahrt Umland (pauschal)'), 1, 0.0, 'Ort außerhalb des Umlands (PLZ %s): Anfahrt bitte manuell kalkulieren' % (cl_plz or '?')))
            if cl_share < 1 and cl_raw:
                extras = [l for x, l in [('montage', 'inkl. Möbelab- und -aufbau'), ('packing', 'inkl. Einpacken')] if x in cl_extras]
                lines.append((P('Umzug: Team (2 Personen + Transporter), je Std.'), cl_hours, mv['hourly'],
                              'Nach %s (Etage %s, Fahrstuhl %s), ca. %.0f km; %s%s' % (
                                  ci.get('newAddress') or '?', ci.get('newFloor') or '?', 'ja' if ci.get('newElevator') == 'yes' else 'nein',
                                  cl_n('distance'), '; '.join(cl_parts), ''.join('; ' + e for e in extras))))
                if cl_halte:
                    lines.append((P('Halteverbotszone (je Adresse)'), cl_halte, mv['halteverbot'], ''))
        if 'MOKA Build' in services:
            picked = [n for k, n in [('Renovierung', 'Renovierungsarbeiten (Std.)'), ('Trockenbau', 'Trockenbau (Std.)'),
                                     ('Sanierung', 'Sanierung (Std.)'), ('Glasfaser', 'Glasfaser- & Infrastrukturarbeiten (Std.)')] if k in scope]
            for n in picked or ['Renovierungsarbeiten (Std.)']:
                lines.append((P(n), 1, None, 'Umfang nach Besichtigung'))
        if 'MOKA Verwaltung' in services:
            lines.append((P('Mietverwaltung (je Einheit / Monat)'), units or 1, None, ''))
        monthly = env['sale.subscription.plan'].search([('billing_period_unit', '=', 'month'), ('billing_period_value', '=', 1)], limit=1)
        to_line = lambda prod, qty, price, extra: Command.create(dict(
            {'product_id': prod.id, 'product_uom_qty': qty,
             'name': '%s\n%s' % (prod.display_name, extra) if extra else prod.display_name},
            **({'price_unit': round(price, 2)} if price is not None else {})))
        base = {'partner_id': lead.partner_id.id, 'opportunity_id': lead.id, 'origin': lead.x_moka_ref,
                'client_order_ref': lead.x_moka_ref, 'team_id': lead.team_id.id,
                # No salesperson on the document: customers see only the company (MOKA Objektservice).
                'user_id': False,
                # German terms note (Odoo's default note is in the creating user's language).
                'note': '<p>Es gelten unsere <a href="%s/terms">Allgemeinen Geschäftsbedingungen (AGB)</a> einschließlich der '
                        'Widerrufsbelehrung für Verbraucher.</p>' % env['ir.config_parameter'].sudo().get_param('web.base.url')}
        orders = env['sale.order']
        lines = [l for l in lines if l[0]]
        if lines:
            recurring = any(l[0].recurring_invoice for l in lines)
            orders |= env['sale.order'].create(dict(base, plan_id=monthly.id if recurring else False, order_line=[
                Command.create({'display_type': 'line_note', 'name': 'Angebot zu Ihrer Anfrage %s – Objekt: %s' % (lead.x_moka_ref, lead.x_moka_object_address or '')})
            ] + [to_line(*l) for l in lines]))
        if winter and winter[0]:
            # Season 1 Nov – 31 Mar: monthly invoices only within the season, then the subscription ends.
            today = datetime.date.today()
            if today.month >= 11 or today.month <= 3:
                start, end_year = today, (today.year + 1 if today.month >= 11 else today.year)
            else:
                start, end_year = datetime.date(today.year, 11, 1), today.year + 1
            orders |= env['sale.order'].create(dict(base, plan_id=monthly.id, start_date=start, end_date=datetime.date(end_year, 3, 31), order_line=[
                Command.create({'display_type': 'line_note', 'name': 'Winterdienst Saison %d/%02d zu Ihrer Anfrage %s – Objekt: %s. Abrechnung monatlich nur vom %s bis 31.03.%d.'
                                % (end_year - 1, end_year % 100, lead.x_moka_ref, lead.x_moka_object_address or '', start.strftime('%d.%m.%Y'), end_year)}),
                to_line(*winter)]))
        for order in orders:
            order.activity_schedule(activity_type_id=todo.id, summary='Angebot prüfen und senden', user_id=lead.user_id.id or env.user.id,
                                    note='Entwurf aus Anfrage %s. Preise sind Schätzungen: bitte prüfen, ggf. anpassen und mit „Senden“ verschicken.' % lead.x_moka_ref)
        names = ', '.join('%s (%.2f € netto)' % (o.name, o.amount_untaxed) for o in orders)
        lead.message_post(body='Angebotsentwurf erstellt: %s' % names, subtype_xmlid='mail.mt_note')
        action = {'ok': True, 'message': 'Anfrage %s: Status „In Bearbeitung“. Angebotsentwurf erstellt: %s. Bitte in Odoo prüfen und an den Kunden senden.' % (lead.x_moka_ref, names or '–')}
    elif a == 'visit':
        lead.write({'stage_id': STAGE_VISIT})
        lead.activity_schedule(activity_type_id=todo.id, summary='Besichtigungstermin vereinbaren', user_id=lead.user_id.id or env.user.id)
        send('MOKA: Besichtigung')
        action = {'ok': True, 'message': 'Anfrage %s: Status „Besichtigung“. Der Kunde wurde informiert, dass wir uns zur Terminabstimmung melden.' % lead.x_moka_ref}
    elif a == 'lost':
        reason = env['crm.lost.reason'].browse(int(p.get('r') or 4)).exists() or env['crm.lost.reason'].browse(4)
        lead.action_set_lost(lost_reason_id=reason.id)
        send('MOKA: Absage')
        action = {'ok': True, 'message': 'Anfrage %s wurde abgelehnt (%s). Der Kunde hat eine Absage erhalten.' % (lead.x_moka_ref, reason.name)}
    else:
        action = {'ok': False, 'message': 'Unbekannte Aktion.'}
