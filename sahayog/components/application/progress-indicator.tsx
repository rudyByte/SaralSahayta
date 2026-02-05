'use client'

import { Check } from 'lucide-react'

interface Step {
    number: number
    name: string
    percentage: number
}

interface ProgressIndicatorProps {
    currentStep: number
    steps: Step[]
}

export function ProgressIndicator({ currentStep, steps }: ProgressIndicatorProps) {
    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex-1 flex items-center">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step.number < currentStep
                                        ? 'bg-green-600 text-white'
                                        : step.number === currentStep
                                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {step.number < currentStep ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    step.number
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <p
                                    className={`text-sm font-medium ${step.number === currentStep
                                            ? 'text-blue-600'
                                            : step.number < currentStep
                                                ? 'text-green-600'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    {step.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{step.percentage}%</p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-1 mx-4 -mt-12">
                                <div
                                    className={`h-full rounded transition-all ${step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                                        }`}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
