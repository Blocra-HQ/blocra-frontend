import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

// Word (.docx) version of the contract-analysis report. It carries the same
// content as PDFReportService: title, contract, chain, key metrics and the
// AI report text. Charts are not included (neither report embeds them).

export interface DocxReportInput {
  contractAddress: string;
  contractName: string;
  contractInfo: any;
  stats: any;
  aiReport: string;
  chainName: string;
}

const FONT = 'Calibri';

/** Splits `**bold**` spans into runs. */
function inlineRuns(text: string, base: { size?: number; bold?: boolean } = {}): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part) => {
    const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
    return new TextRun({
      text: bold ? part.slice(2, -2) : part,
      bold: base.bold || bold,
      size: base.size ?? 22,
      font: FONT,
    });
  });
}

/** Turns the report text (markdown or the "**Title**" / "•" plain style) into paragraphs. */
function reportParagraphs(report: string): Paragraph[] {
  const out: Paragraph[] = [];
  for (const raw of report.split('\n')) {
    const line = raw.trim();
    if (!line || /^[-*_]{3,}$/.test(line)) continue;

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(
        new Paragraph({
          heading: level <= 2 ? HeadingLevel.HEADING_1 : level === 3 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: heading[2].replace(/\*\*/g, ''), font: FONT })],
        }),
      );
      continue;
    }

    if (/^\*\*[^*]+\*\*:?$/.test(line)) {
      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: line.replace(/\*\*/g, '').replace(/:$/, ''), font: FONT })],
        }),
      );
      continue;
    }

    const bullet = line.match(/^(?:[-*•])\s+(.*)$/);
    if (bullet) {
      out.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: inlineRuns(bullet[1]) }));
      continue;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      out.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 60 },
          children: [new TextRun({ text: `${numbered[1]}. `, size: 22, font: FONT }), ...inlineRuns(numbered[2])],
        }),
      );
      continue;
    }

    out.push(new Paragraph({ spacing: { after: 120 }, children: inlineRuns(line) }));
  }
  return out;
}

const centered = (text: string, opts: { size?: number; bold?: boolean; italics?: boolean; mono?: boolean } = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({
        text,
        size: opts.size ?? 22,
        bold: opts.bold,
        italics: opts.italics,
        font: opts.mono ? 'Courier New' : FONT,
      }),
    ],
  });

export class DocumentService {
  static buildDocxReport(input: DocxReportInput): Document {
    const { contractAddress, contractName, contractInfo, stats, aiReport, chainName } = input;
    const metrics: [string, string | number][] = [
      ['Total Events', stats?.totalEvents ?? 0],
      ['Unique Users', stats?.uniqueUsers ?? 0],
      ['Total Transactions', stats?.totalTransactions ?? 0],
      ['Block Range', `${stats?.dateRange?.span ?? 0} blocks`],
      ['Activity Status', stats?.isActive ? 'Active' : 'Low Activity'],
    ];

    const body =
      aiReport && typeof aiReport === 'string'
        ? reportParagraphs(aiReport)
        : [new Paragraph({ children: [new TextRun({ text: 'Report content not available', bold: true, font: FONT })] })];

    return new Document({
      creator: 'BlocRA',
      title: `${contractName || 'Contract'} analysis`,
      description: `${chainName} contract analysis report`,
      sections: [
        {
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
              children: [new TextRun({ text: `${chainName.toUpperCase()} CONTRACT ANALYSIS REPORT`, font: FONT })],
            }),
            centered(`Contract: ${contractName || 'Unknown'}`, { size: 28, bold: true }),
            centered(`Address: ${contractAddress}`, { size: 20, mono: true }),
            centered(`Chain: ${chainName}`),
            centered(`Type: ${contractInfo?.contractType || 'Unknown Contract'}`),
            centered(`Generated: ${new Date().toLocaleDateString()}`, { italics: true }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 120 },
              children: [new TextRun({ text: 'Key Metrics Overview', font: FONT })],
            }),
            ...metrics.map(
              ([label, value]) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: `${label}: `, bold: true, size: 22, font: FONT }),
                    new TextRun({ text: String(value), size: 22, font: FONT }),
                  ],
                }),
            ),

            ...body,

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 600 },
              children: [
                new TextRun({
                  text: 'Generated by BlocRA from on-chain data and AI-assisted analysis.',
                  size: 18,
                  italics: true,
                  color: '6b7280',
                  font: FONT,
                }),
              ],
            }),
          ],
        },
      ],
    });
  }

  static async generateDocxReport(input: DocxReportInput): Promise<Blob> {
    const blob = await Packer.toBlob(DocumentService.buildDocxReport(input));
    // Packer.toBlob sets no MIME type; give the file the Word one.
    return new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }
}
