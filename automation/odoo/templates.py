"""German customer email templates (model crm.lead). Editable later in Odoo: Settings > Technical > Email Templates."""

SIGNATURE = (
    '<p>Mit freundlichen Grüßen<br/>Ihr MOKA-Team</p>'
    '<p style="color:#666;font-size:12px">Moka Service UG · Lietzenburger Straße 29 · 10789 Berlin · Tel. +49 163 6666614</p>'
)

TEMPLATES = {
    'MOKA: Anfrage erhalten': {
        'subject': 'Ihre Anfrage {{ object.x_moka_ref }} ist bei uns eingegangen',
        'body_html': (
            '<div><p>Guten Tag <t t-out="object.contact_name or object.partner_id.name or \'\'"/>,</p>'
            '<p>vielen Dank für Ihre Anfrage. Wir haben sie unter der Nummer <strong t-out="object.x_moka_ref"/> erfasst.</p>'
            '<p>Wir prüfen jetzt Ihre Angaben und kalkulieren die Kosten. In Kürze erhalten Sie von uns ein unverbindliches '
            'Richtangebot per E-Mail. Den genauen Preis bestätigen wir, falls nötig, nach einer kostenlosen Besichtigung. '
            'Falls wir noch Fragen haben, melden wir uns telefonisch oder per E-Mail bei Ihnen.</p>'
            + SIGNATURE + '</div>'
        ),
    },
    'MOKA: Besichtigung': {
        'subject': 'Ihre Anfrage {{ object.x_moka_ref }}: kostenlose Besichtigung',
        'body_html': (
            '<div><p>Guten Tag <t t-out="object.contact_name or object.partner_id.name or \'\'"/>,</p>'
            '<p>vielen Dank für Ihre Geduld. Damit wir Ihnen ein genaues Angebot machen können, möchten wir uns das Objekt '
            'gerne vor Ort ansehen. Die Besichtigung ist für Sie kostenlos und unverbindlich.</p>'
            '<p>Wir melden uns in den nächsten Tagen bei Ihnen, um einen passenden Termin abzustimmen. Sie können uns auch '
            'direkt auf diese E-Mail antworten und uns Ihre Wunschtermine nennen.</p>'
            + SIGNATURE + '</div>'
        ),
    },
    'MOKA: Absage': {
        'subject': 'Ihre Anfrage {{ object.x_moka_ref }}',
        'body_html': (
            '<div><p>Guten Tag <t t-out="object.contact_name or object.partner_id.name or \'\'"/>,</p>'
            '<p>vielen Dank für Ihre Anfrage und Ihr Interesse an unseren Leistungen.</p>'
            '<p>Leider können wir Ihren Auftrag nicht übernehmen, '
            '<t t-if="object.lost_reason_id.id == 1">da sich das Objekt außerhalb unseres Einsatzgebiets befindet.</t>'
            '<t t-elif="object.lost_reason_id.id == 2">da wir im gewünschten Zeitraum keine freien Kapazitäten haben.</t>'
            '<t t-elif="object.lost_reason_id.id == 3">da die angefragte Leistung nicht zu unserem Angebot gehört.</t>'
            '<t t-else="">da wir Ihnen in diesem Fall leider kein passendes Angebot machen können.</t></p>'
            '<p>Wir bitten um Ihr Verständnis und wünschen Ihnen viel Erfolg bei Ihrem Vorhaben. '
            'Für zukünftige Anfragen sind wir gerne wieder für Sie da.</p>'
            + SIGNATURE + '</div>'
        ),
    },
}

# Sale order templates (model sale.order).
SALE_TEMPLATES = {
    'MOKA: Angebotserinnerung': {
        'subject': 'Erinnerung: Ihr Angebot {{ object.name }} von MOKA',
        'body_html': (
            '<div><p>Guten Tag <t t-out="object.partner_id.name or \'\'"/>,</p>'
            '<p>vor einigen Tagen haben wir Ihnen unser Angebot <strong t-out="object.name"/> gesendet. '
            'Wir möchten kurz nachfragen, ob Sie noch Fragen dazu haben.</p>'
            '<p>Sie können das Angebot bequem online ansehen, annehmen und unterschreiben:</p>'
            '<p><a t-att-href="object.get_base_url() + object.get_portal_url()" '
            'style="display:inline-block;padding:10px 16px;border-radius:6px;background:#2e7d32;color:#fff;text-decoration:none;font-weight:bold">'
            'Angebot ansehen</a></p>'
            '<p>Antworten Sie gerne einfach auf diese E-Mail, wenn wir etwas anpassen sollen.</p>'
            + SIGNATURE + '</div>'
        ),
    },
}
