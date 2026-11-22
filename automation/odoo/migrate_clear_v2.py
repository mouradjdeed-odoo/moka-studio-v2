"""One-time, repeatable migration to the MOKA Clear model v2 (2026-11-22): disposal, moving or both.

- crm.lead: field x_moka_clear_input (JSON of the Clear details).
- Products: moving team per hour, no-parking zone per address, flat fee for the area around Berlin.
- moka.pricing: replaces the "clear" section (the "clean" section is kept as it is in Odoo).

Usage: ODOO_API_KEY=... python3 automation/odoo/migrate_clear_v2.py
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


# Approximate values, to be confirmed by the owner (see docs/PROJECT_NOTES.md and the Excel price sheet).
CLEAR = {
    'per_m3': 40,                                   # disposal incl. fees, per m³
    'fill': {'low': 0.3, 'normal': 0.5, 'full': 0.8},  # m³ of items per m² of floor
    'floor_pct': 0.05,                              # per floor above the first without elevator
    'keller_pct': 0.10,                             # basement surcharge
    'min': 290,                                     # minimum price for a pure disposal
    'zone': {'berlin': 0, 'umland': 50, 'manuell': 0},  # by postcode of the property; "manuell" = price by hand
    'range': [0.8, 1.3],
    'move': {'hourly': 120, 'm3_per_hour': 4, 'kmh': 25, 'min_hours': 3,
             'montage_pct': 0.2, 'packing_pct': 0.25, 'halteverbot': 120},
}

lead_model = call('ir.model', 'search', domain=[('model', '=', 'crm.lead')])[0]
if not call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_clear_input')]):
    call('ir.model.fields', 'create', vals_list=[{'name': 'x_moka_clear_input', 'field_description': 'Clear-Angaben (intern)',
                                                  'ttype': 'text', 'model_id': lead_model, 'state': 'manual', 'copied': False}])


def product(name):
    found = call('product.template', 'search', domain=[('name', '=', name)])
    return found[0] if found else None


per_m3 = product('Entrümpelung / Haushaltsauflösung inkl. Entsorgung (je m³)')
per_km = product('Anfahrt über 20 km (je km)')
hours_uom = call('product.template', 'read', ids=[product('Reinigung / Hausmeister, Einzelauftrag (Std.)')], fields=['uom_id'])[0]['uom_id'][0]
for name, model, vals in [
    ('Umzug: Team (2 Personen + Transporter), je Std.', per_m3, {'list_price': CLEAR['move']['hourly'], 'uom_id': hours_uom}),
    ('Halteverbotszone (je Adresse)', per_km, {'list_price': CLEAR['move']['halteverbot']}),
    ('Anfahrt Umland (pauschal)', per_km, {'list_price': CLEAR['zone']['umland']}),
]:
    if not product(name):
        new = call('product.template', 'copy', ids=[model], default={'name': name})
        new_id = new[0] if isinstance(new, list) else new
        call('product.template', 'write', ids=[new_id], vals=vals)
        print('created', name, new_id)

param = call('ir.config_parameter', 'search_read', domain=[('key', '=', 'moka.pricing')], fields=['value'])[0]
pricing = json.loads(param['value'])
pricing['clear'] = CLEAR
call('ir.config_parameter', 'write', ids=[param['id']], vals={'value': json.dumps(pricing)})
print('moka.pricing clear section updated')
