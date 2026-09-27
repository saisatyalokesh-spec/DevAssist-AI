import { Inbox, BrainCircuit, Search, ClipboardCheck } from "lucide-react";

const STAGES = [
  {
    number: 1,
    icon: Inbox,
    title: "Input",
    description: "Upload a screenshot, paste an error, or describe the customer's problem.",
  },
  {
    number: 2,
    icon: BrainCircuit,
    title: "AI Analysis",
    description: "NLP/DL understands the problem, error, context, intent, and key entities.",
  },
  {
    number: 3,
    icon: Search,
    title: "RAG Troubleshooting",
    description: "Retrieves the relevant approved troubleshooting guide from the knowledge base.",
  },
  {
    number: 4,
    icon: ClipboardCheck,
    title: "Resolution",
    description: "Provides causes, steps, solution, verification, and escalation guidance.",
  },
];

export function HowItWorks() {
  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold text-slate-800">How DevAssist AI Works</h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.number} className="relative flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gradient text-sm font-semibold text-white">
                  {s.number}
                </div>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{s.title}</p>
              <p className="text-xs leading-relaxed text-slate-500">{s.description}</p>
              {idx < STAGES.length - 1 && (
                <div className="absolute -right-2 top-4 hidden h-px w-4 bg-slate-200 sm:block lg:right-[-1rem]" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
