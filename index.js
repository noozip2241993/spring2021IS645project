// Add required packages
const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const multer = require("multer");
const upload = multer();
const path = require("path");
require('dotenv').config()

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
// Serve static content directly
app.use(express.static("css"));
// Application folders
app.use(express.static("public"));
app.use(express.static("views"));

// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const { get } = require("http");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    //res.send ("Hello world...");
    res.render("index");
});


dblib.getTotalRecords()
    .then(result => {
        if (result.msg.substring(0, 5) === "Error") {
            console.log(`Error Encountered.  ${result.msg}`);
        } else {
            console.log(`Total number of database records: ${result.totRecords}`);
        };
    })
    .catch(err => {
        console.log(`Error: ${err.message}`);
    });
    app.get("/customers", async (req, res) => {
        // Omitted validation check
        const totRecs = await dblib.getTotalRecords();
        //Create an empty custuct object (To populate form with values)
        const cust = {
            cust_id: "",
            cust_fname: "",
            cust_lname: "",
            cust_state: "",
            cust_salesytd: "",
            cust_salesprev: ""
        };
        res.render("customers", {
            type: "get",
            totRecs: totRecs.totRecords,
            cust: cust
        });
    });
    app.post("/customers", async (req, res) => {
        // Omitted validation check
        //  Can get this from the page rather than using another DB call.
        //  Add it as a hidden form value.
        const totRecs = await dblib.getTotalRecords();
        console.log("POST Search, req.body is: ", req.body);
        dblib.findCustomers(req.body)
            .then(result => {
                console.log("result from findCustomeris : ", result);
                res.render("customers", {
                    type: "post",
                    totRecs: totRecs.totRecords,
                    result: result,
                    cust: req.body
                })
            })
            .catch(err => {
                res.render("customers", {
                    type: "post",
                    totRecs: totRecs.totRecords,
                    result: `Unexpected Error: ${err.message}`,
                    cust: req.body
                });
            });
    });
    
    // app.get("/customersajax", async (req, res) => {
    //     // Omitted validation check
    //     const totRecs = await dblib.getTotalRecords();
    //     res.render("customersajax", {
    //         totRecs: totRecs.totRecords,
    //     });
    // });
    // app.post("/customersajax", upload.array(), async (req, res) => {
    //     dblib.findCustomers(req.body)
    //         .then(result => res.send(result))
    //         .catch(err => res.send({trans: "Error", result: err.message}));
    
    // });

// GET /edit/5
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      console.log(result);
      res.render("edit", { model: result.rows[0] });
    });
  });

  // POST /edit/5
// POST /edit/5
app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const customer = [req.body.cusid, req.body.cusfname, req.body.cuslname,req.body.cusstate,req.body.cussalesytd,req.body.cussalesprev, id];
    const sql = `UPDATE customer SET cusid = $1 , cusfname = $2, cuslname = $3, cusstate = $4,cussalesytd = $5, cusSalesprev = $6 WHERE (cusid = $7)`;
     return pool.query(sql, customer, (err, result) => {
      // if (err) ...
      res.redirect("/customers");
    });
  });

// // GET /create
// app.get("/create", (req, res) => {
//     res.render("create", { model: {} });
//   });
// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {} });
    
  });


// POST /create
app.post("/create", (req, res) => {
    const sql = `INSERT INTO customer (cusid, cusfname, cuslname, cusstate,cussalesytd, cusSalesprev )
                 VALUES ($1, $2, $3, $4, $5, $6)`;
     const customer = [req.body.cusid, req.body.cusfname, req.body.cuslname,req.body.cusstate,req.body.cussalesytd,req.body.cussalesprev];   
      return pool.query(sql, customer, (err, result) => {
      // if (err) ...
      console.log(result);
      res.redirect("/create");
      
    });
  });
  
  // GET /delete/5
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      res.render("delete", { model: result.rows[0] });
    });
  });
// POST /delete/5
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM customer WHERE cusid = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      res.redirect("/customers");
    });
  });

  app.get("/import", (req, res) => {
    res.render("import");
 });
 
//  app.post("/import",  upload.single('filename'), (req, res) => {
//      if(!req.file || Object.keys(req.file).length === 0) {
//          message = "Error: Import file not uploaded";
//          return res.send(message);
//      };
//      //Read file line by line, inserting records
//      const buffer = req.file.buffer; 
//      const lines = buffer.toString().split(/\r?\n/);
//      var numFailed = 0;
//      var numInserted = 0;
//      var errorMessage = "";
// console.log(lines);
// var customers = [];
//      lines.forEach(line => {
//           //console.log(line);
//         var  customer = line.split(",");
//         customers.push(customer);
    
//      const result = dblib.insertCustomer(customer);
//      console.log(result);
//      if(result.trans === "success"){
//          numInserted++;
//      } else{
//          numFailed ++;
//          errorMessage += `${result.msg} \r\n`;
//      };
//      console.log(`Records processes: ${numInserted + numFailed}`);
//      console.log(`Records successfully inserted: ${numInserted}`);
//      console.log(`Records with insertion errors: ${numFailed}`);
//      if(numFailed>0){
//          console.log("Error Details: ");
//          console.log(errorMessage);
//      }
//     });
//     console.log(customers);
        
//  });

 app.post("/import",  upload.single('filename'), (req, res) => {
    if(!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    //Read file line by line, inserting records
    const buffer = req.file.buffer; 
    const lines = buffer.toString().split(/\r?\n/);
    var numFailed = 0;
    var numInserted = 0;
    var errorMessage = "";
// console.log(lines);
    lines.forEach(line => {
         //console.log(line);
         customer = line.split(",");
         
         console.log(customer);

         const sql = `INSERT INTO customer (cusID, cusFname, cusLname, cusState,cusSalesYTD, cusSalesPrev )
         VALUES ($1, $2, $3, $4, $5, $6)`;
       pool.query(sql, customer, (err, result) => {
           
         
             if (err) {
                 console.log(`Customer ID: - Error message: ${err.message}`);
             } else {
                 console.log(`Inserted successfully`);
             }
        });
    });
    message = `Total number of records in the database: ${lines.length} \n
    Select a file with customers for Database Insert`;
    res.send(message);
});

 app.get("/export", (req, res) => {
    var message = "";
    res.render("export",{ message: message });
   });
   
   
   app.post("/export", (req, res) => {
       const sql = "SELECT * FROM customer ORDER BY cusid";
       pool.query(sql, [], (err, result) => {
           var message = "";
           if(err) {
               message = `Error - ${err.message}`;
               res.render("export", { message: message })
           } else {
               var output = "";
               result.rows.forEach(customer => {
                   output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd},${customer.cussalesprev}\r\n`;
               });
               res.header("Content-Type", "text/csv");
               res.attachment("export.csv");
               return res.send(output);
           };
       });
   });