import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-cyan mb-2">ANALYTICS</h1>
        <p className="text-muted-foreground">Campaign performance and metrics</p>
      </div>

      <Card className="bg-card border-secondary/30 glow-border-cyan">
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
          <CardDescription>View detailed campaign statistics and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Analytics dashboard coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
