"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  Copy, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Store, 
  Code, 
  Database, 
  Settings, 
  Rocket
} from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    storeName: "",
    storeUrl: "",
    industry: "",
    tone: "Professional",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const totalSteps = 5;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleCopyCode = () => {
    const code = `<script src="https://chatbot.circucity.com/api/widget?apiKey=YOUR_API_KEY" async></script>`;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      {/* Progress Header */}
      <div className="w-full max-w-3xl mb-12 text-center">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-muted-foreground">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm font-bold text-primary">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card className="w-full max-w-2xl border-border shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-8 md:p-12">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Store className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-navy">Business Information</h2>
                </div>
                <p className="text-muted-foreground">Tell us about your store so we can personalize your AI experience.</p>
                
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-navy">Store Name</label>
                    <Input 
                      placeholder="e.g. Tech Haven" 
                      value={formData.storeName}
                      onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-navy">Store URL</label>
                    <Input 
                      placeholder="https://techhaven.com" 
                      value={formData.storeUrl}
                      onChange={(e) => setFormData({...formData, storeUrl: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-navy">Industry/Category</label>
                    <Input 
                      placeholder="e.g. Consumer Electronics" 
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Code className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-navy">Install Your Chatbot</h2>
                </div>
                <p className="text-muted-foreground">Copy and paste this code snippet into your website's HTML just before the closing {"</body>"} tag.</p>
                
                <div className="relative group mt-6">
                  <div className="bg-dark-navy text-gray-300 p-4 rounded-xl font-mono text-sm break-all border border-white/10">
                    {`<script src="https://chatbot.circucity.com/api/widget?apiKey=YOUR_API_KEY" async></script>`}
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="absolute right-2 top-2" 
                    onClick={handleCopyCode}
                  >
                    {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-2">{isCopied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>

                <div className="mt-8 p-4 bg-muted rounded-xl flex gap-4 items-start">
                  <div className="p-2 bg-primary/20 rounded-full text-primary">
                    <Badge variant="primary" className="text-[10px]">TIP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    If you use Shopify or WooCommerce, you can also use our dedicated plugins to avoid touching the code.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Database className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-navy">Product Data Sync</h2>
                </div>
                <p className="text-muted-foreground">Upload your product catalog as a CSV or JSON file. Your AI will learn everything about your inventory instantly.</p>
                
                <div 
                  onClick={simulateUpload}
                  className={cn(
                    "mt-6 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all group",
                    isUploading ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                      "p-4 rounded-full transition-transform",
                      isUploading ? "bg-primary text-dark-navy animate-spin" : "bg-muted text-muted-foreground group-hover:text-primary"
                    )}>
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-dark-navy">
                        {isUploading ? "Processing Products..." : "Click to Upload Catalog"}
                      </p>
                      <p className="text-sm text-muted-foreground">Support CSV, JSON (Max 50MB)</p>
                    </div>
                    {isUploading && (
                      <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-primary animate-progress-bar" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-navy">AI Customization</h2>
                </div>
                <p className="text-muted-foreground">Choose the personality of your AI agent to match your brand voice.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  {["Professional", "Friendly", "Casual"].map((tone) => (
                    <div 
                      key={tone}
                      onClick={() => setFormData({...formData, tone})}
                      className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all text-center",
                        formData.tone === tone 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="font-bold text-dark-navy mb-1">{tone}</div>
                      <div className="text-xs text-muted-foreground">
                        {tone === "Professional" ? "Trustworthy & Direct" : 
                         tone === "Friendly" ? "Warm & Welcoming" : 
                         "Laid-back & Modern"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-6">
                  <label className="text-sm font-medium text-dark-navy">Optional: Brand voice examples</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-border bg-muted/30 text-sm h-24 resize-none focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="e.g. We are a high-end electronics store. We use technical terms but stay accessible..."
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="text-center space-y-8 animate-in zoom-in-95 duration-300">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary text-dark-navy rounded-full animate-bounce">
                    <Rocket className="w-12 h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-dark-navy">Your AI is Now Live!</h2>
                  <p className="text-muted-foreground">Your CircuCity AI agent is synchronized and ready to convert visitors into customers.</p>
                </div>

                <div className="bg-muted/50 rounded-2xl p-6 border border-border max-w-sm mx-auto">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-muted-foreground uppercase">Live Test Simulator</span>
                  </div>
                  <div className="space-y-3 text-left">
                    <div className="bg-white p-2 rounded-lg rounded-tl-none text-xs text-muted-foreground shadow-sm border border-border w-3/4">
                      Hello! How can I help you today?
                    </div>
                    <div className="bg-primary text-dark-navy p-2 rounded-lg rounded-tr-none text-xs font-medium shadow-sm ml-auto w-3/4">
                      Do you have the RTX 4090 in stock?
                    </div>
                    <div className="bg-white p-2 rounded-lg rounded-tl-none text-xs text-dark-navy shadow-sm border border-border w-3/4">
                      Yes! We have 3 units left in the New York warehouse. Would you like me to add one to your cart?
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/30 border-t border-border flex items-center justify-between">
            <Button 
              variant="ghost" 
              className="text-muted-foreground" 
              onClick={prevStep} 
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                variant="primary" 
                className="gap-2" 
                onClick={nextStep}
                disabled={currentStep === 3 && isUploading}
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="primary" 
                className="gap-2" 
                onClick={onComplete}
              >
                Go to Dashboard <Rocket className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}