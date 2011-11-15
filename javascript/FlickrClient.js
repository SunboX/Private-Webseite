var FlickrClient = new Class({
    Implements: [Options, Events],
    options: {
        apikey: "48934104da09a4d7a8895cfae5c17ab4",
        user_id: "24939499@N07",
        photoTmpl: new Element("div")
    },
    initialize: function(a, b){
        this.toElement = a;
        this.container = $("flickr");
        this.scrollParent = this.container.getParent('.box-wrapper');
        this.setOptions(b);
        this.dim = {};
        this.fetchingList = false;
        this.index = this.photosLoaded = 0;
        this.pagesTotal = 1;
        this.photosTotal = 0;
        this.dim.photoSetDx = 0;
        this.dim.photo = {
            x: 20
        };
        this.imagesPerReq = 5;
        this.templates = [];
        this.templatesShown = 0;
        this.fadingIn = false;
        this.boundFadeComplete = this.fadeComplete.bind(this);
        this.fetchList()
    },
    checkList: function(){
        this.photosLoaded + this.index < 80 ? this.fetchList((this.photosLoaded / this.imagesPerReq).toInt() + 1) : this.fireEvent.delay(1E3, this, ["complete"])
    },
    fetchList: function(a){
        a = a || 1;
        if (! (a > this.pagesTotal || this.fetchingList)){
            this.fetchingList = true;
            if (this.isOwner()) this.req = (new Request.JSONP({
                url: "http://api.flickr.com/services/rest/",
                data: {
                    format: "json",
                    method: "flickr.photos.search",
                    api_key: this.options.apikey,
                    user_id: this.options.user_id,
                    per_page: this.imagesPerReq,
                    page: a
                },
                callbackKey: "jsoncallback",
                onComplete: this.showList.bind(this)
            })).send()
        }
    },
    showList: function(a){
        this.fetchingList = false;
        if (a.stat == "ok"){
            this.pagesTotal = a.photos.pages.toInt();
            this.photosTotal = a.photos.total.toInt();
            a.photos.photo.each(function(b){
                this.photosLoaded++;
                var c = this.options.photoTmpl.clone().inject(this.toElement).fade("hide");
                new Asset.image("http://farm" + b.farm + ".static.flickr.com/" + b.server + "/" + b.id + "_" + b.secret + "_s.jpg", {
                    onload: function(d){
                        d.inject(c);
                        this.isOwner() && d.store("photo",
                        b);
                        this.attachPhotoTmpl(c, d, b);
                        this.fadeNextIn()
                    }.bind(this)
                });
                this.templates.push(c)
            },
            this);
            this.checkList()
        } else alert(a.message)
    },
    attachPhotoTmpl: function(a, b, c){
        this.req = (new Request.JSONP({
            url: "http://api.flickr.com/services/rest/",
            data: {
                format: "json",
                method: "flickr.photos.getSizes",
                api_key: this.options.apikey,
                user_id: this.options.user_id,
                photo_id: c.id
            },
            callbackKey: "jsoncallback",
            onComplete: function(d){
                d.stat == "ok" ? (new Element("a", {
                    href: d.sizes.size[d.sizes.size.length - 1].source,
                    target: "_blank",
                    "class": "flickr"
                })).adopt(b).inject(a) : alert(d.message)
            }
        })).send();
    },
    fadeNextIn: function(){
        if (!this.templates[this.templatesShown] || this.fadingIn) return this;
        this.fadingIn = true;
        this.templates[Math.max(this.templatesShown - 1, 0)].get("tween").removeEvent("complete", this.boundFadeComplete);
        this.templates[this.templatesShown].set("tween", {
            duration: 150,
            transition: "quad:in"
        });
        this.templates[this.templatesShown].get("tween").addEvent("complete", this.boundFadeComplete);
        this.templates[this.templatesShown].fade("in")
    },
    fadeComplete: function(){
        this.templatesShown++;
        this.fadingIn = false;
        this.scrollParent.setStyle('height', this.scrollParent.scrollHeight);
        this.fadeNextIn()
    },
    isOwner: function(){
        return this.owner_id === this.participant_id
    }
});