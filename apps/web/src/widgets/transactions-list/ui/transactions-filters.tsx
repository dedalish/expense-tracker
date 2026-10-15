'use client';

import type { Category } from '@expense-tracker/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

const ALL = 'all';

const TYPE_ITEMS = [
  { value: ALL, label: 'Все типы' },
  { value: 'EXPENSE', label: 'Расходы' },
  { value: 'INCOME', label: 'Доходы' },
];

/** Фильтры по типу и категории в URL. Смена фильтра сбрасывает страницу. */
export function TransactionsFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  // Типы допускают null из-за совместимости с Pages Router.
  const pathname = usePathname() ?? '/transactions';
  const searchParams = new URLSearchParams(useSearchParams()?.toString());

  const categoryItems = [
    { value: ALL, label: 'Все категории' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete('page');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        label="Тип"
        items={TYPE_ITEMS}
        value={searchParams.get('type') ?? ALL}
        onChange={(value) => setFilter('type', value)}
      />
      <FilterSelect
        label="Категория"
        items={categoryItems}
        value={searchParams.get('categoryId') ?? ALL}
        onChange={(value) => setFilter('categoryId', value)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
