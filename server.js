/*********************************************************************************
*   Online (Heroku) Link: https://byzantium-coati-tutu.cyclic.app
*
********************************************************************************/ 

// BUILD OFF OF THIS FOR MUSIC WEB APP
var data = require("./blog-service.js"); 
var authData = require("./auth-service.js");
var path = require('path'); // This is needed for sendFile
var express = require("express"); 
var clientSessions = require("client-sessions"); // vulenrabilities when installing client-sessions npm install client-sessions, might be a cause for concern might not
var app = express(); // app is pointing to the module express
app.use(express.static('./public'));
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const { mainModule } = require("process");
const stripJs = require('strip-js');
app.use(express.urlencoded({extended: true}));

app.engine('.hbs', exphbs.engine({ 
  defaultLayout: 'main',
  extname: '.hbs', helpers: // Helper functions
  {
    navLink: function(url, options){
      return '<li' + 
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
          return options.inverse(this);
      } else {
          return options.fn(this);
      }
    },
    safeHTML: function(context){
      return stripJs(context);
    },
    formatDate: function(dateObj){
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
    }
  }
}));

app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080; 

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

app.use(express.static('public')); 
// setup a 'route' to listen on the default url path (http://localhost)

app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "Web322@ssignmenTs1x", // this should be a long un-guessable string.
  duration: 15 * 60 * 1000, // duration of the session in milliseconds (15 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

// This is a helper middleware function that checks if a user is logged in
// we can use it in any route that we want to protect against unauthenticated access.
// A more advanced version of this would include checks for authorization as well after
// checking if the user is authenticated
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/", function(req,res){
    res.redirect(307,'/blog')
});

cloudinary.config({
  cloud_name: 'dbeeent8v',
  api_key: '451631584627247',
  api_secret: 'osVxZ2uVxoK0xycjaaZjnmxfwcI',
  secure: true
});

const upload = multer();

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Functions up and down are handlers, they receive the request and process it back to the client
// setup another route to listen on /about
app.get("/about", function(req,res){
  res.render("about.hbs");
});

// POSTS
app.post('/posts/add', upload.single('featureImage'),ensureLogin, function (req, res, next) {
  if(req.file){
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  reject(error);
                }
              }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);  
        });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    };

    upload(req).then((uploaded)=>{
      processPost(uploaded.url);
    });
  } else{
  processPost("https://dummyimage.com/847x320/d9d9d9/545454.jpg");
  }

  function processPost(imageUrl){
    req.body.featureImage = imageUrl;
    data.addPost(req.body)
    .then(()=>{res.redirect(307,'/posts')})
    .catch((err)=>{
      res.render("posts", {message: "no results"});
    });
  }
});

app.get("/posts/add",ensureLogin, function(req,res){
  data.getCategories().then((data)=>{
    res.render("addPost",{categories: data});
  }).catch((err)=>{
      res.render("addPost",{categories: []});
  });
});

app.all("/posts",ensureLogin, function(req,res){
  let cat = req.query.category;
  let mDate = req.query.minDate;
  if(cat){
    data.getPostsByCategory(+cat).then((data)=>{
      if(data.length > 0){
        res.render("posts", {posts: data});
      }else{
        res.render("posts", {message: "no results"});
      }     
    }).catch((err)=>{
      res.render("posts", {message: "no results"});
    });
  } else if(mDate){
    data.getPostsByMinDate(mDate).then((data)=>{
      if(data.length > 0){
        res.render("posts", {posts: data});
      }else{
        res.render("posts", {message: "no results"});
      }    
    }).catch((err)=>{
      res.render("posts", {message: "no results"});
    });
  }else{
    data.getAllPosts().then((data)=>{
      if(data.length > 0){
        res.render("posts", {posts: data});
      }else{
        res.render("posts", {message: "no results"});
      }   
    })
    .catch((err)=>{
        res.render("posts", {message: "no results"});
    });
  }
});

app.get("/post/:value",ensureLogin, function(req,res){
  let val = req.params.value;
  data.getPostById(val).then((data)=>
    res.render("posts", {posts: data})
  )
  .catch((err)=>
    res.render("posts", {message: "no results"})
  );
});

