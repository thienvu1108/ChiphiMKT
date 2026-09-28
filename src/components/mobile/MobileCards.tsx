import React from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';

/**
 * Shared presentational primitives for mobile (< md) card views of large tables.
 * Pure UI: no data fetching, no business logic. Parents pass data + existing handlers.
 */

export type MobileViewMode = 'cards' | 'table';

export const MobileViewToggle: React.FC<{
  mode: MobileViewMode;
  onChange: (mode: MobileViewMode) => void;
  className?: string;
}> = ({ mode, onChange, className = '' }) => (
  <div className={`md:hidden flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 ${className}`} role="tablist" aria-label="Chế độ hiển thị">
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'cards'}
      onClick={() => onChange('cards')}
      className={`flex-1 min-h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors touch-manipulation ${
        mode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      <LayoutGrid className="w-4 h-4" /> Dạng thẻ
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'table'}
      onClick={() => onChange('table')}
      className={`flex-1 min-h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors touch-manipulation ${
        mode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
      }`}
    >
      <Table2 className="w-4 h-4" /> Xem dạng bảng
    </button>
  </div>
);

export const MobileCardList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`md:hidden flex flex-col gap-3 p-3 ${className}`}>{children}</div>
);

export const MobileCardEmpty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="md:hidden text-center py-12 px-4 text-slate-400 font-semibold text-sm">{children}</div>
);

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  /** Span both columns */
  full?: boolean;
  className?: string;
}

export const MobileCard: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  highlightLabel?: string;
  highlightValue?: React.ReactNode;
  highlightClassName?: string;
  fields?: MobileCardField[];
  actions?: React.ReactNode;
  leading?: React.ReactNode;
  selected?: boolean;
}> = ({ title, subtitle, badges, highlightLabel, highlightValue, highlightClassName = 'text-rose-700', fields = [], actions, leading, selected }) => (
  <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${selected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
    <div className="p-3.5 space-y-2.5">
      <div className="flex items-start gap-2.5">
        {leading}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-slate-900 leading-snug break-words">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 font-medium mt-0.5 break-words">{subtitle}</div>}
        </div>
        {highlightValue !== undefined && (
          <div className="text-right shrink-0">
            {highlightLabel && <div className="text-[11px] font-bold uppercase text-slate-400 leading-none mb-1">{highlightLabel}</div>}
            <div className={`text-base font-black font-mono leading-none ${highlightClassName}`}>{highlightValue}</div>
          </div>
        )}
      </div>
      {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
      {fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2 border-t border-dashed border-slate-100">
          {fields.map((f, i) => (
            <div key={i} className={`min-w-0 ${f.full ? 'col-span-2' : ''}`}>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400 leading-tight">{f.label}</dt>
              <dd className={`text-xs font-semibold text-slate-800 break-words ${f.className || ''}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-2 bg-slate-50/80 border-t border-slate-100">{actions}</div>
    )}
  </div>
);

/** 44px-tall action button for card footers */
export const MobileCardAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'default' | 'danger' | 'primary' }> = ({
  tone = 'default',
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    {...props}
    className={`min-h-11 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border transition-colors touch-manipulation disabled:opacity-50 ${
      tone === 'danger'
        ? 'text-rose-600 border-rose-200 bg-white active:bg-rose-50'
        : tone === 'primary'
        ? 'text-indigo-700 border-indigo-200 bg-white active:bg-indigo-50'
        : 'text-slate-700 border-slate-200 bg-white active:bg-slate-100'
    } ${className}`}
  >
    {children}
  </button>
);
