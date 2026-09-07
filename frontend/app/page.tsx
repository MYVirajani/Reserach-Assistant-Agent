"use client";

import { useState } from "react";

const TRAIL = [
  {
    label: "Plan",
    detail: "Breaks your topic into focused sub-questions worth chasing down.",
  },
  {
    label: "Search",
    detail: "Runs each sub-question against the open web for live sources.",
  },
  {
    label: "Read",
    detail: "Fetches each source and pulls out the parts that matter.",
  },
  {
    label: "Synthesize",
    detail: "Writes a structured report, citing every claim back to its source.",
  },
];

export default function Home() {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted topic:", topic);
  };

  return (
    <main className="min-h-screen bg-[#F0EEE4] text-[#20241F] font-sans">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-16 md:gap-12">
          <div className="animate-[fadeUp_0.6s_ease-out]">
            <h1 className="font-serif text-[2.75rem] md:text-[3.4rem] leading-[1.05] font-semibold tracking-tight text-[#20241F]">
               Start your research.
               <br />
              Finish with a cited report.
              
            </h1>
            <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-[#5B6B5E]">
             It plans, searches, reads every source, and writes up what it
              finds.
            </p>

            <form onSubmit={handleSubmit} className="mt-10">
              <div className="relative border border-[#20241F]/15 bg-[#F7F5EE] rounded-sm">
    
                <div className="absolute -top-3 left-5 bg-[#B8863B] text-[#F7F5EE] text-xs font-medium px-2.5 py-1 rounded-sm">
                  Topic
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. recent advances in retrieval augmented generation"
                  rows={3}
                  className="w-full bg-transparent px-5 pt-7 pb-5 text-[0.98rem] leading-relaxed text-[#20241F] placeholder:text-[#20241F]/35 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!topic.trim()}
                className="mt-4 inline-flex items-center gap-2 bg-[#20241F] text-[#F0EEE4] px-6 py-3 rounded-sm text-sm font-medium tracking-wide hover:bg-[#3A4038] disabled:bg-[#20241F]/25 disabled:cursor-not-allowed transition-colors"
              >
                Start Research
              </button>
            </form>
          </div>

          
          <div className="flex flex-col justify-center">
            <div className="border-l-2 border-[#B8863B]/40 pl-6 flex flex-col gap-7">
              {TRAIL.map((step, i) => (
                <div key={step.label} className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#B8863B]" />
                  <div className="text-xs text-[#5B6B5E] mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="font-serif text-lg font-semibold text-[#20241F]">
                    {step.label}
                  </div>
                  <div className="text-sm text-[#5B6B5E] leading-relaxed mt-0.5">
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --font-serif: "Source Serif 4", serif;
          --font-sans: "IBM Plex Sans", sans-serif;
        }
        .font-serif {
          font-family: var(--font-serif);
        }
        .font-sans {
          font-family: var(--font-sans);
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}