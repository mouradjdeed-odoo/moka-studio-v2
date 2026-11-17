"""Idempotent setup of the MOKA automation in Odoo (fields, settings, templates, server actions).

Usage: ODOO_URL=https://moka-service-ug.odoo.com ODOO_DB=moka-service-ug ODOO_API_KEY=... python3 setup.py
(Uses the Odoo 20 JSON-2 API with an RPC API key.)
"""
import json, os, pathlib, urllib.request

URL = os.environ.get('ODOO_URL', 'https://moka-service-ug.odoo.com').rstrip('/')
DB = os.environ.get('ODOO_DB', 'moka-service-ug')
KEY = os.environ['ODOO_API_KEY']
HERE = pathlib.Path(__file__).parent


def call(model, method, **kw):
    req = urllib.request.Request(
        f'{URL}/json/2/{model}/{method}', data=json.dumps(kw).encode(), method='POST',
        headers={'Content-Type': 'application/json', 'X-Odoo-Database': DB, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())


lead_model = call('ir.model', 'search', domain=[('model', '=', 'crm.lead')])[0]

for name, label in [('x_moka_ref', 'Anfrage-Nr.'), ('x_moka_token', 'Entscheidungs-Token (intern)')]:
    if not call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', name)]):
        call('ir.model.fields', 'create', vals_list=[{'name': name, 'field_description': label, 'ttype': 'char',
                                                      'model_id': lead_model, 'state': 'manual', 'copied': False}])

PRICING = {
    'clean': {'treppenhaus': {'base': 60, 'per_unit': 10}, 'muell': {'base': 40, 'per_unit': 2},
              'hausmeister': {'per_m2': 0.25, 'min': 100}, 'winter': {'base': 250, 'per_unit': 10, 'months': 5},
              'hourly': 40, 'range': [0.9, 1.2]},
    'clear': {'per_m3': 40, 'fill': {'low': 0.3, 'normal': 0.5, 'full': 0.8}, 'floor_pct': 0.05,
              'free_km': 20, 'per_km': 2, 'min': 290, 'range': [0.8, 1.3]},
}
DEFAULT_PARAMS = {'moka.pricing': json.dumps(PRICING), 'moka.notify_emails': os.environ.get('MOKA_NOTIFY', ''),
                  'moka.decision_url': os.environ.get('MOKA_DECISION_URL', '')}
for key, value in DEFAULT_PARAMS.items():
    found = call('ir.config_parameter', 'search_read', domain=[('key', '=', key)], fields=['value'])
    if not found:
        call('ir.config_parameter', 'create', vals_list=[{'key': key, 'value': value or '-'}])
    elif value and key != 'moka.pricing':  # never overwrite prices the owner may have edited
        call('ir.config_parameter', 'write', ids=[found[0]['id']], vals={'value': value})

# Customer emails go out in the company's name from info@ (not the salesperson's Gmail);
# replies go to Odoo's catchall and are routed to the right record by their headers.
# Display name is the brand (as on the logo and website); the legal name stays in signatures,
# Impressum, quotes and invoices.
BRAND = 'MOKA Objektservice'
COMPANY_FROM = '"%s" <{{ object.company_id.email or user.company_id.email }}>' % BRAND
COMPANY_REPLY_TO = '"%s" <catchall@moka-service-ug.odoo.com>' % BRAND

ns = {}
exec((HERE / 'templates.py').read_text(), ns)
for name, vals in ns['TEMPLATES'].items():
    vals = dict(vals, name=name, model_id=lead_model, lang='{{ object.partner_id.lang or "de_DE" }}',
                email_from=COMPANY_FROM, reply_to=COMPANY_REPLY_TO, partner_to='{{ object.partner_id.id }}',
                auto_delete=False)
    found = call('mail.template', 'search', domain=[('name', '=', name)])
    if found:
        call('mail.template', 'write', ids=found, vals=vals)
    else:
        call('mail.template', 'create', vals_list=[vals])

result = {}
for name, file in [('MOKA: Neue Anfrage', 'new_request.py'), ('MOKA: Entscheidung', 'decision.py')]:
    vals = {'name': name, 'model_id': lead_model, 'state': 'code', 'code': (HERE / file).read_text()}
    found = call('ir.actions.server', 'search', domain=[('name', '=', name)])
    if found:
        call('ir.actions.server', 'write', ids=found, vals=vals)
        result[name] = found[0]
    else:
        result[name] = call('ir.actions.server', 'create', vals_list=[vals])[0]
print(json.dumps(result))

# ---------------- automation rules on sale.order (needs module base_automation) ----------------
so_model = call('ir.model', 'search', domain=[('model', '=', 'sale.order')])[0]
if not call('ir.model.fields', 'search', domain=[('model', '=', 'sale.order'), ('name', '=', 'x_moka_sent_on')]):
    call('ir.model.fields', 'create', vals_list=[{'name': 'x_moka_sent_on', 'field_description': 'Angebot gesendet am',
                                                  'ttype': 'date', 'model_id': so_model, 'state': 'manual', 'copied': False}])
for name, vals in ns['SALE_TEMPLATES'].items():
    vals = dict(vals, name=name, model_id=so_model, lang='{{ object.partner_id.lang or "de_DE" }}',
                email_from=COMPANY_FROM, reply_to=COMPANY_REPLY_TO, partner_to='{{ object.partner_id.id }}', auto_delete=False)
    found = call('mail.template', 'search', domain=[('name', '=', name)])
    call('mail.template', 'write', ids=found, vals=vals) if found else call('mail.template', 'create', vals_list=[vals])

state_field = call('ir.model.fields', 'search', domain=[('model', '=', 'sale.order'), ('name', '=', 'state')])[0]
sent_on_field = call('ir.model.fields', 'search', domain=[('model', '=', 'sale.order'), ('name', '=', 'x_moka_sent_on')])[0]
sel = lambda v: call('ir.model.fields.selection', 'search', domain=[('field_id', '=', state_field), ('value', '=', v)])[0]

RULES = [
    ('MOKA: Angebot gesendet', {'trigger': 'on_state_set', 'trigger_field_ids': [(6, 0, [state_field])],
                                'trg_selection_field_id': sel('sent')},
     "for so in records:\n"
     "    so.write({'x_moka_sent_on': datetime.date.today()})\n"
     "    lead = so.opportunity_id\n"
     "    if lead and lead.active and not lead.stage_id.is_won and lead.stage_id.id != 3:\n"
     "        lead.write({'stage_id': 3})\n"),
    ('MOKA: Angebot angenommen', {'trigger': 'on_state_set', 'trigger_field_ids': [(6, 0, [state_field])],
                                  'trg_selection_field_id': sel('sale')},
     "for so in records:\n"
     "    lead = so.opportunity_id\n"
     "    if lead and lead.active and not lead.stage_id.is_won:\n"
     "        lead.action_set_won()\n"),
    ('MOKA: Angebotserinnerung nach 4 Tagen', {'trigger': 'on_time', 'trg_date_id': sent_on_field, 'trg_date_range': 4,
                                             'trg_date_range_type': 'day', 'trg_date_range_mode': 'after',
                                             'filter_domain': "[('state', '=', 'sent')]"},
     "tpl = env['mail.template'].search([('name', '=', 'MOKA: Angebotserinnerung')], limit=1)\n"
     "for so in records:\n"
     "    so.with_context(lang=so.partner_id.lang or 'de_DE').message_post_with_source(\n"
     "        tpl, subtype_xmlid='mail.mt_comment', partner_ids=so.partner_id.ids)\n"),
]
for name, vals, code in RULES:
    vals = dict(vals, name=name, model_id=so_model, active=True)
    found = call('base.automation', 'search', domain=[('name', '=', name)])
    if found:
        rule = found[0]
        call('base.automation', 'write', ids=[rule], vals=vals)
    else:
        rule = call('base.automation', 'create', vals_list=[vals])[0]
    act = call('ir.actions.server', 'search', domain=[('base_automation_id', '=', rule)])
    avals = {'name': name, 'model_id': so_model, 'state': 'code', 'code': code, 'usage': 'base_automation',
             'base_automation_id': rule}
    call('ir.actions.server', 'write', ids=act, vals=avals) if act else call('ir.actions.server', 'create', vals_list=[avals])
    result[name] = rule
print(json.dumps(result))

# Standard Odoo customer templates (quotes, orders, invoices, reminders, subscriptions): same sender rule.
STANDARD = ['Sales: Send Quotation', 'Sales: Send Pro Forma', 'Sales: Order Confirmation', 'Sales: Payment Done',
            'Invoice: Sending', 'Credit Note: Sending', 'Kind Reminder', 'Second Reminder', 'Last Reminder',
            'Subscription: Payment Failure', 'Subscription: Payment Reminder', 'Subscription: Default Email Alert']
ids = call('mail.template', 'search', domain=[('name', 'in', STANDARD)])
call('mail.template', 'write', ids=ids, vals={'email_from': COMPANY_FROM, 'reply_to': COMPANY_REPLY_TO})
print('standard templates updated:', len(ids))
