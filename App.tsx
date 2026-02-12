
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Loader2, Sparkles, ChevronRight, ArrowLeft,
  TrendingUp, Activity, Stethoscope, Eye, Users,
  UserCircle, ChevronDown, Banknote, Scale, MapPin, MoreHorizontal, 
  Settings2, ExternalLink, ChevronsRight, ChevronsLeft,
  ChevronLeft, AlertCircle, X, Info, Settings, CheckCircle2
} from 'lucide-react';
import { Deduction, DeductionCategory, DeductionStatus } from './types';
import { generateUniqueCode } from './geminiService';

// Custom Tooth Icon component to replace the standard smile icon
const ToothIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M7 3c-2.8 0-5 2.2-5 5 0 2.5 1.5 5 3 7 1.5 2 1.5 6 3.5 6 2 0 2.5-1.5 3.5-3 1 1.5 1.5 3 3.5 3 2 0 2-4 3.5-6 1.5-2 3-4.5 3-7 0-2.8-2.2-5-5-5-2.5 0-3.5 1.5-5 3-1.5-1.5-2.5-3-5-3z" />
  </svg>
);

interface EnrollmentDetail {
  name: string;
  type: string;
  frequency: string;
  startDate: string;
  endDate: string;
  amount: string;
  employerAmount: string;
  isSynced?: boolean;
  lastSynced: string;
}

interface Employee {
  id: string;
  name: string;
  enrollments: EnrollmentDetail[];
}

const NAMES = [
  "Sarah Jenkins", "Michael Chen", "Elena Rodriguez", "David Smith", "Lisa Wong",
  "James Wilson", "Maria Garcia", "Robert Taylor", "Linda Martinez", "William Brown",
  "Elizabeth Davis", "Christopher Miller", "Patricia Wilson", "Matthew Moore", "Jennifer Taylor",
  "Andrew Anderson", "Susan Thomas", "Joshua Jackson", "Margaret White", "Kevin Harris",
  "Dorothy Martin", "Richard Thompson", "Jessica Garcia", "Brian Martinez", "Karen Robinson"
];

const getPastDate = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

const standardPackage: EnrollmentDetail[] = [
  { name: 'Basic PPO', type: 'Medical', frequency: 'Bi-weekly', startDate: '01/01/2024', endDate: '-', amount: '$155.00', employerAmount: '$420.00', isSynced: true, lastSynced: getPastDate(5) },
  { name: 'Delta Dental Premier', type: 'Dental', frequency: 'Monthly', startDate: '01/01/2024', endDate: '-', amount: '$48.50', employerAmount: '$12.00', isSynced: true, lastSynced: getPastDate(120) },
  { name: 'Vision Gold', type: 'Vision', frequency: 'Monthly', startDate: '01/01/2024', endDate: '-', amount: '$14.20', employerAmount: '$0.00', isSynced: true, lastSynced: getPastDate(1500) },
  { name: '401k Contribution', type: 'Retirement', frequency: 'Monthly', startDate: '01/01/2024', endDate: '-', amount: '5%', employerAmount: '3%', isSynced: true, lastSynced: getPastDate(45) },
  { name: '401k Roth', type: 'Retirement', frequency: 'Monthly', startDate: '01/01/2024', endDate: '-', amount: '3%', employerAmount: '0%', isSynced: false, lastSynced: getPastDate(2880) }
];

const ALL_EMPLOYEES: Employee[] = NAMES.map((name, index) => ({
  id: `EMP${(index + 1).toString().padStart(3, '0')}`,
  name,
  enrollments: standardPackage.map(p => {
    const shouldInclude = Math.random() > 0.3;
    return shouldInclude ? { 
      ...p, 
      isSynced: Math.random() > 0.2,
      lastSynced: getPastDate(Math.floor(Math.random() * 4000))
    } : null;
  }).filter(Boolean) as EnrollmentDetail[]
}));

