import { useState, useEffect } from 'react';
import { Bike, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const INTRO_DISMISSED_KEY = 'tlv-bike-parking-intro-dismissed';

export default function IntroDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(INTRO_DISMISSED_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(INTRO_DISMISSED_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">
            מיפוי צרכי חניית אופניים בתל אביב-יפו
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/80 pt-4 leading-relaxed text-right">
            פיילוט ציבורי זה מאפשר לתושבים לסייע במיפוי צרכי חניית אופניים בעיר.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 border border-border my-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="mb-2">
                המידע משמש למטרות לימוד ותכנון בלבד.
              </p>
              <p className="mb-2">
                כל דיווח נבדק באופן פרטני, בכפוף למגבלות תכנון ויישום.
              </p>
              <p className="font-medium text-foreground">
                השימוש בכלי זה אינו מהווה התחייבות לביצוע.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <Button onClick={handleDismiss} className="w-full btn-civic">
            הבנתי, בואו נתחיל
          </Button>
          <a 
            href="/privacy" 
            className="text-xs text-center text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            מדיניות פרטיות
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
