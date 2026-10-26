import React from 'react';
import { ShieldCheck, AlertCircle, PhoneCall, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Statutory Health & Legal Warning Callout */}
        <div className="bg-stone-950/80 border border-amber-900/40 rounded-2xl p-5 text-center space-y-2">
          <p className="font-extrabold tracking-wider text-amber-400 uppercase text-sm sm:text-base">
            ⚠️ STATUTORY WARNING: CONSUMPTION OF ALCOHOL IS INJURIOUS TO HEALTH • BE SAFE — DON'T DRINK AND DRIVE
          </p>
          <p className="text-stone-400 max-w-4xl mx-auto leading-relaxed text-[11px]">
            Under the provisions of the Telangana Excise Act, 1968, sale of liquor to persons below 21 years of age is strictly prohibited.
            This marketplace platform operates in a technological demonstration mode for licensed retailer discovery.
            Commercial online payments and alcohol delivery dispatch are strictly disabled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          {/* Col 1: Platform */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Telangana Liquor Marketplace</h3>
            <p className="text-stone-400 leading-relaxed text-xs">
              A modern digital catalogue assisting consumers in discovering verified products and authorized A4 wine shops in Telangana.
            </p>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Fail-Closed Regulatory Architecture
            </div>
          </div>

          {/* Col 2: Permitted Zones */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Hyderabad Retail Zones</h3>
            <ul className="space-y-1.5 text-stone-400">
              <li>• Madhapur & HITEC City (500081)</li>
              <li>• Jubilee Hills & Road 36 (500033)</li>
              <li>• Banjara Hills (500034)</li>
              <li>• Gachibowli Circle (500032)</li>
              <li>• Kondapur & Hafeezpet (500084)</li>
            </ul>
          </div>

          {/* Col 3: Excise & Compliance Links */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Regulatory Governance</h3>
            <ul className="space-y-1.5 text-stone-400">
              <li><Link to="/compliance-info" className="hover:text-amber-300">Telangana Excise Act, 1968</Link></li>
              <li><Link to="/compliance-info" className="hover:text-amber-300">A4 Retail Shop Licensing Rules</Link></li>
              <li><Link to="/compliance-info" className="hover:text-amber-300">Dry Days & Holiday Schedule</Link></li>
              <li><Link to="/retailer/apply" className="hover:text-amber-300">Retailer License Onboarding</Link></li>
              <li><Link to="/admin" className="hover:text-amber-300">State Excise Oversight Portal</Link></li>
            </ul>
          </div>

          {/* Col 4: State Helpline */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">Prohibition & Excise Dept</h3>
            <p className="text-stone-400 text-xs">
              Government of Telangana<br />
              Nampally, Hyderabad, 500001
            </p>
            <div className="flex items-center gap-2 text-stone-300">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Toll Free Helpline: 1800-425-2523</span>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-500 text-[11px] gap-2">
          <p>© {new Date().getFullYear()} Telangana Liquor Marketplace Prototype. Demonstration dataset only.</p>
          <p>Built with FastAPI, React, PostgreSQL & Tailwind CSS • 21+ Statutory Gate Active</p>
        </div>
      </div>
    </footer>
  );
}
