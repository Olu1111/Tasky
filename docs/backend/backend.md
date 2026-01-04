# ***Backend***
The following documentation is mostly based on the [The ULTIMATE MERN Stack Complete Guide (MongoDB, Express, React, Node.js)](https://www.youtube.com/watch?v=4nKWREmCvsE). Please view for any further questions, and/or references.

## **_Table of Contents_**
- [Set Up](#set-up)
  - [Server](#server)
  - [MongoDB](#mongodb)
  - [Connect MongoDB to Project](#connect-mongodb-atlas-to-project)
  - [Server Pt2](#server-pt2)
  - [Start Up Commands](#start-up-commands)

## ***Set Up***
### **Server**
  1. Verify/Install node.js and npm(node package manager)
     ```bash
       node -v                      #check for node installation
       npm -v                       #check for npm installation

       #Use ONLY if not installed!!
       #Go to https://nodejs.org/en/download and follow the install instructions. NOTE: installing node.js also installs npm
     ```
  2. To Set up a node.js server for your backend you must first have all of the necessary dependencies and packages installed
     ```bash
       #beginning in the root of the project "Tasky"
       mkdir backend && cd backend  #create backend folder and change into that directory
       mkdir server && cd server    #create server folder and change into that directory
       npm init -y                  #create your package.json file for your project's backend
       npm install express mongodb cors
       npm install -D nodemon
       #Express is the server framework that handles HTTP requests and routing.
       #MongoDB is the database used to store application data.
       #CORS is a security middleware that allows the frontend to communicate with the backend across different domains.
       #Nodemon automatically restarts the node application when file changes in the directory are detected. This eliminates the need to turn off and then turn on server connection after every change you are sending to the client
     ```
  3. CRITICAL step, within your package.json file you must include the line: ***"type": "module",*** under the version attribute
  4. Within the server/ folder create a new file named server.js. We will come back to this file later. Within the server/ folder we will also create a new folder named db. Within db/ we will create connection.js. Within server/ we will also create a routes folder. Within routes/ we will create record.js.
     ```bash
       touch server.js
       mkdir db && cd db
       touch connection.js          #for handling the connection between our project and MongoDB
       cd ..
       mkdir routes && cd routes
       touch record.js              #for querying our data to and from our mongoDB database
     ```
  5. Project Structure
     ```text  
       ├── server/                 
       │   ├── db/
       │       └── connecetion.js
       │   ├── node_modules/   
       │   └── routes/
       │       └── record.js
       ├── .env              
       ├── package-lock.json                
       ├── package.json               
       └── server.js              
     ```
    
  ### **MongoDB**
  Now it is time to create our MongoDB Atlas Cluster
  1. View [MongoDB Atlas Free Cluster Set Up video](https://www.youtube.com/watch?v=SFkXQZ3x6zM)

  ### **Connect MongoDB Atlas to Project**
  After creating the account, we can connect our project to our Atlas Cluster
  1. Click "Connect" button
  2. Input a User and Password that can be remembered and store it in a secure place (password will be used later for connection)
  3. Select "Drivers" as connection method
  4. Default settings should be fine, but if the Driver is not "Node.js" change it to Node.js for the latest version
  5. We can skip step 2 since we already installed mongodb
  6. Under step 3, select the "View full code sample" and copy the whole code into the 'server/db/connection.js' file.
    1. Be sure to change the "<db_password>" with your actual password that was copied in OUR step 4(Input a User and Password)
  7. If not done already, create a .env file within the server folder. Then, copy the connection string, assign it to a variable "ATLAS_URI"(variable can be named whatever you want) in the .env file and save the file.
     ```bash
       ATLAS_URI=<connection_string>
       #Add port variable to env as well
       PORT=5050 
     ```
  8. Remove the first two lines from the connection.js file and replace them with the following
     ```javascript
       import { MongoClient, ServerApiVersion } from "mongodb";
       const uri = process.env.ATLAS_URI || "";
     ```
  
  ### **Server Pt2**
  1. Back in your server.js file add the following code:
     ```javascript
       import express from "express";
       import cors from "cors";
       import records from "./routes/record.js";

       const PORT = process.env.PORT || 5050;
       const app = express();

       app.use(cors());
       app.use(express.json());
       app.use("/", records);

       app.listen(PORT, () => {
	       console.log(`Server is listening on port ${PORT}`);
       });
     ```
  2. In your connection.js file add the following code:
     ```javascript
       import { MongoClient, ServerApiVersion } from "mongodb";

       const uri = process.env.ATLAS_URI || "";
       const client = new MongoClient(uri, {
         serverApi: {
           version: ServerApiVersion.v1,
           strict: true,
           deprecationErrors: true,
         }
       });
       
       try {
         await client.connect()
         await client.db("admin").command({ ping: 1 });
         console.log("Connected to MongoDB!");

         //////////// Code below shows how to create a new DB and add a document //////////////
         //// The DB is created upon the first insertion
         // const database = client.db('myNewDatabase'); 
         // const collection = database.collection('myCollection');

         //// Create a document to insert
         // const doc = { name: "Test User", date: new Date() };
         // const result = await collection.insertOne(doc)
         //////////////////////////////////////////////////////////////////////////////////////
     
       } catch (error) {
         console.log(error)
         client.close();
       }
        
       let db = client.db(""); //assign which database you want to use throughout your project. 
        
       export default db;
     ```
  3. In your record.js file add the following code:
     ```javascript
       import express from "express"
       import db from "../db/connection.js"

       const router = express.Router();

       router.get("/", async (req, res) => {
           let collection = await db.collection("");  //here goes the collection found in the database you are using
           let results = await collection.find({}).toArray();
           res.send(results).status(200);   
       });
     ```

  ### **Start Up Commands**
  1. Within your package.json file write the following under your scripts attribute
     ```text
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1",
       "dev": "nodemon --env-file=.env server",
     },
     ```
  2. Run the command to start your server. NOTE: make sure you are within your server folder.
     ```bash
     npm run dev
     ```

