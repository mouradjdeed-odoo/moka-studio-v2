"""Idempotent setup of the website chat: Odoo Live Chat channel + scripted chatbot "MOKA Assistent".

The chatbot answers questions about the four units, sends quote requests to the website form and turns
other requests into CRM leads (team "Sales"). It never quotes prices. Texts are German with English
translations (Odoo picks the visitor's language).

Usage: ODOO_URL=https://moka-service-ug.odoo.com ODOO_DB=moka-service-ug ODOO_API_KEY=... python3 livechat_setup.py
Running it again rebuilds the chatbot steps from the definitions below.
"""
import base64, json, os, pathlib, urllib.error, urllib.request

URL = os.environ.get('ODOO_URL', 'https://moka-service-ug.odoo.com').rstrip('/')
DB = os.environ.get('ODOO_DB', 'moka-service-ug')
KEY = os.environ['ODOO_API_KEY']
SITE = os.environ.get('MOKA_SITE_URL', 'https://moka-objektservice.de').rstrip('/')
LOGO = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'brand' / 'moka-logo.png'

# Embedded chats on an external site are served in the database's default language (en_US), not the
# visitor's. Until that is solved, en_US also gets the German texts; set to True to restore English.
EN_FALLBACK = os.environ.get('MOKA_CHAT_EN', '') == '1'

CHANNEL_NAME = 'MOKA Website'
SCRIPT_TITLE = 'MOKA Assistent'


