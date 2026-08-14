"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col h-full">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-dark-navy fill-current" />
            </div>
            <span className="text-xl font-bold text-dark-navy">
              CircuCity{' '}<span className="text-primary">AI</span>
            </span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-dark-navy">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin 
              ? "Enter your details to manage your AI agent" 
              : "Start your 14-day free trial today"}
          </p>
        </div>

        <form 
          className="space-y-4" 
          onSubmit={(e) => {
            e.preventDefault();
            onSuccess();
          }}
        >
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-dark-navy">Full Name</label>
              <Input placeholder="John Doe" required />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-navy">Email Address</label>
            <Input type="email" placeholder="name@company.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-dark-navy">Password</label>
            <Input type="password" placeholder="••••••••" required />
          </div>

          <Button variant="primary" className="w-full py-6 text-lg font-semibold mt-4">
            {isLogin ? "Sign In" : "Create Free Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-muted-foreground hover:text-dark-navy transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </Modal>
  );
}