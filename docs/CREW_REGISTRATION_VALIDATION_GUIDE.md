# Crew Registration Validation Guide

## Overview
This document explains the validation requirements for crew member registration in the Emergency Dispatch System. These validation rules are enforced both in the frontend (React) and backend (MongoDB/Mongoose) to ensure data consistency.

## ⚠️ Important Note for Team
The validation patterns defined in the `Crew` model (`apps/backend/models/Crew.js`) are **strict database-level validations**. These cannot be changed without coordinating with the team leader to avoid breaking existing functionality and causing merge conflicts.

---

## Field Validation Requirements

### 1. Employee ID
- **Format:** `EMP` followed by exactly 6 digits
- **Example:** `EMP123456`
- **Regex Pattern:** `/^EMP[0-9]{6}$/`
- **Database Validation:** Yes (unique index)
- **User Guidance:** 
  - Field has `maxLength={9}` to prevent overtyping
  - Help text shows: "Format: EMP followed by 6 digits (e.g., EMP123456)"
  - Auto-converts to uppercase

**Common Mistakes:**
- ❌ `emp123456` - lowercase (auto-fixed)
- ❌ `EMP12345` - only 5 digits
- ❌ `EMP1234567` - 7 digits
- ✅ `EMP123456` - correct format

---

### 2. Email Address
- **Format:** Standard email format (username@domain.extension)
- **Example:** `john.doe@example.com`
- **Regex Pattern:** `/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/` (backend)
- **Frontend Pattern:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Database Validation:** Yes (unique index, lowercase)
- **User Guidance:**
  - Auto-converts to lowercase
  - Help text shows: "Format: Valid email address (e.g., john.doe@example.com)"

**Common Mistakes:**
- ❌ `johndoe` - missing @ and domain
- ❌ `john@doe` - missing extension
- ❌ `john doe@example.com` - contains space
- ✅ `john.doe@example.com` - correct format

---

### 3. Phone Number (Personal & Emergency Contact)
- **Format:** `+94` followed by exactly 9 digits (Sri Lankan format)
- **Example:** `+94771234567`
- **Regex Pattern:** `/^\+94[0-9]{9}$/`
- **Database Validation:** Yes
- **User Guidance:**
  - Field has `maxLength={12}` to prevent overtyping
  - Help text shows: "Format: +94 followed by 9 digits (e.g., +94771234567)"

**Common Mistakes:**
- ❌ `0771234567` - missing country code
- ❌ `94771234567` - missing + symbol
- ❌ `+9477123456` - only 8 digits
- ❌ `+947712345678` - 10 digits
- ✅ `+94771234567` - correct format (12 characters total)

**Sri Lankan Phone Number Format:**
- Country Code: `+94`
- Mobile Operators:
  - Dialog: `77x`, `76x`
  - Mobitel: `71x`, `70x`
  - Hutch: `78x`
  - Airtel: `75x`
  - Example: `+94771234567` (Dialog mobile)

---

### 4. First Name & Last Name
- **Format:** Text, no special characters
- **Max Length:** 100 characters
- **Validation:** Required, trimmed
- **Database Validation:** Yes

---

### 5. Professional Role
- **Format:** Enum selection
- **Valid Values:**
  - `EMT` (Emergency Medical Technician)
  - `Paramedic`
  - `Firefighter`
  - `Driver`
  - `Supervisor`
- **Database Validation:** Yes (enum constraint)

---

### 6. Certification Level
- **Format:** Enum selection
- **Valid Values:**
  - `Basic`
  - `Intermediate`
  - `Advanced`
  - `Expert`
- **Database Validation:** Yes (enum constraint)

---

### 7. Hire Date
- **Format:** Date (YYYY-MM-DD)
- **Validation:** Cannot be in the future
- **Database Validation:** Yes (date validator)

---

### 8. Certifications
- **Required:** At least one complete certification
- **Fields per Certification:**
  - Type (required)
  - Number (required)
  - Issued By (required)
  - Issue Date (required)
  - Expiry Date (required, must be after issue date)

---

### 9. Emergency Contact Relationship
- **Format:** Enum selection
- **Valid Values:**
  - `Spouse`
  - `Parent`
  - `Child`
  - `Sibling`
  - `Friend`
  - `Other`
