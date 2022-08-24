const express = require("express");
const app = express();
const path = require("path");
const port = 5000;
const request = require("request");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const User = require("./model/user"); // User is a document, which is an instance of the model.
const Project = require("./model/project"); // User is a document, which is an instance of the model.
const cors = require("cors"); // allow frontend to make requests to backend on different origins
const bcrypt = require("bcryptjs"); //password hasher
// const { resourceLimits } = require("worker_threads");
const jwt = require("jsonwebtoken");
// Very sensitive - keep safe.
const JWT_SECRET_KEY = "mv(3jfoa.@01va(Adup";
const MONGOOSE_URL = "mongodb://127.0.0.1:27017/login-app-db";

// To allow requests from client side server
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// To allow the request body to be parsed
app.use(bodyParser.json());

const ROLES = {
  Admin: 1000,
  Influencer: 2000,
  Brand: 3000,
};

// CONNECT TO DATABASE
mongoose
  .connect(MONGOOSE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log(`Database connected at ${MONGOOSE_URL}`);
  })
  .catch((err) => console.log(err));

app.use("/", express.static(path.join(__dirname, "static")));

// CONNECT TO EXPRESS SERVER
app.listen(port, () => {
  console.log(`Server is online at Port ${port}`);
});

// TEST ENDPOINT
app.get("/", (req, res) => {
  res.send("Welcome to the Express Server!");
});

// ENDPOINT #1 - USER SIGNUP
app.post("/api/register", async (req, res) => {
  console.log("Registration Received: req.body:", req.body); // needs bodyParser installed to decode the body
  let { user, pwd: plainTextPwd, role } = req.body;

  // Check for valid Username/Password. Better to check in backend.
  if (!user || typeof user !== "string") {
    return res.json({ status: "error", error: "invalid username" });
  }

  if (!plainTextPwd || typeof plainTextPwd !== "string") {
    console.log(plainTextPwd);
    return res.json({ status: "error", error: "invalid password" });
  }
  if (role === "Influencer") {
    role = {
      Admin: null,
      Influencer: 2000,
      Brand: null,
    };
  } else if (role === "Brand") {
    role = {
      Admin: null,
      Influencer: null,
      Brand: 3000,
    };
  } else if (role === "Admin") {
    role = {
      Admin: 1000,
      Influencer: null,
      Brand: null,
    };
  }
  console.log(role);
  const encryptedPwd = await bcrypt.hash(plainTextPwd, 10); // 10 = how slow the algo will be

  // Create a record/document in the User model
  try {
    const res = await User.create({
      username: user,
      password: encryptedPwd,
      roles: role,
    });
    console.log("User was created successfully: ", res);
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.json({
        status: "error",
        error: "Username already in use!",
      });
    }
    throw err;
  }
  res.json({ status: "OK" });
});

// ENDPOINT #2 - USER LOGIN
app.post("/api/login", async (req, res) => {
  const { user, pwd } = req.body;
  console.log("Server received login request:", user, pwd);

  // Find the User record
  // .lean() returns a Plain Old Java Object (POJO) instead of the entire
  const userRecord = await User.findOne({ username: user }).exec();

  console.log("User in Database:", userRecord);

  if (!userRecord) {
    return res.json({
      status: "error",
      error: "Please double check the username and/or password.",
    });
  }

  // Compares the password and the hashed password
  if (await bcrypt.compare(pwd, userRecord.password)) {
    // Public information, do not put sensitive info.
    // The JWT signs the header/payload based on our signature.
    const roles = Object.values(userRecord.roles);
    const token = jwt.sign(
      {
        id: userRecord._id,
        username: userRecord.username,
        roles: roles,
      },
      JWT_SECRET_KEY
    );
    console.log(token);
    if (token) {
      console.log("Succesfully signed token");

      res.json({ status: "OK", token: token, roles: roles });
    } else {
      console.log("Did not sign token");
    }
  } else {
    return res.json({ status: "error" });
  }
});

// ENDPOINT #3 - CHANGE PASSWORD
app.post("/api/changepassword", async (req, res) => {
  const { oldPwd, newPwd, token } = req.body;
  console.log(oldPwd, newPwd, token);
  try {
    // verify the token - will throw error if not verified
    console.log("inside the try block");

    const user = jwt.verify(JSON.parse(token).data, JWT_SECRET_KEY);
    // TDL: check old password matches the hashed password
    // insert code here
    // TDL: check new password meets requirements via REGEX (extract out from Register)

    const newHashedPwd = await bcrypt.hash(newPwd, 10);
    console.log("Password was hashed:", newHashedPwd);
    const _id = user.id;
    await User.updateOne(
      { _id },
      {
        $set: { password: newHashedPwd },
      }
    );
    const userRecord = await User.findOne({ _id });
    console.log("Password was updated", userRecord);
    res.json({ status: "OK" });
  } catch (err) {
    console.log(err);
    res.json({ status: "Error", error: "Could not verify identity" });
  }
});

