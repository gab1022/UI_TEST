sap.ui.define([], function () {
	"use strict";
	return {
		loadFewthings:function(context){
			this.getView = function(){
				return context.getView();
			};
			this.loadFragments(context);
		},
		loadFragments: function (context) {
			var fragAddress = 'com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.gsapprojectfrags.costCenterSearch';
			context.costCenterFrag = sap.ui.xmlfragment(fragAddress, context);
			context.getView().addDependent(context.costCenterFrag);
			fragAddress = 'com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.gsapprojectfrags.wbsSearch';
			context.wbsFrag = sap.ui.xmlfragment(fragAddress, context);
			context.getView().addDependent(context.wbsFrag);
		},
		addWBSLevel1Details: function () {
			var listData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			// var defaultValues = this.getView().getModel("defaultWBSValueModel").getProperty("/defaultConstantValues");
			listData.push({
				InvReason: "",
				UserFieldKey: ""
			});
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", listData);
		},
		deleteWBSLevel1Details: function (oEvent) {
			var list = this.gsapProjFrag.getContent()[0].getSteps()[1].getContent()[2];
			if (list.getSelectedContexts()[0]) {
				var listData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
				listData.splice(list.getSelectedContexts()[0].getPath().split("/results/")[1], 1);
				this.getView().getModel("gsapProjectLocalModel").setProperty("/results", listData);
			} else {
				sap.m.MessageToast.show("Please select an item to delete the entry");
			}
		},
		addmultilevelAdd: function (oEvent) {
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty(oEvent.getSource().getParent().getParent().getBindingContext(
				"gsapProjectLocalModel").getPath() + "/level");
			if (oldData && oldData.length > 0) {
				oldData.push({});
			} else {
				oldData = [{}];
			}
			this.getView().getModel("gsapProjectLocalModel").setProperty(oEvent.getSource().getParent().getParent().getBindingContext(
					"gsapProjectLocalModel")
				.getPath() + "/level", oldData);
		},
		onMultiLevelDelete: function (oEvent) {
			var path = oEvent.getParameter("listItem").getBindingContextPath("gsapProjectLocalModel");
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			oldData[path.split("/results/")[1].split("/")[0]]["level"].splice(
				path.split("/results/")[1].split("/")[2], 1);
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", oldData);
		},
		onSettlementAdd: function (oEvent) {
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			var idx = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath("gsapProjectLocalModel").split("/results/")[1];
			if (oldData[idx].settlementRule && oldData[idx].settlementRule.length > 0) {
				oldData[idx].settlementRule.push({
					AccntAssCat: "CTR"
				});
			} else {
				oldData[idx].settlementRule = [{
					AccntAssCat: "CTR"
				}];
			}
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", oldData);
		},
		onSettlementAddLevel: function (oEvent) {
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			var idx = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath("gsapProjectLocalModel").split("/results/")[1]
				.split(
					"/level/")[0];
			var idy = oEvent.getSource().getParent().getParent().getParent().getBindingContextPath("gsapProjectLocalModel").split("/results/")[1]
				.split(
					"/level/")[1];
			if (oldData[idx].level[idy].settlementRule && oldData[idx].level[idy].settlementRule.length > 0) {
				oldData[idx].level[idy].settlementRule.push({
					AccntAssCat: "CTR"
				});
			} else {
				oldData[idx].level[idy].settlementRule = [{
					AccntAssCat: "CTR"
				}];
			}
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", oldData);
		},
		onSettlementDelete: function (oEvent) {
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			var oldDataIdx = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath().split("/results/")[1].split("/")[0];
			var setlmentIdx = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath().split("/settlementRule/")[1].split("/")[0];
			oldData[oldDataIdx].settlementRule.splice(setlmentIdx, 1);
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", oldData);
		},
		onSettlementDeleteLevel: function (oEvent) {
			var oldData = this.getView().getModel("gsapProjectLocalModel").getProperty("/results");
			var oldDataIdx = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath().split("/results/")[1].split("/")[0];
			var setlmentIdx = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath().split("/settlementRule/")[1].split("/")[0];
			var idy = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath().split("/results/")[1].split(
				"/level/")[1].split("/")[0];
			oldData[oldDataIdx].level[idy].settlementRule.splice(setlmentIdx, 1);
			this.getView().getModel("gsapProjectLocalModel").setProperty("/results", oldData);
		},
		onCheckBoxSelectWBS: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("gsapProjectLocalModel").getPath() + "/" + oEvent.getSource().getBindingInfo(
				"selected").parts[0].path;
			this.getView().getModel("gsapProjectLocalModel").setProperty(path, oEvent.getParameter('selected') ? 'X' : '');
		},
		onGSAPProjectDateChange: function (oEvent) {
			var path = oEvent.getSource().getBindingInfo("dateValue").parts[0].path;
			var dateValue = oEvent.getSource().getDateValue();
			var isoString = new Date(Date.UTC(dateValue.getFullYear(),dateValue.getMonth(),dateValue.getDate())).toISOString();
			this.getView().getModel("gsapProjectLocalModel").setProperty(path, isoString.split(
				".")[0]);
		},
		onCostCenterFilterSearch: function (oSearch) {
			var compCode = this.getView().getModel('gsapProjectLocalModel').getProperty("/CompanyCode")[0]+this.getView().getModel('gsapProjectLocalModel').getProperty("/CompanyCode")[1];
			if (oSearch.getParameter("value") && (compCode === oSearch.getParameter("value")[0] + oSearch.getParameter("value")[1])) {
				oSearch.getSource()._list.getBinding("items").filter([new sap.ui.model.Filter("Kostl", sap.ui.model.FilterOperator.StartsWith,
					oSearch.getParameter("value"))]);
			} else {
				oSearch.getSource()._list.getBinding("items").filter([new sap.ui.model.Filter("Kostl", sap.ui.model.FilterOperator.StartsWith,
					compCode)]);
					sap.m.MessageToast.show("Can search Cost Centers starting with " + compCode);
			}
		},
		onWBSFilterSearch: function (oSearch) {
			var compCode = this.getView().getModel('gsapProjectLocalModel').getProperty("/CompanyCode")[0]+this.getView().getModel('gsapProjectLocalModel').getProperty("/CompanyCode")[1];
			if (oSearch.getParameter("value") && (compCode === oSearch.getParameter("value")[0] + oSearch.getParameter("value")[1])) {
				oSearch.getSource()._list.getBinding("items").filter([new sap.ui.model.Filter("Posid", sap.ui.model.FilterOperator.StartsWith,
					oSearch.getParameter("value"))]);
			} else {
				oSearch.getSource()._list.getBinding("items").filter([new sap.ui.model.Filter("Posid", sap.ui.model.FilterOperator.StartsWith,
					compCode)]);
					sap.m.MessageToast.show("Can search WBS starting with " + compCode);
			}
		},
		onResponsibleCostCenterSearch: function (oEvent) {
			this.pathToSet = oEvent.getSource().getBindingContext('gsapProjectLocalModel').getPath() + '/' + oEvent.getSource().getBindingInfo('value')
				.parts[0].path;
			if(!this.costCenterFrag){
				this.gsapProjectSectionEvent.loadFragments();
			}
			if (this.costCenterFrag) {
				this.costCenterFrag.open();
				this.costCenterFrag.fireSearch();
			} else {
				sap.m.MessageToast.show("Unable to load Cost center Fragment, Please check with Admin");
			}
		},
		onCostobjectSelection: function (oSelection) {
			if (this.pathToSet) {
				this.getView().getModel('gsapProjectLocalModel').setProperty(this.pathToSet, oSelection.getParameter('selectedItem').getTitle());
			} else {
				sap.m.MessageToast.show("Unable to determine the Path to Set, Please check with Admin");
			}
			this.pathToSet = '';
		},
		onSettlementHelpRequest: function (oEvent) {
			this.pathToSet = oEvent.getSource().getBindingContext('gsapProjectLocalModel').getPath() + "/SettlementRecevier";
			var type = this.getView().getModel('gsapProjectLocalModel').getProperty(oEvent.getSource().getBindingContext('gsapProjectLocalModel').getPath() +
				'/AccntAssCat');
			if (type === 'CTR') {
				if (this.costCenterFrag) {
					this.costCenterFrag.open();
					this.costCenterFrag.fireSearch();
				} else {
					sap.m.MessageToast.show("Unable to load Cost center Fragment, Please check with Admin");
				}
			} else {
				if (this.wbsFrag) {
					this.wbsFrag.open();
					this.wbsFrag.fireSearch();
				} else {
					sap.m.MessageToast.show("Unable to load WBS Fragment, Please check with Admin");
				}
			}
		},
		
		//@START: Task 239944
		getProviderWBSDesc: function(context, providerwbs) {
			return new Promise(function(resolve, reject) {
				context.getView().getModel('gsapModelXODataModel').read("/Wbs_searchSet", {
					filters: [new sap.ui.model.Filter("Posid", sap.ui.model.FilterOperator.EQ, providerwbs),
					new sap.ui.model.Filter("BillingElement", sap.ui.model.FilterOperator.EQ, "X")],
					success: function(odata, oresponse) {
						if(odata.results.length) {
							resolve(odata.results[0].Post1);
						} else {
							resolve("");	
						}
					},
					error: function(oerror) {
						reject();
					}
				});		
			});
		},
		//@END: Task 239944
	};

});