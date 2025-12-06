import jsPDF from 'jspdf';

export class PDFReportService {
  static async generatePDFReport(
    contractAddress: string,
    contractName: string,
    contractInfo: any,
    stats: any,
    aiReport: string,
    chainName: string = 'STARKNET'
  ): Promise<Blob> {
    const pdf = new jsPDF();
    let yPos = 30;

    const addCenteredText = (text: string, size = 12, bold = false, yPosition?: number) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const textWidth = pdf.getTextWidth(text);
      const x = (210 - textWidth) / 2;
      pdf.text(text, x, yPosition || yPos);
      if (!yPosition) yPos += size * 0.5 + 3;
    };

    const addText = (text: string, size = 10, bold = false, indent = 0) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(size);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, 170 - indent);
      lines.forEach((line: string) => {
        pdf.text(line, 20 + indent, yPos);
        yPos += 6;
      });
      yPos += 2;
    };

    const addSection = (title: string) => {
      yPos += 8;
      addCenteredText(title, 14, true);
      yPos += 5;
    };

    // Header
    addCenteredText(`${chainName.toUpperCase()} CONTRACT ANALYSIS REPORT`, 18, true);
    addCenteredText(`Contract: ${contractName || 'Unknown'}`, 14);
    addCenteredText(`Address: ${contractAddress}`, 12);
    addCenteredText(`Type: ${contractInfo?.contractType || 'Unknown Contract'}`, 12);
    addCenteredText(`Generated: ${new Date().toLocaleDateString()}`, 12);

    yPos += 10;

    // Key Metrics Overview
    addSection('KEY METRICS OVERVIEW');
    addCenteredText(`• Total Events: ${stats?.totalEvents || 0} • Unique Users: ${stats?.uniqueUsers || 0} • Total Transactions: ${stats?.totalTransactions || 0} • Block Range: ${stats?.dateRange?.span || 0} blocks • Activity Status: ${stats?.isActive ? 'Active' : 'Low Activity'}`, 10);

    // Process AI Report sections
    if (aiReport && typeof aiReport === 'string') {
      const sections = aiReport.split('\n\n');

      sections.forEach(section => {
        if (section.trim()) {
          const lines = section.split('\n');
          const sectionTitle = lines[0];

          if (sectionTitle.startsWith('**') && sectionTitle.endsWith('**')) {
            const cleanTitle = sectionTitle.replace(/\*\*/g, '').toUpperCase();
            addSection(cleanTitle);

            // Add section content
            lines.slice(1).forEach(line => {
              if (line.trim()) {
                if (line.startsWith('•')) {
                  addText(line, 10, false, 5);
                } else if (line.includes(':') && !line.startsWith(' ')) {
                  addText(line, 10, true);
                } else {
                  addText(line, 10);
                }
              }
            });
          } else {
            // Handle lines that don't have section headers
            lines.forEach(line => {
              if (line.trim()) {
                if (line.startsWith('•')) {
                  addText(line, 10, false, 5);
                } else if (line.includes(':') && !line.startsWith(' ')) {
                  addText(line, 10, true);
                } else {
                  addText(line, 10);
                }
              }
            });
          }
        }
      });
    } else {
      addText('Report content not available', 12, true);
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Page number only
      pdf.setFontSize(8);
      const pageText = `Page ${i} of ${totalPages}`;
      const pageWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, 210 - pageWidth - 20, 294);
    }

    return pdf.output('blob');
  }
}