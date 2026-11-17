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
             'winter': 'Winterdienst', 'garten': 'Gartenpflege', 'renovierung': 'Renovierung',
             'trockenbau': 'Trockenbau', 'sanierung': 'Sanierung', 'glasfaser': 'Glasfaser & Infrastruktur'}
    clean_scope = [c for c in s('cleanScope').split(',') if c]
    build_scope = [c for c in s('buildScope').split(',') if c]
    units_label = ', '.join(UNIT.get(u, u) for u in units_ids)
    scope_label = ', '.join(SCOPE.get(c, c) for c in clean_scope + build_scope)

    # ---- internal price estimate (coefficients in system parameter moka.pricing) ----
    cfg = json.loads(ICP.get_param('moka.pricing') or '{}')
    units, area, floor, dist = int(num('units') or 0), num('area'), int(num('floor') or 0), num('distance')
    lines, lo, hi = [], 0.0, 0.0
    if 'clean' in units_ids and s('serviceType') == 'recurring':
        c = cfg.get('clean', {})
        monthly = 0.0
        if 'treppenhaus' in clean_scope:
            v = c['treppenhaus']['base'] + c['treppenhaus']['per_unit'] * units
            monthly += v; lines.append('Treppenhausreinigung: %.2f €/Monat' % v)
        if 'muell' in clean_scope:
            v = c['muell']['base'] + c['muell']['per_unit'] * units
            monthly += v; lines.append('Müllservice: %.2f €/Monat' % v)
        if 'hausmeister' in clean_scope:
            v = max(c['hausmeister']['min'], c['hausmeister']['per_m2'] * area)
            monthly += v; lines.append('Hausmeisterservice: %.2f €/Monat' % v)
        if 'winter' in clean_scope:
            v = (c['winter']['base'] + c['winter']['per_unit'] * units) / c['winter']['months']
            monthly += v; lines.append('Winterdienst (Nov.–März): %.2f €/Monat' % v)
        if 'garten' in clean_scope:
            lines.append('Gartenpflege: keine Schätzung, Besichtigung nötig')
        if monthly:
            lo += monthly * c['range'][0]; hi += monthly * c['range'][1]
            lines.append('Clean gesamt: %.2f €/Monat (Spanne %.0f–%.0f €/Monat)' % (monthly, monthly * c['range'][0], monthly * c['range'][1]))
    elif 'clean' in units_ids:
        lines.append('Clean einmalig: keine Schätzung (Stundensatz %s €/Std.)' % cfg.get('clean', {}).get('hourly'))
    if 'clear' in units_ids:
        c = cfg.get('clear', {})
        fill = c['fill'].get(s('fillLevel'), c['fill']['normal'])
        vol = area * fill
        base = vol * c['per_m3']
        floors = max(0, floor - 1) if s('elevator') == 'no' else 0
        base *= 1 + c['floor_pct'] * floors
        km = max(0.0, dist - c['free_km']) * c['per_km']
        total = max(c['min'], base + km)
        lo += max(c['min'], total * c['range'][0]); hi += total * c['range'][1]
        lines.append('Clear: %.1f m² × %.1f = %.1f m³ × %s € = %.2f €; Etagen-Zuschlag %d × %d %%; Anfahrt %.2f €; Summe %.2f € (Spanne %.0f–%.0f €)'
                     % (area, fill, vol, c['per_m3'], vol * c['per_m3'], floors, c['floor_pct'] * 100, km, total,
                        max(c['min'], total * c['range'][0]), total * c['range'][1]))
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
        'x_moka_object_type': s('objectType') if s('objectType') in ('wohnung', 'haus', 'gewerbe') else False,
        'x_moka_service_type': s('serviceType') if s('serviceType') in ('recurring', 'onetime') else False,
        'x_moka_units': units,
        'x_moka_area': area,
        'x_moka_floor': floor,
        'x_moka_elevator': s('elevator') == 'yes',
        'x_moka_distance': dist,
        'x_moka_fill_level': FILL.get(s('fillLevel'), False),
        'x_moka_object_address': s('address'),
        'x_moka_estimate_min': lo,
        'x_moka_estimate_max': hi,
        'x_moka_estimate_details': '\n'.join(lines),
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
        rows = [
            ('Anfrage-Nr.', lead.x_moka_ref), ('Leistung', units_label), ('Bereiche', scope_label),
            ('Auftragsart', dict(recurring='Regelmäßig', onetime='Einmalig').get(s('serviceType'), '')),
            ('Objekt', s('objectType')), ('Objektadresse', s('address')), ('Einheiten', s('units')),
            ('Fläche', '%s m²' % s('area')), ('Etage', s('floor')), ('Fahrstuhl', 'Ja' if s('elevator') == 'yes' else 'Nein'),
            ('Entfernung', s('distance') and '%s km' % s('distance')), ('Füllgrad', s('fillLevel')),
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
