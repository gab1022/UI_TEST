sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/ODataModelParser"
], function (UnderScoreParse, ODataModelParser) {
	return {
		makePayload: function (context, Action, status) {
			var curContext = this;
			var allData = context.getPropInModel("localDataModel", "/");
			var oDatafieldsHeader = ODataModelParser.getDetails(context, "fdrPlusODataModel", "fdrheader");
			var oDatafieldsProvider = ODataModelParser.getDetails(context, "fdrPlusODataModel", "provider");
			var oDatafieldsBen = ODataModelParser.getDetails(context, "fdrPlusODataModel", "beneficiary");
			var oDatafieldsProject = ODataModelParser.getDetails(context, "fdrPlusODataModel", "fdrproject");
			//var oDatafieldscontracts = ODataModelParser.getDetails(context, "fdrPlusODataModel", "fdrcontractkey");
			var oDatafieldsRCCoding = ODataModelParser.getDetails(context, "fdrPlusODataModel", "rccoding");
			var oDatafieldsAddlProj = ODataModelParser.getDetails(context, "fdrPlusODataModel", "fdradditionalproject");
			var masterObject = {};
			allData.ACTION = allData.ACTION ? allData.ACTION : Action;
			//@START: Task 312107
			if(allData.fdrstatus === "RELSD") {
				allData.fdrreleasedon = allData.fdrreleasedon ? allData.fdrreleasedon : new Date();
			}
			//@END: Task 312107
			allData.createdby = allData.createdby ? allData.createdby : context.getPropInModel("userDetailsModel","/name");
			allData.createdon = allData.createdon ? new Date(allData.createdon) : new Date();
			allData.updatedby = context.getPropInModel("userDetailsModel","/name");
			allData.updatedon = new Date();
			masterObject.header = this.makeObject(oDatafieldsHeader, allData);
			var role = context.getPropInModel("tileIdentityModel","/role"); //@Task 319742
			masterObject.header.appname = (allData.fdrstatus.startsWith("CH") || role === "SUPADM") ? role : 'X'; //@Task 268231, 319742
			masterObject.provider = [];
			jQuery.each(allData.providerCompanies, function (ix, ox) {
				ox.ACTION = ox.ACTION ? ox.ACTION : Action;
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.provider.push(curContext.makeObject(oDatafieldsProvider, ox));
			});
			masterObject.beneficiary = [];
			jQuery.each(allData.benifCompanies, function (ix, ox) {
				ox.ACTION = ox.ACTION ? ox.ACTION : Action;
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.beneficiary.push(curContext.makeObject(oDatafieldsBen, ox));
			});
			masterObject.fdrcontractkey = [];
			//TODO - Commented for Contract Validation error
			// jQuery.each(allData.contractkey, function (ix, ox) {
			// 	ox.ACTION = ox.ACTION ? ox.ACTION : Action;
			// 	ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
			// 	ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
			// 	ox.updatedby = context.getPropInModel("userDetailsModel","/name");
			// 	ox.updatedon = new Date();
			// 	masterObject.fdrcontractkey.push(curContext.makeObject(oDatafieldscontracts, ox));
			// });
			masterObject.rccoding = [];
			jQuery.each(allData.rccoding, function (ix, ox) {
				ox.ACTION = ox.ACTION ? ox.ACTION : Action;
				ox.fdrno = ox.fdrno ? ox.fdrno : allData.fdrno; //@Check
				ox.deletionflag = ox.deletionflag ? ox.deletionflag : "N"; //@Check
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.rccoding.push(curContext.makeObject(oDatafieldsRCCoding, ox));
			});
			masterObject.fdradditionalproject = [];
			//@START: Task 300908
			//Budget Values
			var budgetValues = allData.addlProjDetails.filter(function(o) {
				return o.code === "PLBD";
			});
			jQuery.each(budgetValues, function (ix, ox) {
				ox.ACTION = ox.ACTION ? ox.ACTION : "C";
				ox.fdrno = ox.fdrno ? ox.fdrno : allData.fdrno;
				ox.itemno = ((ix + 1) * 10) + "";
				ox.providercompcode = ox.providercompcode ? ox.providercompcode : context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
				ox.provideritemno = ox.provideritemno ? ox.provideritemno : "10";
				ox.providersubitemno = ox.providersubitemno ? ox.providersubitemno : "10";
				ox.deletionflag = ox.deletionflag ? ox.deletionflag : "N";
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.fdradditionalproject.push(curContext.makeObject(oDatafieldsAddlProj, ox));
			});
			var nonBudgetValues = allData.addlProjDetails.filter(function(o) {
				return o.code !== "PLBD";
			});
			//@END: Task 300908
			jQuery.each(nonBudgetValues, function (ix, ox) { //@Task 300908
				ox.ACTION = ox.ACTION ? ox.ACTION : Action;
				ox.fdrno = ox.fdrno ? ox.fdrno : allData.fdrno; //@Check
				ox.deletionflag = ox.deletionflag ? ox.deletionflag : "N"; //@Check
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.fdradditionalproject.push(curContext.makeObject(oDatafieldsAddlProj, ox));
			});
			masterObject.fdrproject = [];
			jQuery.each(allData.fdrproject, function (ix, ox) {
				ox.ACTION = ox.ACTION ? ox.ACTION : Action;
				ox.createdby = ox.createdby ? ox.createdby : context.getPropInModel("userDetailsModel","/name");
				ox.createdon = ox.createdon ? new Date(ox.createdon) : new Date();
				ox.updatedby = context.getPropInModel("userDetailsModel","/name");
				ox.updatedon = new Date();
				masterObject.fdrproject.push(curContext.makeObject(oDatafieldsProject, ox));
			});
			masterObject.costcollector = [];
			return [masterObject];
		},
		makeObject: function (config, data) {
			var obj = {
				"ACTION": data.ACTION
			};
			jQuery.each(config.properties, function (ix, ox) {
				var value = data[ox.name];
				obj[ox.name] = "";
				if (ox.type.split(".")[1].toUpperCase() === "STRING".toUpperCase() && value && value.length <= parseInt(ox.maxLength)) {
					obj[ox.name] = value.toString();
				} else if (ox.type.split(".")[1].toUpperCase() === "STRING".toUpperCase() && value && value.length > parseInt(ox.maxLength)) {
					value = value.toString();
					obj[ox.name] = value.substring(0, parseInt(ox.maxLength)).toString();
				} else if (value) {
					obj[ox.name] = value;
				}
			});
			return obj;
		},
		determineItemNo: function (context) {
			var providers = context.getPropInModel("localDataModel", "/providerCompanies");
			var provItemNosMax = UnderScoreParse.max(UnderScoreParse.uniq(providers, ["itemno"]), function (e) {
				return parseInt(e.itemno);
			});
			if (provItemNosMax && typeof (provItemNosMax) === "object") {
				provItemNosMax = parseInt(provItemNosMax.itemno) ? parseInt(provItemNosMax.itemno) : 0;
			} else {
				provItemNosMax = 0;
			}
			// provItemNosMax = provItemNosMax && isFinite(provItemNosMax) ? parseInt(provItemNosMax.itemno) : 0;
			providers.forEach(function (e) {
				if (!e.itemno) {
					e.itemno = (provItemNosMax + 10).toString();
					provItemNosMax = provItemNosMax + 10;
				}
			});
			context.setPropInModel("localDataModel", "/providerCompanies", providers);
			var benficiaries = context.getPropInModel("localDataModel", "/benifCompanies");
			var benItemNosMax = UnderScoreParse.max(UnderScoreParse.uniq(benficiaries, ["itemno"]), function (e) {
				return parseInt(e.itemno);
			});

			if (benItemNosMax && typeof (benItemNosMax) === "object") {
				benItemNosMax = parseInt(benItemNosMax.itemno) ? parseInt(benItemNosMax.itemno) : 0;
			} else {
				benItemNosMax = 0;
			}
			// benItemNosMax = benItemNosMax && isFinite(benItemNosMax) ? parseInt(benItemNosMax.itemno) : 0;
			benficiaries.forEach(function (e) {
				if (!e.itemno) {
					e.itemno = (benItemNosMax + 10).toString();
					benItemNosMax = benItemNosMax + 10;
				}
			});
			context.setPropInModel("localDataModel", "/benifCompanies", benficiaries);
		},
		determineSubItemNo: function (context) {
			var benficiaries = context.getPropInModel("localDataModel", "/benifCompanies");
			var groupByItemNo = UnderScoreParse.groupBy(benficiaries, "itemno");
			var toAddBack = [];
			jQuery.each(groupByItemNo, function (ix, ox) {
				var benSubItemNosMax = UnderScoreParse.max(UnderScoreParse.uniq(ox, ["subitemno"]), function (e) {
					return parseInt(e.subitemno);
				});
				if (benSubItemNosMax && typeof (benSubItemNosMax) === "object") {
					benSubItemNosMax = parseInt(benSubItemNosMax.subitemno) ? parseInt(benSubItemNosMax.subitemno) : 0;
				} else {
					benSubItemNosMax = 0;
				}
				ox.forEach(function (e) {
					if (!e.subitemno) {
						e.subitemno = (benSubItemNosMax + 10).toString();
						benSubItemNosMax = benSubItemNosMax + 10;
					}
				});
				toAddBack = toAddBack.concat(ox);
			});
			context.setPropInModel("localDataModel", "/benifCompanies", toAddBack);
		}
	};
});