import { Bike, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="bg-primary text-primary-foreground shadow-sm relative z-[1002]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="bg-primary-foreground/10 p-2 rounded-lg">
              <Bike className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display font-semibold text-lg leading-tight">
                Tel Aviv–Yafo
              </h1>
              <p className="text-xs opacity-80">Bicycle Parking Initiative</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/">
              <Button
                variant="ghost"
                className={`text-primary-foreground hover:bg-primary-foreground/10 ${
                  location.pathname === '/' ? 'bg-primary-foreground/10' : ''
                }`}
              >
                Map
              </Button>
            </Link>
            <Link to="/admin">
              <Button
                variant="ghost"
                className={`text-primary-foreground hover:bg-primary-foreground/10 flex items-center gap-2 ${
                  isAdmin ? 'bg-primary-foreground/10' : ''
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-primary border-t border-primary-foreground/10 animate-slide-in-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-primary-foreground hover:bg-primary-foreground/10 ${
                  location.pathname === '/' ? 'bg-primary-foreground/10' : ''
                }`}
              >
                Map
              </Button>
            </Link>
            <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-primary-foreground hover:bg-primary-foreground/10 flex items-center gap-2 ${
                  isAdmin ? 'bg-primary-foreground/10' : ''
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
