import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Templates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-cyan mb-2">TEMPLATES</h1>
        <p className="text-muted-foreground">Manage email templates</p>
      </div>

      <Card className="bg-card border-secondary/30 glow-border-cyan">
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Create and manage phishing email templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-secondary hover:bg-secondary/80">New Template</Button>
        </CardContent>
      </Card>
    </div>
  );
}
