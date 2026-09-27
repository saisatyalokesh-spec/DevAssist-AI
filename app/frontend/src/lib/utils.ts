import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function statusColor(status: string): string {
  switch (status) {
    case "solved":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "in_progress":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "escalated":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "needs_clarification":
      return "bg-slate-100 text-slate-600 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "solved":
      return "Solved";
    case "in_progress":
      return "In Progress";
    case "escalated":
      return "Escalated";
    case "needs_clarification":
      return "Needs Clarification";
    default:
      return status;
  }
}
