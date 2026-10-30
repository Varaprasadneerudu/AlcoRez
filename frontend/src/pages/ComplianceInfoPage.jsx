import React from 'react';
import { ShieldCheck, Scale, AlertTriangle, PhoneCall, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ComplianceInfoPage() {
  const { t, language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-2 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('compliance.returnHome', 'Return to Marketplace')}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
          {t('compliance.title', 'Telangana Excise Statutory Governance & Legal Disclosures')}
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {t('compliance.subtitle', 'Public disclosure under the Telangana Excise Act, 1968 and applicable government notifications.')}
        </p>
      </div>

      {/* Main Notice */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 space-y-6 shadow-sm">
        
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-700 dark:text-amber-500" />
            {t('compliance.sec1Title', '1. Regulatory Operating Principles')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {language === 'te' ? (
              <>తెలంగాణ రాష్ట్రంలో మద్యం వాణిజ్య వ్యాపారం, రవాణా మరియు డెలివరీ ప్రొహిబిషన్ & ఎక్సైజ్ శాఖ ఆధ్వర్యంలో <strong>తెలంగాణ ఎక్సైజ్ చట్టం, 1968</strong> ద్వారా ఖచ్చితంగా నియంత్రించబడతాయి. ప్రామాణిక రిటైల్ వైన్ లైసెన్స్‌లు (ఫారం A4) భౌతిక దుకాణాల ప్రాంగణాల నుండి మాత్రమే ప్రత్యక్ష అమ్మకాలను అనుమతిస్తాయి.</>
            ) : (
              <>The commercial trade, transport, and delivery of alcoholic beverages within the State of Telangana are strictly governed by the <strong>Telangana Excise Act, 1968</strong>, under the regulatory authority of the Prohibition & Excise Department. Standard retail wine licenses (Form A4) authorize brick-and-mortar sales from licensed premises only.</>
            )}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t('compliance.sec2Title', '2. Technological Prototype & Demonstration Mode')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {language === 'te' ? (
              <>ఈ ప్లాట్‌ఫారమ్ ఖచ్చితమైన సాంకేతిక నమూనా మరియు డెమో మోడ్‌లో పనిచేస్తుంది. డిఫాల్ట్ సిస్టమ్ సెట్టింగ్: <code className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-amber-900 dark:text-amber-400 font-bold font-mono ml-1">ALCOHOL_TRANSACTIONS_ENABLED=false</code>. ఈ నిబంధనల కింద:</>
            ) : (
              <>This platform operates in a strict technology demonstration mode. The core configuration defaults to: <code className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-amber-900 dark:text-amber-400 font-bold font-mono ml-1">ALCOHOL_TRANSACTIONS_ENABLED=false</code>. Under this mode:</>
            )}
          </p>
          <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside">
            {language === 'te' ? (
              <>
                <li>కేటలాగ్ బ్రౌజింగ్ మరియు లైసెన్స్డ్ వైన్ షాపుల వివరాల అన్వేషణ అనుమతించబడుతుంది.</li>
                <li>వినియోగదారు అనుభవం మరియు ఇన్వెంటరీ తర్కాన్ని పరీక్షించడానికి సిమ్యులేటెడ్ చెక్అవుట్‌లు అనుమతించబడతాయి.</li>
                <li><strong>లైవ్ పేమెంట్ ప్రాసెసింగ్ పూర్తిగా నిలిపివేయబడింది</strong> మరియు సర్వర్ విధానం ద్వారా నిరోధించబడింది.</li>
                <li><strong>మద్యం డోర్‌స్టెప్ డెలివరీ శాశ్వతంగా నిరోధించబడింది</strong>. ఎలాంటి భౌతిక మద్యం డెలివరీ చేయబడదు.</li>
              </>
            ) : (
              <>
                <li>Catalogue browsing and retail wine shop discovery are permitted.</li>
                <li>Simulated checkouts and test orders are permitted to validate user experience and inventory logic.</li>
                <li><strong>Live payment processing is strictly disabled</strong> and blocked by server-side fail-closed policy.</li>
                <li><strong>Doorstep alcohol delivery dispatch is permanently blocked</strong>. No physical liquor is dispatched or fulfilled.</li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('compliance.sec3Title', '3. Statutory Age Restrictions (21+ Mandatory)')}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {language === 'te' ? (
              <>తెలంగాణ ఎక్సైజ్ నిబంధనల ప్రకారం, <strong>21 సంవత్సరాల కంటే తక్కువ వయస్సు</strong> ఉన్న వ్యక్తులకు మద్యం అమ్మడం ఖచ్చితంగా నేరం. డెమో విధులను ఉపయోగించే ముందు అన్ని ఖాతాలు తప్పనిసరిగా వయస్సు ధృవీకరణను పూర్తి చేయాలి.</>
            ) : (
              <>Under Telangana Excise rules, sales of alcoholic beverages to any person below <strong>21 years of age</strong> are strictly prohibited. All user accounts must undergo statutory age verification before accessing demonstrative ordering functions.</>
            )}
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t('compliance.sec4Title', '4. State Excise Department Contacts & Helplines')}
          </h2>
          <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-1">
            <p><strong>{t('compliance.govtDept', 'Government of Telangana — Prohibition & Excise Department')}</strong></p>
            <p>{t('compliance.deptAddress', 'State Excise Headquarters, Nampally Station Road, Hyderabad, 500001')}</p>
            <p className="text-amber-900 dark:text-amber-400 font-bold">{t('compliance.tollFree', 'State Toll-Free Helpline: 1800-425-2523')}</p>
          </div>
        </div>

      </div>

    </div>
  );
}
