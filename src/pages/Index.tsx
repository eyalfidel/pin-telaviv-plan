import { useState } from 'react';
import { Filter, Info, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import BicycleMap from '@/components/BicycleMap';
import MapFilters from '@/components/MapFilters';
import SubmissionPanel from '@/components/SubmissionPanel';
import { useSubmissionStore } from '@/store/submissionStore';

const Index = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { getFilteredSubmissions, filters } = useSubmissionStore();

  const filteredCount = getFilteredSubmissions().length;
  const hasActiveFilters = filters.parkingConditions.length > 0 || filters.pointsOfInterest.length > 0;

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0">
          <BicycleMap />
        </div>

        {/* Filter Toggle Button */}
        <Button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className={`absolute top-4 right-4 z-[1000] shadow-civic ${
            hasActiveFilters ? 'bg-accent text-accent-foreground' : ''
          }`}
          variant={hasActiveFilters ? 'default' : 'secondary'}
        >
          <Filter className="h-4 w-4 ml-2" />
          סינון
          {hasActiveFilters && (
            <span className="mr-2 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-xs">
              פעיל
            </span>
          )}
        </Button>

        {/* Filters Panel */}
        <MapFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />

        {/* Instructions Card */}
        <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:left-4 sm:w-80 z-[1000]">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  הצע מיקום חדש
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  לחצו בכל מקום על המפה כדי להציע מיקום חדש לחניית אופניים. התרומה שלכם עוזרת לעצב את תשתית הרכיבה בתל אביב-יפו.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {filteredCount} מיקומים מוצגים
              </span>
              <a
                href="#about"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                אודות היוזמה
              </a>
            </div>
          </div>
        </div>

        {/* Submission Panel */}
        <SubmissionPanel />
      </main>
    </div>
  );
};

export default Index;
