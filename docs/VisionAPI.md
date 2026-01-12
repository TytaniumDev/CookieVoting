Production Plan: Automated Cookie Segmentation Pipeline

Architecture: Firebase Cloud Functions + Google Cloud Vision API

1. Executive Summary

This document outlines the implementation plan for an automated "Upload-to-Crop" pipeline. The goal is to allow users to upload a single group photo of Christmas cookies, automatically detect individual cookies using AI, crop them into high-resolution isolated images, and prepare them for a voting interface.

Key Technology:

Firebase Storage: Image hosting.

Cloud Functions (Node.js): Backend logic triggers.

Google Cloud Vision API: Object localization (AI).

Sharp (npm): High-performance image processing/cropping.

Firestore: Database for voting and metadata.

2. Architecture & Data Flow

User Action: User uploads batch_01/raw_tray.jpg to Firebase Storage.

Trigger: functions.storage.object().onFinalize fires.

Analysis: Function sends image to Vision API.

Response: Vision API returns bounding box coordinates for objects (cookies).

Processing: Function downloads the image and uses Sharp to slice it into cookie_01.jpg, cookie_02.jpg, etc.

Storage: Cropped images are uploaded to processed_cookies/batch_01/.

Database: Metadata (URLs, initial vote counts) is written to Firestore.

UI Update: Frontend listens to Firestore and displays the new cookies in real-time.

3. Prerequisites & Configuration

A. Google Cloud Console

Project Plan: Ensure your Firebase project is on the Blaze (Pay as you go) plan.

Why? Node.js Cloud Functions cannot make external network requests (even to Google APIs) on the Spark plan.

Cost Note: You will likely stay within the free tier limits (see Section 7), but the plan upgrade is technically required to unlock the capability.

Enable API:

Go to Google Cloud Console.

Select your project.

Navigate to APIs & Services > Library.

Search for "Cloud Vision API" and click Enable.

B. Environment Setup

Ensure you have the Firebase CLI installed and initialized:

npm install -g firebase-tools
firebase login
firebase init functions
# Select JavaScript (or TypeScript if preferred, this guide uses JS)


4. Data Modeling

Storage Structure

uploads/{batchId}/original.jpg (Input)

processed_cookies/{batchId}/{cookieId}.jpg (Output)

Firestore Schema

Collection: cookie_batches

Document: {batchId}

status: "processing" | "ready" | "error"

createdAt: Timestamp

originalImageRef: String

Subcollection: candidates

Document: {cookieId}

storagePath: "processed_cookies/..."

detectedLabel: "Cookie" (or "Food", "Baked Goods")

confidence: Number (0.0 - 1.0)

votes: 0

5. Implementation Details

Step 1: Dependencies

Navigate to your functions folder and install the required packages.

cd functions
npm install firebase-admin firebase-functions @google-cloud/vision sharp fs-extra


Step 2: The Cloud Function Code (functions/index.js)

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs-extra");

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Vision Client
const visionClient = new vision.ImageAnnotatorClient();

// CONFIGURATION
const TARGET_COLLECTION = "cookie_batches";
// Padding adds "breathing room" around the cookie so it isn't cropped too tightly.
// 0.1 = 10% extra width/height added to the crop.
const PADDING_PERCENTAGE = 0.1; 

