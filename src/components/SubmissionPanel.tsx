import { useState, useRef } from 'react';
import { X, Upload, MapPin, Phone, Mail, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubmissionStore } from '@/store/submissionStore';
import { PARKING_CONDITIONS, POINTS_OF_INTEREST, ParkingCondition, PointOfInterest } from '@/types/submission';
import { toast } from 'sonner';

export default function SubmissionPanel() {
  const { isSubmissionPanelOpen, pendingLocation, closeSubmissionPanel, addSubmission } = useSubmissionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    address: '',
    email: '',
    phone: '',
    parkingCondition: '' as ParkingCondition | '',
    pointsOfInterest: [] as PointOfInterest[],
    otherPointOfInterest: '',
    comments: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePointOfInterest = (poi: PointOfInterest) => {
    setFormData((prev) => ({
      ...prev,
      pointsOfInterest: prev.pointsOfInterest.includes(poi)
        ? prev.pointsOfInterest.filter((p) => p !== poi)
        : [...prev.pointsOfInterest, poi],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pendingLocation) {
      toast.error('Location not selected');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Please enter the full address');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!formData.parkingCondition) {
      toast.error('Please select the existing parking condition');
      return;
    }

    setIsSubmitting(true);

    try {
      addSubmission({
        latitude: pendingLocation.lat,
        longitude: pendingLocation.lng,
        address: formData.address,
        email: formData.email,
        phone: formData.phone,
        photoUrl: photoPreview || undefined,
        parkingCondition: formData.parkingCondition,
        pointsOfInterest: formData.pointsOfInterest,
        otherPointOfInterest: formData.otherPointOfInterest || undefined,
        comments: formData.comments || undefined,
      });

      toast.success('Thank you! Your submission has been received and will be reviewed.');
      
      // Reset form
      setFormData({
        address: '',
        email: '',
        phone: '',
        parkingCondition: '',
        pointsOfInterest: [],
        otherPointOfInterest: '',
        comments: '',
      });
      setPhotoPreview(null);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeSubmissionPanel();
    setFormData({
      address: '',
      email: '',
      phone: '',
      parkingCondition: '',
      pointsOfInterest: [],
      otherPointOfInterest: '',
      comments: '',
    });
    setPhotoPreview(null);
  };

  if (!isSubmissionPanelOpen || !pendingLocation) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-card border-l border-border shadow-civic-lg z-[1001] flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5" />
          <div>
            <h2 className="font-semibold">Suggest New Location</h2>
            <p className="text-xs opacity-90">
              {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
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
              Full Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="Street name, house number, Tel Aviv–Yafo"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="field-civic"
            />
          </div>

          {/* Contact Details Notice */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Privacy Notice:</strong> Contact details are collected only for clarification and updates related to this submission process. Your information will not be shared publicly.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="field-civic"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Mobile Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="050-1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="field-civic"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              Photo (Optional)
            </Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
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
                    }}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a photo of the location
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

          {/* Parking Condition */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Existing Bicycle Parking <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={formData.parkingCondition}
              onValueChange={(value) => setFormData({ ...formData, parkingCondition: value as ParkingCondition })}
              className="space-y-3"
            >
              {(Object.entries(PARKING_CONDITIONS) as [ParkingCondition, string][]).map(([key, label]) => (
                <div key={key} className="flex items-start gap-3">
                  <RadioGroupItem value={key} id={key} className="mt-0.5" />
                  <Label htmlFor={key} className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Points of Interest */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Is This Location a Point of Interest?
            </Label>
            <p className="text-xs text-muted-foreground -mt-1">Select all that apply</p>
            <div className="space-y-3">
              {(Object.entries(POINTS_OF_INTEREST) as [PointOfInterest, string][]).map(([key, label]) => (
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
                placeholder="Please specify..."
                value={formData.otherPointOfInterest}
                onChange={(e) => setFormData({ ...formData, otherPointOfInterest: e.target.value })}
                className="field-civic mt-2"
              />
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Additional Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Any additional context or explanation about this location..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={4}
              className="field-civic resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 shrink-0">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-civic h-11"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Location'}
          </Button>
        </div>
      </form>
    </div>
  );
}
