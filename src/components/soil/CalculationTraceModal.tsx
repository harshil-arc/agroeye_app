'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Database,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { CalculationTrace, DataProvenance } from '../../types/soilModule';

interface CalculationTraceModalProps {
  traces: CalculationTrace[];
  provenance: DataProvenance[];
  lang?: 'en' | 'hi';
}

export const CalculationTraceModal: React.FC<CalculationTraceModalProps> = ({
  traces,
  provenance,
  lang = 'en',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isHi = lang === 'hi';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Accordion Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-headline text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {isHi ? '🔍 यह गणना कैसे की गई? (गणितीय सूत्र एवं डेटा स्रोत)' : '🔍 How were these values calculated? (Formulas & Data Provenance)'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {isHi
                ? 'आईएमडी, आईसीएआर एवं एफएओ-56 मॉडलों का पूर्ण पारदर्शी विवरण'
                : '100% transparent calculation trace, physical formulas, and dataset citations'}
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-6 animate-in fade-in">
          {/* 1. Step-by-Step Mathematical Calculation Trace */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h4 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                {isHi ? 'चरण-दर-चरण भौतिक गणना सूत्र' : 'Step-by-Step Mass-Balance Equations'}
              </h4>
            </div>

            <div className="space-y-2.5">
              {traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-headline text-xs font-bold text-slate-900">
                      {trace.step}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                      Output: {trace.output}
                    </span>
                  </div>

                  {/* Formula */}
                  <div className="p-2 bg-slate-50 rounded-lg font-mono text-xs text-slate-800 border border-slate-200/80">
                    <code>{trace.formula}</code>
                  </div>

                  {/* Inputs breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                    {Object.entries(trace.inputs).map(([k, v], i) => (
                      <div key={i} className="flex justify-between font-mono bg-slate-50/80 px-2 py-1 rounded">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-semibold text-slate-800">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    💡 {trace.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Official Data Sources & Provenance Metadata */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h4 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                {isHi ? 'आधिकारिक डेटा स्रोत एवं अभिलेखीय प्रमाण (Data Provenance)' : 'Authoritative Data Providers & Provenance'}
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-headline uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold">Provider &amp; Dataset</th>
                    <th className="p-3 font-bold">Classification</th>
                    <th className="p-3 font-bold">Spatial Resolution</th>
                    <th className="p-3 font-bold hidden md:table-cell">Citation &amp; Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {provenance.map((prov, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-headline font-bold text-slate-900">
                        <div>{prov.provider}</div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{prov.datasetName}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-headline text-[10px] font-extrabold uppercase border ${
                            prov.provenanceType === 'official_observation'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : prov.provenanceType === 'soil_map_estimate'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {prov.provenanceType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {prov.spatialResolution}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 hidden md:table-cell max-w-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">{prov.citation}</p>
                          <p className="text-[10px] text-slate-400">{prov.limitations}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
