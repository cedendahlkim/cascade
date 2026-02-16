import { useState } from "react";
import { Download, Copy, Check, Terminal, Zap } from "lucide-react";
import { BRIDGE_URL } from "../config";

export default function InstallView() {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const installCmd = `irm ${BRIDGE_URL}/api/install-script | iex`;

  const copyCommand = () => {
    navigator.clipboard.writeText(installCmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-4">
      {/* One-click install */}
      <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-teal-950/40 border border-emerald-800/40 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Automatisk installation</h3>
            <p className="text-xs text-emerald-300">Ett kommando — allt installeras automatiskt</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Kör detta i <strong className="text-white">PowerShell</strong> på den dator du vill installera på.
          Scriptet laddar ner, packar upp, installerar beroenden, frågar efter API-nycklar och skapar en genväg på skrivbordet.
        </p>

        <div className="relative group">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 pr-12 font-mono text-sm text-emerald-300 break-all select-all">
            {installCmd}
          </div>
          <button
            onClick={copyCommand}
            className="absolute top-2 right-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Kopiera kommando"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500">
          <Terminal className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>Högerklicka på Start → <strong className="text-slate-300">Terminal (Admin)</strong> → klistra in → Enter</span>
        </div>
      </div>

      {/* What the script does */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Vad scriptet gör</h4>
        <div className="space-y-1.5">
          {[
            { step: "1", title: "Kontrollerar Node.js", desc: "Installerar automatiskt via winget om det saknas" },
            { step: "2", title: "Laddar ner appen", desc: "Hämtar senaste versionen som .zip från denna server" },
            { step: "3", title: "Packar upp", desc: "Installerar till C:\\Users\\[du]\\GracestackAILab" },
            { step: "4", title: "Installerar beroenden", desc: "Kör npm install + bygger webbklienten" },
            { step: "5", title: "Konfigurerar API-nycklar", desc: "Frågar efter Anthropic och Gemini-nycklar" },
            { step: "6", title: "Skapar genväg", desc: "Lägger 'Gracestack AI Lab' på skrivbordet + erbjuder att starta direkt" },
          ].map((item) => (
            <div key={item.step} className="flex gap-2.5 px-2 py-1.5 rounded-lg bg-slate-800/30">
              <div className="w-5 h-5 bg-emerald-900/60 rounded flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-emerald-300">{item.step}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">{item.title}</p>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual download fallback */}
      <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-300">Manuell nedladdning</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-2">
          Föredrar du att installera manuellt? Ladda ner .zip och följ instruktionerna i README.
        </p>
        <button
          onClick={() => {
            setDownloading(true);
            const a = document.createElement("a");
            a.href = `${BRIDGE_URL}/api/download`;
            a.download = "gracestack-ai-lab.zip";
            a.click();
            setTimeout(() => setDownloading(false), 3000);
          }}
          disabled={downloading}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
            downloading
              ? "bg-slate-700 text-slate-400 cursor-wait"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? "Laddar ner..." : "Ladda ner .zip"}
        </button>
      </div>

      {/* Requirements */}
      <div className="p-3 bg-yellow-950/30 border border-yellow-800/40 rounded-xl">
        <p className="text-xs text-yellow-300 font-medium mb-1">Krav</p>
        <ul className="text-xs text-yellow-400/80 space-y-1">
          <li>• Windows 10/11 med PowerShell 5.1+</li>
          <li>• Internetanslutning (Node.js installeras automatiskt om det saknas)</li>
          <li>• API-nyckel för Claude och/eller Gemini</li>
        </ul>
      </div>
    </div>
  );
}
