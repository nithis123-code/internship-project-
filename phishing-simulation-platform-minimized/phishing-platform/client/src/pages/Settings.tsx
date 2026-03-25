import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-pink mb-2">SETTINGS</h1>
        <p className="text-muted-foreground">Configure your account and preferences</p>
      </div>

      <Card className="bg-card border-primary/30 glow-border">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Settings panel coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
