/*
    	MIT-style license
 @author		Harald Kirschner <mail [at] digitarald.de>
 @copyright	Author
*/
var ReMooz = new Class({
    Implements: [Events, Options, Chain],
    options: {
        link: null,
        type: "image",
        container: null,
        className: null,
        centered: false,
        dragging: true,
        closeOnClick: true,
        resize: true,
        margin: 20,
        resizeFactor: 0.95,
        resizeLimit: false,
        fixedSize: false,
        cutOut: true,
        addClick: true,
        opacityLoad: 0.6,
        opacityResize: 1,
        opacityTitle: 0.9,
        resizeOptions: {},
        fxOptions: {},
        closer: true,
        parse: false,
        parseSecure: false,
        temporary: false,
        onBuild: $empty,
        onLoad: $empty,
        onOpen: $empty,
        onOpenEnd: $empty,
        onClose: $empty,
        onCloseEnd: $empty,
        generateTitle: function (a) {
            a = a.get("title");
            if (!a) return false;
            a = a.split(" :: ");
            var b = new Element("h6", {
                html: a[0]
            });
            return a[1] ? [b, new Element("p", {
                html: a[1]
            })] : b
        }
    },
    initialize: function (a, b) {
        this.element = $(a);
        this.setOptions(b);
        if (this.options.parse) {
            var c = this.element.getProperty(this.options.parse);
            if (c && (c = JSON.decode(c, this.options.parseSecure))) this.setOptions(c)
        }
        this.origin = ((c = this.options.origin) ? $(c) || this.element.getElement(c) : null) || this.element;
        this.link = this.options.link || this.element.get("href") || this.element.get("src");
        this.container = $(this.options.container) || this.element.getDocument();
        this.bound = {
            click: function () {
                this.open.delay(1, this);
                return false
            }.bind(this),
            close: this.close.bind(this),
            dragClose: function (d) {
                d.rightClick || this.close()
            }.bind(this)
        };
        this.options.addClick && this.bindToElement()
    },
    destroy: function () {
        this.box && this.box.destroy();
        this.box = this.tweens = this.body = this.content = null
    },
    bindToElement: function (a) {
        ($(a) || this.element).addClass("remooz-element").addEvent("click", this.bound.click);
        return this
    },
    getOriginCoordinates: function () {
        var a = this.origin.getCoordinates();
        delete a.right;
        delete a.bottom;
        return a
    },
    open: function (a) {
        if (this.opened) return a ? this.close() : this;
        this.opened = this.loading = true;
        this.box || this.build();
        this.coords = this.getOriginCoordinates();
        this.coords.opacity = this.options.opacityLoad;
        this.coords.display = "";
        this.tweens.box.set(this.coords);
        this.box.addClass("remooz-loading");
        ReMooz.open(this.fireEvent("onLoad"));
        this["open" + this.options.type.capitalize()]();
        return this
    },
    finishOpen: function () {
        this.tweens.fade.start(0, 1);
        this.drag.attach();
        this.fireEvent("onOpenEnd").callChain()
    },
    close: function () {
        if (!this.opened) return this;
        this.opened = false;
        ReMooz.close(this.fireEvent("onClose"));
        if (this.loading) {
            this.box.setStyle("display", "none");
            return this
        }
        this.drag.detach();
        this.tweens.fade.cancel().set(0).fireEvent("onComplete");
        this.tweens.box.timer && this.tweens.box.clearChain();
        var a = this.getOriginCoordinates();
        if (this.options.opacityResize != 1) a.opacity = this.options.opacityResize;
        this.tweens.box.start(a).chain(this.closeEnd.bind(this));
        return this
    },
    closeEnd: function () {
        this.options.cutOut && this.element.setStyle("visibility", "visible");
        this.box.setStyle("display", "none");
        this.fireEvent("onCloseEnd").callChain();
        this.options.temporary && this.destroy()
    },
    openImage: function () {
        var a = new Image;
        a.onload = a.onabort = a.onerror = function (b) {
            this.loading = a.onload = a.onabort = a.onerror = null;
            if (!a.width || !this.opened) this.fireEvent("onError").close();
            else {
                var c = {
                    x: a.width,
                    y: a.height
                };
                if (this.content) a = null;
                else this.content = $(a).inject(this.body);
                this[this.options.resize ? "zoomRelativeTo" : "zoomTo"].create({
                    delay: a && b !== true ? 1 : null,
                    arguments: [c],
                    bind: this
                })()
            }
        }.bind(this);
        a.src = this.link;
        a && a.complete && a.onload && a.onload(true)
    },
    openElement: function () {
        if (this.content = this.content || $(this.link) || $E(this.link)) {
            this.content.inject(this.body);
            this.zoomTo({
                x: this.content.scrollWidth,
                y: this.content.scrollHeight
            })
        } else this.fireEvent("onError").close()
    },
    zoomRelativeTo: function (a) {
        var b = this.options.resizeLimit;
        if (!b) {
            b = this.container.getSize();
            b.x *= this.options.resizeFactor;
            b.y *= this.options.resizeFactor
        }
        for (var c = 2; c--;) if (a.x > b.x) {
            a.y *= b.x / a.x;
            a.x = b.x
        } else if (a.y > b.y) {
            a.x *= b.y / a.y;
            a.y = b.y
        }
        return this.zoomTo({
            x: a.x.toInt(),
            y: a.y.toInt()
        })
    },
    zoomTo: function (a) {
        a = this.options.fixedSize || a;
        var b = this.container.getSize(),
            c = this.container.getScroll();
        b = !this.options.centered ? {
            x: (this.coords.left + this.coords.width / 2 - a.x / 2).toInt().limit(c.x + this.options.margin, c.x + b.x - this.options.margin - a.x),
            y: (this.coords.top + this.coords.height / 2 - a.y / 2).toInt().limit(c.y + this.options.margin, c.y + b.y - this.options.margin - a.y)
        } : {
            x: c.x + ((b.x - a.x) / 2).toInt(),
            y: c.y + ((b.y - a.y) / 2).toInt()
        };
        this.options.cutOut && this.element.setStyle("visibility", "hidden");
        this.box.removeClass("remooz-loading");
        a = {
            left: b.x,
            top: b.y,
            width: a.x,
            height: a.y
        };
        if (this.options.opacityResize != 1) a.opacity = [this.options.opacityResize, 1];
        else this.box.set("opacity", 1);
        this.tweens.box.start(a).chain(this.finishOpen.bind(this));
        this.fireEvent("onOpen")
    },
    build: function () {
        this.addEvent("onBlur", function () {
            this.focused = false;
            this.box.removeClass("remooz-box-focus").setStyle("z-index", ReMooz.options.zIndex)
        }, true);
        this.addEvent("onFocus", function () {
            this.focused = true;
            this.box.addClass("remooz-box-focus").setStyle("z-index", ReMooz.options.zIndexFocus)
        }, true);
        var a = ["remooz-box", "remooz-type-" + this.options.type, "remooz-engine-" + Browser.Engine.name + Browser.Engine.version];
        this.options.className && a.push(this.options.className);
        this.box = new Element("div", {
            "class": a.join(" "),
            styles: {
                display: "none",
                top: 0,
                left: 0,
                zIndex: ReMooz.options.zIndex
            }
        });
        this.tweens = {
            box: new Fx.Morph(this.box, $merge({
                duration: 400,
                unit: "px",
                transition: Fx.Transitions.Quart.easeOut,
                chain: "cancel"
            }, this.options.resizeOptions)),
            fade: (new Fx.Tween(null, $merge({
                property: "opacity",
                duration: Browser.Engine.trident ? 0 : 300,
                chain: "cancel"
            }, this.options.fxOptions))).addEvents({
                onComplete: function () {
                    this.element.get("opacity") || this.element.setStyle("display", "none")
                },
                onStart: function () {
                    this.element.get("opacity") || this.element.setStyle("display", "")
                }
            })
        };
        this.tweens.fade.element = $$();
        this.options.closer && this.tweens.fade.element.push((new Element("a", {
            "class": "remooz-btn-close",
            events: {
                click: this.bound.close
            }
        })).inject(this.box));
        this.body = (new Element("div", {
            "class": "remooz-body"
        })).inject(this.box);
        if (a = this.options.title || this.options.generateTitle.call(this, this.element)) {
            a = (new Element("div", {
                "class": "remooz-title"
            })).adopt(new Element("div", {
                "class": "remooz-title-bg",
                opacity: this.options.opacityTitle
            }), (new Element("div", {
                "class": "remooz-title-content"
            })).adopt(a)).inject(this.box);
            this.tweens.fade.element.push(a)
        }
        this.tweens.fade.set(0).fireEvent("onComplete");
        this.drag = new Drag.Move(this.box, {
            snap: 15,
            preventDefault: true,
            onBeforeStart: function () {
                if (!this.focused && !this.loading) ReMooz.focus(this);
                else if (this.loading || this.options.closeOnClick) this.box.addEvent("mouseup", this.bound.dragClose)
            }.bind(this),
            onSnap: function () {
                this.box.removeEvent("mouseup", this.bound.dragClose);
                this.options.dragging ? this.box.addClass("remooz-box-dragging") : this.drag.stop()
            }.bind(this),
            onComplete: function () {
                this.box.removeClass("remooz-box-dragging")
            }.bind(this)
        });
        this.drag.detach();
        this.fireEvent("onBuild", this.box, this.element);
        this.box.inject(this.element.getDocument().body)
    }
});
ReMooz.factory = function (a) {
    return $extend(this, a)
};
ReMooz.factory(new Options).factory({
    options: {
        zIndex: 41,
        zIndexFocus: 42,
        query: "a.remooz",
        modal: false
    },
    assign: function (a, b) {
        return $$(a).map(function (c) {
            return new ReMooz(c, b)
        }, this)
    },
    stack: [],
    open: function (a) {
        var b = this.stack.getLast();
        this.focus(a);
        b && this.options.modal && b.close()
    },
    close: function (a) {
        var b = this.stack.length - 1;
        b > 1 && this.stack[b] == a && this.focus(this.stack[b - 1]);
        this.stack.erase(a)
    },
    focus: function (a) {
        var b = this.stack.getLast();
        a.fireEvent("onFocus", [a]);
        if (b != a) {
            b && b.fireEvent("onBlur", [b]);
            this.stack.erase(a).push(a)
        }
    }
});