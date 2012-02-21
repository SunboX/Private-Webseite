var ScrollBar = new Class({

    Implements: [Events, Options],

	options: {
		maxThumbSize: 15,
		wheel: 8
	},

	initialize: function(main, content, scrollbar, options){
		this.setOptions(options);
		
		this.main = $(main);
		this.content = $(content);				

		this.vScrollbar = $(scrollbar);					

		this.vTrack = new Element('div', {
			'class': 'vTrack'
		}).injectInside(this.vScrollbar);
			
		this.vThumb = new Element('div', {
			'class': 'vThumb'
		}).injectInside(this.vTrack);		
		
		this.bound = {
			'vStart': this.vStart.bind(this),				
			'end': this.end.bind(this),
			'vDrag': this.vDrag.bind(this),			
			'wheel': this.wheel.bind(this),
			'vPage': this.vPage.bind(this)			
		};

		this.vPosition = {};			
		this.vMouse = {};		
		this.update();
		this.attach();
	},

	update: function(){
		
		this.main.setStyle('height', this.content.offsetHeight + this.hScrollOffset);
		this.vTrack.setStyle('height', this.content.offsetHeight);
					
		this.main.setStyle('width', this.content.offsetWidth + 15);
		
		// Remove and replace vertical scrollbar			
		if (this.content.scrollHeight <= this.main.offsetHeight) {
			this.vScrollbar.setStyle('display', 'none');	
			this.content.setStyle('width', this.content.offsetWidth + 15);	
		} else {
			this.vScrollbar.setStyle('display', 'block');			
		}
		
		this.vContentSize = this.content.offsetHeight;
		this.vContentScrollSize = this.content.scrollHeight;
		this.vTrackSize = this.vTrack.offsetHeight;

		this.vContentRatio = this.vContentSize / this.vContentScrollSize;

		this.vThumbSize = (this.vTrackSize * this.vContentRatio).limit(this.options.maxThumbSize, this.vTrackSize) - 2;

		this.vScrollRatio = this.vContentScrollSize / this.vTrackSize;

		this.vThumb.setStyle('height', this.vThumbSize);

		this.vUpdateThumbFromContentScroll();
		this.vUpdateContentFromThumbPosition();
		
	},

	vUpdateContentFromThumbPosition: function(){
		this.content.scrollTop = this.vPosition.now * this.vScrollRatio;
	},	

	vUpdateThumbFromContentScroll: function(){
		this.vPosition.now = (this.content.scrollTop / this.vScrollRatio).limit(0, (this.vTrackSize - this.vThumbSize)) + 1;
		this.vThumb.setStyle('top', this.vPosition.now);
	},		

	attach: function(){
		this.vThumb.addEvent('mousedown', this.bound.vStart);
		if (this.options.wheel) this.content.addEvent('mousewheel', this.bound.wheel);
		this.vTrack.addEvent('mouseup', this.bound.vPage);					
	},
	
	wheel: function(event){
		this.content.scrollTop -= event.wheel * this.options.wheel;
		this.vUpdateThumbFromContentScroll();
		event.stop();
	},

	vPage: function(event){
		if (event.page.y > this.vThumb.getPosition().y) this.content.scrollTop += this.content.offsetHeight;
		else this.content.scrollTop -= this.content.offsetHeight;
		this.vUpdateThumbFromContentScroll();
		event.stop();
	},	

	vStart: function(event){
		this.vScrollbar.addClass('active');
		this.vMouse.start = event.page.y;
		this.vPosition.start = this.vThumb.getStyle('top').toInt();
		document.addEvent('mousemove', this.bound.vDrag);
		document.addEvent('mouseup', this.bound.end);
		this.vThumb.addEvent('mouseup', this.bound.end);
		event.stop();
	},
	
	end: function(event){
		this.vScrollbar.removeClass('active');
		document.removeEvent('mousemove', this.bound.vDrag);
		document.removeEvent('mousemove', this.bound.hDrag);			
		document.removeEvent('mouseup', this.bound.end);
		this.vThumb.removeEvent('mouseup', this.bound.end);		
		event.stop();
	},

	vDrag: function(event){
		this.vMouse.now = event.page.y;
		this.vPosition.now = (this.vPosition.start + (this.vMouse.now - this.vMouse.start)).limit(0, (this.vTrackSize - this.vThumbSize));
		this.vUpdateContentFromThumbPosition();
		this.vUpdateThumbFromContentScroll();
		event.stop();
	}
});
