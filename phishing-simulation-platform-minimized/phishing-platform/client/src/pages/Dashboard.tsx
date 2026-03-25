import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const campaignsQuery = trpc.campaigns.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold neon-pink mb-4">PHISHING SIMULATOR</h1>
          <p className="text-lg neon-cyan mb-8">Security Awareness Training Platform</p>
          <Button size="lg" onClick={() => window.location.href = `/api/oauth/login?returnPath=${window.location.pathname}`}>
            LOGIN
          </Button>
        </div>
      </div>
    );
  }

  const campaigns = campaignsQuery.data || [];
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const completedCampaigns = campaigns.filter(c => c.status === "completed").length;

  // Mock data for charts
  const chartData = [
    { name: "Week 1", clicks: 45, recipients: 120 },
    { name: "Week 2", clicks: 52, recipients: 120 },
    { name: "Week 3", clicks: 48, recipients: 120 },
    { name: "Week 4", clicks: 61, recipients: 120 },
  ];

  const pieData = [
    { name: "Clicked", value: 35 },
    { name: "Not Clicked", value: 65 },
  ];

  const COLORS = ["hsl(320 100% 50%)", "hsl(180 100% 50%)"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 blur-xl rounded-lg"></div>
        <div className="relative bg-card border border-primary/30 rounded-lg p-8 hud-corner hud-corner-tl">
          <h1 className="text-4xl font-bold neon-pink mb-2">COMMAND CENTER</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || "Agent"}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-primary/30 glow-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-pink">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-secondary/30 glow-border-cyan">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-cyan">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">Running</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-accent/30 glow-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-purple">{completedCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">Finished</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-destructive/30 glow-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">42%</div>
            <p className="text-xs text-muted-foreground mt-1">Vulnerability</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Trend */}
        <Card className="bg-card border-primary/30 glow-border">
          <CardHeader>
            <CardTitle className="neon-pink">Click Trend</CardTitle>
            <CardDescription>Weekly click activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--primary))" 
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="hsl(320 100% 50%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Click Distribution */}
        <Card className="bg-card border-secondary/30 glow-border-cyan">
          <CardHeader>
            <CardTitle className="neon-cyan">Click Distribution</CardTitle>
            <CardDescription>Overall engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--secondary))" 
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/80 text-primary-foreground neon-glow"
          onClick={() => setLocation("/campaigns")}
        >
          NEW CAMPAIGN
        </Button>
        <Button 
          size="lg" 
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground neon-glow"
          onClick={() => setLocation("/templates")}
        >
          MANAGE TEMPLATES
        </Button>
        <Button 
          size="lg" 
          className="bg-accent hover:bg-accent/80 text-accent-foreground neon-glow"
          onClick={() => setLocation("/analytics")}
        >
          VIEW ANALYTICS
        </Button>
      </div>
    </div>
  );
}
