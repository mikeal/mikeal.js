 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = { _id:'_design/app'
  , rewrites : [
        {from:"/", to:'index.html'}
      , {from:"/new", to:'index.html'}
      , {from:"/edit/*", to:'index.html'}
      , {from:"/post/*", to:'index.html'}
      , {from:"/2010/*", to:'index.html'}
      , {from:"/2009/*", to:'index.html'}
      , {from:"/2008/*", to:'index.html'}
      , {from:"/api", to:'../../'}
      , {from:"/api/*", to:'../../*'}
      , {from:"/*", to:'*'}
    ]
  }

ddoc.views = {postsByCreated: {map: function (doc) {
  if (doc.type == 'blogpost') emit(doc.created, 1);
}}}

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {     
    throw "Only admin can delete documents on this database."   
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'))

module.exports = ddoc