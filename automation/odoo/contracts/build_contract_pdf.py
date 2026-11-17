"""Renders docs/legal/Rahmenvertrag.md to a PDF for Odoo Sign and reports where the signature
block sits (as page ratios), so setup.py can place the Sign fields exactly there.

Usage: python3 build_contract_pdf.py <markdown> <output.pdf> [logo]  → prints JSON with field positions.
"""
import json, re, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Flowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer

W, H = A4
base = ParagraphStyle('base', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=4)
styles = {
    'h1': ParagraphStyle('h1', parent=base, fontName='Helvetica-Bold', fontSize=16, leading=20, spaceAfter=10),
    'h2': ParagraphStyle('h2', parent=base, fontName='Helvetica-Bold', fontSize=11, leading=15, spaceBefore=8, spaceAfter=4),
    'li': ParagraphStyle('li', parent=base, leftIndent=14, firstLineIndent=-10),
}
POSITIONS = {}


class SignatureBlock(Flowable):
    """Name, date and signature lines; remembers its page and coordinates."""

    def wrap(self, aw, ah):
        self.width = aw
        return aw, 120

    def draw(self):
        c = self.canv
        page = c.getPageNumber()
        x0, y0 = c.absolutePosition(0, 0)
        c.setFont('Helvetica-Bold', 10)
        c.drawString(0, 108, 'Auftraggeber')
        c.setFont('Helvetica', 9)
        rows = [('name', 'Name / Firma', 80, 0, 260), ('date', 'Datum', 80, 300, 160), ('signature', 'Unterschrift', 20, 0, 260)]
        for key, label, y, x, w in rows:
            c.line(x, y, x + w, y)
            c.drawString(x, y - 11, label)
            box_h = 40 if key == 'signature' else 16
            # Odoo Sign: top-left corner and size as ratios of the page.
            POSITIONS[key] = {'page': page, 'posX': (x0 + x) / W, 'posY': (H - (y0 + y + box_h)) / H,
                              'width': w / W, 'height': box_h / H}


def inline(text):
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)


def build(md_path, out_path, logo=None):
    story = []
    for raw in open(md_path, encoding='utf-8').read().split('\n'):
        line = raw.strip()
        if not line or line.startswith('>') or line == '---':
            continue
        if line.startswith('**Auftraggeber**'):
            break  # replaced by the signature block below
        if line.startswith('# '):
            story.append(Paragraph(inline(line[2:]), styles['h1']))
        elif line.startswith('## '):
            story.append(Paragraph(inline(line[3:]), styles['h2']))
        elif re.match(r'^\d+\. ', line):
            num, rest = line.split(' ', 1)
            story.append(Paragraph(f'{num} {inline(rest)}', styles['li']))
        else:
            story.append(Paragraph(inline(line), base))
    story.append(Spacer(1, 18))
    story.append(KeepTogether([SignatureBlock()]))

    def footer(c, doc):
        if logo and doc.page == 1:
            from reportlab.lib.utils import ImageReader
            img = ImageReader(logo)
            iw, ih = img.getSize()
            w = 48 * mm
            c.drawImage(img, W - 20 * mm - w, H - 8 * mm - w * ih / iw, width=w, height=w * ih / iw)
        c.setFont('Helvetica', 8)
        c.drawString(20 * mm, 12 * mm, 'Moka Service UG (haftungsbeschränkt) · Lietzenburger Straße 29 · 10789 Berlin · info@moka-objektservice.de')
        c.drawRightString(W - 20 * mm, 12 * mm, f'Seite {doc.page}')

    SimpleDocTemplate(out_path, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=(42 if logo else 20) * mm,
                      bottomMargin=22 * mm, title='Rahmenvertrag MOKA Objektservice',
                      author='Moka Service UG').build(story, onFirstPage=footer, onLaterPages=footer)
    return POSITIONS


if __name__ == '__main__':
    print(json.dumps(build(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)))
