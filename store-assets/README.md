# WDS Store Assets - Play Store & App Store

## App Info

**App Name:** WDS Rider - Williams Delivery Service
**Package:** com.williamsdelivery.rider
**Category:** Business / Delivery
**Content Rating:** Everyone

## Short Description (80 chars)

Accra's fastest delivery app for riders. Accept jobs, earn with MoMo daily.

## Full Description (4000 chars)

WDS - Williams Delivery Service - Rider App

Join Accra's fastest growing delivery team! WDS Rider is for Williams' 24+ riders to accept delivery jobs, navigate, and earn daily via MTN MoMo, Vodafone Cash, AirtelTigo Money.

**Features:**
🏍️ See nearby jobs - Sorted by nearest, urgent first
💰 Earn 80% of delivery fee - GHS 28-52 per trip, daily payout via MoMo at 6pm
🗺️ Live navigation - Google Maps integration, avoid traffic at Tetteh Quarshie, N1
📦 All delivery types - Food, parcels, groceries, medicine, documents, errands
⭐ Build rating - 4.9 star system, level up, get more jobs
📱 Real-time updates - Supabase Realtime, customer sees your location live
💳 Multiple payouts - MTN MoMo (default), Vodafone Cash, AirtelTigo, Bank Transfer
🛡️ Insured - Up to GHS 2,000 per delivery

**How it works:**
1. Toggle Online in East Legon, Osu, Kaneshie, Madina, Airport
2. See job: Osu Oxford St → Airport Residential GHS 28 3.2km URGENT
3. Accept → Call customer → Navigate → Pickup → On the way → Delivered + photo
4. Earnings +GHS 22.4 instantly, payout daily via MoMo

**Requirements:**
- Motorbike, bicycle, car or van
- Valid license plate (e.g., AB 1234-23)
- Ghana phone (0244, 020, 054)
- Approved by Williams Admin

**For Williams Team:**
Already have 24 riders? Onboard them in 1 click. Track revenue GHS 4,280/day, 127 orders, avg 42 min delivery, commission 20% WDS, 80% rider. Admin dashboard at wds.com.gh/admin

**Tech:**
Built with Expo, Supabase, Paystack Ghana, Google Maps. Works on 3G, offline capable, PWA fallback.

**Support:**
Contact Williams: 0244 000 000 • Accra, Ghana • wds.com.gh

Download now and start earning in Accra!

## Keywords

delivery, Accra, Ghana, rider, MoMo, Williams, WDS, parcel, food delivery, courier, motorbike, earnings

## Screenshots Needed (6-8)

1. Jobs list - Available jobs near you with urgent badge, GHS 28-52
2. Active delivery - Map with route East Legon → Osu, status buttons
3. Earnings - Today's summary 7 trips, 42km, GHS 286, 4.9 rating
4. Profile - Rider name, vehicle, plate, total earnings, rating
5. Auth - Phone OTP login, role selection
6. Map - Live rider locations in Accra, 24 online

Use the web app screenshots from WDS-app/full-mvp/ - they match mobile design.

## App Icons

- Icon: 512x512 PNG, black background #0A0A0A, yellow W letter #FFC700, rounded
- Adaptive icon: Same, with safe area
- Splash: Black background, yellow W, "WDS Rider" text

Generate via: https://www.appicon.co/ or Figma

## Privacy Policy URL

Create at: https://wds.com.gh/privacy
Template:
- We collect phone, location (when online), delivery data
- Location used only for job assignment and live tracking when delivering
- Data stored in Supabase EU West, Ghana Data Protection Act compliant
- No data sold, only used for delivery operations
- Contact: privacy@wds.com.gh

## Build Commands

```bash
cd mobile
npm install
# Preview APK for sharing via WhatsApp (10-15 mins):
eas build --platform android --profile preview
# Gives link: https://expo.dev/accounts/.../builds/...

# Production AAB for Play Store:
eas build --platform android --profile production
# Then: eas submit --platform android
```

## Testing Checklist Before Submit

- [ ] Test login with 0244987654 / 123456
- [ ] Test location permission granted
- [ ] Test accept job → active → delivered flow
- [ ] Test earnings update
- [ ] Test offline toggle
- [ ] Test on 3G slow network
- [ ] Test on Android 10, 11, 12, 13

## WhatsApp Share Message for Riders

"🚀 WDS Rider App is ready! Download APK: [link from EAS build] - Log in with your phone 0244... / 123456. Toggle Online in East Legon/Osu to see jobs. Earn 80% per delivery, MoMo payout daily 6pm. Any issue call Williams 0244000000"

End of store assets.
