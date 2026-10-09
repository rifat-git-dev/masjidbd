/**
 * pdf.js — MasjidBD Document Generation
 * Generates 9 official document types using html2canvas + jsPDF
 * Depends on: html2canvas (loaded in index.html), jsPDF from CDN
 *
 * Documents:
 * 1. Mosque Registration Certificate
 * 2. Imam Appointment Letter
 * 3. Volunteer ID Card
 * 4. Donation Receipt
 * 5. Jumu'ah Attendance Record
 * 6. Annual Prayer Schedule (64-Zilla)
 * 7. Zakat Calculation Certificate
 * 8. Mosque Audit Report
 * 9. Madrasa Enrollment Certificate
 */

import { $, $$, showToast, fmtBDT, pad2 } from './utils.js';
import { computePrayers, ZILLA_OFFSETS, PRAYER_META } from './prayer-engine.js';

/* ─────────────────────────────────────────────
   jsPDF loader (CDN)
───────────────────────────────────────────── */
let jsPDFLib = null;

async function getJsPDF() {
  if (jsPDFLib) return jsPDFLib;
  if (window.jspdf?.jsPDF) {
    jsPDFLib = window.jspdf.jsPDF;
    return jsPDFLib;
  }

  // Dynamically load jsPDF
  await new Promise((resolve, reject) => {
    const script  = document.createElement('script');
    script.src    = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  jsPDFLib = window.jspdf.jsPDF;
  return jsPDFLib;
}

/* ─────────────────────────────────────────────
   Document templates
───────────────────────────────────────────── */
const DOC_TYPES = {
  registration: {
    id:    'registration',
    label: 'Mosque Registration Certificate',
    icon:  '📜',
    desc:  'Official registration certificate for the mosque',
    generate: generateRegistrationCert,
  },
  imam_letter: {
    id:    'imam_letter',
    label: 'Imam Appointment Letter',
    icon:  '📋',
    desc:  'Formal appointment letter for the Imam',
    generate: generateImamLetter,
  },
  volunteer_id: {
    id:    'volunteer_id',
    label: 'Volunteer ID Card',
    icon:  '🪪',
    desc:  'ID card for registered mosque volunteers',
    generate: generateVolunteerId,
  },
  donation_receipt: {
    id:    'donation_receipt',
    label: 'Donation Receipt',
    icon:  '🧾',
    desc:  'Official receipt for mosque donations',
    generate: generateDonationReceipt,
  },
  jumah_record: {
    id:    'jumah_record',
    label: "Jumu'ah Attendance Record",
    icon:  '📊',
    desc:  'Weekly Jumu\'ah attendance tracking sheet',
    generate: generateJumahRecord,
  },
  prayer_schedule: {
    id:    'prayer_schedule',
    label: 'Annual Prayer Schedule',
    icon:  '🕌',
    desc:  'Full year prayer timetable for selected district',
    generate: generatePrayerSchedule,
  },
  zakat_cert: {
    id:    'zakat_cert',
    label: 'Zakat Certificate',
    icon:  '💚',
    desc:  'Zakat calculation and payment certificate',
    generate: generateZakatCert,
  },
  audit_report: {
    id:    'audit_report',
    label: 'Mosque Audit Report',
    icon:  '📈',
    desc:  'Annual financial and operational audit template',
    generate: generateAuditReport,
  },
  madrasa_enroll: {
    id:    'madrasa_enroll',
    label: 'Madrasa Enrollment Certificate',
    icon:  '🎓',
    desc:  'Student enrollment certificate for madrasa',
    generate: generateMadrasaCert,
  },
};

/* ─────────────────────────────────────────────
   Init — render document tiles in dashboard
───────────────────────────────────────────── */
export function initPDF() {
  renderDocGrid();
}

function renderDocGrid() {
  const grid = $('#pdf-docs-grid');
  if (!grid) return;

  grid.innerHTML = Object.values(DOC_TYPES).map(doc => `
    <div class="pdf-doc-card" onclick="window._generateDoc('${doc.id}')">
      <div class="pdc-icon">${doc.icon}</div>
      <div class="pdc-info">
        <h4 class="pdc-label">${doc.label}</h4>
        <p class="pdc-desc">${doc.desc}</p>
      </div>
      <button class="pdc-btn">Generate</button>
    </div>
  `).join('');
}

window._generateDoc = async function(docId) {
  const doc = DOC_TYPES[docId];
  if (!doc) return;

  showToast(`Generating ${doc.label}…`);
  try {
    await doc.generate();
    showToast(`${doc.label} downloaded!`, 'success');
  } catch(e) {
    console.error(e);
    showToast('Failed to generate document', 'error');
  }
};

/* ─────────────────────────────────────────────
   Helper — create HTML template, capture with html2canvas, save PDF
───────────────────────────────────────────── */
async function htmlToPDF(htmlContent, filename, orientation = 'portrait') {
  const jsPDF = await getJsPDF();

  // Create off-screen div
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 794px; background: white; font-family: sans-serif;
    padding: 40px; color: #111; font-size: 13px; line-height: 1.6;
  `;
  div.innerHTML = htmlContent;
  document.body.appendChild(div);

  try {
    const canvas = await html2canvas(div, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = pageW / canvas.width;

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0, 0,
      pageW,
      canvas.height * ratio
    );

    pdf.save(filename);
  } finally {
    document.body.removeChild(div);
  }
}

/* ─────────────────────────────────────────────
   Common document header HTML
───────────────────────────────────────────── */
function docHeader(title, subtitle = '') {
  return `
    <div style="border-bottom: 3px solid #0B3D2E; padding-bottom: 16px; margin-bottom: 24px; display:flex; align-items:center; gap:16px;">
      <div style="width:60px; height:60px; background:#0B3D2E; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px;">🕌</div>
      <div>
        <div style="font-size:20px; font-weight:700; color:#0B3D2E;">MasjidBD</div>
        <div style="font-size:11px; color:#555;">মসজিদ ব্যবস্থাপনা প্ল্যাটফর্ম | Bangladesh National Mosque Platform</div>
        <div style="font-size:11px; color:#555;">Helpline: 16789 | masjidbd.gov.bd</div>
      </div>
      <div style="margin-left:auto; text-align:right;">
        <div style="font-size:18px; font-weight:700; color:#0B3D2E;">${title}</div>
        ${subtitle ? `<div style="font-size:12px; color:#555;">${subtitle}</div>` : ''}
        <div style="font-size:11px; color:#888;">Issued: ${new Date().toLocaleDateString('en-BD')}</div>
      </div>
    </div>
  `;
}

function docFooter() {
  return `
    <div style="border-top:1px solid #e5e7eb; margin-top:24px; padding-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#888;">
      <span>MasjidBD — Ministry of Religious Affairs, Bangladesh</span>
      <span>Document ID: MBD-${Date.now().toString(36).toUpperCase()}</span>
      <span>Verify at: masjidbd.gov.bd/verify</span>
    </div>
  `;
}

function signatureBlock(signatory = 'Mosque Administrator') {
  return `
    <div style="margin-top:40px; display:flex; justify-content:space-between;">
      <div style="text-align:center;">
        <div style="border-top:1px solid #333; width:140px; margin-bottom:4px;"></div>
        <div style="font-size:11px;">Signature of Imam</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333; width:140px; margin-bottom:4px;"></div>
        <div style="font-size:11px;">Signature of ${signatory}</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333; width:140px; margin-bottom:4px;"></div>
        <div style="font-size:11px;">Official Seal</div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   1. Mosque Registration Certificate
───────────────────────────────────────────── */
async function generateRegistrationCert() {
  const year = new Date().getFullYear();
  const html = `
    ${docHeader('MOSQUE REGISTRATION CERTIFICATE', 'Ref: MBD/REG/' + year)}
    <div style="text-align:center; background:#f0fdf4; border:2px solid #0B3D2E; border-radius:8px; padding:20px; margin-bottom:20px;">
      <div style="font-size:15px; color:#0B3D2E;">This is to certify that</div>
      <div style="font-size:24px; font-weight:700; color:#0B3D2E; margin:8px 0;">[Mosque Name]</div>
      <div style="font-size:13px; color:#555;">[Mosque Name in Bengali]</div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      ${[
        ['Registration Number', 'MBD/DHK/2024/0001'],
        ['District',           'Dhaka'],
        ['Division',           'Dhaka'],
        ['Address',            '[Full address here]'],
        ['Capacity',           '[Number] worshippers'],
        ['Land Area',          '[Area in decimal]'],
        ['Year Established',   '[Year]'],
        ['Registered Imam',    '[Imam Name]'],
        ['Registration Date',  new Date().toLocaleDateString('en-BD')],
        ['Valid Until',        new Date(Date.now() + 3*365*864e5).toLocaleDateString('en-BD')],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px; font-weight:600; color:#374151; width:40%;">${k}</td>
          <td style="padding:8px; color:#111;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <div style="background:#fefce8; border-left:4px solid #B8943A; padding:12px; font-size:12px; color:#555; margin-bottom:20px;">
      This mosque is officially registered under the Ministry of Religious Affairs, Government of Bangladesh,
      and is entitled to all benefits and responsibilities under the Mosque Management Act.
    </div>
    ${signatureBlock('District Islamic Affairs Officer')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'mosque-registration-certificate.pdf');
}

/* ─────────────────────────────────────────────
   2. Imam Appointment Letter
───────────────────────────────────────────── */
async function generateImamLetter() {
  const html = `
    ${docHeader('IMAM APPOINTMENT LETTER')}
    <p style="margin-bottom:16px;">Date: ${new Date().toLocaleDateString('en-BD', { day:'numeric', month:'long', year:'numeric' })}</p>
    <p>To,<br><strong>[Imam Full Name]</strong><br>[Address]</p>
    <br>
    <p><strong>Subject: Appointment as Imam of [Mosque Name]</strong></p>
    <br>
    <p>Dear [Imam Name],</p>
    <p>We are pleased to inform you that the Mosque Management Committee of <strong>[Mosque Name]</strong>,
    [District], Bangladesh, has decided to appoint you as the <strong>Khatib and Imam</strong>
    of this mosque effective from [Start Date].</p>
    <br>
    <p><strong>Terms of Appointment:</strong></p>
    <table style="width:100%; border-collapse:collapse; margin:12px 0;">
      ${[
        ['Position',       'Khatib and Imam'],
        ['Monthly Salary', fmtBDT(15000)],
        ['Accommodation',  'Provided by mosque'],
        ['Working Hours',  'Five daily prayers + Jumu\'ah khutbah'],
        ['Probation',      '3 months'],
        ['Contract Term',  '1 year, renewable'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px; font-weight:600; width:40%;">${k}</td>
          <td style="padding:8px;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <p>Please sign and return one copy of this letter as acknowledgement of your acceptance.</p>
    ${signatureBlock('Chairman, Mosque Management Committee')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'imam-appointment-letter.pdf');
}

/* ─────────────────────────────────────────────
   3. Volunteer ID Card
───────────────────────────────────────────── */
async function generateVolunteerId() {
  const year = new Date().getFullYear();
  // ID card is landscape / small, we'll do A4 with card preview
  const html = `
    ${docHeader('VOLUNTEER ID CARD', 'Print, cut and laminate')}
    <div style="display:flex; gap:20px; justify-content:center; margin:20px 0;">
      ${/* Front */ `
        <div style="width:220px; height:140px; border:2px solid #0B3D2E; border-radius:12px; padding:12px; background:linear-gradient(135deg,#0B3D2E,#1A6845); color:white; font-size:11px; position:relative;">
          <div style="font-weight:700; font-size:13px;">🕌 MasjidBD</div>
          <div style="font-size:9px; opacity:0.8; margin-bottom:8px;">Volunteer</div>
          <div style="font-size:22px; background:rgba(255,255,255,0.1); border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">👤</div>
          <div style="margin-top:6px; font-weight:700;">[Full Name]</div>
          <div style="font-size:10px; opacity:0.8;">[Mosque Name]</div>
          <div style="position:absolute; bottom:8px; right:12px; font-size:9px; opacity:0.6;">Valid: ${year}</div>
        </div>
      `}
      ${/* Back */ `
        <div style="width:220px; height:140px; border:2px solid #0B3D2E; border-radius:12px; padding:12px; background:white; font-size:11px;">
          <div style="font-weight:700; color:#0B3D2E; margin-bottom:8px;">Volunteer Information</div>
          <div>ID No: MBD-VOL-${year}-0001</div>
          <div>District: [District]</div>
          <div>Division: [Division]</div>
          <div>Blood Group: [Group]</div>
          <div>Phone: [Phone]</div>
          <div style="margin-top:8px; font-size:9px; color:#555;">
            If found, please return to<br>
            [Mosque Name], [District]<br>
            Helpline: 16789
          </div>
        </div>
      `}
    </div>
    ${signatureBlock('Volunteer Coordinator')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'volunteer-id-card.pdf');
}

/* ─────────────────────────────────────────────
   4. Donation Receipt
───────────────────────────────────────────── */
async function generateDonationReceipt() {
  const receiptNo = `MBD-${Date.now().toString(36).toUpperCase()}`;
  const html = `
    ${docHeader('DONATION RECEIPT', `Receipt No: ${receiptNo}`)}
    <div style="background:#f0fdf4; border:2px solid #0B3D2E; border-radius:8px; padding:20px; text-align:center; margin-bottom:20px;">
      <div style="font-size:14px; color:#555;">Amount Received</div>
      <div style="font-size:36px; font-weight:700; color:#0B3D2E;">৳ [Amount]</div>
      <div style="font-size:13px; color:#555;">[Amount in words] Taka Only</div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      ${[
        ['Donor Name',       '[Donor Full Name]'],
        ['Donor NID/Phone',  '[NID or Phone]'],
        ['Donation Type',    '[Zakat / Sadaqah / Fidyah / General]'],
        ['Purpose',          '[Campaign or General Fund]'],
        ['Payment Method',   '[bKash / Nagad / Bank Transfer / Cash]'],
        ['Transaction ID',   '[Transaction ID]'],
        ['Date & Time',      new Date().toLocaleString('en-BD')],
        ['Received By',      '[Name of receiver]'],
        ['Mosque',           '[Mosque Name], [District]'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px; font-weight:600; width:40%;">${k}</td>
          <td style="padding:8px;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <div style="background:#fefce8; border-left:4px solid #B8943A; padding:12px; font-size:12px; color:#555; margin-bottom:20px;">
      <strong>JazakAllah Khair!</strong> May Allah (SWT) accept your generous donation and bless you with
      abundant reward in this world and the Hereafter. This receipt is valid for tax exemption purposes.
    </div>
    ${signatureBlock('Treasurer')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'donation-receipt.pdf');
}

/* ─────────────────────────────────────────────
   5. Jumu'ah Attendance Record
───────────────────────────────────────────── */
async function generateJumahRecord() {
  const weeks = [];
  const now = new Date();
  // Generate last 8 Fridays
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (d.getDay() === 5 ? 0 : (d.getDay() + 2) % 7) - i * 7);
    weeks.push(d.toLocaleDateString('en-BD', { day:'numeric', month:'short', year:'numeric' }));
  }

  const html = `
    ${docHeader("JUMU'AH ATTENDANCE RECORD")}
    <div style="margin-bottom:16px;">
      <strong>Mosque:</strong> [Mosque Name] &nbsp;&nbsp;
      <strong>Month:</strong> ${now.toLocaleDateString('en-BD', { month:'long', year:'numeric' })}
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">
      <thead>
        <tr style="background:#0B3D2E; color:white;">
          <th style="padding:8px; text-align:left;">Date</th>
          <th style="padding:8px; text-align:center;">Khateeb</th>
          <th style="padding:8px; text-align:center;">Khutbah Topic</th>
          <th style="padding:8px; text-align:center;">Attendance</th>
          <th style="padding:8px; text-align:center;">Notes</th>
        </tr>
      </thead>
      <tbody>
        ${weeks.map((w, i) => `
          <tr style="background:${i%2?'#f9fafb':'white'}; border-bottom:1px solid #e5e7eb;">
            <td style="padding:8px;">${w}</td>
            <td style="padding:8px; text-align:center;">___________</td>
            <td style="padding:8px; text-align:center;">___________</td>
            <td style="padding:8px; text-align:center;">______</td>
            <td style="padding:8px; text-align:center;">___________</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${signatureBlock('Secretary')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'jumuah-attendance-record.pdf');
}

/* ─────────────────────────────────────────────
   6. Annual Prayer Schedule (simplified)
───────────────────────────────────────────── */
async function generatePrayerSchedule() {
  const year = new Date().getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Generate 1st-of-month times for Dhaka
  const rows = months.map((mon, mi) => {
    const date = new Date(year, mi, 1);
    const t = computePrayers('dhaka', date);
    return `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:6px; font-weight:600;">${mon}</td>
      ${Object.values(t).map(v => `<td style="padding:6px; text-align:center;">${v[0]}:${pad2(v[1])}</td>`).join('')}
    </tr>`;
  }).join('');

  const html = `
    ${docHeader(`${year} PRAYER SCHEDULE — DHAKA`, 'IFB Method | Times for 1st of each month')}
    <table style="width:100%; border-collapse:collapse; font-size:12px;">
      <thead>
        <tr style="background:#0B3D2E; color:white;">
          <th style="padding:8px;">Month</th>
          <th style="padding:8px;">Fajr</th>
          <th style="padding:8px;">Sunrise</th>
          <th style="padding:8px;">Dhuhr</th>
          <th style="padding:8px;">Asr</th>
          <th style="padding:8px;">Maghrib</th>
          <th style="padding:8px;">Isha</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:12px; font-size:11px; color:#555;">
      Note: Times are indicative. Add/subtract minutes for your district per the IFB zilla offset table.
    </div>
    ${docFooter()}
  `;
  await htmlToPDF(html, `prayer-schedule-dhaka-${year}.pdf`);
}

/* ─────────────────────────────────────────────
   7. Zakat Certificate
───────────────────────────────────────────── */
async function generateZakatCert() {
  const html = `
    ${docHeader('ZAKAT CALCULATION CERTIFICATE')}
    <div style="background:#f0fdf4; border:2px solid #0B3D2E; border-radius:8px; padding:16px; margin-bottom:20px; text-align:center;">
      <div style="font-size:22px;">💚</div>
      <div style="font-size:15px; font-weight:700; color:#0B3D2E;">Zakat Paid — Alhamdulillah</div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      ${[
        ['Payer Name',        '[Full Name]'],
        ['NID Number',        '[NID]'],
        ['Assessment Year',   `Hijri ${new Date().getFullYear() - 579} / Gregorian ${new Date().getFullYear()}`],
        ['Nisab (Gold)',      '87.48g gold equivalent'],
        ['Total Assets',      '৳ [Amount]'],
        ['Deductible Debts',  '৳ [Amount]'],
        ['Zakatable Wealth',  '৳ [Amount]'],
        ['Zakat Rate',        '2.5%'],
        ['Zakat Payable',     '৳ [Amount]'],
        ['Paid On',           new Date().toLocaleDateString('en-BD')],
        ['Paid To',           '[Mosque Name / Organisation]'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px; font-weight:600; width:40%;">${k}</td>
          <td style="padding:8px;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <div style="font-size:12px; color:#555; font-style:italic; margin-bottom:16px; text-align:center;" dir="rtl">
      خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا
    </div>
    ${signatureBlock('Zakat Collector')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'zakat-certificate.pdf');
}

/* ─────────────────────────────────────────────
   8. Mosque Audit Report (template)
───────────────────────────────────────────── */
async function generateAuditReport() {
  const year = new Date().getFullYear();
  const html = `
    ${docHeader(`ANNUAL MOSQUE AUDIT REPORT ${year}`)}
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      ${[
        ['Total Income',      '৳ [Amount]'],
        ['Total Expenditure', '৳ [Amount]'],
        ['Balance',           '৳ [Amount]'],
        ['Donors',            '[Number]'],
      ].map(([k,v]) => `
        <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px;">
          <div style="font-size:11px; color:#555;">${k}</div>
          <div style="font-size:20px; font-weight:700; color:#0B3D2E;">${v}</div>
        </div>
      `).join('')}
    </div>
    <h3 style="color:#0B3D2E; margin-bottom:8px;">Income Breakdown</h3>
    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px;">
      ${[
        ['Friday Collections',  '৳ [Amount]'],
        ['Donations & Zakat',   '৳ [Amount]'],
        ['Government Grant',    '৳ [Amount]'],
        ['Rental Income',       '৳ [Amount]'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px;">${k}</td>
          <td style="padding:6px; text-align:right;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <h3 style="color:#0B3D2E; margin-bottom:8px;">Expenditure Breakdown</h3>
    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px;">
      ${[
        ['Staff Salaries',     '৳ [Amount]'],
        ['Utilities',          '৳ [Amount]'],
        ['Maintenance',        '৳ [Amount]'],
        ['Religious Programs', '৳ [Amount]'],
        ['Charity/Zakat Dist','৳ [Amount]'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:6px;">${k}</td>
          <td style="padding:6px; text-align:right;">${v}</td>
        </tr>
      `).join('')}
    </table>
    ${signatureBlock('Auditor / Treasurer')}
    ${docFooter()}
  `;
  await htmlToPDF(html, `mosque-audit-report-${year}.pdf`);
}

/* ─────────────────────────────────────────────
   9. Madrasa Enrollment Certificate
───────────────────────────────────────────── */
async function generateMadrasaCert() {
  const html = `
    ${docHeader('MADRASA ENROLLMENT CERTIFICATE')}
    <div style="text-align:center; margin-bottom:20px;">
      <div style="font-size:48px; margin-bottom:8px;">🎓</div>
      <div style="font-size:15px; color:#555;">This is to certify that</div>
      <div style="font-size:24px; font-weight:700; color:#0B3D2E; margin:8px 0;">[Student Full Name]</div>
      <div style="font-size:13px; color:#555;">[Student Name in Bengali]</div>
      <div style="font-size:13px; color:#555; margin-top:4px;">
        Son/Daughter of <strong>[Father's Name]</strong>, [Address]
      </div>
    </div>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
      ${[
        ['Student ID',       'MBD-MDR-2024-0001'],
        ['Date of Birth',    '[DOB]'],
        ['Class/Level',      '[Class]'],
        ['Madrasa',          '[Madrasa Name], [District]'],
        ['Enrollment Date',  new Date().toLocaleDateString('en-BD')],
        ['Academic Year',    `${new Date().getFullYear()}-${new Date().getFullYear()+1}`],
        ['Previous Result',  '[Pass/Distinction]'],
        ['Hifz Status',      '[Juz completed]'],
      ].map(([k,v]) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px; font-weight:600; width:40%;">${k}</td>
          <td style="padding:8px;">${v}</td>
        </tr>
      `).join('')}
    </table>
    <div style="font-size:12px; color:#555; font-style:italic; margin-bottom:16px; text-align:center;" dir="rtl">
      طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
    </div>
    ${signatureBlock('Principal')}
    ${docFooter()}
  `;
  await htmlToPDF(html, 'madrasa-enrollment-certificate.pdf');
}
