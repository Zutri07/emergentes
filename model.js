const Realm = require('realm')

const ObjectId = require('bson-objectid')

const app = new Realm.App({ id: "ezpay-ecugt" })


// let UserSchema = {
//    name: 'User',
//    primaryKey: 'name',
//    properties: {
//       name: 'string',
//       passwd: 'string'
//    }
// }

// let PostSchema = {
//   name: 'Post',
//   primaryKey: 'title',
//   properties: {
//     timestamp: 'date',
//     title: 'string', 
//     content: 'string',
//     author: 'User',
//     blog: 'Blog'
//   }
// }

// let BlogSchema = {
//   name : 'Blog',
//   primaryKey: 'title',
//   properties:{
//      title: 'string',
//      creator: 'User' //esto es una referencia a un usuario
//    }
// }

  let UserSchema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      _partition: 'string',
      name: 'string',
      surnames: 'string?',
      age: 'int?',
      email: 'string?',
      passwd: 'string',
      rol: 'string?',
      // counts: 'Count[]?'
    }
  }

  let CountSchema = {
  name: 'Count',
  primaryKey: '_id',
  properties: {
      _id: 'objectId',
      _partition: 'string',
      timestamp: 'date',
      restaurant: 'Restaurant',
      clients: 'User[]',
      dishes: 'Dish[]',
      manager: 'User',
      active: 'bool',
    }
  }

  let EmployerSchema = {
  name : 'Employer',
  primaryKey: '_id',
  properties:{
      _id: 'objectId',
      _partition: 'string',
      name: 'string',
      restaurant: 'Restaurant?',
      passwd: 'string'
    }
  }

  

  let DishSchema= {
  name: 'Dish',
  primaryKey: '_id',
  properties:{
    _id: 'objectId',
    _partition: 'string',
    name:'string',
    price:'float',
    ingredients:'string[]',
    active:'bool?',
    restaurantId:'Restaurant'
  }

}
let RestaurantSchema = {
name : 'Restaurant',
primaryKey: '_id',
properties:{
    _id: 'objectId',
    _partition: 'string',
    name: 'string',
    location: 'string?',
    dishes: 'Dish[]'
  }
}

// // // MODULE EXPORTS

const myPartitionKey = "myAppPartition"
let sync = {user: app.currentUser, partitionValue: myPartitionKey}
let config = {path: './data/restaurants.realm', sync: sync,
              schema: [CountSchema, UserSchema, EmployerSchema, RestaurantSchema, DishSchema]}
exports.getDB = async () => {
                    await app.logIn(new Realm.Credentials.anonymous())
                    return await Realm.open(config)
}
exports.partitionKey = myPartitionKey
exports.app = app

// let config = {path: './data/blogs.realm', schema: [PostSchema, UserSchema, BlogSchema]}
// let config = {path: './data/restaurants.realm', schema: [CountSchema, UserSchema, EmployerSchema, RestaurantSchema, DishSchema]}

// exports.getDB = async () => await Realm.open(config)

// // // // // 

if (process.argv[1] == __filename){ //TESTING PART

  if (process.argv.includes("--create")){ //crear la BD

      Realm.deleteFile({path: './data/restaurants.realm'}) //borramos base de datos si existe

      app.logIn(new Realm.Credentials.anonymous()).then(() => {

        let DB = new Realm({
          // path: './data/blogs.realm',
          path: './data/restaurants.realm',
          sync: sync,
          schema: [CountSchema, UserSchema, EmployerSchema, RestaurantSchema, DishSchema]
        })
           
     
      DB.write(() => {
        let user  = DB.create('User', {_id: ObjectId(), _partition: myPartitionKey, name:'user0', passwd:'xxx'})
        let user1 = DB.create('User', {_id: ObjectId(), _partition: myPartitionKey, name:'Jorge', passwd:'yyy'})
        let user2 = DB.create('User', {_id: ObjectId(), _partition: myPartitionKey, name:'Antonio', passwd:'zzz'})
        let user3 = DB.create('User', {_id: ObjectId(), _partition: myPartitionKey, name:'Rafa', passwd:'rrr'})
        
        let restaurant  = DB.create('Restaurant', {name: "Restaurante1", _id: ObjectId(), _partition: myPartitionKey, location:'Todo Motos'})
        let restaurant1 = DB.create('Restaurant', {name: "Casa di mama", _id: ObjectId(), _partition: myPartitionKey, location:'Xeresa'})
        let restaurant2 = DB.create('Restaurant', {name: "Kamaleon", _id: ObjectId(), _partition: myPartitionKey, location:'Castellón'})
        let restaurant3 = DB.create('Restaurant', {name: "Ca vicent", _id: ObjectId(), _partition: myPartitionKey, location:'Xeresa'})

        let dish  = DB.create('Dish', { _id: ObjectId(), _partition: myPartitionKey, name:'Plato1', price: 1})
        let dish1 = DB.create('Dish', { _id: ObjectId(), _partition: myPartitionKey, name:'Plato2', price: 10})
        let dish2 = DB.create('Dish', { _id: ObjectId(), _partition: myPartitionKey, name:'Plato3', price: 12})
        let dish3 = DB.create('Dish', { _id: ObjectId(), _partition: myPartitionKey, name:'Plato4', price: 13})

        let employer  = DB.create('Employer', {_id: ObjectId(), _partition: myPartitionKey, name:'Pedro', passwd:'xxx'})
        let employer1 = DB.create('Employer', {_id: ObjectId(), _partition: myPartitionKey, name:'Jose', passwd:'yyy'})
        let employer2 = DB.create('Employer', {_id: ObjectId(), _partition: myPartitionKey, name:'Paco', passwd:'zzz'})
        let employer3 = DB.create('Employer', {_id: ObjectId(), _partition: myPartitionKey, name:'Felipe', passwd:'rrr'})
        
        console.log('Inserted objects', user, restaurant)
      })
      DB.close()
      })
      .catch(err => console.log(err))

  }
  else { //consultar la BD
      console.log('Else')

      Realm.open({ path: './data/restaurant.realm' , sync: sync, schema: [CountSchema, UserSchema, EmployerSchema, RestaurantSchema, DishSchema] }).then(DB => {
        let users = DB.objects('User')
        users.forEach(x => console.log(x.name))
        let restaurant = DB.objectForPrimaryKey('Restaurant', 1)
        if (restaurant)
           console.log(restaurant.location)
        
        DB.close()
      })
  }
  
}
