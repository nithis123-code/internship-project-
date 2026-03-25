import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PublicAwareness() {
  const { campaignId } = useParams<{ campaignId: string }>();

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Card className="bg-card border-primary/30 glow-border">
          <CardHeader>
            <CardTitle className="text-3xl neon-pink">PHISHING ALERT</CardTitle>
            <CardDescription>Security Awareness Training</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <h3 className="font-bold text-destructive mb-2">You Clicked a Phishing Link!</h3>
              <p className="text-sm text-muted-foreground">
                This was a simulated phishing attack for security awareness training. This message demonstrates how attackers can trick employees into clicking malicious links.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg neon-cyan">What You Should Know:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Always verify sender email addresses before clicking links</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary font-bold">•</span>
                  <span>Hover over links to see the actual URL before clicking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent font-bold">•</span>
                  <span>Be suspicious of urgent requests or unusual messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>Never enter credentials on unexpected login pages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary font-bold">•</span>
                  <span>Report suspicious emails to your IT security team</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg neon-purple">Resources:</h3>
              <p className="text-sm text-muted-foreground">
                For more information about phishing and cybersecurity best practices, visit your organization's security training portal or contact your IT department.
              </p>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
              I Understand - Close
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
