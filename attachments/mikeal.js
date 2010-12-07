var request = function (options, callback) {
  options.success = function (obj) {
    callback(null, obj);
  }
  options.error = function (err) {
    if (err) callback(err);
    else callback(true);
  }
  if (options.data && typeof options.data == 'object') {
    options.data = JSON.stringify(options.data)
  }
  if (!options.dataType) options.processData = false;
  if (!options.dataType) options.contentType = 'application/json';
  if (!options.dataType) options.dataType = 'json';
  $.ajax(options)
}
/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */
function prettyDate(time) {
  if (time.indexOf('.') !== -1) time = time.slice(0, time.indexOf('.'))+'Z'
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
	    date = new Date(date.getTime() - (date.getTimezoneOffset() * 1000 * 60))
  		diff = (((new Date()).getTime() - date.getTime()) / 1000),
  		day_diff = Math.floor(diff / 86400)
  		;
  
  if (day_diff === -1) return "now"
	if ( day_diff >= 31) return day_diff + ' days ago';
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) return;
	
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}

$.expr[":"].exactly = function(obj, index, meta, stack){ 
  return ($(obj).text() == meta[3])
}

$.fn.textSelection = function (cb) {
  var self = $(this)
    , ret = {currentText:''}
    , mm
    ;
  var md = function () {
    mm = function (e) {
      var t = window.getSelection().toString();
      if (t !== ret.currentText) {
        ret.currentText = t; 
        cb.apply(this, [t, e]);
      }
    }
    self.mousemove(mm)
  }
  self.mousedown(md);
  ret.stop = function () {
    self.unbind('mousedown', md);
    self.unbind('mousemove', mm);
  };
  ret.cb = cb;
  return ret;
}

