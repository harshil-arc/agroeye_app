'use client';
import React, { useState, useMemo } from 'react';
import {
  Table,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Info,
  X,
  Calendar,
  CloudRain
} from 'lucide-react';
import { MonsoonYearRecord, Language } from '@/types/monsoon';
import { HISTORIC_MONSOON_DATA } from '@/data/historicMonsoonData';
import { translations } from '@/i18n/monsoonTranslations';

interface HistoricDataTableProps {
  lang: Language;
}

export const HistoricDataTable: React.FC<HistoricDataTableProps> = ({ lang }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Early' | 'Normal' | 'Delayed'>('All');
  const [ensoFilter, setEnsoFilter] = useState<'All' | 'La Niña' | 'El Niño' | 'Neutral'>('All');
  const [sortField, setSortField] = useState<'year' | 'dayOfYear' | 'deviationDays' | 'rainfallPercentOfLPA'>('year');
  const [sortAsc, setSortAsc] = useState(false); // default most recent year first
  const [selectedRecord, setSelectedRecord] = useState<MonsoonYearRecord | null>(null);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return HISTORIC_MONSOON_DATA.filter((r) => {
      const matchSearch =
        r.year.toString().includes(searchTerm) ||
        r.formattedDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ensoPhase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.iodPhase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notableFeatures.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notableFeaturesHi.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || r.category === categoryFilter;
      const matchEnso = ensoFilter === 'All' || r.ensoPhase === ensoFilter;

      return matchSearch && matchCategory && matchEnso;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [searchTerm, categoryFilter, ensoFilter, sortField, sortAsc]);

  const handleSort = (field: 'year' | 'dayOfYear' | 'deviationDays' | 'rainfallPercentOfLPA') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV Export functionality
  const handleExportCSV = () => {
    const headers = [
      'Year',
      'Kerala_Onset_Date',
      'Normal_Date',
      'Deviation_Days',
      'Category',
      'ENSO_Phase',
      'IOD_Phase',
      'Rainfall_Percent_LPA',
      'Total_Rainfall_mm',
      'Withdrawal_Date',
      'Season_Duration_Days',
      'Meteorological_Notes'
    ];

    const rows = filteredRecords.map((r) => [
      r.year,
      r.formattedDate,
      r.normalDate,
      r.deviationDays,
      r.category,
      r.ensoPhase,
      r.iodPhase,
      r.rainfallPercentOfLPA,
      r.totalRainfallMm,
      r.monsoonWithdrawalDate,
      r.seasonDurationDays,
      `"${r.notableFeatures.replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agroeye_monsoon_onset_historic_1970_2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <Table className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {t.tableTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.tableSub}
          </p>
        </div>

        {/* Action Controls: Search, Category, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchTablePlaceholder}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 font-headline font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All">{t.filterCategoryAll}</option>
            <option value="Early">{t.filterCategoryEarly}</option>
            <option value="Normal">{t.filterCategoryNormal}</option>
            <option value="Delayed">{t.filterCategoryDelayed}</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 font-mono flex items-center justify-between">
        <span>{t.rowsCount} <strong>{filteredRecords.length}</strong> / {HISTORIC_MONSOON_DATA.length} {lang === 'hi' ? 'वर्ष' : 'years'}</span>
        <span className="text-[11px] text-slate-400">{lang === 'hi' ? 'विवरण देखने के लिए किसी भी पंक्ति पर क्लिक करें' : 'Click any row for complete synoptic memo'}</span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 scrollbar-thin">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 font-headline uppercase font-bold text-[11px] text-slate-600">
            <tr>
              <th
                onClick={() => handleSort('year')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.colYear}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('dayOfYear')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.colOnsetDate}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('deviationDays')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.colDeviation}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">{t.colCategory}</th>
              <th className="py-3 px-3.5">{t.colEnso}</th>
              <th className="py-3 px-3.5">{t.colIod}</th>
              <th
                onClick={() => handleSort('rainfallPercentOfLPA')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>{t.colRainfallLpa}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3.5">{t.colDuration}</th>
              <th className="py-3 px-3.5 hidden md:table-cell">{t.colFeatures}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredRecords.map((record) => {
              const isEarly = record.category === 'Early';
              const isDelayed = record.category === 'Delayed';

              return (
                <tr
                  key={record.year}
                  onClick={() => setSelectedRecord(record)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 font-headline">
                    {record.year}
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900">
                    {record.formattedDate}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`font-bold ${
                        isEarly ? 'text-emerald-700' : isDelayed ? 'text-amber-700' : 'text-blue-700'
                      }`}
                    >
                      {record.deviationDays < 0
                        ? `${record.deviationDays}d`
                        : record.deviationDays > 0
                        ? `+${record.deviationDays}d`
                        : '0d (Normal)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-headline font-bold ${
                        isEarly
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDelayed
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {record.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-headline font-bold ${
                        record.ensoPhase === 'La Niña'
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : record.ensoPhase === 'El Niño'
                          ? 'bg-orange-50 text-orange-800 border border-orange-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {record.ensoPhase}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-headline text-[11px] font-semibold text-slate-600">
                    {record.iodPhase}
                  </td>
                  <td className="py-2.5 px-3.5 font-bold">
                    <span
                      className={
                        record.rainfallPercentOfLPA >= 100 ? 'text-emerald-700' : 'text-amber-700'
                      }
                    >
                      {record.rainfallPercentOfLPA}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">
                    {record.seasonDurationDays}d ({record.monsoonWithdrawalDate})
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 text-[11px] font-headline max-w-xs truncate hidden md:table-cell">
                    {lang === 'hi' ? record.notableFeaturesHi : record.notableFeatures}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Year Full Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-headline font-black text-emerald-700">
                  {selectedRecord.year}
                </span>
                <span className="text-base font-headline font-bold text-slate-800">
                  • {selectedRecord.formattedDate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.colDeviation}</span>
                <span className="font-headline font-extrabold text-slate-900 text-sm">
                  {selectedRecord.deviationDays < 0
                    ? `${Math.abs(selectedRecord.deviationDays)} ${t.daysEarly}`
                    : selectedRecord.deviationDays > 0
                    ? `${selectedRecord.deviationDays} ${t.daysLate}`
                    : t.onTime}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.colRainfallLpa}</span>
                <span className="font-headline font-extrabold text-emerald-800 text-sm">
                  {selectedRecord.rainfallPercentOfLPA}% ({selectedRecord.totalRainfallMm} mm)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.colEnso} / {t.colIod}</span>
                <span className="font-headline font-bold text-slate-900 text-xs">
                  {selectedRecord.ensoPhase} • {selectedRecord.iodPhase} IOD
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.colDuration}</span>
                <span className="font-headline font-bold text-slate-900 text-xs">
                  {selectedRecord.seasonDurationDays} days (Retreat: {selectedRecord.monsoonWithdrawalDate})
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950">
              <span className="font-headline font-bold block mb-1">
                {t.colFeatures}:
              </span>
              <p className="leading-relaxed text-[11px]">
                {lang === 'hi' ? selectedRecord.notableFeaturesHi : selectedRecord.notableFeatures}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white font-headline text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

