import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, FileText, Calculator, Shield, Zap, Users } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden animate-gradient py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur rounded-full opacity-0 animate-fade-in-down">
              <Activity className="h-5 w-5 animate-pulse-soft" />
              <span className="text-sm font-medium">AI-Powered Health Analytics</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight opacity-0 animate-fade-in-up animate-delay-200">
              Understand Your Medical Reports With AI
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto opacity-0 animate-fade-in-up animate-delay-400">
              SEHAT uses advanced NLP and AI to interpret lab reports, calculate BMI, 
              and provide easy-to-understand health insights instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up animate-delay-600">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold hover-scale btn-press">
                <Link to="/report-analyzer">Analyze Report</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20 hover-scale btn-press">
                <Link to="/bmi-calculator">Calculate BMI</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 opacity-0 animate-fade-in-up">
              Your Personal Health Assistant
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto opacity-0 animate-fade-in-up animate-delay-200">
              Bridging the gap between complex medical data and patient understanding
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-100">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 animate-float">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Analysis</h3>
              <p className="text-muted-foreground">
                Upload medical reports in text, PDF, or image format. Our AI extracts values, 
                compares with reference ranges, and highlights abnormalities.
              </p>
            </Card>

            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-200">
              <div className="h-12 w-12 rounded-lg bg-gradient-warm flex items-center justify-center mb-4 animate-float animate-delay-200">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">BMI Calculator</h3>
              <p className="text-muted-foreground">
                Calculate your Body Mass Index with graphical visualization comparing 
                your results to standard health ranges.
              </p>
            </Card>

            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-300">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4 animate-float animate-delay-400">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your health data is encrypted and stored securely. Only you have access 
                to your reports and analysis results.
              </p>
            </Card>

            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-400">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4 animate-float animate-delay-100">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Insights</h3>
              <p className="text-muted-foreground">
                Get immediate explanations for abnormal values with easy-to-understand 
                medical context and recommendations.
              </p>
            </Card>

            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-500">
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4 animate-float animate-delay-300">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered NLP</h3>
              <p className="text-muted-foreground">
                Advanced Natural Language Processing extracts test names and values 
                from unstructured medical documents.
              </p>
            </Card>

            <Card className="p-6 border-2 card-hover opacity-0 animate-fade-in-up animate-delay-600">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 animate-float animate-delay-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Everyone</h3>
              <p className="text-muted-foreground">
                Designed for patients, families, and healthcare workers in areas with 
                limited access to medical professionals.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white animate-float" />
          <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-white animate-float animate-delay-300" />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white animate-float animate-delay-500" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 opacity-0 animate-fade-in-up">
            Ready to Understand Your Health Better?
          </h2>
          <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto opacity-0 animate-fade-in-up animate-delay-200">
            Join thousands of users who have gained clarity about their medical reports
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold hover-scale btn-press opacity-0 animate-fade-in-up animate-delay-400">
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>All Rights Reserved - SEHAT</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
