# Scheduled action "MOKA: Datenschutz – abgelehnte Anfragen löschen" (daily).
# DSGVO data minimisation: rejected requests without quotes are deleted after
# moka.retention_days_lost days (default 180), with their attachments. Contacts are
# deleted too when nothing else refers to them. Customers with quotes, orders or
# invoices are kept (commercial/tax retention: 6–10 years, § 257 HGB, § 147 AO).
# Website chats are deleted after the same period (end of this file).
ICP = env['ir.config_parameter'].sudo()
days = int(ICP.get_param('moka.retention_days_lost') or 180)
limit = datetime.datetime.now() - datetime.timedelta(days=days)
Lead = env['crm.lead'].with_context(active_test=False)
leads = Lead.search([('active', '=', False), ('probability', '=', 0), ('write_date', '<', limit), ('order_ids', '=', False)])
partners = leads.partner_id
count = len(leads)
leads.unlink()
removed = 0
for partner in partners:
    used = (Lead.search_count([('partner_id', '=', partner.id)])
            or env['sale.order'].search_count([('partner_id', '=', partner.id)])
            or env['account.move'].search_count([('partner_id', '=', partner.id)]))
    if not used:
        try:
            partner.unlink()
            removed += 1
        except Exception:
            partner.write({'active': False})
if count:
    log('MOKA retention: deleted %d rejected requests and %d contacts older than %d days' % (count, removed, days))

# Website chat (Live Chat): conversations are deleted after the same period. A chat that became a request
# keeps its transcript in the lead, so only the chat channel itself goes.
chats = env['discuss.channel'].sudo().search([('channel_type', '=', 'livechat'), ('write_date', '<', limit)])
chat_count = len(chats)
if chats:
    chats.unlink()
    log('MOKA retention: deleted %d website chats older than %d days' % (chat_count, days))
