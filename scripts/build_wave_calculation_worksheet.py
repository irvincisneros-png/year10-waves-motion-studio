from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "worksheets" / "Year 10 Wave Equation Calculations.docx"

FONT = "Lexend"
NAVY = "173B4D"
TEAL = "087F8C"
VIOLET = "6B4BB8"
PALE_TEAL = "EAF7F7"
PALE_VIOLET = "F2EEFB"
PALE_GREY = "F4F6F7"
MID_GREY = "5C6B73"
LINE = "B6C4CA"


def set_font(run, size=None, bold=None, color=None):
    run.font.name = FONT
    run._element.get_or_add_rPr().rFonts.set(qn("w:ascii"), FONT)
    run._element.get_or_add_rPr().rFonts.set(qn("w:hAnsi"), FONT)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color is not None:
        run.font.color.rgb = RGBColor.from_string(color)


def shade_paragraph(paragraph, fill, border=None):
    p_pr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    p_pr.append(shd)
    if border:
        p_bdr = OxmlElement("w:pBdr")
        for edge in ("top", "left", "bottom", "right"):
            tag = OxmlElement(f"w:{edge}")
            tag.set(qn("w:val"), "single")
            tag.set(qn("w:sz"), "10")
            tag.set(qn("w:space"), "6")
            tag.set(qn("w:color"), border)
            p_bdr.append(tag)
        p_pr.append(p_bdr)


def keep_with_next(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def set_cell_margins(cell, top=90, start=120, bottom=90, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths_dxa):
    total = sum(widths_dxa)
    table.autofit = False
    tbl_pr = table._tbl.tblPr
    tbl_w = tbl_pr.first_child_found_in("w:tblW")
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(total))
    tbl_w.set(qn("w:type"), "dxa")
    tbl_ind = tbl_pr.first_child_found_in("w:tblInd")
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")
    grid = table._tbl.tblGrid
    for child in list(grid):
        grid.remove(child)
    for width in widths_dxa:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)
    for row in table.rows:
        for cell, width in zip(row.cells, widths_dxa):
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.first_child_found_in("w:tcW")
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(width))
            tc_w.set(qn("w:type"), "dxa")
            set_cell_margins(cell)


def mark_header_row(row):
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def add_callout(doc, label, text, fill=PALE_TEAL, border=TEAL):
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.space_before = Pt(4)
    paragraph.paragraph_format.space_after = Pt(7)
    paragraph.paragraph_format.left_indent = Cm(0.15)
    paragraph.paragraph_format.right_indent = Cm(0.15)
    paragraph.paragraph_format.line_spacing = 1.12
    shade_paragraph(paragraph, fill, border)
    set_font(paragraph.add_run(f"{label}  "), size=10.5, bold=True, color=border)
    set_font(paragraph.add_run(text), size=10.5, color=NAVY)
    return paragraph


def add_question(doc, number, prompt, hint=None, lines=2):
    heading = doc.add_paragraph()
    heading.paragraph_format.space_before = Pt(6)
    heading.paragraph_format.space_after = Pt(2)
    heading.paragraph_format.keep_with_next = True
    set_font(heading.add_run(f"{number}. "), size=10.5, bold=True, color=TEAL)
    set_font(heading.add_run(prompt), size=10.5, bold=True, color=NAVY)
    if hint:
        hint_p = doc.add_paragraph()
        hint_p.paragraph_format.space_after = Pt(1)
        hint_p.paragraph_format.left_indent = Cm(0.55)
        hint_p.paragraph_format.keep_with_next = True
        set_font(hint_p.add_run(hint), size=9, color=MID_GREY)
    for _ in range(lines):
        line = doc.add_paragraph("________________________________________________________________________________")
        line.paragraph_format.space_before = Pt(0)
        line.paragraph_format.space_after = Pt(1)
        line.paragraph_format.left_indent = Cm(0.55)
        set_font(line.runs[0], size=8.5, color=LINE)


