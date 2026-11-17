# Automation rule "MOKA: Angebot angenommen" (sale.order, state set to "sale").
# Runs when the customer signs the quotation online (or it is confirmed in Odoo).
# Projects and tasks are created by the products themselves ("Create on order").
ICP = env['ir.config_parameter'].sudo()
todo = env.ref('mail.mail_activity_data_todo')
contract_on = ICP.get_param('moka.contract_active') == '1'
tpl = env['sign.template'].search([('name', '=', 'MOKA Rahmenvertrag')], limit=1)
role = env['sign.item.role'].search([('name', '=', 'Auftraggeber')], limit=1)
for so in records:
    lead = so.opportunity_id
    if lead and lead.active and not lead.stage_id.is_won:
        lead.action_set_won()
    user_id = so.user_id.id or so.opportunity_id.user_id.id or env.user.id
    clean_recurring = so.order_line.filtered(lambda l: l.product_id.recurring_invoice and l.product_id.categ_id.name == 'MOKA Clean')
    verwaltung = so.order_line.filtered(lambda l: l.product_id.categ_id.name == 'MOKA Verwaltung')
    if clean_recurring:
        if contract_on and tpl and role:
            wizard = env['sign.send.request'].create({
                'template_id': tpl.id,
                'signer_ids': [Command.create({'role_id': role.id, 'partner_id': so.partner_id.id})],
                'subject': 'Rahmenvertrag zu Ihrem Auftrag %s' % so.name,
                'filename': 'Rahmenvertrag %s' % so.name,
                'message': '<p>Vielen Dank für Ihren Auftrag. Bitte unterschreiben Sie den Rahmenvertrag für die laufenden Leistungen online.</p>',
            })
            wizard.send_request()
            so.message_post(body='Rahmenvertrag zur elektronischen Unterschrift an den Kunden gesendet.', subtype_xmlid='mail.mt_note')
        else:
            so.activity_schedule(activity_type_id=todo.id, user_id=user_id, summary='Rahmenvertrag zur Unterschrift senden',
                                 note='Laufende Leistungen bestellt. Automatischer Versand ist aus, bis der Vertrag rechtlich geprüft ist (Systemparameter moka.contract_active).')
    if verwaltung:
        so.activity_schedule(activity_type_id=todo.id, user_id=user_id, summary='Verwaltervertrag individuell erstellen und senden')
