require('dotenv').config();


const express = require('express');
const app = express();
const port = 3000
const mongoose = require("mongoose");
const Listing = require("./modules/listings.js");
const biding = require("./modules/biding.js");
const Users = require("./modules/user.js");
const Admins= require("./modules/admin.js");
//advertize//
const Ads = require("./modules/ads.js");
//
const path = require("path");
const methodoverride = require("method-override");
const engine = require('ejs-mate');
const { register } = require('module');
var cookieParser = require('cookie-parser')
const multer  = require('multer')
const {storage}=require("./cloudConfig.js")
const upload = multer({ storage })
const session=require("express-session")
// const { error, clear } = require('console');
// // const {listingSchema}=require("./schema.js")
// const wrapAsync=require("./utility/wrapasync.js")
// const ExpressError=require("./utility/error.js");
// const reviews= require("./models/review.js");



main().then(() => {
  console.log("connected to database");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/marketplace');



  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodoverride("_method"));
app.engine('ejs', engine);
app.use(express.static(path.join(__dirname, "/public")));
app.use(cookieParser())
app.use(session({secret:"mysecret",resave:false,saveUninitialized:true}))

//bids form
app.get("/bids/:id/:name/:price/:productuser/:userid", (req, res) => {
  let { id, name, price, productuser, userid } = req.params;
  console.log("pricesssss" + price)
  let productuserdata = Users.findById(productuser).then((prouser) => {
    console.log(prouser)
    res.render("bid.ejs", { id: id, name: name, userid: userid, prouser: prouser, price: price })

  })
  // console.log(id+""+name)
  // res.render("bid.ejs",{id:id,name:name,userid:userid})
})


//login form...

app.get("/login", (req, res) => {
  res.render("login.ejs")
})


app.post("/login", async (req, res) => {


  let { emailid, password } = req.body;
  console.log(emailid + "" + password)

  let info;
  let admin1 = await Admins.find({ emailid: emailid, password: password }).then((data) => {
    console.log(data)
    //new added
    if (data == "") {
      let user = Users.find({ emailid: emailid, password: password }).then((data) => {
        console.log(data)
        d = data[0];
        console.log(d)
        if (data == "") {
          res.send("not register please register after login")
        }
        if(d.status=="Block"){
          res.send("THIS ACCOUNT IS BLOCK..")
        }
        res.cookie("data", d).redirect("/show");


      })
    }
    else {
      let d = data[0]
      res.cookie("data", d).redirect("/show");

    }
  })








  //  let user=await Users.find({emailid:emailid,password:password}).then((data)=>{
  //   console.log(data)
  //   d=data[0];
  //   console.log(d)
  //   if(data==""){
  //     res.send("not register please register after login")
  //   }
  //     res.cookie("data",d).redirect("/show");


  // })

})

//register form...
app.get("/resis", (req, res) => {
  res.render("register.ejs")
})

//register.....

app.post("/resister", async (req, res) => {
// console.log(req.file.filename+","+req.file.path)
// let filename=req.file.filename;
// let url=req.file.path;


  let {name,emailid,password}= req.body;
  console.log(name+","+emailid+","+password)
  // console.log(User)
  let newuser = new Users({name,emailid,password})
  // newuser.image.push({url,filename});
  let id;
  newuser.save().then((data) => {
    console.log("this is id" + data._id)
    id = data._id;
  });

  let list = await Listing.find({});
  console.log(list)

  let a;
  Users.findById(id).then((data) => {
    console.log("this is user" + data)
    res.cookie("data", data).redirect("/show");
    // res.redirect("/show")
    // res.render("home.ejs",{list,data})
  })
  // let newListing= new Listing({...req.body.listing})
  // newListing.save();

  //res.redirect("/show")

})

//form new add 
app.get("/add/:id", (req, res) => {
  let { id } = req.params;
  console.log(id)
  res.render("profile.ejs", { id });
})

///add new listings
app.post('/index/:id',upload.single('listing[image]'), async (req, res) => {
console.log(req.file.filename+","+req.file.path)
let filename=req.file.filename;
let url=req.file.path;
  let id = req.params.id;
  let d;
  let User = await Users.findById(id).then((data) => {
    d = data;
  })

  let newListing = new Listing({ ...req.body.listing, User })
  //newListing.save();
  newListing.image.push({url,filename})
  newListing.User.push(d)
  newListing.save();

  res.redirect(`/add/${id}`);
})
//delete products

app.get("/delete/:id", async (req,res)=>{
  let id=req.params.id;
  console.log(id)
  let del= await Listing.findByIdAndDelete(id).then((data)=>{
    console.log(data)
  })
  res.send("delete for this item");
})

//edit product
app.get("/edit/:id", async (req,res)=>{
  let id=req.params.id;
  await Listing.findById(id).then((data)=>{
    console.log(data)
    res.render("edit.ejs",{data})
  })
})

//UPDATE

app.post('/update/:id',upload.single('listing[image]'), async (req, res) => {
  console.log(req.file.filename+","+req.file.path)
  let filename=req.file.filename;
  let url=req.file.path;
    let id = req.params.id;
    let d;
    
  
    let newListing =  await Listing.findByIdAndUpdate(id,{ ...req.body.listing}).then((data)=>{
      console.log("this is data"+data.image[0].id)
    })
    
    
  })

//home page
app.get('/show', async (req, res) => {
  let data = (req.cookies.data)
  console.log(data)

  //advertize
  let ads;
  if(req.session.item){
     let adss=Ads.find({productname:req.session.item}).then((data)=>{
      console.log(data)
      ads=data
     })
    //res.locals.item =  req.session.item;
  }
  else{
    req.session.item="null";
    ads=[];
}
  console.log("this is item"+req.session.item)
 // res.locals.item=req.session.item;
  //advertize ahi sudhi
  id = data._id;
console.log("this is idddddddddd"+id)

  let list = await Listing.find({ status: "Approve" });
  console.log(list)
  console.log(data)
  
  let admin1 = await Admins.find({ _id: id }).then((d) => {
    if (d != "") {
      data = d[0]
      console.log("this is datassssssssssssssssssssssssssssssssssssssssss")
      console.log(data)
      let isAdmin = "true";
      res.render("home.ejs", { list, data, isAdmin,ads})//{list})
 }
 else{
  console.log(data)
  let isAdmin = "false"
  // let newListing= new Listing({...req.body.listing})
  // newListing.save();
  console.log(ads)
  res.render("home.ejs", { list, data, isAdmin,ads })//{list})
 }
  })

// console.log(data)
//   let isAdmin = "false"
//   // let newListing= new Listing({...req.body.listing})
//   // newListing.save();
//   res.render("home.ejs", { list, data, isAdmin })//{list})
})

//show page
app.get('/listings/:id/:userid', async (req, res) => {



  let { id, userid } = req.params;
  let listing = await Listing.findById(id).populate("bidings");
  let user = await Listing.findById(id).populate("User").then((data) => {
    console.log("userrrrrrrr" + data)
    let name=data.name;
    console.log("pppppp"+name);
    //let ads=Ads.find({productname:name}).then((data)=>{
      //console.log("user ads data.................."+data)
      req.session.item=name;
    //})
     //let item=data.image[0].url;
     //req.session.item=item;

    res.render("show.ejs", { listing, userid, data })

  });

  // console.log(listing.bidings)

  // let newListing= new Listing({...req.body.listing})
  // newListing.save();
})

///bidings
app.post("/listings/bidings/:id/:userid", (async (req, res) => {
  let userid = req.params.userid

  let d;
  let User = Users.findById(req.params.userid).then((data) => {
    d = data;
  })
  let listing = await Listing.findById(req.params.id)
  let id = req.params.id
  let bidings = req.body;
  let newbidings = new biding(bidings, User);
  newbidings.User.push(d)
  console.log(newbidings)
  listing.bidings.push(newbidings);
  await newbidings.save()
  await listing.save()
  res.redirect(`/listings/${id}/${userid}`)
}))


// PROFILE..................................................................................................................................

app.get("/user/products/:userid", (req, res) => {
  let userid = req.params.userid;
  let product = Listing.find({ "User": userid }).then((data) => {
    console.log(data)
    res.render("product.ejs", { userid, data })
  })
})

app.get("/user/mybids/:userid", (req, res) => {
  let userid = req.params.userid;
  let bids = biding.find({ "User": userid }).then((bid) => {
    console.log(bid);
    res.render("mybid.ejs", { bid })

  })


})
//show bids
app.get("/showbids/:id",(req,res)=>{
  let {id}=req.params;
  let listing = Listing.findById(id).populate("bidings").then((data)=>{
    console.log(data)
    res.render("showbids.ejs",{data})
  });
})

app.get("/user/general/:id",  async(req, res) => {
  let {id}=req.params;
  await Users.findById(id).then((data)=>{
  console.log(data)
  res.render("general.ejs",{data})
  })
  
})


// upload image
app.post('/upload/:id',upload.single('image'), async (req, res) => {
  console.log(req.file.filename+","+req.file.path)
  let filename=req.file.filename;
  let url=req.file.path;
    let id = req.params.id;
    let d;
    
  
    let newListing =  await Users.findByIdAndUpdate(id)

    newListing.image={url,filename}
  newListing.save()
res.redirect(`/user/general/${id}`)    
  })

// new


app.get("/new/:userid", (req, res) => {
  let userid = req.params.userid
  res.render("index.ejs", { userid })
})


//admin panle
app.get("/admin/:adminid", async (req, res) => {
  let { adminid } = req.params;
    res.render("adminprofile.ejs", { adminid })
  });


app.get("/products/:adminid", async (req, res) => {
  let { adminid } = req.params;
  let product = await Listing.find().populate("User").then((data) => {
    console.log(data)

    //res.render("show.ejs",{listing,userid,data})
    res.render("admin.ejs", { data, adminid })
  });

})

app.put("/approve/:_id/:adminid", async (req, res) => {
  let { _id, adminid } = req.params;
  console.log(_id)
  let product = await Listing.findByIdAndUpdate(_id, { status: "Approve" }).then((data) => {
    console.log(data)
    res.redirect(`/products/${adminid}`)
  })

})
app.put("/reject/:_id/:adminid", async (req, res) => {
  let { _id, adminid } = req.params;
  console.log(_id)
  let product = await Listing.findByIdAndUpdate(_id, { status: "Reject" }).then((data) => {
    console.log(data)
    res.redirect(`/products/${adminid}`)
  })

})

//user data for admin side
app.get("/userdata",(req,res)=>{
  let user=Users.find().then((data)=>{
    console.log(data)
    res.render("users.ejs",{data})
  })
})


//block user and user all listings for admin
app.put("/block/:_id/", async (req, res) => {
  let {_id} = req.params;
  console.log(_id)
  let product = await Users.findByIdAndUpdate(_id, { status: "Block" }).then((data) => {
    let bids = Listing.findOneAndUpdate({ "User": _id },{status:"block"}).then((bid) => {
      console.log(bid);  
    })
    console.log(data)
    res.redirect("/userdata")
  })

})


//advertize router ///////////////////////////////

app.get("/newads",(req,res)=>{
  res.render("ads.ejs");
})

app.post("/ads",upload.single('image'),(req,res)=>{
  let{productname,price,description,productid}=req.body;
  console.log(productname+price+description+productid)

  console.log(req.file.filename+","+req.file.path)
  let filename=req.file.filename;
  let url=req.file.path;
 let newads = new Ads({productname,price,description,productid})
  newads.image.push({url,filename});
  newads.save()
  res.send("ads...")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})