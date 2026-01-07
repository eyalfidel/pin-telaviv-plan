import { useState, useCallback } from 'react';
import { Filter, Info, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import PublicMap from '@/components/PublicMap';
import PublicFilters from '@/components/PublicFilters';
import PublicSubmissionForm from '@/components/PublicSubmissionForm';
import IntroDialog from '@/components/IntroDialog';
import { usePublicSubmissions } from '@/hooks/usePublicSubmissions';
import { reverseGeocode } from '@/lib/geocoding';

const Index = () => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  
  const { 
    getFilteredSubmissions, 
    filters, 
    setFilters, 
    clearFilters,
    refetch,
    isLoading 
  } = usePublicSubmissions();

  const filteredSubmissions = getFilteredSubmissions();
  const hasActiveFilters = filters.parkingConditions.length > 0 || filters.pointsOfInterest.length > 0;

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    // Set location immediately to show the form
    setPendingLocation({ lat, lng });
    
    // Fetch address in background
    const address = await reverseGeocode(lat, lng);
    if (address) {
      setPendingLocation(prev => prev ? { ...prev, address } : null);
    }
  }, []);

  const handleFormClose = () => {
    setPendingLocation(null);
  };

  const handleFormSuccess = () => {
    setPendingLocation(null);
    refetch();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <IntroDialog />

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0">
          <PublicMap 
            submissions={filteredSubmissions}
            pendingLocation={pendingLocation}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-card px-4 py-2 rounded-full shadow-civic border border-border">
            <span className="text-sm text-muted-foreground">טוען מיקומים...</span>
          </div>
        )}

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
        <PublicFilters 
          isOpen={isFiltersOpen} 
          onClose={() => setIsFiltersOpen(false)}
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Instructions Card */}
        <div className="absolute bottom-6 left-4 right-4 sm:right-auto sm:left-4 sm:w-80 z-[1000]">
          <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-civic border border-border p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  דווחו על מיקום חדש
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  לחצו בכל מקום על המפה כדי לדווח על מיקום שזקוק לחניית אופניים. 
                  התרומה שלכם עוזרת לעצב את תשתית הרכיבה בתל אביב-יפו.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {filteredSubmissions.length} מיקומים מוצגים
              </span>
              <Link
                to="/privacy"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                מדיניות פרטיות
              </Link>
            </div>
          </div>
        </div>

        {/* Submission Form Panel */}
        {pendingLocation && (
          <PublicSubmissionForm 
            pendingLocation={pendingLocation}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
