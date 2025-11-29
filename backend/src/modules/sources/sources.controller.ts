import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { PreviewSourceDto, CreateSourceDto } from './dto';

// TODO: Add authentication guard and get userId from JWT
const TEMP_USER_ID = 'temp-user-id'; // Temporary until auth is implemented

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  /**
   * Preview scraping results before saving
   * POST /sources/preview
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: PreviewSourceDto) {
    return this.sourcesService.preview(dto);
  }

  /**
   * Create a new source
   * POST /sources
   */
  @Post()
  async create(@Body() dto: CreateSourceDto) {
    return this.sourcesService.create(dto, TEMP_USER_ID);
  }

  /**
   * Get all sources for the current user
   * GET /sources
   */
  @Get()
  async findAll() {
    return this.sourcesService.findAll(TEMP_USER_ID);
  }

  /**
   * Get a single source by ID
   * GET /sources/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sourcesService.findOne(id, TEMP_USER_ID);
  }

  /**
   * Delete a source
   * DELETE /sources/:id
   */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sourcesService.delete(id, TEMP_USER_ID);
  }

  /**
   * Pause a source
   * PATCH /sources/:id/pause
   */
  @Patch(':id/pause')
  async pause(@Param('id') id: string) {
    return this.sourcesService.updateStatus(id, TEMP_USER_ID, 'PAUSED');
  }

  /**
   * Activate a source
   * PATCH /sources/:id/activate
   */
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.sourcesService.updateStatus(id, TEMP_USER_ID, 'ACTIVE');
  }
}