exports.processCookieImage = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket; 
  const filePath = object.name; 
  const contentType = object.contentType;

  // --- 1. Validation ---
  if (!contentType.startsWith("image/")) return console.log("Not an image.");
  if (!filePath.startsWith("uploads/")) return console.log("Not in uploads folder.");
  if (filePath.includes("processed_cookies")) return console.log("Already processed.");

  const fileName = path.basename(filePath);
  // Assumes path format: uploads/{batchId}/original.jpg
  const batchId = path.dirname(filePath).split(path.sep).pop(); 
  
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  // Initialize Batch Status in Firestore
  const batchRef = db.collection(TARGET_COLLECTION).doc(batchId);
  await batchRef.set({
    status: "processing",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    originalImage: filePath
  }, { merge: true });

  try {
    // --- 2. Download ---
    await bucket.file(filePath).download({ destination: tempFilePath });

    // --- 3. Vision API (Object Localization) ---
    const [result] = await visionClient.objectLocalization(tempFilePath);
    const objects = result.localizedObjectAnnotations;

    if (!objects || objects.length === 0) {
      console.log("No objects detected.");
      await batchRef.update({ status: "empty" });
      return;
    }

    // Get image dimensions for pixel math
    const metadata = await sharp(tempFilePath).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    const uploadPromises = [];
    let cookieCounter = 0;

    // --- 4. Processing Loop ---
    for (const object of objects) {
      // Optional: Filter non-food items here if needed
      // if (!['Food', 'Baked goods', 'Cookie', 'Snack'].includes(object.name)) continue;

      // Calculate Bounding Box
      const vertices = object.boundingPoly.normalizedVertices;
      
      // Find min/max (0-1 range)
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      vertices.forEach(v => {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
      });

      // Convert to Pixels & Apply Padding
      let left = Math.floor(minX * imgWidth);
      let top = Math.floor(minY * imgHeight);
      let width = Math.floor((maxX - minX) * imgWidth);
      let height = Math.floor((maxY - minY) * imgHeight);

      const padX = Math.floor(width * PADDING_PERCENTAGE);
      const padY = Math.floor(height * PADDING_PERCENTAGE);

      // Ensure we don't crop outside the image
      left = Math.max(0, left - padX);
      top = Math.max(0, top - padY);
      width = Math.min(imgWidth - left, width + (padX * 2));
      height = Math.min(imgHeight - top, height + (padY * 2));

      // --- 5. Crop Image ---
      const outputFileName = `cookie_${Date.now()}_${cookieCounter++}.jpg`;
      const outputTempPath = path.join(os.tmpdir(), outputFileName);

      await sharp(tempFilePath)
        .extract({ left, top, width, height })
        .toFile(outputTempPath);

      // --- 6. Upload Crop ---
      const destination = `processed_cookies/${batchId}/${outputFileName}`;
      
      const uploadTask = bucket.upload(outputTempPath, {
        destination: destination,
        metadata: {
          contentType: 'image/jpeg',
          metadata: { parentBatch: batchId, label: object.name }
        }
      }).then(async (uploadResult) => {
        // --- 7. Save to Firestore ---
        await batchRef.collection("candidates").add({
          storagePath: destination,
          detectedLabel: object.name,
          confidence: object.score,
          votes: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return fs.remove(outputTempPath); // Cleanup temp crop
      });

      uploadPromises.push(uploadTask);
    }

    await Promise.all(uploadPromises);
    await batchRef.update({ status: "ready", totalCandidates: cookieCounter });
    
  } catch (err) {
    console.error(err);
    await batchRef.update({ status: "error", error: err.message });
  } finally {
    await fs.remove(tempFilePath); // Cleanup original temp
  }
});


6. Frontend Integration Guide

The frontend does not need to know about the API or the cropping logic. It simply uploads a file and listens for the database to change.

The "Upload & Listen" Pattern

import { getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, doc, collection, onSnapshot, setDoc } from "firebase/firestore";

// 1. Upload Function
async function uploadTray(file) {
  const batchId = Date.now().toString(); // Or a UUID
  
  // Create the batch doc first so UI can transition to loading state
  await setDoc(doc(db, "cookie_batches", batchId), { status: "uploading" });

  const storageRef = ref(storage, `uploads/${batchId}/original.jpg`);
  await uploadBytes(storageRef, file);
  
  return batchId;
}

// 2. Listening Function (React Hook Example)
function useCookieCandidates(batchId) {
  const [cookies, setCookies] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if(!batchId) return;

    // Listen to the batch status
    const batchUnsub = onSnapshot(doc(db, "cookie_batches", batchId), (doc) => {
       setStatus(doc.data()?.status);
    });

    // Listen to the candidates subcollection
    const candidatesUnsub = onSnapshot(collection(db, "cookie_batches", batchId, "candidates"), (snapshot) => {
       const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
       setCookies(data);
    });

    return () => { batchUnsub(); candidatesUnsub(); };
  }, [batchId]);

  return { cookies, status };
}


7. Cost & Limits Analysis

You specifically mentioned using the free tier. Here is the breakdown:

Service

Free Tier Limit

Overage Cost

Impact on this Feature

Cloud Vision API

1,000 units / month

$1.50 per 1,000 units

Enough for ~1,000 uploaded tray photos per month.

Cloud Functions

2,000,000 invocations / month

$0.40 per million

Virtually unlimited for your use case.

Cloud Storage

5 GB

$0.026 / GB

Images are small; cost is negligible.

Firestore

50,000 reads / day

$0.06 per 100k

Plenty for standard voting traffic.

Verdict: This architecture will comfortably run for free for development and small-to-medium scale usage.

8. Deployment Checklist

Check Billing: Ensure project is on Blaze plan.

Enable API: Vision API enabled in Cloud Console.

Deploy Functions: firebase deploy --only functions.

Security Rules: Update Storage/Firestore rules to allow users to read processed_cookies and candidates but only write to uploads and votes.