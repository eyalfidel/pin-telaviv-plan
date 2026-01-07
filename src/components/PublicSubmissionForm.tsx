import { useState, useRef, useEffect } from 'react';
import { X, Upload, MapPin, Phone, Mail, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DbParkingCondition, 
  DbPointOfInterest,
  PARKING_CONDITIONS_LABELS,
  PARKING_CONDITIONS_ORDER,
  POINTS_OF_INTEREST_LABELS 
} from '@/types/database';
import { useSubmitReport } from '@/hooks/useSubmitReport';
import { toast } from 'sonner';

interface PublicSubmissionFormProps {
  pendingLocation: { lat: number; lng: number; address?: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function PublicSubmissionForm({ 
  pendingLocation, 
  onClose, 
  onSuccess 
}: PublicSubmissionFormProps) {
  const { submit, isSubmitting } = useSubmitReport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    address: pendingLocation.address || '',
    email: '',
    phone: '',
    reporterName: '',
    parkingCondition: '' as DbParkingCondition | '',
    existingSpacesCount: '',
    pointsOfInterest: [] as DbPointOfInterest[],
    otherPoiText: '',
    comments: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Update address when it arrives from geocoding
  useEffect(() => {
    if (pendingLocation.address && !formData.address) {
      setFormData(prev => ({ ...prev, address: pendingLocation.address! }));
    }
  }, [pendingLocation.address]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePointOfInterest = (poi: DbPointOfInterest) => {
    setFormData((prev) => ({
      ...prev,
      pointsOfInterest: prev.pointsOfInterest.includes(poi)
        ? prev.pointsOfInterest.filter((p) => p !== poi)
        : [...prev.pointsOfInterest, poi],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim()) {
      toast.error('נא להזין כתובת מלאה');
      return;
    }

    if (!formData.parkingCondition) {
      toast.error('נא לבחור את מצב החניה הקיים');
      return;
    }

    const result = await submit({
      latitude: pendingLocation.lat,
      longitude: pendingLocation.lng,
      address: formData.address,
      parkingCondition: formData.parkingCondition,
      pointsOfInterest: formData.pointsOfInterest,
      otherPoiText: formData.otherPoiText || undefined,
      comments: formData.comments || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      reporterName: formData.reporterName || undefined,
      existingSpacesCount: formData.existingSpacesCount ? parseInt(formData.existingSpacesCount, 10) : undefined,
      photoFile: photoFile || undefined,
    });

    if (result.success) {
      toast.success('תודה! הדיווח שלך התקבל ויבדק בקרוב.');
      onSuccess();
    } else {
      toast.error(result.error || 'שגיאה בשליחת הדיווח');
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[420px] bg-card border-r border-border shadow-civic-lg z-[1001] flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5" />
          <div>
            <h2 className="font-semibold">דיווח מיקום חדש</h2>
            <p className="text-xs opacity-90">
              {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              כתובת מלאה <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="שם רחוב, מספר בית, תל אביב-יפו"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="field-civic"
            />
          </div>

          {/* Parking Condition */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              מצב חניית אופניים קיים <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.parkingCondition}
              onValueChange={(value) => setFormData({ ...formData, parkingCondition: value as DbParkingCondition, existingSpacesCount: value !== 'existing_needs_more' ? '' : formData.existingSpacesCount })}
              className="space-y-3"
              dir="rtl"
            >
              {PARKING_CONDITIONS_ORDER.map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <RadioGroupItem value={key} id={key} className="mt-0.5 shrink-0" />
                  <Label htmlFor={key} className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    {PARKING_CONDITIONS_LABELS[key]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {formData.parkingCondition === 'existing_needs_more' && (
              <div className="mr-6 mt-2">
                <Label htmlFor="existingSpacesCount" className="text-xs font-medium text-muted-foreground">
                  מספר עמדות חניה קיימות
                </Label>
                <Input
                  id="existingSpacesCount"
                  type="number"
                  min="1"
                  placeholder="לדוגמה: 5"
                  value={formData.existingSpacesCount}
                  onChange={(e) => setFormData({ ...formData, existingSpacesCount: e.target.value })}
                  className="field-civic mt-1 w-32"
                />
              </div>
            )}
          </div>

          {/* Points of Interest */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              האם המיקום הוא נקודת עניין?
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">ניתן לבחור מספר אפשרויות</p>
            <div className="space-y-3">
              {(Object.entries(POINTS_OF_INTEREST_LABELS) as [DbPointOfInterest, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={`poi-${key}`}
                    checked={formData.pointsOfInterest.includes(key)}
                    onCheckedChange={() => togglePointOfInterest(key)}
                  />
                  <Label htmlFor={`poi-${key}`} className="text-sm text-muted-foreground cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            
            {formData.pointsOfInterest.includes('other') && (
              <Input
                placeholder="נא לפרט..."
                value={formData.otherPoiText}
                onChange={(e) => setFormData({ ...formData, otherPoiText: e.target.value })}
                className="field-civic mt-2"
              />
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              הערות נוספות
            </Label>
            <Textarea
              id="comments"
              placeholder="הקשר נוסף או הסבר על המיקום..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
              className="field-civic resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              תמונה (אופציונלי)
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="תצוגה מקדימה"
                    className="max-h-40 mx-auto rounded-md"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                  >
                    הסר תמונה
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    לחצו להעלאת תמונה של המיקום
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Contact Details Notice */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              <strong>פרטים נוספים (אופציונלי):</strong> מסירת פרטי קשר היא אופציונלית ומשמשת רק לבירורים במידת הצורך. פרטים אלו אינם מוצגים בפומבי.
            </p>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="reporterName" className="text-xs font-medium flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  שם המדווח
                </Label>
                <Input
                  id="reporterName"
                  type="text"
                  placeholder="שם פרטי ומשפחה"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  className="field-civic h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  אימייל
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="field-civic h-9 text-sm"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  טלפון
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="050-1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="field-civic h-9 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 shrink-0">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-civic h-11"
          >
            {isSubmitting ? 'שולח...' : 'שלח דיווח'}
          </Button>
        </div>
      </form>
    </div>
  );
}
