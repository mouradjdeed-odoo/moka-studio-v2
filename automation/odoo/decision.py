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
        if 'MOKA Clean' in services:
            c = cfg.get('clean', {})
            if lead.x_moka_service_type == 'recurring':
                if 'Treppenhausreinigung' in scope:
                    lines.append((P('Treppenhausreinigung (wöchentlich), Monatspauschale'), 1, c['treppenhaus']['base'] + c['treppenhaus']['per_unit'] * units, '%d Einheiten' % units))
                if 'Müllservice' in scope:
                    lines.append((P('Mülltonnenservice, Monatspauschale'), 1, c['muell']['base'] + c['muell']['per_unit'] * units, '%d Einheiten' % units))
                if 'Hausmeisterservice' in scope:
                    lines.append((P('Hausmeisterservice, Monatspauschale'), 1, max(c['hausmeister']['min'], c['hausmeister']['per_m2'] * area), '%.0f m²' % area))
                if 'Winterdienst' in scope:
                    lines.append((P('Winterdienst (Nov.–März), Monatspauschale'), 1, (c['winter']['base'] + c['winter']['per_unit'] * units) / c['winter']['months'], ''))
                if 'Gartenpflege' in scope:
                    lines.append((P('Gartenpflege, Monatspauschale'), 1, 0.0, 'Preis nach Besichtigung'))
            else:
                lines.append((P('Reinigung / Hausmeister, Einzelauftrag (Std.)'), 1, None, 'Stunden nach Aufwand anpassen'))
        if 'MOKA Clear' in services:
            c = cfg.get('clear', {})
            vol = round(area * c['fill'].get(lead.x_moka_fill_level or 'normal', c['fill']['normal']), 1) or 1.0
            floors = max(0, floor - 1) if not lead.x_moka_elevator else 0
            price = c['per_m3'] * (1 + c['floor_pct'] * floors)
            km = max(0.0, round(dist - c['free_km']))
            if vol * price + km * c['per_km'] < c['min']:
                price = (c['min'] - km * c['per_km']) / vol
            lines.append((P('Entrümpelung / Haushaltsauflösung inkl. Entsorgung (je m³)'), vol, round(price, 2),
                          'ca. %.0f m² Fläche' % area + (', inkl. Etagenzuschlag %d. OG ohne Fahrstuhl' % floor if floors else '')))
            if km:
                lines.append((P('Anfahrt über 20 km (je km)'), km, c['per_km'], ''))
        if 'MOKA Build' in services:
            picked = [n for k, n in [('Renovierung', 'Renovierungsarbeiten (Std.)'), ('Trockenbau', 'Trockenbau (Std.)'),
                                     ('Sanierung', 'Sanierung (Std.)'), ('Glasfaser', 'Glasfaser- & Infrastrukturarbeiten (Std.)')] if k in scope]
            for n in picked or ['Renovierungsarbeiten (Std.)']:
                lines.append((P(n), 1, None, 'Umfang nach Besichtigung'))
        if 'MOKA Verwaltung' in services:
            lines.append((P('Mietverwaltung (je Einheit / Monat)'), units or 1, None, ''))
        order_lines = [Command.create({'display_type': 'line_note', 'name': 'Angebot zu Ihrer Anfrage %s – Objekt: %s' % (lead.x_moka_ref, lead.x_moka_object_address or '')})]
        for prod, qty, price, extra in lines:
            if not prod:
                continue
            vals = {'product_id': prod.id, 'product_uom_qty': qty}
            if price is not None:
                vals['price_unit'] = round(price, 2)
            vals['name'] = '%s\n%s' % (prod.display_name, extra) if extra else prod.display_name
            order_lines.append(Command.create(vals))
        recurring = any(l[0] and l[0].recurring_invoice for l in lines)
        order = env['sale.order'].create({
            'partner_id': lead.partner_id.id,
            'opportunity_id': lead.id,
            'origin': lead.x_moka_ref,
            'client_order_ref': lead.x_moka_ref,
            'user_id': lead.user_id.id or env.user.id,
            'team_id': lead.team_id.id,
            'plan_id': env['sale.subscription.plan'].search([('billing_period_unit', '=', 'month'), ('billing_period_value', '=', 1)], limit=1).id if recurring else False,
            'order_line': order_lines,
        })
        order.activity_schedule(activity_type_id=todo.id, summary='Angebot prüfen und senden', user_id=lead.user_id.id or env.user.id,
                                note='Entwurf aus Anfrage %s. Preise sind Schätzungen: bitte prüfen, ggf. anpassen und mit „Senden“ verschicken.' % lead.x_moka_ref)
        lead.message_post(body='Angebotsentwurf %s erstellt.' % order.name, subtype_xmlid='mail.mt_note')
        action = {'ok': True, 'message': 'Anfrage %s: Status „In Bearbeitung“. Angebotsentwurf %s wurde erstellt (%.2f € netto). Bitte in Odoo prüfen und an den Kunden senden.' % (lead.x_moka_ref, order.name, order.amount_untaxed)}
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
