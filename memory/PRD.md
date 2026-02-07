# CareLens AI - PRD

## Problem Statement
Build a vibrant, colorful healthcare platform for rural India with GPS-based hospital finder (like Uber/Rapido/Ola), emergency ambulance service, BP monitoring, doctor portal, and interactive multilingual AI health assistant.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Lucide React icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: OpenAI GPT-5.2 via Emergent LLM key (emergentintegrations library)
- **Auth**: JWT-based (bcrypt + PyJWT)

## User Personas
1. **Patients** - Rural India, mobile-first, need health guidance in local language
2. **Doctors** - Local practitioners wanting visibility and patient connections
3. **Emergency** - Anyone needing immediate ambulance/hospital access

## Core Requirements
- GPS-based hospital finder showing nearby hospitals sorted by distance
- Interactive multilingual AI health chat (15 Indian languages)
- Blood pressure monitoring with trend visualization
- Doctor profile portal
- Emergency ambulance request service
- Vibrant, colorful, mobile-first UI

## What's Been Implemented (Feb 7, 2026)
- **Landing Page**: Hero section, features grid, languages, CTA, footer
- **Auth**: JWT login/register for patients & doctors
- **Hospital Finder**: GPS location detection, nearby hospitals, search, filters, call/directions
- **AI Chat**: GPT-5.2 multilingual assistant, WhatsApp-style interface, language picker
- **BP Monitor**: Add readings, status classification, trend chart, history
- **Doctor Portal**: Profile creation/edit form with specializations, languages, availability
- **Emergency**: Emergency numbers (108, 112, 104), ambulance request form
- **Patient Dashboard**: Health summary, quick actions, nearby hospitals
- **Seed Data**: 18 hospitals across India (Kovilpatti, Madurai, Chennai, etc.) + 5 doctors

## Testing Results
- Backend: 100% (12/12 tests passed)
- Frontend: 95% (1 minor UI fix applied)

## Backlog (P0/P1/P2)
- **P1**: Voice input for AI chat (speech-to-text)
- **P1**: Real-time ambulance tracking
- **P1**: Doctor appointment booking
- **P2**: Push notifications for BP reminders
- **P2**: Health report PDF generation
- **P2**: Doctor ratings & reviews from patients
- **P2**: Telemedicine video consultation
