"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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


const NODE_TO_STEP: Record<string, string> = {
  create_plan: "Plan",
  search: "Search",
  read: "Read",
  synthesize: "Synthesize",
};

type AgentEvent =
  | { type: "progress"; node: string; step?: string; detail?: string }
  | { type: "result"; report: string }
  | { type: "done" };

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setActiveStep(null);
    setCompletedSteps([]);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

    
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || ""; 

        for (const msg of messages) {
          const line = msg.replace(/^data: /, "").trim();
          if (!line) continue;

          let event: AgentEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue; 
          }

          if (event.type === "progress") {
            const stepLabel = NODE_TO_STEP[event.node];
            if (stepLabel) {
              setActiveStep(stepLabel);
              setCompletedSteps((prev) =>
                prev.includes(stepLabel) ? prev : [...prev, stepLabel]
              );
            }
          } else if (event.type === "result") {
            setReport(event.report);
          } else if (event.type === "done") {
            setActiveStep(null);
          }
        }
      }
    } catch (err) {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getFilename()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilename = () =>
    topic
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 50) || "research-report";

  const handleDownloadPdf = async () => {
    if (!reportRef.current || exportingPdf) return;
    setExportingPdf(true);

    try {
      
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, 
        backgroundColor: "#F7F5EE",
      });

      const imgData = canvas.toDataURL("image/png");

      
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight - margin; 
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`${getFilename()}.pdf`);
    } catch (err) {
      setError("Could not generate PDF. Try the Markdown download instead.");
    } finally {
      setExportingPdf(false);
    }
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
                disabled={!topic.trim() || loading}
                className="mt-4 inline-flex items-center gap-2 bg-[#20241F] text-[#F0EEE4] px-6 py-3 rounded-sm text-sm font-medium tracking-wide hover:bg-[#3A4038] disabled:bg-[#20241F]/25 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Researching…" : "Start research"}
              </button>
            </form>

            {error && (
              <div className="mt-6 border border-[#B8863B]/40 bg-[#B8863B]/10 text-[#8A6329] text-sm px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            {report && (
              <div className="mt-8 border border-[#20241F]/15 bg-[#F7F5EE] rounded-sm">
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#20241F]/10">
                  <div className="text-xs uppercase tracking-wide text-[#5B6B5E]">
                    Report
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={exportingPdf}
                      className="text-xs font-medium text-[#B8863B] hover:text-[#8A6329] disabled:opacity-50 transition-colors"
                    >
                      {exportingPdf ? "Preparing PDF…" : "Download PDF ↓"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="text-xs font-medium text-[#B8863B] hover:text-[#8A6329] transition-colors"
                    >
                      Download .md ↓
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto px-5 py-4">
                  <article ref={reportRef} className="prose-report">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {report}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            )}
          </div>

          
          <div className="flex flex-col justify-center">
            <div className="border-l-2 border-[#B8863B]/40 pl-6 flex flex-col gap-7">
              {TRAIL.map((step, i) => {
                const isActive = activeStep === step.label;
                const isDone =
                  completedSteps.includes(step.label) && !isActive;

                return (
                  <div key={step.label} className="relative">
                    <div
                      className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full transition-colors ${
                        isActive
                          ? "bg-[#B8863B] animate-pulse"
                          : isDone
                          ? "bg-[#5B6B5E]"
                          : "bg-[#B8863B]/30"
                      }`}
                    />
                    <div className="text-xs text-[#5B6B5E] mb-1">
                      {String(i + 1).padStart(2, "0")}
                      {isActive && (
                        <span className="ml-2 text-[#B8863B]">
                          — in progress
                        </span>
                      )}
                      {isDone && (
                        <span className="ml-2 text-[#5B6B5E]">— done</span>
                      )}
                    </div>
                    <div
                      className={`font-serif text-lg font-semibold transition-colors ${
                        isActive || isDone
                          ? "text-[#20241F]"
                          : "text-[#20241F]/50"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-sm text-[#5B6B5E] leading-relaxed mt-0.5">
                      {step.detail}
                    </div>
                  </div>
                );
              })}
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
        .prose-report {
          font-size: 0.9rem;
          line-height: 1.7;
          color: #20241f;
        }
        .prose-report h1,
        .prose-report h2,
        .prose-report h3 {
          font-family: var(--font-serif);
          font-weight: 600;
          margin-top: 1.4em;
          margin-bottom: 0.5em;
          color: #20241f;
        }
        .prose-report h1 {
          font-size: 1.4rem;
        }
        .prose-report h2 {
          font-size: 1.2rem;
        }
        .prose-report h3 {
          font-size: 1.05rem;
        }
        .prose-report p {
          margin-bottom: 0.9em;
        }
        .prose-report ul,
        .prose-report ol {
          margin-bottom: 0.9em;
          padding-left: 1.4em;
        }
        .prose-report li {
          margin-bottom: 0.3em;
        }
        .prose-report a {
          color: #b8863b;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .prose-report code {
          background: #20241f0d;
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-size: 0.85em;
        }
        .prose-report hr {
          border: none;
          border-top: 1px solid #20241f1a;
          margin: 1.4em 0;
        }
        .prose-report table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
          font-size: 0.85em;
        }
        .prose-report th,
        .prose-report td {
          border: 1px solid #20241f1a;
          padding: 0.4em 0.6em;
          text-align: left;
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