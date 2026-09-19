import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ListMaterialsDto } from './dto/list-materials.dto';
import type { Material, MaterialListResponse } from '@shared/api.interface';

@Controller('api/materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  async list(@Query() query: ListMaterialsDto): Promise<MaterialListResponse> {
    return this.materialsService.list(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Material> {
    return this.materialsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateMaterialDto): Promise<Material> {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMaterialDto): Promise<Material> {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.materialsService.remove(id);
  }
}
