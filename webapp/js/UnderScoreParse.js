sap.ui.define([], function () {
	jQuery.sap.require('com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/underscore');
	return {
		groupBy:function(data,property){
			return _.groupBy(data,function(ix){
				return ix[property];	
			});
		},
		where:function(parentArray,compObj){
			return _.where(parentArray,compObj);
		},
		uniq:function(data,properties){
				var cond = "";
				jQuery.each(properties,function(ix,ox){
					if(ix !== 0){
					cond = cond +" && ";
					}
					cond = cond + "ix['"+ox+"']";
				});
			return _.uniq(data,false,function(ix){
				return eval(cond);
			});
		},
		keys:function(object){
			return _.keys(object);
		},
		map:function(list,func){
			return _.map(list,func);
		},
		pick:function(object,keys){
			return _.pick(object,keys);
		},
		max:function(array,iteration){
			return _.max(array,iteration);
		},
		min:function(array,iteration){
			return _.min(array,iteration);
		}
	};
});