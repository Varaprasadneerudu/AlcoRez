import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Scale, Lock } from 'lucide-react';
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
        <h2 className="text-xl font-bold text-stone-900">Admin Authorization Required</h2>
        <Link to="/admin" className="text-xs font-bold text-amber-800 underline">Return to Admin Portal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <Scale className="w-6 h-6 text-amber-700" />
          Telangana Excise Statutory Governance Checklist
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Mandatory statutory requirements that must be verified before enabling any regulated commercial alcohol operations.
        </p>
      </div>

      {/* Critical Legal Lock Banner */}
      <div className="bg-amber-50 rounded-3xl border border-amber-300 p-6 space-y-3 text-xs text-amber-950">
        <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
          <Lock className="w-5 h-5 text-amber-800" />
          <span>Statutory Fail-Closed Requirement (Do Not Bypass)</span>
        </div>
        <p className="leading-relaxed text-stone-700">
          Under the <strong>Telangana Excise Act, 1968</strong>, online ordering and doorstep delivery of alcoholic beverages are not permitted
          for standard A4 retail wine shops. An administrator cannot unilaterally enable live checkout or delivery without official
          government gazette notification and state excise authorization.
        </p>
      </div>

      {/* Checklist Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading statutory checklist...</div>
        ) : checklist.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">No compliance items loaded.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {checklist.map((item) => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {item.requirement_code}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900">{item.title}</h3>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    Legal Reference: {item.legal_reference}
                  </p>
                  <p className="text-xs text-stone-500">{item.notes}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.is_approved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Statutory Clearance Met
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                      <XCircle className="w-4 h-4 text-red-600" />
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
