import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun, ArrowDownToLine, ArrowUpFromLine, Zap, Calendar,
  History, Calculator, BarChart3, Settings, Trash2, Edit3,
  Download, Upload, AlertTriangle, CheckCircle2, RefreshCw, Search, IndianRupee
} from 'lucide-react';

const STORAGE_KEY = 'solar_units_records_v1';
const SETTINGS_KEY = 'solar_units_settings_v1';

const ACCENT_THEMES = {
  emerald: {
    name: 'Solar Emerald',
    primary: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    pill: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    ring: 'focus:ring-emerald-500/50 focus:border-emerald-500'
  },
  amber: {
    name: 'Helios Amber',
    primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
    pill: 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'from-amber-500/15 via-amber-500/5 to-transparent',
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    ring: 'focus:ring-amber-500/50 focus:border-amber-500'
  },
  cyan: {
    name: 'Cyber Cyan',
    primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    pill: 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/25',
    text: 'text-cyan-400',
    border: 'border-cyan-400/30',
    glow: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    ring: 'focus:ring-cyan-400/50 focus:border-cyan-400'
  }
};

const SEED_RECORDS = [
  { date: '2026-10-17', solar: 18.0, imported: 7.0, exported: 10.0, consumed: 15.0, note: 'Clear sunny day, AC ran in afternoon', savedAt: '2026-10-17T18:30:00Z' },
  { date: '2026-10-16', solar: 16.4, imported: 8.2, exported: 9.1, consumed: 15.5, note: 'Partly cloudy morning', savedAt: '2026-10-16T18:45:00Z' },
  { date: '2026-10-15', solar: 19.5, imported: 6.0, exported: 11.5, consumed: 14.0, note: 'Peak solar output', savedAt: '2026-10-15T19:00:00Z' },
  { date: '2026-10-14', solar: 17.2, imported: 7.5, exported: 9.8, consumed: 14.9, note: 'Standard household load', savedAt: '2026-10-14T18:15:00Z' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState({
    appName: 'Solar Units',
    accent: 'emerald',
    darkMode: true,
    tariffRate: 6.5,
    feedInRate: 3.5
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [inputMode, setInputMode] = useState('daily'); // 'daily' | 'cumulative'
  const [solar, setSolar] = useState('18');
  const [imported, setImported] = useState('7');
  const [exported, setExported] = useState('10');
  const [note, setNote] = useState('');

  // Cumulative LCD Meter state
  const [prevSolar, setPrevSolar] = useState('1420.0');
  const [currSolar, setCurrSolar] = useState('1438.0');
  const [prevImport, setPrevImport] = useState('850.0');
  const [currImport, setCurrImport] = useState('857.0');
  const [prevExport, setPrevExport] = useState('610.0');
  const [currExport, setCurrExport] = useState('620.0');

  // History Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [deleteConfirmDate, setDeleteConfirmDate] = useState(null);
  const [pulseResult, setPulseResult] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRecords(JSON.parse(saved));
      } else {
        setRecords(SEED_RECORDS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_RECORDS));
      }
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (e) {
      console.error('Failed to load records', e);
    }
  }, []);

  const saveRecordsToStorage = (updated) => {
    const sorted = [...updated].sort((a, b) => b.date.localeCompare(a.date));
    setRecords(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  };

  const updateSettings = (partial) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (inputMode === 'cumulative') {
      const sDiff = Math.max(0, (parseFloat(currSolar) || 0) - (parseFloat(prevSolar) || 0));
      const iDiff = Math.max(0, (parseFloat(currImport) || 0) - (parseFloat(prevImport) || 0));
      const eDiff = Math.max(0, (parseFloat(currExport) || 0) - (parseFloat(prevExport) || 0));
      setSolar(sDiff.toFixed(2));
      setImported(iDiff.toFixed(2));
      setExported(eDiff.toFixed(2));
    }
  }, [inputMode, prevSolar, currSolar, prevImport, currImport, prevExport, currExport]);

  const calc = useMemo(() => {
    const s = parseFloat(solar);
    const i = parseFloat(imported);
    const e = parseFloat(exported);

    if (solar === '' || imported === '' || exported === '' || isNaN(s) || isNaN(i) || isNaN(e)) {
      return { valid: false, error: 'Enter Solar, Import, and Export readings.', consumed: null };
    }
    if (s < 0 || i < 0 || e < 0) {
      return { valid: false, error: 'Energy values cannot be negative.', consumed: null };
    }
    const consumed = Number((s + i - e).toFixed(2));
    if (consumed < 0) {
      return {
        valid: false,
        error: `Grid Export (${e} kWh) exceeds Solar + Import (${(s + i).toFixed(2)} kWh). Check measurement period.`,
        consumed
      };
    }
    const selfConsumed = Math.max(0, Number((s - e).toFixed(2)));
    const solarCoverage = consumed > 0 ? Math.min(100, Math.round((selfConsumed / consumed) * 100)) : 0;
    const totalFlow = Math.max(0.01, s + i + e);
    return {
      valid: true,
      error: null,
      consumed,
      s,
      i,
      e,
      selfConsumed,
      solarCoverage,
      sPct: Math.round((s / totalFlow) * 100),
      iPct: Math.round((i / totalFlow) * 100),
      ePct: Math.round((e / totalFlow) * 100)
    };
  }, [solar, imported, exported]);

  useEffect(() => {
    setPulseResult(true);
    const t = setTimeout(() => setPulseResult(false), 180);
    return () => clearTimeout(t);
  }, [calc.consumed]);

  const handleSaveRecord = () => {
    if (!calc.valid) {
      showToast(calc.error, 'error');
      return;
    }
    const existingIdx = records.findIndex(r => r.date === date);
    const newRecord = {
      date,
      solar: calc.s,
      imported: calc.i,
      exported: calc.e,
      consumed: calc.consumed,
      note: note.trim(),
      savedAt: new Date().toISOString()
    };
    let nextRecords;
    if (existingIdx >= 0) {
      nextRecords = [...records];
      nextRecords[existingIdx] = newRecord;
      showToast(`Updated reading for ${date}`);
    } else {
      nextRecords = [newRecord, ...records];
      showToast(`Saved reading for ${date}`);
    }
    saveRecordsToStorage(nextRecords);
  };

  const handleEditRecord = (rec) => {
    setInputMode('daily');
    setDate(rec.date);
    setSolar(String(rec.solar));
    setImported(String(rec.imported));
    setExported(String(rec.exported));
    setNote(rec.note || '');
    setActiveTab('calculator');
    showToast(`Loaded ${rec.date} into Calculator`);
  };

  const handleDeleteRecord = (targetDate) => {
    const next = records.filter(r => r.date !== targetDate);
    saveRecordsToStorage(next);
    setDeleteConfirmDate(null);
    showToast(`Deleted reading for ${targetDate}`);
  };

  const exportCSV = () => {
    const headers = ['Date,Solar_kWh,Import_kWh,Export_kWh,Consumed_kWh,Note,SavedAt'];
    const rows = records.map(r =>
      `${r.date},${r.solar},${r.imported},${r.exported},${r.consumed},"${(r.note || '').replace(/"/g, '""')}",${r.savedAt}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `solar_units_backup_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported');
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `solar_units_backup_${todayStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('JSON backup exported');
  };

  const availableMonths = useMemo(() => {
    const setM = new Set(records.map(r => r.date.slice(0, 7)));
    return ['ALL', ...Array.from(setM).sort().reverse()];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchesMonth = monthFilter === 'ALL' || r.date.startsWith(monthFilter);
      const matchesQuery =
        !searchQuery.trim() ||
        r.date.includes(searchQuery.trim()) ||
        (r.note && r.note.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesMonth && matchesQuery;
    });
  }, [records, monthFilter, searchQuery]);

  const totals = useMemo(() => {
    return records.reduce(
      (acc, r) => ({
        solar: acc.solar + Number(r.solar || 0),
        imported: acc.imported + Number(r.imported || 0),
        exported: acc.exported + Number(r.exported || 0),
        consumed: acc.consumed + Number(r.consumed || 0)
      }),
      { solar: 0, imported: 0, exported: 0, consumed: 0 }
    );
  }, [records]);

  const theme = ACCENT_THEMES[settings.accent] || ACCENT_THEMES.emerald;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-28 relative overflow-x-hidden">
      {/* Ambient Radial Glow */}
      <div className={`pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b ${theme.glow} blur-2xl z-0`} />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#07090E]/85 border-b border-white/[0.08] px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#151C2C] border border-white/10 flex items-center justify-center shadow-inner">
              <Sun className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-white leading-none">
                {settings.appName}
              </h1>
              <p className="text-[11px] text-slate-400 mt-1">
                Offline Bidirectional Energy Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded-full text-xs font-mono-tabular font-semibold ${theme.badge}`}
          >
            {records.length} {records.length === 1 ? 'record' : 'records'}
          </button>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className={`px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2 backdrop-blur-xl ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : 'bg-[#151C2C]/95 border-white/15 text-white'
          }`}>
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4 relative z-10">
        {activeTab === 'calculator' && (
          <div className="space-y-4 animate-card">
            {/* Mode Switcher */}
            <div className="p-1 rounded-2xl bg-[#0E131F] border border-white/[0.08] grid grid-cols-2 gap-1">
              <button
                onClick={() => setInputMode('daily')}
                className={`py-2.5 text-xs font-display font-bold rounded-xl transition-all duration-200 ${
                  inputMode === 'daily' ? theme.pill : 'text-slate-400 hover:text-white'
                }`}
              >
                Direct Daily kWh
              </button>
              <button
                onClick={() => setInputMode('cumulative')}
                className={`py-2.5 text-xs font-display font-bold rounded-xl transition-all duration-200 ${
                  inputMode === 'cumulative' ? theme.pill : 'text-slate-400 hover:text-white'
                }`}
              >
                LCD Meter Diff (Δ)
              </button>
            </div>

            {/* Calculator Card */}
            <div className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" /> Reading Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#151C2C] border border-white/10 text-xs font-mono-tabular text-white focus:outline-none"
                />
              </div>

              {inputMode === 'cumulative' && (
                <div className="p-3.5 rounded-2xl bg-[#151C2C]/70 border border-white/[0.08] space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Enter Yesterday & Today Cumulative Meter Totals
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Solar (kWh)</span>
                      <input type="number" step="0.1" value={prevSolar} onChange={e => setPrevSolar(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-slate-300" placeholder="Prev" />
                      <input type="number" step="0.1" value={currSolar} onChange={e => setCurrSolar(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-white" placeholder="Today" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">Import (kWh)</span>
                      <input type="number" step="0.1" value={prevImport} onChange={e => setPrevImport(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-slate-300" placeholder="Prev" />
                      <input type="number" step="0.1" value={currImport} onChange={e => setCurrImport(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-white" placeholder="Today" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Export (kWh)</span>
                      <input type="number" step="0.1" value={prevExport} onChange={e => setPrevExport(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-slate-300" placeholder="Prev" />
                      <input type="number" step="0.1" value={currExport} onChange={e => setCurrExport(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#07090E] border border-white/10 text-xs font-mono-tabular text-white" placeholder="Today" />
                    </div>
                  </div>
                </div>
              )}

              {/* Energy Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5"><Sun className="w-4 h-4 text-amber-400" /> Solar Generation (E_solar)</span>
                    <span className="text-[11px] font-mono-tabular text-slate-400">kWh</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={solar}
                    onChange={e => setSolar(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl bg-[#151C2C] border border-white/10 text-base font-mono-tabular font-semibold text-white focus:outline-none focus:ring-2 ${theme.ring}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1"><ArrowDownToLine className="w-3.5 h-3.5 text-sky-400" /> Grid Import</span>
                      <span className="text-[11px] font-mono-tabular text-slate-400">kWh</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={imported}
                      onChange={e => setImported(e.target.value)}
                      className={`w-full px-3.5 py-3 rounded-2xl bg-[#151C2C] border border-white/10 text-base font-mono-tabular font-semibold text-white focus:outline-none focus:ring-2 ${theme.ring}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1"><ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-400" /> Grid Export</span>
                      <span className="text-[11px] font-mono-tabular text-slate-400">kWh</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={exported}
                      onChange={e => setExported(e.target.value)}
                      className={`w-full px-3.5 py-3 rounded-2xl bg-[#151C2C] border border-white/10 text-base font-mono-tabular font-semibold text-white focus:outline-none focus:ring-2 ${theme.ring}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1.5">Optional Note</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Weather, AC load, inverter note..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#151C2C] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Telemetry Result Card */}
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                calc.valid
                  ? `bg-[#151C2C]/90 ${theme.border}`
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      House Consumption (E_house)
                    </span>
                    <div className={`text-3xl font-display font-bold mt-1 flex items-baseline gap-1.5 font-mono-tabular transition-transform duration-150 ${
                      pulseResult ? 'scale-[1.03]' : 'scale-100'
                    } ${calc.valid ? 'text-white' : 'text-red-400'}`}>
                      <Zap className={`w-5 h-5 inline ${theme.text}`} />
                      {calc.consumed !== null ? `${calc.consumed} kWh` : '—'}
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <span className="text-[10px] text-slate-400 block">E_solar + E_import - E_export</span>
                    {calc.valid && (
                      <span className={`text-xs font-semibold ${theme.text}`}>
                        {calc.s} + {calc.i} - {calc.e} = {calc.consumed}
                      </span>
                    )}
                  </div>
                </div>

                {calc.valid && (
                  <div className="mt-3 pt-3 border-t border-white/[0.07] space-y-1.5">
                    <div className="h-2 rounded-full bg-[#07090E] overflow-hidden flex">
                      <div style={{ width: `${calc.sPct}%` }} className="bg-amber-400 transition-all duration-300" />
                      <div style={{ width: `${calc.iPct}%` }} className="bg-sky-400 transition-all duration-300" />
                      <div style={{ width: `${calc.ePct}%` }} className="bg-emerald-400 transition-all duration-300" />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono-tabular text-slate-400">
                      <span>Solar Self-Use: {calc.selfConsumed} kWh</span>
                      <span>Solar Coverage: {calc.solarCoverage}%</span>
                    </div>
                  </div>
                )}

                {!calc.valid && (
                  <p className="text-xs mt-2 text-red-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" /> {calc.error}
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveRecord}
                className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm tracking-wide shadow-lg transition active:scale-[0.99] ${theme.primary}`}
              >
                Save Daily Reading to History
              </button>
            </div>

            {/* Recent 3 Entries Preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">
                  Recent Saved Calculations
                </h2>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-xs font-semibold ${theme.text}`}
                >
                  Open Full History ({records.length}) →
                </button>
              </div>
              {records.slice(0, 3).map(rec => (
                <div
                  key={rec.date}
                  onClick={() => handleEditRecord(rec)}
                  className="p-3.5 rounded-2xl bg-[#0E131F] border border-white/[0.08] hover:border-white/20 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono-tabular font-bold text-sm text-white">{rec.date}</div>
                    <div className="text-xs font-mono-tabular text-slate-400 mt-0.5">
                      ☀️ {rec.solar} • ⬇️ {rec.imported} • ⬆️ {rec.exported} kWh
                    </div>
                    {rec.note && <div className="text-[11px] text-slate-500 italic mt-0.5">"{rec.note}"</div>}
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-mono-tabular font-bold ${theme.badge}`}>
                    ⚡ {rec.consumed} kWh
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3.5 animate-card">
            <div className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-base text-white">Saved Reading History</h2>
                  <p className="text-xs text-slate-400">{filteredRecords.length} of {records.length} calculations shown</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={exportCSV}
                    className="px-2.5 py-1.5 rounded-xl bg-[#151C2C] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1 hover:bg-white/10"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    onClick={exportJSON}
                    className="px-2.5 py-1.5 rounded-xl bg-[#151C2C] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1 hover:bg-white/10"
                  >
                    <Download className="w-3.5 h-3.5" /> JSON
                  </button>
                </div>
              </div>

              {/* Search & Month Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search date or note..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#151C2C] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <select
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#151C2C] border border-white/10 text-xs font-mono-tabular text-white focus:outline-none"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{m === 'ALL' ? 'All Months' : m}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRecords.map(rec => (
              <div key={rec.date} className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular font-bold text-sm text-white">{rec.date}</span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono-tabular font-bold ${theme.badge}`}>
                    Consumed: {rec.consumed} kWh
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular">
                  <div className="p-2.5 rounded-2xl bg-[#151C2C] border border-amber-500/20">
                    <span className="block text-[10px] uppercase text-amber-400">Solar</span>
                    <span className="font-bold text-white">{rec.solar} kWh</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#151C2C] border border-sky-500/20">
                    <span className="block text-[10px] uppercase text-sky-400">Import</span>
                    <span className="font-bold text-white">{rec.imported} kWh</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#151C2C] border border-emerald-500/20">
                    <span className="block text-[10px] uppercase text-emerald-400">Export</span>
                    <span className="font-bold text-white">{rec.exported} kWh</span>
                  </div>
                </div>

                {rec.note && <p className="text-xs text-slate-400 italic">"{rec.note}"</p>}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleEditRecord(rec)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-[#151C2C] text-slate-200 hover:bg-white/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit / Load
                  </button>
                  {deleteConfirmDate === rec.date ? (
                    <button
                      onClick={() => handleDeleteRecord(rec.date)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white"
                    >
                      Confirm Delete?
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmDate(rec.date)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 bg-red-950/60 text-red-300 border border-red-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4 animate-card">
            <div className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] space-y-3">
              <h2 className="font-display font-bold text-base text-white">Cumulative Telemetry Summary</h2>
              <div className="grid grid-cols-2 gap-2.5 font-mono-tabular">
                <div className="p-3 rounded-2xl bg-[#151C2C] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-amber-400">Total Solar Generated</span>
                  <div className="text-lg font-bold text-white mt-0.5">{totals.solar.toFixed(1)} kWh</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#151C2C] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-purple-400">Total House Consumed</span>
                  <div className="text-lg font-bold text-white mt-0.5">{totals.consumed.toFixed(1)} kWh</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#151C2C] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-sky-400">Total Grid Import</span>
                  <div className="text-lg font-bold text-white mt-0.5">{totals.imported.toFixed(1)} kWh</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#151C2C] border border-white/[0.06]">
                  <span className="text-[10px] uppercase text-emerald-400">Total Grid Export</span>
                  <div className="text-lg font-bold text-white mt-0.5">{totals.exported.toFixed(1)} kWh</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] space-y-2">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-400" /> Net Metering Tariff Estimator
              </h3>
              <p className="text-xs text-slate-400">
                Import Tariff: ₹{settings.tariffRate}/kWh • Export Feed-in Credit: ₹{settings.feedInRate}/kWh
              </p>
              <div className="p-3 rounded-2xl bg-[#151C2C] font-mono-tabular text-sm flex justify-between items-center">
                <span className="text-slate-300">Estimated Net Bill Impact:</span>
                <span className={`font-bold ${theme.text}`}>
                  ₹{(totals.imported * settings.tariffRate - totals.exported * settings.feedInRate).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 rounded-3xl bg-[#0E131F] border border-white/[0.08] space-y-4 animate-card">
            <h2 className="font-display font-bold text-base text-white">App Branding & Tariff Settings</h2>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Custom App Title</label>
              <input
                type="text"
                value={settings.appName}
                onChange={e => updateSettings({ appName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#151C2C] border border-white/10 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Telemetry Accent Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ACCENT_THEMES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => updateSettings({ accent: key })}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-display font-bold border transition ${
                      settings.accent === key ? `${item.pill} border-transparent` : 'bg-[#151C2C] border-white/10 text-slate-300'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-3 inset-x-4 z-40 max-w-md mx-auto">
        <div className="p-1.5 rounded-2xl bg-[#0E131F]/95 backdrop-blur-xl border border-white/10 shadow-2xl grid grid-cols-4 gap-1">
          {[
            { id: 'calculator', label: 'Calculator', icon: Calculator },
            { id: 'history', label: 'History', icon: History },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 rounded-xl transition-all duration-200 ${
                  active ? theme.pill : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-display font-bold mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
