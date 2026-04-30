import { prisma } from '../lib/prisma.js';

export const menuItemImageProvider = {
  async createMany(
    menuItemId: number,
    images: Array<{ image_url: string; is_primary?: boolean; display_order?: number }>,
  ) {
    return prisma.menu_item_images.createMany({
      data: images.map((img) => ({
        menu_item_id: menuItemId,
        image_url: img.image_url,
        is_primary: img.is_primary ?? false,
        display_order: img.display_order ?? 0,
      })),
    });
  },

  async findById(id: number) {
    return prisma.menu_item_images.findFirst({ where: { id } });
  },

  async findByMenuItemId(menuItemId: number) {
    return prisma.menu_item_images.findMany({
      where: { menu_item_id: menuItemId },
      orderBy: [{ is_primary: 'desc' }, { display_order: 'asc' }],
    });
  },

  async delete(id: number) {
    return prisma.menu_item_images.delete({ where: { id } });
  },
};
