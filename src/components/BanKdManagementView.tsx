import React, { useState, useMemo } from 'react';
import { 
  Briefcase, Building2, Users, Wallet, FileCheck, Search, Filter, 
  Download, Plus, Edit3, Trash2, Shield, AlertCircle, Sparkles,
  ChevronRight, Phone, Mail, UserCheck, Layers, Calendar, ExternalLink,
  Table as TableIcon, LayoutGrid, CheckCircle2, Clock, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch 
} from '../firestore-proxy';
import { db } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AcceptanceManager } from './AcceptanceManager';
import { BanKd, BanKdContact } from './BanKdManager';

interface BanKdManagementViewProps {
  banKdList: BanKd[];
  currentActiveBanKd: BanKd | null;
  selectedBanKdId: string;
  setSelectedBanKdId: (id: string) => void;
  userAllowedBanKds: BanKd[];
  projects: any[];
  blocks: any[];
  blockBudgets: any[];
  acceptances: any[];
  finalAcceptances: any[];
  teams: any[];
  regions: any[];
  allUsers: any[];
  user: any;
  userProfile: any;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAccountant: boolean;
  isMod: boolean;
  hasPermission: (perm: string) => boolean;
  formatCurrency: (val: any) => string;
  formatCurrencyInput: (val: any) => string;
  getMarketingMonth: (date?: any) => string;
  handleFirestoreError: (error: any, op: any, entity: string) => void;
  logAction?: (action: string, entity: string, id?: string, data?: any) => Promise<void>;
  teamMap?: Record<string, string>;
  projectMap?: Record<string, string>;
  isImportingAcceptances?: boolean;
  setIsImportingAcceptances?: (val: boolean) => void;
  isImportAcceptancesDialogOpen?: boolean;
  setIsImportAcceptancesDialogOpen?: (val: boolean) => void;
  handleImportAcceptancesCSV?: (e: any) => void;
}

