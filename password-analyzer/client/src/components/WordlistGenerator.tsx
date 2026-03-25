import { useState } from 'react';
import { Download, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generateWordlist,
  downloadWordlist,
  copyToClipboard,
  getWordlistStats,
  WordlistOptions,
  GeneratedWordlist,
} from '@/lib/wordlistGenerator';

/**
 * WordlistGenerator Component
 * Design Philosophy: Modern Data Visualization Dashboard
 * - Customizable wordlist generation with multiple options
 * - Real-time preview and statistics
 * - Smooth animations and transitions
 * - Floating card design with gradient accents
 */

export default function WordlistGeneratorComponent() {
  const [options, setOptions] = useState<WordlistOptions>({
    count: 20,
    minLength: 4,
    maxLength: 12,
    includeNumbers: false,
    includeSpecialChars: false,
    capitalize: false,
    separator: '\n',
  });

  const [wordlist, setWordlist] = useState<GeneratedWordlist | null>(null);
  const [copied, setCopied] = useState(false);
  const [separator, setSeparator] = useState('\n');

  const handleGenerate = () => {
    const newWordlist = generateWordlist(options);
    setWordlist(newWordlist);
  };

  const handleDownload = () => {
    if (wordlist) {
      downloadWordlist(wordlist, 'wordlist.txt');
    }
  };

  const handleCopy = async () => {
    if (wordlist) {
      await copyToClipboard(wordlist, separator);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = wordlist ? getWordlistStats(wordlist) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gradient">Wordlist Generator</h2>
        <p className="text-gray-300">Create custom wordlists for testing and security purposes</p>
      </div>

      {/* Options Panel */}
      <Card className="card-glow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Word Count */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-gray-200">Number of Words</Label>
              <span className="text-cyan-400 font-bold text-lg">{options.count}</span>
            </div>
            <Slider
              value={[options.count]}
              onValueChange={(value) => setOptions({ ...options, count: value[0] })}
              min={5}
              max={1000}
              step={5}
              className="w-full"
            />
            <div className="text-xs text-gray-400">5 - 1000 words</div>
          </div>

          {/* Min Length */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-gray-200">Minimum Length</Label>
              <span className="text-cyan-400 font-bold text-lg">{options.minLength}</span>
            </div>
            <Slider
              value={[options.minLength]}
              onValueChange={(value) => setOptions({ ...options, minLength: value[0] })}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-400">1 - 20 characters</div>
          </div>

          {/* Max Length */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold text-gray-200">Maximum Length</Label>
              <span className="text-cyan-400 font-bold text-lg">{options.maxLength}</span>
            </div>
            <Slider
              value={[options.maxLength]}
              onValueChange={(value) => setOptions({ ...options, maxLength: value[0] })}
              min={options.minLength}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-400">{options.minLength} - 30 characters</div>
          </div>

          {/* Separator */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-200">Word Separator</Label>
            <Select value={separator} onValueChange={setSeparator}>
              <SelectTrigger className="bg-slate-800/50 border-cyan-500/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-cyan-500/30">
                <SelectItem value="\n">New Line</SelectItem>
                <SelectItem value=", ">Comma & Space</SelectItem>
                <SelectItem value=" ">Space</SelectItem>
                <SelectItem value="|">Pipe</SelectItem>
                <SelectItem value="-">Dash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-cyan-500/20">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="capitalize"
              checked={options.capitalize}
              onCheckedChange={(checked) =>
                setOptions({ ...options, capitalize: checked as boolean })
              }
              className="border-cyan-500/50"
            />
            <Label htmlFor="capitalize" className="text-sm font-medium text-gray-300 cursor-pointer">
              Capitalize Words
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="numbers"
              checked={options.includeNumbers}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeNumbers: checked as boolean })
              }
              className="border-cyan-500/50"
            />
            <Label htmlFor="numbers" className="text-sm font-medium text-gray-300 cursor-pointer">
              Add Numbers
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="special"
              checked={options.includeSpecialChars}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeSpecialChars: checked as boolean })
              }
              className="border-cyan-500/50"
            />
            <Label htmlFor="special" className="text-sm font-medium text-gray-300 cursor-pointer">
              Special Characters
            </Label>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold py-2 rounded-lg transition-smooth"
        >
          <RefreshCw size={18} className="mr-2" />
          Generate Wordlist
        </Button>
      </Card>

      {/* Preview Section */}
      {wordlist && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Words" value={stats?.totalWords.toString() || '0'} />
            <StatCard label="Total Characters" value={stats?.totalCharacters.toString() || '0'} />
            <StatCard label="Avg. Length" value={`${stats?.averageWordLength} chars`} />
            <StatCard label="File Size" value={stats?.estimatedFileSize || '0 KB'} />
          </div>

          {/* Preview */}
          <Card className="card-glow p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-cyan-400">Preview</h3>
              <span className="text-xs text-gray-400">Showing first 10 words</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <code className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {wordlist.words.slice(0, 10).join(separator)}
              </code>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-smooth"
            >
              {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold py-2 rounded-lg transition-smooth"
            >
              <Download size={18} className="mr-2" />
              Download
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!wordlist && (
        <Card className="card-glow p-12 text-center">
          <div className="space-y-3">
            <div className="text-5xl opacity-30">📝</div>
            <p className="text-gray-400">Configure options and generate a wordlist</p>
          </div>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="card-glow p-4 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-cyan-400">{value}</div>
    </Card>
  );
}
