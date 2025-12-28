import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה למפה
          </Button>
        </Link>

        <article className="prose prose-lg max-w-none">
          <h1 className="text-2xl font-display font-bold text-foreground mb-6">
            מדיניות פרטיות
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-6">
            עמוד זה מתאר את מדיניות הפרטיות של מערכת מיפוי צרכי חניית אופניים בתל אביב-יפו.
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              איזה מידע נאסף?
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>מיקום גיאוגרפי (נקודה על המפה)</li>
              <li>כתובת כפי שהוזנה על ידי המשתמש</li>
              <li>סוג נקודת העניין</li>
              <li>מצב חניית האופניים הקיים</li>
              <li>הערות חופשיות</li>
              <li>תמונות (אופציונלי)</li>
              <li>פרטי קשר - אימייל וטלפון (אופציונלי)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              כיצד המידע משמש?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              המידע שנאסף משמש למטרות לימוד ותכנון בלבד. צוות לשכת סגנית ראש העיר לתחבורה, בטיחות וקהילה גאה - מיטל להבי משתמש בנתונים 
              כדי לזהות צרכים ולתכנן תשתיות חניית אופניים עתידיות.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              מידע פומבי לעומת פרטי
            </h2>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm text-muted-foreground mb-3">
                <strong className="text-foreground">מידע פומבי (מוצג על המפה):</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                <li>מיקום על המפה</li>
                <li>כתובת</li>
                <li>סוג נקודת עניין</li>
                <li>הערות כלליות</li>
                <li>תאריך הדיווח</li>
              </ul>
              
              <p className="text-sm text-muted-foreground mb-3">
                <strong className="text-foreground">מידע פרטי (נגיש רק לצוות הלשכה):</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>כתובת אימייל</li>
                <li>מספר טלפון</li>
                <li>סטטוס הבקשה</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              פרטי קשר
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              מסירת פרטי קשר (אימייל וטלפון) היא <strong>אופציונלית לחלוטין</strong>. 
              פרטים אלו משמשים רק לצורך בירורים במידת הצורך ואינם מוצגים בפומבי.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              אבטחת מידע
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              המידע מאוחסן במערכות מאובטחות. גישה לפרטי קשר מוגבלת לצוות הלשכה המורשה בלבד.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              יצירת קשר
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות ללשכת סגנית ראש העיר לתחבורה, בטיחות וקהילה גאה - מיטל להבי:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>טלפון: <a href="tel:03-7244655" className="text-primary hover:underline" dir="ltr">03-7244655</a></li>
              <li>אימייל: <a href="mailto:meital_l@mail.tel-aviv.gov.il" className="text-primary hover:underline">meital_l@mail.tel-aviv.gov.il</a></li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground mt-8 pt-4 border-t border-border">
            עודכן לאחרונה: {new Date().toLocaleDateString('he-IL')}
          </p>
        </article>
      </main>
    </div>
  );
}
