const jwt = require("jsonwebtoken");

const authMiddlware = (req, res, next) => {
     const authHeader = req.headers.authorization;
     // console.log("Authtentication Middleware", authHeader)

     if (!authHeader || !authHeader.startsWith("Bearer ")) {
          console.log("2. Authorization header is missing or malformed.");
          res.status(400).json({ message: "Unauthorized" });
     }


     try {
          const token = authHeader.split(" ")[1];
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
          req.user = decodedToken;
          next();
     } catch (error) {
          console.log("Invalid token")
          return res.status(400).json({ message: "Invalid token" });
     }

}

module.exports = authMiddlware