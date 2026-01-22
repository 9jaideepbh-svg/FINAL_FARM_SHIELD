import { ExternalLink, Phone, Calendar, Users, BadgeIndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GovernmentScheme } from "@/lib/schemes-data";

interface SchemeCardProps {
  scheme: GovernmentScheme;
  onCheckEligibility: (scheme: GovernmentScheme) => void;
}

const categoryColors: Record<string, string> = {
  'income-support': 'bg-primary/10 text-primary border-primary/30',
  'insurance': 'bg-secondary/10 text-secondary border-secondary/30',
  'credit': 'bg-accent/10 text-accent border-accent/30',
  'irrigation': 'bg-primary/10 text-primary border-primary/30',
  'marketing': 'bg-secondary/10 text-secondary border-secondary/30',
  'organic': 'bg-primary/10 text-primary border-primary/30',
};

const categoryLabels: Record<string, string> = {
  'income-support': 'Income Support',
  'insurance': 'Crop Insurance',
  'credit': 'Credit & Loans',
  'irrigation': 'Irrigation',
  'marketing': 'Marketing',
  'organic': 'Organic Farming',
};

export function SchemeCard({ scheme, onCheckEligibility }: SchemeCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge 
              variant="outline" 
              className={`mb-2 ${categoryColors[scheme.category]}`}
            >
              {categoryLabels[scheme.category]}
            </Badge>
            <CardTitle className="text-lg leading-tight">{scheme.shortName}</CardTitle>
            <CardDescription className="text-xs mt-1">{scheme.name}</CardDescription>
          </div>
          {scheme.isActive && (
            <Badge className="bg-primary/10 text-primary border-primary/30 shrink-0">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {scheme.description}
        </p>

        {/* Key Benefits */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Key Benefits</h4>
          <ul className="space-y-1">
            {scheme.benefits.slice(0, 2).map((benefit, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span className="line-clamp-1">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {scheme.beneficiaries && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="truncate">{scheme.beneficiaries}</span>
            </div>
          )}
          {scheme.budgetAllocation && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BadgeIndianRupee className="h-3.5 w-3.5" />
              <span className="truncate">{scheme.budgetAllocation}</span>
            </div>
          )}
          {scheme.deadline && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Deadline: {scheme.deadline}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4 border-t space-y-2">
          <Button 
            className="w-full" 
            onClick={() => onCheckEligibility(scheme)}
          >
            Check Eligibility
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              asChild
            >
              <a 
                href={scheme.applicationLink} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Apply
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              asChild
            >
              <a href={`tel:${scheme.helplineNumber}`}>
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Helpline
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
