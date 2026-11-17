"""Idempotent setup of the MOKA automation in Odoo (fields, settings, templates, server actions).

Usage: ODOO_URL=https://moka-service-ug.odoo.com ODOO_DB=moka-service-ug ODOO_API_KEY=... python3 setup.py
(Uses the Odoo 20 JSON-2 API with an RPC API key.)
"""
import json, os, pathlib, urllib.error, urllib.request

URL = os.environ.get('ODOO_URL', 'https://moka-service-ug.odoo.com').rstrip('/')
DB = os.environ.get('ODOO_DB', 'moka-service-ug')
KEY = os.environ['ODOO_API_KEY']
HERE = pathlib.Path(__file__).parent


def call(model, method, **kw):
    req = urllib.request.Request(
        f'{URL}/json/2/{model}/{method}', data=json.dumps(kw).encode(), method='POST',
        headers={'Content-Type': 'application/json', 'X-Odoo-Database': DB, 'Authorization': f'Bearer {KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{model}.{method} failed: {json.loads(e.read()).get("message", e)}')


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
     (HERE / 'order_confirmed.py').read_text()),
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

# ---------------- AGB on quotes and invoices (link to Odoo's /terms page) ----------------
import re as _re
def md_to_html(md):
    out = []
    for line in md.splitlines():
        line = line.strip()
        if not line or line.startswith('>'):
            continue
        t = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        t = _re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
        if t.startswith('### '): out.append('<h4>%s</h4>' % t[4:])
        elif t.startswith('## '): out.append('<h3>%s</h3>' % t[3:])
        elif t.startswith('# '): out.append('<h2>%s</h2>' % t[2:])
        else: out.append('<p>%s</p>' % t)
    return '\n'.join(out)

agb = (HERE.parent.parent / 'docs' / 'legal' / 'AGB.md').read_text()
call('res.company', 'write', ids=[1], vals={'terms_type': 'html', 'invoice_terms_html': md_to_html(agb)})
p_terms = call('ir.config_parameter', 'search', domain=[('key', '=', 'account.use_invoice_terms')])
call('ir.config_parameter', 'write', ids=p_terms, vals={'value': 'True'})
print('AGB set on company')

# ---------------- Odoo Sign: framework contract for recurring services ----------------
if not call('ir.config_parameter', 'search', domain=[('key', '=', 'moka.contract_active')]):
    # '0' until a lawyer has reviewed docs/legal/Rahmenvertrag.md; then set to '1'.
    call('ir.config_parameter', 'create', vals_list=[{'key': 'moka.contract_active', 'value': '0'}])
import base64, subprocess, tempfile
LOGO_LIGHT = HERE.parent.parent / 'public' / 'brand' / 'moka-logo-light.jpg'


def run_code(code, context):
    """Runs Python inside Odoo through a one-off server action. Needed for binary data, which the
    JSON-2 API rejects ("_check_contents"); b64decode is available inside Odoo."""
    model_id = call('ir.model', 'search', domain=[('model', '=', 'res.company')])[0]
    action_id = call('ir.actions.server', 'create', vals_list=[{'name': 'MOKA setup (temporary)', 'model_id': model_id,
                                                                'state': 'code', 'code': code}])[0]
    try:
        return call('ir.actions.server', 'run', ids=[action_id], context=context)
    finally:
        call('ir.actions.server', 'unlink', ids=[action_id])


# Company logo for quotes, invoices and emails (white-background version, made for paper).
run_code("env.company.write({'logo': env.context['logo']})\naction = {'ok': True}",
         {'logo': base64.b64encode(LOGO_LIGHT.read_bytes()).decode()})
print('company logo set')
role = call('sign.item.role', 'search', domain=[('name', '=', 'Auftraggeber')])
role = role[0] if role else call('sign.item.role', 'create', vals_list=[{'name': 'Auftraggeber'}])[0]
with tempfile.TemporaryDirectory() as tmp:
    pdf = pathlib.Path(tmp) / 'Rahmenvertrag.pdf'
    pos = json.loads(subprocess.check_output(['python3', str(HERE / 'contracts' / 'build_contract_pdf.py'),
                                              str(HERE.parent.parent / 'docs' / 'legal' / 'Rahmenvertrag.md'), str(pdf),
                                              str(LOGO_LIGHT)]))
    data = base64.b64encode(pdf.read_bytes()).decode()
old = call('sign.template', 'search', domain=[('name', '=', 'MOKA Rahmenvertrag')])
if old:  # replace the template so the PDF and field positions always match the current text
    call('sign.template', 'write', ids=old, vals={'active': False, 'name': 'MOKA Rahmenvertrag (alt)'})
att = run_code("att = env['ir.attachment'].create({'name': env.context['file_name'], 'raw': b64decode(env.context['file_data']), "
               "'mimetype': 'application/pdf'})\naction = {'id': att.id}",
               {'file_name': 'Rahmenvertrag MOKA Objektservice.pdf', 'file_data': data})['id']
tpl = call('sign.template', 'create', vals_list=[{'name': 'MOKA Rahmenvertrag'}])[0]
doc = call('sign.document', 'create', vals_list=[{'template_id': tpl, 'attachment_id': att}])[0]
types = {t['auto_field'] or t['item_type']: t['id'] for t in call('sign.item.type', 'search_read', domain=[], fields=['item_type', 'auto_field'])}
items = []
for key, type_key in [('name', 'name'), ('date', 'date'), ('signature', 'signature')]:
    p_ = pos[key]
    items.append({'document_id': doc, 'type_id': types[type_key], 'responsible_id': role, 'required': True,
                  'page': p_['page'], 'posX': round(p_['posX'], 4), 'posY': round(p_['posY'], 4),
                  'width': round(p_['width'], 4), 'height': round(p_['height'], 4), 'alignment': 'left'})
call('sign.item', 'create', vals_list=items)
print('sign template', tpl, 'document', doc)
