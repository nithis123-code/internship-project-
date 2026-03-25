import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Campaigns() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-pink mb-2">CAMPAIGNS</h1>
        <p className="text-muted-foreground">Manage your phishing simulation campaigns</p>
      </div>

      <Card className="bg-card border-primary/30 glow-border">
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>Create and manage phishing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-primary hover:bg-primary/80">Create Campaign</Button>
        </CardContent>
      </Card>
    </div>
  );
}
