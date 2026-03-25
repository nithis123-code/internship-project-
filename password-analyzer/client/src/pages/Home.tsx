import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PasswordAnalyzer from '@/components/PasswordAnalyzer';
import WordlistGenerator from '@/components/WordlistGenerator';

/**
 * Home Page
 * Design Philosophy: Modern Data Visualization Dashboard
 * - Tabbed interface for switching between analyzer and generator
 * - Hero section with gradient background
 * - Responsive layout with floating cards
 * - Smooth transitions and animations
 */

export default function Home() {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-blue-900 to-blue-950">
      {/* Background Pattern Overlay */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663471077378/nyeFqdR3fkuyUqTytD4mBm/pattern-overlay-gF8AhWAVw26QAF2y5oR56v.webp)',
        backgroundRepeat: 'repeat',
      }} />

      {/* Hero Section */}
      <div className="relative pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gradient">
              Password Security Suite
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Analyze password strength, generate secure wordlists, and master cybersecurity with our comprehensive tools
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <FeatureCard
              icon="📊"
              title="Password Analyzer"
              description="Get real-time feedback on password strength with detailed metrics and improvement suggestions"
            />
            <FeatureCard
              icon="📝"
              title="Wordlist Generator"
              description="Create custom wordlists for testing and security purposes with flexible configuration options"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tabs Navigation */}
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg p-1 mb-8">
              <TabsTrigger
                value="analyzer"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-smooth"
              >
                Password Analyzer
              </TabsTrigger>
              <TabsTrigger
                value="generator"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-smooth"
              >
                Wordlist Generator
              </TabsTrigger>
            </TabsList>

            {/* Analyzer Tab */}
            <TabsContent value="analyzer" className="transition-smooth">
              <PasswordAnalyzer />
            </TabsContent>

            {/* Generator Tab */}
            <TabsContent value="generator" className="transition-smooth">
              <WordlistGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-400">
          <p className="text-sm">
            Built with security best practices in mind. All analysis is performed locally in your browser.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-cyan-500/20 p-6 hover:border-cyan-400/50 hover:shadow-cyan-500/30 transition-smooth cursor-pointer">
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
