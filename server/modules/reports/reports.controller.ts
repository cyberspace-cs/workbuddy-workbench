import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import type { Report, ReportListResponse } from '@shared/api.interface';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async list(@Query() query: ListReportsDto): Promise<ReportListResponse> {
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.pageSize ? Number(query.pageSize) : 10;
    return this.reportsService.list({
      type: query.type,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Report> {
    return this.reportsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateReportDto): Promise<Report> {
    return this.reportsService.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.reportsService.remove(id);
    return { success: true };
  }

  @Post('generate')
  async generate(@Body() dto: GenerateReportDto): Promise<Report> {
    return this.reportsService.generate(dto);
  }
}
