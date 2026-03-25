import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { analyzePassword, PasswordStrengthResult } from '@/lib/passwordAnalyzer';

/**
 * PasswordAnalyzer Component
 * Design Philosophy: Modern Data Visualization Dashboard
 * - Real-time password strength analysis with visual feedback
 * - Gradient-based strength indicators
 * - Floating card design with soft shadows
 * - Smooth animations on state changes
 */

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<PasswordStrengthResult | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) {
      setAnalysis(analyzePassword(value));
    } else {
      setAnalysis(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'from-red-500 to-orange-500';
      case 'fair':
        return 'from-orange-500 to-yellow-500';
      case 'good':
        return 'from-yellow-500 to-green-500';
      case 'strong':
        return 'from-green-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStrengthBgColor = (strength: string) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500/20';
      case 'fair':
        return 'bg-orange-500/20';
      case 'good':
        return 'bg-green-500/20';
      case 'strong':
        return 'bg-cyan-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gradient">Password Strength Analyzer</h2>
        <p className="text-gray-300">Enter a password to analyze its strength and get improvement suggestions</p>
      </div>

      {/* Input Section */}
      <Card className="card-glow p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">Enter Password</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Type your password here..."
              className="pr-20 bg-slate-800/50 border-cyan-500/30 text-white placeholder-gray-500 focus:border-cyan-400 focus:ring-cyan-400/50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="h-8 w-8 p-0 hover:bg-cyan-500/20"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
              {password && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 hover:bg-cyan-500/20"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Strength Meter */}
        {analysis && (
          <div className="space-y-3 transition-smooth">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-300">Strength</span>
              <span className={`text-sm font-bold uppercase px-3 py-1 rounded-full ${getStrengthBgColor(analysis.strength)} text-white`}>
                {analysis.strength}
              </span>
            </div>
            <div className="space-y-2">
              <Progress
                value={analysis.percentage}
                className="h-3 bg-slate-700/50"
              />
              <div className={`h-1 rounded-full bg-gradient-to-r ${getStrengthColor(analysis.strength)} transition-smooth`} />
            </div>
            <div className="text-xs text-gray-400">
              Score: <span className="text-cyan-400 font-semibold">{analysis.score}/100</span> • Entropy: <span className="text-cyan-400 font-semibold">{analysis.metrics.entropy} bits</span>
            </div>
          </div>
        )}
      </Card>

      {/* Metrics Grid */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricBadge
            label="Length"
            value={`${analysis.metrics.length} chars`}
            active={analysis.metrics.length >= 8}
          />
          <MetricBadge
            label="Uppercase"
            value={analysis.metrics.hasUppercase ? 'Yes' : 'No'}
            active={analysis.metrics.hasUppercase}
          />
          <MetricBadge
            label="Lowercase"
            value={analysis.metrics.hasLowercase ? 'Yes' : 'No'}
            active={analysis.metrics.hasLowercase}
          />
          <MetricBadge
            label="Numbers"
            value={analysis.metrics.hasNumbers ? 'Yes' : 'No'}
            active={analysis.metrics.hasNumbers}
          />
          <MetricBadge
            label="Special Chars"
            value={analysis.metrics.hasSpecialChars ? 'Yes' : 'No'}
            active={analysis.metrics.hasSpecialChars}
          />
          <MetricBadge
            label="No Sequences"
            value={!analysis.metrics.hasSequence ? 'Yes' : 'No'}
            active={!analysis.metrics.hasSequence}
          />
        </div>
      )}

      {/* Feedback Section */}
      {analysis && analysis.feedback.length > 0 && (
        <Card className="card-glow p-6 space-y-3">
          <h3 className="font-semibold text-cyan-400">Suggestions for Improvement</h3>
          <ul className="space-y-2">
            {analysis.feedback.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-orange-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Empty State */}
      {!analysis && (
        <Card className="card-glow p-12 text-center">
          <div className="space-y-3">
            <div className="text-5xl opacity-30">🔐</div>
            <p className="text-gray-400">Enter a password to see strength analysis</p>
          </div>
        </Card>
      )}
    </div>
  );
}

interface MetricBadgeProps {
  label: string;
  value: string;
  active: boolean;
}

function MetricBadge({ label, value, active }: MetricBadgeProps) {
  return (
    <Card className={`p-4 text-center transition-smooth ${
      active
        ? 'card-glow border-emerald-500/50 bg-emerald-500/10'
        : 'border-gray-600/50 bg-slate-800/30'
    }`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`font-semibold ${active ? 'text-emerald-400' : 'text-gray-400'}`}>
        {value}
      </div>
    </Card>
  );
}
