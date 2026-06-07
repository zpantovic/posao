import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Adresnica } from '../services/api.service';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@Component({
  selector: 'app-adresnice',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './adresnice.component.html',
  styleUrl: './adresnice.component.css'
})
export class AdresnicePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  country = '';
  countryName = '';
  phonePrefix = '';
  currency = '';
  flag = '';

  adresnice: Adresnica[] = [];
  searchQuery = '';
  selectedMap: { [id: string]: boolean } = {};

  editingId: string | null = null;
  form = { imePrezime: '', adresa: '', telefon: '', otkup: '', napomena: '' };

  ngOnInit() {
    this.country = this.route.snapshot.url[0].path;

    if (!sessionStorage.getItem(`auth_${this.country}`)) {
      this.router.navigate(['/']);
      return;
    }

    if (this.country === 'bih') {
      this.countryName = 'Bosna i Hercegovina';
      this.phonePrefix = '+387';
      this.currency = 'KM';
      this.flag = '🇧🇦';
    } else {
      this.countryName = 'Crna Gora';
      this.phonePrefix = '+382';
      this.currency = 'EUR';
      this.flag = '🇲🇪';
    }

    this.load();
  }

  load() {
    this.api.getAll(this.country).subscribe(data => this.adresnice = data);
  }

  get filtered() {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.adresnice;
    return this.adresnice.filter(a =>
      a.imePrezime.toLowerCase().includes(q) ||
      a.adresa.toLowerCase().includes(q) ||
      a.telefon.includes(q)
    );
  }

  get selectedCount() {
    return Object.values(this.selectedMap).filter(Boolean).length;
  }

  isSelected(id: string) { return !!this.selectedMap[id]; }

  toggleSelect(id: string) {
    this.selectedMap = { ...this.selectedMap, [id]: !this.selectedMap[id] };
  }

  selectAll() {
    const m: { [id: string]: boolean } = {};
    this.filtered.forEach(a => { m[a._id!] = true; });
    this.selectedMap = m;
  }

  deselectAll() { this.selectedMap = {}; }

  formatPhone(raw: string): string {
    let p = raw.replace(/\s/g, '').trim();
    if (!p) return '';
    if (p.startsWith('+')) return p;
    if (p.startsWith('0')) p = p.substring(1);
    return `${this.phonePrefix}${p}`;
  }

  formatOtkup(raw: string): string {
    const t = raw.replace(/\s*(KM|EUR)\s*$/i, '').trim();
    if (!t) return `0.00 ${this.currency}`;
    const n = parseFloat(t);
    return isNaN(n) ? `${t} ${this.currency}` : `${n.toFixed(2)} ${this.currency}`;
  }

  submit() {
    if (!this.form.imePrezime.trim() || !this.form.adresa.trim() || !this.form.telefon.trim()) return;

    const data = {
      imePrezime: this.form.imePrezime.trim(),
      adresa: this.form.adresa.trim(),
      telefon: this.formatPhone(this.form.telefon),
      otkup: this.formatOtkup(this.form.otkup),
      napomena: this.form.napomena.trim(),
    };

    if (this.editingId) {
      this.api.update(this.country, this.editingId, data).subscribe(() => {
        this.resetForm();
        this.load();
      });
    } else {
      this.api.create(this.country, data).subscribe(() => {
        this.resetForm();
        this.load();
      });
    }
  }

  editItem(a: Adresnica) {
    this.editingId = a._id!;
    this.form = {
      imePrezime: a.imePrezime,
      adresa: a.adresa,
      telefon: a.telefon,
      otkup: a.otkup,
      napomena: a.napomena || ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteItem(id: string) {
    if (!confirm('Obrisati ovu adresnicu?')) return;
    this.api.delete(this.country, id).subscribe(() => {
      delete this.selectedMap[id];
      this.load();
    });
  }

  resetForm() {
    this.editingId = null;
    this.form = { imePrezime: '', adresa: '', telefon: '', otkup: '', napomena: '' };
  }

  printItems(items: Adresnica[]) {
    if (!items.length) return;

    const pages: Adresnica[][] = [];
    for (let i = 0; i < items.length; i += 4) {
      pages.push(items.slice(i, i + 4));
    }

    const pagesHtml = pages.map(page => {
      const slots = [...page];
      while (slots.length < 4) {
        slots.push({ imePrezime: '', adresa: '', telefon: '', otkup: '', napomena: '' });
      }
      return `<div class="page">${slots.map(a => `
        <div class="slot${!a.imePrezime ? ' empty' : ''}">
          ${a.imePrezime ? `
          <div class="row"><span class="lbl">Primalac</span><span class="val name">${escHtml(a.imePrezime)}</span></div>
          <div class="row"><span class="lbl">Adresa</span><span class="val">${escHtml(a.adresa)}</span></div>
          <div class="row"><span class="lbl">Telefon</span><span class="val">${escHtml(a.telefon)}</span></div>
          <div class="divider"></div>
          <div class="row"><span class="lbl">Otkup</span><span class="val otkup">${escHtml(a.otkup)}</span></div>
          ${a.napomena ? `<div class="row"><span class="lbl">Napomena</span><span class="val note">${escHtml(a.napomena)}</span></div>` : ''}
          ` : ''}
        </div>`).join('')}
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8">
<meta name="viewport" content="width=1260, initial-scale=1">
<title>Adresnice - štampa</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 landscape; margin: 0; }
  html { margin: 0; padding: 0; }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 297mm;
    height: 210mm;
    display: grid;
    grid-template-columns: 148.5mm 148.5mm;
    grid-template-rows: 105mm 105mm;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
  }
  .page:last-child { page-break-after: avoid; break-after: avoid; }
  .slot {
    width: 148.5mm;
    height: 105mm;
    padding: 8mm 12mm;
    border: 0.5pt dashed #bbb;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5pt;
    overflow: hidden;
  }
  .slot.empty { background: #fafafa; }
  .row { display: flex; flex-direction: column; gap: 1pt; }
  .lbl { font-size: 7pt; color: #999; text-transform: uppercase; letter-spacing: 0.4px; }
  .val { font-size: 11pt; color: #111; line-height: 1.3; }
  .val.name { font-size: 15pt; font-weight: 700; }
  .divider { height: 1px; background: #ddd; margin: 3pt 0; }
  .val.otkup { font-size: 15pt; font-weight: 700; border: 1.5pt solid #333; display: inline-block; padding: 2pt 8pt; border-radius: 3pt; }
  .val.note { font-size: 9pt; color: #555; font-style: italic; }
  @media screen {
    body { background: #e8eaf0; padding: 16px; }
    .notice {
      background: #fff8e1;
      border: 1.5px solid #f9a825;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 16px;
      font-size: 11pt;
      max-width: 800px;
      line-height: 1.6;
    }
    .page { margin-bottom: 16px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  }
  @media print {
    .notice { display: none; }
    body { background: none; padding: 0; }
  }
</style>
</head><body>
<div class="notice">
  &#9888; <strong>Pre štampe u dijalogu obavezno postaviti:</strong>
  &nbsp;|&nbsp; Margine: <strong>Nema (None)</strong>
  &nbsp;|&nbsp; Razmera: <strong>100%</strong> (ne "Fit to page")
  &nbsp;|&nbsp; Veličina: <strong>A4 Landscape</strong>
</div>
${pagesHtml}</body></html>`;

    const win = window.open('', '_blank', 'width=1400,height=960');
    if (!win) { alert('Dozvolite popup prozore u browseru i pokušajte ponovo.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 600);
  }

  printList() {
    const items = this.filtered;
    if (!items.length) return;

    const rows = items.map((a, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="bold">${escHtml(a.imePrezime)}</td>
        <td>${escHtml(a.adresa)}</td>
        <td>${escHtml(a.telefon)}</td>
        <td class="otkup">${escHtml(a.otkup)}</td>
        <td class="note">${escHtml(a.napomena || '')}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8">
<title>Lista adresnica</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; }
  h2 { font-size: 13pt; margin-bottom: 8mm; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f0f0; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; padding: 5pt 7pt; text-align: left; border: 1px solid #ccc; }
  td { padding: 5pt 7pt; border: 1px solid #ddd; vertical-align: top; font-size: 10pt; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: center; width: 24pt; color: #999; }
  .bold { font-weight: 700; }
  .otkup { font-weight: 700; white-space: nowrap; }
  .note { font-style: italic; color: #555; font-size: 9pt; }
</style>
</head><body>
<h2>${escHtml(this.countryName)} — lista adresnica (${items.length})</h2>
<table>
  <thead><tr>
    <th>#</th><th>Ime i prezime</th><th>Adresa</th><th>Telefon</th><th>Otkup</th><th>Napomena</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;

    const win = window.open('', '_blank', 'width=960,height=720');
    if (!win) { alert('Dozvolite popup prozore u browseru i pokušajte ponovo.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 600);
  }

  printSelected() {
    const items = this.adresnice.filter(a => this.selectedMap[a._id!]);
    this.printItems(items);
  }

  deleteSelected() {
    const ids = Object.keys(this.selectedMap).filter(id => this.selectedMap[id]);
    if (!ids.length) return;
    if (!confirm(`Obrisati ${ids.length} selektovanih adresnica?`)) return;
    let done = 0;
    for (const id of ids) {
      this.api.delete(this.country, id).subscribe(() => {
        done++;
        if (done === ids.length) {
          this.selectedMap = {};
          this.load();
        }
      });
    }
  }

  goBack() { this.router.navigate(['/']); }
}
