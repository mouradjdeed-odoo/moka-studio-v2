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
        lead.activity_schedule(activity_type_id=todo.id, summary='Angebot erstellen und senden', user_id=lead.user_id.id or env.user.id)
        action = {'ok': True, 'message': 'Anfrage %s: Status „In Bearbeitung“. In Odoo wurde die Aufgabe „Angebot erstellen“ angelegt.' % lead.x_moka_ref}
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
