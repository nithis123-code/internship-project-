import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Recipients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold neon-purple mb-2">TARGETS</h1>
        <p className="text-muted-foreground">Manage recipient lists and targets</p>
      </div>

      <Card className="bg-card border-accent/30 glow-border">
        <CardHeader>
          <CardTitle>Target Management</CardTitle>
          <CardDescription>Add and organize email recipients</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-accent hover:bg-accent/80">Add Recipients</Button>
        </CardContent>
      </Card>
    </div>
  );
}
