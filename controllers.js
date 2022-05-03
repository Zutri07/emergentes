const { graphql, buildSchema } = require('graphql')

const model = require('./model') //Database

let DB
model.getDB().then(db => {DB=db})

const ObjectId = require('bson-objectid')


const sse  = require('./utils/notifications') //Notifications
sse.start()

const jsonld = require('./my-graph.json')


// const schema = buildSchema(`
//   type Query {
//     hello: String
//     users: [User]
//     blogs: [Blog]
//     searchBlog(q:String!):[Blog]
//     posts(blogId:ID!):[Post]
//     searchPost(blogId:ID!, q:String!):[Post]
//     searchUser(name:String):[User]
//   }
//   type Mutation {
//     addUser(name:String!):User!
//     addBlog(title:String!,creator:ID!):Blog!
//     addPost(title:String!,content:String!,authorId:ID!,blogId:ID!):Post
//   }
//   type User{
//  name: String
//   }

//   type Post{
//  title: String
//  content: String
//  author: User
//  blog: Blog
//   }

//   type Blog{
//  creator: User
//  title: String
//   }
// `)
const schema = buildSchema(`
  type Query {
    getUsers:[User]                                           
    getUser(_id:ID!):User
    getRestaurants:[Restaurant]
    getRestaurant(_id:ID!):Restaurant
    getRestaurantByName(name:String!):[Restaurant]
    getEmployers:[Employer]
    getEmployer(_id:ID!):Employer
    getDishes:[Dish]
    getDish(_id:ID!):Dish
    jsonld:String
    }

  type Mutation {
    addUser(name:String!, surnames:String, age: Int, email: String, passwd: String, rol: String):User!
    addRestaurant(name:String!, location: String):Restaurant!
    addEmployer(name:String!, restaurantId:ID, passwd:String):Employer!
    addEmployerToRestaurant(id:ID!, restaurantId:ID!):Employer!
    addDish(name:String!, price: Float!, ingredients:[String], active:Boolean, restaurantId: ID!):Dish!
    }

  type User{  
    _id: ID,
    name: String!,
    surnames: String,
    age: Int,
    email: String,
    passwd: String,
    rol: String 
    }

  type Restaurant{
    _id: ID,
    name:String!,
    location:String,
    dishes:[Dish]
    }

  type Employer{
    _id: ID,
    name:String!,
    restaurant:Restaurant,
    passwd:String!
    }

  type Dish{
    _id:ID!,
    name:String!,
    price:Float!,
    ingredients:[String],
    active:Boolean,
    restaurant: Restaurant!
    }

`)


const rootValue = {
    getUsers : () => DB.objects('User'),                                    //VA OK
    getRestaurants : () => DB.objects('Restaurant'),                        //VA OK
    getUser: ({ id }) => {                                                  //VA OK
      return DB.objects('User').filter(x => x._id==id)[0]   
    },
    getRestaurant: ({ id }) => {                                            //VA OK
      return DB.objects('Restaurant').filter(x => x._id==id)[0]       
    },
    getRestaurantByName: ({ name }) => {                                    //VA OK
      name = name.toLowerCase()
      return DB.objects('Restaurant').filter(x => x.name.toLowerCase().includes(name))
    },
    getEmployers : () => DB.objects('Employer'), 
    getEmployer : ({id}) => {return DB.objects('Employer').filter(x => x._id==id)[0]},
    getDishes : () => DB.objects('Dish'), 
    getDish: ({id}) =>{return DB.objects('Dish').filter(x => x._id==id)[0]},
    jsonld: () => {return JSON.stringify(jsonld)},


    addUser: ({name, surnames, age, email, passwd, rol})=>{                                                         //VA OK
      let data = null

        
        if (name){
            data = {
                _id: ObjectId(),
                _partition: model.partitionKey,
                name: name,
                passwd: name,
                surnames: surnames,
                age: age,
                email: email,
                rol: rol
            }
            if(passwd){
              data.passwd=passwd
            }
            DB.write(() => {DB.create('User', data)})


            let user = {_id: data._id,
              name: name,
              surnames: surnames,
              email: email}
              sse.emitter.emit('new-user', user)
        }
        return data
      
    },

  addRestaurant: ({name, location, dishes}) => {
       let data = null

        if (name){
        //  if (blog && auth){
          data = {
            _id: ObjectId(),
            _partition: model.partitionKey,

            name: name,
            location: location,
            dishes: dishes
          }

            DB.write( () => { DB.create('Restaurant', data) }) 
            let restaurant = {_id:data._id, name: data.name, location:data.location}
            sse.emitter.emit('new-restaurant', restaurant)
          }
            return data

    },
    addEmployer: ({name, restaurantId, passwd}) => {
      let restaurant = null
      if(restaurantId){
        restaurant = DB.objects('Restaurant').filter(x => x._id == restaurantId)[0]
      }
     
      let data = null

       if (name ){
       //  if (blog && auth){
           data = {
            _id: ObjectId(),
            _partition: model.partitionKey,
             name: name,
             restaurant: restaurant,
             passwd:"passwd"
             }
           DB.write( () => { DB.create('Employer', data) }) 

           // SSE notification (same view as in graphQL)
           let employer = {_id:data._id, name: data.name}
           sse.emitter.emit('new-employer', employer)
           return data
        }

   },
   addEmployerToRestaurant: ({id, restaurantId}) => {
    let employer = DB.objects('Employer').filter(x => x._id == id)[0]
    let restaurant = DB.objects('Restaurant').filter(x => x._id == restaurantId)[0]

    if (employer&&restaurant){
        
         DB.write( () => { employer.restaurant=restaurant }) 

         return employer
      
   }else{
       console.log("Error, datos invalidos")
       return {}
   }
 },
 addDish: ({name, price, ingredients, active, restaurantId}) => {
   
  let restaurant = DB.objects('Restaurant').filter(x => x._id == restaurantId)
  
  let data = null
  

  if (restaurant){
   if (name&&price&&restaurant){
   //  if (blog && auth){
       data = {
         _id: ObjectId(),
         _partition: model.partitionKey,
         name: name,
         price: price,
         ingredients: ingredients,
         active: true,
         restaurant: restaurant,
         }

       DB.write( () => { DB.create('Dish', data) }) 

       // SSE notification (same view as in graphQL)
       let dish = {_id: data._id, name: data.name, price: data.price}
       sse.emitter.emit('new-dish', dish)
       return data
    }
 }else{
     console.log("Error, datos invalidos")
     return {}
 }
},

    // deleteUser: ({id})=>{
    //   let data = null

    //   let consulta = DB.objects('Usuario1').filter(x => x.id == id)
    //   console.log(consulta)
    //   if (consulta.length==0){
        
    //     if (name){
    //         data = {
    //             id: id,
    //             name: name,
    //             passwd: name
    //         }
    //         DB.write(() => {DB.create('Usuario1', data)})

    //         // let user ={name: data.name}
    //         // sse.emitter.emit('new-user', user)
    //     }
    //     console.log("No hay ninguno")

    //     return {}
    //   }else{
    //       console.log("Error, clave duplicada")
    //       DB.write(() => {DB.delete('Usuario1', id)})
    //       return {}
    //   }
    // }
  //     }else{
  //       let user ={name: data.name}
  //       sse.emiter.emit('error-user', user)
  //     }
  //     return data
  // }
}

exports.root   = rootValue
exports.schema = schema
exports.sse    = sse