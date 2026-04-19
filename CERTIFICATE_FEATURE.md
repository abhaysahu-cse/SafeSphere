# Certificate Generation Feature

## Overview
Added automatic certificate generation feature to the profile page. Users can view, download, and share certificates for completed courses.

## Features Implemented

### 1. Certificate Display
- Beautiful certificate cards with preview
- Shows course title, completion date, score, and level
- Verified badge on each certificate
- Professional blue gradient design matching SafeSphere branding

### 2. Certificate Information
- Certificate ID (unique identifier)
- Course title with emoji
- Completion date (formatted as "15 March 2026")
- Score percentage
- Level (BEGINNER, INTERMEDIATE, ADVANCED)
- XP earned

### 3. Download PDF Functionality
- Click "📥 Download PDF" button
- Opens printable certificate in new window
- Professional certificate layout with:
  - SafeSphere Academy header
  - User's name
  - Course title
  - Score and level
  - Certificate ID
  - Verification URL
  - Border design
- Automatically triggers print dialog

### 4. Share Functionality
- Click "🔗 Share" button
- Copies shareable text to clipboard
- Format: "I earned a verified certificate for [Course] from SafeSphere Academy! ID: [ID]"
- Visual feedback (button changes to "✅ Copied!")

### 5. How to Earn Section
- Informative card explaining the process:
  1. Complete a module
  2. Pass the quiz (70%+)
  3. Get certified instantly

### 6. Empty State
- Shows when no certificates earned yet
- Friendly message with graduation cap emoji
- Call-to-action button to "Go to Learn"

## Sample Certificates
The system comes with 3 sample certificates:
1. 🌊 Flood Safety — Farmers & Households (92%, Advanced, +150 XP)
2. 🌍 Earthquake Safety Basics (88%, Beginner, +100 XP)
3. 🔥 House Fire Prevention & Escape (95%, Beginner, +100 XP)

## Location
- **Page**: Profile page (`/profile/`)
- **Section**: Between "Your Stats" and "Achievements & Badges"
- **Files Modified**:
  - `safespera-old/safespera/safe/templates/profile.html`
  - `safespera-old/safespera/public/static/css/styles.css`

## Technical Details

### Certificate Data Structure
```javascript
{
    id: 'DSA-2026-F48X',              // Unique certificate ID
    courseTitle: '🌊 Flood Safety',   // Course name with emoji
    completedAt: '2026-03-15',        // ISO date format
    score: 92,                         // Percentage score
    level: 'ADVANCED',                 // Difficulty level
    xpEarned: 150                      // Experience points
}
```

### Functions
- `renderCertificates()` - Displays all certificates
- `downloadCertificate(cert)` - Generates and prints PDF
- `shareCertificate(cert)` - Copies share text to clipboard
- `formatDate(dateStr)` - Formats date to readable format

### Styling
- Responsive grid layout (2 columns on desktop, 1 on mobile)
- Hover effects with elevation
- Professional blue gradient matching SafeSphere brand
- Frosted glass effect on cards
- Smooth transitions

## Future Enhancements (Optional)

### Backend Integration
To make this fully functional with real data:

1. **Database Model** (Django):
```python
class Certificate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course_title = models.CharField(max_length=200)
    certificate_id = models.CharField(max_length=20, unique=True)
    completed_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField()
    level = models.CharField(max_length=20)
    xp_earned = models.IntegerField()
```

2. **API Endpoint**:
```python
# views.py
def get_certificates(request):
    certs = Certificate.objects.filter(user=request.user)
    return JsonResponse({'certificates': list(certs.values())})
```

3. **Auto-generation**:
- Trigger certificate creation when user completes module with 70%+ score
- Generate unique certificate ID
- Store in database
- Award XP to user

4. **Verification System**:
- Create verification page at `/verify/<certificate_id>/`
- Public page to verify certificate authenticity
- Shows certificate details without user info

## Testing
1. Open profile page
2. Scroll to "My Certificates" section
3. See 3 sample certificates
4. Click "Download PDF" - should open printable certificate
5. Click "Share" - should copy text to clipboard
6. Hover over cards - should see elevation effect
7. Test on mobile - should show 1 column layout

## Browser Compatibility
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- Uses standard Web APIs (window.open, clipboard)

## Notes
- Certificates are currently hardcoded sample data
- User name comes from localStorage
- Ready for backend integration
- PDF generation uses browser print functionality
- No external dependencies required
