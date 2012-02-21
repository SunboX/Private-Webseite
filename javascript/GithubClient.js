Date.defineParser(
    '%x %X %z' // "2009/11/16 10:36:12 -0800"
);

var GithubClient = new Class({
    Implements: [Options, Events],
    options: {
        onRequest: $empty,
        onComplete: $empty
    },
    initialize: function(a, b){
        this.setOptions(b);
        this.container = $("github");
        this.scrollParent = this.container.getParent('.box-wrapper');
        this.info = {};
        this.username = a;
        this.templates = [];
        this.templatesShown = 0;
        this.fadingIn = false;
        this.boundFadeComplete = this.fadeComplete.bind(this);
    },
    retrieve: function(){ (new Request.JSONP({
            url: "http://github.com/api/v2/json/repos/show/" + this.username,
            onRequest: this.fireEvent("request"),
            onComplete: function(response){
                var repos = response.repositories;
                repos = repos.sort(function(p1, p2){
                    p1 = (Date.parse(p1.pushed_at) || Date.parse(p1.created_at)).getTime();
                    p2 = (Date.parse(p2.pushed_at) || Date.parse(p2.created_at)).getTime();
                    return p2 - p1;
                });
                repos.each(function(b){
                    this.templates.push((new Element("li", {
                        html: '<h4><a href="' + b.url + '" target="_blank">' + b.name + "</a></h4>" + b.description + "<br /><span>Aktualisiert am " + (Date.parse(b.pushed_at) || Date.parse(b.created_at)).format("%d.%m.%Y") + "</span>" // Date.parse(b.pushed_at).format("%d.%m.%Y um %H:%m") + " Uhr</span>"
                    })).inject(this.container).fade("hide"));
                },
                this);
                this.fireEvent("data", [response]);
                this.fadeNextIn();
            }.bind(this)
        })).send();
        return this;
    },
    fadeNextIn: function(){
        if(this.templatesShown == this.templates.length) this.fireEvent("complete");
        if (!this.templates[this.templatesShown] || this.fadingIn) return this;
        this.fadingIn = true;
        this.templates[Math.max(this.templatesShown - 1, 0)].get("tween").removeEvent("complete", this.boundFadeComplete);
        this.templates[this.templatesShown].set("tween", {
            duration: 200
        });
        this.templates[this.templatesShown].get("tween").addEvent("complete", this.boundFadeComplete);
        this.templates[this.templatesShown].fade("in");
    },
    fadeComplete: function(){
        this.templatesShown++;
        this.fadingIn = false;
        this.scrollParent.setStyle('height', this.scrollParent.scrollHeight);
        this.fadeNextIn();
    }
});