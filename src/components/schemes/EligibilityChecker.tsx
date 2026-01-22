import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, ExternalLink, Phone, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { GovernmentScheme } from "@/lib/schemes-data";

interface EligibilityCheckerProps {
  scheme: GovernmentScheme | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EligibilityChecker({ scheme, open, onOpenChange }: EligibilityCheckerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  if (!scheme) return null;

  const questions = scheme.eligibility.checkQuestions;
  const totalQuestions = questions.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;

  const handleAnswer = (answer: boolean) => {
    const questionId = questions[currentStep].id;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const isEligible = () => {
    return questions.every(q => {
      if (q.required) {
        return answers[q.id] === true;
      }
      return true;
    });
  };

  const resetChecker = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const handleClose = () => {
    resetChecker();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {scheme.shortName} Eligibility Check
          </DialogTitle>
          <DialogDescription>
            Answer a few questions to check if you're eligible for {scheme.name}
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6 py-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentStep + 1} of {totalQuestions}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                {questions[currentStep].question}
                {questions[currentStep].required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>

              <RadioGroup className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem
                    value="yes"
                    id="yes"
                    className="peer sr-only"
                    onClick={() => handleAnswer(true)}
                  />
                  <Label
                    htmlFor="yes"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="mb-2 h-6 w-6 text-green-500" />
                    <span className="font-medium">Yes</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="no"
                    id="no"
                    className="peer sr-only"
                    onClick={() => handleAnswer(false)}
                  />
                  <Label
                    htmlFor="no"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                  >
                    <XCircle className="mb-2 h-6 w-6 text-red-500" />
                    <span className="font-medium">No</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {isEligible() ? (
              <>
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <AlertTitle className="text-primary">
                    Congratulations! You appear to be eligible
                  </AlertTitle>
                  <AlertDescription className="text-primary/80">
                    Based on your answers, you meet the basic eligibility criteria for {scheme.shortName}. 
                    Proceed to apply through the official portal.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-medium">Next Steps:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">1</span>
                      <span>Visit the official portal and create an account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">2</span>
                      <span>Gather required documents (Aadhaar, land records, bank details)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">3</span>
                      <span>Complete the online application form</span>
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <a 
                      href={scheme.applicationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Apply Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`tel:${scheme.helplineNumber}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Helpline: {scheme.helplineNumber}
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert className="border-accent/30 bg-accent/5">
                  <XCircle className="h-5 w-5 text-accent" />
                  <AlertTitle className="text-accent">
                    You may not be eligible
                  </AlertTitle>
                  <AlertDescription className="text-accent/80">
                    Based on your answers, you may not meet all the eligibility criteria for {scheme.shortName}. 
                    However, we recommend contacting the helpline for personalized guidance.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h4 className="font-medium">Eligibility Criteria:</h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {scheme.eligibility.criteria.map((criteria, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" asChild>
                    <a href={`tel:${scheme.helplineNumber}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Helpline: {scheme.helplineNumber}
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={resetChecker}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Check Again
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