var getPostHtml = function (doc) {
  return $(
    '<div class="post-entry">' +
      '<div class="post-title">' + 
        '<a href="/post/' + doc._id + '">' + doc.title + '</a>' +
      '</div>' +
      '<div id="post-cell">' +
        '<div class="post-created-date">' + prettyDate(doc.created) + '</div>' +
        '<div class="spacer"></div>' +
        '<div class="post-body-container">' +
          '<div class="post-body">' + doc.body_html + '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  )
  ;
}

var setupSections = function (name) {
  $('span.sec').removeClass('selected-sec').addClass('linkified');
  $("div.info-cell span:exactly('"+name+"')").addClass('selected-sec').removeClass('linkified');
  $('div.info-cell span.linkified').click(function (n) {
    window.location = '/#/'+$(this).text();
  })
}
var couchUser

var checkAdmin = function () {
  var addLinks = function () {
    if (couchUser.userCtx.roles.indexOf('_admin') !== -1) {
      if ($('a.admin-link').length === 0) {
        $('body').append('<a class="admin-link" href="/#/new">admin</div>')
      }      
     $('div.post-title').each(function (i, n) {
        if ($(n).find('span.edit-link').length === 0) {
          $(n).append('<span class="edit-link">edit</span>').click(function () {
            window.location = $(this).find('a').attr('href').replace('/post/', '/edit/')
          })
        }
      })
    }
  }
  if (!couchUser) {
    request({url:'/_session'}, function (err, resp) {
      couchUser = resp;
      addLinks();
    })
  } else {addLinks()}
}

var app = {};
app.index = function () {
  var skip = 0;
  
  setupSections('blog');
  $('#content').html('');
  var container = $('<div class="blog-container"></div>').appendTo('#content')
    , rightside = $("#sidebar-right")  
    ;
    
  var flowcarrots = function (i, n) {
    $('div.post-entry, div.cocktail-post').each(function (i, n) {
      var top = $(n).position().top
      if (top == 0) {
        console.log(n)
      }
      n.collapse.css('top', top)
      n.expand.css('top', top)
    })
    
    var l = $('#sidebar-right').position().left;
    $('span.collapse').css('left', l);
    $('span.expand').css('left', l);    
    
    $('span#expand-all')
    .css({ left: $('#sidebar-right').position().left + $('#sidebar-right').width() - 20
         , top: $('div#primary-container').position().top
        })
  }
  
  var getPosts = function (cb) {
    var url = '_view/postsByCreated?'+$.param({include_docs:true, descending:true, limit:10, skip:skip});
    request({url:url}, function (err, resp) {
      if (err) throw err
      for (var i=0;i<resp.rows.length;i++) {
        (function () {
          
          if (resp.rows[i].doc.type === 'blogpost') {
            var post = getPostHtml(resp.rows[i].doc, container).appendTo(container)
              , hidePost = function () {post.find('div#post-cell').hide();}
              , showPost = function () {post.find('div#post-cell').show();}
              ;
          } else if (resp.rows[i].doc.type === 'cocktail') {
            var doc = resp.rows[i].doc
              , post = getCocktailHtml(doc, container)
              , hidePost = function () {
                  post.find('hr.cocktail-sep').hide();
                  post.find('div.cocktail-inner').hide();
                  post.find('div.cocktail-date').hide();
                  post.find('div.cocktail-title').removeClass('cocktail-title-expanded')
                }
              , showPost = function () {
                  post.find('hr.cocktail-sep').show();
                  post.find('div.cocktail-inner').show();
                  post.find('div.cocktail-date').show();
                  post.find('div.cocktail-title').addClass('cocktail-title-expanded')
              }
              ;
          }

          var top = post.position().top

          var expand = $('<span class="expand">▲</span>')
          .click(function () {
            $(this).hide();
            expand.collapse.show();
            showPost();
            flowcarrots();
          })
          .hide()
          .css('top', top)
          .appendTo('#sidebar-right')
          ;

          var collapse = $('<span class="collapse">▼</span>')
          .click(function () {
            $(this).hide();
            collapse.expand.show();
            hidePost();
            flowcarrots();
          })
          .css('top', top)
          .appendTo("#sidebar-right")
          ;

          collapse.expand = expand
          expand.collapse = collapse
          post.get(0).collapse = collapse
          post.get(0).expand = expand

          post.find('div#post-cell').append('<hr class="blogsep"></hr>')
        })()
      }
      if (!$('#expand-all').length) {
        var l = function () {
          $('span.collapse').click();
          $('span#expand-all-text').remove()
          $(this).text('▲').unbind('click')
          .click(function () {
            $('span.expand').click()
            $('span#expand-all-text').remove()
            $(this).text('▼').unbind('click').click(l)
          })
        }
        $('<span id="expand-all">▼</span>')
        .click(l)
        .hover(function () {
          $('<span id="expand-all-text">All</span>')
          .appendTo($(this).parent())
          .css({top: $(this).position().top + $(this).height(), left: $(this).position().left})
        }, function () {
          $('span#expand-all-text').remove()
        })
        .appendTo("#sidebar-right")
        .css({ left: $('#sidebar-right').position().left + $('#sidebar-right').width() - 20
             , top: $('div#primary-container').position().top
             })
      }
      $('<div><span class="load-more">Load 10 more posts</span></div>').appendTo(container).click(function () {
        var autoCollapse = false;
        $('span.load-more').remove();
        skip += 10
        if (!$('span.collapse:visible').length) autoCollapse = true
        getPosts(function () {
          if (autoCollapse) $('span.collapse').click();
        });        
      })
      checkAdmin();
      if (cb) cb();
    })
  }
  getPosts();
  
  $(window).resize(function () {
    flowcarrots();
  })
}

app.showPost = function () {
  $('span.sec').removeClass('selected-sec').addClass('linkified');
  $("div.info-cell span:exactly('blog')").addClass('selected-sec')
  $('div.info-cell span.linkified').click(function (n) {
    window.location = '/#/'+$(this).text();
  })
  $("div.info-cell span:exactly('blog')").addClass('linkified');
  $('#content').html('');
  $("#sidebar-right").html('');
  request({url:'/api/'+this.params.shortname}, function (err, doc) {
    if (err) {
      $('#content').append('<div class="error">404 Not Found</div>')
    } else {
      document.title = doc.title;
      var container = $('<div class="blog-container"></div>').appendTo('#content')
      getPostHtml(doc).appendTo(container);
    }
  })
  checkAdmin();
}
app.twitter = function () {
  
}

var editorElement = $(
  '<div id="post-editor">' +
    '<div id="post-editor-editor">' +
      '<input type="text" id="post-editor-title" class="editor-input"></input>' +
      '<textarea id="post-editor-input" class="editor-input"></textarea>' + 
      '<input type="text" id="post-editor-tags"></input>' +
    '</div>' +
    '<div id="post-editor-preview">' +
      '<div class="post-title" contentEditable=true></div>' +
      '<div class="post-created-date">now</div>' +
      '<div class="spacer"></div>' +
      '<div class="post-body-container">' +
        '<div class="post-body" contentEditable=true></div>' +
      '</div>' +
      '<span class="save-button">save</span>' +
    '</div>' +
  '</div>'
)

var setupEditor = function (doc, previewCallback, saveCallback) {
  var e = editorElement;
  $('div#full-content').append(e);
  e.find('textarea#post-editor-input').val(doc.body_html);
  e.find('input#post-editor-title').val(doc.title)
  var updatePreview = function () {
    if (previewCallback) previewCallback(e)
    var title = e.find('input#post-editor-title').val()
      , body = e.find('textarea#post-editor-input').val()
      ;
    e.find('div.post-title').text(title);
    e.find('div.post-body').html(body);
  }
  var updateInputs = function () {
    e.find('input#post-editor-title').val(e.find('div.post-title').html())
    e.find('textarea#post-editor-input').val(e.find('div.post-body').html())
    if (previewCallback) {updatePreview()}
  }
  updatePreview(e);
  e.find('div.post-created-date').text(prettyDate(doc.created))
  e.find('input#post-editor-tags').val(doc.tags.join(', '))
  var h = e.find('div#post-editor-preview').height();
  e.find('textarea').height(h + (h / 4))
  // Setup change listener
  e.find('textarea').keyup(function () {
    updatePreview(e)
  });
  e.find('input').keyup(function () {
    updatePreview(e)
  });
  e.find('div.post-title').keyup(updateInputs);
  e.find('div.post-body').keyup(updateInputs);
  $('span.save-button').click(function () {
    doc.tags = trim(e.find('input#post-editor-tags').val()).split(',');
    doc.title = e.find('input#post-editor-title').val();
    doc.body_html = e.find('textarea#post-editor-input').val();
    if (saveCallback) saveCallback(e);
    request({url:'/api/'+doc._id, data:doc, type:'PUT'}, function (err, resp) {
      if (err) throw err;
      window.location = '/post/'+resp.id;
    })
  })
  return e;
}

function trim (s) {
  while (s.indexOf(' ') !== -1) s = s.replace(' ','');
  return s
}

app.editPost = function () {
  request({url:window.location.pathname.replace('/edit/', '/api/')}, function (err, doc) {
    var e = setupEditor(doc);
    
  })
}

app.newPost = function () {
  var doc = {tags:[], created:JSON.parse(JSON.stringify(new Date())), type:'blogpost'}
  var e = setupEditor(doc, 
  function (e) {
    doc.shortname = e.find('input#post-editor-title').val();
    while (doc.shortname.indexOf(' ') !== -1) doc.shortname = doc.shortname.replace(' ', '-')
    doc.shortname = doc.shortname.replace(/[^a-zA-Z-0-9]+/g,'')
    doc.shortname = doc.shortname.toLowerCase();
    doc._id = doc.shortname;
    e.find('div#shortname').text(doc.shortname)
  },
  function (e) {
    
  });
  
  e.find('div.post-body-container').before('<div id="shortname"></div>')
  e.find("textarea#post-editor-input").height("800px");
}

app.newThought = function () {
  request({url:'/_uuids?count=1'}, function (err, resp) {
    if (err) console.log(err)
    var uuid = resp.uuids[0]
      , tiny
      , params = {format: 'json', longUrl: "http://www.mikealrogers.com/thoughts/"+uuid, 
                  login: 'mikealrogers', apiKey: "R_53107ba8fb5cb641f6383b927503b3a4",
                  }
      ;
    $('<div class="container">' + 
        '<div class="thought-spacer">&nbsp</div>' +
        '<div class="thought">' + 
          '<div class="thought-inner" contentEditable=true>' +
          '</div>' +
        '</div>' +
        '<div class="thought-spacer">&nbsp</div>' +
      '</div>')
    .appendTo('div#content')
    .parent()
      .append('<div class="spacer"></div>')
      .append(
        '<div class="container">' + 
          '<div id="thought-tweet"></div><span class="button" id="select-tweet">select</span><div id="tweet-word-count"></div>' + 
        '</div>')
    ;
    
    // 
    // request({url:'http://api.bit.ly/v3/shorten?'+$.param(params), dataType:'jsonp'}, function (err, resp) {
    //   if (err) console.log(err);
    //   tiny = resp.data.url;
    //   $('div#thought-tweet').text(tiny).change();
    // })
    
    var c = $("div#tweet-word-count")
    $('div#thought-tweet').change(function () {
      c.text($(this).text().length)
    })
    var textSel;
    var s = function () {
      var ts = $('div.thought-inner').textSelection(function (t, e) {
        $('div#thought-tweet').text('"'+t+'" http://bit.ly/b0fUul').change();
        textSel = t;
      })
      $('div.thought-inner').attr('contentEditable', false)
      var self = $(this)
      $('span#select-tweet')
      .unbind('click')
      .click(function () {
        ts.stop();
        $('span#select-tweet')
        .unbind('click')
        .click(s)
        ;
        $('div.thought-inner')
        .text($('div.thought-inner').text())
        .html($('div.thought-inner').html().replace(textSel, '<strong>'+textSel+'</strong>'))
        .attr('contentEditable', true)
      })
    }
    $('span#select-tweet').click(s)
    $('span#save-button').click(function () {
      var obj = { _id: uuid, tiny: tiny, body_html: $('div.thought-inner').html() 
                , title: textSel
                , tweet: $('div#thought-tweet').text(), created: new Date()}
      request({url:'/api/'+uuid, type:'PUT', data:obj}, function (err, resp) {
        
      })
    })
     
    $('div#thought-tweet').text('http://bit.ly/b0fUul').change();
  })
  
}

var cocktailHtml = '<div class="cocktail-post">' + 
    '<div class="cocktail-spacer">&nbsp</div>' +
    '<div class="cocktail">' + 
      '<div class="cocktail-title cocktail-title-expanded"></div>' +
      '<hr class="cocktail-sep"></hr>' +
      '<div class="cocktail-inner">' +
      '</div>' +
    '</div>' +
    '<div class="cocktail-spacer">&nbsp</div>' +
    '<div class="spacer"></div>' +
    '<div class="cocktail-date"></div>' +
  '</div>'
  
var getCocktailHtml = function (doc, elem) {
  var c = $(cocktailHtml);
  c.find('div.cocktail-title').html('<a href="/cocktail/'+doc._id+'">'+doc.title+'</a>');
  c.find('div.cocktail-inner').html(doc.body_html);
  c.find('div.cocktail-date').text('posted '+prettyDate(doc.created))
  c.appendTo(elem);
  return c;
}


app.newCocktail = function () {
  var seperators = ['oz ', 'dash ']
    , id = this.params.id 
    , doc = { type: 'cocktail' }
    ;
  $(cocktailHtml)
  .appendTo('div#content')
  .parent().parent()
  .append($(
    '<span class="button">preview</span>'
    )
    .click(function () {
      $('div.cocktail-inner').find('div').each(function (i, n) {
        if ($(n).attr('class').length === 0) $(n).addClass('cocktail-desc');
      })
      
      $('div.cocktail-inner').find('div.cocktail-desc').each(function (i, n) {
        n = $(n)
        var t = n.text();
        if (!n.find('div.measurement').length) {
          for (var i=0;i<seperators.length;i++) {
            if (t.indexOf(seperators[i]) !== -1) {
              n.html(
                '<div class="measurement">' + 
                t.slice(0, t.indexOf(seperators[i])+seperators[i].length) +
                '</div><div class="cocktail-text">' +
                t.slice(t.indexOf(seperators[i])+seperators[i].length) +
                '</div>'
                )
              .append('<div class="spacer"></div>')
              ;
              return;
            }
          } 
        }
      })
      var w = 0;
      $('div.measurement').each(function (i, n) {
        if ($(n).width() > w) w = $(n).width();
      })
      $('div.measurement').width(w);
    })
  )
  .append($(
    '<span class="button">save</span>'
    )
    .click(function () {
      $('span.button:exactly("preview")').click();
      if (!doc._rev) doc.created = new Date();
      doc.body_html = $('div.cocktail-inner').html();
      doc.title = $('div.cocktail-title').text();
      doc.ingredients = {}
      $('div.cocktail-inner div.cocktail-desc').each(function (i, n) {
        n = $(n);
        if (n.find('div.measurement').length) {
          doc.ingredients[n.find('div.cocktail-text').text()] = n.find('div.measurement').text();
        }
      })
      request({url:'/api', type:'POST', data:JSON.stringify(doc)}, function (err, resp) {
        if (err) throw err;
        window.location = '/cocktail/'+resp.id;
      })
    })
  )
  ;
  $('div.cocktail-title').attr('contentEditable', true);
  $('div.cocktail-inner').attr('contentEditable', true);
  if (id) {
    request({url:'/api/'+id}, function (err, obj) {
      doc = obj
      $('div.cocktail-inner').html(doc.body_html)
      $('div.cocktail-title').text(doc.title)
    })
  }
}
app.showCocktail = function () {
  var id = this.params.id;
  $('span.sec').removeClass('selected-sec').addClass('linkified');
  $("div.info-cell span:exactly('blog')").addClass('selected-sec')
  $('div.info-cell span.linkified').click(function (n) {
    window.location = '/#/'+$(this).text();
  })
  $("div.info-cell span:exactly('blog')").addClass('linkified');
  $('#content').html('');
  $("#sidebar-right").html('');
  request({url:'/api/'+id}, function (err, resp) {
    getCocktailHtml(resp, $('div#content'))
  })
  checkAdmin();
}

var staticPage = function (name) {
  var r = function () {
    var self = this
      , args = arguments
      ;
    setupSections(name)
    this.render('/partials/'+name+'.html').replace('#content').then(function () {
      if (app[name]) app[name].apply(self, args);
    })
  }
  return r
}
var couchdbUser;

var a = $.sammy(function () {
  // Cleanup actions bound before the route is run.
  this.bind("run-route", function () {
    $('div#sidebar-left').html('&nbsp');
    $('div#sidebar-right').html('&nbsp');
  })
  
  // Static pages
  this.get('#/about', staticPage('about'))
  this.get('#/blog', app.index)
  // this.get('#/twitter', staticPage('twitter'))
  // this.get('#/code', staticPage('code'))
  this.get('#/twitter', function () {window.location = 'http://twitter.com/mikeal'})
  this.get('#/code', function () {window.location = 'http://github.com/mikeal'})
  
  // Create new post
  this.get('/new', app.newPost);
  this.get('/newThought', app.newThought);
  this.get('/newCocktail', app.newCocktail);
  
  // Resume
  this.get('/resume', function () {})
  
  // Show cocktail
  this.get('/cocktail/:id', app.showCocktail);
  this.get('/cocktail/edit/:id', app.newCocktail);

  // Show individual posts
  this.get('/post/:shortname', app.showPost);  
  this.get('/post/:shortname/', app.showPost);  
  this.get('/post/:shortname//', app.showPost);  
  // Edit posts
  this.get('/edit/:shortname', app.editPost);  
  this.get('/edit/:shortname/', app.editPost);
  // Legacy paths
  this.get('/:year/:month/:shortname', app.showPost);
  this.get('/:year/:month/:shortname/', app.showPost);
  this.get('/:year/:month/:shortname//', app.showPost);
  
  // Index of all databases
  this.get('', app.index);
  this.get("#/", app.index);
})

$(function () { 
  a.run(); 
});
