;(function($){
	/**
	@require base.js,config.js,jquery.mask.js,jquery.cookie.js,jquery.popmsg.js
	@param options = {
		name 	: 	对象名称,
		max	 	: 	最多可选择数量，默认5
		lan 	: 	语言,默认cn
		close	: 	关闭回调方法
		show 	:	打开时回调方法
		resultShowCallback : 结果显示回调
		confirm : 	确认回调方法
		cancel 	: 	取消回调方法
		clear 	: 	清空回调方法
		value : 	默认值
					{
						value : val1,val2,
						text : txt1,txt2
					}
		trigger : 显示元素
	}
	*/
	function TypePicker(dom,options){
		var _config = {
			lan : 'cn',
			configText : {
				cn : ["行业","职业"],
				en : ["industry","profession"],
				enUpper : ["Industry","Profession"],
				enPlural : ["industries","categories"]
			},
			max : 5,
			lv : 0,
			value : {value:null,text:null},
			allowCheck : {
				4 : ',86101010,86111010,86121010,86131010,88101010,89101010,96101010,',
				5 : ',86101010,86111010,86121010,86131010,88101010,89101010,96101010,90101010,91101010,92101010,93101010,94101010,95101010,'
			},
			trigger : null
		};
		for (var i in options){
			_config[i] = options[i];
		}
		this._template = {
			selcontent : '<span><input class="js-typePicker-input" type="text" value="{text}"><input class="js-typePicker-value" type="hidden" name="{name}" value="{value}"/></span>',
			popcontent : '<div id="{id}" class="js-typelayer"><p class="js-layer-button">{btnConfirm}{btnClear}{btnCancel}</p><div class="js-layer-top"><p><strong>{title}</strong>{maxText}</p></div><div class="js-layer-main">{selected}{history}<div class="js-type-list"><ul>{section}</ul></div></div></div>',
			btnConfirm : '<button class="js-confirm">{btnConfirmText}</button>',
			btnClear : '<button class="js-clear">{btnClearText}</button>',
			btnCancel : '<button class="js-cancel">{btnCancelText}</button>',
			selected : '<p class="js-add-item js-selected"><strong>{selectedText}</strong></p>',
			history : '<p class="js-add-item js-history"><strong>{historyText}</strong></p>',
			itemGroup : '<div class="js-childNodes-layer"><ul>{items}</ul><span class="js-close icon-del"></span></div>',
			itemGroupMain : '<div class="js-childrenNodes-layer"><ul>{items}</ul></div>',
			item : '<li class="js-type-name {currentClass}" vid="{vid}" p="{pval}"><label for="{vid}" title="{name}"><input id="{vid}" title="{name}" type="checkbox" {disabled} {checked}/><em title="{name}">{name}</em></label></li>',
			itemMain : '<li class="{currentClass} {maxHeight} {bgClass} cl js-parent-ori" vid="{vid}" p="{pval}"><span title="{name}" class="js-head-name cl" id="{vid}"><em class="left" title="{name}">{name}</em>{arrow}</span>{childNodes}</li>',
			itemParent : '<li class="js-parent-name {currentClass}" vid="{vid}" p="{pval}"><label title="{name}" class="cl"><span class="js-icon icon-add"></span><em title="{name}">{name}</em></label></li>',
			itemTitle : '<li class="js-type-name js-title-name {currentClass}" vid="{vid}" p="{pval}"><label for="{vid}" title="{name}"><input title="{name}" id="{vid}" type="checkbox" {disabled} {checked}/><em title="{name}">{name}</em></label></li>',
			checkitem : '<li class="js-item cl" id="{id}"><span class="name">{name}</span><span class="icon-del ml5px"></span></li>',
			historyitem : '<li class="js-item" vid="{id}"><label for="{id}"><input id="{id}" type="checkbox" {checked} /><em title="{name}">{name}</em></label></li>'
		};
		this._language = {
			cn : {
				title : '请选择'+ _config.configText.cn[_config.type-1] +'：',
				selectedText : '已选择'+ _config.configText.cn[_config.type-1] +'：',
				btnConfirmText : '确定',
				btnClearText : '清空',
				btnCancelText : '取消',
				maxText : '最多可选择<em>' + _config.max + '</em>项',
				historyText : '已使用过：'
			},
			en : {
				title : 'Please select '+ _config.configText.en[_config.type-1] +'：',
				selectedText :  _config.configText.enUpper[_config.type-1] +' selected :',
				btnConfirmText : 'Confirm',
				btnClearText : 'Clear',
				btnCancelText : 'Cancel',
				historyText : 'Previous selection :',
				maxText : 'To select up to <em>' + _config.max + '</em> '+ _config.configText.enPlural[_config.type-1]
			}
		};

		this.id = $.page.getObjectId();

		this._showHistoryNum = 6;
		this._showMaxTitleProfession = 8;
		this._showMaxTitleProfessionHeight = 38;
		this._config = _config;
		this._dataType = this._config.configText.en[this._config.type-1];
		this._cookieName = 'js'+ this._dataType +'picker';
		this._objects = {};		//objText,objValue,objPop,objClear,objConfirm,objClear
		this._owner = dom;
		this.__hideChilds = true;
		this._data = null;
		this._dataP = {};
		this._dataTmp = {};
		this._Tmp = {};
		this._value = _config.value;
		this._selected = [];
		this._history = [];
		this._onpoping = false;
		this._created = false;

		this._init();
	}
	TypePicker.create = function(dom,options){
		if (dom.TypePicker){
			dom.TypePicker.reload(options);
		} else {
			dom.TypePicker = new TypePicker(dom,options);
		}
		return dom.TypePicker;
	};
	TypePicker._current = null;
	TypePicker.show = function(target){
		TypePicker._current = target;
		if( target._config.show ){
			target._config.show();
		}
	};
	TypePicker.close = function(event){
		if (TypePicker._current && event.keyCode == 27){
			TypePicker._current.close();
		}
		if( TypePicker._current._config.close ){
			TypePicker._current._config.close();
		}
	};
	TypePicker.prototype.open = function(){
		var _this = this;
		if( !_this._created || _this._config.trigger.is("select")){
			_this._createPopDiv();
			_this._bindEvent();
			_this._created = true;
		}
		$.mask.show();
		if( _this._created ){
			_this._objects.objPop.css("display","block");
			if( _this._history.length && _this._objects.objHistory.parent(".js-history").is(':hidden') ){
				_this._objects.objHistory.parent(".js-history").show();
			}
		}
		var pos = $.page.getPosition({
			obj : _this._objects.objPop
		});
		_this._objects.objPop.css({
			'z-index' : $.page.getPopZindex(),
			'left' : pos.x,
			'top' : pos.y,
			'display' : 'block'
		});
		TypePicker.show(_this);
		$(document).on('keydown',TypePicker.close);
	};
	TypePicker.prototype.close = function(){
		var _this = this;
		_this._objects.objPop.css("display","none");
		$.mask.close();
		if (_this._config.close){
			_this._config.close();
		}
		$(document).off('keydown',TypePicker.close);
	};
	TypePicker.prototype._init = function(){
		var _this = this;

		_this._createUI();

		var dataType = _this._dataType + '_' + _this._config.lan;
		$.page.getData(dataType,function(data){
			_this._data = data.data;
			_this._dataP = data.dict;
			_this._initHistory();
			_this._initSelected();
		});
	};
	TypePicker.prototype._initHistory = function(){
		var _this = this;
		if( _this._ExistHistoryDatas() ){
			var arrHistory = $.cookie(_this._cookieName).split(',');
			if( arrHistory > _this._showHistoryNum ){
				//  设置已经使用过地区数据显示个数
				var start = arrHistory.length -_this._showHistoryNum;
				arrHistory = arrHistory.slice(start, arrHistory.length);
			}
			_this._history = [];
			for (var i = 0; i < arrHistory.length; i++){
				if (_this._isAvailableValue(arrHistory[i])){
					_this._history.push(arrHistory[i]);
				}
			}
		}
	};
	TypePicker.prototype._initSelected = function(){
		var _this = this;
		if (_this._config.value && _this._config.value.value){
			var arr = _this._config.value.value.split(',');
			_this._selected = [];
			for (var i = 0; i < arr.length; i++){
				if (_this._isAvailableValue(arr[i])){
					_this._selected.push(arr[i]);
				}
			}
		}
	};
	TypePicker.prototype._resetSelected = function(){
		var _this = this;
		if(_this._objects.objTextShow.attr("text") && _this._objects.objTextShow.attr("code") && $.trim(_this._objects.objTextShow.attr("text")).length && $.trim(_this._objects.objTextShow.attr("code")).length){
				var text = $.trim(_this._objects.objTextShow.attr("text"));
				var code = $.trim(_this._objects.objTextShow.attr("code"));
				var datas = {};
				datas.value= code;
				datas.text = text;
				_this._config.value = datas;
				_this._selected = datas.value;
				_this._initSelected();
			}else{
				_this._config.value.value = "";
				_this._config.value.text = "";
				_this._selected = [];
				_this._initSelected();
			}
	};
	TypePicker.prototype._getHistoryDom = function(){
		var _this = this, htmlArrTmp = [], hisStr = '';
		_this._initHistory();
		if( _this._history.length > 0 ){
			if( _this._history.length > _this._showHistoryNum ){
				//  设置已经使用过数据显示个数
				var start = _this._history.length -_this._showHistoryNum;
				_this._history = _this._history.slice(start, _this._history.length);
			}
			for( var k = (_this._history.length - 1); k >= 0 ; k-- ){
				var d = _this._dataP[_this._history[k]];
				var params = {id:_this.id + '_h-' + d.v, checked:'',name:d.n};
				if( _this._selected.length ){
					for(var j = 0; j < _this._selected.length; j++){
						if( _this._history[k] == _this._selected[j] ){
							params.checked = 'checked = true';
							break;
						}
					}
					htmlArrTmp.push($.page.regReplace(this._template.historyitem,params));
				}else{
					htmlArrTmp.push($.page.regReplace(this._template.historyitem,params));
				}
			}
			hisStr = htmlArrTmp.join('');
		}else{
			hisStr = '';
		}
		return hisStr;
	};
	TypePicker.prototype._getSelectedDom = function(){
		var _this = this, selStr = '', nameV = '', htmlArrTmp = [];
		if( _this._selected.length ){
			for (var j = 0; j < _this._selected.length; j++){
				nameV = _this._dataP[_this._selected[j]].n;
	  		htmlArrTmp.push($.page.regReplace(this._template.checkitem,{id:_this.id + '_s-' + _this._selected[j],name:nameV}));
			}
		}
		selStr = htmlArrTmp.join('');
		return selStr;
	};
	TypePicker.prototype._isAvailableValue = function(val){
		var _this = this;
		var d = _this._dataP[val];
		var single = !d.p.length && !d.c;
		var available = false;
		if (d){
			switch (_this._config.lv) {
				case 0:
					available = true;
					break;
				case 1 :
					if ( d.p.length || single ){
						available = true;
					}
					break;
				case 2 :
					if (!d.c){
						available = true;
					}
					break;
				case 3 :
					available = true;
					var parents = _this._getParents(val);
					for (var x in parents){
						if (parents[x].length >= 2){
							available = false;
						}
					}
					break;
				case 4 :
				case 5 :
					if (d.p.length){
						available = true;
					}
					else if ( _this._isSpecialValue(val,_this._config.allowCheck[_this._config.lv]) || !d.c){
						available = true;
					}
					break;
			}
		}
		return available;
	};
	TypePicker.prototype._createUI = function(){
		var _this = this;
		var data = this._language[this._config.lan];
		data['id'] = this.id;
		data['name'] = this._config.name;
		data['text'] = this._value.text;
		data['value'] = this._value.value;

		var objOwner = $(this._owner);
		if( _this._config.trigger == null ){
			var objInput = $($.page.regReplace(this._template.selcontent,data));
			var objText = $('.js-typePicker-input',objInput);
			var objValue = $('.js-typePicker-value',objInput);
			objOwner.append(objInput);
			this._objects.objText = objText;
			this._objects.objValue = objValue;
		}else if(_this._config.trigger.is("select")){
			_this._objects.objText =  $(_this._owner);
			_this._objects.objTextShow = _this._config.trigger;
		}else{
			_this._objects.objText =  $(_this._owner);
			_this._objects.objTextShow = _this._config.trigger;
			_this._objects.objTextShow.css('white-space','nowrap');
			if(_this._config.value.text ){
				if( _this._objects.objTextShow.is('input') ){
					_this._objects.objTextShow.val(_this._config.value.text);
				}else{
					_this._objects.objTextShow.text('');
					_this._objects.objTextShow.text(_this._config.value.text);
				}
			}
			if(_this._config.value.value ){
				_this._objects.objTextShow.attr('code',_this._config.value.value);
			}
		}

		_this._objects.objText.click(function(){
			_this._resetSelected();
			if (!_this._onpoping){
				_this._onpoping = true;
				(function openPicker(){
					if (_this._data && _this._dataP){
						_this.open();
						_this._onpoping = false;
					} else {
						setTimeout(openPicker,50);
					}
				})();
			}
		});
	};
	TypePicker.prototype.__indexOfInArr = function(item, arr){
		if( arr.length > 0 ){
			for( var i = 0; i < arr.length; i++ ){
				if( arr[i] == item ){
					return i;
					break;
				}
			}
			return -1;
		}else{
			return -1;
		}
	};
	TypePicker.prototype.__removeItemInArr = function(item, arr){
		var index = this.__indexOfInArr(item, arr);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
	};
	TypePicker.prototype._ExistHistoryDatas = function(){
		var _this = this;
		var historyDatas = $.cookie(_this._cookieName);
		var reg = /^[0-9]{4}/g;
		var isString = typeof historyDatas == 'string';
		return (isString && reg.test(historyDatas));
	};
	TypePicker.prototype._createPopDiv = function(){
		var _this = this, objPop;
		var data = this._language[this._config.lan];
		data['btnConfirm'] = $.page.regReplace(this._template.btnConfirm,data);
		data['btnClear'] = $.page.regReplace(this._template.btnClear,data);
		data['btnCancel'] = $.page.regReplace(this._template.btnCancel,data);
		data['selected'] = $.page.regReplace(this._template.selected,data);
		data['history'] = $.page.regReplace(this._template.history,data);
		var arr = [], htmlVTmp = [], htmlHTmp = [], htmlS, htmlH, nameV, nameH, num=0;

		for (var i in this._data){
			num++;
			var vid = this.id + '_v-' + i,
					checked = '',
					currentClass = '',
					bgClass = '',
					isInSelected = (_this.__indexOfInArr(i, _this._selected) > -1) ;
			if (isInSelected){
				checked = 'checked';
				currentClass = 'js-type-current';
			}
			if( num%2 == 1 ){
				currentClass = 'js-bg';
			}
			if( this._data[i].c ){
				var count = 0;
				var childNodesInfo = _this._showChild(this.id + '_v-' + i, true, count);
			}else{
				var childNodesInfo = null;
			}
  		var d = {
				vid : vid,
				name : this._data[i].n,
				disabled : _this._getDisabledText(0, i, this._data[i].c),
				checked : checked,
				currentClass : currentClass,
				bgClass : bgClass,
				childNodes : childNodesInfo.objChild[0].outerHTML
			};
			if( (this._config.type == 2) && childNodesInfo && (childNodesInfo.num > _this._showMaxTitleProfession) ){
				d.arrow = '<span class="icon-down3 js-down-arrow"></span>',
				d.maxHeight = 'js-height-limit'
			}
			arr.push($.page.regReplace(this._template.itemMain,d));
		}
		if( _this._selected.length > 0){
			htmlS = _this._getSelectedDom();
		}else{
			htmlS = '';
		}

		data['section'] = arr.join('');
		objPop = $($.page.regReplace(this._template.popcontent,data)).css({position:'absolute',display:'none'});

		_this._objects.objPop = objPop;
		_this._objects.objPop.appendTo('body');
		_this._objects.objPop.find('.js-selected').append('<ul class=""></ul>');
		_this._objects.objPop.find('.js-history').append('<ul class=""></ul>');
		_this._objects.objSelected = _this._objects.objPop.find('.js-selected ul');
		_this._objects.objHistory = _this._objects.objPop.find('.js-history ul');
		_this._objects.objSelected.html("");
		_this._objects.objSelected.append(htmlS);

		if( _this._history.length ){
			htmlH = _this._getHistoryDom();
			_this._objects.objHistory.html("");
			_this._objects.objHistory.append(htmlH);
		}else{
			_this._objects.objHistory.parent(".js-history").hide();
		}
	};
	TypePicker.prototype._bindEvent = function(){
		var _this = this;
		_this._objects.objConfirm = $('.js-confirm',_this._objects.objPop);
		_this._objects.objCancel = $('.js-cancel',_this._objects.objPop);
		_this._objects.objClear = $('.js-clear',_this._objects.objPop);

		_this._objects.objConfirm.click(function(){
			var arrIdS = [], arrNameS = [], arrIdH = [], arrNameH = [], selectedIds, selectedNames,selectedIdsArr, selectedNamesArr, historyIds, historyNames, idTotal;
			if( _this._ExistHistoryDatas() ){
				var arrHistory = $.cookie(_this._cookieName).split(',');
				for( var i = 0; i < arrHistory.length; i++ ){
					arrIdH.push(arrHistory[i]);
					arrNameH.push(_this._dataP[arrHistory[i]].n);
				}
				historyIds = arrIdH.join(',');
				historyNames = arrNameH.join('，');
			}
			if( _this._selected.length ){
				for( var j = 0; j < _this._selected.length; j++ ){
					arrIdS.push(_this._selected[j]);
					arrNameS.push(_this._dataP[_this._selected[j]].n);
				}
				selectedIds = arrIdS.join(',');
				selectedNames = arrNameS.join('，');
				if( _this._ExistHistoryDatas() ){
					idTotal = arrIdH;
					for( var k = 0; k < arrIdS.length; k++ ){
						if( _this.__indexOfInArr(arrIdS[k], arrIdH) == -1 ){
							idTotal.push(arrIdS[k]);
						}
					}
					// 设置过期时间为半年
					$.cookie(_this._cookieName, idTotal.join(','),{ expires: 180, path: '/' });
				}else{
					$.cookie(_this._cookieName, selectedIds,{ expires: 180, path: '/' });
				}
			}

			if( _this._config.trigger == null ){
				_this._objects.objText.val(selectedNames);
				_this._objects.objValue.val(selectedIds);
			}else if( _this._config.trigger.is("select")){
				_this._objects.objTextShow.attr('code',(selectedIds == undefined ? '' : selectedIds));
				_this._objects.objTextShow.attr('text',(selectedNames == '' ? '' : selectedNames));
				if(_this._config.resultShowCallback){
					_this._config.resultShowCallback(_this,selectedIds,selectedNames);
				}
			}else{
				if( _this._objects.objTextShow.is('input') ){
					_this._objects.objTextShow.val(selectedNames == '' ? '' : selectedNames);
					_this._objects.objTextShow.css({'color':'#000'});
				}else{
					_this._objects.objTextShow.text('');
					_this._objects.objTextShow.text(selectedNames == '' ? '' : selectedNames);
				}
				_this._objects.objTextShow.attr('code',(selectedIds ==undefined ? '' : selectedIds));
			}
			_this._value = {value:selectedIds,text:selectedNames};
			_this._initHistory();
			if( _this._history.length > 0){
				var htmlH = _this._getHistoryDom();
				_this._objects.objHistory.html('');
				_this._objects.objHistory.html(htmlH);
			}
			if( _this._config.confirm ){
				_this._config.confirm();
			}
			_this.close();
		});
		_this._objects.objCancel.click(function(){
			var strV = _this._config.value.value, arrV = [], nameV = '', htmlVTmp = [];
			if( _this._selected.length ){
				while(_this._selected.length){
					_this._changeSelectByValue( _this._selected[0], false);
				}
			}
			if( strV ){
				arrV = strV.split(',');
				for(var i = 0; i < arrV.length; i++ ){
					_this._changeSelectByValue(arrV[i], true);
				}
			}
			if( _this._config.trigger == null ){
					_this._config.value.text = (_this._objects.objText.val() != '' ? _this._objects.objText.val() : null);
					_this._config.value.value = (_this._objects.objValue.val() != '' ? _this._objects.objValue.val() : null);
			}else{
				if( _this._objects.objTextShow.is('input')){
					_this._config.value.text = (_this._objects.objTextShow.val() != '' ? _this._objects.objTextShow.val() : null);
				}else{
					_this._config.value.text = (_this._objects.objTextShow.text() != '' ? _this._objects.objTextShow.text() : null);
				}
				_this._config.value.value = ((_this._objects.objTextShow.attr('code') &&_this._objects.objTextShow.attr('code') != '') ? _this._objects.objTextShow.attr('code') : null);
			}
			_this._value = {value:_this._config.value.value,text:_this._config.value.text};
			_this._objects.objSelected.html('');
			_this._initHistory();
			_this._initSelected();
			if( _this._selected.length ){
				var htmlS = _this._getSelectedDom();
			}else{
				var htmlS = '';
			}
			if( _this._history.length > 0){
				var htmlH = _this._getHistoryDom();
			}else{
				var htmlH = '';
			}
			_this._objects.objSelected.html('');
			_this._objects.objSelected.html(htmlS);
			_this._objects.objHistory.html('');
			_this._objects.objHistory.html(htmlH);
			if( _this._config.cancel ){
				_this._config.cancel();
			}
			_this.close();
		});
		_this._objects.objClear.click(function(){
			var strV = _this._config.value.value, arrV;
			if( strV ){
				arrV = strV.split(',');
				for(var i = 0; i < arrV.length; i++ ){
					_this._changeSelectByValue(arrV[i], false);
				}
			}
			if( _this._history.length > _this._showHistoryNum ){
				//  设置已经使用过数据显示个数
				var start = _this._history.length -_this._showHistoryNum;
				_this._history = _this._history.slice(start, _this._history.length);
			}
			//  清除已经使用过选项
			if( _this._history.length ){
				for( var j = 0; j < _this._history.length; j++ ){
					if( $('#' + _this.id + '_h-' +_this._history[j]).length ){
						$('#' + _this.id + '_h-' +_this._history[j])[0].checked = false;
					}
				}
			}
			if( _this._selected.length ){
				while( _this._selected.length ){
					_this._changeSelectByValue( _this._selected[0], false);
				}
			}
			_this._objects.objSelected.html('');
			_this._value = {value:null,text:null};
			if (_this._config.clear){
				_this._config.clear();
			}
		});
		var timeout = null;
		_this._objects.objPop.delegate('.js-type-name','click',function(event){
			var obj = $(this);
			var target = $(event.target);
			if ( event.type == 'click' && $(event.target).is("input") ){
				_this._checkByItem(target);
				event.stopPropagation();
			}
		});
		_this._objects.objPop.delegate('.js-height-limit','mouseenter mouseleave',function(event){
			var obj = $(this);
			var target = $(event.target);
			if ( event.type == 'mouseenter'){
				obj.addClass("js-max-hover");
				obj.find(".js-down-arrow").removeClass("icon-down3");
				obj.find(".js-down-arrow").addClass("icon-up3");
			}
			if ( event.type == 'mouseleave'){
				obj.removeClass("js-max-hover");
				obj.find(".js-down-arrow").removeClass("icon-up3");
				obj.find(".js-down-arrow").addClass("icon-down3");
			}
		});
		_this._objects.objPop.delegate('.js-parent-name','mouseleave click',function(event){
			var obj = $(this);
			var target = $(event.target);
			if (event.type == 'mouseleave'){
				if( obj.attr('c') ){
					obj.attr('c','hide');
				}
				_this._closeChild($(this));
			}else if ( event.type == 'click' && _this.__hideChilds){
				_this.__hideChilds = false;
				var parentsNum = $(this).children(".js-childNodes-layer").length;
				var myInfo = _this._getItemInfo(obj);
				if (timeout){
					clearTimeout(timeout);
				}
				timeout = setTimeout(function(){
					if( _this._dataP[myInfo.val].c ){
						var objChildInfo = _this._showChild(obj);
						var objChild = objChildInfo.objChild;
						var itemInfo = objChildInfo.itemInfo;
					}
					if( parentsNum === 0 ){
							if( _this._dataP[myInfo.val].c ){
								if (!obj.attr('c')){
									objChild.appendTo(obj);
								}
								_this._renderChild(obj, objChild, itemInfo);
							}
					}else{
						var objChildPanel = obj.children('.js-childNodes-layer');
						if(obj.attr('c') == "1"){
							_this._closeChild($(this));
							obj.attr('c') == "hide";
						}else if( obj.attr('c') == "hide"){
							//   显示子元素
							_this._renderChild(obj, objChildPanel, itemInfo);
							obj.attr('c') == "1";
						}
					}
				}, 300);
				event.stopPropagation();
			}
		});
		_this._objects.objPop.delegate('.js-close','click',function(event){
			_this._closeChild($(this).parent().parent());
			event.stopPropagation();
		});
		_this._objects.objSelected.delegate('.js-item','click',function(event){
			var obj = $(this);
			var id = obj.attr('id');
			var val = id.split('s-')[1];
			_this._changeSelectByValue(val, false);
		});
		_this._objects.objHistory.delegate('.js-item','click',function(event){
			var target = $(event.target);
			var checkbox = $(this).find('input');
			var id = checkbox.attr('id');
			var val = id.split('h-')[1];
			if (target.is('input')){
				if( _this._selectedLimitAssert(checkbox) ){
					_this._changeSelectByValue(val, checkbox[0].checked);
				}
			}
			event.stopPropagation();
		});
	};
	TypePicker.prototype._getIDArrByVal = function(val){
		var _this = this, arr, str;
		var arrParents = _this._getParents(val);
		if( arrParents.length == 0 ){
			str = '#' + _this.id + '_v-' + val;
			arr.push(str);
		}else{
			for (var i in arrParents){
				arrParents[i].push(val);
				str = '#' + _this.id + '_v-' + arrParents[i].join('_');
				arr.push(str);
			}
		}
		return arr;
	};
	TypePicker.prototype._changeSelectByValue = function(val, isAdd){
		var _this = this;
		var arrParents = _this._getParents(val);
		if( isAdd ){
			_this._check(val);
			if( _this.__indexOfInArr(val, _this._selected) == -1){
				_this._selected.push(val);
			}
		}else{
			_this._uncheck(val);
			if( _this.__indexOfInArr(val, _this._selected) > -1){
				_this.__removeItemInArr(val, _this._selected);
			}
		}
		if( _this.__indexOfInArr(val, _this._selected) > -1 ){
			_this._toggleSelectInHistory(val, isAdd);
		}
		if( arrParents.length == 0 ){
			obj = $('#' + _this.id + '_v-' + val).parent('label').parent('li');
			if( obj.length > 0 ){
				var itemInfo = _this._getItemInfo(obj);
				var inputTarget = obj.children('label').children('input');
				_this._toggleSelectBgStatus(itemInfo, isAdd);
				inputTarget[0].checked = isAdd;
			}
		}else{
			for (var i in arrParents){
				arrParents[i].push(val);
				obj = $('#' + _this.id + '_v-' + arrParents[i].join('_'));
				var arr = arrParents[i];
				//  找元素
				for( var j = 1; j <= arr.length; j++){
					var str1 = arr.slice(0, j).join('_');
					var itemP = $('#' + _this.id + '_v-' + str1).parent('label').parent('li');
					if( itemP.length > 0){
						var itemInfo = _this._getItemInfo(itemP);
						_this._toggleSelectBgStatus(itemInfo, isAdd);
					}
				}
			}
		}
	};
	TypePicker.prototype._closeChild = function(obj){
		obj.css('z-index','');
		obj.parents("li").css('z-index','');
		obj.removeClass('js-type-hover');
		obj.find('.js-childNodes-layer').css({display:'none'});
		obj.find(".js-icon").removeClass("icon-minus-rect").addClass("icon-add");
		this.__hideChilds = true;	
	};
	TypePicker.prototype._showChild = function(obj, showMainPanel, num){
		
		var _this = this;
		var	objChild = null;
		if( typeof obj == 'string'){
			var	parentVid = obj;
			var itemInfo = _this._getItemInfoByValue(obj);
		}else{
			var	parentVid = obj.attr('vid');
			var itemInfo = _this._getItemInfo(obj);
			obj.css('z-index','10');
			obj.parents('.js-parent-ori').css('z-index','2');
			obj.addClass('js-type-hover');
		}
		
		var childData = _this._getDataChild(itemInfo),
			arr = [], strV = _this._config.value.value, arrV;
		if (!childData){
			return;
		}
		if( _this._dataP[i].c && !showMainPanel){
			arr.push(_this._dataTmp[itemInfo.val]);
		}
		for (var i in childData){
			var vid = parentVid + '_' + i,
				checked = '',
				currentClass = '';
				num++;
			if ( _this.__indexOfInArr(i, _this._selected) > -1 ){
				checked = 'checked';
				currentClass = 'js-type-current';
			}else if( strV ){
				arrV = strV.split(',');
				for( var j = 0; j < arrV.length; j++){
					if( i == arrV[j] ){
						checked = 'checked';
						currentClass = 'js-type-current';
					}
				}
			}
	  	var d = {
				vid : vid,
				name : childData[i].n,
				disabled : _this._getDisabledText(itemInfo.layer,i,childData[i].c),
				checked : checked,
				currentClass : currentClass
			};
			if( _this._dataP[i].c ){
				_this._dataTmp[i] = $.page.regReplace(this._template.itemTitle,d);
				arr.push($.page.regReplace(this._template.itemParent,d));
			}else{
				arr.push($.page.regReplace(this._template.item,d));
			}
		}
		if( showMainPanel ){
			objChild = $($.page.regReplace(this._template.itemGroupMain,{items:arr.join('')}));
		}else{
			objChild = $($.page.regReplace(this._template.itemGroup,{items:arr.join('')}));
		}
		return {objChild : objChild, itemInfo : itemInfo,num :num};
	};
	TypePicker.prototype._renderChild = function(obj, objChild, itemInfo){
		var objOffset = $('.js-type-list').offset();
		var limit = [objOffset.top,objOffset.left+obj.outerWidth(true),objOffset.top+obj.outerHeight(true),objOffset.left];
		var pos = $.page.getPosition({
			obj : objChild,
			relative : obj,
			xType : $.page.POSITION.RIGHT,
			yType : $.page.POSITION.BOTTOM,
			xMargin : -obj.outerWidth(true),
			limit : limit,
			reverse : true
		});
		obj.find(".js-icon").removeClass("icon-add").addClass("icon-minus-rect");
		objChild.css({
			'z-index' : itemInfo.layer,
			display : 'block'
		});
		if( !obj.attr('c') ){
			obj.attr('c',1);
		}
		objChild.css({
			display : 'block',
			left : pos.x,
			top : pos.y
		});
	},
	TypePicker.prototype._isSpecialValue = function(val,str){
		return str.indexOf(',' + val + ',') >= 0;
	};
	TypePicker.prototype._getDisabledText = function(layer,val,hasChild){
		var _this = this;
		var disabled = 'disabled="disabled"';
		var special = function (){
			switch (layer){
				case 0 :
					if (_this._isSpecialValue( val, _this._config.allowCheck[_this._config.lv] )){
						disabled = '';
					}
					break;
				default :
					disabled = '';
			}
		};
		switch (this._config.lv){
			case 0 :
				disabled = '';
				break;
			case 1 :
			case 2 :
				if (!hasChild){
					disabled = '';
				}
				break;
			case 3 :
				disabled = '';
				break;
			case 4 :
			case 5 :
				special();
				break;
		}
		return disabled;
	};
	TypePicker.prototype._getItemInfo = function(obj){
		var arr = obj.attr('vid').split('v-');
		var arrValue = arr[1].split('_');
		var info = {
			val : arrValue[arrValue.length-1],
			vals : arrValue,
			layer : arrValue.length
		};
		return info;
	};
	TypePicker.prototype._getItemInfoByValue = function(vid){
		var arr = vid.split('v-');
		var arrValue = arr[1].split('_');
		var info = {
			val : arrValue[arrValue.length-1],
			vals : arrValue,
			layer : arrValue.length
		};
		return info;
	};
	TypePicker.prototype._getDataChild = function(itemInfo){
		var _this = this;
		var data = _this._data;
		for (var i=0;i<itemInfo.vals.length;i++){
			if (data[itemInfo.vals[i]]){
				if (_this._config.lv == 3 && i == 1){
					data = null;
				}
				data = data[itemInfo.vals[i]].c;
			} else {
				data = null;
			}
		}
		return data;
	};
	TypePicker.prototype._checkByItem = function(item){
		var _this = this;
		var itemInfo = _this._getItemInfo(item.parents('.js-type-name'));
		if (item[0].checked){
			// 移除所有被选中的父亲
			var parents = _this._getParents(itemInfo.val);
			if( parents.length ){
				for (var i in parents){
					var arrParent = parents[i];
					for (var j in arrParent){
						if ( _this.__indexOfInArr(arrParent[j], _this._selected) > -1 ){
							_this._uncheck(arrParent[j]);
						}
					}
				}
			}
			// 移除所有被选中的孩子
			var strCheckVal = ',' + itemInfo.val + ',';
			var arrTmp = [];
			for(var j = 0; j < _this._selected.length; j++ ){
				arrTmp.push(_this._selected[j]);
			}
			if( arrTmp.length ){
				for ( var m = 0; m < arrTmp.length; m++ ){
					var arrParents = _this._getParents(arrTmp[m]);
					for (var n in arrParents){
						var strParents = ',' + arrParents[n].join(',') + ',';
						if (strParents.indexOf(strCheckVal) >= 0){
							_this._uncheck(arrTmp[m]);
						}
					}
				}
			}
			if( _this._selectedLimitAssert(item)){
				_this._check(itemInfo.val);
				_this._toggleSelectBgStatus(itemInfo, true);
			}
		} else {
			_this._uncheck(itemInfo.val);
			_this._toggleSelectBgStatus(itemInfo, false);
		}
	};
	TypePicker.prototype._selectedLimitAssert = function (item){
		var _this = this;
		var options = {opacity:0};
		//  最大限制判断并提示
		if( item[0].checked && (_this._selected.length > (_this._config.max - 1)) ){
			item[0].checked = false;
			options.content = '最多可选择'+ _this._config.max +'项';
			$.popmsg.alert(options.content,function(){},'',0);
			return false;
		}else{
			return true;
		}
	};
	TypePicker.prototype._uncheck = function(val){
		var _this = this;
		var arrParents = this._getParents(val);
		//  取消历史元素
		if( _this.__indexOfInArr(val, _this._history) > -1 ){
			_this._toggleSelectInHistory(val, false);
		}
		if (arrParents.length){
			for (var i in arrParents){
				arrParents[i].push(val);
				obj = $('#' + this.id + '_v-' + arrParents[i].join('_'));
				if (obj.length){
					obj[0].checked = false;
				}
			}
		} else {
			var obj = $('#' + this.id + '_v-' + val);
			if (obj.length){
				obj[0].checked = false;
			}
		}

		var checkId = this.id + '_s-' + val;
		$('#'+checkId).remove();
		if( _this.__indexOfInArr(val, _this._selected) > -1 ){
			_this.__removeItemInArr(val, _this._selected);
		}
	};
	TypePicker.prototype._check = function(val){
		var _this = this;
		var arrParents = this._getParents(val);
		//   添加历史元素
		if( _this.__indexOfInArr(val, _this._history) > -1 ){
			_this._toggleSelectInHistory(val, true);
		}
		for (var i in arrParents){
			arrParents[i].push(val);
			obj = $('#' + this.id + '_v-' + arrParents[i].join('_'));
			if (obj.length){
				obj[0].checked = true;
			}
		}

		var checkId = this.id + '_s-' + val;
		if( _this.__indexOfInArr(val, _this._selected) == -1 ){
			var html = $.page.regReplace(this._template.checkitem,{id:checkId,name:this._dataP[val].n});
			_this._selected.push(val);
		this._objects.objSelected.append(html);
		}
	};
	TypePicker.prototype._toggleSelectInHistory = function(val, isSelect){
		var _this = this;
		if( _this._history.length ){
			if( _this.__indexOfInArr(val, _this._history) > -1 && $('#' + _this.id + '_h-' + val).length ){
				$('#' + _this.id + '_h-' + val)[0].checked = isSelect;
			}
		}
	};
	TypePicker.prototype._toggleSelectBgStatus = function ( itemInfo, isAdd ){
		var _this = this;
		var val = itemInfo.val;
		var str =  _this.id + '_v-' + itemInfo.vals.join('_');
		var input = $('#' + str);
		var liObj = input.parent('label').parent('li');
		var arrParents = this._getParents(val);
		var changeStatus = function ( target, isadd ){
			if( isadd ){
				var vals = _this._getItemInfo(target).vals;
				var children =  $('#'+_this.id + '_v-' + vals.join('_')).parent('label').siblings('.js-type-layer').find('li');
				children.each(function(i, item){
					if( $(item).hasClass('js-type-current')){
						$(item).removeClass('js-type-current');
					}
				});
					target.addClass('js-type-current');
				}else{
					target.removeClass('js-type-current');
				}
		};
		if( liObj.length ){
			//  改变自己状态
			changeStatus(liObj, isAdd);
		}
		//  改变父父级状态
		for (var i in arrParents){
			arrParents[i].push(val);
			obj = $('#' + this.id + '_v-' + arrParents[i].join('_'));
			var arr = arrParents[i];
			for( var j = 1; j <= arr.length; j++){
				var str1 = arr.slice(0, j).join('_');
				var itemP = $('#' + this.id + '_v-' + str1).parent('label').parent('li');
				if( itemP.length ){
					changeStatus(itemP, isAdd);
				}
			}
			//  改变父级状态
			if (obj.length){
				var liTarget = obj.parent('label').parent('li');
				changeStatus(liTarget, isAdd);
			}
		}
	};
	TypePicker.prototype._getParents = function(val){
		var _this = this;
		if( val && _this._dataP[val].p ){
			var arr = getParents(_this._dataP[val].p);
		}
		function getParents(vals){
			var arr = [];
			for (var i in vals){
				var child = vals[i];
				if (_this._dataP[child].p.length){
					var parents = getParents(_this._dataP[child].p);
					for (var j in parents){
						parents[j].push(child);
						arr.push(parents[j]);
					}
				} else {
					arr.push([child]);
				}
			}
			return arr;
		}
		return arr;
	};
	TypePicker.prototype.reload = function(options){
		if (options){
			this._config = options;
			this._selected = this._config.value.value.split(',');
		}
	};
	$.fn.extend({
		typepicker : function(options){
			this.each(function(i,dom){
				TypePicker.create(dom,options);
			});
		}
	});
})(jQuery);