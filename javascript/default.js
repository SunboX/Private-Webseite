window.addEvent("domready", function(){
    (new TwitterClient("sonnenkiste", {
        count: 30,
        onComplete: function(){
            new ScrollBar("twitter-scrollbox", "twitter-scrollbar", "twitter-knob", {
                mode: "vertical"
            });
        }
    })).retrieve();
    (new GithubClient("SunboX", {
        count: 30,
        onComplete: function(){
            new ScrollBar("github-scrollbox", "github-scrollbar", "github-knob", {
                mode: "vertical"
            });
        }
    })).retrieve();
    new FlickrClient("flickr", {
        photoTmpl: new Element("li", {
            "class": "photo"
        }),
        onComplete: function(){
            new ScrollBar("flickr-scrollbox", "flickr-scrollbar", "flickr-knob", {
                mode: "vertical"
            });
            ReMooz.assign("a.flickr", {
                origin: "img",
                shadow: "onOpenEnd",
                resizeFactor: 0.8,
                cutOut: false,
                opacityResize: 0.4,
                dragging: false,
                centered: true
            });
        }
    });
    var a = $$("div.center .boxshadow")[0],
        b = $("imprint-container").fade("hide"),
        c = a.getChildren();
        a.adopt(b);
    var d = $("imprint-opener");
    c[0].get("tween").addEvent("complete", function(f){
        if (f.get("opacity") === 0){
            c.addClass("hidden");
            b.removeClass("hidden").fade("in");
        }
    });
    b.get("tween").addEvent("complete", function(f){
        if (f.get("opacity") === 0){
            b.addClass("hidden");
            c.removeClass("hidden").fade("in");
        }
    });
    d.addEvent("click", function(f){
        f.stop();
        d.fade("out");
        c.fade("out");
    });
    $("imprint-closer").addEvent("click", function(f){
        f.stop();
        d.fade("in");
        b.fade("out");
    });
});