import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/users
   * Get all users (Admin only)
   */
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * GET /admin/users/:id
   * Get user by ID (Admin only)
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  /**
   * PATCH /admin/users/:id/role
   * Update user role (Admin only)
   */
  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.adminService.updateUserRole(id, dto.role, currentUserId);
  }

  /**
   * DELETE /admin/users/:id
   * Delete user (Admin only)
   */
  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.adminService.deleteUser(id, currentUserId);
  }

  /**
   * GET /admin/system/status
   * Get system status and statistics (Admin only)
   */
  @Get('system/status')
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  /**
   * GET /admin/system/sources
   * Get system sources (Admin only)
   */
  @Get('system/sources')
  async getSystemSources() {
    return this.adminService.getSystemSources();
  }
}
