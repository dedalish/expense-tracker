import { Pencil, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { CategoryIcon, getCategories } from '@/entities/category';
import {
  CategoryFormDialog,
  DeleteCategoryButton,
} from '@/features/manage-category';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';

export const metadata: Metadata = { title: 'Категории · Expense Tracker' };

export async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Категории"
        description="Группы для доходов и расходов"
        actions={
          <CategoryFormDialog
            trigger={
              <Button>
                <Plus />
                Добавить
              </Button>
            }
          />
        }
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Категорий пока нет. Создайте первую, например «Продукты» или
            «Зарплата».
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Card size="sm">
                <CardContent className="flex items-center gap-3">
                  <CategoryIcon
                    category={category}
                    className="size-9 text-lg"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {category.name}
                  </span>
                  <CategoryFormDialog
                    category={category}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Изменить категорию"
                      >
                        <Pencil />
                      </Button>
                    }
                  />
                  <DeleteCategoryButton category={category} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
