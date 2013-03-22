var ee;
ee = ee || {};
var console = (function () {
  var writeTab = function (msg) {
    var tab = $('#consoleArea');
    tab.html(tab.html() + msg + '\n');
  };
  return {
    log: writeTab,
    info: writeTab,
    error: writeTab
  };
})();

ee.wsIde = (function () {
  var updateOverlay = function() {
    var srcInput = $('#srcInput');
    var srcOverlay = $('#srcOverlay');

    var src = srcInput.val();
    var overlay = ee.wsIde.highlightSource(src);
    srcOverlay.html(overlay);

    var pre = $('#srcHiddenDiv');
    pre.html(src);
  
    srcInput.width(pre.width() + 30 );
    srcInput.height(srcOverlay.height() + 30);
    srcOverlay.css('top', -srcInput.height());
    $('#inputContainer').height(srcInput.height()); 
  };

  var programSource = function (src) {
    var srcInput = $('#srcInput');
    if (typeof src == "undefined") {
      return srcInput.val();
    } else {
     return ee.wsIde.loadSource(src);
    }
  };

  var printOutput = function(str) {
    var output = $('#printArea');
    output.html(output.html() + str);
    output.animate({scrollTop:output[0].scrollHeight},0);
  };
 

  var self = {
    examples: [],
    inputStream: '',
    highlightSource: function(src) {
      return src.replace(/[^\t\n ]/g, '#')
                .replace(/([ ]+)/g, '<span class="spaces">\$1</span>')
                .replace(/(\t+)/g, '<span class="tabs">\$1</span>')
                .replace(/#/g,' ');
    },
    
    init: function() {
      $('#srcInput').keyup(updateOverlay);
      $('#srcInput').change(updateOverlay);
      $('#srcInput').keydown(function(e){
        var ret=interceptTabs(e, this);
        updateOverlay();
        return ret;
      });
      ee.wsIde.initExamples();
      ee.wsIde.initEnv();
      ee.wsIde.switchTab('a[href=#printTab]');
    },

    initEnv: function () {
      var env = ws.env();
      env.print = printOutput;
      return env;
    },

    loadSource: function(src) {
      var ret = $('#srcInput').val(src);
      updateOverlay();
    },

    loadExample: function() {
      var idx = $('#example').val();
      if (!idx || !ee.wsIde.examples[idx]) return;
      var url = ee.wsIde.examples[idx].file;
      $.get(url, function(src) {
        ee.wsIde.loadSource(src);
      });
    },

    initExamples: function () {
      $.getJSON('example/meta.json', function(result) {
        ee.wsIde.examples = result.examples;
        var select = $('#example');
        for(var i=0; i<ee.wsIde.examples.length; i++) {
          var ex = ee.wsIde.examples[i];
          var option = new Option(ex.name, i);
          select[0].options[i] = option;
        }
        ee.wsIde.loadExample();
      });
    },

    runProgram: function() {
      try {
        var env = ee.wsIde.initEnv();
        var src = programSource();
        env.runProgram(ws.compile(src));
      } catch (err) {
        if (err != "Break") throw err;
      }
    },

    optimizeProgram: function() {
      var src = programSource();
      var src = ws.reduceProgram(ws.compile(src));
      programSource(src);
    },
    
    switchTab: function(selector) {
      var link = $(selector);
      var tabSelector = $(link).attr("href");
      var tab = $(tabSelector);
      link.closest(".outputTabs").find(".btn").removeClass("activeTab");
      link.closest(".btn").addClass("activeTab");

      tab.closest(".allTabs").find(".tabContent:visible").not(tabSelector).hide();
      tab.show(); 
      return false; 
    },

    handleUserInput: function (selector) {
      var input = $(selector);
      var val = input.val() + '\n';
      ee.wsIde.inputStream += val;
      printOutput(val);
      input.val('');
      return false;
    }
  };
  $(self.init);

  return self;
})();

