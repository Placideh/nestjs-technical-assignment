import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import  PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Employee } from '../../employee/entities/employee.entity';

export interface ReportFilter {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

 
  async getAttendanceData(filter: ReportFilter): Promise<Attendance[]> {
    const where: any = {};

  
    if (filter.employeeId) {
      where.employeeId = filter.employeeId;
    }

    if (filter.startDate && filter.endDate) {
      where.date = Between(filter.startDate, filter.endDate);
    }

    const attendances = await this.attendanceRepository.find({
      where,
      relations: ['employee'],
      order: {
        date: 'DESC',
      },
    });

    return attendances;
  }


  async generatePdfReport(filter: ReportFilter): Promise<Buffer> {
    const attendances = await this.getAttendanceData(filter);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // start 
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // add header
        doc.fontSize(20).text('Attendance Report', { align: 'center' });
        doc.moveDown();

        // add filters info
        doc.fontSize(10);
        if (filter.startDate && filter.endDate) {
          doc.text(`Period: ${filter.startDate} to ${filter.endDate}`);
        }
        if (filter.employeeId) {
          const employee = attendances[0]?.employee;
          if (employee) {
            doc.text(
              `Employee: ${employee.names} ${employee.employeeId}`,
            );
          }
        }
        doc.text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        // summary
        const totalRecords = attendances.length;
        const totalHours = attendances.reduce(
          (sum, att) => sum + (att.activeHours || 0),
          0,
        );
        const avgHours = totalRecords > 0 ? totalHours / totalRecords : 0;

        doc.fontSize(12).text('Summary', { underline: true });
        doc.fontSize(10);
        doc.text(`Total Records: ${totalRecords}`);
        doc.text(`Total Hours: ${totalHours.toFixed(2)}`);
        doc.text(`Average Hours: ${avgHours.toFixed(2)}`);
        doc.moveDown();

        // table header
        doc.fontSize(12).text('Attendance Records', { underline: true });
        doc.moveDown(0.5);

        // configuration
        const tableTop = doc.y;
        const colWidths = {
          date: 80,
          employee: 120,
          entry: 70,
          depart: 70,
          hours: 50,
          status: 70,
        };

        // draw table header
        doc.fontSize(9).fillColor('black');
        let currentY = tableTop;

        // header background
        doc.rect(50, currentY, 500, 20).fill('#3498db');
        doc.fillColor('white');

        // header text
        doc.text('Date', 55, currentY + 5, { width: colWidths.date });
        doc.text('Employee', 135, currentY + 5, { width: colWidths.employee });
        doc.text('Entry ', 255, currentY + 5, { width: colWidths.entry });
        doc.text('Depart ', 325, currentY + 5, { width: colWidths.depart });
        doc.text('Hours', 395, currentY + 5, { width: colWidths.hours });
        doc.text('Status', 445, currentY + 5, { width: colWidths.status });

        currentY += 25;
        doc.fillColor('black');

        // rows
        attendances.forEach((attendance, index) => {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          // row colors
          if (index % 2 === 0) {
            doc.rect(50, currentY, 500, 20).fill('#ecf0f1');
          }

          doc.fillColor('black');

          const employee = attendance.employee;
          const employeeName = employee
            ? `${employee.names} `
            : 'N/A';

          doc.fontSize(8);
          doc.text(attendance.date, 55, currentY + 5, {
            width: colWidths.date,
          });
          doc.text(employeeName, 135, currentY + 5, {
            width: colWidths.employee,
          });
          doc.text(
            new Date(attendance.entry).toLocaleTimeString(),
            255,
            currentY + 5,
            { width: colWidths.entry },
          );
          doc.text(
            attendance.depart
              ? new Date(attendance.depart).toLocaleTimeString()
              : 'N/A',
            325,
            currentY + 5,
            { width: colWidths.depart },
          );
          doc.text(
            attendance.activeHours?.toFixed(2) || '0.00',
            395,
            currentY + 5,
            { width: colWidths.hours },
          );
          doc.text(attendance.status, 445, currentY + 5, {
            width: colWidths.status,
          });

          currentY += 20;
        });

        // footer
        doc
          .fontSize(8)
          .fillColor('gray')
          .text(
            `Page ${doc.bufferedPageRange().count}`,
            50,
            750,
            { align: 'center' },
          );

  
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }


  async generateExcelReport(filter: ReportFilter): Promise<Buffer> {
    const attendances = await this.getAttendanceData(filter);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    //  column widths
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Entry', key: 'entry', width: 20 },
      { header: 'Depart ', key: 'depart', width: 20 },
      { header: 'Active Hours', key: 'activeHours', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Comment', key: 'comment', width: 30 },
    ];

    // header styling row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3498db' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // add  rows
    attendances.forEach((attendance) => {
      const employee = attendance.employee;
      const employeeName = employee
        ? `${employee.names}`
        : 'N/A';

      worksheet.addRow({
        date: attendance.date,
        employeeName: employeeName,
        employeeId: employee?.employeeId || 'N/A',
        entry: new Date(attendance.entry).toLocaleString(),
        depart: attendance.depart
          ? new Date(attendance.depart).toLocaleString()
          : 'N/A',
        activeHours: attendance.activeHours?.toFixed(2) || '0.00',
        status: attendance.status,
        comment: attendance.comment || 'N/A',
      });
    });

  
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.addRow([
      'Total Records',
      attendances.length,
    ]);
    worksheet.addRow([
      'Total Hours',
      attendances.reduce((sum, att) => sum + (att.activeHours || 0), 0).toFixed(2),
    ]);
    worksheet.addRow([
      'Average Hours',
      attendances.length > 0
        ? (
            attendances.reduce((sum, att) => sum + (att.activeHours || 0), 0) /
            attendances.length
          ).toFixed(2)
        : '0.00',
    ]);

    //  summary section
    const summaryStartRow = worksheet.rowCount - 3;
    for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
    }

    // borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });


    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}