def add_page_footer(section):
    footer = section.footer
    paragraph = footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_before = Pt(4)
    set_font(paragraph.add_run("Woonona High School Science  •  Year 10 Waves  •  Wave equation practice"), size=8.5, color=MID_GREY)


def build():
    doc = Document()
    section = doc.sections[0]
    # Named override: Australian classroom A4, compact 16 mm margins.
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin = Cm(1.6)
    section.right_margin = Cm(1.6)
    section.header_distance = Cm(0.7)
    section.footer_distance = Cm(0.7)
    add_page_footer(section)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT
    normal._element.rPr.rFonts.set(qn("w:ascii"), FONT)
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(NAVY)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.15
    for name, size, before, after, color in (
        ("Heading 1", 15, 10, 5, TEAL),
        ("Heading 2", 12, 8, 4, VIOLET),
        ("Heading 3", 11, 6, 3, NAVY),
    ):
        style = styles[name]
        style.font.name = FONT
        style._element.rPr.rFonts.set(qn("w:ascii"), FONT)
        style._element.rPr.rFonts.set(qn("w:hAnsi"), FONT)
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    kicker = doc.add_paragraph()
    kicker.paragraph_format.space_after = Pt(2)
    set_font(kicker.add_run("YEAR 10 WAVES  •  CALCULATION WORKSHEET"), size=9, bold=True, color=VIOLET)
    title = doc.add_paragraph()
    title.paragraph_format.space_after = Pt(3)
    set_font(title.add_run("Wave speed, frequency and wavelength"), size=21, bold=True, color=NAVY)
    subtitle = doc.add_paragraph()
    subtitle.paragraph_format.space_after = Pt(8)
    set_font(subtitle.add_run("A short, scaffolded follow-up to the WaveMotion simulator practical"), size=10.5, color=MID_GREY)

    identity = doc.add_table(rows=1, cols=3)
    identity.style = "Table Grid"
    set_table_geometry(identity, [4300, 2500, 2500])
    mark_header_row(identity.rows[0])
    for cell, text in zip(identity.rows[0].cells, ("Name: __________________________", "Class: __________", "Date: __________")):
        cell.vertical_alignment = 1
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        set_font(p.add_run(text), size=9.5, bold=True, color=NAVY)

    doc.add_heading("1  The two formulas", level=1)
    formula = doc.add_paragraph()
    formula.alignment = WD_ALIGN_PARAGRAPH.CENTER
    formula.paragraph_format.space_before = Pt(4)
    formula.paragraph_format.space_after = Pt(5)
    shade_paragraph(formula, PALE_TEAL, TEAL)
    set_font(formula.add_run("Find speed:   v = f × λ       |       Find wavelength:   λ = v ÷ f"), size=15, bold=True, color=NAVY)
    key = doc.add_paragraph()
    key.alignment = WD_ALIGN_PARAGRAPH.CENTER
    key.paragraph_format.space_after = Pt(7)
    set_font(key.add_run("v = wave speed (m/s)     f = frequency (Hz)     λ = wavelength (m)"), size=9.5, color=MID_GREY)
    add_callout(doc, "Three-step method", "1  Write the formula.   2  Substitute the numbers.   3  Calculate and include the unit.")

    doc.add_heading("2  Worked example — find wavelength", level=1)
    context = doc.add_paragraph()
    context.paragraph_format.space_after = Pt(5)
    set_font(context.add_run("In the simulator, a rope wave travels at 4 m/s and has a frequency of 2 Hz. Find its wavelength."), size=10.5, color=NAVY)
    worked = [
        ("1  Formula", "λ = v ÷ f"),
        ("2  Substitute", "λ = 4 ÷ 2"),
        ("3  Calculate", "λ = 2 m"),
    ]
    table = doc.add_table(rows=4, cols=2)
    table.style = "Table Grid"
    set_table_geometry(table, [2200, 7100])
    mark_header_row(table.rows[0])
    for cell, text in zip(table.rows[0].cells, ("Step", "Working")):
        cell.vertical_alignment = 1
        cell.paragraphs[0].paragraph_format.space_after = Pt(0)
        shade = OxmlElement("w:shd")
        shade.set(qn("w:fill"), PALE_GREY)
        cell._tc.get_or_add_tcPr().append(shade)
        set_font(cell.paragraphs[0].add_run(text), size=9, bold=True, color=NAVY)
    for row, (label, value) in zip(table.rows[1:], worked):
        row.cells[0].vertical_alignment = 1
        row.cells[1].vertical_alignment = 1
        for cell in row.cells:
            cell.paragraphs[0].paragraph_format.space_after = Pt(0)
        shade = OxmlElement("w:shd")
        shade.set(qn("w:fill"), PALE_VIOLET)
        row.cells[0]._tc.get_or_add_tcPr().append(shade)
        set_font(row.cells[0].paragraphs[0].add_run(label), size=9.5, bold=True, color=VIOLET)
        set_font(row.cells[1].paragraphs[0].add_run(value), size=11, bold=True, color=NAVY)

    doc.add_heading("3  Your turn — find wave speed", level=1)
    add_callout(doc, "Use", "v = f × λ", fill=PALE_GREY, border=TEAL)
    add_question(doc, 1, "f = 2 Hz and λ = 3 m. Find v.", "v = ____ × ____ = ____ m/s", lines=1)
    add_question(doc, 2, "f = 5 Hz and λ = 2 m. Find v.", "v = ____ × ____ = ____ m/s", lines=1)
    add_question(doc, 3, "Simulation result: f = 4 Hz and λ = 1 m. Find v.", "Write the formula first.", lines=1)
    add_question(doc, 4, "A wave has f = 2.5 Hz and λ = 4 m. Find v.", "Decimal values work the same way.", lines=1)

    doc.add_page_break()
    page_kicker = doc.add_paragraph()
    page_kicker.paragraph_format.space_after = Pt(1)
    set_font(page_kicker.add_run("WAVE EQUATION PRACTICE  •  PAGE 2"), size=9, bold=True, color=VIOLET)
    page_title = doc.add_paragraph()
    page_title.paragraph_format.space_after = Pt(5)
    set_font(page_title.add_run("Find wavelength and choose the right formula"), size=18, bold=True, color=NAVY)

    doc.add_heading("4  Find wavelength", level=1)
    add_callout(doc, "Use", "λ = v ÷ f", fill=PALE_GREY, border=VIOLET)
    add_question(doc, 5, "Rope wave: v = 4 m/s and f = 1 Hz. Find λ.", "λ = ____ ÷ ____ = ____ m", lines=2)
    add_question(doc, 6, "Rope wave: v = 4 m/s and f = 4 Hz. Find λ.", "Compare this with Question 5: higher frequency gives a shorter wavelength.", lines=2)
    add_question(doc, 7, "Sound wave: v = 343 m/s and f = 343 Hz. Find λ.", "Keep m/s and Hz in the substitution.", lines=2)
    add_question(doc, 8, "Water wave: v = 6 m/s and f = 2.5 Hz. Find λ.", "Use your calculator, then write the answer in metres.", lines=2)

    doc.add_heading("5  Mixed practice", level=1)
    add_question(doc, 9, "A radio wave in vacuum travels at 300,000,000 m/s and has a frequency of 100,000,000 Hz. Find λ.", "Choose the wavelength formula. The large numbers divide to a simple answer.", lines=2)
    add_question(doc, 10, "A wave has f = 8 Hz and λ = 0.5 m. Find v.", "Choose the speed formula.", lines=2)

    doc.add_heading("6  Link back to the simulator", level=1)
    add_question(doc, 11, "Amplitude changed the height of the wave. Why is amplitude not included in v = fλ for this investigation?", "One sentence: describe what happened to speed when amplitude changed.", lines=3)
    add_callout(doc, "Check before you finish", "Did you write the formula, substitute the numbers, calculate, and include m/s or m?", fill=PALE_TEAL, border=TEAL)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
