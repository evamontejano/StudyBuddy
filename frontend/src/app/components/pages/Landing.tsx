import { Link } from 'react-router-dom';
import { BrainCircuit, Upload, Sparkles, MessageSquare, TrendingUp, Check, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useTheme } from '../../../lib/theme-context';

export function Landing() {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Upload,
      title: 'Upload Any Lesson',
      description: 'PDF, DOC, images, or paste text directly. We extract and process everything.'
    },
    {
      icon: Sparkles,
      title: 'AI-Generated Study Aids',
      description: 'Get summaries, key notes, and Q&A flashcards automatically created from your content.'
    },
    {
      icon: MessageSquare,
      title: 'AI Tutor Chat',
      description: 'Ask questions about your lessons or general topics. Get instant, context-aware answers.'
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Visualize your learning journey with detailed analytics and mastery tracking.'
    }
  ];

  const steps = [
    { number: '1', title: 'Upload', description: 'Upload your study material' },
    { number: '2', title: 'Generate', description: 'AI creates study cards' },
    { number: '3', title: 'Study', description: 'Review with flashcards' },
    { number: '4', title: 'Master', description: 'Track your progress' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-secondary group-hover:scale-110 transition-transform">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Study Buddy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-muted"
            >
              {theme === 'dark' ? 
                <Sun className="h-5 w-5 text-amber-500" /> : 
                <Moon className="h-5 w-5 text-primary" />
              }
            </Button>
            <Link to="/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/25">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl md:text-6xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight pb-2">
            Learn Smarter with AI-Powered Study Tools
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            Upload your lessons and let AI create summaries, flashcards, and personalized study aids.
            Master any subject faster with intelligent learning assistance.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground relative z-10">
                  <span className="font-semibold">{step.number}</span>
                </div>
                <h3 className="mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+1.5rem)] right-[calc(-50%-1.5rem)] hidden h-0.5 bg-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-12 text-center text-3xl">Powerful Features</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6">
                <Icon className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl">Why Students Love Study Buddy</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Automatic study card generation',
                'AI-powered summaries',
                'Interactive flashcard review',
                'Context-aware AI tutor',
                'Progress tracking and analytics',
                'Support for multiple formats',
                'Spaced repetition learning',
                'Export and share capabilities'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl">Your Data is Secure</h2>
          <p className="text-muted-foreground">
            We use industry-standard encryption and JWT authentication to protect your information.
            Your lessons and progress data belong to you and are never shared with third parties.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl">Ready to Learn Smarter?</h2>
          <p className="mb-8 text-muted-foreground">
            Join thousands of students already improving their study habits with AI.
          </p>
          <Link to="/signup">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="font-semibold">Study Buddy</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Study Buddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}