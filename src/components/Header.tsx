import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bike, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, isLoading } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-[1000] shadow-civic">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary-foreground/10 p-2 rounded-lg">
              <Bike className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight">
                חניית אופניים
              </h1>
              <p className="text-xs opacity-80">תל אביב-יפו</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button 
                variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                size="sm"
                className={location.pathname === '/' ? '' : 'text-primary-foreground hover:bg-primary-foreground/10'}
              >
                מפה
              </Button>
            </Link>
            <Link to="/privacy">
              <Button 
                variant={location.pathname === '/privacy' ? 'secondary' : 'ghost'} 
                size="sm"
                className={location.pathname === '/privacy' ? '' : 'text-primary-foreground hover:bg-primary-foreground/10'}
              >
                פרטיות
              </Button>
            </Link>
            {!isLoading && isAdmin && (
              <Link to="/admin">
                <Button 
                  variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className={location.pathname === '/admin' ? '' : 'text-primary-foreground hover:bg-primary-foreground/10'}
                >
                  <Shield className="h-4 w-4 ml-1" />
                  ניהול
                </Button>
              </Link>
            )}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-primary-foreground/10 animate-fade-in">
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground">מפה</Button>
              </Link>
              <Link to="/privacy" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-primary-foreground">פרטיות</Button>
              </Link>
              {!isLoading && isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-primary-foreground">
                    <Shield className="h-4 w-4 ml-1" />
                    ניהול
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
