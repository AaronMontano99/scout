import ExcelJS from 'exceljs';
import { getHotList } from '@/data/sdr';
import { NEXT_ACTION_LABEL, STAGE_LABEL, actionFlag, isActive, sortHotList, ymd, type HotListEntry } from '@/domain/hot-list';

// Hot List as an .xlsx tracker: filter dropdowns on every column,
// priority/stage/next-action dropdowns for editing, action flags, and a
// legend tab. Same content as /hot-list, for when a spreadsheet is
// handier.

export const dynamic = 'force-dynamic';

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: 'Action Flag', key: 'flag', width: 12 },
  { header: 'Priority', key: 'priority', width: 10 },
  { header: 'Stage', key: 'stage', width: 18 },
  { header: 'Company', key: 'company', width: 28 },
  { header: 'Contact / Title', key: 'contact', width: 26 },
  { header: 'Why Qualified In', key: 'why', width: 44 },
  { header: 'Last Meaningful Interaction', key: 'last', width: 44 },
  { header: 'What I Learned', key: 'learned', width: 44 },
  { header: 'Current Hypothesis', key: 'hypothesis', width: 44 },
  { header: 'Next Question', key: 'question', width: 44 },
  { header: 'Next Action', key: 'action', width: 12 },
  { header: 'Next Touch Date', key: 'date', width: 14 },
  { header: 'Angle', key: 'angle', width: 24 },
  { header: 'Meeting Hypothesis (15 min)', key: 'meeting', width: 44 },
];

const FLAG_FILL: Record<string, string> = { 'ACT NOW': 'FFFDECEC', DUE: 'FFFFF1D6', 'SET DATE': 'FFFFF1D6', UPCOMING: 'FFE0EDFF', LATER: 'FFF0F0F3' };
const PRIORITY_FILL: Record<string, string> = { HIGH: 'FFDCFCE7', MEDIUM: 'FFE0EDFF', LOW: 'FFF0F0F3' };

function addSheet(wb: ExcelJS.Workbook, name: string, entries: HotListEntry[], today: string, extra?: { header: string; key: string; width: number }) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }] });
  ws.columns = extra ? [...COLUMNS, extra] : COLUMNS;
  for (const e of entries) {
    ws.addRow({
      flag: isActive(e.stage) ? actionFlag(e.nextTouchDate, today) : '',
      priority: e.priority,
      stage: STAGE_LABEL[e.stage],
      company: e.accountName,
      contact: e.contact,
      why: e.whyQualified,
      last: e.lastInteraction,
      learned: e.learned,
      hypothesis: e.hypothesis,
      question: e.nextQuestion,
      action: NEXT_ACTION_LABEL[e.nextAction],
      date: e.nextTouchDate ?? '',
      angle: e.angle,
      meeting: e.meetingHypothesis,
      closeReason: e.closeReason,
    });
  }
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF171717' } };
  header.height = 20;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, entries.length + 1), column: ws.columns.length } };

  const lastRow = Math.max(entries.length + 1, 200);
  for (let r = 2; r <= lastRow; r++) {
    const row = ws.getRow(r);
    row.alignment = { vertical: 'top', wrapText: true };
    row.getCell('priority').dataValidation = { type: 'list', allowBlank: true, formulae: ['"HIGH,MEDIUM,LOW"'] };
    row.getCell('stage').dataValidation = { type: 'list', allowBlank: true, formulae: [`"${Object.values(STAGE_LABEL).join(',')}"`] };
    row.getCell('action').dataValidation = { type: 'list', allowBlank: true, formulae: [`"${Object.values(NEXT_ACTION_LABEL).join(',')}"`] };
    if (r <= entries.length + 1) {
      const flag = row.getCell('flag').value as string;
      if (FLAG_FILL[flag]) row.getCell('flag').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FLAG_FILL[flag] } };
      const priority = row.getCell('priority').value as string;
      if (PRIORITY_FILL[priority]) row.getCell('priority').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIORITY_FILL[priority] } };
      row.getCell('company').font = { bold: true };
    }
  }
  return ws;
}

export async function GET(): Promise<Response> {
  const today = ymd(new Date());
  const all = getHotList();
  const active = sortHotList(all.filter((e) => isActive(e.stage)), today);
  const off = all.filter((e) => !isActive(e.stage)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Scout';
  addSheet(wb, 'HOT LIST', active, today);
  addSheet(wb, 'OFF LIST (booked + closed)', off, today, { header: 'Closed Because', key: 'closeReason', width: 40 });

  const legend = wb.addWorksheet('LEGEND');
  legend.columns = [
    { header: 'Term', key: 'term', width: 22 },
    { header: 'Meaning', key: 'meaning', width: 100 },
  ];
  legend.getRow(1).font = { bold: true };
  [
    ['Hot List', 'Qualified-IN accounts you are earning a meeting with. Booked meetings and closed accounts move to the OFF LIST tab.'],
    ['ACT NOW', 'Next touch is today or overdue. Work these first.'],
    ['DUE', 'Next touch in the next 2 days.'],
    ['UPCOMING', 'Next touch within a week.'],
    ['LATER', 'Next touch more than a week out.'],
    ['SET DATE', 'No next-touch date yet. Give it one.'],
    ['HIGH', 'Active project, warm referral, known unresolved pain, contract/timing event, or a real next-step path to a meeting.'],
    ['MEDIUM', 'Strong ICP + credible use case, but timing/pain not confirmed yet.'],
    ['LOW', 'Generic fit, stale notes, repeated no-pickups, unclear ownership, or no current reason to engage.'],
    ['Stages', 'New QI → Developing → Warm → Meeting ask ready → Meeting booked (off list). Closed / recycle = no authority, no timing, or confirmed no opportunity.'],
    ['Every row', 'What did I learn last time, and what do I need to learn next to earn the meeting?'],
    ['Exported', `${new Date().toLocaleString()}. Edits here do not sync back to Scout.`],
  ].forEach(([term, meaning]) => legend.addRow({ term, meaning }));
  legend.getColumn('meaning').alignment = { wrapText: true, vertical: 'top' };

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Hot_List_${today}.xlsx"`,
    },
  });
}
