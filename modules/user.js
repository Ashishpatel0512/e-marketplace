const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
      type:String,
    },
   emailid: {
        type:String,
      },
      password: {
        type:String,
      },
      status: {
        type:String,
        default:"Active"

      },
      image: 
        {
        url:{
          type:String,
        default:"https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"
        },
        filename:{
           type:String,
        default:"image.png"
        }
        }
}
 );
  
module.exports= mongoose.model("Users", userSchema);
