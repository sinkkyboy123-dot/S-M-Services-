import Link from "next/link";
import { BarChart2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB]">
      <div className="max-w-screen-xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 bg-[#0B5D3B] rounded-lg flex items-center justify-center">
                <BarChart2 size={13} className="text-white" />
              </div>
              <span className="font-bold text-[#111827] text-sm">
                S&amp;M <span className="text-[#0B5D3B]">Services</span>
              </span>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Professional portfolio analytics and AI-powered investment research. Powered by real-time market data from Finnhub.
            </p>
          </div>

          <div className="flex gap-14">
            <div>
              <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/portfolio" className="text-sm text-[#6B7280] hover:text-[#0B5D3B] transition-colors">Portfolio Analyzer</Link></li>
                <li><Link href="/research"  className="text-sm text-[#6B7280] hover:text-[#0B5D3B] transition-colors">Research Assistant</Link></li>
                <li><Link href="/"          className="text-sm text-[#6B7280] hover:text-[#0B5D3B] transition-colors">Platform Overview</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-3">Data</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-[#6B7280]">Finnhub API</span></li>
                <li><span className="text-sm text-[#6B7280]">Yahoo Finance</span></li>
                <li><span className="text-sm text-[#6B7280]">No mock data</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#9CA3AF]">
            © {new Date().getFullYear()} S&amp;M Services. For informational purposes only — not investment advice.
          </p>
          <p className="text-xs text-[#9CA3AF]">Market data provided by Finnhub · Price history via Yahoo Finance</p>
        </div>
      </div>
    </footer>
  );
}
