import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePayslipPDF = (payslipRow, companyInfo = { name: "Sowaye Inc.", address: "123 Business Rd, Suite 100", city: "Tech City, TX 75001" }) => {
  const doc = new jsPDF();
  
  // Basic properties
  const employeeName = payslipRow.employee?.name || "Unknown";
  const empID = payslipRow.employee?.empID || "N/A";
  const designation = payslipRow.employee?.designation || "N/A";
  
  // Date formatting
  const startDate = new Date(payslipRow.periodStartDate).toLocaleDateString();
  const endDate = new Date(payslipRow.periodEndDate).toLocaleDateString();
  const payPeriod = `${startDate} - ${endDate}`;
  const paymentDate = new Date().toLocaleDateString(); // Default to today as generation/payment date

  // Hours and Rates
  const finalHours = payslipRow.adjustedHours !== null ? payslipRow.adjustedHours : payslipRow.totalHoursTracked;
  const finalWage = payslipRow.adjustedWage !== null ? payslipRow.adjustedWage : payslipRow.hourlyWage;
  
  const standardHours = payslipRow.standardHours || finalHours; 
  let regularHours = Math.min(finalHours, standardHours);
  let overtimeHours = Math.max(0, finalHours - standardHours);
  
  // If no standard hours were set correctly or no OT, keep it simple
  if (payslipRow.extraHours && payslipRow.extraHours > 0) {
     overtimeHours = payslipRow.extraHours;
     regularHours = finalHours - overtimeHours;
  }

  const regularPay = regularHours * finalWage;
  const overtimePay = overtimeHours * finalWage; // Assuming OT is standard rate, adjust logic if 1.5x
  const totalPay = payslipRow.totalWages || (regularPay + overtimePay);

  // Layout Setup
  const pageWidth = doc.internal.pageSize.width;
  
  // ---- HEADER SECTION ----
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(companyInfo.address, 14, 26);
  doc.text(companyInfo.city, 14, 31);
  
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("PAYSLIP", pageWidth - 14, 25, { align: "right" });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, pageWidth - 14, 35);
  
  // ---- EMPLOYEE DETAILS SECTION ----
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 14, 45);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Left Column (Employee)
  doc.text(`Name:`, 14, 53);
  doc.setFont("helvetica", "bold");
  doc.text(`${employeeName}`, 40, 53);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Employee ID:`, 14, 59);
  doc.setFont("helvetica", "bold");
  doc.text(`${empID}`, 40, 59);

  doc.setFont("helvetica", "normal");
  doc.text(`Designation:`, 14, 65);
  doc.setFont("helvetica", "bold");
  doc.text(`${designation}`, 40, 65);

  // Right Column (Pay Period)
  doc.setFont("helvetica", "normal");
  doc.text(`Pay Period:`, pageWidth / 2 + 20, 53);
  doc.setFont("helvetica", "bold");
  doc.text(`${payPeriod}`, pageWidth / 2 + 50, 53);

  doc.setFont("helvetica", "normal");
  doc.text(`Payment Date:`, pageWidth / 2 + 20, 59);
  doc.setFont("helvetica", "bold");
  doc.text(`${paymentDate}`, pageWidth / 2 + 50, 59);

  // ---- EARNINGS TABLE ----
  autoTable(doc, {
    startY: 75,
    head: [['Earnings', 'Hours', 'Rate ($)', 'Total ($)']],
    body: [
      ['Regular Pay', regularHours.toFixed(2), finalWage.toFixed(2), regularPay.toFixed(2)],
      ['Overtime Pay', overtimeHours.toFixed(2), finalWage.toFixed(2), overtimePay.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  // ---- TOTALS SECTION ----
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(pageWidth - 85, finalY, 71, 12, 'F');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Pay:", pageWidth - 80, finalY + 8);
  doc.text(`$${totalPay.toFixed(2)}`, pageWidth - 18, finalY + 8, { align: "right" });

  // ---- FOOTER SECTION ----
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text("This is a system generated payslip and does not require a signature.", pageWidth / 2, 280, { align: "center" });

  // Trigger download
  doc.save(`Payslip_${employeeName.replace(/\s+/g, "_")}_${startDate.replace(/\//g, "-")}.pdf`);
};
