import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "DevAssist AI — Debug Smarter. Build Faster.",
  description:
    "RAG-based technical troubleshooting assistant for SaaS support teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="lg:pl-[260px]">
          <Header />
          <main className="min-h-[calc(100vh-57px)] px-6 py-6">{children}</main>
        </div>
        <ChatWidget />
      </body>
    </html>
  );
}
