import { Hero } from "@/components/home/Hero";
import { QuickActionCards } from "@/components/home/QuickActionCards";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RecentTroubleshooting } from "@/components/home/RecentTroubleshooting";
import { AIInsights } from "@/components/home/AIInsights";
import { QuickActions } from "@/components/home/QuickActions";
import { RecommendedKnowledge } from "@/components/home/RecommendedKnowledge";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <Hero />
      <QuickActionCards />
      <HowItWorks />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTroubleshooting />
        </div>
        <div className="flex flex-col gap-6">
          <AIInsights />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecommendedKnowledge />
      </div>
    </div>
  );
}
