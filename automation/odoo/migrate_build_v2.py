"""One-time, repeatable migration to the MOKA Build model v2 (2026-11-22).

- crm.lead: field x_moka_build_input (JSON of the Build details).
- Products: painting, wallpapering, flooring (per m²), doors/radiators (per piece), fibre base fee and per unit.
- moka.pricing: adds the "build" section (renovation and fibre are estimated automatically).

Usage: ODOO_API_KEY=... python3 automation/odoo/migrate_build_v2.py
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


# Approximate Berlin values, to be confirmed by the owner (see docs/PROJECT_NOTES.md and the Excel price sheet).
BUILD = {
    'renovierung': {'wall_factor': 3.5,          # m² of walls and ceilings per m² of living area
                    'paint_m2': 9, 'poor_pct': 0.3, 'wallpaper_m2': 12,
                    'floor_lay_m2': 25, 'floor_material_m2': 15, 'floor_remove_m2': 5, 'door': 60},
    'glasfaser': {'base': 500, 'per_unit': 400, 'no_ducts_pct': 0.3},
    'range': [0.85, 1.3],
}

lead_model = call('ir.model', 'search', domain=[('model', '=', 'crm.lead')])[0]
if not call('ir.model.fields', 'search', domain=[('model', '=', 'crm.lead'), ('name', '=', 'x_moka_build_input')]):
    call('ir.model.fields', 'create', vals_list=[{'name': 'x_moka_build_input', 'field_description': 'Build-Angaben (intern)',
                                                  'ttype': 'text', 'model_id': lead_model, 'state': 'manual', 'copied': False}])


def product(name):
    found = call('product.template', 'search', domain=[('name', '=', name)])
    return found[0] if found else None


model = product('Renovierungsarbeiten (Std.)')  # MOKA Build category, project/task settings
units = call('product.template', 'read', ids=[product('Halteverbotszone (je Adresse)')], fields=['uom_id'])[0]['uom_id'][0]
m2 = call('uom.uom', 'search', domain=[('name', 'in', ['m²', 'm2'])]) or [units]
rv, gf = BUILD['renovierung'], BUILD['glasfaser']
for name, uom, price in [
    ('Malerarbeiten Wände & Decken (je m²)', m2[0], rv['paint_m2']),
    ('Tapezierarbeiten (je m²)', m2[0], rv['wallpaper_m2']),
    ('Bodenbelag erneuern inkl. Material und Entfernen (je m²)', m2[0], rv['floor_lay_m2'] + rv['floor_material_m2'] + rv['floor_remove_m2']),
    ('Türen & Heizkörper lackieren (je Stück)', units, rv['door']),
    ('Glasfaser-Inhausverkabelung, Grundpauschale', units, gf['base']),
    ('Glasfaser-Anschluss (je Einheit)', units, gf['per_unit']),
]:
    if not product(name):
        new = call('product.template', 'copy', ids=[model], default={'name': name})
        new_id = new[0] if isinstance(new, list) else new
        call('product.template', 'write', ids=[new_id], vals={'uom_id': uom, 'list_price': price})
        print('created', name, new_id)

param = call('ir.config_parameter', 'search_read', domain=[('key', '=', 'moka.pricing')], fields=['value'])[0]
pricing = json.loads(param['value'])
pricing['build'] = BUILD
call('ir.config_parameter', 'write', ids=[param['id']], vals={'value': json.dumps(pricing)})
print('moka.pricing build section set')
