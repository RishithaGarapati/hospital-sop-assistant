import { useState } from "react";
import { queryChat } from "../utils/api";
import { Brain, Loader2, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";

const EXAMPLES = [
  "Patient has suspected COVID-19 infection with high fever and cough",
  "Cardiac arrest in general ward. Patient unresponsive, no pulse",
  "Patient ready for discharge after knee replacement surgery",
];

export default function DecisionPage() {
  const [scenario, setScenario] = useState("");
  const [dept, setDept] = useState("Emergency");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getDecision = async () => {
    if (!scenario.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await queryChat(`Clinical scenario in ${dept}: ${scenario}. Give step-by-step decision support.`);
      setResult(res.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">Clinical Scenario Input</div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Describe the clinical situation to receive SOP-guided decision support.</p>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50">
              {["Emergency","ICU","General Ward","Outpatient","Pediatrics","Surgery","Nursing"].map(d =>
                <option key={d}>{d}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1.5">Patient Scenario</label>
            <textarea value={scenario} onChange={e => setScenario(e.target.value)} rows={5}
              placeholder="e.g. Patient presenting with fever 39.5°C, suspected respiratory infection..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 bg-gray-50 resize-none" />
          </div>
          <button onClick={getDecision} disabled={!scenario.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            Get Decision Support
          </button>
          <div>
            <p className="text-xs text-gray-400 mb-2">Try an example:</p>
            <div className="space-y-1.5">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setScenario(ex)}
                  className="w-full text-left text-xs border border-gray-200 hover:border-teal-300 hover:bg-teal-50 rounded-lg px-3 py-2 text-gray-500 hover:text-teal-600 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">AI Decision Output</div>
        <div className="p-5">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
              <Brain className="w-12 h-12 mb-3" />
              <p className="text-sm text-center text-gray-400">Enter a clinical scenario to receive AI-powered decision support based on hospital SOPs.</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Analyzing scenario against SOPs...</p>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              {result.steps ? (
                result.steps.map((step: string, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm border ${
                    i === 0 ? "bg-red-50 border-red-200 text-red-800" :
                    i === 1 ? "bg-orange-50 border-orange-200 text-orange-800" :
                    i < 4 ? "bg-blue-50 border-blue-200 text-blue-800" : "bg-green-50 border-green-200 text-green-800"
                  }`}>
                    {i === 0 ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                     i === 1 ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                     i < 4 ? <Info className="w-4 h-4 flex-shrink-0 mt-0.5" /> :
                     <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <span>{step}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{result.answer}</p>
              )}
              {result.confidence > 0 && (
                <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
                  AI Confidence: <span className="text-green-600 font-semibold">{result.confidence}%</span> · Based on hospital SOP database
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
