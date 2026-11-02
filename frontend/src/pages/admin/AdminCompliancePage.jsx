import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Scale, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminCompliancePage() {
  const { role } = useAuth();
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin') {
      api.getComplianceChecklist()
        .then((data) => setChecklist(data || []))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Admin Authorization Required</h2>
        <Link to="/admin" className="text-xs font-bold text-amber-800 dark:text-amber-400 underline">Return to Admin Portal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2">
          <Scale className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          Telangana Excise Statutory Governance Checklist
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Mandatory statutory requirements that must be verified before enabling any regulated commercial alcohol operations.
        </p>
      </div>

      {/* Critical Legal Lock Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-3xl border border-amber-300 dark:border-amber-800 p-5 sm:p-6 space-y-3 text-xs text-amber-950 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
          <Lock className="w-5 h-5 text-amber-800 dark:text-amber-400" />
          <span>Statutory Fail-Closed Requirement (Do Not Bypass)</span>
        </div>
        <p className="leading-relaxed text-stone-700 dark:text-stone-300">
          Under the <strong>Telangana Excise Act, 1968</strong>, online ordering and doorstep delivery of alcoholic beverages are not permitted
          for standard A4 retail wine shops. An administrator cannot unilaterally enable live checkout or delivery without official
          government gazette notification and state excise authorization.
        </p>
      </div>

      {/* Checklist Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading statutory checklist...</div>
        ) : checklist.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">No compliance items loaded.</div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {checklist.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                      {item.requirement_code}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{item.title}</h3>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                    Legal Reference: {item.legal_reference}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{item.notes}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.is_approved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Statutory Clearance Met
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      Action Strictly Blocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
