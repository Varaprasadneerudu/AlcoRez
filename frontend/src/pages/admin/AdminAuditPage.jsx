import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft, Shield, Clock, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminAuditPage() {
  const { role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin') {
      api.getAuditLogs(1, 100)
        .then((data) => setLogs(data || []))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-amber-700" />
          Immutable Audit Trail & Regulatory Event Log
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Tamper-evident record of all user registrations, retailer license approvals, price changes, and simulated orders.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 uppercase font-extrabold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Action Event</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Target Entity</th>
                  <th className="py-3.5 px-4">Event Payload / Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <span className="capitalize font-semibold">{log.actor_role || 'System'}</span>
                      {log.actor_user_id && (
                        <span className="text-[10px] text-stone-400 block truncate max-w-[120px]">{log.actor_user_id}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <span className="capitalize font-semibold">{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="text-[10px] text-stone-400 block truncate max-w-[120px]">{log.entity_id}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs truncate font-sans text-xs">
                      {log.details ? (
                        <span className="font-mono text-[10px] bg-stone-100 p-1 rounded block truncate">
                          {log.details}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
