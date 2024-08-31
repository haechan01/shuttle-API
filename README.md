# API Documentation

## Overview

This API is built using Express, Firebase Functions, and Firebase Firestore. It provides functionality for calculating travel time, managing student sign-ups for shuttle buses, creating products, and organizing students into bus groups. The API interacts with a Firestore database for data storage and retrieval.

## Initialization

- **Firebase Admin SDK**: The API uses Firebase Admin SDK to interact with Firestore. It is initialized with a service account for secure access to Firestore.
- **Express App**: The API uses an Express application to handle HTTP requests.
- **CORS**: Cross-Origin Resource Sharing is enabled to allow requests from different origins.

## Endpoints

### 1. `GET /hello-world`

Returns a simple "Hello World!" message.

- **Method**: `GET`
- **URL**: `/hello-world`
- **Response**: 
  - `200 OK`: Returns a plain text response with the message `Hello world!`

### 2. `POST /api/update-eta`

Calculates travel time using the OSRM public API and updates the estimated travel time and distance for a bus in the Firestore database.

- **Method**: `POST`
- **URL**: `/api/update-eta`
- **Request Body**:
  ```json
  {
    "busId": "string",
    "startCoords": [latitude, longitude],
    "endCoords": [latitude, longitude]
  }
