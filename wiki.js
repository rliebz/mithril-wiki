// Wiki model
var wiki = {};

wiki.Wiki = function(data) {
    this.title = m.prop(data.title);
    this.description = m.prop(data.description);
    this.new = m.prop(true);
};

wiki.WikiList = Array;


// Wiki controller
wiki.controller = function() {

    var self = this;

    self.list = new wiki.WikiList();

    self.editable = m.prop(false);
    self.message = m.prop("");

    self.wiki = null;
    self.title = m.prop("Default Wiki");
    self.description = m.prop("Wiki Description Goes Here.");

    self.selectWiki = function(wiki) {
        self.wiki = wiki;
        self.title(wiki.title());
        self.description(wiki.description());
        self.editable(false);
    };

    self.newWiki = function () {
        self.selectWiki(new wiki.Wiki({title: "", description: ""}));
        self.enableEdit();
    };

    self.update = function() {
        if (self.title() && self.description()) {
            self.message("");
            self.wiki.title(self.title());
            self.wiki.description(self.description());
            self.editable(false);
            if (self.wiki.new()) {
                self.wiki.new(false);
                self.list.push(self.wiki);
            }
            self.save();
        } else {
            self.message("Error: You can't save a wiki without a title and description.");
        }
    };

    self.save = function() {
//        m.request({method: "PUT", url: "/list", data: self.list}); // Using API route
        sock.send(JSON.stringify(self.list)); // Using sockets
    };

    self.delete = function(index) {
        if (self.list.length > 1) {
            self.list.splice(index, 1);
            self.save();
            self.selectWiki(self.list[0]);
        } else {
            self.message("Error: You can't delete your only wiki!")
        }
    };

    self.enableEdit = function() {
        self.editable(true);
        self.message("");
    };


    self.initialize = function () {
        if (self.list.length > 0) {
            self.selectWiki(self.list[0]);
        } else {
            self.newWiki();
        }
    };

    // Socket Business
    var sock = new SockJS('http://localhost:8080/sock');
    sock.onopen = function() {
        console.log('open');
    };
    sock.onmessage = function(e) {
        console.log('Message occurred: ', e);
        self.list = new wiki.WikiList;
        var wikis = JSON.parse(e.data);
        for (var i in wikis){
            var wikiJSON = wikis[i];
            console.log(wikiJSON);
            var loadedWiki = new wiki.Wiki({title: wikiJSON.title, description: wikiJSON.description});
            loadedWiki.new(false);
            self.list.push(loadedWiki);
        }
        self.initialize();
        m.redraw();
    };
    sock.onclose = function() {
        console.log('close');
    };

    // Data retrieval through API endpoints
//    m.request({method: "GET", url: "/list"}).then(function(wikis) {
//        console.log('SUCCESS');
//        console.log(wikis);
//        for (var i in wikis){
//            console.log(wikis[i]);
//            var wikiJSON = wikis[i];
//            var loadedWiki = new wiki.Wiki({title: wikiJSON.title, description: wikiJSON.description});
//            loadedWiki.new(false);
//            self.list.push(loadedWiki);
//        }
//    }, function() {self.message("Error: Studies could not be loaded.")}).then(function() {
//        if (self.list.length > 0) {
//            self.selectWiki(self.list[0]);
//        } else {
//            self.newWiki();
//        }
//    });

    self.initialize();

};

wiki.view = function(ctrl) {

    var wikiList = (ctrl.list.length > 0) ?
        m("div", [
            m("ul", [
                m("lh", "Wikis"),
                ctrl.list.map(function(wiki, index) {
                    return m("li", [
                        m("a[href=#]", {onclick: function () {
                            ctrl.selectWiki(wiki);
                        }}, wiki.title()),
                        m("span", " "),
                        m("button", {onclick: function() {ctrl.delete(index)}}, 'X')
                    ])
                })
            ])
         ])
        :
        m("div", {class: 'text-danger'}, "You do not have any wikis yet.")
        ;
    var wikiView = ctrl.editable() ?
        m("div", [
            m("h4", [
                m("input", {onchange: m.withAttr("value", ctrl.title), value: ctrl.title()})
            ]),
            m("textarea", {style: {width: '300px', height: '200px'},
                           onchange: m.withAttr("value", ctrl.description),
                           value: ctrl.description()}
             ),
            m("div", [
                m("button", {onclick: ctrl.update}, "Save")
            ])
        ])
        :
        m("div", [
            m("h4", ctrl.wiki.title()),
            m("span", ctrl.wiki.description()),
            m("div", [
                m("button", {onclick: ctrl.enableEdit}, "Edit Wiki")
            ]),
            m("div", [
                m("button", {onclick: ctrl.newWiki}, "New Wiki")
            ])
        ]);
    return m("div", [
        wikiView,
        m("br"),
        m("div", [
            m("span", {class: 'text-danger'}, ctrl.message())
        ]),
        wikiList,
        m("br"),
        m("a[href='/']", {config: m.route}, "Home")
    ]);
};

var home = {
    controller: function () {

    },
    view: function(ctrl) {
        return m("html", [
            m("body", [
                m("h4", "Homepage"),
                m("a[href='/about']", {config: m.route}, "About this program"),
                m("br"),
                m("a[href='/wiki']", {config: m.route}, "View Wiki")
            ])
        ])
    }
};

var about = {
    controller: function() {

    },
    view: function(controller) {
        return m("body", [
            m("div", "This is some text about the program."),
            m("br"),
            m("a[href='/home']", {config: m.route}, "Home")
        ]);
    }
};

m.route(document.body, "/", {
    "/": home,
    "/wiki": wiki,
    "/about": about
});

