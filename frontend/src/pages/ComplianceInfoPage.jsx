import React from 'react';
import { ShieldCheck, Scale, AlertTriangle, PhoneCall, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ComplianceInfoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Marketplace
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Telangana Excise Statutory Governance & Legal Disclosures
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Public disclosure under the Telangana Excise Act, 1968 and applicable government notifications.
        </p>
      </div>

      {/* Main Notice */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
        
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-700" />
            1. Regulatory Operating Principles
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            The commercial trade, transport, and delivery of alcoholic beverages within the State of Telangana are strictly governed by the
            <strong> Telangana Excise Act, 1968</strong>, under the regulatory authority of the Prohibition & Excise Department.
            Standard retail wine licenses (Form A4) authorize brick-and-mortar sales from licensed premises only.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            2. Technological Prototype & Demonstration Mode
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            This platform operates in a strict technology demonstration mode. The core configuration defaults to:
            <code className="bg-stone-100 px-2 py-0.5 rounded text-amber-900 font-bold font-mono ml-1">ALCOHOL_TRANSACTIONS_ENABLED=false</code>.
            Under this mode:
          </p>
          <ul className="space-y-1.5 text-xs text-stone-700 list-disc list-inside">
            <li>Catalogue browsing and retail wine shop discovery are permitted.</li>
            <li>Simulated checkouts and test orders are permitted to validate user experience and inventory logic.</li>
            <li><strong>Live payment processing is strictly disabled</strong> and blocked by server-side fail-closed policy.</li>
            <li><strong>Doorstep alcohol delivery dispatch is permanently blocked</strong>. No physical liquor is dispatched or fulfilled.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            3. Statutory Age Restrictions (21+ Mandatory)
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Under Telangana Excise rules, sales of alcoholic beverages to any person below <strong>21 years of age</strong> are strictly prohibited.
            All user accounts must undergo statutory age verification before accessing demonstrative ordering functions.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-blue-600" />
            4. State Excise Department Contacts & Helplines
          </h2>
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-1">
            <p><strong>Government of Telangana — Prohibition & Excise Department</strong></p>
            <p>State Excise Headquarters, Nampally Station Road, Hyderabad, 500001</p>
            <p className="text-amber-900 font-bold">State Toll-Free Helpline: 1800-425-2523</p>
          </div>
        </div>

      </div>

    </div>
  );
}
