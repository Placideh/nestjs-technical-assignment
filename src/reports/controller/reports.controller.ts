import {
    Controller,
    Get,
    Query,
    Res,
    UseGuards,
    InternalServerErrorException,
    StreamableFile,
    Header,
  } from '@nestjs/common';
  import { Response } from 'express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { ReportsService } from '../service/reports.service';
import { JwtAuthGuard } from '../../auth/jwtAuth.guard';
  
  
  @ApiTags('reports')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Controller('reports')
  export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}
  
    @Get('attendance/pdf')
    @ApiOperation({ summary: 'Generate attendance report as PDF' })
    @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
    @ApiResponse({
      status: 200,
      description: 'PDF report generated successfully',
    })
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename=attendance-report.pdf')
    async generatePdfReport(
      @Query('employeeId') employeeId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        const pdfBuffer = await this.reportsService.generatePdfReport({
          employeeId,
          startDate,
          endDate,
        });
  
        return new StreamableFile(pdfBuffer, {
          disposition: `attachment; filename="attendance-report-${Date.now()}.pdf"`,
          type: 'application/pdf',
          length: pdfBuffer.length,
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        throw new InternalServerErrorException('Failed to generate PDF report');
      }
    }
  
    @Get('attendance/excel')
    @ApiOperation({ summary: 'Generate attendance report as Excel' })
    @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
    @ApiResponse({
      status: 200,
      description: 'Excel report generated successfully',
    })
    @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    @Header('Content-Disposition', 'attachment; filename=attendance-report.xlsx')
    async generateExcelReport(
      @Query('employeeId') employeeId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      try {
        const excelBuffer = await this.reportsService.generateExcelReport({
          employeeId,
          startDate,
          endDate,
        });
  
        return new StreamableFile(excelBuffer, {
          disposition: `attachment; filename="attendance-report-${Date.now()}.xlsx"`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          length: excelBuffer.length,
        });
      } catch (error) {
        console.error('Excel generation error:', error);
        throw new InternalServerErrorException('Failed to generate Excel report');
      }
    }
  }