app.get("/posts/delete/:id",ensureLogin, (req, res) =>{
  let Id = req.params.id;
  data.deletePostById(Id)
  //.then((data)=>res.render("posts", {posts: data}))
  .then(()=>{res.redirect(307,'/posts')})
  .catch((err)=>
    res.status(500).send("Unable to Remove Post / Post not found")
  );
});

// CATEGORIES
app.all("/categories",ensureLogin, function(req,res){
  data.getCategories().then((data)=>{
    if(data.length > 0){
      res.render("categories", {categories: data});
    }else{
      res.render("categories", {message: "no results"});
    }      
  })
  .catch((err)=>{
    res.render("categories", {message: "no results"});
  });
});

app.get("/categories/add",ensureLogin, function(req,res){
  res.render("addCategory.hbs");
});

app.get("/categories/delete/:id",ensureLogin, (req, res) =>{
  let Id = req.params.id;
  data.deleteCategoryById(Id)
  .then((data)=>res.render("categories", {categories: data}))
  .then(res.redirect(307,'/categories'))
  .catch((err)=>
    res.status(500).send("Unable to Remove Category / Category not found")
  );
});

app.post('/categories/add',ensureLogin, function (req, res, next) {
  data.addCategory(req.body)
  .then(()=>{res.redirect(307,'/categories')})
  .catch((err)=>{
    res.render("categories", {message: "no results"});
  });
});

// BLOG
app.get('/blog/:id',async (req, res) => {
  console.log("INSIDE /BLOG/:ID");
  //Declare an object to store properties for the view
  let viewData = {};
  try{
    // declare empty array to hold "post" objects
    let posts = [];
    // if there's a "category" query, filter the returned posts by category
    if(req.query.category){
      // Obtain the published "posts" by category
      posts = await data.getPublishedPostsByCategory(req.query.category);
    }else{
      // Obtain the published "posts"
      posts = await data.getPublishedPosts();
    }
    // sort the published posts by postDate
    posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
    // Obtain the post by "id"
    let post = await data.getPostById(+req.params.id);
    viewData.post = post;
  }catch(err){
    viewData.message = "no results"; 
  }

  try{
    // Obtain the full list of "categories"
    let categories = await data.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  }catch(err){
    viewData.categoriesMessage = "no results"
  }
  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

app.get('/blog', async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try{
    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if(req.query.category){
      // Obtain the published "posts" by category
      posts = await data.getPublishedPostsByCategory(req.query.category);
    }else{
      // Obtain the published "posts"
      posts = await data.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0]; 

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;

  }catch(err){
    viewData.message = "no results";
  }

  try{
    // Obtain the full list of "categories"
    let categories = await data.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  }catch(err){
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData}) 
});

// Authorization
app.get("/login",  (req, res) => {
  res.render("login.hbs")
});

app.get("/register",  (req, res) => {
  res.render("register.hbs")
});

app.post("/register",  (req, res) => {
  authData.registerUser(req.body)
  .then(()=>{
      res.render("register", {successMessage: "User created"})})
  .catch(err=>{
      res.render("register", {errorMessage: err, userName: req.body.userName})
  })
});

app.post("/login", (req,res)=>{
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
  .then((user) => {
    req.session.user = {
        userName: user.userName, // authenticated user's userName
        email: user.email, // authenticated user's email
        loginHistory: user.loginHistory // authenticated user's loginHistory
    }
    res.redirect('/posts');
  })
  .catch(err=>{
    res.render("login", {errorMessage: err, userName: req.body.userName} )
  })
})

app.get("/logout", (req,res)=>{
  req.session.reset();
  res.redirect("/");
})

app.get("/userHistory",ensureLogin, (req,res)=>{
  res.render("userHistory.hbs");
})

app.use((req, res)=>
  res.status(404).render("404.hbs")
);

data.initialize()
.then(authData.initialize)
.then(()=> app.listen(HTTP_PORT, onHttpStart)) // it listens to any request that comes, handles it and responds back
.catch((err)=>{
  console.log("unable to start server: " + err);
});

// setup http server to listen on HTTP_PORT
