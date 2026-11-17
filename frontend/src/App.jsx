import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CommandNavbar } from "./components/CommandNavbar";

// Pages
import { AccessPortalPage } from "./pages/AccessPortalPage";
import { CitizenPortal } from "./pages/CitizenPortal";
import { ContractorTerminal } from "./pages/ContractorTerminal";
import { AuditorCommand } from "./pages/AuditorCommand";
import { AuditHistoryPage } from "./pages/AuditHistoryPage";

function AppContent() {
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("filing");
  const [showAccessPortal, setShowAccessPortal] = useState(!user);

  const handleRoleSelected = (selectedRole) => {
    setShowAccessPortal(false);
    if (selectedRole === "citizen") setActiveTab("filing");
    else if (selectedRole === "fixer") setActiveTab("assigned");
    else if (selectedRole === "admin") setActiveTab("command");
  };

  const handleLogout = () => {
    logout();
    setShowAccessPortal(true);
  };

  // If on Access Portal Entry Screen
  if (showAccessPortal || !user) {
    return <AccessPortalPage onRoleSelected={handleRoleSelected} />;
  }

  // Render Portal according to active Role & Tab
  const renderPortalView = () => {
    if (role === "citizen") {
      return <CitizenPortal activeTab={activeTab} onTabChange={setActiveTab} />;
    }

    if (role === "fixer") {
      return <ContractorTerminal activeTab={activeTab} onTabChange={setActiveTab} />;
    }

    if (role === "admin") {
      if (activeTab === "ledger") {
        return <AuditHistoryPage onNavigate={() => {}} onSelectComplaint={() => {}} />;
      }
      return <AuditorCommand activeTab={activeTab} onTabChange={setActiveTab} />;
    }

    return <CitizenPortal activeTab={activeTab} onTabChange={setActiveTab} />;
  };

  return (
    <div className="command-app">
      {/* Single Clean Top Command Header - Left Sidebar is Completely Removed */}
      <CommandNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onSwitchRole={handleLogout}
        currentPortal={role}
      />

      {/* Main Command Workspace */}
      <main className="command-main">
        {renderPortalView()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
