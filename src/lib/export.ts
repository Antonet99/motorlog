import * as XLSX from 'xlsx';
import { buildRefuelInsights, sortExpensesNewestFirst, sortRefuelsNewestFirst } from './insights';
import type { Expense, Refuel, Vehicle } from '../types/domain';

const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const decimalFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDecimal(value: number | null) {
  if (value === null) {
    return '--';
  }

  return decimalFormatter.format(value);
}

function formatCostPerKm(value: number | null) {
  if (value === null) {
    return '--';
  }

  return `${compactCurrencyFormatter.format(value)}/km`;
}

function formatOptionalValue(value: string | number | null) {
  return value === null || value === '' ? '--' : value;
}

function toSheet(
  headers: string[],
  rows: Array<Array<string | number | boolean | null>>,
  widths: number[],
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = widths.map(width => ({ wch: width }));
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(rows.length, 1), c: headers.length - 1 },
    }),
  };

  return worksheet;
}

function buildFilename(vehicle: Vehicle) {
  const safeBase = `${vehicle.brand}-${vehicle.model}-${vehicle.plate}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const today = new Date().toISOString().slice(0, 10);
  return `motorlog-${safeBase || vehicle.id}-${today}.xlsx`;
}

export function downloadVehicleWorkbook(
  vehicle: Vehicle,
  refuels: Refuel[],
  expenses: Expense[],
) {
  const workbook = XLSX.utils.book_new();
  const sortedRefuels = sortRefuelsNewestFirst(refuels);
  const sortedExpenses = sortExpensesNewestFirst(expenses);
  const insights = buildRefuelInsights(sortedRefuels);
  const latestRefuel = sortedRefuels[0] ?? null;
  const latestExpense = sortedExpenses[0] ?? null;
  const latestComparableRefuel =
    sortedRefuels.find(refuel => insights.get(refuel.id)?.has_valid_full_to_full) ?? null;
  const latestComparableInsight = latestComparableRefuel
    ? insights.get(latestComparableRefuel.id) ?? null
    : null;
  const totalFuelSpend = sortedRefuels.reduce((total, refuel) => total + refuel.total_cost, 0);
  const totalExpenses = sortedExpenses.reduce((total, expense) => total + expense.amount, 0);

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Veicolo', ''],
    ['Marca', vehicle.brand],
    ['Modello', vehicle.model],
    ['Nickname', formatOptionalValue(vehicle.nickname)],
    ['Tipo veicolo', vehicle.vehicle_type],
    ['Targa', vehicle.plate],
    ['Anno', formatOptionalValue(vehicle.year)],
    ['Colore', formatOptionalValue(vehicle.color)],
    ['Capacita serbatoio (L)', vehicle.tank_capacity_liters],
    ['Alimentazione', vehicle.fuel_type],
    [],
    ['Riepilogo', ''],
    ['Totale rifornimenti', sortedRefuels.length],
    ['Totale spese', sortedExpenses.length],
    ['Spesa carburante totale', formatCurrency(totalFuelSpend)],
    ['Spesa extra totale', formatCurrency(totalExpenses)],
    ['Spesa complessiva', formatCurrency(totalFuelSpend + totalExpenses)],
    ['Ultimo rifornimento', latestRefuel ? latestRefuel.date : '--'],
    ['Ultima spesa', latestExpense ? latestExpense.date : '--'],
    [
      'Consumo effettivo',
      latestComparableInsight ? `${formatDecimal(latestComparableInsight.km_per_liter)} km/L` : '--',
    ],
    [
      'Ultimo costo/km',
      latestComparableInsight ? formatCostPerKm(latestComparableInsight.cost_per_km) : '--',
    ],
  ]);
  summarySheet['!cols'] = [{ wch: 26 }, { wch: 28 }];

  const refuelsSheet = toSheet(
    [
      'Data',
      'Km',
      'Litri',
      'Costo/L',
      'Totale',
      'Pieno',
      'Stazione',
      'Note',
      'Km dal pieno precedente',
      'Consumo (km/L)',
      'Costo/km',
    ],
    sortedRefuels.map(refuel => {
      const insight = insights.get(refuel.id) ?? null;

      return [
        refuel.date,
        refuel.odometer_km,
        refuel.liters,
        refuel.price_per_liter,
        refuel.total_cost,
        refuel.is_full_tank ? 'Si' : 'No',
        refuel.station ?? '',
        refuel.notes ?? '',
        insight?.has_valid_full_to_full ? insight.distance_km ?? '' : '',
        insight?.has_valid_full_to_full ? insight.km_per_liter ?? '' : '',
        insight?.has_valid_full_to_full ? insight.cost_per_km ?? '' : '',
      ];
    }),
    [14, 12, 10, 10, 12, 10, 22, 28, 20, 18, 14],
  );

  const expensesSheet = toSheet(
    ['Data', 'Categoria', 'Importo', 'Note'],
    sortedExpenses.map(expense => [
      expense.date,
      expense.category,
      expense.amount,
      expense.notes ?? '',
    ]),
    [14, 18, 12, 36],
  );

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Riepilogo');
  XLSX.utils.book_append_sheet(workbook, refuelsSheet, 'Rifornimenti');
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Spese');

  XLSX.writeFile(workbook, buildFilename(vehicle), { compression: true });
}
