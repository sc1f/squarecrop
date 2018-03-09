/*
 * Copyright 2013. Amazon Web Services, Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

var express = require('express');
var app = express();

// Load the SDK and UUID
var AWS = require('aws-sdk');
var uuidv4 = require('node-uuid');

// Load Multer for form
var multer = require('multer')
var multerS3 = require('multer-s3')

// load sharp and smartcrop for image cropping
var request = require('request');
var sharp = require('sharp');
var smartcrop = require('smartcrop-sharp');

// Use our env vars for setting credentials
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create an S3 client
var s3 = new AWS.S3();
// get our bucket names
var bucket_name = process.env.BUCKET_NAME,
    resized_bucket_name = process.env.RESIZED_BUCKET_NAME;

// multer upload
var re = /(?:\.([^.]+))?$/;

var upload = multer({
    storage: multerS3({
      s3: s3,
      acl: "public-read",
      bucket: bucket_name,
      key: function (req, file, cb) {
        cb(null, uuidv4() + "." + re.exec(file.originalname)[1])
      }
    })
  })

var uploadImageBuffer = function(data, key) {
    var params = { Bucket: resized_bucket_name, Key: key, Body: data, ACL:'public-read'};
    s3.upload(params, function(err, data) {
      if (err)
        console.error(err)
      else {
        console.log(data)
        console.log("Successfully uploaded data to " + data.Location);
        return data.Location;
      }
    });
}

// init smartcropper
var smartCropper = function(src, dest, width, height){
  request(src, { encoding: null }, function process(error, response, body) {
    if (error) throw error;
    smartcrop.crop(body, { width: width, height: height }).then(function(result) {
      var crop = result.topCrop;
      var img = sharp(body)
        .extract({ width: crop.width, height: crop.height, left: crop.x, top: crop.y })
        .resize(width, height)
        .toBuffer()
        .then(function(data){
          return uploadImageBuffer(data, dest);
        })
      return img;
    });
  });
};

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post("/new-photo", upload.single('photo'), function(request, response) {
  try {
    var shortest_edge = Number(request.body.dimensions),
        resized_key = "resized-" + request.file.key;
    console.log("smart cropping image at " + request.file.key);
    smartCropper(request.file.location, resized_key, shortest_edge, shortest_edge);
    var url = "https://" + resized_bucket_name + ".s3.amazonaws.com/" + "resized-" + request.file.key;
    console.log(url)
    // let AWS catch up
    setTimeout(function() { response.redirect(url); }, 3000);
  } catch(err) {
    console.error(err);
    response.redirect("/");
  }
});

app.get("/success", function(request, response) {
  response.send("@!#");
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
