'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

export interface MonthOption {
  /** Значение параметра `?month=`, например `2026-10`. */
  value: string;
  label: string;
}

interface MonthSelectProps {
  value: string;
  options: MonthOption[];
  /** Месяц, для которого адрес без параметра. */
  defaultValue: string;
}

/** Выбор месяца сводки на главной. Месяц хранится в URL. */
export function MonthSelect({
  value,
  options,
  defaultValue,
}: MonthSelectProps) {
  const router = useRouter();

  const select = (month: string | null) => {
    if (!month) return;
    router.push(month === defaultValue ? '/' : `/?month=${month}`);
  };

  return (
    <Select items={options} value={value} onValueChange={select}>
      <SelectTrigger aria-label="Месяц сводки" className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
