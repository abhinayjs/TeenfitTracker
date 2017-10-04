(function() {
  $('#pb_mongodbManage_form').validate();

  submitPBmongodbManage = function() {
    if(!$('#pb_mongodbManage_name').val().length || !$('#pb_mongodbManage_email').val().length) {
      $('#pb_mongodbManage_invalid').show();
      return;
    }

    $('#pb_mongodbManage_invalid').hide();
    $('#pb_mongodbManage_submit').prop('disabled', true);
    $('#pb_mongodbManage_spinner').show();

    var postData = {
      name: $('#pb_mongodbManage_name').val(),
      email: $('#pb_mongodbManage_email').val(),
      comment: $('#pb_mongodbManage_comment').val()
    }

    $.post('/api/mongodbManage/pb_mongodbManage_submit', JSON.stringify(postData), function(result) {
      if(result.code > 1) {
        $('#pb_mongodbManage_spinner').hide();
        $('#pb_mongodbManage_submit').prop('disabled', false)
                               .removeClass('btn-primary')
                               .addClass('btn-danger');
        $('#pb_mongodbManage_error').show();
        return;
      }

      $('#pb_mongodbManage_submit').removeClass('btn-primary')
                             .addClass('btn-success');
      $('#pb_mongodbManage_spinner i').removeClass('fa-circle-o-notch')
                                .removeClass('fa-spin')
                                .addClass('fa-check');
      $('#pb_mongodbManage_success').show();
    });
  }
}());
