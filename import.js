var path = require('path')
  , url = require('url')
  , jsdom = require('jsdom')
  , fs = require('fs')
  , request = require('request')
  ;
  
var h = {'accept-type':'application/json', 'content-type':'application/json'}
  
fs.readFile(path.join(__dirname, 'old.index.html'), function (err, data) {
  var window = jsdom.jsdom(data.toString()).createWindow();
  jsdom.jQueryify(window, "http://code.jquery.com/jquery-1.4.2.min.js" , function(document, $) {
    $('div.hentry').each(function (i, n) {
      n = $(n);
      var doc = {
          title: n.find('a[rel="bookmark"]').text()
        , type: 'blogpost'
        , created: new Date(Date.parse(n.find('abbr.published').text().slice(3)))
        , shortname: (function (){
          var url = n.find('a[rel="bookmark"]').attr('href')
          var u = url.slice(url.lastIndexOf('/', url.length - 2) + 1)
          return u.slice(0, u.length - 1)
        })()
        , body_html: (function () {
          var h = n.find('div.entry-content')
          h.find('div.sociable').remove();
          h = h.html();
          h = h.slice(h.indexOf('<'))
          h = h.slice(0, h.lastIndexOf('>')+1)
          return h
        })()
        , tags : n.find('li.categories').text().replace('Category: ','').toLowerCase().split(',  ')
      }
      doc._id = doc.shortname;
      doc.body_raw = doc.body_html;
      request({uri:'http://localhost:5984/newblog', method:'POST', headers:h, body:JSON.stringify(doc)}, function (err, resp, body) {
        console.log(body)
      })
      // console.log(doc)
    })
  });
})

