import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from '@/validators/product.validator';

function toSlug(name: string): string {
  // slugify is not installed — use manual implementation
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class CategoryService {
  async getAll() {
    const categories = await db.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async getBySlug(slug: string) {
    const category = await db.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        parent: true,
      },
    });
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
    return category;
  }

  async create(data: CreateCategoryInput) {
    const slug = toSlug(data.name);
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) throw new AppError('Category slug already exists', 409, 'DUPLICATE_ENTRY');

    return db.category.create({ data: { ...data, slug } });
  }

  async update(id: string, data: UpdateCategoryInput) {
    const category = await db.category.findUnique({ where: { id } });
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const updateData: typeof data & { slug?: string } = { ...data };
    if (data.name && data.name !== category.name) {
      updateData.slug = toSlug(data.name);
    }

    return db.category.update({ where: { id }, data: updateData });
  }

  async delete(id: string): Promise<void> {
    const category = await db.category.findUnique({ where: { id } });
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');

    const productCount = await db.product.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (productCount > 0) {
      throw new AppError(
        'Cannot delete category with active products',
        400,
        'CATEGORY_HAS_PRODUCTS',
      );
    }

    await db.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
