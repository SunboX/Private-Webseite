var TwitterClient = new Class({
    Implements: [Options, Events],
    options: {
        count: 2,
        sinceID: 1,
        link: true,
        onRequest: $empty,
        onComplete: $empty
    },
    initialize: function(a, b){
        this.setOptions(b);
        this.container = $("twitter");
        this.scrollParent = this.container.getParent('.box-wrapper');
        this.info = {};
        this.username = a;
        this.templates = [];
        this.templatesShown = 0;
        this.fadingIn = false;
        this.boundFadeComplete = this.fadeComplete.bind(this);
    },
    retrieve: function(){ (new Request.JSONP({
            url: "http://twitter.com/statuses/user_timeline/" + this.username + ".json",
            method: 'get',
            data: {
                count: this.options.count,
                since_id: this.options.sinceID,
                include_rts: 'true'
            },
            onRequest: this.fireEvent("request"),
            onComplete: function(a){
                if(this.options.link)
                    a.each(function(b){
                        b.text = this.linkify(b.text);
                    }, this);
                a.each(function(b){
                    this.templates.push((new Element("li", {
                        html: b.text + "<br /><span>Am " + Date.parse(b.created_at).format("%d.%m.%Y um %H:%m") + " Uhr via " + b.source.replace("\\", "") + "</span>"
                    })).inject(this.container).fade("hide"));
                }, this);
                this.fadeNextIn();
                this.fireEvent("data", [a, a[0].user]);
            }.bind(this)
        })).send();
        return this;
    },
    fadeNextIn: function(){
        if(this.templatesShown == this.templates.length)
            this.fireEvent("complete");
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
    },
    linkify: function(a){
        return a.replace(/(https?:\/\/\S+)/gi, '<a href="$1">$1</a>').replace(/(^|\s)@(\w+)/g, '$1<a href="http://twitter.com/$2">@$2</a>').replace(/(^|\s)#(\w+)/g, '$1<a href="http://search.twitter.com/search?q=%23$2">#$2</a>');
    }
});