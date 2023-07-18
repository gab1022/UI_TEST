sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"
], function (UnderScoreParse) {
	return {
		getDetails: function (context, modelName, entitySetName) {
			var odataModel = context.getOwnerComponent().getModel(modelName);
			if (odataModel.getMetadata().getName().indexOf("ODataModel") !== -1) {
				if (odataModel.getServiceMetadata().hasOwnProperty("dataServices")) {
					var dataService = odataModel.getServiceMetadata().dataServices;
					if (dataService.hasOwnProperty("schema")) {
						var schema = dataService.schema[0];
						var namSpace = schema.namespace + ".";
						var entityContainer = schema.entityContainer[0];
						var entityTypes = schema.entityType;
						var entityTypePath = entityContainer.entitySet.filter(function (e) {
							return e.name.toUpperCase() === entitySetName.toUpperCase();
						})[0].entityType.split(namSpace)[1];
						if (entityTypePath) {
							var entityTypeDetails = entityTypes.filter(function (e) {
								return e.name === entityTypePath;
							})[0];
							var keys = [];
							jQuery.each(entityTypeDetails.key.propertyRef,function(ix,ox){
								keys.push(ox.name);
							});
							var properties = entityTypeDetails.property;
							return {keys:keys,properties:properties};
						}
					}
				}
			}
		}
	};
});