const functions = require("firebase-functions");
const admin = require("firebase-admin");

var serviceAccount = require("./permission.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const express= require("express")
const app = express();

const db = admin.firestore();
app.use(express.json());
// CORS
const cors = require("cors");
app.use(cors({origin: true}))

// Routes
app.get('/hello-world', (req, res) => {
    return res.status(200).send('Hello world!')
});


// Function to request the route and calculate travel time using OSRM public API
async function getTravelTime(startCoords, endCoords) { 
    const url = `http://router.project-osrm.org/route/v1/driving/${startCoords.join(',')};${endCoords.join(',')}?overview=false`
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("server error")
        }
        const data = await response.json()
        const travelTimeInSeconds = data.routes[0].duration;
        const travelTimeInMinutes = (travelTimeInSeconds / 60).toFixed(2);
        const travelDistance = data.routes[0].distance

        return [travelTimeInMinutes, travelDistance]
    } catch (error) {
        console.error('Error', error);
        throw new Error('Sorry, we could not calculate travel time')
    }
}

// Endpoint to calculate and update ETA
app.post('/api/update-eta', async (req, res) => {
    const {busId, startCoords, endCoords} = req.body;
    try {
        const travelInfo = await getTravelTime(startCoords, endCoords)
        const travelTime = travelInfo[0]
        const travelDistance = travelInfo[1]

        await db.collection('etas').doc(busId).set({
            eta: travelTime,
            distance: travelDistance
        });

        res.status(200).send({message:'ETA updated successfully', eta: travelTime, distance: travelDistance})

    } catch (error) {
        res.status(500).send({message:'Failed to update ETA', error: error.message})
    }
})