- **Database Validation:** Yes (enum constraint)

---

## User Experience Improvements

### What Was Fixed:
1. ✅ Added format hint text below each validated field
2. ✅ Improved placeholder examples
3. ✅ Added `maxLength` attributes to prevent overtyping
4. ✅ Made error messages more descriptive with examples
5. ✅ Auto-conversion of Employee ID to uppercase
6. ✅ Auto-conversion of email to lowercase

### What Cannot Be Changed:
- ❌ Database validation patterns (Crew model schema)
- ❌ Phone number country code (+94 is hardcoded for Sri Lanka)
- ❌ Employee ID format (EMP + 6 digits)
- ❌ Enum values for roles, certification levels, relationships

---

## Testing Guide

### Valid Test Data:
```json
{
  "employeeId": "EMP123456",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@respondr.lk",
  "phone": "+94771234567",
  "role": "Paramedic",
  "certificationLevel": "Advanced",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+94771234568"
  }
}
```

### Common Test Scenarios:
1. **Test Employee ID Validation:**
   - Try: `EMP123` (too short)
   - Try: `EMP12345678` (too long)
   - Try: `emp123456` (lowercase - should auto-convert)
   - Success: `EMP123456`

2. **Test Phone Validation:**
   - Try: `0771234567` (missing +94)
   - Try: `94771234567` (missing +)
   - Try: `+9477123456` (8 digits)
   - Success: `+94771234567`

3. **Test Email Validation:**
   - Try: `johndoe` (invalid)
   - Try: `john@doe` (missing extension)
   - Success: `john.doe@example.com`

---

## For Developers

### Backend Model Location:
`apps/backend/models/Crew.js`

### Frontend Validation:
`apps/web/src/components/admin/CrewRegistrationWizard.tsx`
- Function: `validatePersonalInfo()` (lines 108-140)
- Function: `validateEmergencyContact()` (lines 184-203)

### API Endpoint:
`POST /api/crew`
- Controller: `apps/backend/controllers/crewController.js`
- Route: `apps/backend/routes/crew.js`

---

## Team Coordination Notes

### ⚠️ Before Making Changes:
1. **DO NOT** modify validation patterns in `Crew.js` model without team approval
2. **DO NOT** change phone number country code
3. **DO NOT** alter enum values for roles/certifications
4. **INFORM** team leader if new validation requirements are needed

### ✅ Safe Changes:
- UI/UX improvements (help text, placeholders, styling)
- Frontend validation error messages
- Input field attributes (maxLength, placeholder)
- Auto-formatting (uppercase conversion, trim)

---

## Error Messages Reference

| Field | Error Message | Solution |
|-------|--------------|----------|
| Employee ID | Must be EMP followed by exactly 6 digits | Enter format: EMP123456 |
| Email | Please enter a valid email address | Enter format: user@domain.com |
| Phone | Must be +94 followed by exactly 9 digits | Enter format: +94771234567 |
| Emergency Phone | Must be +94 followed by exactly 9 digits | Enter format: +94771234567 |

---

## Frequently Asked Questions

**Q: Can we support other country phone formats?**
A: Not without modifying the Crew model schema and coordinating with the team. Current system is hardcoded for Sri Lankan numbers (+94).

**Q: Can we make Employee ID format more flexible?**
A: Not without database migration and team coordination. The format is enforced at database level with unique index.

**Q: Why are the validations so strict?**
A: These validations ensure:
- Data consistency across the system
- Unique identification of crew members
- Proper contact information for emergencies
- Compliance with Sri Lankan standards

**Q: What if a crew member doesn't have a +94 number?**
A: Current system only supports Sri Lankan numbers. To support international numbers, the Crew model schema must be updated by the team leader.

---

## Change Log

### 2025-10-04
- Added format hint text below validated fields
- Improved error messages with examples
- Added maxLength attributes to prevent overtyping
- Auto-conversion for Employee ID (uppercase) and Email (lowercase)
- Created this documentation guide

---

## Support

For questions or issues related to crew registration validation:
1. Check this guide first
2. Verify test data matches required formats
3. Contact team leader for schema/validation changes
4. Report UX issues for frontend improvements
