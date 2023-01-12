	const Sequelize = require('sequelize');
	var sequelize = new Sequelize('ctsewdla', 'ctsewdla', 'cs946xhfW2Rl1oyfaRvXAEUKjCcNU_xw', {
    host: 'chunee.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Defining Post
var Post = sequelize.define('Post', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN
});

// Defining Category
var Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Post.belongsTo(Category, {foreignKey: 'category'});

module.exports.initialize = function(){
    return new Promise((resolve, reject)=>{
        sequelize.sync().then(function(){
            resolve();
        }).catch(function (error){
            reject(`unable to sync the database: ${error}`);    
        });
    });
}

module.exports.getAllPosts = function(){
    return new Promise ((resolve, reject)=>{
        Post.findAll().then(function(data){
            //console.log(data);
            //console.log(data.category);
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        });
    });
}

module.exports.getPostsByCategory = function(cat){
    return new Promise ((resolve, reject)=>{
        Post.findAll({
            where: {
                category: cat 
            }
        }).then(function(data){
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        })
    });
}

module.exports.getPostsByMinDate = function(minDateStr){
    return new Promise ((resolve, reject)=>{
        const { gte } = Sequelize.Op;
        Post.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        }).then(function(data){
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        })
    })
}

module.exports.getPostById = function(Id){
    return new Promise ((resolve, reject)=>{
        Post.findOne({
            where: {id: Id}
        }).then(function(data){
            console.log(data);
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        })
    })
}

module.exports.addPost = function(postData){
    return new Promise ((resolve, reject)=>{
        postData.published = (postData.published) ? true : false;
        for(var obj in postData){
            if(postData[obj] === "") postData[obj] = null;
        }
        postData.postDate = new Date();
        
        Post.create(postData)
        .then((data)=>{
            console.log(data);
            resolve(data);
        }).catch(function(error){
            reject("unable to create post");
        })
        // Post.create({
        //     body: postData.body,
        //     title: postData.title,
        //     postDate: postData.postDate,
        //     featureImage: postData.featureImage,
        //     published: postData.published,
        //     category: postData.category 
        // }).then(function(){
        //     console.log(Post);
        //     resolve();
        // }).catch(function(error){
        //     reject("unable to create post");
        // });
    });
}

module.exports.getPublishedPosts = function(){
    return new Promise ((resolve, reject)=>{
        Post.findAll({
            where: {
                published: true
            }
        }).then(function(data){
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        })
    })
}

module.exports.getPublishedPostsByCategory = function(cat){
    return new Promise((resolve, reject)=>{
        Post.findAll({
            where: {
                published: true,
                category: cat
            }
        }).then(function(data){
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        })
    });
}

module.exports.getCategories = function(){
    return new Promise ((resolve, reject)=>{
        Category.findAll().then(function(data){
            resolve(data);
        }).catch(function(error){
            reject("no results returned");
        });
    });
}

module.exports.addCategory = function(categoryData){
    return new Promise ((resolve, reject)=>{
        for(var obj in categoryData){
            if(categoryData[obj] === "") categoryData[obj] = null;
        }
        Category.create({
            category: categoryData.category
        }).then(function(){
            console.log("New Category created");
            resolve();
        }).catch(function(error){
            reject("unable to create category");
        });
    });
}

module.exports.deleteCategoryById = function(Id){
    return new Promise ((resolve, reject)=>{
        Category.destroy({
            where: {id: Id}
        })
        .then(function(){
            resolve();
        }).catch(function(error){
            reject("Unable to delete category");
        })
    });
}

module.exports.deletePostById = function(Id){
    return new Promise ((resolve, reject)=>{
        Post.destroy({
            where:{id: Id}
        }).then(function(){
            resolve();
        }).catch(function(error){
            reject("Unable to delete post");
        })
    });
}

