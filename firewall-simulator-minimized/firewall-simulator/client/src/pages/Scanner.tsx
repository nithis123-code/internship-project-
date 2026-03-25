import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Shield, Zap } from "lucide-react";

interface ScanResult {
  id: number;
  url: string;
  status: "pending" | "scanning" | "completed" | "failed";
  severity: "critical" | "high" | "medium" | "low" | "info" | null;
  totalVulnerabilities: number | null;
  criticalCount: number | null;
  highCount: number | null;
  mediumCount: number | null;
  lowCount: number | null;
  infoCount: number | null;
  scanDuration: number | null;
  errorMessage: string | null;
  vulnerabilities?: Array<{
    id: number;
    type: string;
    category: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    title: string;
    description: string | null;
    remediation: string | null;
    evidence: Record<string, unknown>;
  }>;
}

export default function Scanner() {
  const [url, setUrl] = useState("");
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  const startScanMutation = trpc.scanner.startScan.useMutation();
  const getScanQuery = trpc.scanner.getScan.useQuery(
    { scanId: selectedScan?.id || 0 },
    { enabled: !!selectedScan }
  );
  const listScansQuery = trpc.scanner.listScans.useQuery();

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      const scan = await startScanMutation.mutateAsync({ url });
      setCurrentScan(scan);
      setUrl("");

      // Poll for updates
      const pollInterval = setInterval(async () => {
        const updated = await getScanQuery.refetch();
        if (updated.data?.status === "completed" || updated.data?.status === "failed") {
          clearInterval(pollInterval);
          setCurrentScan(updated.data);
        }
      }, 2000);

      // Clear interval after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
    } catch (error) {
      console.error("Scan failed:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900 text-red-200";
      case "high":
        return "bg-orange-900 text-orange-200";
      case "medium":
        return "bg-yellow-900 text-yellow-200";
      case "low":
        return "bg-blue-900 text-blue-200";
      default:
        return "bg-slate-700 text-slate-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
      case "low":
        return <Zap className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const displayScan = selectedScan && getScanQuery.data ? getScanQuery.data : currentScan;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Web Vulnerability Scanner
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Scan any website for security vulnerabilities including SSL/TLS issues, missing security headers,
            web vulnerabilities, outdated libraries, and weak password policies.
          </p>

          {/* Scanner Input */}
          <form onSubmit={handleStartScan} className="flex gap-2 max-w-2xl">
            <Input
              type="text"
              placeholder="Enter URL (e.g., example.com or https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={startScanMutation.isPending}
              className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={!url.trim() || startScanMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white whitespace-nowrap"
            >
              {startScanMutation.isPending ? "Scanning..." : "Scan"}
            </Button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {displayScan ? (
              <div className="space-y-6">
                {/* Scan Status */}
                <Card className="bg-card border-border/50 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{displayScan.url}</h2>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            displayScan.status === "completed"
                              ? "bg-green-900 text-green-200"
                              : displayScan.status === "failed"
                                ? "bg-red-900 text-red-200"
                                : displayScan.status === "scanning"
                                  ? "bg-blue-900 text-blue-200 animate-pulse"
                                  : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          {displayScan.status.charAt(0).toUpperCase() + displayScan.status.slice(1)}
                        </Badge>
                        {displayScan.severity && (
                          <Badge className={getSeverityColor(displayScan.severity)}>
                            {displayScan.severity.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {displayScan.status === "completed" && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-border/50">
                      <div>
                        <div className="text-3xl font-bold text-cyan-400">
                          {displayScan.totalVulnerabilities}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Issues</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-red-400">{displayScan.criticalCount}</div>
                        <div className="text-sm text-muted-foreground">Critical</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-orange-400">{displayScan.highCount}</div>
                        <div className="text-sm text-muted-foreground">High</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-yellow-400">{displayScan.mediumCount}</div>
                        <div className="text-sm text-muted-foreground">Medium</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-blue-400">{displayScan.lowCount}</div>
                        <div className="text-sm text-muted-foreground">Low</div>
                      </div>
                    </div>
                  )}

                  {displayScan.scanDuration && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      Scan completed in {(displayScan.scanDuration / 1000).toFixed(2)}s
                    </div>
                  )}

                  {displayScan.errorMessage && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-200 text-sm">
                      {displayScan.errorMessage}
                    </div>
                  )}
                </Card>

                {/* Vulnerabilities List */}
                {displayScan.vulnerabilities && displayScan.vulnerabilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Vulnerabilities Found</h3>
                    <div className="space-y-3">
                      {displayScan.vulnerabilities.map((vuln) => (
                        <Card
                          key={vuln.id}
                          className="bg-card border-border/50 p-4 hover:border-cyan-500/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${getSeverityColor(vuln.severity)} p-1.5 rounded`}>
                              {getSeverityIcon(vuln.severity)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground">{vuln.title}</h4>
                                <Badge className={getSeverityColor(vuln.severity)} variant="outline">
                                  {vuln.severity}
                                </Badge>
                              </div>
                              {vuln.description && (
                                <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                              )}
                              {vuln.remediation && (
                                <details className="text-sm">
                                  <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                                    View Remediation
                                  </summary>
                                  <div className="mt-2 p-2 bg-background rounded text-foreground">
                                    {vuln.remediation}
                                  </div>
                                </details>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {displayScan.status === "completed" && displayScan.totalVulnerabilities === 0 && (
                  <Card className="bg-green-900/20 border-green-700/50 p-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-200 mb-1">No Vulnerabilities Found</h3>
                    <p className="text-green-300/80">Great job! This website appears to be secure.</p>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-card border-border/50 p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Scan Selected</h3>
                <p className="text-muted-foreground">Start a new scan or select one from your history</p>
              </Card>
            )}
          </div>

          {/* Sidebar - Scan History */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">Recent Scans</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {listScansQuery.data && listScansQuery.data.length > 0 ? (
                listScansQuery.data.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => setSelectedScan(scan)}
                    className={`w-full text-left p-3 rounded border transition-all ${
                      selectedScan?.id === scan.id
                        ? "bg-cyan-900/30 border-cyan-500/50"
                        : "bg-card border-border/50 hover:border-cyan-500/30"
                    }`}
                  >
                    <div className="font-mono text-xs text-cyan-400 truncate">{scan.url}</div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge
                        className={`text-xs ${
                          scan.status === "completed"
                            ? "bg-green-900 text-green-200"
                            : scan.status === "failed"
                              ? "bg-red-900 text-red-200"
                              : "bg-blue-900 text-blue-200"
                        }`}
                      >
                        {scan.status}
                      </Badge>
                      {scan.severity && (
                        <span className={`text-xs font-semibold ${getSeverityColor(scan.severity)}`}>
                          {scan.severity}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No scan history yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
