import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Menu')
@Controller('v1/menu')
export class MenuController {
  constructor(private readonly service: MenuService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get full menu by tenant slug (for QR menu)' })
  getMenu(@Param('slug') slug: string) {
    return this.service.getFullMenu(slug);
  }

  @Public()
  @Get(':slug/categories')
  getCategories(@Param('slug') slug: string) {
    return this.service.getCategories(slug);
  }

  @Public()
  @Get(':slug/products')
  getProducts(@Param('slug') slug: string, @Query('categoryId') categoryId?: string) {
    return this.service.getProducts(slug, categoryId);
  }
}
