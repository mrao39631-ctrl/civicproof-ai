import React from "react";
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldCheck, HelpCircle } from "lucide-react";

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case "SUBMITTED":
        return {
          label: "Reported",
          className: "badge-cyan",
          icon: <Clock size={11} />
        };
      case "ASSIGNED":
        return {
          label: "Assigned",
          className: "badge-amber",
          icon: <Clock size={11} />
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          className: "badge-amber",
          icon: <Clock size={11} />
        };
      case "REPAIR_SUBMITTED":
        return {
          label: "Repair Proof Submitted",
          className: "badge-amber",
          icon: <Clock size={11} />
        };
      case "AI_VERIFIED_FIXED":
        return {
          label: "AI: Verified Fixed",
          className: "badge-emerald",
          icon: <ShieldCheck size={11} />
        };
      case "AI_NOT_VERIFIED":
        return {
          label: "AI: Not Verified",
          className: "badge-amber",
          icon: <AlertTriangle size={11} />
        };
      case "AI_INSUFFICIENT_EVIDENCE":
        return {
          label: "AI: Insufficient Evidence",
          className: "badge-amber",
          icon: <HelpCircle size={11} />
        };
      case "CLOSED_VERIFIED":
      case "ADMIN_APPROVED":
        return {
          label: "CLOSED - VERIFIED FIXED",
          className: "badge-emerald",
          icon: <CheckCircle2 size={11} />
        };
      case "DISPUTED":
        return {
          label: "Disputed / Flagged",
          className: "badge-rose",
          icon: <AlertTriangle size={11} />
        };
      case "ADMIN_REJECTED":
        return {
          label: "Auditor Rejected",
          className: "badge-rose",
          icon: <XCircle size={11} />
        };
      default:
        return {
          label: status,
          className: "badge-cyan",
          icon: <Clock size={11} />
        };
    }
  };

  const { label, className, icon } = getBadgeConfig();

  return (
    <span className={`badge-obsidian ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
