sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/controller/BaseController",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"
], function (Controller, UnderScoreParse) {
	"use strict";

	return Controller.extend("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.controller.FDRMasterPage", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRMasterPage
		 */
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this._onMasterMatched, this);
			//@START: Task 319741
			var role = this.getOwnerComponent().getModel("tileIdentityModel").getProperty("/role");
			this.oList = (role !== "SUPADM" && role !== "DISPLAY") ? this.getView().byId("idfdrList") : this.getView().byId("idfdrSupAdmList");
			//@END: Task 319741
			this.getOwnerComponent().getRouter().getRoute("fdrCreate").attachPatternMatched(this._onMasterMatched, this); //@Bug 294923
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRMasterPage
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRMasterPage
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRMasterPage
		 */
		//	onExit: function() {
		//
		//	}
		_onMasterMatched: function (oEvent) { //@Bug 294923
			var context = this,
				aFilter = [];
			this.setPropInModel("loadIndicatorModel", "/masterLoaded", true);
			if (this.getPropInModel("tileIdentityModel", "/role") === "PRC") {
				var aStatusFilter = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "PCNRD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHPRD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHPCR")//@Task 240410
				];
				// @Task 239986
				aStatusFilter.forEach(function (oFilter) {
					aFilter.push(new sap.ui.model.Filter({
						filters: [oFilter, new sap.ui.model.Filter("providerconfirmer", sap.ui.model.FilterOperator.EQ, context.getView().getModel(
							"userDetailsModel").getProperty("/name"))],
						and: true
					}));
				});
				this.oList.getBinding("items").filter(aFilter, "Application");
			} else if (this.getPropInModel("tileIdentityModel", "/role") === "CNC") {
				var aWFFilter = new sap.ui.model.Filter("workflowflag", sap.ui.model.FilterOperator.EQ, "X");
				var aStatusFilter = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CSCNR"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RELSD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHCSR"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHCRN")//@Task 240410
				];
				// @Task 239986
				aStatusFilter.forEach(function (oFilter) {
					aFilter.push(new sap.ui.model.Filter({
						filters: [aWFFilter, oFilter, new sap.ui.model.Filter("consumer", sap.ui.model.FilterOperator.EQ, context.getView().getModel(
							"userDetailsModel").getProperty("/name"))],
						and: true
					}));
				});
				this.oList.getBinding("items").filter(aFilter, "Application");
			} else if (this.getPropInModel("tileIdentityModel", "/role") === "RNA") {
				var aWFFilter = new sap.ui.model.Filter("workflowflag", sap.ui.model.FilterOperator.EQ, "X");
				var aStatusFilter = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RNUPD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RELSD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHRNA")
				];
				// @Task 239986
				aStatusFilter.forEach(function (oFilter) {
					aFilter.push(new sap.ui.model.Filter({
						filters: [aWFFilter, oFilter, new sap.ui.model.Filter("rnafocal", sap.ui.model.FilterOperator.EQ, context.getView().getModel(
							"userDetailsModel").getProperty("/name"))],
						and: true
					}));
				});
				this.oList.getBinding("items").filter(aFilter, "Application");
			} else if (this.getPropInModel("tileIdentityModel", "/role") === "GSR") {
				//@START: Task 290069
				// this.oList.getBinding("items").filter([new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CRETD"), new sap.ui.model
				// 	.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "INPR"), new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ,
				// 		"RELSD"), new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "PNGSR"),
				// 	new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RNREJ"), //@Task 211175
				// 	new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHGSR"), //@Task 232398
				// 	new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHRJG"),//@Task 240410
				// 	new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLPRE"), //@Task 232399
				// 	new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLOSD")
				// ], "Application");
				
				var aWFFilter = new sap.ui.model.Filter("workflowflag", sap.ui.model.FilterOperator.NE, "X");
				var aStatusFilter = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "INPR"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RELSD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLPRE"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLOSD")
				];
				aStatusFilter.forEach(function (oFilter) {
					aFilter.push(new sap.ui.model.Filter({
						filters: [aWFFilter, oFilter],
						and: true
					}));
				});
				this.oList.getBinding("items").filter(aFilter, "Application");
				//@END: Task 290069
			} 
			//@START: Task 290069
			else if(this.getPropInModel("tileIdentityModel", "/role") === "GSRWF") {
				var aWFFilter = new sap.ui.model.Filter("workflowflag", sap.ui.model.FilterOperator.EQ, "X");
				var aStatusFilter = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CRETD"), 
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "PNGSR"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RNREJ"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "RELSD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHGSR"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CHRJG"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLPRE"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.EQ, "CLOSD")
				];
				aStatusFilter.forEach(function (oFilter) {
					aFilter.push(new sap.ui.model.Filter({
						filters: [aWFFilter, oFilter, new sap.ui.model.Filter("gsrfocal", sap.ui.model.FilterOperator.EQ, context.getView().getModel(
							"userDetailsModel").getProperty("/name"))],
						and: true
					}));
				});
				this.oList.getBinding("items").filter(aFilter, "Application");
			}
			//@END: Task 290069
			//@START: Task 349970
			//Apply no filters - show even Released FDRs
			// else if (this.getPropInModel("tileIdentityModel", "/role") === "ADMIN") { //@Task 239986
			// 	this.oList.getBinding("items").filter([new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "RELSD")],
			// 		"Application");
			// }
			//@END: Task 349970
			//@START: Task 319741, 341209
			else if (this.getPropInModel("tileIdentityModel", "/role") === "SUPADM" || this.getPropInModel("tileIdentityModel", "/role") === "DISPLAY") {
				//Remove Pre-project FDRs
				var aFilters = [new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "PPBFM"), 
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "PPGSR"), 
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "PPRLD"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "BFMRJ"),
					new sap.ui.model.Filter("fdrstatus", sap.ui.model.FilterOperator.NE, "GSRRJ")];
				// var aFilters = [new sap.ui.model.Filter("business", sap.ui.model.FilterOperator.EQ, "UP"), 
				// 	new sap.ui.model.Filter("business", sap.ui.model.FilterOperator.EQ, "DS")];
				this.oList.getBinding("items").filter([new sap.ui.model.Filter({filters: aFilters, and: true})], "Application");                    
			}
			//@END: Task 319741, 341209
			if (this.getPropInModel("loadIndicatorModel", "/detailtoRouteBack")) {
				this.setPropInModel("loadIndicatorModel", "/detailtoRouteBack", false);
				this.getView().byId("idSearchField").fireLiveChange({
					newValue: context.getPropInModel("loadIndicatorModel", "/fdrNo")
				});
				this.getView().byId("idSearchField").setValue(context.getPropInModel("loadIndicatorModel", "/fdrNo"));
				// this.oList.getBinding("items").filter([new sap.ui.model.Filter("fdrno", sap.ui.model.FilterOperator.Contains, context.getPropInModel("loadIndicatorModel", "/fdrNo"))]);
			}
			//@START: Bug 294923
			if(oEvent.getParameter("name") === "home") {
				this.oList.attachEventOnce("updateFinished", context.onMasterListUpdateFinished);	
			}
			//@END: Bug 294923
		},
		//@END: Bug 294923
		onMasterListUpdateFinished: function (oEvent) {
			if (parseInt(oEvent.getParameter('total'), 0) > 0) {
				oEvent.getSource().fireSelectionChange({
					id: oEvent.getSource().getId(),
					listItem: oEvent.getSource().getItems()[0],
					listItems: [oEvent.getSource().getItems()[0]],
					selectAll: false,
					selected: true
				});
				oEvent.getSource().setSelectedItem(oEvent.getSource().getItems()[0]);
			} else {
				this.getParent().getParent().getController().getRouter().navTo("empty", {});
			}
		},

		onFDRSelection: function (oEvent) {
			this.getRouter().navTo('detail', {
				fdrInd: oEvent.getParameter('listItem').getBindingContext("fdrPlusODataModel").getProperty("fdrno"),
				index: parseInt(Math.random() * 100, 0)
			});
			//this.setPropInModel("loadIndicatorModel", "/fromFDRList", true); //@Task 321452
		},
		onFDRCreatePress: function () {
			this.getRouter().navTo('fdrCreate', {
				index: parseInt(Math.random() * 100, 0)
			});
		},
		onFDRSearchLiveChange: function (oEvent) {
			if (oEvent.getParameter("newValue")) {
				var query = oEvent.getParameter("newValue");
				var aFilters = [new sap.ui.model.Filter("fdrno", sap.ui.model.FilterOperator.Contains, query.toUpperCase())];
				if (this.getPropInModel("tileIdentityModel", "/role") === "GSR") {
					//@START: Task 290069
					var sQuery = query.toUpperCase();
					if(sQuery === "DIR" || sQuery === "EBD" || sQuery.startsWith("GC")) {
						aFilters = [new sap.ui.model.Filter("fdrroute", sap.ui.model.FilterOperator.Contains, sQuery)];
					}
					/*aFilters.push(new sap.ui.model.Filter("fdrroute", sap.ui.model.FilterOperator.Contains, query.toUpperCase()));
					this.oList.getBinding("items").filter([new sap.ui.model.Filter({
						filters: aFilters,
						and: false
					})]);*/
					//@END: Task 290069
				}
				this.oList.getBinding("items").filter(aFilters);
			} else {
				this.oList.getBinding("items").filter([]);
			}
		},
		
		onClickTest: function() {
			var sUrl = "/GF_SCP_HANADB/com/shell/cumulus/core/dowload.xsjs?$format=xlsx";
			var encodeUrl = encodeURI(sUrl);
			sap.m.URLHelper.redirect(encodeUrl,true);
		}
	});

});