const INITIAL_DEDUCTIONS: Deduction[] = [
  {
    id: '1',
    planName: 'Basic PPO',
    providerName: 'BlueCross BlueShield',
    category: DeductionCategory.MEDICAL,
    subtype: 'PPO Plan',
    payrollCode: 'MED-BCBS-01',
    status: DeductionStatus.ACTIVE,
    isPreTax: true,
    createdAt: new Date().toISOString(),
    employeeCount: 0 
  },
  {
    id: '2',
    planName: '401k Match',
    providerName: 'Fidelity',
    category: DeductionCategory.RETIREMENT,
    subtype: '401(k)',
    payrollCode: 'RET-FID-01',
    status: DeductionStatus.ACTIVE,
    isPreTax: true,
    createdAt: new Date().toISOString(),
    employeeCount: 0
  },
  {
    id: '3',
    planName: 'Delta Dental Premier',
    providerName: 'Delta Dental',
    category: DeductionCategory.DENTAL,
    subtype: 'Dental PPO',
    payrollCode: 'DEN-DEL-01',
    status: DeductionStatus.ACTIVE,
    isPreTax: true,
    createdAt: new Date().toISOString(),
    employeeCount: 0
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'deductions' | 'employees'>('deductions');
  const [deductions, setDeductions] = useState<Deduction[]>(INITIAL_DEDUCTIONS);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<Deduction | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [viewingEmployeesDeduction, setViewingEmployeesDeduction] = useState<Deduction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<{ show: boolean, planName: string }>({ show: false, planName: '' });
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set(ALL_EMPLOYEES.slice(0, 15).map(e => e.id)));

  // Close settings menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deductionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    deductions.forEach(d => {
      stats[d.id] = ALL_EMPLOYEES.filter(emp => 
        selectedEmployeeIds.has(emp.id) && 
        emp.enrollments.some(en => en.name.toLowerCase() === d.planName.toLowerCase())
      ).length;
    });
    return stats;
  }, [deductions, selectedEmployeeIds]);

  const filteredDeductions = deductions.filter(d => 
    d.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.payrollCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = ALL_EMPLOYEES.filter(e => 
    selectedEmployeeIds.has(e.id) && 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleEmployeeExpansion = (id: string) => {
    const next = new Set(expandedEmployees);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedEmployees(next);
  };

  const toggleDeductionStatus = (id: string) => {
    setDeductions(prev => prev.map(d => {
      if (d.id === id) {
        let nextStatus = d.status;
        if (d.status === DeductionStatus.ACTIVE) {
          nextStatus = DeductionStatus.INACTIVE;
        } else {
          nextStatus = DeductionStatus.ACTIVE;
        }
        return { ...d, status: nextStatus };
      }
      return d;
    }));
  };

  const handleAddDeduction = (newDeduction: Deduction) => {
    setDeductions(prev => [newDeduction, ...prev]);
    setIsAddModalOpen(false);
    setSuccessBanner({ show: true, planName: newDeduction.planName });
  };

  const handleUpdateDeduction = (updated: Deduction) => {
    setDeductions(prev => prev.map(d => d.id === updated.id ? updated : d));
    setEditingDeduction(null);
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50 overflow-hidden text-slate-900 relative">
      {/* Success Banner - Persistent Slidedown - Increased width for long buttons */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transform transition-transform duration-700 ease-in-out ${successBanner.show ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-5xl mx-auto mt-4 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-emerald-500/50 backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-emerald-500/30 p-2 rounded-xl shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-50" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">
                Your new deduction <span className="underline decoration-emerald-300 underline-offset-4">"{successBanner.planName}"</span> was added to BambooHR successfully!
              </p>
              <p className="text-xs font-medium text-emerald-100 mt-1 opacity-90 leading-relaxed max-w-2xl">
                You'll need to map your new deduction inside Employee Navigator to complete the integration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => { window.open('https://www.employeenavigator.com', '_blank'); }}
              className="flex-1 sm:flex-none whitespace-nowrap px-6 py-3 bg-white text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg active:scale-95 border border-transparent hover:border-emerald-100 uppercase tracking-widest"
            >
              Go to Employee Navigator
            </button>
            <button 
              onClick={() => setSuccessBanner({ ...successBanner, show: false })} 
              className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0 group"
              title="Close notification"
            >
              <X className="w-5 h-5 text-white opacity-70 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Deductions</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden">
        <div className="flex items-center gap-8 mb-4 border-b border-slate-200 px-1 flex-shrink-0">
          <button 
            onClick={() => setActiveTab('deductions')}
            className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'deductions' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Deductions
            {activeTab === 'deductions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'employees' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Employees
            {activeTab === 'employees' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
          </button>
        </div>

        {/* Global Action Bar with Settings Dropdown */}
        <div className="flex items-center justify-end gap-3 mb-6 flex-shrink-0 h-11">
          {activeTab === 'deductions' ? (
            <button 
              onClick={() => { setEditingDeduction(null); setIsAddModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 h-full text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              Add Deduction
            </button>
          ) : (
            <button 
              onClick={() => setIsManageModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 h-full text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <Settings2 className="w-4 h-4 stroke-[2.5px]" />
              Manage Employees
            </button>
          )}

          <div className="relative h-full" ref={settingsRef}>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all active:scale-95 ${isSettingsOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
            >
              <Settings className={`w-5 h-5 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-3 w-max bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in slide-in-from-top-2 duration-150 origin-top-right ring-1 ring-black/5 overflow-hidden">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Employee Navigator
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex-shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'deductions' ? "Filter deductions..." : "Search employees..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'deductions' ? (
            <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Code</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tax Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employees</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeductions.length > 0 ? filteredDeductions.map((d) => {
                      const isInactive = d.status === DeductionStatus.INACTIVE;
                      const isSubtle = isInactive;
                      
                      return (
                        <tr 
                          key={d.id} 
                          className={`transition-all duration-300 group ${isSubtle ? 'bg-slate-50/50' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`text-sm font-semibold transition-all ${isSubtle ? 'text-slate-400' : 'text-slate-900'} ${isInactive ? 'line-through' : ''}`}>
                                {d.planName}
                              </span>
                              <span className={`text-xs transition-colors ${isSubtle ? 'text-slate-300' : 'text-slate-400'}`}>
                                {d.category}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium transition-colors ${isSubtle ? 'text-slate-300' : 'text-slate-600'}`}>
                              {d.providerName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <code className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${isSubtle ? 'bg-slate-100 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                              {d.payrollCode}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-all ${isSubtle ? 'bg-slate-50 text-slate-300 border-slate-100' : (d.isPreTax ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200')}`}>
                              {d.isPreTax ? 'Pre-Tax' : 'Post-Tax'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => setViewingEmployeesDeduction(d)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg group/btn transition-all border border-transparent ${isSubtle ? 'cursor-not-allowed opacity-30 grayscale' : 'hover:bg-indigo-50 hover:border-indigo-100'}`}
                              disabled={isSubtle}
                            >
                              <Users className={`w-4 h-4 transition-colors ${isSubtle ? 'text-slate-300' : 'text-slate-400 group-hover/btn:text-indigo-600'}`} />
                              <span className={`text-sm font-bold transition-colors ${isSubtle ? 'text-slate-400' : 'text-indigo-600 underline decoration-indigo-200/50 underline-offset-4'}`}>
                                {deductionStats[d.id] || 0}
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${d.status === DeductionStatus.ACTIVE ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {d.status}
                              </span>
                              <button 
                                onClick={() => toggleDeductionStatus(d.id)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${d.status === DeductionStatus.ACTIVE ? 'bg-indigo-600' : 'bg-slate-200'}`}
                              >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${d.status === DeductionStatus.ACTIVE ? 'translate-x-5' : 'translate-x-1'}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">No deductions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 space-y-3 pb-4">
              {filteredEmployees.length > 0 ? filteredEmployees.map((e) => {
                const isExpanded = expandedEmployees.has(e.id);
                return (
                  <div key={e.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                    <div className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                      <button 
                        onClick={() => toggleEmployeeExpansion(e.id)}
                        className="flex-1 flex items-center gap-4 text-left"
                      >
                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                        <span className={`text-base font-bold transition-all ${isExpanded ? 'text-indigo-600 underline underline-offset-4' : 'text-slate-900'}`}>{e.name}</span>
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          {e.enrollments.length} Plan{e.enrollments.length !== 1 ? 's' : ''}
                        </span>
                        
                        {isExpanded && (
                          <button 
                            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all shadow-sm animate-in fade-in slide-in-from-right-2 uppercase tracking-widest"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Profile
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-200 border-t border-slate-100 overflow-x-auto">
                        <table className="w-full text-left min-w-[900px]">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="pb-4 pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Plan Name</th>
                              <th className="pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Deduction Type</th>
                              <th className="pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Frequency</th>
                              <th className="pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Start Date</th>
                              <th className="pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">End Date</th>
                              <th className="pb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Employee Amt</th>
                              <th className="pb-4 pl-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Employer Amt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {e.enrollments.map((en, idx) => (
                              <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-6 pr-4 whitespace-nowrap">
                                  <span className="text-sm font-bold text-slate-800">{en.name}</span>
                                </td>
                                <td className="py-6 px-4 whitespace-nowrap">
                                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-500">
                                    {en.type}
                                  </span>
                                </td>
                                <td className="py-6 px-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-600">{en.frequency}</span>
                                </td>
                                <td className="py-6 px-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-600">{en.startDate}</span>
                                </td>
                                <td className="py-6 px-4 whitespace-nowrap">
                                  <span className="text-sm font-medium text-slate-400">{en.endDate}</span>
                                </td>
                                <td className="py-6 px-4 whitespace-nowrap">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-slate-900">{en.amount}</span>
                                    <span className="text-[10px] font-medium text-slate-400">/pay period</span>
                                  </div>
                                </td>
                                <td className="py-6 pl-4 text-right whitespace-nowrap">
                                  <div className="flex items-baseline justify-end gap-1.5">
                                    <span className="text-sm font-bold text-slate-900">{en.employerAmount}</span>
                                    <span className="text-[10px] font-medium text-slate-400">/pay period</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center text-slate-400 italic">No employees integrated.</div>
              )}
            </div>
          )}
        </div>
      </main>

      {(isAddModalOpen || editingDeduction) && (
        <AddDeductionModal 
          initialDeduction={editingDeduction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingDeduction(null);
          }} 
          onAdd={handleAddDeduction} 
          onUpdate={handleUpdateDeduction}
        />
      )}
      {isManageModalOpen && (
        <ManageEmployeesModal 
          allEmployees={ALL_EMPLOYEES}
          currentSelectedIds={selectedEmployeeIds}
          onClose={() => setIsManageModalOpen(false)} 
          onSave={(ids) => {
            setSelectedEmployeeIds(ids);
            setIsManageModalOpen(false);
          }}
        />
      )}
      {viewingEmployeesDeduction && (
        <DeductionEmployeesModal
          deduction={viewingEmployeesDeduction}
          employees={ALL_EMPLOYEES.filter(emp => 
            selectedEmployeeIds.has(emp.id) && 
            emp.enrollments.some(en => en.name.toLowerCase() === viewingEmployeesDeduction.planName.toLowerCase())
          )}
          onClose={() => setViewingEmployeesDeduction(null)}
        />
      )}
    </div>
  );
}

function DeductionEmployeesModal({ deduction, employees, onClose }: { deduction: Deduction, employees: Employee[], onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-full max-h-[500px] animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Enrolled Employees</h2>
            <p className="text-xs font-semibold text-indigo-600 truncate max-w-[260px]">{deduction.planName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
          {employees.length > 0 ? (
            employees.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:border-indigo-300 hover:bg-indigo-50/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-extrabold text-[10px] border border-slate-200 uppercase">
                    {e.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{e.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">{e.id}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200" />
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No managed employees enrolled.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100">
            Close List
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageEmployeesModal({ allEmployees, currentSelectedIds, onClose, onSave }: { 
  allEmployees: Employee[], 
  currentSelectedIds: Set<string>,
  onClose: () => void, 
  onSave: (ids: Set<string>) => void 
}) {
  const [selectedInModal, setSelectedInModal] = useState<Set<string>>(new Set(currentSelectedIds));
  const [leftSearch, setLeftSearch] = useState('');
  const [highlightedLeft, setHighlightedLeft] = useState<Set<string>>(new Set());
  const [highlightedRight, setHighlightedRight] = useState<Set<string>>(new Set());

  const availableEmployees = allEmployees.filter(e => !selectedInModal.has(e.id) && e.name.toLowerCase().includes(leftSearch.toLowerCase()));
  const selectedEmployees = allEmployees.filter(e => selectedInModal.has(e.id));

  const toggleLeftHighlight = (id: string) => {
    setHighlightedLeft(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRightHighlight = (id: string) => {
    setHighlightedRight(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveAllRight = () => {
    setSelectedInModal(new Set(allEmployees.map(e => e.id)));
    setHighlightedLeft(new Set());
  };

  const moveAllLeft = () => {
    setSelectedInModal(new Set());
    setHighlightedRight(new Set());
  };
  
  const moveSelectedRight = () => {
    if (highlightedLeft.size > 0) {
      setSelectedInModal(prev => {
        const next = new Set(prev);
        highlightedLeft.forEach(id => next.add(id));
        return next;
      });
      setHighlightedLeft(new Set());
    }
  };

  const moveSelectedLeft = () => {
    if (highlightedRight.size > 0) {
      setSelectedInModal(prev => {
        const next = new Set(prev);
        highlightedRight.forEach(id => next.delete(id));
        return next;
      });
      setHighlightedRight(new Set());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[650px] animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Manage Employee Access</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Plus className="w-6 h-6 rotate-45 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 p-8 grid grid-cols-[1fr,80px,1fr] gap-6 min-h-0 bg-slate-50/30">
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Available Employees</h3>
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 space-y-3">
                <div className="relative group">
                  <select className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium">
                    <option>All locations</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search employees..." 
                    value={leftSearch}
                    onChange={(e) => setLeftSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {availableEmployees.map(e => (
                  <button 
                    key={e.id}
                    onClick={() => toggleLeftHighlight(e.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-all text-left group ${highlightedLeft.has(e.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                  >
                    <span className="text-sm font-semibold">{e.name}</span>
                    <span className={`text-xs font-mono transition-colors ${highlightedLeft.has(e.id) ? 'text-indigo-400' : 'text-slate-300'}`}>{e.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-5">
            <button onClick={moveAllRight} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group">
              <ChevronsRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            </button>
            <button onClick={moveSelectedRight} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group">
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            </button>
            <button onClick={moveSelectedLeft} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group">
              <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            </button>
            <button onClick={moveAllLeft} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group">
              <ChevronsLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            </button>
          </div>
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Selected Employees</h3>
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 shadow-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {selectedEmployees.length > 0 ? (
                  selectedEmployees.map(e => (
                    <button 
                      key={e.id}
                      onClick={() => toggleRightHighlight(e.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 transition-all text-left ${highlightedRight.has(e.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-sm font-semibold">{e.name}</span>
                      <span className={`text-xs font-mono transition-colors ${highlightedRight.has(e.id) ? 'text-indigo-400' : 'text-slate-300'}`}>{e.id}</span>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <UserCircle className="w-10 h-10 opacity-10 mb-6" />
                    <p className="text-sm font-medium text-slate-500">You haven't added any employees yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => onSave(selectedInModal)} className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg">Save Selection</button>
        </div>
      </div>
    </div>
  );
}

function AddDeductionModal({ onClose, onAdd, onUpdate, initialDeduction }: { 
  onClose: () => void, 
  onAdd: (d: Deduction) => void,
  onUpdate: (d: Deduction) => void,
  initialDeduction?: Deduction | null
}) {
  const isEdit = !!initialDeduction;
  const [step, setStep] = useState(isEdit ? 3 : 1);
  const [selection, setSelection] = useState({ category: initialDeduction?.category || '', subtype: initialDeduction?.subtype || '' });
  const [details, setDetails] = useState({ planName: initialDeduction?.planName || '', providerName: initialDeduction?.providerName || '', payrollCode: initialDeduction?.payrollCode || '', isPreTax: initialDeduction?.isPreTax ?? true });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(isEdit);

  const activeCategory = useMemo(() => CATEGORIES.find(c => c.id === selection.category || c.title === selection.category), [selection.category]);

  const deriveCode = (provider: string, plan: string) => {
    const clean = (s: string) => s.trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const p1 = clean(provider);
    const p2 = clean(plan);
    if (!p1 && !p2) return '';
    if (!p1) return p2;
    if (!p2) return p1;
    return `${p1}-${p2}`;
  };

  useEffect(() => {
    if (step === 3 && !isCodeManuallyEdited && !isEdit) {
      const newCode = deriveCode(details.providerName, details.planName);
      setDetails(prev => ({ ...prev, payrollCode: newCode }));
    }
  }, [details.providerName, details.planName, step, isCodeManuallyEdited, isEdit]);

  const progress = isEdit ? 100 : (step / 3) * 100;

  const handleFinish = () => {
    const finalDeduction: Deduction = {
      id: initialDeduction?.id || Math.random().toString(36).substr(2, 9),
      category: activeCategory?.title || selection.category,
      subtype: selection.subtype,
      status: initialDeduction?.status || DeductionStatus.ACTIVE,
      createdAt: initialDeduction?.createdAt || new Date().toISOString(),
      employeeCount: 0,
      ...details
    };
    if (isEdit) onUpdate(finalDeduction); else onAdd(finalDeduction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-full max-h-[700px] animate-in fade-in zoom-in duration-200 border border-slate-200">
        <div className="px-8 pt-8 pb-4 flex-shrink-0">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{isEdit ? 'Editing Deduction' : `Step ${step} of 3`}</span>
            {!isEdit && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{Math.round(progress)}% Complete</span>}
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex-1 px-8 py-4 overflow-y-auto">
          {step === 1 && !isEdit && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900">What kind of deduction?</h2>
              <div className="grid gap-3 pb-24">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} onClick={() => { setSelection({ ...selection, category: cat.id }); setStep(2); }} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left bg-white group shadow-sm">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 group-hover:text-indigo-600 group-hover:bg-indigo-100"><cat.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{cat.title}</p>
                      <p className="text-[11px] text-slate-500">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 2 && !isEdit && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors"><ArrowLeft className="w-3 h-3" /> Back</button>
              <h2 className="text-xl font-bold text-slate-900">Which {activeCategory?.title.toLowerCase()} subtype?</h2>
              <div className="grid gap-3 pb-24">
                {activeCategory?.subtypes.map((sub) => (
                  <button key={sub} onClick={() => { setSelection({ ...selection, subtype: sub }); setStep(3); }} className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left bg-white font-bold text-sm text-slate-700 shadow-sm">{sub}</button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {!isEdit && <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors"><ArrowLeft className="w-3 h-3" /> Back</button>}
              <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Rename Deduction' : 'Configure Plan Details'}</h2>
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tight">{selection.category}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tight">{selection.subtype}</span>
              </div>
              <div className="space-y-4 pb-24">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 shadow-sm mb-6">
                  <div className="flex-shrink-0 mt-0.5">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900 leading-tight">Choose a plan name and payroll code that you'll recognize and want to keep.</h4>
                    <p className="text-[12px] text-indigo-700 mt-1.5 leading-relaxed font-medium">Once this deduction is used in Payroll, it'll be locked. To make changes, you'd need to add a new deduction and remap it in Employee Navigator.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Provider Name</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm" 
                    placeholder={activeCategory?.exampleProvider || "e.g. Provider Name"}
                    value={details.providerName} 
                    onChange={e => setDetails({...details, providerName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Plan Name</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium shadow-sm" 
                    placeholder={activeCategory?.examplePlan || "e.g. Standard Plan"}
                    value={details.planName} 
                    onChange={e => setDetails({...details, planName: e.target.value})} 
                  />
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-700">Pre-Tax Deduction</span>
                  </div>
                  <button type="button" onClick={() => setDetails({...details, isPreTax: !details.isPreTax})} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${details.isPreTax ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${details.isPreTax ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Payroll Code</label>
                  {!isEdit && <button onClick={async () => { setIsGenerating(true); const c = await generateUniqueCode(details.planName, details.providerName, selection.category); setDetails({...details, payrollCode: c}); setIsCodeManuallyEdited(true); setIsGenerating(false); }} className="text-[10px] font-bold text-indigo-600 float-right hover:text-indigo-800 transition-colors"><Sparkles className="w-3 h-3 inline mr-1" /> {isGenerating ? 'Working...' : 'AI Generate'}</button>}
                  <input 
                    className={`w-full px-4 py-3 rounded-xl border outline-none font-mono text-sm font-bold shadow-sm ${isEdit ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-indigo-500'}`} 
                    value={details.payrollCode} 
                    readOnly={isEdit} 
                    maxLength={12} 
                    onChange={e => { if (!isEdit) { setDetails({...details, payrollCode: e.target.value.toUpperCase()}); setIsCodeManuallyEdited(true); } }} 
                  />
                  <p className="mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-tight">Limit: 6-12 characters alphanumeric.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-white rounded-2xl transition-all">Cancel</button>
          <button disabled={(step < 3 && !isEdit) || !details.payrollCode || isGenerating || !details.planName} onClick={handleFinish} className="flex-1 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-2xl transition-all shadow-lg shadow-indigo-100">{isEdit ? 'Update Deduction' : 'Finish Setup'}</button>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { 
    id: 'MEDICAL', 
    title: 'Medical', 
    desc: 'Health insurance premiums and employer-sponsored health plans.', 
    icon: Stethoscope, 
    subtypes: ['HMO Plan', 'PPO Plan', 'HDHP Plan', 'EPO Plan'],
    exampleProvider: 'BlueCross or Aetna',
    examplePlan: 'Family - Choice HMO'
  },
  { 
    id: 'DENTAL', 
    title: 'Dental', 
    desc: 'Dental insurance premiums and routine care coverage.', 
    icon: ToothIcon, 
    subtypes: ['Dental HMO', 'Dental PPO', 'Dental Indemnity'],
    exampleProvider: 'Delta Dental',
    examplePlan: 'Premier PPO'
  },
  { 
    id: 'VISION', 
    title: 'Vision', 
    desc: 'Vision insurance premiums and corrective lens coverage.', 
    icon: Eye, 
    subtypes: ['Vision PPO', 'Vision Discount Plan'],
    exampleProvider: 'VSP or EyeMed',
    examplePlan: 'Vision Gold'
  },
  { 
    id: 'RETIREMENT', 
    title: 'Retirement Contribution', 
    desc: 'Employee contributions to qualified retirement plans.', 
    icon: TrendingUp, 
    subtypes: ['401(k)', 'Roth 401(k)', '403(b)', 'SIMPLE IRA'],
    exampleProvider: 'Fidelity or Vanguard',
    examplePlan: 'Traditional 401k'
  },
  { 
    id: 'BENEFITS', 
    title: 'Tax-Advantaged Benefits', 
    desc: 'FSA, HSA, and commuter benefits (Section 125).', 
    icon: Activity, 
    subtypes: ['HSA Contribution', 'FSA Medical', 'FSA Dependent Care', 'Commuter Transit', 'Commuter Parking'],
    exampleProvider: 'HealthEquity',
    examplePlan: 'HSA Contribution'
  },
  { 
    id: 'GARNISHMENT', 
    title: 'Garnishment / Court Order', 
    desc: 'Withholdings mandated by a court or government agency.', 
    icon: Scale, 
    subtypes: ['Child Support', 'Tax Levy', 'Creditor Garnishment', 'Other Garnishment'],
    exampleProvider: 'County Court',
    examplePlan: 'Case #12345'
  },
  { 
    id: 'LOAN', 
    title: 'Loan Repayment', 
    desc: 'Repayment of loans borrowed against plans or company.', 
    icon: Banknote, 
    subtypes: ['401(k) Loan', 'Company Loan', 'Student Loan', 'Other Loan'],
    exampleProvider: 'Company HR',
    examplePlan: 'Education Loan'
  },
  { 
    id: 'STATUTORY', 
    title: 'State Program / Statutory', 
    desc: 'Mandatory state-specific withholdings (e.g., PFML).', 
    icon: MapPin, 
    subtypes: ['PFML', 'SUI', 'Disability Insurance', 'Other Statutory'],
    exampleProvider: 'State Dept. of Labor',
    examplePlan: 'Statutory Disability'
  },
  { 
    id: 'OTHER', 
    title: 'Generic / Other', 
    desc: 'Miscellaneous deductions not covered above.', 
    icon: MoreHorizontal, 
    subtypes: ['Life Insurance', 'Gym Membership', 'Dues', 'Miscellaneous'],
    exampleProvider: 'Prudential or Equinox',
    examplePlan: 'Life Insurance 2x'
  },
];
