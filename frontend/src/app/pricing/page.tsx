'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/layout/Navigation';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonStyle: string;
}

export default function PricingPage() {
  const pricingTiers: PricingTier[] = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for personal projects and learning',
      features: [
        'Unlimited public repositories',
        '3 private repositories',
        'Basic issue tracking',
        'Community support',
        '2GB storage',
        'Basic CI/CD minutes'
      ],
      buttonText: 'Get Started',
      buttonStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
    },
    {
      name: 'Pro',
      price: '$7',
      period: 'per month',
      description: 'Great for professional developers and small teams',
      features: [
        'Everything in Free',
        'Unlimited private repositories',
        'Advanced issue tracking',
        'Priority support',
        '20GB storage',
        '2,000 CI/CD minutes/month',
        'Advanced security features',
        'Team collaboration tools'
      ],
      highlighted: true,
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      name: 'Team',
      price: '$21',
      period: 'per month',
      description: 'Perfect for growing teams and organizations',
      features: [
        'Everything in Pro',
        'Up to 10 team members',
        'Team management tools',
        'Advanced analytics',
        '100GB storage',
        '10,000 CI/CD minutes/month',
        'SAML SSO',
        '24/7 priority support',
        'Advanced security & compliance'
      ],
      buttonText: 'Start Free Trial',
      buttonStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations with specific needs',
      features: [
        'Everything in Team',
        'Unlimited team members',
        'Custom integrations',
        'Dedicated support manager',
        'Unlimited storage',
        'Unlimited CI/CD minutes',
        'Advanced compliance features',
        'On-premise deployment option',
        'Custom SLA'
      ],
      buttonText: 'Contact Sales',
      buttonStyle: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that's right for you and your team
          </p>
          <div className="flex items-center justify-center space-x-4">
            <span className="text-gray-600">Monthly</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" />
              <div className="w-10 h-6 bg-gray-200 rounded-full shadow-inner"></div>
              <div className="absolute w-4 h-4 bg-white rounded-full shadow left-1 top-1 transition-transform"></div>
            </div>
            <span className="text-gray-600">
              Annual 
              <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative rounded-2xl border-2 p-8 ${
                tier.highlighted
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  {tier.period !== 'contact us' && (
                    <span className="text-gray-600 ml-1">/{tier.period}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{tier.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${tier.buttonStyle}`}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I switch plans at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and for Enterprise customers, we can arrange invoice billing.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes, all paid plans come with a 14-day free trial. No credit card required to get started.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-600">
                Your data remains accessible for 30 days after cancellation, giving you time to export or download your repositories.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer student discounts?
              </h3>
              <p className="text-gray-600">
                Yes, we offer free Pro accounts for students and educators. Contact us with your .edu email for verification.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 py-12 bg-gray-50 rounded-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers who trust DevIT with their code
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
