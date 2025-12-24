# Product Requirements Document (PRD): CookieVoting

## 1. Introduction
**CookieVoting** is a web application designed to facilitate cookie competitions. It allows administrators to organise events, upload photos of cookie plates, automatically detect individual cookies using AI, and enables users to vote for their favorites across various categories.

## 2. Goals & Objectives
- **Streamline Competition Management**: Easy tools for admins to set up events and manage entries.
- **Accurate & Easy Identification**: specific cookies within group photos are identified and labeled automatically.
- **Fair & Fun Voting**: Simple interface for users to cast votes.
- **Instant Results**: Real-time tallying and display of winners.

## 3. User Roles
- **Admin**: Creates events, uploads images, corrects cookie detection, manages categories/bakers, views raw data.
- **Voter**: Joins via link. Voters can vote without being logged in (Anonymous Auth), but are limited to a single vote submission per event (enforced via User ID).

## 4. Key Features

### 4.1 Event Management (Admin)
- **Dashboard**: Central hub for managing the competition.
- **Event Creation**: Initialize a new voting event with a unique ID and Name.
- **Status Control**: Toggle event between 'Voting' (active) and 'Completed' (results visible).
- **Date/Time**: Set "Results Available Time" to automatically reveal results.

### 4.2 Image Processing & Cookie Detection
- **Upload**: Admins upload images of plates (categories).
- **AI Detection**:
    - Uses Google Gemini Vision API to detect cookies.
    - Returns bounding boxes/polygons for each cookie.
- **Visualizer**: Admin interface to see and verify detections.
- **Correction**: (Implied) Ability to adjust or confirm detections.

### 4.3 Category & Baker Management
- **Categories**: Represents a "Plate" or grouping of cookies.
    - Can be reordered (Up/Down).
    - Contains a list of detected cookies.
- **Bakers**:
    - Extracted from category data.
    - Can be added/removed manually.
    - mapped to specific cookies.

### 4.4 Voting Experience
The voting process follows a wizard flow:
1.  **Landing**: Welcome screen with event name and category overview.
2.  **Voting Session**:
    - User iterates through categories.
    - Selects favorite cookies in each category (clicking on the detected cookie image).
    - "Votes" are stored locally until submission.
3.  **Submission**: Votes are sent to Firestore.
4.  **Waiting**: If the event is still active, user sees a countdown/waiting screen.
5.  **Results**: Once event is completed or timer expires, results are shown.

### 4.5 Results & Analytics
- **Real-time Calculation**: Results are aggregated from `UserVote` documents.
- **Display**:
    - Shows winners per category.
    - Detailed breakdown of votes.
- **Export**: Admin can export results to CSV or JSON.

## 5. Technical Architecture
### 5.1 Frontend
- **Framework**: React 19 with TypeScript and Vite.
- **Styling**: CSS Modules (e.g., `*.module.css`).
- **State Management**: Zustand stores + React Context/Hooks.
- **Routing**: React Router DOM.
- **Build**: Vite.

### 5.2 Backend & Data
- **Firebase Auth**:
    - Supports Anonymous Auth (for voters) and Email/Password (for admins).
    - Custom Claims (`admin: true`) used for Global Admins.
- **Firebase Firestore**: Main database.
    - `events`: Stores `VoteEvent`.
    - `categories`: Stores `Category` data.
    - `votes`: Stores `UserVote`. **Publicly writeable** to allow easy voting.
    - `image_detections`: Read-only for clients; written by Cloud Functions.
- **Firebase Storage**: Stores images. Triggers Cloud Functions on upload.
- **Firebase Functions**:
    - `imageProcessing.ts`: Handles Gemini API calls upon image upload to `images/`.
    - Secures the API key and handles data formatting.

### 5.3 AI Integration
- **Google Gemini**:
    - Model: Gemini 3 (as specified by user).
    - Function: Object detection in images.

## 6. Data Model
- **VoteEvent**: `id`, `name`, `adminCode`, `status`, `resultsAvailableTime`.
- **Category**: `id`, `name`, `imageUrl`, `cookies[]` (coordinates).
- **CookieCoordinate**: `id`, `number`, `makerName`, `x`, `y`, `detectionId`.
- **UserVote**: `userId`, `votes` (map of categoryId -> cookieNumber).

## 7. Future/Planned Features
- **Remote Voting**: Support for users not physically present (already supported via web).
- **Multiple Events**: Better UI for switching between historical events.
- **Enhanced AI**: Better recognition of cookie types/labels.
