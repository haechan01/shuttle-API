# API Documentation

## Overview

This API is built using Express, Firebase Functions, and Firebase Firestore. It provides functionality for calculating travel time, managing student sign-ups for shuttle buses, and organizing students into bus groups. The API interacts with a Firestore database for data storage and retrieval.

## Initialization

- **Firebase Admin SDK**: The API uses Firebase Admin SDK to interact with Firestore. It is initialized with a service account for secure access to Firestore.
- **Express App**: The API uses an Express application to handle HTTP requests.
- **CORS**: Cross-Origin Resource Sharing is enabled to allow requests from different origins.

## Endpoints



### 1. `POST /api/update-eta`

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

Response:
200 OK: Returns a JSON object with a success message, eta, and distance.
500 Internal Server Error: Returns a JSON object with an error message.


### 3. POST /api/create
Creates a new product entry in the Firestore database.

- **Method**: `POST`
- **URL**: `/api/create`
- **Request Body**:
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number"
  }

Response:
200 OK: Returns a success message.
500 Internal Server Error: Returns an error message.


### 4. POST /api/signup
Registers a student for the shuttle bus service and saves the data in Firestore.

- **Method**: `POST`
- **URL**: `/api/signup`
- **Request Body**:
  ```json
  {
  "id": "string",
  "firstname": "string",
  "lastname": "string",
  "location": "string",
  "time": "string"
}
Response:
200 OK: Returns a confirmation message.
500 Internal Server Error: Returns an error message.

### 5. GET /api/get-signups
Fetches all the student sign-ups for the current day from the Firestore database.

- **Method**: `GET`
- **URL**:  `/api/get-signups`
  
Response:
200 OK: Returns an array of sign-up objects.
500 Internal Server Error: Returns an error message.


### 6. PUT /api/edit-signup/:docId
Edits an existing student sign-up entry in Firestore.

- **Method**: PUT
- **URL**:  /api/edit-signup/:docId
- **URL Parameters**: :docId: Document ID of the sign-up to be edited.
Request Body:
  ```json
  {
    "location": "string",
    "time": "string"
  }
  
Response:
200 OK: Returns a success message.
404 Not Found: Returns an error if the sign-up is not found.
500 Internal Server Error: Returns an error message.


### 7. DELETE /api/delete-signup/:docId
Deletes a student sign-up entry from Firestore.

- **Method**: DELETE
- **URL**:  /api/delete-signup/:docId
- **URL Parameters**: 
:docId: Document ID of the sign-up to be deleted.
Response:
200 OK: Returns a success message.
404 Not Found: Returns an error if the sign-up is not found.
500 Internal Server Error: Returns an error message.


### 8. POST /api/group/:busId
Groups students into a bus based on the provided bus ID.

- **Method**:  POST
- **URL**:/api/group/:busId
- **URL Parameters**: 
:busId: ID of the bus to group students into.
Request Body:
  ```json

  {
    "documentIds": ["string"],
    "location": "string",
    "time": "string"
  }
Response:
200 OK: Returns a confirmation message.
400 Bad Request: Returns an error for invalid input.
500 Internal Server Error: Returns an error message.


### 9. PUT /api/group/:busId
Updates an existing bus group in Firestore.

- **Method**: PUT
- **URL**: /api/group/:busId
- **URL Parameters**: 
:busId: ID of the bus group to be updated.
Request Body:
  ```json

  {
    "documentIds": ["string"],
    "location": "string",
    "time": "string"
  }
Response:
200 OK: Returns a success message.
400 Bad Request: Returns an error for invalid input.
500 Internal Server Error: Returns an error message.
10. DELETE /api/group/:busId
Deletes a bus group and updates student sign-ups accordingly.

- **Method**: DELETE
- **URL**:  /api/group/:busId
- **URL Parameters**:
:busId: ID of the bus group to be deleted.
Response:
200 OK: Returns a success message.
404 Not Found: Returns an error if the group is not found.
500 Internal Server Error: Returns an error message.


# Firestore Database Schema

## 1. SignUps Collection
Stores information about student sign-ups for the shuttle bus service. The collection name is dynamically based on the date.

- **Collection Name**:YYYY-MM-DD (where YYYY-MM-DD is the current date in ISO format)
- **Document ID**: Unique identifier for each sign-up (e.g., student ID-location)
- **Fields**:
  -`firstname` (string): First name of the student
  -`lastname` (string): Last name of the student
  -`location` (string): Location from where the student is signing up
  -`time` (string): Time of the sign-up
  -`group` (string, optional): The ID of the bus group the student is assigned to (used in grouping operations)

### Example Document in YYYY-MM-DD Collection
  json
  {
  "firstname": "John",
  "lastname": "Doe",
  "location": "StuFac",
  "time": "08:30",
  "group": "StuFac-08:40"  // group will be null by default, but we can have the driver group students
  }

## 2. Groups Collection
Stores information about bus groups and their members.

Collection Name: groups
- **Document ID**:Unique identifier for each bus group (e.g., bus ID)
- **Fields**:
    -`documentIds` (array of strings): List of document IDs of the students in this group
    -`location` (string): Location associated with the bus group
    -`time` (string): Time associated with the bus group

### Example Document in groups Collection
  json
  {
    "documentIds": ["s456", "s789"],
    "location": "Central Station",
    "time": "08:30"
  }

## 3. ETAs Collection
Stores estimated travel times and distances between coordinates.

- **Collection Name**: etas
- **Document ID**: Unique identifier for each ETA record (this should be the bus ID)
- **Fields**:
  - **eta** (number): Estimated travel time in minutes
  - **distance** (number): Distance between the start and end points in meters

### Example Document in etas Collection
json
{
  "eta": 15.5,
  "distance": 3940.0
}

  
### Error Handling
The API returns appropriate HTTP status codes and error messages for different error scenarios, such as missing parameters, server errors, or resource not found.

### Deployment
This API is designed to be deployed using Firebase Cloud Functions. The Express app is exported and managed by Firebase Functions to handle HTTP requests.

### CORS
Cross-Origin Resource Sharing (CORS) is enabled for all routes to allow requests from different origins. This is configured using the cors middleware with {origin: true}.

### Database
The API uses Firebase Firestore to store and retrieve data. Collections used include etas, daily collections for sign-ups, and groups.

### External Services
OSRM Public API: Used for calculating travel time and distance between two coordinates.

### Notes
Ensure the Firebase Admin SDK service account (permission.json) is correctly configured with necessary permissions to access Firestore.
Error messages are logged to the console for debugging purposes.
