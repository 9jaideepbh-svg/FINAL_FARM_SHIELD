import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LaborerProfile } from "@/lib/krishi-setu/dummyData";
import { getSkillLabel } from "@/lib/krishi-setu/skills";
import { useTranslation, Language } from "@/lib/krishi-setu/i18n";
import { MapPin, Briefcase, Clock, IndianRupee, Phone, ShieldCheck, Languages, User } from "lucide-react";

interface LaborProfileCardProps {
  profile: LaborerProfile;
  lang: Language;
  onCall?: (mobile: string) => void;
  isFarmerView?: boolean;
}

export function LaborProfileCard({ profile, lang, onCall, isFarmerView = true }: LaborProfileCardProps) {
  const t = useTranslation(lang);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString(lang === 'en' ? 'en-IN' : 'en-IN', {
      day: 'numeric', month: 'short'
    });
  };

  const getShiftLabel = (shift: string) => {
    if (shift === 'day') return t('dayShift');
    if (shift === 'night') return t('nightShift');
    return t('bothShifts');
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Header Profile Section */}
      <div className="bg-gradient-to-r from-amber-600/90 to-amber-700/90 p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-center">
            <div className="bg-white/20 p-3 rounded-full shrink-0">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {profile.name}
                {profile.verified && (
                  <ShieldCheck className="h-5 w-5 text-green-300" aria-label="Verified" />
                )}
              </h3>
              <div className="flex items-center gap-1.5 text-white/80 mt-1 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.village} {profile.distance !== undefined ? `(${profile.distance.toFixed(1)} km)` : ''}</span>
              </div>
            </div>
          </div>
          {profile.verified && (
             <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
               ★ {profile.rating.toFixed(1)}
             </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-5">
        {/* Core Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {t('experience')}
            </span>
            <span className="font-medium text-sm">
              {profile.experience === 0 ? t('fresher') : `${profile.experience} ${t('experienceYears')}`}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> {t('wage')}
            </span>
            <span className="font-medium text-sm">₹{profile.wage} / day</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t('shift')}
            </span>
            <span className="font-medium text-sm">{getShiftLabel(profile.shift)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Languages className="h-3 w-3" /> {t('languagesSpoken')}
            </span>
            <span className="font-medium text-sm truncate" title={profile.languages.join(', ')}>
              {profile.languages.join(', ')}
            </span>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              {getSkillLabel(profile.primarySkill, lang)}
            </Badge>
            {profile.secondarySkill && (
              <Badge variant="outline" className="text-muted-foreground">
                {getSkillLabel(profile.secondarySkill, lang)}
              </Badge>
            )}
          </div>
        </div>

        {/* AI Bio */}
        <div className="mb-5 bg-muted/50 p-3 rounded-lg border border-border/50">
          <p className="text-sm text-foreground/90 italic">"{profile.bio}"</p>
        </div>

        {/* Action Area */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Avail:</span> {formatDate(profile.availableFrom)} - {formatDate(profile.availableTo)}
          </div>
          
          {isFarmerView ? (
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 shadow-sm"
              onClick={() => onCall && onCall(profile.mobile)}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              {t('callNow')}
            </Button>
          ) : (
            <Badge variant="secondary" className="rounded-full">Ready to Hire</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