// calculate ETA
app.post('/api/create', (req, res) => {
    //use async call because working with db
    (async () => {
        try {
            await db.collection('products').doc('/' + req.body.id +'/')
            .create({
                name: req.body.name,
                description: req.body.description,
                price: req.body.price
            });
            
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Student register for shuttle bus
app.post('/api/signup', (req, res) => {
    (async () => {
        try {
            const studentId = req.body.id;
            const location = req.body.location;
            const time = req.body.time;
            const today = new Date().toISOString().split('T')[0]

            const signUpData = {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                location: location,
                time: time
            }

            // Document ID based on studentID, location, and time
            const docId = `${studentId}-${location}`;
            await db.collection(today).doc(docId).set(signUpData)
            return res.status(200).send("Sign up confirmed!")
        } catch (error) {
            console.log(error);
            return res.status(500).send(error)
        }
    })();
})


// get all signed up data of the day
app.get('/api/get-signups', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let query = db.collection(today);
        let response = [];
        await query.get().then(querySnapshot => {
            //result of the query
            let docs = querySnapshot.docs; 
            for (let doc of docs) {
                const data = doc.data(); // Get the document data
                const selectedItem = {
                    id: doc.id,
                    firstname: data.firstname, // Access data using the .data() method
                    lastname: data.lastname,
                    location: data.location,
                    time: data.time
                };
                response.push(selectedItem);
            }
            return response;
        })
        return res.status(200).send(response)

    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
});



// student signup edit
app.put('/api/edit-signup/:docId', async (req, res) => {
    const docId = req.params.docId; // Get student ID from URL parameters
    const today = new Date().toISOString().split('T')[0]; // Get today's date
    const location = req.body.location;
    const time = req.body.time;
    try {
        const document = db.collection(today).doc(docId); // Reference to the student's document
        
        // Check if the document exists
        const docSnapshot = await document.get();
        if (!docSnapshot.exists) {
            return res.status(404).send({ message: 'Student sign-up not found' });
        }

        // Update the document with new data
        await document.update({
            location: location,   // Update location
            time: time            // Update time
        });

        res.status(200).send({ message: 'Sign-up information updated successfully' });
    } catch (error) {
        console.error('Error updating sign-up:', error);
        res.status(500).send({ message: 'Error updating sign-up', error: error.message });
    }
});


// Delete signup
app.delete('/api/delete-signup/:docId', async (req, res) => {
    const docId = req.params.docId; // Get student ID from URL parameters
    const today = new Date().toISOString().split('T')[0]; // Get today's date
    try {
        const document = db.collection(today).doc(docId); // Reference to the student's document
        
        // Check if the document exists
        const docSnapshot = await document.get();
        if (!docSnapshot.exists) {
            return res.status(404).send({ message: 'Student sign-up not found' });
        }

        // Update the document with new data
        await document.delete();

        res.status(200).send({ message: 'Sign-up deleted successfully' });
    } catch (error) {
        console.error('Error deleting sign-up:', error);
        res.status(500).send({ message: 'Error deleting sign-up', error: error.message });
    }
});



// Group students into a bus group
app.post('/api/group/:busId', (req, res) => {
    (async () => {
        try {
            const busId = req.params.busId;  // Correctly extracting busId from params
            const documentIds = req.body.documentIds;
            const location = req.body.location;
            const time = req.body.time;
            const today = new Date().toISOString().split('T')[0];

            const groupValue = `${location}-${time}`; // create the value for the "Group" field

            // Validate busId and other inputs
            if (!busId || !location || !time) {
                return res.status(400).send("Invalid input. Bus ID, location, and time are required.");
            }

            // update each student signup document with the "group" field
            const batch = db.batch(); // create a batch to perform multiple updates

            documentIds.forEach(docId => {
                const docRef = db.collection(today).doc(docId) // referencing to the student signup document
                batch.update(docRef, { group : busId}) // Update the "group" field
            })

            await batch.commit(); // commit the batch operation

            // Document ID based on studentID, location, and time
            await db.collection('groups').doc(busId).set({
                documentIds,
                time,
                location
            }, { merge: true }); // merge to update if the document already exists

            return res.status(200).send("Grouping confirmed!");
        } catch (error) {
            console.log(error);
            return res.status(500).send(error.message);
        }
    })();
});


// Bus group edit
app.put('/api/group/:busId', async (req, res) => {
    const busId = req.params.busId; // Get student ID from URL parameters
    const today = new Date().toISOString().split('T')[0]; // Get today's date
    const documentIds = req.body.documentIds;
    const location = req.body.location;
    const time = req.body.time;

    if (!busId || !location || !time) {
        return res.status(400).send("Invalid input. Bus ID, location, and time are required.");
    }

    const groupValue = `${location}${time}`; 

    try {
        // Update the document with new data
        await db.collection('groups').doc(busId).update({
            documentIds,
            time, 
            location
        });

        const batch = db.batch();

        documentIds.forEach(docId => {
            const docRef = db.collection(today).doc(docId);
            batch.update(docRef, { group: busId });
        })

        await batch.commit();

        res.status(200).send({ message: 'Sign-up information updated successfully' });
    } catch (error) {
        console.error('Error updating sign-up:', error);
        res.status(500).send({ message: 'Error updating sign-up', error: error.message });
    }
});


// Bus group delete
app.delete('/api/group/:busId', async (req, res) => {
    const busId = req.params.busId; // Corrected the busId retrieval
    const today = new Date().toISOString().split('T')[0]; // Get today's date
    if (!busId) {
        return res.status(400).send({ message: 'Missing required busId parameter' });
    }

    try {
        // Retrieve the group document to get the list of document IDs
        const groupDoc = await db.collection('groups').doc(busId).get();
        if (!groupDoc.exists) {
            return res.status(404).send({ message: 'Group not found' });
        }

        const { documentIds } = groupDoc.data();
        console.log(documentIds);

        // Check if documentIds is valid
        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return res.status(400).send({ message: 'No document IDs found in group' });
        }

        // Remove the "group" field from each student signup document
        const batch = db.batch();

        documentIds.forEach(docId => {
            const docRef = db.collection(today).doc(docId);
            if (docRef) {  // Check if docRef is defined
                batch.update(docRef, { group: "None" });
            } else {
                console.error(`Document reference not found for ID: ${docId}`);
            }
        });

        await batch.commit(); // Commit the batch operation

        // Delete the group document
        await db.collection('groups').doc(busId).delete();

        return res.status(200).send({ message: `Group deleted and student signups updated successfully ${documentIds}` });
    } catch (error) {
        console.error('Error deleting group and updating student signups:', error);
        return res.status(500).send({ message: 'Failed to delete group and update student signups', error: error.message });
    }
});



// export the api to firebase cloud functions
// call the function whenever there is a new request
exports.app = functions.https.onRequest(app);