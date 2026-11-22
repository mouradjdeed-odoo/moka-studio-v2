# Odoo server action "MOKA: Neue Anfrage" (model crm.lead).
# Called by the Make scenario "MOKA – Neue Anfrage" with context
# {"moka_raw": "<JSON from the website form>", "moka_token": "<random uuid from Make>"}.
# Creates/finds the contact, creates the opportunity with all details, the internal price
# estimate and the attachments, emails the customer (template) and notifies the managers.
ICP = env['ir.config_parameter'].sudo()
p = json.loads(env.context.get('moka_raw') or '{}')
s = lambda k: str(p.get(k) or '').strip()
num = lambda k: float(s(k).replace(',', '.') or 0)

name, email = s('name'), s('email').lower()
if not env.context.get('moka_token'):
    raise UserError('MOKA: Token fehlt')
if len(name) < 2 or '@' not in email:
    raise UserError('MOKA: Name oder E-Mail fehlt')
if s('website'):  # honeypot field, only bots fill it
    action = {'ok': True, 'spam': True}
else:
    units_ids = [u for u in s('service').split(',') if u]
    UNIT = {'clean': 'MOKA Clean', 'clear': 'MOKA Clear', 'build': 'MOKA Build', 'verwaltung': 'MOKA Verwaltung'}
    SCOPE = {'muell': 'Müllservice', 'treppenhaus': 'Treppenhausreinigung', 'hausmeister': 'Hausmeisterservice',
             'winter': 'Winterdienst', 'garten': 'Gartenpflege', 'innen': 'Unterhaltsreinigung',
             'endreinigung': 'Endreinigung', 'fenster': 'Fensterreinigung', 'sonder': 'Sonderreinigung',
             'renovierung': 'Renovierung', 'trockenbau': 'Trockenbau', 'sanierung': 'Sanierung',
             'glasfaser': 'Glasfaser & Infrastruktur'}
    OBJECT = {'mfh': 'Mehrfamilienhaus', 'efh': 'Einfamilienhaus', 'gewerbeobjekt': 'Gewerbeimmobilie',
              'wohnung': 'Wohnung', 'gewerbe': 'Büro / Gewerbeeinheit', 'haus': 'Haus'}
    FREQ = {'twice_weekly': '2× pro Woche', 'daily': 'täglich (Mo–Fr)', 'three_weekly': '3× pro Woche',
            'weekly': 'wöchentlich', 'biweekly': 'alle 2 Wochen', 'once': 'einmalig', 'quarterly': 'alle 3 Monate',
            'monthly': 'monatlich'}
    clean_scope = [c for c in s('cleanScope').split(',') if c]
    build_scope = [c for c in s('buildScope').split(',') if c]
    units_label = ', '.join(UNIT.get(u, u) for u in units_ids)
    scope_label = ', '.join(SCOPE.get(c, c) for c in clean_scope + build_scope)

    # ---- internal price estimate (coefficients in system parameter moka.pricing) ----
    cfg = json.loads(ICP.get_param('moka.pricing') or '{}')
    units, area, floor, dist = int(num('units') or 0), num('area'), int(num('floor') or 0), num('distance')
    lines, lo, hi = [], 0.0, 0.0
    # MOKA Clean: each service has its own measure (see docs/PROJECT_NOTES.md, "Preismodell MOKA Clean").
    CLEAN_KEYS = ('stairwells', 'storeys', 'stairFrequency', 'bins', 'sidewalk', 'gardenArea', 'interiorArea',
                  'interiorFrequency', 'windows', 'glassArea', 'windowFrequency')
    clean_in = dict((k, s(k)) for k in CLEAN_KEYS if s(k))
    obj = s('objectType')
    if 'clean' in units_ids:
        c = cfg.get('clean', {})
        monthly, once = 0.0, 0.0
        if 'treppenhaus' in clean_scope and 'per_floor' in c.get('treppenhaus', {}):
            t = c['treppenhaus']
            floors = int(num('stairwells')) * int(num('storeys'))
            fq = t['freq'].get(s('stairFrequency'), 1)
            v = (t['base'] + t['per_floor'] * floors) * fq
            monthly += v
            lines.append('Treppenhausreinigung (%s): %d Aufgänge × %d Etagen = %d; (%s + %s × %d) × %s = %.2f €/Monat'
                         % (FREQ.get(s('stairFrequency'), '?'), int(num('stairwells')), int(num('storeys')), floors,
                            t['base'], t['per_floor'], floors, fq, v))
        if 'muell' in clean_scope and 'per_bin' in c.get('muell', {}):
            v = c['muell']['base'] + c['muell']['per_bin'] * int(num('bins'))
            monthly += v; lines.append('Müllservice: %s + %s × %d Tonnen = %.2f €/Monat' % (c['muell']['base'], c['muell']['per_bin'], int(num('bins')), v))
        if 'hausmeister' in clean_scope and 'per_unit' in c.get('hausmeister', {}):
            v = c['hausmeister']['base'] + c['hausmeister']['per_unit'] * units
            monthly += v; lines.append('Hausmeisterservice: %s + %s × %d Einheiten = %.2f €/Monat' % (c['hausmeister']['base'], c['hausmeister']['per_unit'], units, v))
        if 'winter' in clean_scope and 'per_m' in c.get('winter', {}):
            w = c['winter']
            v = (w['base'] + w['per_m'] * num('sidewalk')) / w['months']
            monthly += v; lines.append('Winterdienst (Nov.–März): (%s + %s × %.0f m) ÷ %s = %.2f €/Monat' % (w['base'], w['per_m'], num('sidewalk'), w['months'], v))
        if 'garten' in clean_scope:
            lines.append('Gartenpflege: ca. %.0f m² Grünfläche, Preis nach Besichtigung' % num('gardenArea'))
        if 'innen' in clean_scope and 'innen' in c:
            i = c['innen']
            rate = i['per_m2_visit']['gewerbe' if obj in ('gewerbe', 'gewerbeobjekt') else 'wohnen']
            visit = max(i['min_visit'], rate * num('interiorArea'))
            n = i['visits'].get(s('interiorFrequency'), 0)
            v = visit * n
            monthly += v
            lines.append('Unterhaltsreinigung (%s): je Reinigung max(%s; %s × %.0f m²) = %.2f € × %s Reinigungen = %.2f €/Monat'
                         % (FREQ.get(s('interiorFrequency'), '?'), i['min_visit'], rate, num('interiorArea'), visit, n, v))
        if 'endreinigung' in clean_scope and 'endreinigung' in c:
            e = c['endreinigung']
            v = e['base'] + e['per_m2'] * num('interiorArea')
            once += v; lines.append('Endreinigung: %s + %s × %.0f m² = %.2f € einmalig' % (e['base'], e['per_m2'], num('interiorArea'), v))
        if 'fenster' in clean_scope and 'fenster' in c:
            fz = c['fenster']
            per = fz['base'] + fz['per_window'] * int(num('windows')) + fz['per_m2_glass'] * num('glassArea')
            yearly = fz['per_year'].get(s('windowFrequency'), 1)
            detail = '%s + %s × %d Fenster + %s × %.0f m² Glas = %.2f € je Reinigung' % (
                fz['base'], fz['per_window'], int(num('windows')), fz['per_m2_glass'], num('glassArea'), per)
            if yearly > 1:
                monthly += per * yearly / 12
                lines.append('Fensterreinigung (%s): %s; × %s ÷ 12 = %.2f €/Monat' % (FREQ.get(s('windowFrequency'), '?'), detail, yearly, per * yearly / 12))
            else:
                once += per; lines.append('Fensterreinigung (einmalig): %s' % detail)
        if 'sonder' in clean_scope:
            lines.append('Sonderreinigung: keine Schätzung, Stunden nach Aufwand (Stundensatz %s €/Std.)' % c.get('hourly'))
        if not clean_scope:
            lines.append('Clean: keine Schätzung (Stundensatz %s €/Std.)' % c.get('hourly'))
        r = c.get('range', [0.9, 1.2])
        if monthly:
            lo += monthly * r[0]; hi += monthly * r[1]
            lines.append('Clean laufend: %.2f €/Monat (Spanne %.0f–%.0f €/Monat)' % (monthly, monthly * r[0], monthly * r[1]))
        if once:
            lo += once * r[0]; hi += once * r[1]
            lines.append('Clean einmalig: %.2f € (Spanne %.0f–%.0f €)' % (once, once * r[0], once * r[1]))
    CLEAR_KEYS = ('clearMode', 'clearAreas', 'livingArea', 'livingFill', 'rooms', 'kellerArea', 'kellerFill', 'atticArea',
                  'atticFill', 'garageArea', 'garageFill', 'officeArea', 'officeFill', 'disposeShare', 'newAddress',
                  'newFloor', 'newElevator', 'distance', 'clearExtras')
    ci = dict((k, s(k)) for k in CLEAR_KEYS if s(k)) if 'clear' in units_ids else {}
    if ci is not None and 'clear' in units_ids and not s('clearAreas') and area:
        # Request from the old form (one area, one fill level, distance to the disposal site).
        ci = {'clearMode': 'dispose', 'clearAreas': 'living', 'livingArea': s('area'), 'livingFill': s('fillLevel') or 'normal'}
    if 'clear' in units_ids:
        cc = cfg.get('clear', {})
        cl_addr, cl_floor, cl_elev = s('address'), floor, s('elevator') == 'yes'
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
        MODE = {'dispose': 'Entsorgen', 'move': 'Umzug', 'mixed': 'Teils Umzug, teils Entsorgen'}
        lines.append('Clear (%s): %s; gesamt %.1f m³' % (MODE.get(cl_mode, cl_mode), '; '.join(cl_parts) or 'keine Räume', cl_raw))
        r = cc['range']
        if cl_share:
            lines.append('Entsorgen: %.1f m³ inkl. Zuschläge × %s €%s = %.2f €%s; Zone %s (PLZ %s)%s'
                         % (cl_adj * cl_share, cc['per_m3'], ' + Umland %s €' % cl_zone_fee if cl_zone_fee else '', cl_disp_total,
                            ' (Mindestpreis)' if cl_mode == 'dispose' and cl_disp_total == cc['min'] else '', cl_zone, cl_plz or '?',
                            ', Anfahrt bitte manuell prüfen' if cl_zone == 'manuell' else ''))
        if cl_share < 1:
            lines.append('Umzug: %.1f Std. × %s € = %.2f €%s (Tragen %.1f Std. inkl. Etagen/Extras, Fahrt %.0f km ÷ %s km/h, mind. %s Std.)'
                         % (cl_hours, mv['hourly'], cl_hours * mv['hourly'], ' + %d × Halteverbot %s €' % (cl_halte, mv['halteverbot']) if cl_halte else '',
                            cl_handling, cl_n('distance'), mv['kmh'], mv['min_hours']))
        if cl_notes:
            lines.append('Hinweise Clear: %s' % ', '.join(cl_notes))
        cl_total = cl_disp_total + cl_move_total
        lo += max(cc['min'], cl_total * r[0]) if cl_mode == 'dispose' else cl_total * r[0]
        hi += cl_total * r[1]
        lines.append('Clear gesamt: %.2f € (Spanne %.0f–%.0f €)' % (cl_total, cl_total * r[0], cl_total * r[1]))
    if 'build' in units_ids:
        lines.append('Build: keine Schätzung, Besichtigung und manuelles Angebot')
    if 'verwaltung' in units_ids:
        lines.append('Verwaltung: keine Schätzung, manuelles Angebot')
    lo, hi = round(lo / 10) * 10, round(hi / 10) * 10

    # ---- contact ----
    Partner = env['res.partner']
    partner = Partner.search([('email', '=ilike', email)], limit=1)
    if not partner:
        partner = Partner.create({'name': name, 'email': email, 'phone': s('phone') or False,
                                  'lang': 'de_DE'})
    elif s('phone') and not partner.phone:
        partner.write({'phone': s('phone')})
    # Invoice address: the billing address if given, else the property address ("Straße Nr, PLZ Ort").
    addr = s('billingAddress') or s('address')
    if addr and not partner.street:
        parts = [x.strip() for x in addr.split(',') if x.strip()]
        last = parts[-1].split(' ', 1) if parts else []
        avals = {'country_id': env.ref('base.de').id}
        if len(parts) >= 2 and len(last) == 2 and last[0].isdigit() and len(last[0]) == 5:
            avals.update({'street': ', '.join(parts[:-1]), 'zip': last[0], 'city': last[1].strip()})
        else:
            avals['street'] = addr
        partner.write(avals)

    # ---- opportunity ----
    FILL = {'low': 'low', 'normal': 'normal', 'full': 'full'}
    lead = env['crm.lead'].create({
        'name': '%s · %s' % (units_label or 'Anfrage', name),
        'type': 'opportunity',
        'partner_id': partner.id,
        'contact_name': name,
        'partner_name': s('company') or False,
        'email_from': email,
        'phone': s('phone') or False,
        'lang_id': env.ref('base.lang_de').id,
        'user_id': env.user.id,
        'description': '<p>%s</p>' % (s('notes').replace('&', '&amp;').replace('<', '&lt;').replace('\n', '<br/>')),
        'expected_revenue': (lo + hi) / 2 if hi else 0,
        'x_moka_services': units_label,
        'x_moka_scope': scope_label,
        'x_moka_object_type': obj if obj in OBJECT else False,
        'x_moka_service_type': s('serviceType') if s('serviceType') in ('recurring', 'onetime') else False,
        'x_moka_units': units,
        'x_moka_area': area or sum(num(k + 'Area') for k in ('living', 'keller', 'attic', 'garage', 'office')),
        'x_moka_floor': floor,
        'x_moka_elevator': s('elevator') == 'yes',
        'x_moka_distance': dist,
        'x_moka_fill_level': FILL.get(s('fillLevel') or s('livingFill'), False),
        'x_moka_object_address': s('address'),
        'x_moka_estimate_min': lo,
        'x_moka_estimate_max': hi,
        'x_moka_estimate_details': '\n'.join(lines),
        'x_moka_clean_input': json.dumps(clean_in) if clean_in else False,
        'x_moka_clear_input': json.dumps(ci) if ci else False,
        'x_moka_token': env.context.get('moka_token') or False,
    })
    lead.write({'x_moka_ref': 'A-%05d' % lead.id})

    for f in (p.get('files') or [])[:5]:
        if f.get('data'):
            env['ir.attachment'].create({'name': f.get('name') or 'Anhang', 'raw': b64decode(f['data']),
                                         'res_model': 'crm.lead', 'res_id': lead.id})

    # ---- customer confirmation (editable template, logged in the chatter) ----
    tpl = env['mail.template'].search([('name', '=', 'MOKA: Anfrage erhalten')], limit=1)
    if tpl:
        lead.with_context(lang='de_DE').message_post_with_source(tpl, subtype_xmlid='mail.mt_comment', partner_ids=[partner.id])

    # ---- manager notification with decision buttons ----
    url = (ICP.get_param('moka.decision_url') or '').strip()
    to = (ICP.get_param('moka.notify_emails') or '').strip()
    if to:
        link = lambda a: '%s?lead=%d&t=%s&a=%s' % (url, lead.id, lead.x_moka_token, a)
        btn = lambda a, label, color: '<a href="%s" style="display:inline-block;margin:4px 6px 4px 0;padding:10px 16px;border-radius:6px;background:%s;color:#fff;text-decoration:none;font-weight:bold">%s</a>' % (link(a), color, label)
        esc = lambda t: str(t or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        general = any(u in units_ids for u in ('build', 'verwaltung'))
        rows = [
            ('Anfrage-Nr.', lead.x_moka_ref), ('Leistung', units_label), ('Bereiche', scope_label),
            ('Auftragsart', dict(recurring='Regelmäßig', onetime='Einmalig').get(s('serviceType'), '')),
            ('Objekt', OBJECT.get(obj, obj)), ('Objektadresse', s('address')), ('Rechnungsadresse', s('billingAddress') or 'wie Objektadresse'),
            ('Einheiten', s('units') if general or 'hausmeister' in clean_scope else ''),
            ('Fläche', general and s('area') and '%s m²' % s('area')), ('Etage', (general or ci) and s('floor')),
            ('Fahrstuhl', (general or ci) and s('elevator') and ('Ja' if s('elevator') == 'yes' else 'Nein')),
            ('Clear', ci and '; '.join([dict(dispose='Entsorgen', move='Umzug', mixed='Teils Umzug, teils Entsorgen').get(s('clearMode'), '')] + cl_parts)),
            ('Anteil Entsorgen', s('disposeShare') and '%d %%' % (float(s('disposeShare')) * 100)),
            ('Neue Adresse', s('newAddress') and '%s, Etage %s, Fahrstuhl %s' % (s('newAddress'), s('newFloor'), 'ja' if s('newElevator') == 'yes' else 'nein')),
            ('Entfernung', s('distance') and 'ca. %s km' % s('distance')),
            ('Extras Clear', ci and ', '.join(dict(montage='Möbel ab-/aufbauen', packing='Einpacken', haltverbotOld='Halteverbot alte Adresse',
                                                    haltverbotNew='Halteverbot neue Adresse', heavy='schwere Gegenstände', hazardous='Sondermüll',
                                                    noParking='kein Parkplatz').get(x, x) for x in s('clearExtras').split(',') if x)),
            ('Treppenhäuser × Etagen', s('stairwells') and '%s × %s (%s)' % (s('stairwells'), s('storeys'), FREQ.get(s('stairFrequency'), ''))),
            ('Mülltonnen', s('bins')), ('Gehweg & Wege', s('sidewalk') and 'ca. %s m' % s('sidewalk')),
            ('Grünfläche', s('gardenArea') and 'ca. %s m²' % s('gardenArea')),
            ('Reinigungsfläche', s('interiorArea') and 'ca. %s m²' % s('interiorArea')),
            ('Rhythmus Reinigung', FREQ.get(s('interiorFrequency'), '')),
            ('Fenster', s('windowFrequency') and '%s Fenster%s, %s' % (s('windows') or '0', s('glassArea') and ' + ca. %s m² Glas' % s('glassArea') or '', FREQ.get(s('windowFrequency'), ''))),
            ('Name', name), ('Firma', s('company')), ('E-Mail', email), ('Telefon', s('phone')),
            ('Anhänge', str(len(p.get('files') or []))),
        ]
        table = ''.join('<tr><td style="padding:3px 12px 3px 0;color:#666">%s</td><td style="padding:3px 0">%s</td></tr>' % (k, esc(v)) for k, v in rows if v)
        est = ('<p><b>Interne Schätzung:</b> %s – %s €</p>' % ('{:,.0f}'.format(lo).replace(',', '.'), '{:,.0f}'.format(hi).replace(',', '.'))) if hi else '<p><b>Interne Schätzung:</b> keine automatische Schätzung</p>'
        base_url = ICP.get_param('web.base.url')
        body = ('<div style="font-family:Arial,sans-serif;font-size:14px">'
                '<p>Neue Anfrage über die Website. Sie ist als Verkaufschance in Odoo angelegt.</p>'
                '<table>%s</table>%s<pre style="white-space:pre-wrap;background:#f5f5f5;padding:8px">%s</pre>'
                '<p><b>Beschreibung des Kunden:</b><br/>%s</p>'
                '<p><a href="%s/odoo/crm/%d">In Odoo öffnen</a></p>'
                '<p><b>Wie möchten Sie weiter vorgehen?</b><br/>%s%s%s</p></div>') % (
            table, est, esc('\n'.join(lines)), esc(s('notes')).replace('\n', '<br/>'), base_url, lead.id,
            btn('offer', 'Angebot erstellen', '#2e7d32'), btn('visit', 'Besichtigung', '#1565c0'), btn('lost', 'Ablehnen', '#c62828'))
        env['mail.mail'].sudo().create({
            'subject': 'Neue Anfrage %s: %s · %s' % (lead.x_moka_ref, units_label, name),
            'email_to': to,
            'email_from': '"MOKA Objektservice" <%s>' % env.company.email,
            'reply_to': '"MOKA Objektservice" <catchall@moka-service-ug.odoo.com>',
            'body_html': body,
            'model': 'crm.lead', 'res_id': lead.id,
        }).send()
        lead.message_post(body='Interne Benachrichtigung an %s gesendet.' % esc(to), subtype_xmlid='mail.mt_note')

    action = {'ok': True, 'lead_id': lead.id, 'ref': lead.x_moka_ref}
