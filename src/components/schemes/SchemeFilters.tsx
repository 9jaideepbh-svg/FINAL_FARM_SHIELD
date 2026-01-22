import { Grid3X3, Wallet, Shield, CreditCard, Droplets, Store, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schemeCategories, type SchemeCategory } from "@/lib/schemes-data";

interface SchemeFiltersProps {
  selectedCategory: SchemeCategory;
  onCategoryChange: (category: SchemeCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'grid': Grid3X3,
  'wallet': Wallet,
  'shield': Shield,
  'credit-card': CreditCard,
  'droplets': Droplets,
  'store': Store,
  'leaf': Leaf,
};

export function SchemeFilters({ 
  selectedCategory, 
  onCategoryChange,
  searchQuery,
  onSearchChange
}: SchemeFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Search schemes by name or keyword..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-md"
      />

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {schemeCategories.map((category) => {
          const Icon = iconMap[category.icon];
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="gap-1.5"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
