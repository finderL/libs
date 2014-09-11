/**
@require base.js
*/
;jQuery.extend({
	mask : {
		config : {
			opacity : 0.5,
			bgClassName : 'js-mask-background',
			contentClassName :'js-mask-content',
			widthClass : ' js-mask-wrap',
			color : '#000',
			ContainerBgColor : '#fff',
			currentIndex : [],
			onkeydown : function(event){
				if (event.keyCode == 27){
					$.mask.close();
				}
			}
		},
		show : function(options){
			var _mask = this;
			var zindex = $.page.getPopZindex().toString();
			_mask.config.currentIndex.push(zindex);
			var _cfg = {
				content : (options && options.content) ? options.content : null,
				ContainerBgColor : (options && options.bgColor != undefined) ? options.bgColor : "#fff",
				width : (options && options.width) ? options.width : undefined,
				callback : (options && options.callback) ? options.callback : null,
				opacity : (options && options.opacity !== undefined) ? options.opacity :_mask.config.opacity ,
				position : zindex,
				bgClassName : _mask.config.bgClassName,
				contentClassName : _mask.config.contentClassName,
				color : _mask.config.color
			};
			if (options && typeof options.content == 'object'){
				if (options.content instanceof jQuery){
					_cfg.content = options.content;
				} else {
					for (var i in options.content){
						_cfg[i] = options.content[i];
					}
				}
			}else if(options && typeof options.content == 'string'){
				_cfg.content = options.content;
			}
			var html = '' ;
			if (typeof _cfg.content == 'string'){
				html = _cfg.content;
			} else {
				html = $(_cfg.content).html();
			}
			var bgObj = $("<div>").css({
					"position": "absolute",
					"top": "0",
					"left": "0",
					"width": "100%",
					"height": $(document).outerHeight(true),
					"background": _cfg.color,
					"display": "none",
					"overflow": "hidden",
					"z-index": _cfg.position,
					"opacity": _cfg.opacity
				}).addClass(_cfg.bgClassName).attr('id',_cfg.bgClassName + '_' + zindex);
			bgObj.html("<iframe src='about:blank' frameborder='0' scrolling='no' width='100%' height='9999' style='opacity:0;filter:alpha(opacity=0);'></iframe>");
			if( (options != undefined) &&  (options.content != undefined) ){
				var contentObj = $("<div>").attr('id',_cfg.contentClassName + '_' + zindex).addClass(_cfg.widthClass).addClass($(options.content).attr('class')).css({"position":"absolute","background":_cfg.ContainerBgColor}).hide().append(html);
				var popObj = bgObj.add(contentObj);
			}else{
				var popObj = bgObj;
			}
			popObj.appendTo("body");
			popObj.show(); 
		
			if( (options != undefined) &&  (options.content != undefined) ){
				if( !contentObj.width() ){
					contentObj.css({'width':contentObj.children().width()+'px'});
				}
				if( !contentObj.height() ){
					contentObj.css({'height':contentObj.children().height()+'px'});
				}
				if(_cfg.width){
					contentObj.css({'width':_cfg.width+'px'});
				}
				var pos = $.page.getPosition({obj:contentObj});
				if( (options != undefined) &&  (options.content != undefined) && contentObj.children().hasClass($(options.content).attr('class')) ){
					if( contentObj.children().height() >= $(window).height()){
						pos.y = (document.body.scrollHeight ? $(window).scrollTop() : 0);
					}
				}
				contentObj.css({
					'z-index' : zindex,
					'left' : pos.x,
					'top' : pos.y
				});
			}
			popObj.fadeIn('fast',function(){
				if (_cfg.callback){
					_cfg.callback(zindex);
				}
			});
			$(document).on('keydown',_mask.config.onkeydown);
			return _cfg.contentClassName + '_' + zindex;
		},
		close : function(index,callback){
			var _mask = this;
			var _index = null;
			var _callback = null;
			_index = _mask.config.currentIndex.pop();
			var popObj = $('#' + _mask.config.bgClassName + '_' + _index).add($('#' + _mask.config.contentClassName + '_' + _index));
			popObj.fadeOut('fast',function(){
				$(this).remove();
				});
			$(document).off('keydown',_mask.config.onkeydown);
			if (_callback) {
				_callback();
			}
		}
	}
});