export const BanKdManagementView: React.FC<BanKdManagementViewProps> = ({
  banKdList,
  currentActiveBanKd,
  selectedBanKdId,
  setSelectedBanKdId,
  userAllowedBanKds,
  projects,
  blocks,
  blockBudgets,
  acceptances,
  finalAcceptances,
  teams,
  regions,
  allUsers,
  user,
  userProfile,
  isAdmin,
  isSuperAdmin,
  isAccountant,
  isMod,
  hasPermission,
  formatCurrency,
  formatCurrencyInput,
  getMarketingMonth,
  handleFirestoreError,
  logAction,
  teamMap = {},
  projectMap = {},
  isImportingAcceptances = false,
  setIsImportingAcceptances,
  isImportAcceptancesDialogOpen = false,
  setIsImportAcceptancesDialogOpen,
  handleImportAcceptancesCSV
}) => {
  const [subTab, setSubTab] = useState<'bankd-info' | 'bankd-budgets' | 'bankd-nt'>('bankd-info');

  // Can user manage Ban KD information & permissions
  const canManageBan = isAdmin || isSuperAdmin || isAccountant || hasPermission('bankd.edit') || hasPermission('bankd.assign');

  // Projects under this Ban KD
  const currentBanProjects = useMemo(() => {
    if (!currentActiveBanKd) return [];
    const bId = currentActiveBanKd.id;
    const bName = (currentActiveBanKd.name || '').toLowerCase().trim();
    return projects.filter(p => {
      if (p.banKdId && p.banKdId === bId) return true;
      if (p.banKdName && p.banKdName.toLowerCase().trim() === bName) return true;
      return false;
    });
  }, [currentActiveBanKd, projects]);

  const currentBanProjectIds = useMemo(() => new Set(currentBanProjects.map(p => p.id)), [currentBanProjects]);
  const currentBanProjectCodes = useMemo(() => new Set(currentBanProjects.map(p => (p.projectCode || '').toLowerCase().trim()).filter(Boolean)), [currentBanProjects]);
  const currentBanProjectNames = useMemo(() => new Set(currentBanProjects.map(p => (p.name || '').toLowerCase().trim()).filter(Boolean)), [currentBanProjects]);

  // Synchronized Block Budgets filtered for this Ban KD's projects
  const synchronizedBanBudgets = useMemo(() => {
    if (!currentActiveBanKd) return [];
    return blockBudgets.filter(b => {
      if (b.projectId && currentBanProjectIds.has(b.projectId)) return true;
      if (b.banKdId && b.banKdId === currentActiveBanKd.id) return true;
      if (b.banKdName && currentActiveBanKd.name && b.banKdName.toLowerCase().trim() === currentActiveBanKd.name.toLowerCase().trim()) return true;
      if (b.projectCode && currentBanProjectCodes.has((b.projectCode || '').toLowerCase().trim())) return true;
      if (b.projectName && currentBanProjectNames.has((b.projectName || '').toLowerCase().trim())) return true;
      return false;
    });
  }, [currentActiveBanKd, blockBudgets, currentBanProjectIds, currentBanProjectCodes, currentBanProjectNames]);

  // Synchronized Acceptances filtered for this Ban KD's projects
  const synchronizedBanAcceptances = useMemo(() => {
    if (!currentActiveBanKd) return [];
    return acceptances.filter(a => {
      if (a.projectId && currentBanProjectIds.has(a.projectId)) return true;
      if (a.projectCode && currentBanProjectCodes.has((a.projectCode || '').toLowerCase().trim())) return true;
      if (a.projectName && currentBanProjectNames.has((a.projectName || '').toLowerCase().trim())) return true;
      return false;
    });
  }, [currentActiveBanKd, acceptances, currentBanProjectIds, currentBanProjectCodes, currentBanProjectNames]);

  const synchronizedBanFinalAcceptances = useMemo(() => {
    if (!currentActiveBanKd) return [];
    return finalAcceptances.filter(a => {
      if (a.projectId && currentBanProjectIds.has(a.projectId)) return true;
      if (a.projectCode && currentBanProjectCodes.has((a.projectCode || '').toLowerCase().trim())) return true;
      if (a.projectName && currentBanProjectNames.has((a.projectName || '').toLowerCase().trim())) return true;
      return false;
    });
  }, [currentActiveBanKd, finalAcceptances, currentBanProjectIds, currentBanProjectCodes, currentBanProjectNames]);

  // Members assigned to this Ban KD
  const assignedBanMembers = useMemo(() => {
    if (!currentActiveBanKd) return [];
    const bId = currentActiveBanKd.id;
    const bName = (currentActiveBanKd.name || '').toLowerCase().trim();
    const bCode = (currentActiveBanKd.code || '').toLowerCase().trim();

    return allUsers.filter(u => {
      if (u.assignedBanKd && (u.assignedBanKd === bId || u.assignedBanKd.toLowerCase() === bCode || u.assignedBanKd.toLowerCase() === bName)) return true;
      if (Array.isArray(u.assignedBanKds) && (u.assignedBanKds.includes(bId) || u.assignedBanKds.map((x: string) => x.toLowerCase()).includes(bCode) || u.assignedBanKds.map((x: string) => x.toLowerCase()).includes(bName))) return true;
      if (currentActiveBanKd.leaderUid && (u.uid === currentActiveBanKd.leaderUid || u.id === currentActiveBanKd.leaderUid)) return true;
      if (currentActiveBanKd.leaderEmail && u.email && u.email.toLowerCase() === currentActiveBanKd.leaderEmail.toLowerCase()) return true;
      if (Array.isArray(currentActiveBanKd.memberUids) && (currentActiveBanKd.memberUids.includes(u.uid) || currentActiveBanKd.memberUids.includes(u.id))) return true;
      if (Array.isArray(currentActiveBanKd.assignedUserEmails) && u.email && currentActiveBanKd.assignedUserEmails.map((e: string) => e.toLowerCase()).includes(u.email.toLowerCase())) return true;
      return false;
    });
  }, [currentActiveBanKd, allUsers]);

  // ==========================================
  // BUDGET TAB FILTERS & METRICS
  // ==========================================
  const [budgetMonthFilter, setBudgetMonthFilter] = useState('all');
  const [budgetBlockFilter, setBudgetBlockFilter] = useState('all');
  const [budgetProjectFilter, setBudgetProjectFilter] = useState('all');
  const [budgetSearchTerm, setBudgetSearchTerm] = useState('');
  const [budgetViewMode, setBudgetViewMode] = useState<'table' | 'cards'>('table');

  const availableBudgetMonths = useMemo(() => {
    const set = new Set<string>();
    synchronizedBanBudgets.forEach(b => {
      if (b.month) set.add(b.month);
    });
    return Array.from(set).sort().reverse();
  }, [synchronizedBanBudgets]);

  const availableBudgetBlocks = useMemo(() => {
    const map = new Map<string, string>();
    synchronizedBanBudgets.forEach(b => {
      const code = b.blockCode || b.blockId || 'Khác';
      const name = b.blockName || code;
      map.set(code, name);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [synchronizedBanBudgets]);

  const filteredBanBudgets = useMemo(() => {
    return synchronizedBanBudgets.filter(b => {
      if (budgetMonthFilter !== 'all' && b.month !== budgetMonthFilter) return false;
      if (budgetBlockFilter !== 'all') {
        const matchesBlock = b.blockCode === budgetBlockFilter || b.blockId === budgetBlockFilter;
        if (!matchesBlock) return false;
      }
      if (budgetProjectFilter !== 'all' && b.projectId !== budgetProjectFilter) return false;
      if (budgetSearchTerm.trim()) {
        const q = budgetSearchTerm.toLowerCase().trim();
        const pName = (b.projectName || '').toLowerCase();
        const pCode = (b.projectCode || '').toLowerCase();
        const bName = (b.blockName || '').toLowerCase();
        const bCode = (b.blockCode || '').toLowerCase();
        const note = (b.notes || b.note || '').toLowerCase();
        if (!pName.includes(q) && !pCode.includes(q) && !bName.includes(q) && !bCode.includes(q) && !note.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [synchronizedBanBudgets, budgetMonthFilter, budgetBlockFilter, budgetProjectFilter, budgetSearchTerm]);

  // Overall KPI sums
  const totalBanBudgetAmount = useMemo(() => {
    return filteredBanBudgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [filteredBanBudgets]);

  const totalDistinctBlocksRegistered = useMemo(() => {
    const set = new Set<string>();
    filteredBanBudgets.forEach(b => {
      if (b.blockCode || b.blockId) set.add(b.blockCode || b.blockId);
    });
    return set.size;
  }, [filteredBanBudgets]);

  const totalDistinctProjectsWithBudget = useMemo(() => {
    const set = new Set<string>();
    filteredBanBudgets.forEach(b => {
      if (b.projectId) set.add(b.projectId);
    });
    return set.size;
  }, [filteredBanBudgets]);

  // Project grouped summary for Budget
  const budgetsGroupedByProject = useMemo(() => {
    const map = new Map<string, {
      project: any;
      totalAmount: number;
      registrations: any[];
      blocksMap: Record<string, number>;
    }>();

    currentBanProjects.forEach(p => {
      map.set(p.id, {
        project: p,
        totalAmount: 0,
        registrations: [],
        blocksMap: {}
      });
    });

    filteredBanBudgets.forEach(b => {
      const pId = b.projectId;
      if (pId && map.has(pId)) {
        const item = map.get(pId)!;
        const amt = Number(b.amount) || 0;
        item.totalAmount += amt;
        item.registrations.push(b);
        const blk = b.blockName || b.blockCode || 'Khối khác';
        item.blocksMap[blk] = (item.blocksMap[blk] || 0) + amt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [currentBanProjects, filteredBanBudgets]);

  // Export Ban Budget to Excel
  const handleExportBanBudgetsExcel = () => {
    if (filteredBanBudgets.length === 0) {
      toast.info('Không có dữ liệu để xuất file Excel');
      return;
    }

    const rows = filteredBanBudgets.map((b, idx) => ({
      'STT': idx + 1,
      'Ban KD': currentActiveBanKd?.name || '',
      'Mã Dự Án': b.projectCode || '',
      'Tên Dự Án': b.projectName || '',
      'Khối Đăng Ký': `${b.blockName || ''} (${b.blockCode || ''})`.trim(),
      'Kỳ / Tháng': b.month || '',
      'Mức Ngân Sách (VNĐ)': Number(b.amount) || 0,
      'Người Đăng Ký': b.createdByName || b.userEmail || '',
      'Ghi Chú': b.notes || b.note || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'NganSachBan');
    const safeBanName = (currentActiveBanKd?.name || 'BanKD').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `NganSach_${safeBanName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Đã xuất file Excel Ngân sách Ban thành công!');
  };

  // ==========================================
  // MEMBER ASSIGNMENT DIALOG STATE
  // ==========================================
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const handleToggleMember = async (targetUser: any, isAssigned: boolean) => {
    if (!currentActiveBanKd) return;
    try {
      const curBanKds = Array.isArray(targetUser.assignedBanKds) ? [...targetUser.assignedBanKds] : (targetUser.assignedBanKd ? [targetUser.assignedBanKd] : []);
      let nextBanKds: string[];
      
      const curMemberUids = Array.isArray(currentActiveBanKd.memberUids) ? [...currentActiveBanKd.memberUids] : [];
      let nextMemberUids: string[];

      if (isAssigned) {
        // Remove
        nextBanKds = curBanKds.filter(id => id !== currentActiveBanKd.id && id !== currentActiveBanKd.code && id !== currentActiveBanKd.name);
        nextMemberUids = curMemberUids.filter(uid => uid !== targetUser.uid && uid !== targetUser.id);
      } else {
        // Add
        nextBanKds = Array.from(new Set([...curBanKds, currentActiveBanKd.id]));
        nextMemberUids = Array.from(new Set([...curMemberUids, targetUser.uid || targetUser.id]));
      }

      await updateDoc(doc(db, 'users', targetUser.id), {
        assignedBanKd: nextBanKds[0] || '',
        assignedBanKds: nextBanKds,
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'ban_kd', currentActiveBanKd.id), {
        memberUids: nextMemberUids,
        updatedAt: serverTimestamp()
      });

      if (logAction) {
        await logAction(isAssigned ? 'REMOVE_BAN_MEMBER' : 'ADD_BAN_MEMBER', 'ban_kd', currentActiveBanKd.id, {
          targetUser: targetUser.email || targetUser.fullName,
          banName: currentActiveBanKd.name
        });
      }

      toast.success(isAssigned ? `Đã gỡ ${targetUser.fullName || targetUser.email} khỏi ${currentActiveBanKd.name}` : `Đã gán ${targetUser.fullName || targetUser.email} vào ${currentActiveBanKd.name}`);
    } catch (error) {
      console.error('Error toggling member:', error);
      toast.error('Lỗi khi cập nhật thành viên Ban KD');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Ban KD Selector */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 sm:p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider inline-flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  Hệ thống Quản lý Ban Kinh Doanh
                </span>
                {currentBanProjects.length > 0 && (
                  <span className="bg-sky-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm font-sans">
                    {currentBanProjects.length} dự án trực thuộc
                  </span>
                )}
                {synchronizedBanBudgets.length > 0 && (
                  <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm font-sans">
                    {synchronizedBanBudgets.length} hồ sơ ngân sách
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight mt-1.5 leading-snug break-words">
                Quản lý Ban KD: <span className="underline decoration-sky-300 decoration-2 sm:decoration-3 underline-offset-4">{currentActiveBanKd?.name || "Chưa chọn Ban KD"}</span>
              </h2>
            </div>

            {/* Ban KD Switcher Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {userAllowedBanKds.length > 0 && (
                <div className="w-full sm:w-[320px] bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20 font-sans shadow-lg shadow-indigo-950/10">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <Label className="text-[10px] text-sky-200 uppercase font-black block">
                      {userAllowedBanKds.length > 1 ? `Ban Thao Tác (${userAllowedBanKds.length} Ban)` : "Ban KD Thao Tác"}
                    </Label>
                    {userAllowedBanKds.length > 1 && (
                      <span className="bg-sky-300 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                        Đa Ban ({userAllowedBanKds.length})
                      </span>
                    )}
                  </div>
                  <Select 
                    value={currentActiveBanKd?.id || (userAllowedBanKds[0]?.id || '')} 
                    onValueChange={(val) => setSelectedBanKdId(val)}
                  >
                    <SelectTrigger className="bg-white text-slate-900 border-none rounded-xl font-bold h-10 text-xs shadow-sm hover:bg-slate-50 transition-colors w-full min-w-0 max-w-full">
                      <SelectValue placeholder="Chọn Ban KD...">
                        <span className="truncate block text-left flex-1 font-sans">
                          {currentActiveBanKd ? `${currentActiveBanKd.name} (${currentActiveBanKd.code || 'N/A'})` : "Chọn Ban KD..."}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-[320px]">
                      {userAllowedBanKds.map((b) => {
                        const projCount = projects.filter(p => p.banKdId === b.id || (p.banKdName && p.banKdName.toLowerCase() === (b.name || '').toLowerCase())).length;
                        return (
                          <SelectItem key={b.id} value={b.id} className="text-xs font-bold font-sans cursor-pointer py-2">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span>{b.name} ({b.code || 'N/A'})</span>
                              {projCount > 0 && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
                                  {projCount} dự án
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <p className="text-sky-100 text-xs sm:text-sm max-w-2xl font-medium font-sans">
            Giám sát hồ sơ thông tin Ban, theo dõi đồng bộ đăng ký ngân sách Marketing từ các Khối và đối soát nghiệm thu chi phí thực tế cho từng dự án của Ban.
          </p>

          {currentActiveBanKd && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                <span className="text-sky-200">Mã Ban:</span> <strong className="text-white font-bold">{currentActiveBanKd.code || 'N/A'}</strong>
              </div>
              {currentActiveBanKd.leaderName && (
                <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                  <span className="text-sky-200">Lãnh đạo Ban:</span> <strong className="text-white font-bold">{currentActiveBanKd.leaderName}</strong>
                </div>
              )}
              {currentActiveBanKd.leaderPhone && (
                <div className="bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-sky-300" />
                  <span className="text-white font-medium">{currentActiveBanKd.leaderPhone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <Tabs value={subTab} onValueChange={(val: any) => setSubTab(val)} className="space-y-6">
        <div className="overflow-x-auto w-full max-w-full pb-1 scrollbar-none -mx-1 px-1">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto inline-flex shadow-sm min-w-max gap-1">
            <TabsTrigger 
              value="bankd-info" 
              className="rounded-xl px-4 sm:px-5 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-700 font-bold transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Thông tin Ban</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bankd-budgets" 
              className="rounded-xl px-4 sm:px-5 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-700 font-bold transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              <Wallet className="w-4 h-4 text-purple-600" />
              <span>Ngân sách Ban</span>
              {synchronizedBanBudgets.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-black">
                  {synchronizedBanBudgets.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="bankd-nt" 
              className="rounded-xl px-4 sm:px-5 py-2.5 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-indigo-700 font-bold transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Nghiệm Thu MKT</span>
              {synchronizedBanAcceptances.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-black">
                  {synchronizedBanAcceptances.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================================================== */}
        {/* SUBTAB 1: THÔNG TIN BAN                                   */}
        {/* ======================================================== */}
        <TabsContent value="bankd-info" className="space-y-6 animate-in fade-in duration-300">
          {!currentActiveBanKd ? (
            <Card className="border-dashed border-2 p-10 text-center text-slate-500">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-bold">Chưa chọn Ban KD nào để xem thông tin.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: General Ban Info & Members */}
              <div className="space-y-6">
                <Card className="border-slate-100 shadow-md overflow-hidden bg-white">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-sky-500 w-full" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Hồ sơ Ban Kinh Doanh
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50">
                        {currentActiveBanKd.code || 'N/A'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Thông tin cơ bản và lãnh đạo phụ trách Ban
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Tên Ban:</span>
                      <p className="font-black text-slate-900 text-sm">{currentActiveBanKd.name}</p>
                    </div>
                    {currentActiveBanKd.description && (
                      <div>
                        <span className="text-slate-400 font-bold block uppercase text-[10px]">Mô tả nhiệm vụ:</span>
                        <p className="text-slate-600 leading-relaxed font-sans">{currentActiveBanKd.description}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-slate-400 font-bold block uppercase text-[10px]">Lãnh đạo phụ trách:</span>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {currentActiveBanKd.leaderName || 'Chưa cập nhật tên'}
                        </p>
                        {currentActiveBanKd.leaderPhone && (
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {currentActiveBanKd.leaderPhone}
                          </p>
                        )}
                        {currentActiveBanKd.leaderEmail && (
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {currentActiveBanKd.leaderEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Members Section */}
                <Card className="border-slate-100 shadow-md overflow-hidden bg-white">
                  <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        Thành viên & Phân quyền ({assignedBanMembers.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Các nhân sự được phân quyền quản trị/theo dõi Ban KD này
                      </CardDescription>
                    </div>
                    {canManageBan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsMemberDialogOpen(true)}
                        className="h-8 text-xs font-bold border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 rounded-xl"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Gán thành viên
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {assignedBanMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Chưa có thành viên nào được gán cho Ban KD này.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                        {assignedBanMembers.map((m) => (
                          <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{m.fullName || m.displayName || m.email}</p>
                              <p className="text-[10px] text-slate-500">{m.email} {m.teamName ? `• ${m.teamName}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {m.role || 'user'}
                              </Badge>
                              {canManageBan && (
                                <button
                                  onClick={() => handleToggleMember(m, true)}
                                  className="text-rose-500 hover:text-rose-700 text-xs px-1 font-bold"
                                  title="Gỡ khỏi Ban KD"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Projects under this Ban KD */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-slate-100 shadow-md overflow-hidden bg-white">
                  <div className="h-1 bg-gradient-to-r from-sky-500 to-indigo-600 w-full" />
                  <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-600" />
                        Danh Sách Dự Án Trực Thuộc ({currentBanProjects.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Các dự án thuộc quyền quản lý và phụ trách của {currentActiveBanKd.name}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentBanProjects.length === 0 ? (
                      <div className="p-8 text-center border-dashed border-2 border-slate-200 rounded-2xl">
                        <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-700">Chưa có dự án nào được gán vào Ban KD này</p>
                        <p className="text-xs text-slate-500 mt-1">Vui lòng vào phần Quản trị Dự án để gán dự án cho Ban KD.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-100 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                              <TableHead className="text-xs font-bold">Mã DA</TableHead>
                              <TableHead className="text-xs font-bold">Tên Dự Án</TableHead>
                              <TableHead className="text-xs font-bold">Khu Vực</TableHead>
                              <TableHead className="text-right text-xs font-bold">Ngân Sách ĐK (Khối)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentBanProjects.map((p, idx) => {
                              const projBudgets = synchronizedBanBudgets.filter(b => b.projectId === p.id);
                              const totalProjBudget = projBudgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
                              return (
                                <TableRow key={p.id} className="hover:bg-slate-50/50">
                                  <TableCell className="text-center font-bold text-xs text-slate-500">{idx + 1}</TableCell>
                                  <TableCell className="font-mono text-xs font-bold text-sky-700">{p.projectCode || 'N/A'}</TableCell>
                                  <TableCell className="font-bold text-xs text-slate-900">{p.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-medium border-slate-200 bg-slate-50">
                                      {p.region || 'Toàn quốc'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold text-xs text-purple-700">
                                    {totalProjBudget > 0 ? formatCurrency(totalProjBudget) : <span className="text-slate-400 font-normal italic">0 đ</span>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* SUBTAB 2: NGÂN SÁCH BAN                                   */}
        {/* ======================================================== */}
        <TabsContent value="bankd-budgets" className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tổng Ngân Sách Khối Đăng Ký</p>
                  <p className="text-xl font-black text-purple-700 font-mono mt-0.5">
                    {formatCurrency(totalBanBudgetAmount)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Số Khối Đăng Ký</p>
                  <p className="text-xl font-black text-blue-700 font-sans mt-0.5">
                    {totalDistinctBlocksRegistered} <span className="text-xs text-slate-400 font-normal">Khối</span>
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dự Án Có Ngân Sách</p>
                  <p className="text-xl font-black text-emerald-700 font-sans mt-0.5">
                    {totalDistinctProjectsWithBudget} / {currentBanProjects.length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Số Bản Ghi Đăng Ký</p>
                  <p className="text-xl font-black text-slate-800 font-sans mt-0.5">
                    {filteredBanBudgets.length} <span className="text-xs text-slate-400 font-normal">hồ sơ</span>
                  </p>
                </div>
                <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card className="border-slate-100 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  {/* Search */}
                  <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:flex-1 sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Tìm dự án, khối..." 
                      value={budgetSearchTerm}
                      onChange={(e) => setBudgetSearchTerm(e.target.value)}
                      className="pl-8 text-xs h-9 rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Month Filter */}
                  <Select value={budgetMonthFilter} onValueChange={setBudgetMonthFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] text-xs h-9 rounded-xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Tháng / Kỳ" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Tất cả tháng</SelectItem>
                      {availableBudgetMonths.map((m) => (
                        <SelectItem key={m} value={m}>Tháng {m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Block Filter */}
                  <Select value={budgetBlockFilter} onValueChange={setBudgetBlockFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] text-xs h-9 rounded-xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Khối" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Tất cả Khối</SelectItem>
                      {availableBudgetBlocks.map((blk) => (
                        <SelectItem key={blk.code} value={blk.code}>
                          {blk.name} ({blk.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Project Filter */}
                  <Select value={budgetProjectFilter} onValueChange={setBudgetProjectFilter}>
                    <SelectTrigger className="w-full sm:w-[170px] text-xs h-9 rounded-xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Dự án" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Tất cả dự án Ban</SelectItem>
                      {currentBanProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.projectCode || 'N/A'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBudgetViewMode('table')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        budgetViewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Bảng chi tiết</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBudgetViewMode('cards')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        budgetViewMode === 'cards' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Theo dự án</span>
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportBanBudgetsExcel}
                    className="h-9 text-xs font-bold border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 rounded-xl"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Xuất Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Records Content */}
          {budgetViewMode === 'table' ? (
            <Card className="border-slate-100 shadow-md overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                    <TableHead className="text-xs font-bold">Dự Án</TableHead>
                    <TableHead className="text-xs font-bold">Khối Đăng Ký</TableHead>
                    <TableHead className="text-xs font-bold">Kỳ / Tháng</TableHead>
                    <TableHead className="text-right text-xs font-bold">Mức Ngân Sách (VNĐ)</TableHead>
                    <TableHead className="text-xs font-bold">Người Tạo</TableHead>
                    <TableHead className="text-xs font-bold">Ghi Chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                        Không có bản ghi ngân sách Khối nào phù hợp với bộ lọc cho Ban KD này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBanBudgets.map((b, idx) => (
                      <TableRow key={b.id || idx} className="hover:bg-slate-50/50">
                        <TableCell className="text-center font-bold text-xs text-slate-500">{idx + 1}</TableCell>
                        <TableCell>
                          <p className="font-bold text-xs text-slate-900">{b.projectName || 'N/A'}</p>
                          <p className="text-[10px] font-mono text-sky-700">{b.projectCode || ''}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-bold border-purple-200 text-purple-700 bg-purple-50">
                            {b.blockName || b.blockCode || 'Khối'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-700">
                          {b.month || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-xs text-purple-700">
                          {formatCurrency(Number(b.amount) || 0)}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {b.createdByName || b.userEmail || 'Hệ thống'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 italic max-w-xs truncate">
                          {b.notes || b.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {filteredBanBudgets.length > 0 && (
                  <TableFooter className="bg-slate-50 font-black">
                    <TableRow>
                      <TableCell colSpan={4} className="text-right text-xs uppercase tracking-wider text-slate-700">
                        Tổng cộng Ngân sách ({filteredBanBudgets.length} bản ghi):
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-purple-800">
                        {formatCurrency(totalBanBudgetAmount)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </Card>
          ) : (
            /* Cards / Grouped By Project View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {budgetsGroupedByProject.map(({ project, totalAmount, registrations, blocksMap }) => (
                <Card key={project.id} className="border-slate-200/90 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col justify-between">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] font-mono font-bold text-sky-700 border-sky-200 bg-sky-50 mb-1">
                          {project.projectCode || 'N/A'}
                        </Badge>
                        <h4 className="font-black text-slate-900 text-sm">{project.name}</h4>
                      </div>
                      <Badge className="text-[10px] font-bold bg-purple-100 text-purple-800 border-none">
                        {registrations.length} lượt ĐK
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Tổng ngân sách các Khối:</span>
                      <p className="text-lg font-black text-purple-700 font-mono">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>

                    {/* Breakdown by Block */}
                    {Object.keys(blocksMap).length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Phân bổ theo Khối:</span>
                        <div className="space-y-1">
                          {Object.entries(blocksMap).map(([blkName, blkAmt]) => (
                            <div key={blkName} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                              <span className="font-medium text-slate-700">{blkName}</span>
                              <span className="font-mono font-bold text-purple-700">{formatCurrency(blkAmt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* SUBTAB 3: NGHIỆM THU MKT                                   */}
        {/* ======================================================== */}
        <TabsContent value="bankd-nt" className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                  Nghiệm Thu MKT Theo Dự Án Ban KD: {currentActiveBanKd?.name}
                </span>
                <Badge className="bg-indigo-600 text-white text-[10px]">
                  {synchronizedBanAcceptances.length} bản ghi
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                Đồng bộ trực tiếp từ phần Nghiệm thu Marketing tổng hợp, tự động lọc tất cả các bản ghi phát sinh theo từng dự án thuộc Ban KD này.
              </p>
            </div>
          </div>

          {/* Reusable AcceptanceManager scoped to Ban KD Projects */}
          <AcceptanceManager 
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            isMod={isMod}
            isAccountant={isAccountant}
            user={user}
            userProfile={userProfile}
            isGDKhoi={false}
            isTroLyKhoi={false}
            isAssistant={false}
            canCreate={(isAdmin || isSuperAdmin || isMod)}
            canEdit={(isAdmin || isSuperAdmin || isMod)}
            canDelete={(isAdmin || isSuperAdmin || isMod)}
            canImport={(isAdmin || isSuperAdmin || isMod)}
            teams={teams}
            uniqueTeams={teams}
            projects={currentBanProjects}
            regions={regions}
            acceptances={synchronizedBanAcceptances}
            finalAcceptances={synchronizedBanFinalAcceptances}
            teamMap={teamMap}
            projectMap={projectMap}
            formatCurrency={formatCurrency}
            getMarketingMonth={getMarketingMonth}
            handleFirestoreError={handleFirestoreError}
            formatCurrencyInput={formatCurrencyInput}
            isImportingAcceptances={isImportingAcceptances}
            setIsImportingAcceptances={setIsImportingAcceptances}
            isImportAcceptancesDialogOpen={isImportAcceptancesDialogOpen}
            setIsImportAcceptancesDialogOpen={setIsImportAcceptancesDialogOpen}
            handleImportAcceptancesCSV={handleImportAcceptancesCSV}
            blocks={blocks}
          />
        </TabsContent>
      </Tabs>

      {/* Member Assignment Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Gán thành viên cho {currentActiveBanKd?.name}</DialogTitle>
            <DialogDescription>
              Chọn các nhân sự trong hệ thống có quyền xem và quản lý dữ liệu của Ban Kinh Doanh này.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Tìm theo tên, email, chức vụ..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9 rounded-xl border-slate-200"
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-1.5 py-1">
            {allUsers
              .filter(u => {
                if (!memberSearchTerm.trim()) return true;
                const q = memberSearchTerm.toLowerCase().trim();
                return (
                  (u.fullName || '').toLowerCase().includes(q) ||
                  (u.displayName || '').toLowerCase().includes(q) ||
                  (u.email || '').toLowerCase().includes(q) ||
                  (u.role || '').toLowerCase().includes(q)
                );
              })
              .map(u => {
                const isAssigned = assignedBanMembers.some(m => m.id === u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-xs text-slate-800">{u.fullName || u.displayName || u.email}</p>
                      <p className="text-[10px] text-slate-500">{u.email} • Vai trò: <span className="capitalize font-medium">{u.role || 'user'}</span></p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAssigned ? "destructive" : "default"}
                      className="h-7 text-xs px-3 rounded-lg"
                      onClick={() => handleToggleMember(u, isAssigned)}
                    >
                      {isAssigned ? 'Gỡ' : 'Gán vào Ban'}
                    </Button>
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)} className="rounded-xl">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
