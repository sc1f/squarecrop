var file_upload_handler = {
  form: $("#upload-photo-form"),
  input: $("#upload-photo"),
  hidden_input: $("#photo-dimensions"),
  button: $("#submit-btn"),
  init: function() {
    // show button
    var input = this.input,
        button = this.button,
        hidden = this.hidden_input;
    
    input.change(function(event) {
      if(input.prop("files")) {
        var files = input.prop("files"),
            hidden = $("#photo-dimensions"),
            file = files[0],
            image = new Image();
        console.log(file, image);
        
        image.src = window.URL.createObjectURL( file );
        image.onload = function() {
          
          var width = image.naturalWidth,
              height = image.naturalHeight;
          console.log(width, height);
          $("#image").attr('src', image.src)
          $("#image-placeholder").css("display", "none");
          
          
          // calculate longest edge and populate form
          var shortest_edge = undefined;
          if(width < height) {
            shortest_edge = width;
          } else {
            shortest_edge = height;
          }
          hidden.val(shortest_edge);
        };

        button.css("display", "block")
      }
    });
  }
}

$(document).ready(function() {
  file_upload_handler.init();
});
