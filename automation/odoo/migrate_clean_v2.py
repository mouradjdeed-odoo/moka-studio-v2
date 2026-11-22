"""One-time, repeatable migration to the MOKA Clean pricing model v2 (2026-11-22).

- crm.lead: field x_moka_clean_input (JSON of the Clean details) and the new property types.
- Products: Treppenhaus without a fixed rhythm, plus Unterhaltsreinigung, Endreinigung, Fensterreinigung.
- moka.pricing: replaces the "clean" section (the "clear" section is kept as it is in Odoo).

Usage: ODOO_API_KEY=... python3 automation/odoo/migrate_clean_v2.py
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


# Proposed prices, to be confirmed by the owner (see docs/PROJECT_NOTES.md and the Excel price sheet).
CLEAN = {
    'treppenhaus': {'base': 40, 'per_floor': 12, 'freq': {'twice_weekly': 1.9, 'weekly': 1, 'biweekly': 0.55}},
    'muell': {'base': 30, 'per_bin': 8},
    'hausmeister': {'base': 60, 'per_unit': 12},
    'winter': {'base': 200, 'per_m': 5, 'months': 5},
    'innen': {'per_m2_visit': {'wohnen': 1.0, 'gewerbe': 0.25}, 'min_visit': 35,
              'visits': {'daily': 21.7, 'three_weekly': 13, 'weekly': 4.33, 'biweekly': 2.17}},
    'endreinigung': {'base': 60, 'per_m2': 3.5},
    'fenster': {'base': 30, 'per_window': 8, 'per_m2_glass': 3, 'per_year': {'once': 1, 'quarterly': 4, 'monthly': 12}},
    'hourly': 40,
    'range': [0.9, 1.2],
}

lead_model = call('ir.model', 'search', domain=[('model', '=', 'crm.lead')])[0]

# ---- fields ----
if not call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_clean_input')]):
    call('ir.model.fields', 'create', vals_list=[{'name': 'x_moka_clean_input', 'field_description': 'Clean-Angaben (intern)',
                                                  'ttype': 'text', 'model_id': lead_model, 'state': 'manual', 'copied': False}])
units_field = call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_units')])
call('ir.model.fields', 'write', ids=units_field, vals={'field_description': 'Einheiten'})
obj_field = call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_object_type')])[0]
existing = {r['value'] for r in call('ir.model.fields.selection', 'search_read', domain=[('field_id', '=', obj_field)], fields=['value'])}
for seq, (value, label) in enumerate([('mfh', 'Mehrfamilienhaus'), ('efh', 'Einfamilienhaus'), ('gewerbeobjekt', 'Gewerbeimmobilie')], start=10):
    if value not in existing:
        call('ir.model.fields.selection', 'create', vals_list=[{'field_id': obj_field, 'value': value, 'name': label, 'sequence': seq}])
for value, label in [('wohnung', 'Wohnung'), ('gewerbe', 'Büro / Gewerbeeinheit')]:
    ids = call('ir.model.fields.selection', 'search', domain=[('field_id', '=', obj_field), ('value', '=', value)])
    call('ir.model.fields.selection', 'write', ids=ids, vals={'name': label})

# ---- products (copies keep category, taxes, project/task settings of a similar product) ----
def product(name):
    found = call('product.template', 'search', domain=[('name', '=', name)])
    return found[0] if found else None

old = product('Treppenhausreinigung (wöchentlich), Monatspauschale')
if old and not product('Treppenhausreinigung, Monatspauschale'):
    call('product.template', 'write', ids=[old], vals={'name': 'Treppenhausreinigung, Monatspauschale'})
recurring_model = product('Hausmeisterservice, Monatspauschale')
one_time_model = product('Reinigung / Hausmeister, Einzelauftrag (Std.)')
for name, model, extra in [
    ('Unterhaltsreinigung, Monatspauschale', recurring_model, {}),
    ('Fensterreinigung, Monatspauschale', recurring_model, {}),
    ('Endreinigung, Pauschale', one_time_model, {'list_price': 0.0}),
    ('Fensterreinigung, je Reinigung', one_time_model, {'list_price': 0.0}),
]:
    if not product(name):
        new = call('product.template', 'copy', ids=[model], default=dict({'name': name}, **extra))
        new_id = new[0] if isinstance(new, list) else new
        if model == one_time_model:
            # Flat prices, not hours: use the unit of the recurring products.
            uom = call('product.template', 'read', ids=[recurring_model], fields=['uom_id'])[0]['uom_id'][0]
            call('product.template', 'write', ids=[new_id], vals={'uom_id': uom})
        print('created', name, new_id)

# ---- prices ----
param = call('ir.config_parameter', 'search_read', domain=[('key', '=', 'moka.pricing')], fields=['value'])[0]
pricing = json.loads(param['value'])
pricing['clean'] = CLEAN
call('ir.config_parameter', 'write', ids=[param['id']], vals={'value': json.dumps(pricing)})
print('moka.pricing clean section updated')