// Get Profile Info - Get the User Information from the database
app.post("/api/getuser", async (req, res) => {
  console.log("Inside the Get Profile Endpoint");
  // Payload contains JWT and user
  console.log(req.body);
  const { token } = req.body;
  console.log(token);

  try {
    // Verify the JWT
    // const user = jwt.verify(JSON.parse(token).token, JWT_SECRET_KEY);
    // abstracted
    const [user, _id] = verifyJWT(token);
    const userRecord = await findUser(_id);

    console.log("testing the post user", user, _id, userRecord);

    res.json({ status: "OK", userProfile: userRecord });
  } catch (err) {
    console.log(err);
    res.json({ status: "Error", error: "Could not verify identity" });
  }

  // If user is

  // Return the user
});

// UPDATE PROFILE
app.post("/api/updateprofile", async (req, res) => {
  console.log("Inside the Change Profile Endpoint");
  // Payload contains JWT and user
  console.log(req.body);

  // TO DO: MODIFY THE TOKEN SO THAT YOU CAN RECEIVE THE NEW USER DATA
  const { token } = req.body;
  console.log(token);

  try {
    // Verify the JWT
    // const user = jwt.verify(JSON.parse(token).token, JWT_SECRET_KEY);
    // abstracted
    const [user, _id] = verifyJWT(token);
    const userRecord = await findUser(_id);

    console.log("testing the post user", user, _id, userRecord);

    // TO DO: ENTER CODE TO UPDATE THE USER RECORD

    res.json({ status: "OK", userProfile: userRecord });
  } catch (err) {
    console.log(err);
    res.json({ status: "Error", error: "Could not verify identity" });
  }

  // If user is

  // Return the user
});

// Create Project
app.post("/api/createproject", async (req, res) => {
  console.log("Inside the Create Project Endpoint");
  // Payload contains JWT and user
  console.log("req.body:", req.body);

  const { token, title, influencerAssigned, brandRepAssigned, deadline } =
    req.body;

  console.log(
    "token:",
    token,
    title,
    influencerAssigned,
    brandRepAssigned,
    deadline
  );

  // Verify  project properties
  if (!title || typeof title !== "string") {
    return res.json({
      status: "error",
      error: "Project title input invalid",
    });
  }
  if (!influencerAssigned || typeof title !== "string") {
    return res.json({
      status: "error",
      error: "Influencer input invalid",
    });
  }
  if (!brandRepAssigned || typeof title !== "string") {
    return res.json({
      status: "error",
      error: "Brand rep input invalid",
    });
  }
  // if (typeof deadline !== "object") {
  //   return res.json({
  //     status: "error",
  //     error: "please provide a valid date",
  //   });
  // }

  try {
    // Verify brand representative
    // const user = jwt.verify(JSON.parse(token).token, JWT_SECRET_KEY);
    const [user, _id] = verifyJWT(token);
    const brandRepRecord = await findUser(_id);
    console.log("Brand Rep Record", user, _id, brandRepRecord);
    // Check brand representative
    // TO DO: change this to be the Admin (1000) or Brand (3000)

    if (!brandRepRecord?.roles?.Influencer == 2000) {
      return res.json({
        status: "error",
        error: "You do not have authority to create a project",
      });
    }

    // Find the influencer record
    const influencerRecord = await findUserByUsername(influencerAssigned);
    console.log("influencerRecord:", influencerRecord);

    // Create a project
    const res = await Project.create({
      title: title,
      brandRepAssigned: brandRepRecord,
      influencerAssigned: influencerRecord,
      deadline: deadline,
    });
    console.log("Project was created:", res);

    // Add project to brandRep and influencer's currentProjects property
    // brandRep
    await User.updateOne(
      { _id },
      {
        $push: { currentProjects: res },
      }
    );
    // influencer
    await User.updateOne(
      { username: influencerRecord.username },
      {
        $push: { currentProjects: res },
      }
    );
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.json({
        status: "error",
        error: "Username already in use!",
      });
    }
    throw err;
  }
  res.json({ status: "OK" });
});

// Helper Functions

// Verify JWT tokens
const verifyJWT = (token) => {
  // Verify the user, return the user + id
  const user = jwt.verify(JSON.parse(token).token, JWT_SECRET_KEY);
  const _id = user.id;
  return [user, _id];
};

// Find the project in the database
const findUser = async (_id) => {
  return User.findOne({ _id });
};
const findUserByUsername = async (username) => {
  return User.findOne({ username });
};
const findProject = async (_id) => {
  return Project.findOne({ username });
};
