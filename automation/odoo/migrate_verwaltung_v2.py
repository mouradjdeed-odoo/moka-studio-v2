"""One-time, repeatable migration to the MOKA Verwaltung model v2 (2026-11-22).

- crm.lead: field x_moka_mgmt_input (JSON of the management details).
- Products: management products become monthly flat fees; new Sondereigentumsverwaltung.
- moka.pricing: adds the "verwaltung" section (price per apartment, commercial unit and parking space, monthly minimum).

Usage: ODOO_API_KEY=... python3 automation/odoo/migrate_verwaltung_v2.py
"""
import json, os, urllib.error, urllib.request

URL = os.environ.get('ODOO_URL', 'https://moka-service-ug.odoo.com').rstrip('/')
DB = os.environ.get('ODOO_DB', 'moka-service-ug')
KEY = os.environ['ODOO_API_KEY']


def call(model, method, **kw):
    req = urllib.request.Request(
        f'{URL}/json/2/{model}/{method}', data=json.dumps(kw).encode(), method='POST',
        headers={'Content-Type': 'application/json', 'X-Odoo-Database': DB, 'Authorization': f'Bearer {KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{model}.{method} failed: {json.loads(e.read()).get("message", e)}')


# Approximate Berlin values per month, to be confirmed by the owner (see docs/PROJECT_NOTES.md and the Excel sheet).
VERWALTUNG = {
    'miet': {'flat': 30, 'commercial': 45, 'parking': 5, 'min': 250},
    'weg': {'flat': 30, 'commercial': 40, 'parking': 5, 'min': 250},
    'sev': {'flat': 35, 'commercial': 50, 'parking': 5, 'min': 0},
    'technik': {'flat': 15, 'commercial': 20, 'parking': 0, 'min': 250},
    'range': [0.9, 1.15],
}

lead_model = call('ir.model', 'search', domain=[('model', '=', 'crm.lead')])[0]
if not call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_mgmt_input')]):
    call('ir.model.fields', 'create', vals_list=[{'name': 'x_moka_mgmt_input', 'field_description': 'Verwaltungs-Angaben (intern)',
                                                  'ttype': 'text', 'model_id': lead_model, 'state': 'manual', 'copied': False}])


def product(name):
    found = call('product.template', 'search', domain=[('name', '=', name)])
    return found[0] if found else None


for old, new in [('Mietverwaltung (je Einheit / Monat)', 'Mietverwaltung, Monatspauschale'),
                 ('WEG-Verwaltung (je Einheit / Monat)', 'WEG-Verwaltung, Monatspauschale')]:
    pid = product(old)
    if pid and not product(new):
        call('product.template', 'write', ids=[pid], vals={'name': new})
        print('renamed', old, '->', new)
if not product('Sondereigentumsverwaltung, Monatspauschale'):
    new = call('product.template', 'copy', ids=[product('Mietverwaltung, Monatspauschale')],
               default={'name': 'Sondereigentumsverwaltung, Monatspauschale'})
    print('created Sondereigentumsverwaltung', new)

param = call('ir.config_parameter', 'search_read', domain=[('key', '=', 'moka.pricing')], fields=['value'])[0]
pricing = json.loads(param['value'])
pricing['verwaltung'] = VERWALTUNG
call('ir.config_parameter', 'write', ids=[param['id']], vals={'value': json.dumps(pricing)})
print('moka.pricing verwaltung section set')
