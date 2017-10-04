(function() {

  getTables = function() {

    $.post('/api/mongoDB/get_mongoDB_tables', function(dbs) {

        for(var i=0;i<dbs.code.databases.length;i++){  
            
            var dbname = {
              name: dbs.code.databases[i].name
            }
            var databaseName = dbs.code.databases[i].name;

            $('#database').append(
                "<li><a href='#' a_db_id='"+databaseName+"' ><i class='fa fa-table fa-fw'></i>"+databaseName+"<span class='fa arrow' id='"+databaseName+"'></span></a>" +
                 "<ul class='nav nav-third-level' id = '"+databaseName+"_ul' style='display: none'>" + 
                    "<li ><a href='#' data-toggle='modal' data-target='#addNewCollectionModal' a_add_collec_id = '"+databaseName+"'><span class='glyphicon-plus'> Add Collection</span></a>"+
                    "</li>"+
                    "<li ><a href='#' data-toggle='modal' data-target='#dropDatabaseModal' a_drop_id = '"+databaseName+"'><span class='glyphicon-remove'> Drop Database</span></a>"+
                    "</li>"+
                  "</ul>"+
                "</li>"  
            );
           
        }
 
         $("#database li a").click(function(dbs){
                
                var dbname = $(this).attr("a_db_id");
                if(dbname != null){
                  showTableInfo(dbname);
                  getCollection(dbname);
                }
                
                
            });//end click function  
         
        $("#database li a span").click(function(){    
                // alert(this.span_id);  
                var span_id = this.id; 
                // alert(span_id) 
                var ul_id = span_id+"_ul";
    
                if($('#'+ul_id).is(':visible')){
                    $('#'+ul_id).hide();
                }else{
                    $('#'+ul_id).show();
                }
        });//end click function  

        $("#database li ul li a").click(function(){ 

            var add_collec_dbname = $(this).attr("a_add_collec_id");
            if(add_collec_dbname != null){
              $('#add_collec_dbname').val(add_collec_dbname);
              // alert($('#add_collec_dbname').val());
            }

            // alert("1:" + drop_pointed_dbname);
            
        });

        $("#database li ul li a").click(function(){ 

            var drop_pointed_dbname = $(this).attr("a_drop_id");
            if(drop_pointed_dbname != null){
              $('#pointed_dbname').val(drop_pointed_dbname);
            }
            // alert("1:" + drop_pointed_dbname);
            
        });

    });
  }
}());



// (function() {

//   getTables = function() {
   

//     var doc1 = {'title':'doc1', 'description':'MogoDB is a non-sql database1'};

//     $.post('/api/mongoDB/get_mongoDB_tables', JSON.stringify(doc1), function(dbs) {
//      //var obj = eval ("(" + dbs + ")");
//      //alert(obj.employees[1].firstName );
//         alert(JSON.stringify(dbs));
//      for(var i=0;i<dbs.code.databases.length;i++){  
//          // alert(JSON.stringify(dbs.code.databases[i].name));
//          var dbname = dbs.code.databases[i].name;
            
//          $('#side-menu').append(
//              "<li li_id = '"+dbname+"'> <a a_id = '"+dbname+"' href='javascript:;'><i class='fa fa-dashboard fa-fw'></i>"+dbname+"</a> </li>"
//          );
//      }

//         $("#side-menu li a").click(function(dbs){

//                 var dbname = $(this).attr("a_id");
//                 showTableInfo(dbname);
                
//             });//end click function  
        
//     });
//   }

// }());