def call(model, method, **kw):
    req = urllib.request.Request(
        f'{URL}/json/2/{model}/{method}', data=json.dumps(kw).encode(), method='POST',
        headers={'Content-Type': 'application/json', 'X-Odoo-Database': DB, 'Authorization': f'Bearer {KEY}'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{model}.{method} failed: {json.loads(e.read()).get("message", e)}')


def p(text):
    return f'<p>{text}</p>'


PRIVACY = f'<a href="{SITE}/datenschutz" target="_blank">'
QUOTE = f'{SITE}/#kontakt'

# Each step: key, type, (de, en) message, triggering answer keys, answers [(key, de, en, redirect)].
# Odoo shows a step only if, for EVERY question its triggers belong to, one of them was chosen. So the triggers
# of one step must all come from the same question. The closing steps are triggered by every first answer except
# "Angebot anfragen", which only redirects to the quote form and ends the conversation.
STEPS = [
    ('hello', 'text',
     (p(f'Hallo! Ich bin der digitale Assistent von MOKA Objektservice. Ich helfe Ihnen, schnell die richtige '
        f'Stelle zu finden. Hinweise zum Datenschutz: {PRIVACY}Datenschutzerklärung</a>'),
      p(f'Hello! I am the digital assistant of MOKA Objektservice and will help you find the right place quickly. '
        f'Privacy information: {PRIVACY}privacy policy</a>')), [], []),
    ('topic', 'question_selection', (p('Wobei können wir Ihnen helfen?'), p('How can we help you?')), [], [
        ('quote', 'Angebot anfragen', 'Request a quote', QUOTE),
        ('services', 'Frage zu unseren Leistungen', 'Question about our services', ''),
        ('callback', 'Rückruf vereinbaren', 'Request a call back', ''),
        ('other', 'Sonstiges', 'Something else', ''),
    ]),
    ('unit', 'question_selection', (p('Zu welchem Bereich?'), p('Which area?')), ['services'], [
        ('clean', 'MOKA Clean', 'MOKA Clean', ''),
        ('clear', 'MOKA Clear', 'MOKA Clear', ''),
        ('build', 'MOKA Build', 'MOKA Build', ''),
        ('verwaltung', 'MOKA Verwaltung', 'MOKA Verwaltung', ''),
    ]),
    ('info_clean', 'text',
     (p('MOKA Clean: Treppenhausreinigung, Unterhaltsreinigung, Fenster- und Endreinigung, Hausmeisterservice, '
        'Winterdienst, Mülltonnenservice und Gartenpflege – in Berlin und Umgebung.'),
      p('MOKA Clean: stairwell and maintenance cleaning, window and final cleaning, caretaker service, '
        'winter service, bin service and garden care – in Berlin and the surrounding area.')), ['clean'], []),
    ('info_clear', 'text',
     (p('MOKA Clear: Entrümpelung, Haushaltsauflösung und Umzug – auch Keller, Dachboden und Garage.'),
      p('MOKA Clear: clearance, house clearance and removals – including cellars, attics and garages.')),
     ['clear'], []),
    ('info_build', 'text',
     (p('MOKA Build: Renovierung, Malerarbeiten, Bodenbeläge, Trockenbau, Sanierung und '
        'Glasfaser-Hausverkabelung. Zulassungspflichtige Handwerksleistungen führen eingetragene Meisterbetriebe '
        'bzw. qualifizierte Partnerunternehmen aus.'),
      p('MOKA Build: renovation, painting, flooring, drywall, refurbishment and in-house fibre cabling. '
        'Licensed trade work is carried out by registered master businesses or qualified partners.')),
     ['build'], []),
    ('info_verwaltung', 'text',
     (p('MOKA Verwaltung: Mietverwaltung, WEG-Verwaltung, Sondereigentumsverwaltung und technische '
        'Objektbetreuung – durch Verwalter mit Erlaubnis nach § 34c GewO bzw. zertifizierte Partnerunternehmen.'),
      p('MOKA Verwaltung: rental management, condominium (WEG) management, management of individual units and '
        'technical property support – by managers licensed under § 34c GewO or certified partners.')),
     ['verwaltung'], []),
    ('services_hint', 'text',
     (p(f'Für ein unverbindliches Richtangebot nutzen Sie am besten unser <a href="{QUOTE}" target="_blank">'
        'Anfrageformular</a> – Sie erhalten es innerhalb von 24 Stunden. Oder stellen Sie uns hier Ihre Frage.'),
      p(f'For a free estimate, please use our <a href="{QUOTE}" target="_blank">request form</a> – you will '
        'receive it within 24 hours. Or ask us your question here.')), ['services'], []),
    ('describe', 'free_input_multi',
     (p('Bitte beschreiben Sie kurz Ihr Anliegen – zum Beispiel Ort oder Bezirk des Objekts und die gewünschte '
        'Leistung.'),
      p('Please describe your request briefly – for example the location of the property and the service you '
        'need.')), ['services', 'callback', 'other'], []),
    ('email', 'question_email',
     (p('An welche E-Mail-Adresse dürfen wir Ihnen antworten?'), p('Which email address may we reply to?')),
     ['services', 'callback', 'other'], []),
    ('phone', 'question_phone',
     (p('Unter welcher Telefonnummer erreichen wir Sie?'), p('Which phone number can we reach you on?')),
     ['callback'], []),
    ('lead', 'create_lead',
     (p('Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von 24 Stunden '
        '(Montag bis Freitag) bei Ihnen.'),
      p('Thank you! We have received your request and will get back to you within 24 hours (Monday to Friday).')),
     ['services', 'callback', 'other'], []),
]


def main():
    logo = base64.b64encode(LOGO.read_bytes()).decode() if LOGO.exists() else False

    # Operator shown as sender of the bot messages.
    partner = call('res.partner', 'search', domain=[('name', '=', SCRIPT_TITLE), ('active', 'in', [True, False])])
    vals = {'name': SCRIPT_TITLE, 'active': False, 'image_1920': logo}
    if partner:
        call('res.partner', 'write', ids=partner, vals=vals)
        partner_id = partner[0]
    else:
        partner_id = call('res.partner', 'create', vals_list=[vals])[0]

    # Chatbot script: rebuilt from scratch so the definitions above stay the single source of truth.
    script = call('chatbot.script', 'search', domain=[('title', '=', SCRIPT_TITLE)])
    if script:
        script_id = script[0]
        old = call('chatbot.script.step', 'search', domain=[('chatbot_script_id', '=', script_id)])
        if old:
            call('chatbot.script.step', 'unlink', ids=old)
        call('chatbot.script', 'write', ids=[script_id], vals={'operator_partner_id': partner_id, 'image_1920': logo})
    else:
        script_id = call('chatbot.script', 'create', vals_list=[{
            'title': SCRIPT_TITLE, 'operator_partner_id': partner_id, 'image_1920': logo}])[0]

    team = call('crm.team', 'search', domain=[], limit=1)
    answer_ids = {}
    en, de = {'lang': 'en_US'}, {'lang': 'de_DE'}
    for seq, (key, step_type, (de_msg, en_msg), triggers, answers) in enumerate(STEPS, start=1):
        vals = {'chatbot_script_id': script_id, 'sequence': seq * 10, 'step_type': step_type, 'message': de_msg,
                'triggering_answer_ids': [[6, 0, [answer_ids[t] for t in triggers]]]}
        if step_type == 'create_lead' and team:
            vals['crm_team_id'] = team[0]
        # create() stores the value as the source (en_US); then set each language explicitly.
        step_id = call('chatbot.script.step', 'create', vals_list=[vals])[0]
        call('chatbot.script.step', 'write', ids=[step_id], vals={'message': EN_FALLBACK and en_msg or de_msg}, context=en)
        call('chatbot.script.step', 'write', ids=[step_id], vals={'message': de_msg}, context=de)
        for aseq, (akey, de_name, en_name, link) in enumerate(answers, start=1):
            aid = call('chatbot.script.answer', 'create', vals_list=[{
                'script_step_id': step_id, 'sequence': aseq, 'name': de_name, 'redirect_link': link or False}])[0]
            call('chatbot.script.answer', 'write', ids=[aid], vals={'name': EN_FALLBACK and en_name or de_name}, context=en)
            call('chatbot.script.answer', 'write', ids=[aid], vals={'name': de_name}, context=de)
            answer_ids[akey] = aid

    # Live chat channel (the default "Support" channel is reused and renamed).
    channel = call('im_livechat.channel', 'search', domain=[('name', 'in', [CHANNEL_NAME, 'Support'])], limit=1)
    cvals = {'name': CHANNEL_NAME, 'button_text': 'Fragen? Schreiben Sie uns.',
             'default_message': 'Hallo! Wie können wir Ihnen helfen?',
             'header_background_color': '#17171A', 'title_color': '#FFFFFF',
             'button_background_color': '#C9971A', 'button_text_color': '#FFFFFF'}
    if channel:
        channel_id = channel[0]
        call('im_livechat.channel', 'write', ids=[channel_id], vals=cvals, context={'lang': 'de_DE'})
    else:
        channel_id = call('im_livechat.channel', 'create', vals_list=[cvals], context={'lang': 'de_DE'})[0]
    if EN_FALLBACK:
        call('im_livechat.channel', 'write', ids=[channel_id], context=en, vals={
            'button_text': 'Questions? Write to us.', 'default_message': 'Hello! How can we help you?'})
    else:
        call('im_livechat.channel', 'write', ids=[channel_id], context=en, vals=cvals)

    # One rule: the website loads the chat only after the visitor clicks our chat button,
    # so the window may open immediately and the bot always answers.
    rules = call('im_livechat.channel.rule', 'search', domain=[('channel_id', '=', channel_id)])
    rvals = {'channel_id': channel_id, 'sequence': 10, 'regex_url': False, 'action': 'auto_popup',
             'auto_popup_timer': 0, 'chatbot_script_id': script_id, 'chatbot_enabled_condition': 'always'}
    if rules:
        call('im_livechat.channel.rule', 'write', ids=rules[:1], vals=rvals)
        if rules[1:]:
            call('im_livechat.channel.rule', 'unlink', ids=rules[1:])
    else:
        call('im_livechat.channel.rule', 'create', vals_list=[rvals])

    print(f'channel {channel_id}, chatbot {script_id}, {len(STEPS)} steps, '
          f'loader: {URL}/im_livechat/loader/{channel_id}')


if __name__ == '__main__':
    main()
