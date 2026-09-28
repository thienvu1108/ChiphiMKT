import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit, History, Trash2 } from 'lucide-react';
import { getRowComputed, resolveBlockForTeam, formatAcceptanceMonth } from './acceptanceUtils';
import { MobileCard, MobileCardAction } from '../mobile/MobileCards';

interface AcceptanceMobileCardProps {
  item: any;
  index: number;
  isSelected: boolean;
  teams: any[];
  projects: any[];
  blocks: any[];
  teamIdSet?: Set<string>;
  projectIdSet?: Set<string>;
  findTeam?: (idOrCodeOrName: string) => any;
  findProject?: (idOrCodeOrName: string) => any;
  formatCurrency: (amount: number) => string;
  canEdit?: boolean;
  canDelete?: boolean;
  onSelectRow: (id: string, checked: boolean) => void;
  /** Same handler as the table row; parent switches to table view so inline editing is available */
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onOpenHistory: (item: any) => void;
}

/** Read-only mobile card for one acceptance record. Display logic mirrors AcceptanceRow (read-only branch). */
export const AcceptanceMobileCard: React.FC<AcceptanceMobileCardProps> = React.memo(({
  item, index, isSelected, teams, projects, blocks, teamIdSet, projectIdSet, findTeam, findProject,
  formatCurrency, canEdit = true, canDelete = true, onSelectRow, onEdit, onDelete, onOpenHistory,
}) => {
  const isRawId = (val: string | undefined | null) => {
    if (!val) return false;
    const str = String(val).trim();
    if (str.startsWith('draft-')) return true;
    if (teamIdSet && teamIdSet.has(str)) return true;
    if (projectIdSet && projectIdSet.has(str)) return true;
    return str.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(str) && !str.includes(' ') && !str.includes('.');
  };
  const money = (n: number) => formatCurrency(n || 0).replace(' đ', '');

  const comp = getRowComputed(item);

  const matchedTeam = (findTeam ? (findTeam(item.teamId) || findTeam(item.teamCode) || findTeam(item.teamName)) : null) ||
    (teams || []).find((t: any) =>
      (t.id && (t.id === item.teamId || t.id === item.teamCode || t.id === item.teamName)) ||
      (t.teamCode && (t.teamCode === item.teamCode || t.teamCode === item.teamName || t.teamCode === item.teamId)) ||
      (t.name && (t.name === item.teamName || t.name === item.teamCode || t.name === item.teamId)));
  const rawTeamCode = item.teamCode || '';
  const rawTeamName = item.teamName || '';
  const displayTeamCode = matchedTeam?.teamCode || (!isRawId(rawTeamCode) && rawTeamCode ? rawTeamCode : '') ||
    matchedTeam?.name || (!isRawId(rawTeamName) && rawTeamName ? rawTeamName : '') || '-';
  const displayTeamName = matchedTeam?.name || (!isRawId(rawTeamName) && rawTeamName ? rawTeamName : '') ||
    matchedTeam?.teamCode || (displayTeamCode !== '-' ? displayTeamCode : '');

  const matchedProject = (findProject ? (findProject(item.projectId) || findProject(item.projectName) || findProject(item.projectCode)) : null) ||
    (projects || []).find((p: any) =>
      (p.id && (p.id === item.projectId || p.id === item.projectName || p.id === item.projectCode)) ||
      (p.name && (p.name === item.projectName || p.name === item.projectId)) ||
      (p.projectCode && (p.projectCode === item.projectCode || p.projectCode === item.projectName)));
  const rawProjectName = item.projectName || '';
  const rawProjectCode = item.projectCode || '';
  const displayProjectName = matchedProject?.name || (!isRawId(rawProjectName) && rawProjectName ? rawProjectName : '') ||
    matchedProject?.projectCode || '-';
  const displayProjectCode = matchedProject?.projectCode || (!isRawId(rawProjectCode) && rawProjectCode ? rawProjectCode : '') || '';
  const banKdName = matchedProject?.banKdName || item.banKdName;
  const resolvedBlock = resolveBlockForTeam(matchedTeam || item, blocks, teams, findTeam);
  const status = item.status || 'Đã nghiệm thu';

  return (
    <MobileCard
      selected={isSelected}
      leading={canDelete ? (
        <label className="shrink-0 -m-2 p-2 flex items-center" aria-label={`Chọn dòng ${index + 1}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectRow(item.id, e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 accent-indigo-600"
          />
        </label>
      ) : (
        <span className="shrink-0 text-xs font-bold text-slate-400 w-6 text-center pt-0.5">{index + 1}</span>
      )}
      title={<>{displayProjectCode && <span className="font-mono text-indigo-700 mr-1.5">{displayProjectCode}</span>}{displayProjectName}</>}
      subtitle={<>{formatAcceptanceMonth(item.month) || item.month || '-'}{banKdName ? ` · ${banKdName}` : ''}</>}
      highlightLabel="Tổng"
      highlightValue={money(comp.grandTotal)}
      badges={<>
        {resolvedBlock.blockName && (
          <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200 font-bold text-[11px]">{resolvedBlock.blockName}</Badge>
        )}
        <Badge variant="outline" className="bg-indigo-50/70 text-indigo-700 border-indigo-200 font-mono font-extrabold text-[11px]" title={displayTeamName}>{displayTeamCode}</Badge>
        <Badge className={`text-[11px] font-bold border-none ${status === 'Đã nghiệm thu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{status}</Badge>
      </>}
      fields={[
        { label: 'GĐKD', value: item.gdkdName || displayTeamName || '-' },
        { label: 'Người phụ trách', value: item.implementerName || '-' },
        { label: 'Digital (sau VAT)', value: money(comp.dTotalSauVat), className: 'font-mono text-sky-800' },
        { label: 'Visa Cty (sau VAT)', value: money(comp.vTotalSauVat), className: 'font-mono text-indigo-900' },
        { label: 'Đăng tin Cty (sau VAT)', value: money(comp.dtCtySauVat), className: 'font-mono text-indigo-900' },
        { label: 'Cá nhân chạy ngoài', value: money(comp.cnTotal), className: 'font-mono text-amber-900' },
        { label: 'CN nạp qua Cty', value: money(comp.cnNapTienCty), className: 'font-mono text-violet-900' },
        { label: 'Số lead', value: (comp.cnNopTien || 0).toLocaleString('vi-VN'), className: 'font-mono text-cyan-900' },
        ...(item.notes ? [{ label: 'Ghi chú', value: item.notes, full: true, className: 'font-medium text-slate-600' }] : []),
      ]}
      actions={<>
        <MobileCardAction onClick={() => onOpenHistory(item)} aria-label="Lịch sử chỉnh sửa"><History className="w-4 h-4" /> Lịch sử</MobileCardAction>
        {canEdit && <MobileCardAction tone="primary" onClick={() => onEdit(item)} aria-label="Chỉnh sửa dòng"><Edit className="w-4 h-4" /> Sửa</MobileCardAction>}
        {canDelete && <MobileCardAction tone="danger" onClick={() => onDelete(item.id)} aria-label="Xóa bản ghi"><Trash2 className="w-4 h-4" /> Xóa</MobileCardAction>}
      </>}
    />
  );
});
AcceptanceMobileCard.displayName = 'AcceptanceMobileCard';
