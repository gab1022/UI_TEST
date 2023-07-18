sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/controller/BaseController",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/model/formatter",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/GSAPProjectSectionEvent",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/SERPProjectEvents",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/Utility", //@Task 223652
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/EngagementParser", //@Task 223713
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/ProjectParser" //@Task 232398
], function (Controller, formatter, GSAPProjectSectionEvent, UnderScoreParse, SERPProjectEvents, Utility, EngagementParser, ProjectParser) { //@Task 223652, 223713
	"use strict";

	return Controller.extend("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.controller.FDRDetailPage", {
		formatter: formatter,
		gsapProjectSectionEvent: GSAPProjectSectionEvent,
		serpProjectSectionEvent: SERPProjectEvents,
		utilityParser: Utility, //@Task 223652
		engagementParser: EngagementParser, //@Task 223713
		projectParser: ProjectParser, //@Task 232398
		onSerpProejctFetch: function (provPath) {
			//@START: Task 391850, 406278
			if ((this.getPropInModel("localDataModel", "/onlyproject") === "N" || this.getPropInModel("localDataModel", "/fdrstatus") === "RELSD") 
				&& this.getPropInModel("localDataModel", provPath + "providercostobj") === "") {
				this.showMessage("Please select Provider WBSE");
				return;
			}
			//@END: Task 391850, 406278
			if (this.getPropInModel("localDataModel", "/benifCompanies").length !== 1) {
				this.showMessage("Project Functionality Not Available When We Have More Than 1 Beneficiary.");
				return;
			}
			if (!this.getPropInModel("localDataModel", "/benifCompanies/0/soldto")) {
				this.showMessage("Please select Beneficiary Sold To befor Project Creation.");
				return;
			}
			if (!this.getPropInModel("localDataModel", "/fdrdescription") || !this.getPropInModel("localDataModel", "/planbudgetvalue") || !
				this.getPropInModel("localDataModel", "/dc")) {
				this.showMessage("Please Add the following fields in Header; Description, Budget Value, Distribution Channel");
				return;
			}
			if (this.getPropInModel("localDataModel", provPath + "providercostobj") && this.getPropInModel("localDataModel", provPath +
					"providercosttyp") === "CC") {
				this.showMessage("No Project Available for Cost Centers");
				return;
			}
			if (!this.getPropInModel("localDataModel", provPath + "providercompcode")) {
				this.showMessage("Please Add all Mandatory Fields in Provider Line Item.");
				return;
			}
			if (!this.getPropInModel("localDataModel", provPath + "billingmethodcode")) {
				this.showMessage("Please Select Recovery Type that has a valid Billing Method");
				return;
			}
			if (!this.getPropInModel("localDataModel", "/funtionid") || !this.getPropInModel("localDataModel", "/serviceid")) {
				this.showMessage("Please Add Function and Service before project");
				return;
			}
			//@START: Task 223015
			if (!this.getPropInModel("localDataModel", "/createdby") && !this.getPropInModel("localDataModel", "/personresponsible")) {
				this.showMessage("Please Add Requestor details");
				return;
			}
			//@END: Task 223015
			if (this.getPropInModel("localDataModel", "/fdrno")) {
				var context = this;
				//@START: Task 391850
				var oProviderData = {}; 
				if(context.getPropInModel("localDataModel", "/onlyproject") !== "N") { //Simple FDR
					oProviderData = {
						"providerPath": provPath,
						"fdrno": context.getPropInModel("localDataModel", "/fdrno"),
						"itemno": "10",
						"providercompcode": context.getPropInModel("localDataModel", provPath + "providercompcode"),
						"provideritemno": context.getPropInModel("localDataModel", provPath + "itemno"),
						"providersubitemno": context.getPropInModel("localDataModel", provPath + "subitemno"),
						"fdrdescription": context.getPropInModel("localDataModel", "/fdrdescription"),
						"fdrstartdate": new Date(context.getPropInModel("localDataModel", "/fromdate")),
						"fdrenddate": new Date(context.getPropInModel("localDataModel", "/todate")),
						"planbudgetvalue": context.getPropInModel("localDataModel", "/planbudgetvalue"),
						"partnersoldto": context.getPropInModel("localDataModel", "/benifCompanies/0/soldto"),
						"soldtoname": context.getPropInModel("localDataModel", "/benifCompanies/0/soldtoname"), //@Task 271588
						"providersystem": "SERP",
						"projectdef": context.getPropInModel("localDataModel", provPath + "projectdef") ? context.getPropInModel("localDataModel",
							provPath + "projectdef") : "",
						"billingmethod": context.getPropInModel("localDataModel", provPath + "billingmethodcode"),
						"billingmethoddesc": context.getPropInModel("localDataModel", provPath + "billingmethod"),
						"dc": context.getPropInModel("localDataModel", "/dc"), //@Task 306868 - For Profit Center and Functional Area (Feeder - 92)
						// "engagementno": context.getPropInModel("localDataModel", "/benifCompanies/0/engagmentno") ? context.getPropInModel(
						// 	"localDataModel", "/benifCompanies/0/engagmentno") : "",//@Task 223015
						"PersonResponsible": context.getPropInModel("localDataModel", "/personresponsible"), //@Task 223015
						"gsrfocalpoint": context.getPropInModel("localDataModel", "/gsrfocal"), //For FinanceRep and ApplicantNo
						"fdrrequestor": context.getPropInModel("localDataModel", "/createdby"), //For PersonResponsible
						"ipMandatory": (context.getPropInModel("tileIdentityModel", "/role") === "GSR" || context.getPropInModel("tileIdentityModel", "/role") === "GSRWF") ? 
							"N" : context.getPropInModel("tileIdentityModel", "/role") === 'RNA' ? "Y" : "N", //@Task 232398
						"funtionid": context.getPropInModel("localDataModel", "/funtionid"),  //@Task 306868
						"serviceid": context.getPropInModel("localDataModel", "/serviceid"),
						"rnaeditable": context.getPropInModel("tileIdentityModel", "/role") === 'RNA' ? false : true,
						"workflowflag": context.getPropInModel("localDataModel", "/workflowflag") //@Bug 252083
					};
				}
				else { //Complex FDR
					oProviderData = {
						"providerwbs": context.getPropInModel("localDataModel", provPath + "providercostobj") //providercostobj
					};
				}
				context.serpProjectSectionEvent.onCreateProjectDialog(context, oProviderData);
			} else {
				this.showMessage("Please Generate FDR No before Proceeding. Click on SAVE to Generate FDR No.");
			}
		},
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRDetailPage
		 */
		onInit: function () {
			this.getRouter().getRoute("fdrCreate").attachPatternMatched(this._fdrCreateRouteMatchedMethod, this);
			this.getRouter().getRoute("detail").attachPatternMatched(this._fdrReadRouteMatchedMethod, this);
			this.getView().setModel(new sap.ui.model.json.JSONModel({
				contractValidation: "Y"
			}), "holderModel");
			
			//Disable manual input for FDR Validity
			var fromDate = this.getView().byId("fdrStartDate");
			fromDate.addDelegate({
				onAfterRendering: function() {
					fromDate.$().find('INPUT').attr('disabled', true).css('color', '#555');
				}	
			});
			var toDate = this.getView().byId("fdrEndDate");
			toDate.addDelegate({
				onAfterRendering: function() {
					toDate.$().find('INPUT').attr('disabled', true).css('color', '#555');
				}	
			});
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRDetailPage
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRDetailPage
		 */
		onAfterRendering: function () {
			var context = this, aHoverControls = [];
			var role = this.getPropInModel("tileIdentityModel", "/role");
			if(role === "PRC") {
				aHoverControls.push({"uicontrol": "idProvConfService", "key": "Service"});
				aHoverControls.push({"uicontrol": "idProvConfAttachment", "key": "Attachment"});
				aHoverControls.push({"uicontrol": "idProvConfPlanValue", "key": "PlanValue"});
				aHoverControls.push({"uicontrol": "idProvConfInitiator", "key": "Initiator"});
				aHoverControls.push({"uicontrol": "idProvConfFromDate", "key": "FDRValidity"});
				aHoverControls.push({"uicontrol": "idProvConfToDate", "key": "FDRValidity"});
			}
			else if(role === "CNC") {
				aHoverControls.push({"uicontrol": "idConsumerService", "key": "Service"});
				aHoverControls.push({"uicontrol": "idConsumerAttachment", "key": "Attachment"});
				aHoverControls.push({"uicontrol": "idConsumerPlanValue", "key": "PlanValue"});
				aHoverControls.push({"uicontrol": "idConsumerInitiator", "key": "Initiator"});
				aHoverControls.push({"uicontrol": "idConsumerRCCoding", "key": "RecipientCoding"});
				aHoverControls.push({"uicontrol": "idConsumerRCCodingNP", "key": "RecipientCoding"}); //@Task 312428
				aHoverControls.push({"uicontrol": "idConsumerInvRec", "key": "InvoiceRecipient"});
				aHoverControls.push({"uicontrol": "idConsumerBudgetHolder", "key": "BudgetHolder"});
				aHoverControls.push({"uicontrol": "idConsumerInvoiceSplit", "key": "InvoiceSplit"});
				aHoverControls.push({"uicontrol": "idConsumerSuppressSvcTypeDesc", "key": "SuppressServiceTypeDesc"});
				aHoverControls.push({"uicontrol": "idConsumerSuppressSystemBacking", "key": "SuppressSystemBacking"});
			}
			
			aHoverControls.forEach(function(o) {
				context.byId(o.uicontrol).addEventDelegate({
					onmouseover: function () {
						if(!context.oHoverPopover) {
		                    context.oHoverPopover = sap.ui.xmlfragment("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.HoverPopover", context);
		                    context.getView().addDependent(context.oHoverPopover);
		                }
		                context.setPropInModel("localDataModel", "/hovertext", context.getPropInModel("localDataModel", "/fdrhovertexts/" + o.key));
		                context.oHoverPopover.openBy(context.getView().byId(o.uicontrol));
					},
					onmouseout: function () {
						if(context.oHoverPopover) {
							context.oHoverPopover.close();
						}
					}
				});
			});
		},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.FDRDetailPage
		 */
		//	onExit: function() {
		//
		//	}
		createLocalModelToDetail: function () {
			this.setModel(new sap.ui.model.json.JSONModel({
				providerCompanies: [],
				benifCompanies: [],
				contractkey: [],
				fdrproject: [],
				rccoding: [],
				addlProjDetails: []
			}), "localDataModel");
			//@START: Task 319428
			this.setModel(new sap.ui.model.json.JSONModel({
				provCompanies: [],
				benCompanies: []
			}), "dbDataModel");
			//@END: Task 319428
			this.setModel(new sap.ui.model.json.JSONModel(), "contractDatesModel");
			this.loadDefaults();
			this.refreshFragKeys();

			//Get status descriptions
			//this.getFDRStatusAll(); //@Task 228349
			
			//Get hover descriptions from feeder
			this.getHoverTexts();
		},
		refreshFragKeys: function () {
			//provider Comp
			if (this.providerFrag) {
				this.providerFrag._oTable.setSelectedContextPaths([]);
				this.providerFrag._oTable.refreshItems();
			}
			// recepient Comp
			if (this.benCompCodeFrag) {
				this.benCompCodeFrag.getContent()[0].removeSelections();
				this.benCompCodeFrag.getSubHeader().getContent()[0].fireSearch({
					query: ""
				});
				this.benCompCodeFrag.getSubHeader().getContent()[0].setValue("");
			}
		},
		addActionFlag: function (dataArray, Action) {
			jQuery.each(dataArray, function (ix, ox) {
				ox.ACTION = Action;
			});
			return dataArray;
		},
		_fdrReadRouteMatchedMethod: function (oEvent) {
			var context = this;
			this.createLocalModelToDetail();
			this.getFDRStatusAll();
			this.setPropInModel("loadIndicatorModel", "/detailLoaded", true);
			if (!this.getPropInModel("loadIndicatorModel", "/masterLoaded")) { //@Task 321452 -  && !this.getPropInModel("loadIndicatorModel", "/fromFDRList")
				this.setPropInModel("loadIndicatorModel", "/detailtoRouteBack", true);
				this.setPropInModel("loadIndicatorModel", "/fdrNo", oEvent.getParameter("arguments").fdrInd);
				this.getRouter().navTo('home');
			} else {
				var fdrno = oEvent.getParameter("arguments").fdrInd;
				var headerDetails = {
					modelName: "fdrPlusODataModel",
					entitySet: "fdrheader",
					filters: this.makeFilterArray(["fdrno"], "EQ", fdrno),
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							var datas = context.addActionFlag(oData.results, "U");
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), datas[0]));
							//@START: Task 319428
							var dbHeaderData = Object.assign(true, {}, datas[0]);
							context.setPropInModel("dbDataModel", "/", jQuery.extend({}, context.getPropInModel("dbDataModel", "/"), dbHeaderData)); 
							//@END: Task 319428
							context.setFDRRoute(datas[0].fdrroute);
							if (datas[0].funtionid && datas[0].serviceid) {
								context.determineDefaultsLineItems();
								context.makeBHIRMandatory(context.getPropInModel("localDataModel", "/workflowflag")); //@Task 232398
							}
							//@START: Task 271625
							if(datas[0].fdrroute === "GCB" || datas[0].fdrroute === "GCF") {
								context.getCoverageInfo();
								if(datas[0].coverage) {
									context.getCoverageRegions(datas[0].coverage);
								}
							}
							//@END: Task 271625
							
							var role = context.getOwnerComponent().getModel("tileIdentityModel").getProperty("/role"); //@Task 319741
							//@START: Task 269676, 319741
							if(datas[0].workflowflag === "X" || role === "SUPADM") {
								context.utilityParser.readChangeLog(context, fdrno); 
							}
							//@END: Task 269676
							
							//@START: Task 341209, 341435
							//Set app as DISPLAY/EDIT
							if(role === "DISPLAY" || datas[0].fdrstatus === "OBSOL" || datas[0].fdrstatus === "RELSD" || datas[0].fdrstatus.startsWith("CL")) {
								context.setPropInModel("localDataModel", "/viewmode", "DISPLAY");
							}
							else {
								context.setPropInModel("localDataModel", "/viewmode", "EDIT");
							}
							//@END: Task 341209, 341435
						}
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(headerDetails);
				var provDetails = {
					modelName: "fdrPlusODataModel",
					entitySet: "provider",
					filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							var datas = context.addActionFlag(oData.results, "U");
							//For + button to first entry in every provider group
							context.addPlusSignForProviders(datas);
							
							//@START: Bug 329735
							//Sort in ascending order of Provider Sub Item No
							if(context.getPropInModel("localDataModel", "/fdrroute") === "DIR") {
								datas.sort(function(a, b) {
									return a.subitemno - b.subitemno;
								});	
							}
							//@END: Bug 329735
							
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
								providerCompanies: datas
							}));
							//@START: Task 319428
							var dbProvData = datas.length ? Object.assign(true, {}, datas[0]) : {};
							context.setPropInModel("dbDataModel", "/provCompanies", dbProvData);
							//@END: Task 319428
							if (context.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
								context.makeRecoveryTypeFilter();
							}
							if ((context.getPropInModel("tileIdentityModel", "/role") === "GSR" || context.getPropInModel("tileIdentityModel", "/role") === "GSRWF" 
								|| context.getPropInModel("tileIdentityModel", "/role") === "SUPADM") //@Task 315423, 319741
								&& context.getPropInModel("localDataModel", "/benifCompanies").length) {
								context.checkForContractsSearcher();
							}
							//@START: Task 315423
							//For ADMIN and R&A tiles, To Date should be disabled
							else {
								context.setModel(new sap.ui.model.json.JSONModel({allowTo: false}), "contractDatesModel");
							}
							//@END: Task 315423
						}
						//@START: Bug 233072
						else {
							context.showMessage("Add atleast 1 Provider to get valid contracts");
						}
						//@END: Bug 233072
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(provDetails);
				var benDetails = {
					modelName: "fdrPlusODataModel",
					entitySet: "beneficiary",
					filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
					urlParameters: {},
					success: function (oData) {
						//@START: Bug 233072
						if (oData.results.length) {
							var datas = context.addActionFlag(oData.results, "U");
							//@START: Bug 329735
							//Sort in ascending order of Beneficiary Item No
							datas.sort(function(a, b) {
								return a.itemno - b.itemno;
							});
							//@END: Bug 329735
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
								benifCompanies: datas
							}));
							//@START: Task 319428
							var dbBenData = datas.length ? Object.assign(true, {}, datas[0]) : {};
							context.setPropInModel("dbDataModel", "/benCompanies", dbBenData);
							//@END: Task 319428
							if ((context.getPropInModel("tileIdentityModel", "/role") === "GSR" || context.getPropInModel("tileIdentityModel", "/role") === "GSRWF" 
								|| context.getPropInModel("tileIdentityModel", "/role") === "SUPADM") //@Task 315423, 319741
								&& context.getPropInModel("localDataModel", "/providerCompanies").length) {
								context.checkForContractsSearcher();
							}
							//@START: Task 315423
							//For ADMIN and R&A tiles, To Date should be disabled
							else {
								context.setModel(new sap.ui.model.json.JSONModel({allowTo: false}), "contractDatesModel");
							}
							//@END: Task 315423
							
							if (context.getPropInModel("localDataModel", "/business") === "UP") {
								context.vendorDetermination();
							}
						} else {
							context.showMessage("Add atleast 1 Beneficiary to get valid contracts");
						}
						//@END: Bug 233072
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(benDetails);
				var projDetails = {
					modelName: "fdrPlusODataModel",
					entitySet: "fdrproject",
					filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
					urlParameters: {},
					success: function (oData) {
						if (context.getPropInModel("localDataModel", "/business") !== 'UP') {
							if (oData.results.length) {
								var datas = context.addActionFlag(oData.results, "U");
								context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
									fdrproject: datas
								}));
							}
						}
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(projDetails);
				
				//TODO - Commented for Contract Validation issue
				// var contractDetails = {
				// 	modelName: "fdrPlusODataModel",
				// 	entitySet: "fdrcontractkey",
				// 	filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
				// 	urlParameters: {},
				// 	success: function (oData) {
				// 		if (oData.results.length) {
				// 			var datas = context.addActionFlag(oData.results, "U");
				// 			context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
				// 				contractkey: datas
				// 			}));
				// 			// context.setMinMaxFDRValidity(oData.results); //@Task 221802
				// 			if (context.getPropInModel("localDataModel", "/providerCompanies").length && context.getPropInModel("localDataModel",
				// 					"/benifCompanies").length) {
				// 				context.checkForContractsSearcher();
				// 			}
				// 		}
				// 	},
				// 	error: function (oError) {

				// 	}
				// };
				// this.readDataFromOdataModel(contractDetails);
				var rccoding = {
					modelName: "fdrPlusODataModel",
					entitySet: "rccoding",
					filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							var datas = context.addActionFlag(oData.results, "U");
							//@START: Bug 329735
							//Sort in ascending order of Item No
							datas.sort(function(a, b) {
								return a.itemno - b.itemno;
							});
							//@END: Bug 329735
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
								rccoding: datas
							}));
						}
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(rccoding);
				var addlProject = {
					modelName: "fdrPlusODataModel",
					entitySet: "fdradditionalproject",
					filters: this.makeFilterArray(["fdrno"], "EQ", oEvent.getParameter("arguments").fdrInd),
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							var datas = context.addActionFlag(oData.results, "U");
							//@START: Bug 329735
							//Sort in ascending order of Item No
							datas.sort(function(a, b) {
								return a.itemno - b.itemno;
							});
							//@END: Bug 329735
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
								addlProjDetails: datas
							}));
						} else {
							context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
								addlProjDetails: []
							}));
						}
					},
					error: function (oError) {

					}
				};
				this.readDataFromOdataModel(addlProject);
				context.utilityParser.readAuditLog(context, oEvent.getParameter("arguments").fdrInd); //@Task 223652
				
				//@START: Task 321452
				//this.setPropInModel("loadIndicatorModel", "/fromFDRList", false);
				//this.setPropInModel("loadIndicatorModel", "/masterLoaded", false);
				//@END: Task 321452
			}
		},
		_fdrCreateRouteMatchedMethod: function (oEvent) {
			var context = this;
			this.createLocalModelToDetail();
			this.setPropInModel("localDataModel", "/ACTION", "C");
			this.setPropInModel("localDataModel", "/currency", "USD");
			//@START: Task 280675
			this.setBusy(true);
			var aliasID = this.getPropInModel("userDetailsModel", "/name");
			this.setPropInModel("localDataModel", "/createdby", aliasID);
			this.setPropInModel("localDataModel", "/initiator", aliasID);
			this.getFDRStatusAll().then(function() {
				return context.utilityParser.activeDirectorySearch(context, "aliasId=" + aliasID);
			}).then(function(results) {
				if(results.length) {
					context.setPropInModel("localDataModel", "/initiatorname", results[0].displayName);
				}
				context.setBusy(false);
			}).catch(function(oerror) {
				context.setBusy(false);
			});
			//@END: Task 280675
		},
		onBudgetPress: function (noPopup) {
			var context = this,
				aCurrentBudgetList = [],
				aOrigBudgetList = [];
			var action = this.getPropInModel("localDataModel", "/ACTION");
			//get adlProject details 
			if (this.getPropInModel("localDataModel", "/todate") && this.getPropInModel("localDataModel", "/fromdate")) {
				aOrigBudgetList = this.getPropInModel("localDataModel", "/addlProjDetails").filter(function (e) {
					return e.code === "PLBD";
				});
				//no of years between start and end date 
				var aYears = [];
				var fromDate = new Date(this.getPropInModel("localDataModel", "/fromdate"));
				var toDate = new Date(this.getPropInModel("localDataModel", "/todate"));
				for (var i = fromDate.getFullYear(); i <= toDate.getFullYear(); i++) {
					aYears.push(i);
				}
				
				//@START: Task 300908
				//Return only those years chosen by the user
				aOrigBudgetList = aOrigBudgetList.filter(function (ox) {
					return aYears.indexOf(parseInt(ox.value)) !== -1;
				});
				//@END: Task 300908

				//Add all previous entries based on years selected
				aOrigBudgetList.forEach(function (ox, ix) {
					var obj = {};
					obj.fdrno = ox.fdrno;
					obj.providercompcode = ox.providercompcode;
					obj.provideritemno = ox.provideritemno;
					obj.providersubitemno = ox.providersubitemno;
					obj.code = "PLBD";
					obj.itemno = ox.itemno;
					obj.value = ox.value;
					obj.description = (ix === 0 && aYears.length === 1 ? context.getPropInModel("localDataModel", "/planbudgetvalue") : ox.description);
					obj.editable = (ix === 0 && aYears.length === 1 ? false : true);
					obj.ACTION = "C"; //@Task 300908 //action === "U" ? "U" : "C";
					obj.deletionflag = "N"; //@Task 300908 //ox.deletionflag;
					aCurrentBudgetList.push(obj);
				});
				
				//@START: Task 300908
				// //Get Plan Budget values maintained in SCP
				// var aSameBudgetYear = aCurrentBudgetList.filter(function (o) {
				// 	return aYears.some(function (i) {
				// 		return o.value == i;
				// 	});
				// });
				// //If the same record exists previously, set deletionflag to N (in case previous value is X)
				// aSameBudgetYear.forEach(function (oBudget) {
				// 	oBudget.deletionflag = "N";
				// });
				//@END: Task 300908

				//Get additional entries added in this session (not maintained in SCP)
				var aExtraBudgetYear = aYears.filter(function (o) {
					return !aOrigBudgetList.some(function (i) {
						return o == i.value;
					});
				});
				aExtraBudgetYear.forEach(function (ox, ix) {
					var obj = {};
					obj.code = "PLBD";
					obj.value = "" + ox;
					obj.description = ""; //By default empty
					//1 year - take from Plan Budget Value, else keep it open for edit
					if (aYears.length === 1) { // && ix + aCurrentBudgetList.length === 0
						obj.description = context.getPropInModel("localDataModel", "/planbudgetvalue");
						obj.editable = false;
					}
					//For more than 1 year
					else {
						obj.editable = true;
					}
					obj.ACTION = "C";
					obj.deletionflag = "N";
					aCurrentBudgetList.push(obj);
				});
				
				//@START: Task 300908
				// // Get Plan Budget entries removed in this session
				// var aBudgetYearNotIn = aOrigBudgetList.filter(function (o) {
				// 	return aYears.indexOf(parseInt(o.value)) === -1;
				// });
				// //Update deletion flag to remove from list
				// aBudgetYearNotIn.forEach(function (oBudget) {
				// 	aCurrentBudgetList.forEach(function (o) {
				// 		if (o.value == oBudget.value) {
				// 			o.deletionflag = "X";
				// 		}
				// 	});
				// });
				//@END: Task 300908
				
				//TODO: Set first value as read-only and equal to plan budget value
				
				this.setPropInModel("localDataModel", "/addlProjDetails", aCurrentBudgetList);
				var values = {
					fragmentName: "BudgetList",
					fragVariable: "budgetListFrag"
				};
				if(noPopup !== true) {
					this.onDialogFetch(values);
				}
			} else {
				this.showMessage("Please Select Start Date and End Date before Budget Selection");
			}
		},
		onProviderAdd: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			values.setData = true;
			values.filterToSet = this.makeFilterArray(["Sysid"], "EQ", "SERP").concat(this.makeFilterArray(["Sysid"], "EQ", "GSAP"));
			this.onDialogFetch(values);
			this.showMessageToast("Please Select only the Providers you wish to add.");
		},
		onRecepientAdd: function (oEvent) {
			if (!this.getPropInModel("localDataModel", "/providerCompanies").length) {
				this.showMessage("Please Select atleast 1 Provider before selecting Benificiary");
				return;
			}
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			//Clear Beneficiary Comp Codes
			values.setData = true;
			this.onDialogFetch(values);
			//@START: Task 321442
			if(this.getPropInModel("localDataModel", "/fdrroute") !== "GCB" && this.getPropInModel("localDataModel", "/fdrroute") !== "GCF") {
				this.showMessageToast("Please Select only the Benficiaries you wish to add.");	
			}
			//@END: Task 321442
		},
		onBenFragClose: function () {
			if (this.benCompCodeFrag && this.benCompCodeFrag.isOpen()) {
				this.benCompCodeFrag.close();
			}
		},
		onMultiPropSearch: function (oEvent) { //@Task 341121
			var filters = [];
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			//@START: Task 341121
			var query = oEvent.getParameter("query") ? oEvent.getParameter("query") : oEvent.getParameter("value");
			if (query && values.hasOwnProperty("searchField")) {
				filters = this.makeFilterArray(values.searchField.split(","), "Contains", query);
			}
			//this.executeFilter(oEvent.getSource().getParent().getParent().getContent()[0].getBinding("items"), filters);
			var bindings = oEvent.getSource().getBinding("items");
			if(values.hasOwnProperty("modelName") && values.modelName === "oBenCompCodeModel") {
				bindings = oEvent.getSource().getParent().getParent().getContent()[0].getBinding("items");
			}
			if(filters.length) {
				bindings.filter(new sap.ui.model.Filter(filters, false));	
			}
			else {
				bindings.filter(filters, "");
			}
			//@END: Task 341121
		},
		onSelectFromAllocationSet: function () {
			if (this["benCompCodeFrag"] && this["benCompCodeFrag"].isOpen()) {
				this["benCompCodeFrag"].close();
			}
			this.onDialogFetch({
				fragmentName: "AllocationSetSelection",
				fragVariable: "alloSetFrag"
			});
		},
		onProviderSelectionConfirm: function (oEvent) {
			var addPayload = [],
				context = this;
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());

			if (values.hasOwnProperty("modelName")) {
				var selectedItems = [];
				jQuery.each(oEvent.getSource()._oTable.getSelectedContextPaths(), function (ix, ox) {
					selectedItems.push(oEvent.getSource()._oTable.getModel("oProvCompCodeModel").getProperty(ox));
				});
				jQuery.each(selectedItems, function (ix, ox) {
					// var props = ox.getBindingContext(values.modelName).getProperty("");
					var props = ox;
					addPayload.push({
						ACTION: "C",
						fdrno: context.getPropInModel("localDataModel", "/fdrno") ? context.getPropInModel("localDataModel", "/fdrno") : "", // key
						itemno: "", //key
						subitemno: "10", //key
						providercompcode: props.Erpcc,
						providersystem: props.Sysid,
						providergroupcompany: props.Grpcc,
						provideraoo: props.Aofop,
						provideraoodesc: props.Aotxt, //@Task 252320
						providercosttyp: props.Sysid === "SERP" ? "WBS" : "CC", //@Task 304168
						createdby: context.getPropInModel("userDetailsModel", "/name"),
						createdon: "",
						//@START: Task 274288
						addPlus: true,
						deletionflag: "N"
						//@END: Task 274288
					});
				});
				var oldData = this.getView().getModel("localDataModel").getProperty("/providerCompanies");
				if (oldData.length === 1 && oldData[0].providersystem === "SERP" && addPayload.length) {
					this.showMessage("Can not add multiple Providers when, Provider System is SERP.");
					return;
				}
				if (this.getPropInModel("localDataModel", "/providerCompanies").length && this.getPropInModel("localDataModel", "/benifCompanies")
					.length && this.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
					this.showMessage("Can Not Add multiple Providers For Direct Route.");
					return;
				}
				//@START: Task 274288
				var oldActiveData = oldData.filter(function(o) {
					return o.deletionflag !== "X";
				});
				var compArrayToAdd = this.checkForDuplicates(oldActiveData, addPayload, ["providercompcode", "providersystem", "providergroupcompany",
					"provideraoo"
				]);
				//@END: Task 274288
				//check if all the providers belog to the same system
				if (compArrayToAdd.uniqueArray.length) {
					var uniqSystems = UnderScoreParse.uniq(compArrayToAdd.uniqueArray, ["providersystem"]);
					if (uniqSystems.length > 1) {
						this.showMessage("All Provider Systems must be from same system, Combination is not allowed");
						return;
					} else {
						if (oldData.length && UnderScoreParse.uniq(oldData, ["providersystem"])[0].providersystem !== uniqSystems[0].providersystem) {
							this.showMessage(
								"Previously Selected Provider System does not match with the current selection. This Combination is not Allowed");
							return;
						}
					}
				}
				oldData = oldData.concat(compArrayToAdd.uniqueArray);
				//this.addPlusSignForProviders(oldData); //@Task 274288
				this.getView().getModel("localDataModel").setProperty("/providerCompanies", oldData);
				this.defaultCostObjects("P");
				this.determineItemNo();
				//if (!this.getPropInModel("localDataModel", "/fdrno")) {//@Bug 233072
				var busines = oldData[0].providersystem === "SERP" ? "UP" : "DS";
				this.setPropInModel("localDataModel", "/business", busines);
				if (oldData.length === 1 && this.getPropInModel("localDataModel", "/fdrroute") !== 'GCB' && 
					this.getPropInModel("localDataModel", "/fdrroute") !== 'GCF' && this.getPropInModel("localDataModel", "/fdrroute") !== 'EBD') {
					this.setFDRRoute("DIR");
					this.makeRecoveryTypeFilter();
				} else if (this.getPropInModel("localDataModel", "/fdrroute") !== 'GCB' && this.getPropInModel("localDataModel", "/fdrroute") !== 'GCF') {
					this.setFDRRoute("EBD");
				}
				//}//@Bug 233072
				//@START: Bug 233072
				if (this.getPropInModel("localDataModel", "/benifCompanies").length) {
					this.onSave(true);
				}
				//@END: Bug 233072
			}
		},
		makeRecoveryTypeFilter: function () {
			var context = this;
			jQuery.each(this.getView().getContent()[0].getContent()[6].getContent()[0].getFormContainers(), function (ix, ox) {
				jQuery.each(ox.getFormElements(), function (iy, oy) {
					jQuery.each(oy.getFields(), function (iz, oz) {
						if (oz.getMetadata().getElementName() === "sap.m.Select" && oz.getBindingInfo("selectedKey").hasOwnProperty("parts") && oz
							.getBindingInfo("selectedKey").parts.length && oz.getBindingInfo(
								"selectedKey").parts[0].path === "/fdrrecovertype") {
							context.executeFilter(oz.getBinding("items"), context.makeFilterArray(["systemid"], "EQ", context.getPropInModel(
								"localDataModel",
								"/providerCompanies/0/providersystem")));
							// oz.getBinding("items").filter();
							if (oz.getItems().length && !context.getPropInModel("localDataModel", "/fdrrecovertype")) {
								context.setPropInModel("localDataModel", "/fdrrecovertype", "");
							}
						}
					});
				});
			});
		},
		onAddSubProvider: function (oEvent) {
			var props = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty("");
			var maxSubItem = parseInt(UnderScoreParse.max(this.getPropInModel("localDataModel", "/providerCompanies").filter(function (e) {
				return e.itemno === props.itemno;
			}), function (s) {
				return parseInt(s.subitemno);
			}).subitemno);
			var toAddProps = jQuery.extend({}, props, {
				ACTION: "C",
				subitemno: (maxSubItem + 10).toString(),
				//@START: Bug 232767
				providercostobj: "",
				projectdef: "",
				//@END: Bug 232767
				engagmentstatus: "",
				engagmentno: "",
				prprftcenter: "",
				cleancostcenter: "",
				cleancostflag: "",
				//@START: Task 274288
				addPlus: false,
				deletionflag: "N"
				//@END: Task 274288
			});
			var oldData = this.getPropInModel("localDataModel", "/providerCompanies");
			oldData.push(toAddProps);
			//@START: Task 274288
			//Group by Item Number
			var aProviderData = this.addPlusSignForProviders(oldData);
			this.setPropInModel("localDataModel", "/providerCompanies", aProviderData);
			//@END: Task 274288
		},
		onBenCompCodeSelectionConfirm: function (oEvent) {
			var selectedRecords = [];
			var selContexts = this.benCompCodeFrag.getContent()[0].getSelectedContextPaths();
			var context = this;
			jQuery.each(selContexts, function (ix, ox) {
				selectedRecords.push(context.getPropInModel("oBenCompCodeModel", ox));
			});
			if (selectedRecords.length) {
				this.addToBenficiaryList(selectedRecords, "serp");
			}
			if (this.benCompCodeFrag && this.benCompCodeFrag.isOpen()) {
				this.benCompCodeFrag.close();
			}
		},
		onLineItemDelete: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			var selectedIndxs = oEvent.getSource().getParent().getParent().getContent()[1].getSelectedIndices();
			var rows = oEvent.getSource().getParent().getParent().getContent()[1].getBinding("rows").oList;
			var selectedData = [];
			jQuery.each(selectedIndxs, function (ix, ox) {
				selectedData.push(rows[ox]); 
			});
			if (selectedData.length) {
				//@START: Bug 248725
				/*var aData = (values.bindingValue === "providerCompanies") ? this.getPropInModel("localDataModel", "/providerCompanies") : 
					this.getPropInModel("localDataModel", "/benifCompanies");
				if(aData && aData.length === selectedData.length) {
					this.showMessage("Cannot delete - FDR requires at least 1 Provider and Recipient");
					return;
				}*/
				var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
				//Direct route - Deletion of Provider
				if(values.bindingValue === "providerCompanies" && fdrroute === "DIR") {
					var aBenifData = this.getPropInModel("localDataModel", "/benifCompanies");
					var aEngBenifData = aBenifData.filter(function(o) {
						return (o.engagementno && o.engagementno !== "");
					});
					if(aEngBenifData.length) {
						this.showMessage("Cannot Delete Line Item once tagged to an Engagement.");
						return;
					}
				}
				
				//EBD - Deletion of Recipient
				if(values.bindingValue === "benifCompanies" && fdrroute === "EBD") {
					var eBenifWBSData = selectedData.filter(function (e) {
						return ((e.sipcrecwbse && e.sipcrecwbse !== "") || (e.mcswbsse && e.mcswbsse !== "")); //@Bug 233072 
					});
					if(eBenifWBSData.length) {
						this.showMessage("Cannot Delete Line Item once tagged to SIPC/MCS WBSE");
						return;
					}
				}
				//@END: Bug 248725
				
				var aProjEngData = selectedData.filter(function (e) {
					return ((e.projectdef && e.projectdef !== "") || (e.engagmentno && e.engagmentno !== "")); //@Bug 233072 
				});
				if(aProjEngData.length) {
					this.showMessage("Cannot Delete Line Item once tagged to the Project/Engagement."); //@Bug 233072 
				}
				else {
					var deletableData = [];
					if(values.bindingValue === "providerCompanies") {
						if(fdrroute === "DIR") {
							deletableData = selectedData.filter(function (e) {
								return (!e.projectdef || e.projectdef === ""); //@Bug 233072 
							});
						}
						else {
							deletableData = selectedData.filter(function (e) {
								return ((!e.projectdef || e.projectdef === "") || (!e.engagmentno || e.engagmentno === "")); //@Bug 233072 
							});
						}
					}
					else if(values.bindingValue === "benifCompanies") {
						deletableData = selectedData.filter(function (e) {
								return (!e.engagmentno || e.engagmentno === ""); //@Bug 233072 
							});
					}
				//if (deletableData.length) {
					var oldData = this.getPropInModel("localDataModel", "/" + values.bindingValue);
					var newData = [];
					jQuery.each(oldData, function (ix, ox) {
						var check = true;
						jQuery.each(deletableData, function (iy, oy) {
							if (ox.fdrno === oy.fdrno && ox.itemno === oy.itemno && ox.subitemno === oy.subitemno) {
								check = false;
							}
						});
						if (check) {
							newData.push(ox);
						}
					});
					//@START: Bug 233072
					//Delete entries
					var fdrno = this.getPropInModel("localDataModel", "/fdrno");
					var tableName = values.bindingValue === "providerCompanies" ? "provider" : "beneficiary";
					this.deleteProvBen(tableName, fdrno, deletableData, values, newData);
					//@END: Bug 233072
				// } else {
				// 	this.showMessage("Cannot Delete Line Item once tagged to the Project/Engagement."); //@Bug 233072 
				}
				oEvent.getSource().getParent().getParent().getContent()[1].setSelectedIndex(-1);
			} else {
				this.showMessage("Please Select Line items before Delete");
			}
		},
		allocatioSetAssignToFDR: function (props) {
			var context = this;
			var route = "";
			if (props.subbusiness === "GCB" || props.subbusiness === "GCF") {
				//@START: Task 325086
				if(!props.subset || props.subset === "#") {
					context.showMessage("No subset found. Please select another Allocation Set");
					return;
				}
				//@END: Task 325086
				route = props.subbusiness;
				if (!this.getPropInModel("localDataModel", "/providerCompanies/0/prprftcenter")) {
					var costType = this.getPropInModel("localDataModel",
						"/providerCompanies/0/cleancostcenter") || this.getPropInModel("localDataModel",
						"/providerCompanies/0/providercosttyp") === 'CC' ? 'CC' : "WBS";
					var costObj = this.getPropInModel("localDataModel",
						"/providerCompanies/0/cleancostcenter") ? this.getPropInModel("localDataModel",
						"/providerCompanies/0/cleancostcenter") : this.getPropInModel("localDataModel",
						"/providerCompanies/0/providercostobj");
					if (costObj) {
						this.onProfitCenterFetch({
							providercompcode: this.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode"),
							enagementType: "PR",
							recipSystem: "GSAP",
							recipCompCode: "GB32",
							recoveryType: "TM",
							position: "10",
							provCostType: costType,
							provCostObj: this.getPropInModel("localDataModel", "/providerCompanies/0/cleancostcenter") //
						}).then(function (profitCenter) {
							context.setPropInModel("localDataModel", "/providerCompanies/0/prprftcenter", profitCenter);
						}).catch(function (error) {
							context.showMessageToast("error");
						});
					}
				}
				this.setPropInModel("localDataModel", "/currency", ((route === "GCB" || route === "GCF") && props.regionalflag !== null) ? "EUR" : "USD"); //@Task 234638
				this.setPropInModel("localDataModel", "/subset", props.subset); //@Task 325086
			} else {
				route = "EBD";
			}
			//add header dependent values 
			this.setPropInModel("localDataModel", "/benifCompanies", []);
			this.setPropInModel("localDataModel", "/allocationsetid", props.allocationsetid);
			this.setPropInModel("localDataModel", "/business", props.business);
			this.setPropInModel("localDataModel", "/subbusiness", props.subbusiness);
			this.setFDRRoute(route);
			this.readDataFromOdataModel({
				"modelName": "allocationSetODataModel",
				"entitySet": "allocationsetitem",
				"filters": this.makeFilterArray(["allocationsetid"], "EQ", props.allocationsetid),
				"urlParameters": {},
				"success": function (oData) {
					context.addToBenficiaryList(oData.results, "alloSet");
				},
				"error": function () {}
			});
		},
		onAllocationSetSlectionConfirm: function (oEvent) {
			var context = this;
			var props = oEvent.getParameter("selectedItem").getBindingContext("allocationSetODataModel").getProperty("");
			//@START: Bug 233072
			// if (this.getPropInModel("localDataModel", "/fdrno")) {
			// 	var msg = "You can not select a new Allocation Set once FDR is generated";
			// 	this.showMessage(msg, "Alert", function (action) {}, []);
			// } else 
			if (!this.getPropInModel("localDataModel", "/benifCompanies").length) { //!this.getPropInModel("localDataModel", "/fdrno") && 
				//@END: Bug 233072
				this.allocatioSetAssignToFDR(props);
			} else if (this.getPropInModel("localDataModel", "/benifCompanies").length && this.getPropInModel("localDataModel",
					"/allocationsetid") && this.getPropInModel("localDataModel", "/allocationsetid") !==
				props.allocationsetid.toString()) { // && !this.getPropInModel("localDataModel", "/fdrno") -- @Bug 233072
				var msg = "Previously Selected Allocation Set ID is: " + this.getPropInModel("localDataModel", "/allocationsetid").toString() +
					" and now the selected Allocation Set ID is: " + props.allocationsetid.toString() + ". Do you wish to continue?.";
				this.showMessage(msg, "Confirm", function (action) {
					if (action === "YES") {
						context.allocatioSetAssignToFDR(props);
					}
				}, [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO]);
			} else if (this.getPropInModel("localDataModel", "/benifCompanies").length && !
				this.getPropInModel("localDataModel", "/allocationsetid")) { //!this.getPropInModel("localDataModel", "/fdrno") &&  -- @Bug 233072
				var msg =
					"Previously FDR Route was Direct, By Selecting the Allocation Set, you will change the Route and Benficiary list, Do you wish to Continue?.";
				this.showMessage(msg, "Confirm", function (action) {
					if (action === "YES") {
						context.allocatioSetAssignToFDR(props);
					}
				}, [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO]);
			}
		},
		checkForContractsSearcher: function () {
			var context = this;
			this.setModel(new sap.ui.model.json.JSONModel(), "contractMasterLocalModel");
			
			this.getContractDetails().then(function (contractDetails) {
				context.setModel(new sap.ui.model.json.JSONModel({
					allData: contractDetails,
					functions: UnderScoreParse.uniq(contractDetails, ["functionid"]),
					services: UnderScoreParse.uniq(contractDetails, ["serviceid"]),
					activties: UnderScoreParse.uniq(contractDetails, ["activityid"])
				}), "contractSearchLocalModel");
				return context.getContractDates();
			}).then(function(contractDates) {
				context.makeContractDetailsModels(contractDates);
			}).catch(function (msg) {
				context.showMessage(msg);
			});
		},
		addToBenficiaryList: function (listToAdd, from) {
			var context = this;
			var mapping = {
				alloSet: [{
					field: "erpcomcode",
					map: "benificiarycompanies"
				}, {
					field: "beneficiarycompcode",
					map: "benificiarycompanies"
				}, {
					field: "resys",
					map: "systemid"
				}, {
					field: "rcgrpcomp",
					map: "grpcomp"
				}, {
					field: "rcaoo",
					map: "aoo"
				}],
				serp: [{
					field: "erpcomcode",
					map: "Erpcc"
				}, {
					field: "beneficiarycompcode",
					map: "Erpcc"
				}, {
					field: "resys",
					map: "Sysid"
				}, {
					field: "rcgrpcomp",
					map: "Grpcc"
				}, {
					field: "rcaoo",
					map: "Aofop"
				}, 
				//@START: Task 252320
				{
					field: "rcaoodesc",
					map: "Aotxt"
				}]
				//@END: Task 252320
			};
			
			//@START: Task 271625
			var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
			if(fdrroute === "GCB" || fdrroute === "GCF") {
				mapping.alloSet = mapping.alloSet.concat([{
					field: "invcompcode",
					map: "benificiarycompanies"
				}, {
					field: "invgrpcomp",
					map: "grpcomp"
				}, {
					field: "invccaoo",
					map: "aoo"
				},
				//@START: Task 325086
				{
					field: "refofbusiness",
					map: "lobcode"
				}]);
				//@END: Task 325086
				mapping.serp = mapping.serp.concat([{
					field: "invcompcode",
					map: "Erpcc"
				}, {
					field: "invgrpcomp",
					map: "Grpcc"
				}, {
					field: "invccaoo",
					map: "Aofop"
				}]);
			}
			//@END: Task 271625
			
			var toAddArray = [];
			jQuery.each(listToAdd, function (ix, ox) {
				var obj = {
					ACTION: "C",
					bencosttyp: "CC",
					codeby: "", //@Task 241270
					deletionflag: "N" //@Task 274288
				};
				jQuery.each(mapping[from], function (iy, oy) {
					obj[oy.field] = ox[oy.map];
					if (oy.field === "resys" && (ox[oy.map] === "EPBP" || ox[oy.map] === "EPBR")) { //@Task 302226
						obj["autoapproval"] = "Y";
					}
				});
				if (!jQuery.isEmptyObject(obj)) {
					obj.fdrno = context.getPropInModel("localDataModel", "/fdrno") ? context.getPropInModel("localDataModel", "/fdrno") : ""; // key
					toAddArray.push(obj);
				}
			});
			var oldData = this.getPropInModel("localDataModel", "/benifCompanies");
			//@START: Task 274288
			var oldActiveData = oldData.filter(function(o) {
				return o.deletionflag !== "X";
			});
			var compArrayToAdd = this.checkForDuplicates(oldActiveData, toAddArray, ["beneficiarycompcode", "resys", "rcgrpcomp",
				"rcaoo"
			]);
			//@END: Task 274288
			//@START: Task 271625
			if(fdrroute === "GCB" || fdrroute === "GCF") {
				this.getCoverageInfo();//@Task 271625
			}
			if (this.getPropInModel("localDataModel", "/coverage") && this.getPropInModel("localDataModel", "/region")) {
				this.getLeg2SOCurrency(compArrayToAdd.uniqueArray).then(function(benifCompanies) {
					oldData = oldData.concat(benifCompanies);
					context.getView().getModel("localDataModel").setProperty("/benifCompanies", oldData);
					context.saveBeneficiaryList();
				});
			} else {
				oldData = oldData.concat(compArrayToAdd.uniqueArray);
				if (oldData.length > 1 && this.getPropInModel("localDataModel", "/fdrroute") === 'DIR' && this.getPropInModel(
						"localDataModel", "/business") === 'DS') {
					this.showMessage("For Direct you can not add more than 1 Beneficiary");
					return;
				}
				this.getView().getModel("localDataModel").setProperty("/benifCompanies", oldData);
				this.saveBeneficiaryList();
			}
			//@END: Task 271625
		},
		//@START: Task 271625
		saveBeneficiaryList: function() {
			this.determineItemNo();
			if (this.getPropInModel("localDataModel", "/subset")) {
				this.onSubsetValidator(this.getPropInModel("localDataModel", "/subset"));
			} else {
				this.determineSubItemNo();
			}
			//@START: Bug 233072
			this.onSave(true);
			//@END: Bug 233072
			this.defaultCostObjects("B");
			if (this.getPropInModel("localDataModel", "/fdrroute") === "DIR") {
				this.vendorDetermination();
			}
		},
		//@END: Task 271625
		vendorDetermination: function () {
			var promiseArray = [];
			var context = this;
			if (context.getPropInModel("localDataModel", "/business") === 'UP') {
				jQuery.each(this.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
					if (!ox.vendorno && ox.payer && context.getPropInModel("localDataModel", "/dc")) {
						promiseArray.push(new Promise(function (resolve, reject) {
							var obj = {
								id: ix,
								objval: ox
							};
							var salsOrg = context.getPropInModel("localDataModel", "/fdrroute") === "DIR" ? context.getPropInModel("localDataModel",
								"/providerCompanies/0/providercompcode") : "GB32";
							context.getView().getModel("serp150ODataModel").read("/DefaultVendorSet", {
								filters: context.makeFilterArray(["Slorg"], "EQ", salsOrg).concat(
									context.makeFilterArray(["Disch"], "EQ", context.getPropInModel("localDataModel", "/dc"))).concat(
									context.makeFilterArray(["Payer"], "EQ", obj.objval.payer)).concat(
									context.makeFilterArray(["Rcsys"], "EQ", obj.objval.resys)),
								success: function (oData) {
									if (oData.results.length) {
										context.setPropInModel("localDataModel", "/benifCompanies/" + obj.id + "/vendorno", oData.results[0].Vendr);
									}
								}
							});
						}));
					}
				});
			}
		},
		//@START: Task 295650
		//Method called when Budget Holder F4 is opened
		onBudgetHolderRequest: function(oEvent) {
			var context = this, values = {};
			context.setBusy(true);
			//Get the custom data
			var customData = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + customData.path;
			var aFields = customData.fieldsToSet.split(",");
			this.fieldsToSet = this.itemsPath + "," + this.itemsPath.replace(aFields[0], aFields[1]);
			//Get payer information
			var payer = this.getPropInModel("localDataModel", this.itemsPath.replace("budgetholder", "payer"));
			if (parseFloat(this.getPropInModel("localDataModel", "/planbudgetvalue")) && payer) {
				//Call to service to get list of Budget Holders
				this.getBudgetHolderSearchOption(payer).then(function(results) {
					if(results.length && results[0].RetMsg) { //@Task 320787
						context.showMessage(results[0].RetMsg); //@Task 320787
						context.setBusy(false);
					}
					else if(results.length) { //@Task 320787
						//Open AD search popup if no budget holders found (i.e., EnableAD = X)
						if(results[0].EnableAD === "X") {
							context.setADSearchDefaults();
							context.setModel(new sap.ui.model.json.JSONModel(), "budgetHolderLocalModel");
							values = {
								fragmentName: "BudgetHolderADSearch",
								fragVariable: "budgetholderadfrag"
							};
							context.onDialogFetch(values);
							context.setBusy(false);
						}
						//Open MOA popup
						else {
							context.setModel(new sap.ui.model.json.JSONModel(), "budgetHolderSerpLocalModel");
							values = {
								fragmentName: "BudgetHolderSearch",
								fragVariable: "budgetholderfrag"
							};
							//Set budget holders list
							context.setPropInModel("budgetHolderSerpLocalModel", "/BudgetHolderSet", results);
							context.onDialogFetch(values);
							context.setBusy(false);
						}
					}
					else {
						context.showMessage("No Budget Holders found");
						context.setBusy(false);
					}
				}).catch(function(oerror) {
					context.showMessage("Error in getting Budget Holders");
					context.setBusy(false);
				});
			} else {
				this.showMessage("Please Add Budget Value/Payer Before Selecting Budget Holder.");
				this.setBusy(false);
			}
		},
		
		//Check if AD Search is to be enabled or MOA
		getBudgetHolderSearchOption: function(payer) {
			var context = this;
			
			var providerCC = "GB32"; //EBD case
			var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
			if(fdrroute === "DIR") {
				providerCC = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
			}
			var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
			//Filters for getting budget holders
			var aFilters = context.makeFilterArray(["RcSysID"], "EQ", context.getPropInModel(
				"localDataModel", context.itemsPath.replace("budgetholder", "resys")))
				.concat(context.makeFilterArray(["RcComp"], "EQ", context.getPropInModel(
					"localDataModel", context.itemsPath.replace("budgetholder", "erpcomcode"))))
			    .concat(context.makeFilterArray(["Grpcc"], "EQ", context.getPropInModel(
					"localDataModel", context.itemsPath.replace("budgetholder", "rcgrpcomp")))) //++INC0123662
				.concat(context.makeFilterArray(["DisCh"], "EQ", context.getPropInModel("localDataModel", "/dc")))
				.concat(context.makeFilterArray(["Currency"], "EQ", context.getPropInModel("localDataModel", "/currency")))
				.concat(context.makeFilterArray(["Value"], "EQ", context.getPropInModel("localDataModel", "/planbudgetvalue")))
				.concat(context.makeFilterArray(["FDRRoute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
				.concat(context.makeFilterArray(["Payer"], "EQ", payer))
				.concat(context.makeFilterArray(["BHLimitLow"], "EQ", fdrdefaults["BHLOW"]))
				.concat(context.makeFilterArray(["BHLimitHigh"], "EQ", fdrdefaults["BHHGH"]))
				.concat(context.makeFilterArray(["BHCurrency"], "EQ", fdrdefaults["BHCUR"]))
				.concat(context.makeFilterArray(["PrComp"], "EQ", providerCC))
				.concat(context.makeFilterArray(["WBSE"], "EQ", ""));
			//Call to service
			return new Promise(function(resolve, reject) {
				var eventVars = {
					modelName: "serp150ODataModel",
					entitySet: "BudgetHolderSet",
					filters: aFilters,
					urlParameters: "",
					success: function (data) {
						if(data.results) {
							resolve(data.results);
						}
						else {
							reject();
						}
					},
					error: function(oerror) {
						reject();
					}
				};
				context.readDataFromOdataModel(eventVars);
			});
		},
		//@END: Task 295650
		//@START: Task 280675
		//Search MoA table in SERP based on Alias ID/Name
		onBudgetHolderSearch: function(oEvent) {
			var context = this;
			sap.ui.core.BusyIndicator.show(0);
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			var aFilters = this.makeFilterArray(["RcSysID"], "EQ", this.getPropInModel("localDataModel", this.itemsPath.replace("budgetholder", "resys")))
				.concat(this.makeFilterArray(["RcComp"], "EQ", this.getPropInModel("localDataModel", this.itemsPath.replace("budgetholder", "erpcomcode"))))
				.concat(this.makeFilterArray(["Grpcc"], "EQ", this.getPropInModel("localDataModel", this.itemsPath.replace("budgetholder", "rcgrpcomp"))))  //++INC0123662
				.concat(this.makeFilterArray(["DisCh"], "EQ", this.getPropInModel("localDataModel", "/dc")))
				.concat(this.makeFilterArray(["Currency"], "EQ", this.getPropInModel("localDataModel", "/currency")))
				.concat(this.makeFilterArray(["Value"], "EQ", this.getPropInModel("localDataModel", "/planbudgetvalue")))
				.concat(this.makeFilterArray(["FDRRoute"], "EQ", this.getPropInModel("localDataModel", "/fdrroute")))
				.concat(this.makeFilterArray(["Payer"], "EQ", this.getPropInModel("localDataModel", this.itemsPath.replace("budgetholder", "payer"))))
				.concat(this.makeFilterArray(["WBSE"], "EQ", ""));
			var aliasId = this.getPropInModel("localDataModel", "/serpSearchAliasId");
			var name = this.getPropInModel("localDataModel", "/serpSearchName");
			if(!aliasId && !name) {
				sap.ui.core.BusyIndicator.hide();
				this.showMessage("Enter a Alias ID/Name for search");
				return;
			}
			if(aliasId) {
				aFilters = aFilters.concat(this.makeFilterArray(["BhID"], "Contains", aliasId));
			}
			if(name) {
				aFilters = aFilters.concat(this.makeFilterArray(["BhName"], "Contains", name));
			}
			//@START: Task 295650
			var providerCC = "GB32"; //EBD case
			var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
			if(fdrroute === "DIR") {
				providerCC = this.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
			}
			var fdrdefaults = this.getPropInModel("localDataModel", "/fdrdefaults");
			aFilters = aFilters.concat(this.makeFilterArray(["BHLimitLow"], "EQ", fdrdefaults["BHLOW"]))
				.concat(this.makeFilterArray(["BHLimitHigh"], "EQ", fdrdefaults["BHHGH"]))
				.concat(this.makeFilterArray(["BHCurrency"], "EQ", fdrdefaults["BHCUR"]))
				.concat(this.makeFilterArray(["PrComp"], "EQ", providerCC));
			//OData call
			var eventVars = {
				modelName: "serp150ODataModel",
				entitySet: "BudgetHolderSet",
				filters: aFilters,
				urlParameters: "",
				success: function (data) {
					var results = [];
					if(data.results.length) {
						results = data.results;
					}
					context.setPropInModel("budgetHolderSerpLocalModel", "/BudgetHolderSet", results);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(oerror) {
					context.setPropInModel("budgetHolderSerpLocalModel", "/BudgetHolderSet", []);
					sap.ui.core.BusyIndicator.hide();
				}
			};
			context.readDataFromOdataModel(eventVars);
			//@END: Task 295650
		},
		//@END: Task 280675
		onPrProfitCenterSearch: function (oEvent) {
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			if (Itemprops.providersystem === "SERP") {
				this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
					"value").getPath();
				var values = {
					fragmentName: "SERPProfitCenterSearch",
					fragVariable: "serpPrPCfrag",
					compCode: Itemprops.providercompcode
				};
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					var filtersValue = context.makeFilterArray(["Company"], "EQ", values.compCode).concat(
						context.makeFilterArray(["ControllingArea"], "EQ", "SV01").concat(
							context.makeFilterArray(["Language"], "EQ", "E")));
					context.setModel(new sap.ui.model.json.JSONModel(), "serpProfitCenterLocalModel");
					var eventProps = {
						modelName: "serpProjectCreationODataModel",
						entitySet: "ProfitCenterSet",
						filters: filtersValue,
						urlParameters: {},
						success: function (oData) {
							context.setModel(new sap.ui.model.json.JSONModel(oData), "serpProfitCenterLocalModel");
						},
						error: function (oError) {

						}
					};
					context.readDataFromOdataModel(eventProps);
				};
				this.onDialogFetch(values);
			} else {
				this.showMessage("Profit Center Search Only for SERP System");
			}
		},
		onProviderCostObjRequest: function (oEvent) {
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
			var values = {};
			if (this.getPropInModel("localDataModel", "/business") === 'DS') {
				if (this.getPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
						"/providercosttyp") === "WBS") {
					values = {
						fragmentName: "GSAPBillWBSValueHelp",
						fragVariable: "gsapbillwbsFrag",
						projDefField: "projectdef"
					};
				} else {
					values = {
						fragmentName: "GSAPCostCenterSearch",
						fragVariable: "gsapccFrag",
						projDefField: "projectdef"
					};
				}
			} else if (this.getPropInModel("localDataModel", "/business") === 'UP') {
				//@START: Bug 217220
				/*if (this.getPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
						"/providercosttyp") === "WBS") {*/
				values = {
					fragmentName: "SERPWBSValueHelp",
					fragVariable: "serpwbsFrag",
					projDefField: "projectdef"
				};
				/*} else {
					values = {
						fragmentName: "SERPCostCenterSearch",
						fragVariable: "serpccFrag",
						projDefField: "projectdef"
					};
				}*/
				//@END: Bug 217220
			}
			values.initialFilterflag = true;
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			values.initalFilterValue = Itemprops.providercompcode.substring(0, 2);
			this.onDialogFetch(values);
		},
		onBenCostObjRequest: function (oEvent) {
			var custValues = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			var values = {};
			var system, compCodeFil;
			if (custValues.costTypeField === 'bencosttyp') {
				system = Itemprops.resys;
				compCodeFil = Itemprops.erpcomcode.substring(0, 2);
			} else {
				var benLineObj = this.getPropInModel("localDataModel", "/benifCompanies").filter(function (e) {
					return e.itemno === Itemprops.benitemno;
				})[0];
				system = benLineObj.resys;
				compCodeFil = Itemprops.beneficiarycompcode.substring(0, 2);
			}
			if (system !== "SERP") {
				if (this.getPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
						"/" + custValues.costTypeField) === "WBS") {
					values = {
						//@START: INC1848733
						//: "GSAPBillWBSValueHelp", //@Bug 299615
						//fragVariable: "gsapbillwbsFrag" //@Bug 299615
						fragmentName: "GSAPAccAssignWBSValueHelp", 
						fragVariable: "gsapaccassignwbsFrag"
						//@END: INC1848733
					};
				} else {
					values = {
						fragmentName: "GSAPCostCenterSearch",
						fragVariable: "gsapccFrag"
					};
				}
			} else {
				if (this.getPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
						"/" + custValues.costTypeField) === "WBS") {
					if (custValues.costTypeField === 'bencosttyp') {
						values = {
							fragmentName: "SERPWBSValueHelp",
							fragVariable: "serpwbsFrag",
							projDefField: "projectdef"
						};
					} else {
						values = {
							fragmentName: "SERPWBSAccAssin",
							fragVariable: "serpwbsAccFrag",
							projDefField: "projectdef"
						};
					}
				} else {
					values = {
						fragmentName: "SERPCostCenterSearch",
						fragVariable: "serpccFrag",
						projDefField: "projectdef"
					};
				}

			}
			values.initialFilterflag = true;
			values.initalFilterValue = compCodeFil;
			this.onDialogFetch(values);
		},
		onHUBWBSValueHelp: function (oEvent) {
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			//@START: MCS WBS F4 change
			values.beforeOpenExecution = true;
			values.beforeOpenFunction = function (values, context) {
				var oList = context[values.fragVariable]._oList;
				oList.setVisible(false); //Hide list until it is filtered with new entries
				var listBinding = oList.getBinding("items");
				listBinding.filter(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
					context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid"))).concat(
					context.makeFilterArray(["activityid"], "EQ", context.getPropInModel("localDataModel", "/activityid"))).concat(context.makeFilterArray(
					["deletionflag"], "EQ", "N")), "Application");
				context[values.fragVariable].fireSearch({
					value: ""
				});
				oList.attachUpdateFinished(function () {
					oList.setVisible(true); //Show list once the filters are applied and list is refreshed
				});
			};
			//@END: MCS WBS F4 change
			this.onDialogFetch(values);
		},
		onCleanCCSearchHelp: function (oEvent) {
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.onDialogFetch(values);
		},
		onCleanCostCenterChange: function (oEvent) {
			if (!oEvent.getParameter("value")) {
				this.setPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
					"/cleancostflag", "");
			}
		},
		onProviderConfirmerRequest: function (oEvent) {
			var context = this;
			//@START: Task 280675
			var customData = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + customData.path;
			var aFields = customData.fieldsToSet.split(",");
			this.fieldsToSet = this.itemsPath + "," + this.itemsPath.replace(aFields[0], aFields[1]);
			//@END: Task 280675
			
			var values;
			if (this.getPropInModel("localDataModel", "/workflowflag") !== "X") {
				if (this.getPropInModel("localDataModel", "/funtionid") && this.getPropInModel("localDataModel", "/serviceid")) {
					values = {
						fragmentName: "ProviderConfirmerGCR",
						fragVariable: "providerConfirmgcr"
					};
					this.setModel(new sap.ui.model.json.JSONModel(), "providerConfirmerLocalModel"); //@Task 280675
					values.beforeOpenExecution = true;
					values.beforeOpenFunction = function (values, context) {
						var aFilters = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
								context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid"))).concat(
								context.makeFilterArray(["companycode"], "EQ", context.getPropInModel("localDataModel", context.itemsPath.replace(
									"providerconfirmer", "providercompcode"))))
							.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute"))) //@Task 233229
							.concat(context.makeFilterArray(["deletionflag"], "EQ", "N"));
						var oList = context[values.fragVariable].getContent()[1]; //@Task 280675
						oList.setVisible(false); //Hide list until it is filtered with new entries
						//@START: Task 280675
						context.setADSearchDefaults();
						var eventVars = {
							modelName: "fdrPlusFeedOdataModel",
							entitySet: "providerconfirmer",
							filters: aFilters, //@Task 211447
							urlParameters: "",
							success: function (data) {
								var arrayToset = [];
								var results = UnderScoreParse.uniq(data.results, ["providerconfirmerid"]); //@Bug 314052
								jQuery.each(results, function (ix, ox) { //@Bug 314052
									arrayToset.push({
										providerconfirmer: ox["providerconfirmerid"],
										providerconfirmername: ox["providercofirmername"] //@Task 280675
									});
								});
								context.setPropInModel("providerConfirmerLocalModel", "/results", arrayToset);
							},
							error: ""
						};
						context.readDataFromOdataModel(eventVars);
						//@END: Task 280675
						oList.attachUpdateFinished(function () {
							oList.setVisible(true); //Show list once the filters are applied and list is refreshed
						});
					};
					context.onDialogFetch(values);
				} else {
					this.showMessage("Please Select Function Service, before Provider Confirmer");
				}
			} else {
				//@START: Task 285644
				var planbudgetvalue = context.getPropInModel("localDataModel", "/planbudgetvalue");
				var currency = context.getPropInModel("localDataModel", "/currency");
				var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
				var planBudgetLimit = fdrdefaults["PLNBD"] ? parseFloat(fdrdefaults["PLNBD"]) : 1000000;
				if(!planbudgetvalue || !currency) {
					context.showMessage("Please Enter Plan Budget Value/Currency, before Provider Confirmer");
					return;
				}
				//Currency Conversion
				sap.ui.core.BusyIndicator.show(0);
				context.engagementParser.getConvertedAmount(context, planbudgetvalue, currency).then(function(oResult) {
					//@START: Task 320787
					if(oResult.RetMsg) {
						context.showMessage(oResult.RetMsg);
						sap.ui.core.BusyIndicator.hide();
					}
					else {
					//@END: Task 320787
					//MOA
						if(oResult.val >= planBudgetLimit) {
							values = {
								fragmentName: "ProviderConfirmer",
								fragVariable: "providerConfirm"
							};
							context.setModel(new sap.ui.model.json.JSONModel(), "providerConfSerpLocalModel"); //@Task 280675
							values.beforeOpenExecution = true;
							values.beforeOpenFunction = function (values, context) {
								//@START: Task 280675
								var aFilters = [new sap.ui.model.Filter("PrSysID", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", context.itemsPath
										.replace("providerconfirmer", "providersystem"))),
									new sap.ui.model.Filter("PrComp", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", context.itemsPath.replace(
										"providerconfirmer", "providercompcode")))];
								var eventVars = {
									modelName: "serp150ODataModel",
									entitySet: "ProviderConfirmerSet",
									filters: aFilters,
									urlParameters: "",
									success: function (data) {
										context.setPropInModel("providerConfSerpLocalModel", "/ProviderConfirmerSet", data.results);
										sap.ui.core.BusyIndicator.hide();
									},
									error: function(oerror) {
										sap.ui.core.BusyIndicator.hide();
									}
								};
								context.readDataFromOdataModel(eventVars);
								//@END: Task 280675	
								context[values.fragVariable]._oList.refreshItems();
							};	
							context.onDialogFetch(values);
						}
						//AD Search Only
						else {
							values = {
								fragmentName: "ProviderConfirmerGCR",
								fragVariable: "providerConfirmgcr"
							};
							context.setModel(new sap.ui.model.json.JSONModel(), "providerConfirmerLocalModel"); //@Task 280675
							context.setADSearchDefaults();
							sap.ui.core.BusyIndicator.hide();
							context.onDialogFetch(values);
						}
					} //@Task 320787
				}).catch(function(oerror) {
					sap.ui.core.BusyIndicator.hide();
				});
				//@END: Task 285644
			}
		},
		onSoldToValueHelpRequest: function (oEvent) {
			var context = this;
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
			var values = {};
			if (this.getPropInModel("localDataModel", "/fdrroute") === "EBD" || (this.getPropInModel("localDataModel", "/fdrroute") === "DIR" &&
					this.getPropInModel("localDataModel", "/business") === "DS")) {
				values = {
					fragmentName: "GSAPSoldToCustSearch",
					fragVariable: "gsapSoldToFrag"
				};
				this.getView().setModel(new sap.ui.model.json.JSONModel(), "gsapCustSearchLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					sap.ui.core.BusyIndicator.show(0);
					var salesOrgProv, salesOrgBen, aFilters = []; //@Bug 231758
					if (context.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
						salesOrgProv = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
					} else {
						salesOrgProv = "GB32";
					}
					//@START: Bug 231758
					salesOrgBen = context.getPropInModel("localDataModel",
						oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/erpcomcode");
					aFilters = [new sap.ui.model.Filter("SalesOrg", sap.ui.model.FilterOperator.EQ, salesOrgProv),
						new sap.ui.model.Filter("RecErp", sap.ui.model.FilterOperator.EQ, salesOrgBen)
					];
					//@END: Bug 231758
					var eventValues = {
						modelName: "gsapCustSearchOdataModel",
						entitySet: "CustomersSet",
						filters: aFilters, //@Bug 231758
						urlParameters: "",
						success: function (oData) {
							context.setPropInModel("gsapCustSearchLocalModel", "/results", oData.results);
							sap.ui.core.BusyIndicator.hide();
						},
						error: function (oerror) {
							sap.ui.core.BusyIndicator.hide();
						}
					};
					context.readDataFromOdataModel(eventValues);
					context[values.fragVariable]._oList.refreshItems();
				};
			} else if (this.getPropInModel("localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/business") ===
				"UP") {
				values = {
					fragmentName: "SERPSoldToCustSearch",
					fragVariable: "serpSoldToFrag"
				};
				this.getView().setModel(new sap.ui.model.json.JSONModel(), "serpCustSearchLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					var eventValues = {
						modelName: "serp150ODataModel",
						entitySet: "CustomersSet",
						filters: [new sap.ui.model.Filter("SalesOrg", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel",
								"/providerCompanies/0/providercompcode")),
							new sap.ui.model.Filter("ProviderSystem", sap.ui.model.FilterOperator.EQ, "SERP"),
							new sap.ui.model.Filter("RecipientSystem", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", context.itemsPath
								.replace("soldto", "resys"))),
							new sap.ui.model.Filter("RecErp", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", context.itemsPath
								.replace(
									"soldto", "erpcomcode"))),
							new sap.ui.model.Filter("RecAoo", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", context.itemsPath
								.replace(
									"soldto", "rcaoo")))
						],
						urlParameters: "",
						success: function (oData) {
							context.setPropInModel("serpCustSearchLocalModel", "/results", oData.results);
						},
						error: "",
					};
					context.readDataFromOdataModel(eventValues);
					var listBinding = context[values.fragVariable]._oList.getBinding("items");
					//add filter with sales org
					// listBinding.filter(, "Application");
					context[values.fragVariable]._oList.refreshItems();
				};
			}
			this.onDialogFetch(values);
		},
		onInvoiceRecipRequest: function (oEvent) {
			//@START: Task 280675
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			var customData = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + customData.path;
			var aFields = customData.fieldsToSet.split(",");
			this.fieldsToSet = this.itemsPath + "," + this.itemsPath.replace(aFields[0], aFields[1]);
			//@END: Task 280675
			var values = {};
			if (Itemprops.resys === "EPBP" || Itemprops.resys === "EPBR") { //@Task 302227
				values = {
					fragmentName: "InvoiceSearchBLP",
					fragVariable: "invoicFragblp",
					itemsProp: Itemprops,
					amount: this.getPropInModel("localDataModel", "/planbudgetvalue"),
					currency: this.getPropInModel("localDataModel", "/currency")
				};
				if (!this.getPropInModel("localDataModel", "/planbudgetvalue")) {
					this.showMessage("Please add the Plan Value before selection");
					return;
				}
				this.getView().setModel(new sap.ui.model.json.JSONModel(), "consumerSearchBLPLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					//context.setPropInModel("consumerSearchBLPLocalModel", "/invrecipientmsg", "Please wait for some time for the list to load"); //@INVRECIPIENT
					var eventValues = {
						modelName: "serp150ODataModel",
						entitySet: "InvoiceRecipientSet",
						filters: [].concat(context.makeFilterArray(["RcComp"], "EQ", values.itemsProp.erpcomcode))
							.concat(context.makeFilterArray(["RcSysID"], "EQ", values.itemsProp.resys)) //@Task 302227
							.concat(context.makeFilterArray(["MoaAmount"], "EQ", values.amount))
							.concat(context.makeFilterArray(["Currency"], "EQ", values.currency))
							.concat(context.makeFilterArray(["AOO"], "EQ", values.itemsProp.rcaoo))
							.concat(context.makeFilterArray(["GrpComp"], "EQ", values.itemsProp.rcgrpcomp)),
						urlParameters: "",
						success: function (oData) {
							context.setPropInModel("consumerSearchBLPLocalModel", "/results", oData.results.filter(function (e) {
								return e.UserId;
							}));
							//@INVRECIPIENT
							// if(!oData.length) {
							// 	context.setPropInModel("consumerSearchBLPLocalModel", "/invrecipientmsg", "No Invoice Recipients found");
							// }
							sap.ui.core.BusyIndicator.hide();
							//@INVRECIPIENT
						},
						error: function(oerror) {
							//@INVRECIPIENT
							sap.ui.core.BusyIndicator.hide();
							//context.setPropInModel("consumerSearchBLPLocalModel", "/invrecipientmsg", "Error in getting the list of Invoice Recipients");
							//@INVRECIPIENT
						},
					};
					context.readDataFromOdataModel(eventValues);
					context[values.fragVariable]._oList.refreshItems();
				};
				//@INVRECIPIENT
				values.afterOpenExecution = true;
				values.afterOpenFunction = function() {
					sap.ui.core.BusyIndicator.show(0);
				};
				//@INVRECIPIENT
			} else {
				values = {
					fragmentName: "InvoiceSearchHelp",
					fragVariable: "invoicFrag",
					itemsProp: Itemprops
				};
				if (!values.itemsProp.soldto) {
					this.showMessage("Please add Sold To before Invoice Recepient determination");
					return;
				}
				this.getView().setModel(new sap.ui.model.json.JSONModel(), "consumerSearchLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					context.setADSearchDefaults(); //@Task 280675
					var providerCompCode = "GB32";
					if (context.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
						providerCompCode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
					}
					var eventValues = {
						modelName: "fdrPlusFeedOdataModel",
						entitySet: "consumerdetermination",
						filters: [].concat(context.makeFilterArray(["providercompcode"], "EQ", providerCompCode))
							.concat(context.makeFilterArray(["providercompcode"], "EQ", "ALL"))
							.concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
							.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
							.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
							.concat(context.makeFilterArray(["soldtocustomer"], "EQ",values.itemsProp.soldto))
							.concat(context.makeFilterArray(["soldtocustomer"], "EQ", "ALL"))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), //@Bug 302234
						urlParameters: "",
						success: function (oData) {
							context.setPropInModel("consumerSearchLocalModel", "/results", oData.results.filter(function (e) {
								return e.invoicerecipient;
							}));
						},
						error: "",
					};
					context.readDataFromOdataModel(eventValues);
					context[values.fragVariable].getContent()[1].refreshItems();//@Task 280675
				};
			}
			this.onDialogFetch(values);
		},
		//@INVRECIPIENT
		onHelpCancel: function() {
			sap.ui.core.BusyIndicator.hide();
		},
		//@INVRECIPIENT
		onConsumerRequest: function (oEvent) {
			//@START: Task 280675
			var customData = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + customData.path;
			var aFields = customData.fieldsToSet.split(",");
			this.fieldsToSet = this.itemsPath + "," + this.itemsPath.replace(aFields[0], aFields[1]);
			//@END: Task 280675
			var Itemprops = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty(oEvent.getSource().getParent().getBindingContext(
				"localDataModel").getPath());
			var values = {};
			values = {
				fragmentName: "ConsumerSearchHelp",
				fragVariable: "consumerFrag",
				itemsProp: Itemprops
			};
			if (!values.itemsProp.soldto) {
				this.showMessage("Please add Sold To before consumer determination");
				return;
			}
			this.getView().setModel(new sap.ui.model.json.JSONModel(), "consumerSearchLocalModel");
			values.beforeOpenExecution = true;
			values.beforeOpenFunction = function (values, context) {
				context.setADSearchDefaults(); //@Task 280675
				var providerCompCode = "GB32";
				if (context.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
					providerCompCode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
				}
				var eventValues = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "consumerdetermination",
					filters: [].concat(context.makeFilterArray(["providercompcode"], "EQ", providerCompCode))
						.concat(context.makeFilterArray(["providercompcode"], "EQ", "ALL"))
						.concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
						.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
						.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
						.concat(context.makeFilterArray(["soldtocustomer"], "EQ",values.itemsProp.soldto))
						.concat(context.makeFilterArray(["soldtocustomer"], "EQ", "ALL"))
						.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), //@Bug 302234
					urlParameters: "",
					success: function (oData) {
						context.setPropInModel("consumerSearchLocalModel", "/results", oData.results);
					},
					error: "",
				};
				context.readDataFromOdataModel(eventValues);
				context[values.fragVariable].getContent()[1].refreshItems();//@Task 280675
			};
			this.onDialogFetch(values);
		},
		onValueHelpConfirmItems: function (oEvent) {
			var context = this;
			if (this.itemsPath) {
				var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
				var object = oEvent.getParameter(values.selctionParameter).getBindingContext(values.selctionBindingContext).getProperty("");
				var toAdd = oEvent.getParameter(values.selctionParameter).getBindingContext(values.selctionBindingContext).getProperty(values.selctionProperty);
				this.getView().getModel("localDataModel").setProperty(this.itemsPath, toAdd);
				
				//@START: Task 242908
				if (values.hasOwnProperty("selctionBindingContext") && values.selctionBindingContext === 'gsapCCSearchModel') {
					var itemPath = this.itemsPath;
					var providerPath = this.itemsPath.substring(0, this.itemsPath.lastIndexOf("/")) + "/";
					//@START: Task 301408
					var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
					if(fdrroute === "GCB" || fdrroute === "GCF") {
					//@END: Task 301408
						this.readDataFromOdataModel({
							modelName: "fdrPlusODataModel",
							//@START: Task 274288
							entitySet: "fdrheaderprovider",
							filters: [].concat(this.makeFilterArray(["providercompcode"], "EQ", this.getPropInModel("localDataModel", providerPath + "providercompcode")))
							.concat(this.makeFilterArray(["providercosttyp"], "EQ", this.getPropInModel("localDataModel", providerPath + "providercosttyp")))
							.concat(this.makeFilterArray(["providercostobj"], "EQ", toAdd)),
							//@END: Task 274288
							urlParameters: {},
							success: function (oData) {
								if (oData.results.length) {
									context.showMessage("Cost Center " + toAdd + " is already used in FDR: " + oData.results[0].fdrno);
									context.setPropInModel("localDataModel", providerPath + "providercostobj", "");
								}
								else {
									context.checkForFurterTrigger(itemPath, toAdd, object);
								}
							},
							error: function (oError) {
		
							}
						});
					} //@Task 301408
				}
				else {
					this.checkForFurterTrigger(this.itemsPath, toAdd, object);
				}
				//this.checkForFurterTrigger(this.itemsPath, toAdd, object);
				//@END: Task 242908
				this.itemsPath = "";
			}
			//@START: Task 280675
			if(this.fieldsToSet && (values.selctionBindingContext === "consumerSearchBLPLocalModel" || values.selctionBindingContext == "providerConfSerpLocalModel")) {
				var fieldsToSet = this.fieldsToSet.split(",");
				this.setPropInModel("localDataModel", fieldsToSet[0], oEvent.getParameter("selectedItem").getTitle());//ID
				this.setPropInModel("localDataModel", fieldsToSet[1], oEvent.getParameter("selectedItem").getAttributes()[0].getText());//Name
			}
			//@END: Task 280675
		},
		
		//@START: Task 242908
		validateCostCenter: function(context, costcenter, providerPath) {
			return new Promise(function(resolve, reject) {
				//@START: Bug 283834
				var costobjtyp = context.getPropInModel("localDataModel", providerPath + "providercosttyp");
				var deletionflag = context.getPropInModel("localDataModel", providerPath + "deletionflag");
				if(costobjtyp === "WBS" || deletionflag === "X") { //@Bug 284640
					resolve({"fdrno": "Valid", "providerPath": providerPath});
				}
				//@END: Bug 283834
				context.readDataFromOdataModel({
					modelName: "fdrPlusODataModel",
					//@START: Task 274288
					entitySet: "fdrheaderprovider",
					filters: [].concat(context.makeFilterArray(["providercompcode"], "EQ", context.getPropInModel("localDataModel", providerPath + "providercompcode")))
						.concat(context.makeFilterArray(["providercosttyp"], "EQ", context.getPropInModel("localDataModel", providerPath + "providercosttyp")))
						.concat(context.makeFilterArray(["providercostobj"], "EQ", costcenter))
						.concat(context.makeFilterArray(["fdrno"], "NE", context.getPropInModel("localDataModel", "/fdrno"))),//@Bug 280112
					//@END: Task 274288
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							//resolve(oData.results[0].fdrno);
							resolve ({ "fdrno": oData.results[0].fdrno, "providerPath": providerPath});
						}
						else {
							resolve({"fdrno": "Valid", "providerPath": providerPath});
						}
					},
					error: function (oError) {
						reject();
					}
				});	
			});
		},
		//@END: Task 242908
		
		//@START: Bug 280112
		validateCostCentersAndSubmit: function(providerCompanies, fdrroute) {
			var context = this, promiseArray = [];
			//@START: Bug 283834
			var aProvCompCC = providerCompanies.filter(function(o) {
				return o.providercosttyp === "CC" && o.deletionflag !== "X"; //@Bug 284640
			});
			//@END: Bug 283834
			//Check for duplicate Cost Centers in same FDR
			var isNoDuplicateCC = context.checkForDuplicateCCs(aProvCompCC);
			aProvCompCC.forEach(function(ox, ix) {
				//Check if same Cost Center exists in other FDRs
				promiseArray.push(context.validateCostCenter(context, ox.providercostobj, "/providerCompanies/" + ix + "/"));
			});
			
			Promise.all(promiseArray).then(function (arrayObj) {
				var isValidCC = true;
				//Clear all invalid Cost Centers
				jQuery.each(arrayObj, function (ix, ox) {
					if(ox.fdrno !== "Valid") {
						isValidCC = false;
						context.setPropInModel("localDataModel", ox.providerPath + "providercostobj", "");
					}
				});
				//Submit FDR
				if(isValidCC && isNoDuplicateCC) {
					//if(fdrroute === "GCB" || fdrroute === "GCF") { //@Task 301408
					context.GCRSubmit();
					//@START: Task 301408
					/*}
					else if(fdrroute === "EBD") {
						context.EBDSubmit();
					}
					else if(fdrroute === "DIR") {
						context.DSDirSubmit();
					}*/
					//@END: Task 301408
				}
				else {
					context.showMessage("Cost Center Validation failed. Please correct and then proceed further.");
					context.setPropInModel("localDataModel", "/locksubmit", "N");
					context.setBusy(false);
				}
			}).catch(function(oerror) {
				context.showMessage("Error in Cost Center Validation");
				context.setPropInModel("localDataModel", "/locksubmit", "N");
				context.setBusy(false);
			});
		},
		
		//Check if any duplicate Cost Centers in same FDR (in different line items)
		checkForDuplicateCCs: function(providerCompanies) {
			var context = this, isValid = true;
			providerCompanies.forEach(function(ox, ix) {
				for(var iy = ix + 1; iy < providerCompanies.length; iy++) {
					if(ox.providercostobj === providerCompanies[iy].providercostobj) {
						isValid = false;
						context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/providercostobj", "");
					}
				}
			});
			return isValid;
		},
		//@END: Bug 280112
		
		onProjectLineGoToProject: function (oEvent) {
			var provderPath = oEvent.getSource().getBindingContext("localDataModel").getPath() + "/";
			if (this.getPropInModel("localDataModel", "/fdrroute") === 'DIR' && this.getPropInModel("localDataModel", "/business") === 'UP') {
				this.onSerpProejctFetch(provderPath);
			} else {
				this.getProjectScreen(provderPath);
			}
		},
		onFunSerActValueHelpSearch: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.headerSelection = "";
			var check = true;
			if (values.fragVariable === "functionFrag") {
				this.headerSelection = [{
					functiondescription: "functiondesc"
				}, {
					functionid: "funtionid"
				}];

			} else if (values.fragVariable === "serviceFrag") {
				this.headerSelection = [{
					servicedescription: "service"
				}, {
					serviceid: "serviceid"
				}];
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					var allContractData = context.getPropInModel("contractSearchLocalModel", "/allData");
					var serviceData = allContractData.filter(function (e) {
						return e.functionid === context.getPropInModel("localDataModel", "/funtionid");
					});
					serviceData = UnderScoreParse.uniq(serviceData, ["serviceid"]);
					context.setPropInModel("contractSearchLocalModel", "/services", serviceData);
				};
				if (!this.getPropInModel("localDataModel", "/funtionid")) {
					check = false;
					this.showMessage("Please add Function Before Service Selection");
				}
			} else if (values.fragVariable === "activityfrag") {
				this.headerSelection = [{
					activitydescription: "activity"
				}, {
					activityid: "activityid"
				}];
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					var allContractData = context.getPropInModel("contractSearchLocalModel", "/allData");
					var activityData = allContractData.filter(function (e) {
						return e.functionid === context.getPropInModel("localDataModel", "/funtionid") && e.serviceid === context.getPropInModel(
							"localDataModel", "/serviceid");
					});
					activityData = UnderScoreParse.uniq(activityData, ["activityid"]);
					context.setPropInModel("contractSearchLocalModel", "/activties", activityData);
				};
				if (!this.getPropInModel("localDataModel", "/funtionid") && !this.getPropInModel("localDataModel", "/serviceid")) {
					check = false;
					this.showMessage("Please add Function and Service Before Activity Selection");
				}
			}
			if (check) {
				this.onDialogFetch(values);
			}
		},
		onFurtherToFunctionAndService: function () {
			var context = this, isContract = true;
			var route = this.getPropInModel("localDataModel", "/fdrroute");
			if(!this.getPropInModel("localDataModel", "/funtionid") || !this.getPropInModel("localDataModel", "/serviceid")) {
				isContract = false;		
			}
			if(route === "GCB" || route === "GCF") {
				if(!this.getPropInModel("localDataModel", "/activityid")) {
					isContract = false;
				}
			}
			//@START: Task 257521
			if(this.getPropInModel("localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/selfBilling") === "X") {
				isContract = false;
			}
			//@END: Task 257521
			if(isContract) {
				this.getContractDates().then(function(contractDates) {
					if(contractDates.providerContracts.length || contractDates.benifContracts.length) {
						context.makeContractDetailsModels(contractDates);	
					}
					else {
						context.showMessage("No contracts available for selected Function/Service/Activity");
						context.setPropInModel("contractDatesModel", "/allowTo", false);
						context.setPropInModel("localDataModel", "/todate", "");
					}
				}).catch(function(oerror) {
					context.showMessage("Unable to get Contract Dates for selected Function/Service/Activity");
				});
			}
			
			if (this.getPropInModel("localDataModel", "/funtionid") && this.getPropInModel("localDataModel", "/serviceid") && this.getPropInModel(
					"localDataModel", "/fdrroute") !== 'GCB' && this.getPropInModel("localDataModel", "/fdrroute") !== 'GCF') {
				if (this.getPropInModel("localDataModel", "/fdrroute") === 'DIR') {
					var eventValues = {
						modelName: "fdrPlusFeedOdataModel",
						entitySet: "consumerdetermination",
						filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
							.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
							.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
							.concat(context.makeFilterArray(["providercompcode"], "EQ", context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode")))
							.concat(context.makeFilterArray(["providercompcode"], "EQ", "ALL"))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), //@Bug 302234
						urlParameters: "",
						success: function (oData) {
							var forAll = oData.results.filter(function (e) {
								return e.soldtocustomer === "ALL";
							});
							jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
								if (ox.soldto && !ox.consumer) {
									//@START: Task 280675
									var soldToCustomer = oData.results.filter(function (e) {
										return e.soldtocustomer === ox.soldto;
									});
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/consumer", soldToCustomer.length ? soldToCustomer[0].consumer : forAll.length ? forAll[0].consumer : "");
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/consumername", soldToCustomer.length ? soldToCustomer[0].consumername : forAll.length ? forAll[0].consumername : "");
									if (ox.resys !== "OTHER" && !ox.invrecipent) {
										context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/invrecipent", soldToCustomer.length ? soldToCustomer[0].invoicerecipient : forAll.length ? forAll[0].invoicerecipient : "");
										context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/invrecipientname", soldToCustomer.length ? soldToCustomer[0].invrname : forAll.length ? forAll[0].invrname : "");
									}
									//@END: Task 280675
								}
							});
						},
						error: "",
					};
					context.readDataFromOdataModel(eventValues);
				} else {
					var eventValues = {
						modelName: "fdrPlusFeedOdataModel",
						entitySet: "consumerdetermination",
						filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
							.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
							.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
							.concat(context.makeFilterArray(["providercompcode"], "EQ", "GB32"))
							.concat(context.makeFilterArray(["providercompcode"], "EQ", "ALL"))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), //@Bug 302234
						urlParameters: "",
						success: function (oData) {
							var forAll = oData.results.filter(function (e) {
								return e.soldtocustomer === "ALL";
							});
							jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
								if (ox.soldto && !ox.consumer) {
									//@START: Task 280675
									var soldToCustomer = oData.results.filter(function (e) {
										return e.soldtocustomer === ox.soldto;
									});
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/consumer", soldToCustomer.length ? soldToCustomer[0].consumer : forAll.length ? forAll[0].consumer : "");
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/consumername", soldToCustomer.length ? soldToCustomer[0].consumername : forAll.length ? forAll[0].consumername : "");
									if (ox.resys !== "OTHER" && !ox.invrecipent) {
										context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/invrecipent", soldToCustomer.length ? soldToCustomer[0].invoicerecipient : forAll.length ? forAll[0].invoicerecipient : "");
										context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/invrecipientname", soldToCustomer.length ? soldToCustomer[0].invrname : forAll.length ? forAll[0].invrname : "");
									}
									//@END: Task 280675
								}
							});
						}
					};
					context.readDataFromOdataModel(eventValues);
				}
			}
			//@START: Bug 233327
			else if (this.getPropInModel("localDataModel", "/funtionid") && this.getPropInModel("localDataModel", "/serviceid") && this.getPropInModel(
					"localDataModel", "/activityid") && (this.getPropInModel("localDataModel", "/fdrroute") === 'GCB' 
					|| this.getPropInModel("localDataModel", "/fdrroute") === 'GCF')) {
				var context = this;
				//load Default MCS WBS
				var eventParams = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "gcleg1wbsdefault",
					filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
						context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid"))).concat(context.makeFilterArray(
						["activityid"], "EQ", context.getPropInModel("localDataModel", "/activityid")))).concat(context.makeFilterArray(
						["deletionflag"], "NE", "X")),
					urlParameters: "",
					success: function (oData) {
						if (oData.results.length) {
							var mcsWBS = oData.results[0].mcswbse;
							jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
								if (!ox.mcswbsse) {
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcswbsse", mcsWBS);
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcsprojdef", mcsWBS.substring(0, 10));
								}
							});
						}
					},
					error: "",
				};
				context.readDataFromOdataModel(eventParams);
			}
			//@END: Bug 233327
		},
		onValueConfirmFunSerAct: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			var context = this;
			
			if (this.headerSelection) {
				var contextValues = oEvent.getParameter(values.selctionParameter).getBindingContext(values.selctionBindingContext).getProperty("");
				jQuery.each(this.headerSelection, function (ix, ox) {
					jQuery.each(ox, function (iy, oy) {
						context.getView().getModel("localDataModel").setProperty("/" + oy, contextValues[iy]);
					});
				});
			}
			this.headerSelection = "";
			
			//Clear previous values
			if(values.fragName === "functionFrag" || values.fragName === "serviceFrag" || values.fragName === "activityFrag") {
				context.setPropInModel("localDataModel", "/fromdate", "");
				context.setPropInModel("localDataModel", "/todate", "");
				context.setPropInModel("contractDatesModel", "/allowTo", false);
				if(values.fragName === "functionFrag" || values.fragName === "serviceFrag") {
					context.setPropInModel("localDataModel", "/activityid", "");
					context.setPropInModel("localDataModel", "/activity", "");
					if(values.fragName === "functionFrag") {
						context.setPropInModel("localDataModel", "/serviceid", "");
						context.setPropInModel("localDataModel", "/service", "");
						//@START: Task 271625
						var benComps = context.getPropInModel("localDataModel", "/benifCompanies");
						benComps.forEach(function(o) {
							o.recoverycc = "";
						});
						context.setPropInModel("localDataModel", "/benifCompanies", benComps);
						//@END: Task 271625
					}
				}
			}
			
			//determine DC
			if (this.getPropInModel("localDataModel", "/funtionid") && this.getPropInModel("localDataModel", "/serviceid")) {
				// erpdcdetermination
				var eventProps = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "erpdcdetermination",
					filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
						.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
						.concat(context.makeFilterArray(["billingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
						.concat(context.makeFilterArray(["providersystem"], "EQ",context.getPropInModel("localDataModel", "/business") === 'UP' ? "SERP" : "GSAP"))
						.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), //@Task 316387
					success: function (oData) {
						if (oData.results.length) {
							//@START: Task 316387
							var providercompcode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
							var business = context.getPropInModel("localDataModel", "/business");
							var aDCList = context.serpProjectSectionEvent.getDistributionChannel(oData.results, providercompcode, business);
							if(aDCList.length) {
								context.setPropInModel("localDataModel", "/dc", aDCList[0].erpdc);
								context.vendorDetermination();
								context.makeBHIRMandatory(context.getPropInModel("localDataModel", "/workflowflag")); //@Bug 227912, 232398
							}
							else {
								context.setPropInModel("localDataModel", "/dc", "");
								context.showMessageToast("No Distribution Channel Available");
							}
							//@END: Task 316387
							
						} else {
							context.setPropInModel("localDataModel", "/dc", "");
							context.showMessageToast("No Distribution Channel Available");
						}
					},
					error: ""
				};
				this.readDataFromOdataModel(eventProps);
				this.determineDefaultsLineItems();
				this.onFurtherToFunctionAndService();
			}
		},
		determineDefaultsLineItems: function () {
			var context = this;
			this.setModel(new sap.ui.model.json.JSONModel({
				"results": []
			}), "providerCostObjDefaultModel");
			this.setModel(new sap.ui.model.json.JSONModel({
				"results": []
			}), "benCostObjDefaultModel");
			var eventProps = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "providercostobject",
				filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
					context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))),
				success: function (oData) {
					if (oData.results.length) {
						context.setPropInModel("providerCostObjDefaultModel", "/results", oData.results);
						context.defaultCostObjects("P");
					}
				},
				error: ""
			};
			this.readDataFromOdataModel(eventProps);
			var eventPropsBen = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "beneficiarycostobject",
				filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
					context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))),
				success: function (oData) {
					if (oData.results.length) {
						context.setPropInModel("benCostObjDefaultModel", "/results", oData.results);
						context.defaultCostObjects("B");
					}
				},
				error: ""
			};
			this.readDataFromOdataModel(eventPropsBen);
		},
		defaultCostObjects: function (forW) {
			if (this.getPropInModel("localDataModel", "/funtionid") && this.getPropInModel("localDataModel", "/serviceid") && this.getPropInModel(
					"localDataModel", "/business") === 'DS') {
				var context = this;
				if (forW === "P") {
					jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (ix, ox) {
						if (!ox.providercostobj && ox.subitemno === "10") {
							var providerDefData = context.getPropInModel("providerCostObjDefaultModel", "/results").filter(function (e) {
								return e.providercompcode === ox.providercompcode;
							});
							if (providerDefData.length && (providerDefData[0].costobjtype === "CC" || providerDefData[0].costobjtype === "WBS") &&
								!context.getPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj")) {
								context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercosttyp", providerDefData[0].costobjtype);
								//@START: Task 301408
								var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
								if(fdrroute === "GCB" || fdrroute === "GCF") {
									//@START: Task 242908
									context.validateCostCenter(context, providerDefData[0].costobj, "/providerCompanies/" + ix).then(function(validity) {
										if(validity.fdrno === "Valid") {
											context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj", providerDefData[0].costobj);
										}
										else {
											context.showMessage("Cost Center " + providerDefData[0].costobj + " is already used in FDR: " + validity.fdrno);
											context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj", "");
										}
									}).catch(function(oerror) {
										context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj", "");
									});
									//@END: Task 242908
								}
								else {
									context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj", providerDefData[0].costobj);
								}
								//@END: Task 301408
							}
							if (!context.getPropInModel("localDataModel", "/providerCompanies/" + ix + "/prprftcenter") && context.getPropInModel(
									"localDataModel", "/providerCompanies/" + ix + "/providercostobj")) {
								//ProfitCenter Fetch 
								new Promise(function (resolve, reject) {
									var idx = ix;
									context.onProfitCenterFetch({
										providercompcode: ox.providercompcode,
										position: "10",
										provCostType: context.getPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercosttyp"),
										provCostObj: context.getPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercostobj")
									}).then(function (profitCenter) {
										context.setPropInModel("localDataModel", "/providerCompanies/" + idx + "/prprftcenter", profitCenter);
									});
								});
							}
						}
					});
				} else {
					//@Task 281620 - Do not default Cost object Value for GCB/GCF
					if(context.getPropInModel("localDataModel", "/fdrroute") !== "GCB" && context.getPropInModel("localDataModel", "/fdrroute") !== "GCF") {
						jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
							if (!ox.costobjval && ox.subitemno === "10") {
								var benDefData = context.getPropInModel("benCostObjDefaultModel", "/results").filter(function (e) {
									return e.beneficiarycompcode === ox.erpcomcode;
								});
								if (benDefData.length && (benDefData[0].costobjtype === "CC" || benDefData[0].costobjtype === "WBS") && !context.getPropInModel(
										"localDataModel", "/benifCompanies/" + ix + "/costobjval")) {
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/costobjval", benDefData[0].costobj);
									context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/bencosttyp", benDefData[0].costobjtype);
								}
							}
						});
					//@START: Task 281620
					}
					//Set as blank for GCF/GCB
					else {
						jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
							context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/costobjval", "");
							context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/bencosttyp", "");
						});
					}
					//@END: Task 281620
				}
			}
		},
		onSubSetValueConfirm: function (oEvent) {
			var subSetString = "";
			if (this.getPropInModel("localDataModel", "/fdrroute") === 'EBD' && oEvent.getParameter("selectedItems").length > 1) {
				this.showMessage("Can not Select More than 1 Sub Set for EBD");
				return;
			}
			jQuery.each(oEvent.getParameter("selectedItems"), function (ix, ox) {
				if (ix !== 0) {
					subSetString = subSetString + ",";
				}
				subSetString = subSetString + ox.getTitle();
			});
			this.onSubsetValidator(subSetString);
		},
		onSubItemChange: function (oEvent) {
			// this.setPropInModel("localDataModel","/subset",oEvent.getParameter("value").toUpperCase());
			this.onSubsetValidator(oEvent.getParameter("value").toUpperCase());
		},
		onSubsetValidator: function (subSetString) {
			var subSetArray = subSetString.split(",");
			var oldBen = this.getPropInModel("localDataModel", "/benifCompanies");
			//@START: Task 325086
			var toAddArray = [];
			if(this.getPropInModel("localDataModel", "/fdrroute") === "GCB" || this.getPropInModel("localDataModel", "/fdrroute") === "GCF"){
				//Do not determine the subset as the allocation set has subset already.
				toAddArray = oldBen;
			}else{
			//@END: Task 325086
				//make all ref of Bus As empty
				oldBen.forEach(function (e) {
					e.refofbusiness = "";
					e.beneficiaryper = "0";
					e.beneficiaryamt = "0";
				});
				var groupedBen = UnderScoreParse.groupBy(oldBen, "itemno");
				jQuery.each(groupedBen, function (ix, ox) {
					var array = ox;
					if (subSetArray.length > array.length) {
						var identifier = subSetArray.length - array.length;
						for (var x = identifier; x > 0; x--) {
							array.push(jQuery.extend({}, ox[0], {
								ACTION: "C",
								subitemno: "",
								refofbusiness: "",
								beneficiaryper: "",
								beneficiaryamt: "",
								rrbprojdef: "",
								sipcrecwbse: "",
								engagmentno: ""
							}));
						}
					}
					jQuery.each(array, function (iy, oy) {
						oy.refofbusiness = subSetArray[iy];
						toAddArray.push(oy);
					});
				});
			} //@Task 325086
			this.setPropInModel("localDataModel", "/benifCompanies", toAddArray);
			this.determineSubItemNo();
			this.setPropInModel("localDataModel", "/subset", subSetArray.toString());
		},
		//@START: Task 271625
		getLeg2SOCurrency: function(benifCompanies) {
			var context = this;
			var providercompcode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode") === "GB32" ? "GB32" : "ALL";
			var aFilters = context.makeFilterArray(["coverage"], "EQ", context.getPropInModel("localDataModel","/coverage"))
				.concat(context.makeFilterArray(["regcode"], "EQ", context.getPropInModel("localDataModel", "/region")))
				.concat(context.makeFilterArray(["leg"], "EQ", "2")).concat(context.makeFilterArray(["providercompcode"], "EQ", providercompcode))
				.concat(context.makeFilterArray(["deletionflag"], "NE", "X"));
			return new Promise(function(resolve, reject) {
				var eventVars = {
					modelName: "gcBoaFeederODataModel",
					entitySet: "socurrency",
					filters: aFilters,
					urlParameters: "",
					success: function (data) {
						benifCompanies.forEach(function(o) {
							o.currency = data.results.length ? data.results[0].socurrency : "";
						});
						resolve(benifCompanies);
					},
					error: function(oerror) {
						context.showMessageToast("Error in getting Leg2 Currency");
						resolve(benifCompanies);
					}
				};
				context.readDataFromOdataModel(eventVars);
			});
		},
		//@END: Task 271625
		onHeaderValueHelpSearch: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			this.headerPath = "/" + values.path;
			this.fieldsToSet = values.fieldsToSet; //@Task 280675
			if (values.path === "subset") {
				values.beforeOpenExecution = true;
				values.selfCallOpen = true;
				values.beforeOpenFunction = function (values, context) {
					context[values.fragVariable].setMultiSelect(true);
					context[values.fragVariable]._oList.setMode(sap.m.ListMode.MultiSelect);
					var selectedContexts = [];
					if (context.getPropInModel("localDataModel", "/subset")) {
						context[values.fragVariable]._oList.getBinding("items").filter();
						var list = context[values.fragVariable]._oList.getItems();
						jQuery.each(list, function (ix, e) {
							if (context.getPropInModel("localDataModel", "/subset").indexOf(e.getTitle()) !== -1) {
								selectedContexts.push("/results/" + ix);
								context[values.fragVariable]._oList.getItems()[ix].setSelected(true);
							}
						});
						context[values.fragVariable]._oList.setSelectedContextPaths(selectedContexts);
					}
					context[values.fragVariable]._oList.refreshItems();
				};
			} else if (values.path === "allocationkey") {
				values.beforeOpenExecution = true;
				values.selfCallOpen = true;
				values.beforeOpenFunction = function (values, context) {
					if (context.getPropInModel("localDataModel", "/business")) {
						var listBinding = context[values.fragVariable]._oList.getBinding("items");
						listBinding.filter([new sap.ui.model.Filter("division", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel",
							"/business"))], "Application");
						context[values.fragVariable]._oList.refreshItems();
					}
				};
			} else if (values.path === 'gsrfocal' || values.path === 'rnafocal') {
				values.beforeOpenExecution = true;
				values.selfCallOpen = true;
				this.setModel(new sap.ui.model.json.JSONModel(), "focalPointLocalModel");
				values.beforeOpenFunction = function (values, context) {
					//@START: Task 290303
					sap.ui.core.BusyIndicator.show(0);
					context.setADSearchDefaults();
					var aFilters = [], gsrFocalEntitySet = "";
					var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
					var workflowflag = context.getPropInModel("localDataModel", "/workflowflag");
					if(values.path === "gsrfocal" && workflowflag === "X") {
						gsrFocalEntitySet = "ptui_gsrfocal";
						aFilters = context.makeFilterArray(["providercompcode"], "EQ", context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode"))
							.concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")))
							.concat(context.makeFilterArray(["rcaoo"], "EQ", context.getPropInModel("localDataModel","/benifCompanies/0/rcaoo")))
							.concat(context.makeFilterArray(["rcgrpcomp"], "EQ", context.getPropInModel("localDataModel","/benifCompanies/0/rcgrpcomp")))
							//.concat(context.makeFilterArray(["rcaoodesc"], "EQ", context.getPropInModel("localDataModel","/benifCompanies/0/rcaoodesc")))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X"));
					}
					else {
						gsrFocalEntitySet = "gsrfocal";
						//@END: Task 290303
						//@START: Task 211447
						aFilters = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel",
							"/funtionid")).concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel(
							"localDataModel", "/serviceid"))).concat(context.makeFilterArray(["fundingroute"], "EQ", fdrroute))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X"));
						if (fdrroute === "DIR") {
							aFilters = aFilters.concat(context.makeFilterArray(["providercompcode"], "EQ", context.getPropInModel("localDataModel",
								"/providerCompanies/0/providercompcode"))); //@Task 287276
						}
						//@END: Task 211447
					} //@Task 290303
					var focalEntitySet = values.path === "rnafocal" ? "rnafocal" : gsrFocalEntitySet; //@Task 287276, 290303
					var eventVars = {
						modelName: "fdrPlusFeedOdataModel",
						entitySet: focalEntitySet,//@Task 287276
						filters: aFilters, //@Task 211447
						urlParameters: "",
						success: function (data) {
							//@START: Task 287276
							var arrayToset = [], results = [];
							if(fdrroute !== "DIR") { 
								results = data.results;
							}
							else {
								//@START: Task 290303
								if(workflowflag === "X") {
									var serviceid = context.getPropInModel("localDataModel", "/serviceid");
									var serviceResults = data.results.filter(function(o) {
										return o.serviceid === serviceid;
									});
									if(serviceResults.length) {
										results = serviceResults;
									}
									else {
										var allResults = data.results.filter(function(o) {
											return o.serviceid === "ALL";
										});
										if(allResults.length) {
											results = allResults;
										}
									}
								}
								else {
								//@END: Task 290303
									var payer = context.getPropInModel("localDataModel", "/benifCompanies/0/payer");
									var payerResults = data.results.filter(function(o) {
										return o.payer === payer;
									});
									if(payerResults.length) {
										results = payerResults;
									}
									else {
										var allResults = data.results.filter(function(o) {
											return o.payer === "ALL";
										});
										if(allResults.length) {
											results = allResults;
										}
									}
								}//@Task 290303
							}
							//@END: Task 287276
							//@START: Bug 314052
							var uniqProperty = values.path === "rnafocal" ? "rnafocalid" : "gsrfocalid"; 
							results = UnderScoreParse.uniq(results, [uniqProperty]);
							//@END: Bug 314052
							jQuery.each(results, function (ix, ox) { //@Task 287276
								arrayToset.push({
									focalid: values.path === "rnafocal" ? ox["rnafocalid"] : ox["gsrfocalid"], //@Task 287276
									focalname: values.path === "rnafocal" ? ox["rnafocalname"] : ox["gsrfocalname"] //@Task 280675
								});
							});
							context.setPropInModel("focalPointLocalModel", "/results", arrayToset);
							sap.ui.core.BusyIndicator.hide();
						},
						error: function(oerror) {
							sap.ui.core.BusyIndicator.hide();
						}
					};
					context.readDataFromOdataModel(eventVars);
					//context.setADSearchDefaults();//@Task 280675
				};

			} else if (values.path === "fundingmanager") {
				values.beforeOpenExecution = true;
				values.selfCallOpen = true;
				this.setModel(new sap.ui.model.json.JSONModel(), "fundinaManLocalModel");
				if (this.getPropInModel("localDataModel", "/fdrroute") !== 'DIR') {//@Task 245709
					values.fragmentName = "FundingManagerSearch";
					values.fragVariable = "fundManFrag";
					values.beforeOpenFunction = function (values, context) {
						context.setADSearchDefaults();
						var eventVars = {
							modelName: "fdrPlusFeedOdataModel",
							entitySet: "fundingmanagerdet",
							//@START: Task 234612
							filters: context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel",
								"/funtionid")).concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel(
								"localDataModel", "/serviceid"))).concat(context.makeFilterArray(["fundingroute"], "EQ",
								context.getPropInModel("localDataModel", "/fdrroute"))).concat(context.makeFilterArray(["deletionflag"], "NE", "X")),
							//@END: Task 234612
							urlParameters: "",
							success: function (data) {
								//@START: Task 234612
								if (data.results) {
									var aAllSalesOrgData = data.results.filter(function (o) {
										return o.compcode === "ALL";
									});
									//CompCode = ALL
									if (aAllSalesOrgData.length) {
										context.setPropInModel("fundinaManLocalModel", "/results", aAllSalesOrgData);
									} else { 
										//Get list of unique Provider Company Codes
										var aProviders = UnderScoreParse.uniq(context.getPropInModel("localDataModel", "/providerCompanies"), [
											"providercompcode"
										]);
										var checkGB32Prov = aProviders.filter(function (o) {
											return o.providercompcode === "GB32";
										});
										if (!checkGB32Prov.length && context.getPropInModel("localDataModel", "/fdrroute") === "EBD") {
											aProviders.push({
												"providercompcode": "GB32"
											});
										}
										//Get only those values corresponding to unique Provider Company Codes
										var aFundingMgrData = data.results.filter(function (odata) {
											return aProviders.some(function (rdata) {
												return odata.compcode == rdata.providercompcode;
											});
										});

										if (aFundingMgrData.length === aProviders.length) {
											//Check if all entries have same Funding Manager
											var aFundMgrData = aFundingMgrData.filter(function (o) {
												return o.fundingmanagerid !== aFundingMgrData[0].fundingmanagerid;
											});
											//If not same, no values in F4
											if (aFundMgrData.length) {
												context.setPropInModel("fundinaManLocalModel", "/results", []);
											}
											//If same, put that value in F4
											else {
												context.setPropInModel("fundinaManLocalModel", "/results", [aFundingMgrData[0]]);
											}
										} else {
											context.setPropInModel("fundinaManLocalModel", "/results", []);
										}
									}
								}
								//@END: Task 234612
							},
							error: ""
						};
						context.readDataFromOdataModel(eventVars);
						//context.setADSearchDefaults();//@Task 280675
					};
				} else {
					values.fragmentName = "FundingManagerSERPSearch";
					values.fragVariable = "fundManSERPFrag";
					if (!this.getPropInModel("localDataModel", "/dc") && !this.getPropInModel("localDataModel",
							"/providerCompanies/0/providercompcode")) {
						this.showMessage("Please select Distribution Channel and Provider company code before Proceeding");
						return;
					}
					values.beforeOpenFunction = function (values, context) {
						var eventVars = {
							modelName: "serp150ODataModel",
							entitySet: "RevenueOwnerSet",
							filters: context.makeFilterArray(["SalesOrg"], "EQ", context.getPropInModel("localDataModel",
								"/providerCompanies/0/providercompcode")).concat(context.makeFilterArray(["DisCh"], "EQ", context.getPropInModel(
								"localDataModel", "/dc"))),
							urlParameters: "",
							success: function (data) {
								context.setPropInModel("fundinaManLocalModel", "/results", data.results);
							},
							error: ""
						};
						context.readDataFromOdataModel(eventVars);
					};
				}
			}
			else  if (values.path === "invcompcode") {
				values.setData = true;
			}
			//@START: Task 280675
			else if(values.path === "initiator") {
				this.setModel(new sap.ui.model.json.JSONModel(), "initiatorLocalModel");
				this.setADSearchDefaults();
			}
			//@END: Task 280675
			//@START: Task 280809
			else if(values.path === "regionalcode") {
				this.setModel(new sap.ui.model.json.JSONModel(), "gcRegionalCodeLocalModel");
				values.beforeOpenExecution = true;
				values.selfCallOpen = true;
				values.beforeOpenFunction = function (values, context) {
					sap.ui.core.BusyIndicator.show(0);
					var eventVars = {
						modelName: "dsFeederODataModel",
						entitySet: "regionalallocgrp",
						filters: context.makeFilterArray(["deletionflag"], "NE", "X"),
						urlParameters: "",
						success: function (oData) {
							var results = UnderScoreParse.uniq(oData.results, ["allocationgrpcode"]);
							context.setPropInModel("gcRegionalCodeLocalModel", "/results", results);
							sap.ui.core.BusyIndicator.hide();
						},
						error: function(oerror) {
							sap.ui.core.BusyIndicator.hide();
						}
					};
					context.readDataFromOdataModel(eventVars);
				};
			}
			//@END: Task 280809
			this.onDialogFetch(values);
		},
		onHeaderSearchConfirm: function (oEvent) {
			if (this.headerPath) {
				this.setPropInModel("localDataModel", this.headerPath, oEvent.getParameter("selectedItem").getTitle());
				var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
				if (values.hasOwnProperty("selctionBindingContext") && values.hasOwnProperty("selctionProperty") && values.hasOwnProperty(
						"selctionParameter")) {
					this.checkForFurterTrigger(this.headerPath, oEvent.getParameter(values.selctionParameter).getBindingContext(values.selctionBindingContext)
						.getProperty(values.selctionProperty));
				}
				//@START: Task 322392
				if(values.hasOwnProperty("fragVariable") && values.fragVariable === "currencyFrag") {
					this.onPlanBudgetChange();
				}
				//@END: Task 322392
			}
			//@START: Task 280675
			if(this.fieldsToSet) {
				var fieldsToSet = this.fieldsToSet.split(",");
				this.setPropInModel("localDataModel", fieldsToSet[0], oEvent.getParameter("selectedItem").getTitle());
				this.setPropInModel("localDataModel", fieldsToSet[1], oEvent.getParameter("selectedItem").getDescription());
			}
			//@END: Task 280675
		},
		onCalculate: function () {
			var multiInputArray = this.getPropInModel("localDataModel", "/subset").split(",");
			var functionKey = multiInputArray.length === 14 ? "X" : "";
			var localData = this.getView().getModel("localDataModel").getProperty("/");
			var itemsArray = [];
			jQuery.each(localData.benifCompanies, function (ix, ox) {
				if(ox.deletionflag !== "X") { //@Task 278528
					itemsArray.push({
						"lobcode": "#",//@Bug 243299
						"companycode": ox.beneficiarycompcode,
						"amount": "0",
						"percentage": ""
					});
				}
			});
			//@Bug 243299: Get unique company codes before passing to payload
			 itemsArray = UnderScoreParse.uniq(itemsArray, ["companycode"]);
			 
			if (localData.functionalkey === "X") {
				functionKey = "X";
			}
			var region = "",
				regionalFlag = "";
			if (localData.regionalflag) {
				regionalFlag = "X";
				region = localData.regionalcode;
			}
			//@START: Task 278528
			var finyear = new Date().getFullYear().toString();
			var quarter = new Date().getMonth() < 3 ? "Q1" : new Date().getMonth() < 6 ? "Q2" : new Date().getMonth() < 9 ? "Q3" : "Q4";
			//@END: Task 278528
			var payload = {
				data: [{
					header: {
						division: localData.business,
						allockeycode: localData.allocationkey,
						year: finyear, //@Task 278528
						qurter: quarter, //@Task 278528
						allkeySubSet: multiInputArray,
						functionKey: functionKey,
						regionalflag: regionalFlag,
						allocationgrpcode: region,
						runmodcode: localData.runmodecode ? localData.runmodecode : "ACTUAL"
					},
					returnArray: [],
					items: itemsArray
				}]
			};
			var context = this;
			var obj = {
				url: "/GF_SCP_HANADB/com/shell/cumulus/abacus/services/abacus.xsjs",
				payload: payload,
				success: function (oSuccess) {
					//@START: Task 342840
					//Get budget value for current year
					var budgetData = localData.addlProjDetails.filter(function(o) {
						return o.code === "PLBD" && o.value === finyear;
					});
					var calcuAmount = budgetData.length ? budgetData[0].description : "0";
					//@END: Task 342840
					jQuery.each(oSuccess.data[0].returnArray, function (ix, ox) {
						jQuery.each(localData.benifCompanies, function (iy, oy) {
							if (oy.beneficiarycompcode === ox.companycode && oy.refofbusiness === ox.cob) {
								oy.beneficiaryper = ox.percentage.toString();
								if (calcuAmount) {
									oy.beneficiaryamt = (parseFloat(ox.percentage) / 100) * parseFloat(calcuAmount);
									oy.beneficiaryamt = oy.beneficiaryamt.toString();
								} else {
									oy.beneficiaryamt = "0";
								}
							}
						});
					});
					localData.benifCompanies.forEach(function (e) {
						if(!oSuccess.data[0].returnArray.length || !e.beneficiaryamt) {   //@Task 320736
							e.beneficiaryamt = "0";
						}
						if(!oSuccess.data[0].returnArray.length || !e.beneficiaryper) {  //@Task 320736
							e.beneficiaryper = "0";
						}
						//@START: Task 278528
						e.finyear = finyear; 
						e.qtr = quarter;
						//@END: Task 278528
					});
					context.getView().getModel("localDataModel").setProperty("/benifCompanies", localData.benifCompanies);
					context.showMessage("Beneficiary Amount and Percentages calculated successfully");
				},
				error: function (error) {
					context.showMessage("Error in calculating Beneficiary Amount and Percentages");
				}
			};
			this.makeAjaxCall(obj.url, obj.payload, obj.success, obj.error, "POST");
		},
		onCheckBoxChange: function (oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			if (values.from === "Header") {
				this.setPropInModel("localDataModel", oEvent.getSource().getBindingInfo("selected").parts[0].path, oEvent.getParameter("selected") ?
					"X" : "");
			} else if (values.from === "Item") {
				this.setPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource()
					.getBindingInfo("selected").parts[0].path, oEvent.getParameter("selected") ?
					"X" : "");
			}
			//@START: Task 290808
			/*else if (values.from === "RegionalFlag") {
				this.setPropInModel("localDataModel", oEvent.getSource().getBindingInfo("selected").parts[0].path, oEvent.getParameter("selected") ?
					"X" : "");
				this.setPropInModel("localDataModel", "/regionalcode", "");
			}*/
			//@END: Task 290808
		},
		onLineItemSelectChange: function (oEvent) {
			var sEvent = Object.assign({}, oEvent);
			var currObject = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty("");
			if (oEvent.getSource().getBindingInfo("selectedKey").parts[0].path === "codeby") {
				var selPath = oEvent.getSource().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource()
					.getBindingInfo("selectedKey").parts[0].path;
				var selKey = oEvent.getParameter("selectedItem").getKey();
				if (this.getPropInModel("localDataModel", oEvent.getSource().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource()
						.getBindingInfo(
							"selectedKey").parts[0].path) !== oEvent.getParameter("selectedItem").getKey()) {
					var rccodingData = this.getPropInModel("localDataModel", "/rccoding");
					var currObject = this.getPropInModel("localDataModel", oEvent.getSource().getBindingContext("localDataModel").getPath());
					var dataForThisLine = rccodingData.filter(function (e) {
						return e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno;
					});
					if (dataForThisLine.length) {
						if (dataForThisLine[0].codeby !== currObject.codeby && dataForThisLine[0].ACTION === "C") {
							dataForThisLine = [];
							var rccodingDataNew = [];
							rccodingData.forEach(function (e) {
								if (e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno) {
									//do nothing
								} else {
									rccodingDataNew.push(e);
								};
							});
							rccodingData = rccodingDataNew;
							rccodingData = rccodingData.concat(dataForThisLine);
							this.setPropInModel("localDataModel", "/rccoding", rccodingData);
							this.setPropInModel("localDataModel", oEvent.getSource().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource()
								.getBindingInfo(
									"selectedKey").parts[0].path, oEvent.getParameter("selectedItem").getKey());
							this.onRCCodingPress(currObject); //@Task 241270
						} else if (dataForThisLine[0].codeby !== selKey) {
							var context = this;
							this.showMessage("Are you Sure you want to Change RC Coding Configuration?", "Confirmation", function (onclose) {
								if (onclose === "YES") {
									context.setPropInModel("localDataModel", selPath, selKey);
									//set to Delete Flag 
									context.getPropInModel("localDataModel", "/rccoding").forEach(function (e) {
										if (e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno) {
											e.ACTION = "D";
										}
									});
									context.makeFDRPayload().then(function (data) {
										if (data.rcode === "SUCCESS") {
											context.setToUpdateFlag();
											var rccoding = {
												modelName: "fdrPlusODataModel",
												entitySet: "rccoding",
												filters: context.makeFilterArray(["fdrno"], "EQ", context.getPropInModel("localDataModel", "/fdrno")),
												urlParameters: {},
												success: function (oData) {
													if (oData.results.length) {
														var datas = context.addActionFlag(oData.results, "U");
														context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
															rccoding: datas
														}));
													} else {
														context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
															rccoding: []
														}));
													}
													context.onRCCodingPress(currObject); //@Task 241270
												},
												error: function (oError) {
													context.onRCCodingPress(currObject); //@Task 241270
												}
											};
											context.readDataFromOdataModel(rccoding);
										}
									}).catch(function (oerror) {
										context.showMessageToast("Error in changing RC Coding Configuration");
										context.onRCCodingPress(currObject); //@Task 241270
									});
								} else {
									context.setPropInModel("localDataModel", selPath, dataForThisLine[0].codeby);
									context.onRCCodingPress(currObject); //@Task 241270
								}
							}, [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO]);
						}
					} else {
						this.setPropInModel("localDataModel", selPath, selKey);
						this.onRCCodingPress(currObject); //@Task 241270
					}
				} else {
					this.setPropInModel("localDataModel", selPath, selKey);
					this.onRCCodingPress(currObject); //@Task 241270
				}
			} else {
				this.setPropInModel("localDataModel", oEvent.getSource().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBindingInfo(
					"selectedKey").parts[0].path, oEvent.getParameter("selectedItem").getKey());
			}
		},
		onRecoveryTypeInHeadChange: function (oEvent) {
			var context = this;
			//Set to simple project for NON PROJECT recovery types
			var recoverytype = this.getPropInModel("localDataModel", "/fdrrecovertype").toUpperCase();
			if(recoverytype.startsWith("NON PROJECT")) { //@Bug 285996
				this.setPropInModel("localDataModel", "/onlyproject", "Y");
			}
			// systemid
			this.setPropInModel("localDataModel", "/fdrrecovertype", oEvent.getParameter("selectedItem").getBindingContext(
				"fdrPlusFeedOdataModel").getProperty("").fdrrecovertype);
			var billMethodCode = oEvent.getParameter("selectedItem").getBindingContext("fdrPlusFeedOdataModel").getProperty("billingmethodcode");
			jQuery.each(this.getPropInModel("localDataModel", "/providerCompanies"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/billingmethodcode", billMethodCode);
			});
		},
		onRCCodingPress: function (oEvent) {
			var context = this;
			var check = true, currObject = "";
			var rccodingData = this.getPropInModel("localDataModel", "/rccoding");
			try {
				currObject = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty("");
			}
			catch(error) {
				currObject = oEvent;
			}
			var simpleProjInd = this.getPropInModel("localDataModel", "/onlyproject") ? this.getPropInModel("localDataModel", "/onlyproject") :
				"Y"; //@Task 231447, 232398
			var dataForThisLine = rccodingData.filter(function (e) {
				return e.fdrno && e.fdrno !== "" && e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno; //@Task 233042
			});
			//@START: Task 223042
			rccodingData = rccodingData.filter(function (e) {
				return e.fdrno && e.fdrno !== "";
			});
			//@END: Task 223042
			var costObjects = [];
			costObjects = [{
				key: "CC",
				desc: "Cost Center"
			}, {
				key: "WBS",
				desc: "WBS"
			}, {
				key: "IO",
				desc: "Order"
			}, {
				key: "NW",
				desc: "Network"
			}, {
				key: "PO",
				desc: "Purchase Order"
			}, {
				key: "CWBS",
				desc: "Cost center + Stat. WBSE"
			}];
			this.setModel(new sap.ui.model.json.JSONModel({
				codeBy: currObject.codeby,
				system: currObject.resys,
				costObjects: costObjects
			}), "rcCodIndicatorModel");
			if (!currObject.codeby) {
				this.setPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/codeby",
					"CBEG");
				currObject = oEvent.getSource().getParent().getBindingContext("localDataModel").getProperty("");
			}
			if (dataForThisLine.length) {
				if (dataForThisLine[0].codeby !== currObject.codeby && dataForThisLine[0].ACTION === "C") {
					dataForThisLine = [];
					var rccodingDataNew = [];
					rccodingData.forEach(function (e) {
						if (e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno) {
							//do nothing
						} else {
							rccodingDataNew.push(e);
						};
					});
					rccodingData = rccodingDataNew;
				} else if (dataForThisLine[0].codeby !== currObject.codeby) {
					var context = this;
					this.showMessage("Are you Sure you want to Change RC Coding Configuration?", "Confirmation", function (onclose) {
						if (onclose === "YES") {
							//set to Delete Flag 
							context.getPropInModel("localDataModel", "/rccoding").forEach(function (e) {
								if (e.benitemno === currObject.itemno && e.bensubitemno === currObject.subitemno) {
									e.ACTION = "D";
								}
							});
							context.makeFDRPayload().then(function (data) {
									if (data.rcode === "SUCCESS") {
										context.setToUpdateFlag();
										var rccoding = {
											modelName: "fdrPlusODataModel",
											entitySet: "rccoding",
											filters: context.makeFilterArray(["fdrno"], "EQ", context.getPropInModel("localDataModel", "/fdrno")),
											urlParameters: {},
											success: function (oData) {
												if (oData.results.length) {
													var datas = context.addActionFlag(oData.results, "U");
													context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
														rccoding: datas
													}));
												} else {
													context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
														rccoding: []
													}));
												}
												context.showMessage("Please Click RC Coding Button Again");
											},
											error: function (oError) {
												context.showMessage(oError);
											}
										};
										context.readDataFromOdataModel(rccoding);
									}
								})
								//@START: Task 223042
								.catch(function (oerror) {
									context.showMessage(oerror);
								});
							//@END: Task 223042
						} else {
							context.setPropInModel("localDataModel", oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() +
								"/codeby",
								dataForThisLine[0].codeby);
						}
					}, [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO]);
					check = false;
				}
			}
			if (!dataForThisLine.length) {
				dataForThisLine = [];
				switch (currObject.codeby) {
				case "CBEG": //code by Engagement
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "006",
						itemno: "10",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					break;
				case "CBST": //code by Service Type
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "001",
						itemno: "10",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "002",
						itemno: "20",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "003",
						itemno: "30",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "004",
						itemno: "40",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					dataForThisLine.push({
						ACTION: "C",
						//fdrno: currObject.fdrno, //@CHECK
						codeby: currObject.codeby,
						servicetype: "005",
						itemno: "50",
						beneficiarycompcode: currObject.erpcomcode,
						benitemno: currObject.itemno,
						bensubitemno: currObject.subitemno,
						costobjtyp: "CC"
					});
					break;
				case "CBPW": //code by Provider WBS
					var providerDetails = this.getPropInModel("localDataModel", "/providerCompanies");
					//@START: Task 223042
					var count = 0;
					sap.ui.core.BusyIndicator.show(0);
					var aSerpProjNoDef = providerDetails.filter(function (o) {
						return (simpleProjInd === "Y" && o.providersystem === "SERP" && !o.projectdef); //@Task 231447
					});
					if (aSerpProjNoDef.length) {
						context.showMessage("Please Select Project Definition Before Continuing");
						check = false;
						sap.ui.core.BusyIndicator.hide();
						return;
					}
					//@END: Task 223042
					jQuery.each(providerDetails, function (ix, ox) {
						//@START: Task 223042
						if (ox.providersystem === "SERP") {
							if (simpleProjInd === "Y" && ox.projectdef) { //@Task 231447
								context.serpProjectSectionEvent.getL3WBSEntries(context, ox.projectdef).then(function (aL3WBS) {
									aL3WBS.forEach(function (oL3WBS) {
										dataForThisLine.push({
											ACTION: "C",
											//fdrno: currObject.fdrno, //@CHECK
											codeby: currObject.codeby,
											itemno: ((count * 10) + 10).toString(),
											servicetype: "006",
											beneficiarycompcode: currObject.erpcomcode,
											benitemno: currObject.itemno,
											bensubitemno: currObject.subitemno,
											providerwbs: oL3WBS.WBS,
											providerwbsdesc: oL3WBS.Description,
											costobjtyp: "CC"
										});
										count++;
									});
									if (ix === providerDetails.length - 1) {
										rccodingData = rccodingData.concat(dataForThisLine);
										rccodingData = UnderScoreParse.uniq(rccodingData, ["providerwbs"]);
										context.setPropInModel("localDataModel", "/rccoding", rccodingData);
										context.determineGLAccount(currObject);
										sap.ui.core.BusyIndicator.hide();
									}
								}).catch(function (oerror) {
									context.showMessage("Contact Admin - Error in getting Cost Collector WBSEs");
									check = false;
									sap.ui.core.BusyIndicator.hide();
								});
							}
						} else {
							//@END: Task 223042
							if (ox.providercosttyp === "WBS" && ox.providercostobj) {
								context.gsapProjectSectionEvent.getProviderWBSDesc(context, ox.providercostobj).then(function (wbsdesc) { //@Task 239944
									dataForThisLine.push({
										ACTION: "C",
										//fdrno: currObject.fdrno, //@CHECK
										codeby: currObject.codeby,
										itemno: ((ix * 10) + 10).toString(),
										servicetype: "006",
										beneficiarycompcode: currObject.erpcomcode,
										benitemno: currObject.itemno,
										bensubitemno: currObject.subitemno,
										providerwbs: ox.providercostobj,
										providerwbsdesc: wbsdesc, //@Task 239944
										costobjtyp: "CC"
									});
									//@START: Task 239944
									rccodingData = rccodingData.concat(dataForThisLine);
									rccodingData = UnderScoreParse.uniq(rccodingData, ["providerwbs"]);
									context.setPropInModel("localDataModel", "/rccoding", rccodingData);
									context.determineGLAccount(currObject);
									sap.ui.core.BusyIndicator.hide();
								}).catch(function (oerror) {
									context.showMessage("Error in getting RC Coding details");
									check = false;
									sap.ui.core.BusyIndicator.hide();
								});
								//@END: Task 239944
							} else {
								context.showMessage("Please Select Provider WBS Before Continuing");
								check = false;
								sap.ui.core.BusyIndicator.hide();
							}
						} //@Task 223042
					});
					break;
				case "CBPC": //code by Profit Center
					var providerDetails = this.getPropInModel("localDataModel", "/providerCompanies");
					jQuery.each(providerDetails, function (ix, ox) {
						if (ox.prprftcenter) {
							dataForThisLine.push({
								ACTION: "C",
								//fdrno: currObject.fdrno, //@CHECK
								codeby: currObject.codeby,
								itemno: ((ix * 10) + 10).toString(),
								servicetype: "006",
								beneficiarycompcode: currObject.erpcomcode,
								benitemno: currObject.itemno,
								bensubitemno: currObject.subitemno,
								costcenter: ox.providercostobj,
								profitcenter: ox.prprftcenter,
								costobjtyp: "CC"
							});
						} else {
							context.showMessage("Please Determine Provider Profit Center Before Continuing");
							check = false;
						}
					});
					break;
				}
				rccodingData = rccodingData.concat(dataForThisLine);
				this.setPropInModel("localDataModel", "/rccoding", rccodingData);
			}

			//@START: Task 231447
			//Complex project and Code by Provider WBSE only
			if (simpleProjInd === "N" && currObject.codeby === "CBPW") {
				var values = {
					fragmentName: "RCCodingComplex",
					fragVariable: "rccodingComplexFrag",
					currentObj: currObject
				};
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					context.determineGLAccountComplex(currObject);
					context[values.fragVariable].getContent()[0].getBinding("items").filter(context.makeFilterArray(["benitemno"], "EQ", values.currentObj
							.itemno).concat(context.makeFilterArray(["bensubitemno"], "EQ", values.currentObj.subitemno))
						.concat(context.makeFilterArray(["deletionflag"], "NE", "X")), "Application");
				};
				this.onDialogFetch(values);
				sap.ui.core.BusyIndicator.hide();
			} else {
				//@END: Task 231447
				var values = {
					fragmentName: "RCCoding",
					fragVariable: "rccodingFrag",
					currentObj: currObject
				};
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					context[values.fragVariable].getContent()[0].getBinding("items").filter(context.makeFilterArray(["benitemno"], "EQ", values.currentObj
						.itemno).concat(context.makeFilterArray(["bensubitemno"], "EQ", values.currentObj.subitemno)), "Application");
				};
				if (check) {
					this.determineGLAccount(currObject);
					this.onDialogFetch(values);
				}
			} //@Task 231447
		},
		determineGLAccount: function (currObject) {
			var context = this;
			return new Promise(function(resolve, reject) {
				if (context.getPropInModel("localDataModel", "/business") === "UP") {
					jQuery.each(context.getPropInModel("localDataModel", "/rccoding"), function (ix, ox) {
						if (ox.benitemno === currObject.itemno && ox.bensubitemno === currObject.subitemno) { // && !ox.glaccount
							//new Promise(function () {
								var obj = {
									id: ix,
									objval: ox
								};
								context.getView().getModel("serp150ODataModel").read("/DefaultGLSet", {
									filters: context.makeFilterArray(["Sysid"], "EQ", "SERP").concat(
										context.makeFilterArray(["Erpcc"], "EQ", obj.objval.beneficiarycompcode)).concat(
										context.makeFilterArray(["Vendr"], "EQ", currObject.vendorno)).concat(
										context.makeFilterArray(["Srvtp"], "EQ", obj.objval.servicetype)),
									success: function (oData) {
										if (oData.results.length) {
											//@START: Task 229723
											if (!ox.glaccount) {
												context.setPropInModel("localDataModel", "/rccoding/" + obj.id + "/glaccount", oData.results[0].Glacc);
											}
											//Recipient GL to be greyed out in RC coding if DEF_GL is read-only
											context.setPropInModel("localDataModel", "/rccoding/" + obj.id + "/glaccenabled", oData.results[0].Chind);
											//@END: Task 229723
										}
										resolve();
									}
								});
							//});
						}
					});
				} else if (context.getPropInModel("localDataModel", "/business") === "DS") {
					var aPromise = [];
					jQuery.each(context.getPropInModel("localDataModel", "/rccoding"), function (ix, ox) {
						if (ox.benitemno === currObject.itemno && ox.bensubitemno === currObject.subitemno && !ox.glaccount) {
							var salesorg = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode"); //1 Provider for DIR
							//Always Leg 1 for DIR, true - as data needs to be set back to RC coding table
							aPromise.push(new Promise(function(aResolve, aReject) {
								context.getFeederGLAccount(salesorg, "1", true, ix).then(function (glaccount) {
									aResolve();
								});
							}));
						}
					});
					Promise.all(aPromise).then(function() {
						resolve();
					});
				}
			});
		},

		//@START: Task 231447
		determineGLAccountComplex: function (currObject) {
			var context = this,
				glAccDetails = {
					"glaccount": "",
					"glaccenabled": true,
					"benitemno": currObject.itemno,
					"bensubitemno": currObject.subitemno,
					"beneficiarycompcode": currObject.erpcomcode
				};
			context.getView().getModel("serp150ODataModel").read("/DefaultGLSet", {
				filters: context.makeFilterArray(["Sysid"], "EQ", "SERP").concat(
					context.makeFilterArray(["Erpcc"], "EQ", currObject.erpcomcode)).concat(
					context.makeFilterArray(["Vendr"], "EQ", currObject.vendorno)).concat(
					context.makeFilterArray(["Srvtp"], "EQ", "006")),
				success: function (oData) {
					if (oData.results.length) {
						glAccDetails.glaccount = oData.results[0].Glacc;
						glAccDetails.glaccenabled = oData.results[0].Chind;
					}
					context.setPropInModel("localDataModel", "/rcCodeComplex", glAccDetails);
				},
				error: function () {
					context.setPropInModel("localDataModel", "/rcCodeComplex", glAccDetails);
				}
			});
		},
		//@END: Task 231447

		//get GL Account from Feeder
		getFeederGLAccount: function (salesorg, leg, isFromRCCoding, ix) {
			var context = this;
			var companycode = leg === "2" ? "GB32" : salesorg; //For Leg 2 Provider Comp Code is GB32
			var functionId = context.getPropInModel("localDataModel", "/funtionid");
			var serviceId = context.getPropInModel("localDataModel", "/serviceid");
			var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
			var dc = context.getPropInModel("localDataModel", "/dc");
			return new Promise(function (resolve, reject) {
				context.getView().getModel("fdrPlusFeedOdataModel").read("/gldetermination", {
					filters: context.makeFilterArray(["companycode"], "EQ", companycode).concat(
						context.makeFilterArray(["functionid"], "EQ", functionId)).concat(
						context.makeFilterArray(["serviceid"], "EQ", serviceId)).concat(
						context.makeFilterArray(["fundingroute"], "EQ", fdrroute)).concat(
						context.makeFilterArray(["dc"], "EQ", dc)).concat(
						context.makeFilterArray(["leg"], "EQ", leg)),
					success: function (oData) {
						var glaccount = "";
						if (oData.results.length) {
							glaccount = oData.results[0].glaccount;
							if (isFromRCCoding) {
								context.setPropInModel("localDataModel", "/rccoding/" + ix + "/glaccount", glaccount);
							}
						}
						resolve(glaccount);
					},
					error: function (oerror) {
						reject("");
					}
				});
			});
		},
		
		//@START: Task 254545
		onRCCodingRefresh: function(oEvent) {
			var context = this, count = 0, aPromise = [], glaccount = "", glaccenabled = false;
			sap.ui.core.BusyIndicator.show(0);
			var currObject = this.getPropInModel("localDataModel", "/benifCompanies/0/");
			var aRCCoding = this.getPropInModel("localDataModel", "/rccoding");
			//@START: Task 343375
			var aProviderDetails = this.getPropInModel("localDataModel", "/providerCompanies").filter(function(o) {
				return o.providercosttyp === "WBS";
			});
			return new Promise(function (resolve, reject) { 
				//@END: Task 343375
				jQuery.each(aProviderDetails, function (ix, ox) {
					aPromise.push(new Promise(function(resolve, reject) { //@Task 343375
						if (ox.providersystem === "SERP") {
							//Simple project
							if (context.getPropInModel("localDataModel", "/onlyproject") !== "N" && ox.projectdef && currObject.codeby === "CBPW") { //@Task 343375
								context.serpProjectSectionEvent.getL3WBSEntries(context, ox.projectdef).then(function (aL3WBS) {
									aL3WBS.forEach(function (oL3WBS) {
										//Check if already exists in RC Coding
										var aWBSRec = aRCCoding.filter(function(o) {
											return o.providerwbs === oL3WBS.WBS;
										});
										if(!aWBSRec.length) {
											//@START: Task 343375
											count = aRCCoding.length? parseInt(aRCCoding[aRCCoding.length - 1].itemno, 0) : 0;
											glaccount = aRCCoding.length ? aRCCoding[aRCCoding.length - 1].glaccount : "";
											glaccenabled = aRCCoding.length ? aRCCoding[aRCCoding.length - 1].glaccenabled : false;
											//@END: Task 343375
											aRCCoding.push({
												ACTION: "C",
												fdrno: context.getPropInModel("localDataModel", "/fdrno"), //@Task 343375
												codeby: currObject.codeby,
												itemno: (count + 10).toString(),
												servicetype: "006",
												beneficiarycompcode: currObject.erpcomcode,
												benitemno: currObject.itemno,
												bensubitemno: currObject.subitemno,
												providerwbs: oL3WBS.WBS,
												providerwbsdesc: oL3WBS.Description,
												costobjtyp: "CC",
												//@START: Task 343375
												glaccount: glaccount, 
												glaccenabled: glaccenabled,
												deletionflag: "N"
												//@END: Task 343375
											});
										}
									});
									context.setPropInModel("localDataModel", "/rccoding", aRCCoding);
									resolve(); //@Task 343375
								}).catch(function (oerror) {
									context.showMessage("Contact Admin - Error in getting Cost Collector WBSEs");
									reject(); //@Task 343375
								});
							}
							//@START: Task 343375
							else {
								resolve();
							}
							//@END: Task 343375
						}
						//@START: Task 342207
						//GSAP system
						else {
							//Check if already exists in RC Coding
							var aWBSRec = aRCCoding.filter(function(o) {
								return ox.providercostobj === o.providerwbs;
							});
							if(!aWBSRec.length && currObject.codeby === "CBPW") {
								context.gsapProjectSectionEvent.getProviderWBSDesc(context, ox.providercostobj).then(function (wbsdesc) {
									count = aRCCoding.length? parseInt(aRCCoding[aRCCoding.length - 1].itemno, 0) : 0;
									glaccount = aRCCoding.length ? aRCCoding[aRCCoding.length - 1].glaccount : "";
									aRCCoding.push({
										ACTION: "C",
										fdrno: context.getPropInModel("localDataModel", "/fdrno"),
										codeby: currObject.codeby,
										itemno: (count + 10).toString(),
										servicetype: "006",
										beneficiarycompcode: currObject.erpcomcode,
										benitemno: currObject.itemno,
										bensubitemno: currObject.subitemno,
										providerwbs: ox.providercostobj,
										providerwbsdesc: wbsdesc,
										costobjtyp: "CC", //as per existing logic, always defaulted to CC
										glaccount: glaccount,
										deletionflag: "N"
									});
									context.setPropInModel("localDataModel", "/rccoding", aRCCoding);
									resolve();
								}).catch(function (oerror) {
									context.showMessage("Error in getting RC Coding details");
									reject();
								});
							}
							else {
								resolve();
							}
						}
						//@END: Task 342207
					})); //@Task 343375
				});
				//@START: Task 343375
				Promise.all(aPromise).then(function() {
					//Check if any entry has no GL account
					var aGLAcc = context.getPropInModel("localDataModel", "/rccoding").filter(function(o) {
						return o.glaccount === "";
					});
					//Determine GL Account
					if(aGLAcc.length) {
						context.determineGLAccount(currObject).then(function() {
							sap.ui.core.BusyIndicator.hide();
							resolve();
						});
					}
					else {
						sap.ui.core.BusyIndicator.hide();
						resolve();
					}
				});
				//@END: Task 343375
			}); //@Task 343375
		},
		//@END: Task 254545

		//@START: Task 223713
		onRCCodingFragSave: function (oEvent) {
			var context = this;
			var aRCCoding = this.getPropInModel("localDataModel", "/rccoding");
			if (aRCCoding && aRCCoding.length && (this.getPropInModel("tileIdentityModel", "/role") === "CNC" || 
				(this.getPropInModel("localDataModel", "/workflowflag") !== "X" && this.getPropInModel("tileIdentityModel", "/role") === "GSR"))) { //@Bug 254551
				this.engagementParser.validateRCCoding(this, aRCCoding).then(function (oMessage) {
					context.showMessageToast(oMessage);
					context.rccodingFrag.close();
				}).catch(function (oerror) {
					context.showMessage(oerror);
				});
			} else {
				context.rccodingFrag.close();
			}
		},
		//@END: Task 223713

		onRCCodingFragClose: function () {
			if (this.rccodingFrag.isOpen()) {
				this.rccodingFrag.close();
			}
		},
		onGSAPProjFragClose: function () {
			if (this.gsapProjFrag.isOpen()) {
				this.gsapProjFrag.close();
			}
		},

		//@START: Task 231447
		onAddRowRCCodeComplex: function () {
			var oNewObject = {
				"ACTION": "C",
				"fdrno": this.getPropInModel("localDataModel", "/fdrno"),
				"itemno": this.getPropInModel("localDataModel", "/rccoding") ? (this.getPropInModel("localDataModel", "/rccoding").length * 10 +
					10).toString() : "10",
				"benitemno": this.getPropInModel("localDataModel", "/rcCodeComplex/benitemno"),
				"bensubitemno": this.getPropInModel("localDataModel", "/rcCodeComplex/bensubitemno"),
				"beneficiarycompcode": this.getPropInModel("localDataModel", "/rcCodeComplex/beneficiarycompcode"),
				"servicetype": "006",
				"glaccount": this.getPropInModel("localDataModel", "/rcCodeComplex/glaccount"),
				"costobjtype": "CC",
				"costobj": "",
				"codeby": "CBPW",
				"providerwbs": "",
				"deletionflag": "N"
			};
			var aRCCodeComplexData = this.getPropInModel("localDataModel", "/rccoding") ? this.getPropInModel("localDataModel", "/rccoding") : [];
			aRCCodeComplexData.push(oNewObject);
			this.setPropInModel("localDataModel", "/rccoding", aRCCodeComplexData);
		},

		onDeleteRowRCCodeComplex: function (oEvent) {
			var aRCCodeComplex = this.getPropInModel("localDataModel", "/rccoding");
			var oRCCodeComplex = this.getPropInModel("localDataModel", "/rcCodeComplex");
			var oListItem = oEvent.getParameter("listItem");
			var sPath = oListItem.getBindingContextPath();
			var oItem = this.getPropInModel("localDataModel", sPath);
			if (oItem.providerwbs) {
				oItem.deletionflag = "X";
			} else {
				aRCCodeComplex.splice(aRCCodeComplex.indexOf(oItem), 1);
			}
			this.rccodingComplexFrag.getContent()[0].getBinding("items").filter(this.makeFilterArray(["benitemno"], "EQ", oRCCodeComplex
					.benitemno).concat(this.makeFilterArray(["bensubitemno"], "EQ", oRCCodeComplex.bensubitemno))
				.concat(this.makeFilterArray(["deletionflag"], "NE", "X")), "Application");
			this.getView().getModel("localDataModel").refresh();
		},

		onComplexRCCodeSave: function () {
			var context = this;
			var aComplexEntries = this.getPropInModel("localDataModel", "/rccoding");
			if (!aComplexEntries.length) {
				sap.m.MessageBox.error("No entries to save");
				return;
			}
			//Check if all RC Coding fields are filled and no duplicates
			var aComplexData = aComplexEntries.filter(function(o) {
				return o.deletionflag !== "X";
			});
			context.validateRCCodeComplexFields(aComplexData).then(function (check) {
				//Close dialog
				context.rccodingComplexFrag.close();
			}).catch(function (oerror) {
				context.showMessage(oerror);
			});
		},

		//Check if all fields are filled in and no duplicates in WBSE column
		validateRCCodeComplexFields: function (aComplexEntries) {
			var context = this;
			return new Promise(function (resolve, reject) {
				var check = true;
				//Check if any of the values are empty
				aComplexEntries.forEach(function (oEntry) {
					if (!oEntry.providerwbs || !oEntry.costobjtyp || !oEntry.costobj || 
						(oEntry.costobjtyp && oEntry.costobjtyp !== "PO" && !oEntry.glaccount)) {
						check = false;
					}
				});

				if (!check) {
					reject("Please enter all mandatory fields");
				}

				//Check if duplicate entries in Value column
				var oRCCodeComplex = context.getPropInModel("localDataModel", "/rcCodeComplex");
				var aWBSValues = aComplexEntries.filter(function (item) {
					return item.benitemno === oRCCodeComplex.benitemno && item.bensubitemno === oRCCodeComplex.bensubitemno;
				}).map(function (o) {
					return o.providerwbs;
				});
				var isDuplicate = aWBSValues.some(function (item, idx) {
					return aWBSValues.indexOf(item) !== idx;
				});
				if (isDuplicate) {
					reject("WBS column cannot have duplicate entries");
				}
				resolve(check);
			});
		},

		onComplexRCCodeCancel: function () {
			this.rccodingComplexFrag.close();
		},
		//@END: Task 231447
		/**
		 * ********************************************************************************
		 */

		GCRSubmit: function () {
			var context = this;
			//check for mandate Fields
			context.setPropInModel("busyModel", "/flag", true);
			context.setPropInModel("localDataModel", "/fdrstatus", "INPR");
			//@START: Task 228349
			var fdrStatusAll = context.getPropInModel("localDataModel", "/fdrstatusall");
			context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["INPR"] ? fdrStatusAll["INPR"] :
				"In Process");
			//@END: Task 228349
			this.makeFDRPayload().then(function (data) {
				//context.setPropInModel("busyModel", "/flag", false);
				if (data.rcode === "SUCCESS") {
					var makeEng = false,
						oldEng = "";
					context.setToUpdateFlag();
					if (!context.getPropInModel("localDataModel", "/fdrno")) {
						//change the flags
						context.setPropInModel("localDataModel", "/fdrno", data.messages[0].fdrno);
						//make Engagemetn Call
					}
					//context.setPropInModel("busyModel", "/flag", true);
					context.onEngagementOperation().then(function (oData) {
						//context.setPropInModel("busyModel", "/flag", false);
						if (oData === "SUCCESS") {
							var nonEngLines = context.getPropInModel("localDataModel", "/providerCompanies").filter(function (e) {
								return !e.engagmentno;
							});
							//@START: Task 228349
							var fdrstatus = nonEngLines.length ? "INPR" : "RELSD";
							context.setPropInModel("localDataModel", "/fdrstatus", fdrstatus);
							context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[fdrstatus] ? fdrStatusAll[fdrstatus] :
								"");
							//@END: Task 228349
							//Eng Type and Recovery type needs to be updated 
							//context.setPropInModel("busyModel", "/flag", true);
							context.makeFDRPayload().then(function (data) {
								//context.setPropInModel("busyModel", "/flag", false);
								if (data.rcode === "SUCCESS") {
									var fdrno = context.getPropInModel("localDataModel", "/fdrno");
									context.showMessage("FDR " + fdrno + " Successfully Submitted");
									context.setBusy(false);
									//@START: Update MCS WBS Settlement Rule
									var mcsProjDefn = context.getPropInModel("localDataModel", "/benifCompanies")[0].mcsprojdef;
									mcsProjDefn = mcsProjDefn.replace("/", "");
									context.projectParser.readGSAPProjectDetails(context, mcsProjDefn).then(function (odata) {
										var aL1WBS = [];
										if (odata.wbs.results) {
											aL1WBS = odata.wbs.results.filter(function (o) {
												return o.Level.trim() === "1";
											});
											if (aL1WBS.length) {
												context.projectParser.makeSettlementPayload(context, odata, aL1WBS[0]).then(function () {
													context.showMessageToast("MCS WBS Settlement Rule updated");
												}).catch(function (oerror) {
													context.showMessageToast("Unable to update MCS WBS Settlement Rule");
												});
											}
										}
									}).catch(function (oerror) {
										context.showMessageToast("Unable to update MCS WBS Settlement Rule");
									});
									//@END: Update MCS WBS Settlement Rule

									context.engagementParser.updateGCLeg2Engagement(context); //@Task 238325

									//@START: Task 223652
									var fdrStatusAuditLog = nonEngLines.length ? fdrStatusAll["INPR"] :
										fdrStatusAll["RELSD"] + " and Engagement Updated";
									context.utilityParser.updateAuditLog(context, fdrStatusAuditLog + " by GSR");
									//@END: Task 223652
									
									//@START: Task 319741
									if(context.getPropInModel("localDataModel", "/fdrstatus") === "RELSD") {
										//context.utilityParser.sendDSEmail(context); //@Task 276794
										context.setPropInModel("localDataModel", "/viewmode", "DISPLAY");
									}
									//@END: Task 319741
								}
							}).catch(function (oerror) {
								context.showMessageToast("Error in updating Engagement details in FDR");
								context.setBusy(false);
							});
						}
					});
				} else {
					context.setPropInModel("localDataModel", "/fdrstatus", "INPR");
					context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["INPR"] ? fdrStatusAll["INPR"] :
						"In Process"); //@Task 228349
					context.makeFDRPayload();
					context.setBusy(false);
				}
			}).catch(function (oerror) {
				context.showMessage("Error in saving FDR " + context.getPropInModel("localDataModel", "/fdrno"));
				context.setBusy(false);
			});
		},
		UPDirSubmit: function (workflow) {
			var context = this,
				fdrStatusAuditLog = ""; //@Task 223652
			var fdrStatusAll = context.getPropInModel("localDataModel", "/fdrstatusall"); //@Task 228349
			if (this.checkMandatoryFields("UP")) {
				context.setPropInModel("busyModel", "/flag", true);
				//@START: Bug 217220
				if (context.getPropInModel("localDataModel", "/business") === "UP") {
					//@START: Task 304168
					//context.setPropInModel("localDataModel", "/providerCompanies/0/providercosttyp", "WBS");
					var provCompanies = context.getPropInModel("localDataModel", "/providerCompanies");
					jQuery.each(provCompanies, function(ix, ox){
						context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercosttyp", "WBS");
					});
					//@END: Task 304168
				}
				//@END: Bug 217220
				context.makeFDRPayload().then(function (data) {
					if (data.rcode === "SUCCESS") {
						var status = "",
							statusDesc = "";
						context.setToUpdateFlag();
						//Complex project
						if (context.getPropInModel("localDataModel", "/onlyproject") === "N") {
							var check = true;
							jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (ix, ox) {
								if (!ox.providercostobj) {
									check = false;
								}
							});
							jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
								if (!ox.engagmentno) {
									check = false;
								}
							});
							if (check && (context.getPropInModel("tileIdentityModel", "/role") === "GSR" || 
								context.getPropInModel("tileIdentityModel", "/role") === "GSRWF" || 
								context.getPropInModel("tileIdentityModel", "/role") === "ADMIN")) { //@Task 290069, 349972
								status = "RELSD";
								statusDesc = "Released";
								fdrStatusAuditLog = fdrStatusAll[status] + " and Engagement Updated by GSR"; //@Task 223652
								//context.engagementParser.releaseFDRComplex(context);//@Task 232399, 332986
							} else {
								//Validation in case Project WBS/Engagement Number is blank
								if(context.getPropInModel("tileIdentityModel", "/role") === "GSR" 
									|| context.getPropInModel("tileIdentityModel", "/role") === "GSRWF") { //@Task 290069
									context.showMessage("Project WBS/Engagement Number cannot be blank");
									context.setPropInModel("busyModel", "/flag", false);
									return;
								}
								//@START: Task 304170
								var role = context.getPropInModel("tileIdentityModel", "/role");
								if(role === "RNA") {
									role = "R&A";
								}
								else if(role === "GSRWF") {
									role = "GSR";
								}
								//@END: Task 304170
								status = context.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "CHGSR" :
									(context.getPropInModel("localDataModel", "/workflowflag") === "X" ? "PNGSR" : "INPR");
								statusDesc = context.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change Pending GSR" :
									(context.getPropInModel("localDataModel", "/workflowflag") === "X" ? "Pending GSR" : "In Process");
								//@Task 304170
								fdrStatusAuditLog = context.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change Approved by " + role :
									(context.getPropInModel("localDataModel", "/workflowflag") === "X" ? "Approved by " + role : "In Process");
							}
							//Update engagement for Complex FDR
							//@START: Task 332986
							if(status === "RELSD") {
								context.onEngagementOperationComplex().then(function() {
									context.onComplexFDRSave(context, fdrStatusAuditLog, status, statusDesc, fdrStatusAll);
								}).catch(function () {
									context.setPropInModel("busyModel", "/flag", false);
								});
							}
							else {
								context.onComplexFDRSave(context, fdrStatusAuditLog, status, statusDesc, fdrStatusAll);
							}
							//@END: Task 332986
						}
						//Simple Project
						else {
							context.onEngagementOperation().then(function (oData) {
								if (oData === "SUCCESS") {
									//check Status.
									if (workflow) {
										status = context.getPropInModel("localDataModel", "/fdrstatus");
										statusDesc = context.getPropInModel("localDataModel", "/fdrstatusdesc");
										fdrStatusAuditLog = (context.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change " : "") +
											"Approved by " +
											(context.getPropInModel("tileIdentityModel", "/role") === "RNA" ? "R&A" : context.getPropInModel("tileIdentityModel",
												"/role") === "GSRWF" ? "GSR" : context.getPropInModel("tileIdentityModel", "/role"));
									} else {
										status = "INPR";
										statusDesc = "In Process";
										fdrStatusAuditLog = fdrStatusAll[status] + " by GSR"; //@Task 223652
									}
									var check = true;
									jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
										if (!ox.engagmentno) {
											check = false;
										}
									});
									if (check) {
										status = "RELSD";
										statusDesc = "Released";
										fdrStatusAuditLog = fdrStatusAll[status] + " and Engagement Updated by " + (context.getPropInModel("tileIdentityModel",
												"/role") === "RNA" ? "R&A" : 
											context.getPropInModel("tileIdentityModel", "/role") === 'GSRWF' ? 'GSR' : context.getPropInModel("tileIdentityModel", "/role")); //@Task 223652
										//@START: Task 217556 - Auto update of ECT in SERP Simple project (DIR-US)
										var projectDef = context.getPropInModel("localDataModel", "/providerCompanies/0/projectdef");
										var level2Def = context.getPropInModel("localDataModel", "/providerCompanies/0/providercostobj");
										var engagementNo = context.getPropInModel("localDataModel", "/benifCompanies/0/engagmentno");
										if (projectDef && level2Def && engagementNo) {
											context.serpProjectSectionEvent.saveEngagementInSerp(projectDef, level2Def, engagementNo, context);
										}
										//@END: Task 217556
									}
									context.setPropInModel("localDataModel", "/fdrstatus", status);
									context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] ? fdrStatusAll[status] :
										statusDesc);

									context.makeFDRPayload().then(function (data) {
										if (data.rcode === "SUCCESS") {
											var fdrno = context.getPropInModel("localDataModel", "/fdrno");
											context.showMessage("FDR " + fdrno + " Successfully Updated");
											context.utilityParser.updateAuditLog(context, fdrStatusAuditLog); //@Task 233652
											//@START: Task 309492
											if(status === "RELSD") {
												if(context.getPropInModel("localDataModel", "/workflowflag") === "X")
												{
													context._makeEmailPayload();	
												}
												context.setPropInModel("localDataModel", "/viewmode", "DISPLAY"); //@Task 319741
											}
											//@END: Task 309492
											context.setPropInModel("busyModel", "/flag", false);
										} else {
											context.setPropInModel("busyModel", "/flag", false);
										}
									}).catch(function () {
										context.setPropInModel("busyModel", "/flag", false);
										context.showMessage("Error in saving FDR");
									});

								} else {
									context.setPropInModel("busyModel", "/flag", false);
								}
							}).catch(function (e) {
								context.setPropInModel("busyModel", "/flag", false);
								context.showMessage("Error in saving FDR");
							});
						}
					} else {
						context.setPropInModel("busyModel", "/flag", false);
					}
				}).catch(function (oerror) {
					context.setPropInModel("busyModel", "/flag", false);
					context.showMessage("Error in saving FDR " + context.getPropInModel("localDataModel", "/fdrno"));
				});
			}
		},
		//@START: Task 332986
		onComplexFDRSave: function(context, fdrStatusAuditLog, status, statusDesc, fdrStatusAll) {
			//Update status
			context.setPropInModel("localDataModel", "/fdrstatus", status);
			context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] ? fdrStatusAll[status] :
				statusDesc);
			//Create payload and save to SCP						
			context.makeFDRPayload().then(function (data) {
				if (data.rcode === "SUCCESS") {
					var fdrno = context.getPropInModel("localDataModel", "/fdrno");
					context.showMessage("FDR " + fdrno + " Successfully Updated");
					context.utilityParser.updateAuditLog(context, fdrStatusAuditLog); //@Task 233652
					//@START: Task 309492
					if(status === "RELSD") {
						if(context.getPropInModel("localDataModel", "/workflowflag") === "X") {
							context._makeEmailPayload();
						}
						context.setPropInModel("localDataModel", "/viewmode", "DISPLAY"); //@Task 319741
					}
					//@END: Task 309492
					context.setPropInModel("busyModel", "/flag", false);
					context.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
				} else {
					context.setPropInModel("busyModel", "/flag", false);
				}
			}).catch(function (oerror) {
				context.setPropInModel("busyModel", "/flag", false);
				context.showMessage("Error in saving FDR");
			});
		},
		//@END: Task 332986
		DSDirSubmit: function () {
			var context = this,
				fdrStatusAuditLog = ""; //@Task 233652
			var fdrStatusAll = context.getPropInModel("localDataModel", "/fdrstatusall"); //@Task 228349
			if (this.checkMandatoryFields("DS")) {
				context.setPropInModel("busyModel", "/flag", true);
				context.makeFDRPayload().then(function (data) {
					if (data.rcode === "SUCCESS") {
						context.setToUpdateFlag();
						//@START: Bug 374526
						var aNoCostObjVal = context.getPropInModel("localDataModel", "/rccoding").filter(function (o) {
							return !o.costobj;
						});
						if(aNoCostObjVal.length) {
							context.showMessage("Please add missing Cost Object Values in Recipient Coding");
							context.setPropInModel("busyModel", "/flag", false);
							return;
						}
						//@END: Bug 374526
						context.onEngagementOperation().then(function (oData) {
							if (oData === "SUCCESS") {
								//check Status.
								context.setPropInModel("localDataModel", "/fdrstatus", "INPR");
								context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["INPR"] ? fdrStatusAll["INPR"] :
									"In Process"); //@Task 228349
								fdrStatusAuditLog = fdrStatusAll["INPR"] + " by GSR"; //@Task 233652
								var check = true;
								jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
									if (!ox.engagmentno) {
										check = false;
									}
								});
								if (check) {
									context.setPropInModel("localDataModel", "/fdrstatus", "RELSD");
									context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["RELSD"] ? fdrStatusAll["RELSD"] :
										"Released"); //@Task 228349
									fdrStatusAuditLog = fdrStatusAll["RELSD"] + " and Engagement Updated by GSR"; //@Task 233652
								}
								context.makeFDRPayload().then(function (data) {
									if (data.rcode === "SUCCESS") {
										var fdrno = context.getPropInModel("localDataModel", "/fdrno");
										context.showMessage("FDR " + fdrno + " Successfully Updated");
										context.utilityParser.updateAuditLog(context, fdrStatusAuditLog); //@Task 233652
										//@START: Task 276794
										if(context.getPropInModel("localDataModel", "/fdrstatus") === "RELSD") {
											context.utilityParser.sendDSEmail(context);
											context.setPropInModel("localDataModel", "/viewmode", "DISPLAY"); //@Task 319741
										}
										//@END: Task 276794
										context.setPropInModel("busyModel", "/flag", false);
									} else {
										context.setPropInModel("busyModel", "/flag", false);
									}
								}).catch(function (oError) {
									context.setPropInModel("busyModel", "/flag", false);
									context.showMessage("Error in saving FDR");
								});
							} else {
								context.setPropInModel("busyModel", "/flag", false);
							}
						}).catch(function (e) {
							context.setPropInModel("busyModel", "/flag", false);
						});

					} else {
						context.setPropInModel("busyModel", "/flag", false);
					}
				}).catch(function (oError) {
					context.setPropInModel("busyModel", "/flag", false);
					context.showMessage("Error in saving FDR " + context.getPropInModel("localDataModel", "/fdrno"));
				});
			}
		},
		EBDSubmit: function () {
			var context = this,
				fdrStatusAuditLog = ""; //@Task 233652
			var fdrStatusAll = context.getPropInModel("localDataModel", "/fdrstatusall"); //@Task 228349
			//check for Project; 
			context.setPropInModel("busyModel", "/flag", true);
			context.makeEBDHUBProject().then(function (indicator) {
				if (indicator === "SUCCESS") {
					context.makeFDRPayload().then(function (data) {
						if (data.rcode === "SUCCESS") {
							context.setToUpdateFlag();
							context.onEngagementOperation().then(function (oData) {
								if (oData === "SUCCESS") {
									//check Status.
									context.setPropInModel("localDataModel", "/fdrstatus", "INPR");
									context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["INPR"] ? fdrStatusAll["INPR"] :
										"In Process"); //@Task 228349
									fdrStatusAuditLog = fdrStatusAll["INPR"] + " by GSR"; //@Task 233652

									var check = true;
									jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (ix, ox) {
										if (!ox.engagmentno) {
											check = false;
										}
									});
									jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
										if (!ox.engagmentno && parseFloat(ox.beneficiaryamt)) {
											check = false;
										}
									});
									if (check) {
										context.setPropInModel("localDataModel", "/fdrstatus", "RELSD");
										context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["RELSD"] ? fdrStatusAll[
											"RELSD"] : "Released"); //@Task 228349
										fdrStatusAuditLog = fdrStatusAll["RELSD"] + " and Engagement Updated by GSR"; //@Task 233652
									}
									context.makeFDRPayload().then(function (data) {
										if (data.rcode === "SUCCESS") {
											var fdrno = context.getPropInModel("localDataModel", "/fdrno");
											context.showMessage("FDR " + fdrno + " Successfully Updated");
											context.utilityParser.updateAuditLog(context, fdrStatusAuditLog); //@Task 233652
											//@START: Task 276794
											if(context.getPropInModel("localDataModel", "/fdrstatus") === "RELSD") {
												context.utilityParser.sendDSEmail(context);
												context.setPropInModel("localDataModel", "/viewmode", "DISPLAY"); //@Task 319741
											}
											//@END: Task 276794
											
											//Update history table for EBD
											context.updateFDRActualsHistory(); //@Task 278528
											
											context.setPropInModel("busyModel", "/flag", false);
										} else {
											context.setPropInModel("busyModel", "/flag", false);
										}
									}).catch(function () {
										context.setPropInModel("busyModel", "/flag", false);
										context.showMessage("Error in saving FDR");
									});
								} else {
									context.setPropInModel("busyModel", "/flag", false);
								}
							}).catch(function (error) {
								context.setPropInModel("busyModel", "/flag", false);
							});
						} else {
							context.setPropInModel("busyModel", "/flag", false);
						}
					}).catch(function () {
						context.setPropInModel("busyModel", "/flag", false);
						context.showMessage("Error in saving FDR " + context.getPropInModel("localDataModel", "/fdrno"));
					});
				} else {
					context.setPropInModel("busyModel", "/flag", false);
				}
			}).catch(function (error) {
				context.setPropInModel("busyModel", "/flag", false);
				context.showMessage(error);
			});
		},
		miniMumDataCheck: function () {
			var allData = this.getPropInModel("localDataModel", "/");
			if (!allData.providerCompanies.length || !allData.benifCompanies.length) {
				this.showMessage("Can Not Save/Submit without atleast 1 Provider and 1 Benificiary");
				this.setBusy(false);
				return false;
			} else {
				return true;
			}
		},
		onSave: function (withoutMessage) {
			this.setBusy(true);
			var context = this;
			var fdrStatusAll = context.getPropInModel("localDataModel", "/fdrstatusall"); //@Task 228349
			//@START: Task 223652
			var fdrStatusAuditLog = context.getPropInModel("localDataModel", "/fdrstatusauditlog");
			if (!fdrStatusAuditLog) {
				fdrStatusAuditLog = fdrStatusAll["INPR"] + " by " + context.getPropInModel("tileIdentityModel", "/role");
			}
			//@END: Task 223652
			if (this.miniMumDataCheck()) {
				if (!context.getPropInModel("localDataModel", "/fdrstatus")) {
					context.setPropInModel("localDataModel", "/fdrstatus", "INPR");
					context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["INPR"] ? fdrStatusAll["INPR"] :
						"In Process"); //@Task 228349
					fdrStatusAuditLog = fdrStatusAll["INPR"] + " by " + context.getPropInModel("tileIdentityModel", "/role"); //@Task 223652
				}
				//@START: Bug 217220
				if (context.getPropInModel("localDataModel", "/business") === "UP") {
					//@START: Task 304168
					//context.setPropInModel("localDataModel", "/providerCompanies/0/providercosttyp", "WBS");
					var provCompanies = context.getPropInModel("localDataModel", "/providerCompanies");
					jQuery.each(provCompanies, function (ix, ox) {
						context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providercosttyp", "WBS");
					});
					//@END: Task 304168
				}
				if (context.getPropInModel("tileIdentityModel", "/role") === "ADMIN") {
					fdrStatusAuditLog = (context.getPropInModel("localDataModel", "/fdrstatus") === "RELSD") ? "Submitted by ADMIN" 
						: "Modified by ADMIN"; //@Task 349972
				}
				//@END: Bug 217220
				//@START: Task 319741
				if (context.getPropInModel("tileIdentityModel", "/role") === "SUPADM") {
					fdrStatusAuditLog = "Modified by GSR Support";
					var status = "INPR", statusDesc = "In Progress";
					if (context.getPropInModel("localDataModel", "/workflowflag") === "X") {
						var currentStatus = context.getPropInModel("localDataModel", "/fdrstatus");
						status = (currentStatus === "RELSD" || currentStatus.startsWith("CH")) ? "CHGSR": "CRETD";
						statusDesc = (currentStatus === "RELSD" || currentStatus.startsWith("CH")) ? "Change Pending GSR": "Created";
					}
					context.setPropInModel("localDataModel", "/fdrstatus", status);
					context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] ? fdrStatusAll[status] :
						statusDesc);
				}
				//@END: Task 319741
				var toRecipients = context.compareUserData(); //@Task 319428
				//@START: Task 233072
				this.makeFDRPayload().then(function (data) {
					if (data.rcode === "SUCCESS") {
						context.setToUpdateFlag();
						if (withoutMessage !== true) {
							var fdrno = context.getPropInModel("localDataModel", "/fdrno");
							//@START: Task 349972
							if(context.getPropInModel("localDataModel", "/fdrstatus") !== "RELSD") {
								context.showMessage("FDR " + fdrno + " Successfully Saved");	
							}
							//@END: Task 349972
							if(typeof(withoutMessage) !== "object") { //Triggered via program and not through button event
								context.utilityParser.updateAuditLog(context, fdrStatusAuditLog); //@Task 223652
								context._makeEmailPayload(); //@ Task 229719
							}
							//@START: Task 278528
							//Update history table for EBD
							if(context.getPropInModel("localDataModel", "/fdrroute") === "EBD") {
								context.updateFDRActualsHistory();
							}
							//@END: Task 278528
							//@START: Task 319428, 349972
							//Compare previous data with what has changed in current session
							if(context.getPropInModel("tileIdentityModel", "/role") === "ADMIN") {
								if(context.getPropInModel("localDataModel", "/fdrstatus") !== "RELSD") {
									if(context.getPropInModel("localDataModel", "/workflowflag") === "X") {
										var initiator = context.getPropInModel("localDataModel", "/initiator");
										var gsrfocal = context.getPropInModel("localDataModel", "/gsrfocal");
										if(toRecipients.length) {
											context.utilityParser.sendWFEmail(context, toRecipients, [initiator, gsrfocal]);
										}
										//Update the changed values to dbDataModel
										context.updatePreviousUserValues(); //@Task 319428
									}
								}
								else {
									//TODO - Submit FDR and then send email
									context.onSubmit();
									
								}
							}
							//@END: Task 319428, 349972
							//@START: Task 343532
							//Send email to GSR on Super Admin Save for WF model
							if(context.getPropInModel("tileIdentityModel", "/role") === "SUPADM" && context.getPropInModel("localDataModel", "/workflowflag") === "X") {
								var superadmin = context.getPropInModel("userDetailsModel", "/name");
								var initiator = context.getPropInModel("localDataModel", "/initiator");
								var gsrfocal = context.getPropInModel("localDataModel", "/gsrfocal");
								context.utilityParser.sendWFEmail(context, gsrfocal, [initiator, superadmin]);
							}
							//@END: Task 343532
							context.setBusy(false);
						} else {
							context.showMessageToast("Provider and Beneficiary details saved");
							context.setBusy(false);
							//Call Contract Validation service
							context.checkForContractsSearcher();
						}
					} else {
						if (withoutMessage) {
							context.showMessageToast("Error in saving FDR");
						} else {
							context.showMessage("Error in saving FDR");
						}
						context.setBusy(false);
					}
				}).catch(function (oerror) {
					if (withoutMessage) {
						context.showMessageToast("Error in saving FDR");
					} else {
						context.showMessage("Error in saving FDR");
					}
					context.setBusy(false);
				});
				//@END: Task 233072
			}
		},

		//@START: Task 229719
		_makeEmailPayload: function () {
			var context = this;
			var fdrstatus = this.getPropInModel("localDataModel", "/fdrstatus");
			var initiator = this.getPropInModel("localDataModel", "/initiator");
			var requestor = this.getPropInModel("localDataModel", "/createdby");
			var gsrfocal = this.getPropInModel("localDataModel", "/gsrfocal");
			var providerconfirmer = this.getPropInModel("localDataModel", "/providerCompanies/0/providerconfirmer");
			var consumer = this.getPropInModel("localDataModel", "/benifCompanies/0/consumer");
			var rnafocal = this.getPropInModel("localDataModel", "/rnafocal");
			switch (fdrstatus) {
				case 'PCNRD':
					context.utilityParser.sendWFEmail(context, providerconfirmer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CSCNR':
					context.utilityParser.sendWFEmail(context, consumer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'RNUPD':
					context.utilityParser.sendWFEmail(context, rnafocal, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'GSREJ':
					context.utilityParser.sendWFEmail(context, initiator, [gsrfocal]); //@Task 314913
					break;
				case 'PNREJ':
					context.utilityParser.sendWFEmail(context, initiator, [gsrfocal]); //@Task 314913
					break;
				case 'CSREJ':
					context.utilityParser.sendWFEmail(context, initiator, [gsrfocal]); //@Task 314913
					break;
				case 'RNREJ':
					context.utilityParser.sendWFEmail(context, gsrfocal, []); //@Task 314913
					break;
					//@START: Task 232398
				case 'CHGSR':
					context.utilityParser.sendWFEmail(context, gsrfocal, [providerconfirmer, initiator, consumer]);
					break;
				case 'CHPRD':
					context.utilityParser.sendWFEmail(context, providerconfirmer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CHPCR':
					context.utilityParser.sendWFEmail(context, providerconfirmer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CHCSR':
					context.utilityParser.sendWFEmail(context, consumer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CHCRN':
					context.utilityParser.sendWFEmail(context, consumer, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CHRNA':
					context.utilityParser.sendWFEmail(context, rnafocal, [initiator, gsrfocal]); //@Task 314913
					break;
				case 'CHRJI':
					context.utilityParser.sendWFEmail(context, initiator, [gsrfocal, rnafocal]); //@Task 314913
					break;
				case 'CHRJG':
					context.utilityParser.sendWFEmail(context, gsrfocal, [rnafocal]); //@Task 314913
					break;
					//@END: Task 232398
					//@START: Task 232399
				case 'CLPRE':
					context.utilityParser.sendWFEmail(context, gsrfocal, [initiator, rnafocal]); //@Task 314913
					break;
				//@END: Task 232399
				//@START: Task 309492
				case 'RELSD':
					//@START: Task 349972
					if(context.getPropInModel("tileIdentityModel", "/role") === "ADMIN") {
						var toRecipients = context.compareUserData();
						context.utilityParser.sendWFEmail(context, toRecipients, [initiator, gsrfocal]);
						//Update the changed values to dbDataModel
						context.updatePreviousUserValues();
					}
					else {
						context.utilityParser.sendWFEmail(context, initiator, [gsrfocal]);
					}
					//@END: Task 349972
					break;
				case 'CLOSD':
					context.utilityParser.sendWFEmail(context, initiator, [gsrfocal]);
					break;
				//@END: Task 309492
			}
		},
		//@END: Task 229719

		checkMandatoryFields: function (additional) {
			var allData = this.getPropInModel("localDataModel", "/");
			var role = this.getPropInModel("tileIdentityModel", "/role");//@Bug 248427
			var toAdd = additional ? additional : "";
			if (allData.fdrroute) {
				var toSend = true;
				var mandateFields = this.getPropInModel("mandateFieldsLocalModel", "/" + allData.fdrroute + toAdd);
				//headerCheck
				jQuery.each(mandateFields.header, function (ix, ox) {
					if (!allData[ox]) {
						toSend = false;
					}
				});
				//@START: Bug 248427
				if(role === "GSRWF" && allData.business === "UP" && allData.workflowflag === "X") { //@Task 290069
					if(!allData.gsrfocal || !allData.rnafocal) {
						toSend = false;
					}
				}
				//@END: Bug 248427
				
				//provider
				jQuery.each(allData.providerCompanies, function (iy, oy) {
					jQuery.each(mandateFields.provider, function (ix, ox) {
						if (oy["deletionflag"] !== "X" && !oy[ox]) {
							toSend = false;
						}
					});
					//@START: Bug 279627
					if(allData.business === "UP" && allData.workflowflag === "X" && allData.onlyproject !== "N" && (!oy.projectdef || !oy.providercostobj)) {
						toSend = false;
					}
					//@END: Bug 279627
				});
				//ben
				jQuery.each(allData.benifCompanies, function (iy, oy) {
					jQuery.each(mandateFields.benificiary, function (ix, ox) {
						if (oy["deletionflag"] !== "X" && !oy[ox]) {
							toSend = false;
						}
					});
				});
				if (!toSend) {
					this.showMessage("Please Add All Mandatory Fields");
					this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
					this.setBusy(false);
				}
				else {
					if(allData.fdrroute === "DIR" || allData.fdrroute === "EBD") {
						toSend = this.compareBudgetValue(allData); //@Bug 251082
						if(!toSend) {
							this.setPropInModel("localDataModel", "/locksubmit", "N");
							this.setBusy(false);
						}
					}
					//@START: Task 292448
					//Validate and check if IM Parameters are available for Complex project in R&A tile. If not, error to be displayed
					if (role === "RNA" && allData.onlyproject === "N") {
						var aComplexIMData = allData.addlProjDetails.filter(function(o) {
							return o.code === "IMCX" && o.deletionflag !== "X";
						});
						if(!aComplexIMData.length) {
							toSend = false;
							this.showMessage("Please Add IM Position");
							this.setPropInModel("localDataModel", "/locksubmit", "N");
							this.setBusy(false);
						}
					}
					//@END: Task 292448
				}
				return toSend;
			} else {
				this.showMessage("Please Add All Mandatory Fields");
				this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
				this.setBusy(false);
				return false;
			}
		},
		
		//@START: Bug 251082
		compareBudgetValue: function(allData) {
			var toSend = true, planBudgetValue = 0, totalActualBudget = 0, actualBudgetValue = [];
			//Check if Plan and Total actual budget have same value
			if(!allData.planbudgetvalue || allData.planbudgetvalue === "") {
				this.showMessage("Plan budget value cannot be empty");
				toSend = false;
			}
			else {
				planBudgetValue = parseFloat(allData.planbudgetvalue);
				
				if(allData.addlProjDetails) {
					actualBudgetValue = allData.addlProjDetails.filter(function(o) {
						return o.code === "PLBD" && o.deletionflag !== "X";
					});	
				}
				actualBudgetValue.forEach(function(o) {
					if(o.description && o.description !== "") {
						totalActualBudget += parseFloat(o.description);
					}
				});
				//Roundoff to correct number of decimal places
				totalActualBudget = this.roundOffValue(totalActualBudget, planBudgetValue);
				if(planBudgetValue !== totalActualBudget) {
					this.showMessage("Total budget value is not equal to Plan Budget Value");
					toSend = false;
				}
			}
			return toSend;
		},
		//@END: Bug 251082
		onReject: function (oEvent) {
			//@START: Task 217083
			var rejectionReason = this.rejectReasonFrag.getContent()[0].getSelectedItem().getTitle();
			if (!rejectionReason || rejectionReason === "") {
				this.showMessage("Please select a Reason for Rejection");
				return;
			} else {
				this.setPropInModel("localDataModel", "/rejectionreason", rejectionReason);
			}
			//@END: Task 217083

			//@START: Task 211175 - For routing to Initiator
			var fdrStatusAll = this.getPropInModel("localDataModel", "/fdrstatusall");
			var status = "", statusDesc = "", role = "";//@Task 240410
			//FDR created by Initiator
			if (this.getPropInModel("localDataModel", "/workflowflag") === "X") {
				//GSR Reject routed to Initiator
				if (this.getPropInModel("tileIdentityModel", "/role") === "GSRWF") { //@Task 290069
					status = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "CHRJI" : "GSREJ";
					statusDesc = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change GSR Rejected" : "GSR Rejected";
					role = "GSR";
				}
				//Provider Reject routed to Initiator
				else if (this.getPropInModel("tileIdentityModel", "/role") === "PRC") {
					status = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "CHRJG" : "PNREJ";
					statusDesc = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change Provider Rejected" : "Provider Rejected";
					role = "Provider Confirmer";
				}
				//Consumer Reject routed to Initiator
				else if (this.getPropInModel("tileIdentityModel", "/role") === "CNC") {
					status = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "CHRJG" : "CSREJ";
					statusDesc = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change Consumer Rejected" : "Consumer Rejected";
					role = "Consumer";
				}
				//RNA Reject routed to GSR
				else if (this.getPropInModel("tileIdentityModel", "/role") === "RNA") {
					status = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "CHRJG" : "RNREJ";
					statusDesc = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change R&A Rejected" : "R&A Rejected";
					role = "R&A";
				}
				this.setPropInModel("localDataModel", "/fdrstatus", status); 
				this.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] && !status.startsWith("CH") ? fdrStatusAll[status] : statusDesc); //@Task 228349
			}
			//FDR created by GSR -- All rejects routed to GSR
			// else {
			// 	this.setPropInModel("localDataModel", "/fdrstatus", "CRETD");
			// 	this.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["CRETD"] ? fdrStatusAll["CRETD"] : "Created"); //@Task 228349
			// }
			//@END: Task 211175
			var changeText = this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH") ? "Change " : "";
			this.setPropInModel("localDataModel", "/fdrstatusauditlog", changeText + "Rejected by " + role); //@Task 223652
			this.onSave();
			this.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197

			//@START: Task 217083
			if (this.rejectReasonFrag) {
				this.rejectReasonFrag.close();
			}
			//@END: Task 217083
		},
		//@START: Task 217083
		onRejectOpen: function () {
			// if (this.getPropInModel("localDataModel", "/fdrstatus").startsWith("CH")) {
			// 	return;
			// }
			var values = {
				fragmentName: "RejectionReason",
				fragVariable: "rejectReasonFrag"
			};
			this.onDialogFetch(values);
		},
		onRejectClose: function () {
			if (this.rejectReasonFrag) {
				this.rejectReasonFrag.close();
			}
		},
		//@END: Task 217083
		//@START: Task 223652
		onOpenAuditLog: function () {
			var values = {
				fragmentName: "AuditLog",
				fragVariable: "auditLogFrag"
			};
			this.onDialogFetch(values);
		},
		onCloseAuditLog: function () {
			if (this.auditLogFrag) {
				this.auditLogFrag.close();
			}
		},
		//@END: Task 223652
		
		//@START: Task 269676
		onOpenChangeLog: function() {
			var values = {
				fragmentName: "ChangeLog",
				fragVariable: "changeLogFrag"
			};
			this.onDialogFetch(values);
		},
		onCloseChangeLog: function () {
			if (this.changeLogFrag) {
				this.changeLogFrag.close();
			}
		},
		//@END: Task 269676
		
		onSubmit: function (oEvent) {
			var context = this;
			var dateValue = new Date();
			var isoDate = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate())).toISOString();
			var fdrStatusAll = this.getPropInModel("localDataModel", "/fdrstatusall"); //@Task 228349
			var workflowFlag = this.getPropInModel("localDataModel", "/workflowflag"); //@Task 232398
			if (this.miniMumDataCheck() && this.checkMandatoryFields()) {
				this.setBusy(true);
				this.setPropInModel("localDataModel", "/locksubmit", "Y");//@Bug 242893
				//@START: Bug 280112
				var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
				if(fdrroute === "GCB" || fdrroute === "GCF") { //@Task 301408
					this.validateCostCentersAndSubmit(this.getPropInModel("localDataModel", "/providerCompanies"), fdrroute);
				}
				//@END: Bug 280112
				//@START: Task 301408
				else if(fdrroute === "EBD") {
					this.EBDSubmit();
				}
				else if(fdrroute === "DIR") {
					if(this.getPropInModel("localDataModel", "/business") === "DS") {
						//@START: Task 343375
						this.onRCCodingRefresh().then(function() { 
							context.DSDirSubmit();
						});
						//@END: Task 343375
					}
				//@END: Task 301408
					else {
						var fdrstatus = context.getPropInModel("localDataModel", "/fdrstatus");
						//@START: Task 232398
						if (fdrstatus === "CHGSR") {
							var changeApprOption = oEvent.getSource().getParent().getContent()[0].getSelectedIndex();
							this.setPropInModel("localDataModel", "/changeApprovalFlag", changeApprOption);
						}
						//@END: Tast 232398
						if (this.getPropInModel("tileIdentityModel", "/role") === "GSR" || this.getPropInModel("tileIdentityModel", "/role") === "GSRWF") { //@Task 290069
							if (this.checkMandatoryFields("UP")) {
								this.onRCCodingRefresh().then(function() { //@Task 343375
									//@START: Task 232398
									var projectDef = context.getPropInModel("localDataModel", "/providerCompanies/0/projectdef");
									if (projectDef && context.getPropInModel("localDataModel", "/onlyproject") !== "N") {
										context.serpProjectSectionEvent.saveBudgetToSerp(projectDef,
											context.getPropInModel("localDataModel", "/currency"), context).then(function (status) {
											context.processFDR(workflowFlag, fdrStatusAll);
											context.showMessageToast(status);
										}).catch(function (msg) {
											context.showMessage(msg);
											context.setBusy(false);
										});
									} else {
										context.processFDR(workflowFlag, fdrStatusAll);
									}
									//@END: Task 232398
								}); //@Task 343375
							}
							//@START: Task 232398
							//Close Change Approval Option window if open
							if (context.changeApprovalFrag && context.changeApprovalFrag.isOpen()) {
								context.changeApprovalFrag.close();
							}
							//@END: Task 232398
						}
						//Provider Confirmer
						else if (this.getPropInModel("tileIdentityModel", "/role") === 'PRC') {
							if (this.checkMandatoryFields("UP")) {
								this.setPropInModel("localDataModel", "/providerconfirmerdate", new Date(isoDate));
								//Change flow
								if (fdrstatus.startsWith("CH")) {
									fdrstatus = this.setFDRChangeStatus(fdrStatusAll, this.getPropInModel("localDataModel", "/onlyproject"));
									this.setPropInModel("localDataModel", "/fdrstatusauditlog", "Change Approved by Provider Confirmer"); //@Task 223652
									if (fdrstatus !== "INPR") {//@Task 240410
										this.onSave();
										this.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
										this.setBusy(false);
									} else {
										this.UPDirSubmit(true);
									}
								}
								//Create flow
								else {
									this.setPropInModel("localDataModel", "/fdrstatus", "CSCNR");
									this.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["CSCNR"] ? fdrStatusAll["CSCNR"] :
										"Pending Consumer Confirmation"); //@Task 228349
									this.setPropInModel("localDataModel", "/fdrstatusauditlog", "Approved by Provider Confirmer"); //@Task 223652
									this.onSave();
									this.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
									this.setBusy(false);
								}
							}
						}
						//Consumer
						else if (this.getPropInModel("tileIdentityModel", "/role") === 'CNC') {
							if (this.checkMandatoryFields("UP")) {
								var aRCCoding = this.getPropInModel("localDataModel", "/rccoding"); //@Task 305941
								//@START: Bug 227912
								this.makeBHIRMandatory("X"); //CNC role is by default in workflow
								var checkBHMandatory = this.checkBHIRMandatory();
								if (!checkBHMandatory) {
									this.showMessage("Please Add Budget Holder/Invoice Recipient details");
									this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
									this.setBusy(false);
									return;
								}
								//@END: Bug 227912
								if (aRCCoding.length) { //@Task 305941
									//@START: Task 305941
									var noCostObjVal =aRCCoding.filter(function(o) {
										return !o.costobj;
									});
									if(noCostObjVal.length) {
										this.showMessage("Please add missing Cost Object Values in Recipient Coding");
										this.setPropInModel("localDataModel", "/locksubmit", "N");
										this.setBusy(false);
										return;
									}
									//@END: Task 305941
									
									this.engagementParser.validateRCCoding(this, aRCCoding).then(function (oMessage) { //@START: Task 310387
										context.setPropInModel("localDataModel", "/consumerconfirmerdate", new Date(isoDate));
										//Change flow
										if (fdrstatus.startsWith("CH")) {
											fdrstatus = context.setFDRChangeStatus(fdrStatusAll, context.getPropInModel("localDataModel", "/onlyproject"));
											context.setPropInModel("localDataModel", "/fdrstatusauditlog", "Change Approved by Consumer");
											if (fdrstatus !== "INPR") {//@Task 240410
												context.onSave();
												context.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
												context.setBusy(false);
											} else {
												context.UPDirSubmit(true);
											}
										}
										//Create flow
										else {
											context.setPropInModel("localDataModel", "/fdrstatus", "RNUPD");
											context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["RNUPD"] ? fdrStatusAll["RNUPD"] :
												"Pending R&A Update"); //@Task 228349
											context.setPropInModel("localDataModel", "/fdrstatusauditlog", "Approved by Consumer"); //@Task 223652
											context.onSave();
											context.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
											context.setBusy(false);
										}
									//@START: Task 310387
									}).catch(function (oerror) {
										context.showMessage("RC Coding: " + oerror);
										context.setPropInModel("localDataModel", "/locksubmit", "N");
										context.setBusy(false);
									});
									//@END: Task 310387
								} else {
									this.showMessage("Please add RC Coding Details");
									this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
									this.setBusy(false);
								}
							}
						}
						//R&A
						else {
							if (this.getPropInModel("localDataModel", "/providerCompanies/0/projectdef")) {
								//@START: Bug 227912
								this.makeBHIRMandatory("X"); //RNA role is by default in workflow
								var checkBHMandatory = this.checkBHIRMandatory();
								if (!checkBHMandatory) {
									this.showMessage("Please Add Budget Holder/Invoice Recipient details");
									this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
									this.setBusy(false);
									return;
								}
								//@END: Bug 227912
								
								this.serpProjectSectionEvent.checkIMParameters(this, this.getPropInModel("localDataModel", "/providerCompanies/0/projectdef"))
									.then(function (status) {
										if (status) {
											context.setPropInModel("localDataModel", "/rnaconfirmerdate", new Date(isoDate));
											context.UPDirSubmit(true); //Final submission by R&A if Simple, else Submit to GSR
										} else {
											context.showMessage("Please Add IM Position");
											context.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
											context.setBusy(false); //@Task 292448
										}
									});
							} else {
								this.setPropInModel("localDataModel", "/rnaconfirmerdate", new Date(isoDate));
								//@START: Bug 227912
								this.makeBHIRMandatory("X"); //RNA role is by default in workflow
								var checkBHMandatory = this.checkBHIRMandatory();
								if (!checkBHMandatory) {
									this.showMessage("Please Add Budget Holder/Invoice Recipient details");
									this.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
									this.setBusy(false);
									return;
								} else {
									this.UPDirSubmit(true); //Final submission by R&A if Simple, else Submit to GSR
								}
								//@END: Bug 227912
							}
						}
					}
				} //@Task 301408
			}
		},
		//@START: Bug 227912
		//Check if Budget Holder and Invoice Recipient fields are non-empty
		checkBHIRMandatory: function () {
			var toSend = true;
			var benifCompanies = this.getPropInModel("localDataModel", "/benifCompanies");
			jQuery.each(benifCompanies, function (iy, oy) {
				if (!oy["budgetholder"] || (!oy["invrecipent"] && oy["resys"] !== "CHEMGSAP" && oy["resys"] !== "LUMINON" && oy["resys"] !== "MAGELLAN"
					&& oy["resys"] !== "STNSAP" && oy["resys"] !== "S4PL" &&  oy["resys"] !== "EPNG" && oy["resys"] !== "OTHER")) {
					toSend = false;
				}
			});
			return toSend;
		},
		//@END: Bug 227912
		dateconvert: function (d) {
			return (
				//d.constructor === Date ? d ://@Task 257521
				d.constructor === Date ? new Date(d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()) : //@Task 257521
				d.constructor === Array ? new Date(d[0], d[1], d[2]) :
				d.constructor === Number ? new Date(d) :
				d.constructor === String ? new Date(d) :
				typeof d === "object" ? new Date(d.year, d.month, d.date) :
				NaN
			);
		},
		dateinRange: function (d, start, end) {
			return (
				isFinite(d = this.dateconvert(d).valueOf()) &&
				isFinite(start = this.dateconvert(start).valueOf()) &&
				isFinite(end = this.dateconvert(end).valueOf()) ?
				start <= d && d <= end :
				NaN
			);
		},
		
		setMinMaxFDRValidity: function(aContractData) {
			//Group contracts by company code
			var context = this, aProvData = [], oProvData = {}, aBenData = [], oBenData = {}, dateRange = [], aContractDates = [];
			aContractData.providerContracts.forEach(function(o) {
				if(oProvData[o.provcompcode]) {
					return;
				}
				aProvData = aContractData.providerContracts.filter(function(p) {
					return p.provcompcode === o.provcompcode;
				});
				//Find date range
				dateRange = context.findDateRange(aProvData);
				//Set to provider CC
				oProvData[o.provcompcode] = dateRange;
				dateRange.forEach(function(d) {
					aContractDates.push(d);
				});
				
			});
			aContractData.benifContracts.forEach(function(o) {
				if(oBenData[o.bencompcode]) {
					return;
				}
				aBenData = aContractData.benifContracts.filter(function(p) {
					return p.bencompcode === o.bencompcode;
				});
				//Find date range
				dateRange = context.findDateRange(aBenData);
				//Set to Beneficiary CC
				oBenData[o.bencompcode] = dateRange;
				dateRange.forEach(function(d) {
					aContractDates.push(d);
				});
			});
			
			//@START: Task 257521
			if(this.getPropInModel("localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/selfBilling") === "X") {
				aContractDates.push({
					from: this.getPropInModel("localDataModel", "/fromdate") ? new Date(this.getPropInModel("localDataModel", "/fromdate")) : new Date(), 
					to: new Date("9999-12-31")});
			}
			//@END: Task 257521
			
			//Set to model
			this.setModel(new sap.ui.model.json.JSONModel({
				allDateCombi: aContractDates,
				allowFrom: true,
				fromMin: this.getPropInModel("localDataModel", "/fromdate") ? new Date(this.getPropInModel("localDataModel", "/fromdate")) : new Date(),
				allowTo: this.getPropInModel("localDataModel", "/todate") ? true : false
			}), "contractDatesModel");
			
			//Set range for To Date
			if(aContractDates.length && this.getPropInModel("localDataModel", "/fromdate")) {
				this.checkEndDateRange(new Date(this.getPropInModel("localDataModel", "/fromdate")));	
			}
			else {
				this.setPropInModel("contractDatesModel", "/allowTo", false);
				this.setPropInModel("localDataModel", "/todate", "");
			}
		},
		
		//@START: Task 221802
		//Get Date range for each Company Code
		findDateRange: function (aContractData) {
			var context = this;
			var dateCombination = [],
				allDates = [];
			jQuery.each(aContractData, function (ix, ox) {
				if (dateCombination.length) {
					var atleastOneItemInRange = true;
					jQuery.each(dateCombination, function (iy, oy) {
						var checkFrom = context.dateinRange(new Date(ox.agrvalfrom), new Date(oy.from), new Date(oy.to));
						var checkTo = context.dateinRange(new Date(ox.agrvalto), new Date(oy.from), new Date(oy.to));
						if (checkFrom && !checkTo) {
							if (new Date(ox.agrvalto) > new Date(oy.to)) {
								allDates.push(ox.agrvalfrom);
								oy.to = new Date(ox.agrvalto);
							}
						}
						if (checkTo && !checkFrom) {
							if (new Date(ox.agrvalfrom) < new Date(oy.from)) {
								allDates.push(ox.agrvalfrom);
								oy.from = new Date(ox.agrvalfrom);
							}
						}
						if (!checkTo && !checkFrom) {
							atleastOneItemInRange = false;
						} else {
							atleastOneItemInRange = true;
							return false;
						}
					});
					if (!atleastOneItemInRange) {
						if (context.dateinRange(new Date(), new Date(ox.agrvalfrom), new Date(ox.agrvalto)) || new Date() < new Date(ox.agrvalfrom)) {
							allDates.push(ox.agrvalfrom);
							allDates.push(ox.agrvalto);
							dateCombination.push({
								from: new Date(ox.agrvalfrom),
								to: new Date(ox.agrvalto)
							});
						}
					}
				} else {
					if (context.dateinRange(new Date(), new Date(ox.agrvalfrom), new Date(ox.agrvalto)) || new Date() < new Date(ox.agrvalfrom)) {
						allDates.push(ox.agrvalfrom);
						allDates.push(ox.agrvalto);
						dateCombination.push({
							from: new Date(ox.agrvalfrom),
							to: new Date(ox.agrvalto)
						});
					}
				}
			});
			//Sort
			dateCombination.sort(function (a, b) {
				return new Date(a.from) - new Date(b.from);
			});
			return dateCombination;
		},
		//@END: Task 221802
		
		//Check End Date range for selected from date
		checkEndDateRange: function(fdrFromDate) {
			var context = this, endDateCombi = [], aFromDates = [], aToDates = [];
			var aContractDates = this.getPropInModel("contractDatesModel", "/allDateCombi");
			aContractDates.forEach(function(o) {
				if (context.dateinRange(fdrFromDate, new Date(o.from), new Date(o.to))) {
					endDateCombi.push(o);
				}
			});
			//Get array of from and to dates
			endDateCombi.forEach(function(o) {
				aFromDates.push(o.from);
				aToDates.push(o.to);
			});
			//find the max from and min to date
			var minFromDate = UnderScoreParse.max(aFromDates, function (e) {
				return new Date(e);
			});
			//Minimum To date in Calendar is atleast equal to From Date
			if (minFromDate < fdrFromDate) {
				minFromDate = fdrFromDate;
			}
			var maxToDate = UnderScoreParse.min(aToDates, function (e) {
				return new Date(e);
			});
			
			//Set to date picker
			if (!endDateCombi.length) {
				context.setPropInModel("contractDatesModel", "/allowTo", false);
				context.setPropInModel("localDataModel", "/todate", "");
				this.showMessage("Selected Date does not lie within any contract");
			} else {
				context.setPropInModel("contractDatesModel", "/allowTo", true);
				context.setPropInModel("contractDatesModel", "/toMin", minFromDate);
				context.setPropInModel("contractDatesModel", "/toMax", maxToDate);
				if(this.getPropInModel("localDataModel", "/todate") && (new Date(context.getPropInModel("localDataModel", "/todate")) < minFromDate 
					||  new Date(context.getPropInModel("localDataModel", "/todate")) > maxToDate)) {
					context.showMessage("Choose a new End Date");
					context.setPropInModel("localDataModel", "/todate", "");
				}
			}
		}, 
		
		//Validate with contract date
		onDateChange: function (oEvent) {
			var isYearChange = false;
			var fromDate = this.getPropInModel("localDataModel", "/fromdate");
			var toDate = this.getPropInModel("localDataModel", "/todate");
			var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
			
			var dateValue = oEvent.getSource().getDateValue();
			if (oEvent.getSource().getBindingInfo("dateValue").parts[0].path === "/fromdate") {
				var fromYear = new Date(fromDate).getFullYear();
				if(fromYear !== dateValue.getFullYear()) {
					isYearChange = true;
				}
				this.checkEndDateRange(new Date(dateValue));
				
				//Clear End Date
				this.setPropInModel("localDataModel", "/todate", "");
			}
			else if (oEvent.getSource().getBindingInfo("dateValue").parts[0].path === "/todate") {
				var toYear = new Date(toDate).getFullYear();
				if(toYear !== dateValue.getFullYear() || (toYear - fromYear) > 1) { //@Task 342839
					isYearChange = true;
				}
			}
			//Set selected date as from/to date
			//@START: Task 317284
			//var isoDate = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate())).toISOString();
			var isoDate =  oEvent.getParameter("value");
			//@END: Task 317284
			this.setPropInModel("localDataModel", oEvent.getSource().getBinding("dateValue").getPath(), isoDate);
			
			//Update budget value whenever year changes or when difference between the years exceeds 1
			if(isYearChange && this.getPropInModel("localDataModel", "/todate") !== "" && (fdrroute === "DIR" || fdrroute === "EBD")) { //@Task 342839
				this.onBudgetPress(oEvent);
			}
		},
		
		//List of attachments uploaded by Activity Lead/Initiator
		getListOfAttachment: function () {
			sap.ui.core.BusyIndicator.show(0); //@Task 346718
			var context = this;
			var values = {};
			values = {
				fragmentName: "AttachmentSet",
				fragVariable: "attachmentSetFrag"
			};
			values.beforeOpenExecution = true;
			values.beforeOpenFunction = function (values, context) {
				context["attachmentSetFrag"].getContent()[0].setVisible(false); //@Task 346718
				context.setModel(new sap.ui.model.json.JSONModel(), "attachmentLocalModel");
				context.getView().getModel("serp110ODataModel").read("/AttachmentListSet", {
					sorters: [new sap.ui.model.Sorter("CreationDate", true)], //@Task 342142
					filters: [new sap.ui.model.Filter("FDRNo", sap.ui.model.FilterOperator.EQ, context.getPropInModel("localDataModel", "/fdrno"))],
					success: function (res) {
						context.setModel(new sap.ui.model.json.JSONModel(res), "attachmentLocalModel");
						sap.ui.core.BusyIndicator.hide(); //@Task 346718
						context["attachmentSetFrag"].getContent()[0].setVisible(true); //@Task 346718
					},
					error: function (res) {
						sap.ui.core.BusyIndicator.hide(); //@Task 346718
						context["attachmentSetFrag"].getContent()[0].setVisible(true); //@Task 346718
					}
				});
			};
			if (context.getPropInModel("localDataModel", "/fdrno")) {
				this.onDialogFetch(values);
			} else {
				this.showMessage("Please Generate the FDR No to get relevant Attachment.");
			}
		},
		onAttachmentClick: function (oEvent) {
			var currentprops = oEvent.getSource().getBindingContext("attachmentLocalModel").getProperty();
			window.open(this.getView().getModel("serp110ODataModel").sServiceUrl + "/AttachmentSet(FileName='" + currentprops.FileName +
				"',FDRNo='" + currentprops.FDRNo + "')/$value", "_blank");
		},
		onAttachmentFragClose: function () {
			this.attachmentSetFrag.close();
		},
		onBudgetCancel: function () {
			this.budgetListFrag.close();
		},
		onBudgetSave: function () {
			var aBudgetList = this.getPropInModel("localDataModel", "/addlProjDetails").filter(function (e) {
				return e.code === "PLBD" && e.deletionflag !== 'X';
			});
			if (aBudgetList.length) { // && aBudgetList.length > 1) {
				var totalBudgetValue = 0;
				var planBudgetValue = parseFloat(this.getPropInModel("localDataModel", "/planbudgetvalue"), 0);
				aBudgetList.forEach(function (oBudget) {
					if (oBudget.description && oBudget.description !== "") {
						totalBudgetValue += parseFloat(oBudget.description, 0);
					}
				});
				//Roundoff to correct number of decimal places
				totalBudgetValue = this.roundOffValue(totalBudgetValue, planBudgetValue);
				if (totalBudgetValue !== planBudgetValue) {
					this.showMessage("Total budget value is not equal to Plan Budget Value");
					return;
				}
			}
			//@START: Task 316395 - Budget to be saved to SERP only on Submit
			/*var projectDef = this.getPropInModel("localDataModel", "/providerCompanies/0/projectdef");
			if (projectDef) {
				this.serpProjectSectionEvent.saveBudgetToSerp(projectDef, this.getPropInModel("localDataModel", "/currency"), this);
			}*/
			//@END: Task 316395
			if (this.budgetListFrag.isOpen()) {
				this.budgetListFrag.close();
			}
		},

		//@START: Task 231446 
		//Open the fragment
		onOpenMultiCCWBS: function() {
			var context = this;
			var values = {
				fragmentName: "MultiCCWBS",
				fragVariable: "multiCCWBSFrag"
			};
			values.beforeOpenExecution = true;
			values.beforeOpenFunction = function() {
				var filtersValue = context.makeFilterArray(["fdrno"], "EQ", context.getPropInModel("localDataModel", "/fdrno"));
				context.setModel(new sap.ui.model.json.JSONModel(), "serpProfitCenterLocalModel");
				var eventProps = {
					modelName: "fdrPlusODataModel",
					entitySet: "costtimewriting",
					filters: filtersValue,
					urlParameters: {},
					success: function (oData) {
						var aCostCollectors = [], oCostCollector = {};
						if(oData.results && oData.results.length) {
							oData.results.forEach(function(o) {
								if(!oCostCollector[o.costcollector]) {
									var aCC = oData.results.filter(function(cc) {
										return cc.costcollector === o.costcollector;
									});
									oCostCollector[o.costcollector] = aCC;
								}
							});
							
							Object.values(oCostCollector).forEach(function(o) {
								var wbseblocks = [], blocktext = "", timewriters = [];
								var aBlocks = o[0].wbseblock.split(",");
								aBlocks.forEach(function(b) {
									switch(b) {
										case 'NOTW':
											blocktext = "Block Timewriting";
											break;
										case 'NOTE':
											blocktext = "Block Travel Expenses";
											break;
										case 'NOFI':
											blocktext = "Block FI Postings";
											break;
										case 'NOPO':
											blocktext = "Block PO/PR";
											break;
									}
									wbseblocks.push({blockcode: b, blocktext: blocktext});
								});
								o.forEach(function(tw) {
									timewriters.push({
										"personid": tw.personid,
										"personname": tw.personname,
										"userid": tw.userid
									});
								});
								aCostCollectors.push({
									"costcollector": o[0].costcollector,
									"wbsedesc": o[0].wbsedesc,
									"timewriters": timewriters,
									"wbseblock": wbseblocks
								});
							});
						}
						context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
							costCollectors: aCostCollectors
						}));
					},
					error: function (oError) {
						context.showMessage("Error in reading Cost Collectors information");
					}
				};
				context.readDataFromOdataModel(eventProps);
			};
			this.onDialogFetch(values);
		},
		//Open Restricted TW fragment for Multi CC
		onOpenRestrictedTW: function(oEvent) {
			var context = this;
			var values = {
				fragmentName: "RestrictedTimewriters",
				fragVariable: "restrictedTWFrag"
			};
			values.beforeOpenExecution = true;
			values.beforeOpenFunction = function() {
				var customData = context.getCustomDataValues(oEvent.getSource().getCustomData());
				var aCostCollectors = context.getPropInModel("localDataModel", "/costCollectors");
				var aTWCC = aCostCollectors.filter(function(o) {
					return o.costcollector === customData.costCollector;
				});
				context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
					ccTimewriters: aTWCC[0].timewriters ? aTWCC[0].timewriters : []
				}));
			};
			this.onDialogFetch(values);
		},
		//Close Restricted TW fragment
		onCloseRestrictedTW: function() {
			if (this.restrictedTWFrag) {
				this.restrictedTWFrag.close();
			}
		},
		//Close the fragment
		onCloseMultiCCWBS: function () {
			if (this.multiCCWBSFrag) {
				this.multiCCWBSFrag.close();
			}
		},
		//@END: Task 231446

		/************************** RNA IM Parameters for Complex Project (SERP) ****************************/
		//Open the fragment
		onComplexIMRead: function () {
			var values = {
				fragmentName: "IMParametersComplex",
				fragVariable: "imComplexFrag"
			};
			this.onDialogFetch(values);
		},

		//@START: Task 231448
		//New entry is added
		onAddRowIMComplex: function (oEvent) {
			var aEntries = this.getPropInModel("localDataModel", "/addlProjDetails");
			var aComplexEntries = aEntries.filter(function (o) {
				return o.code === "IMCX";
			});
			var oNewObject = {
				"TableName": "fdradditionalproject",
				"fdrno": this.getPropInModel("localDataModel", "/fdrno"),
				"providercompcode": this.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode"),
				"itemno": (aComplexEntries.length * 10 + 10).toString(),
				"provideritemno": this.getPropInModel("localDataModel", "/providerCompanies/0/itemno"),
				"providersubitemno": this.getPropInModel("localDataModel", "/providerCompanies/0/subitemno"),
				"code": "IMCX", //always hardcoded to this code for Complex Project IM Parameters
				"value": "",
				"description": "",
				"deletionflag": "N",
				"userid": "",
				"personnelno": "",
				"fname": "",
				"lname": "",
				"approvalyear": "",
				"investmentprogramid": "",
				"investmentpositionid": "",
				"createdby": this.getPropInModel("userDetailsModel", "/name"),
				"createdon": new Date(),
				"updatedby": this.getPropInModel("userDetailsModel", "/name"),
				"updatedon": new Date()
			};
			var aIMData = this.getPropInModel("localDataModel", "/addlProjDetails") ? this.getPropInModel("localDataModel", "/addlProjDetails") : [];
			aIMData.push(oNewObject);
			this.setPropInModel("localDataModel", "/addlProjDetails", aIMData);
		},

		//Called on deleting an entry
		onDeleteRowIMComplex: function (oEvent) {
			var aIMComplex = this.getPropInModel("localDataModel", "/addlProjDetails");
			var oListItem = oEvent.getParameter("listItem");
			var sPath = oListItem.getBindingContextPath();
			var oItem = this.getPropInModel("localDataModel", sPath);
			if (oItem.value) {
				oItem.deletionflag = "X";
			} else {
				aIMComplex.splice(aIMComplex.indexOf(oItem), 1);
			}
			this.getView().getModel("localDataModel").refresh();
		},

		//Save IM details after basic validation
		onComplexIMSave: function () {
			var context = this;
			var aEntries = this.getPropInModel("localDataModel", "/addlProjDetails");
			var aComplexEntries = aEntries.filter(function (o) {
				return o.code === "IMCX";
			});
			if (aComplexEntries.length === 0) {
				sap.m.MessageBox.error("No entries to save");
				return;
			}
			//Check if all IM fields are filled and no duplicates
			context.validateIMFields(aComplexEntries).then(function (check) {
				if (check) {
					context.imComplexFrag.close();
				}
			}).catch(function (oerror) {
				context.showMessage(oerror);
			});
		},

		//Check if all fields are filled in and no duplicates in WBSE column
		validateIMFields: function (aComplexEntries) {
			return new Promise(function (resolve, reject) {
				var check = true;
				//Check if any of the values are empty
				aComplexEntries.forEach(function (oEntry) {
					if (oEntry.deletionflag !== "X" && (!oEntry.value || !oEntry.approvalyear || !oEntry.investmentprogramid || !oEntry.investmentpositionid)) {
						check = false;
					}
				});

				if (!check) {
					reject("Please enter all mandatory fields");
				}

				//Check if duplicate entries in Value column
				var aValues = aComplexEntries.filter(function (item) {
					return item.deletionflag !== "X";
				}).map(function (o) {
					return o.value;
				});
				var isDuplicate = aValues.some(function (item, idx) {
					return aValues.indexOf(item) !== idx;
				});
				if (isDuplicate) {
					reject("WBS column cannot have duplicate entries");
				}
				resolve(check);
			});
		},
		//@END: Task 231448

		//Save IM Program data to SCP
		// _saveIMDataToSCP: function (aComplexEntries) {
		// 	var context = this;
		// 	var url = "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/fdrupdate.xsjs";
		// 	var fnSuccess = function (response) {
		// 		if (response !== "OK") {
		// 			var errorMessage = "Error in saving the IM Details";
		// 			sap.m.MessageBox.error(errorMessage);
		// 		} else {
		// 			sap.m.MessageBox.success("IM Details saved successfully");
		// 		}
		// 		context.imComplexFrag.close();
		// 	};
		// 	var fnError = function (oerror) {
		// 		var errorMessage = "Error in saving the IM Details";
		// 		sap.m.MessageBox.error(errorMessage);
		// 		context.imComplexFrag.close();
		// 	};
		// 	this.makeAjaxCall(url, aComplexEntries, fnSuccess, fnError, "POST");
		// },

		//For closing the fragment
		onComplexIMCancel: function () {
			this.imComplexFrag.close();
		},

		//For opening the IM Program and Position fragments
		onIMValueHelpOpen: function (oEvent) {
			var context = this,
				entitySet = "";
			this.setModel(new sap.ui.model.json.JSONModel(), "masterDataModel");
			var fragmentName = "com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.serpprojectfrags." + oEvent.getSource().data().valHelpFragment;
			this.oValueHelp = sap.ui.xmlfragment(fragmentName, this);
			this.getView().addDependent(this.oValueHelp);
			var sPath = oEvent.getSource().getParent().getBindingContextPath("localDataModel");
			this.sPath = sPath;
			var approvalYear = oEvent.getSource().getParent().getModel("localDataModel").getProperty(sPath).approvalyear;
			if (!approvalYear || approvalYear === "") {
				sap.m.MessageBox.error("Please enter Approval Year");
				return;
			}
			var aFilters = [new sap.ui.model.Filter("ApprovalYear", sap.ui.model.FilterOperator.EQ, approvalYear),
				new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "E")
			];
			if (fragmentName.endsWith("InvestmentProgramID")) {
				entitySet = "/InvestmentProgramSet";
			} else if (fragmentName.endsWith("InvestmentPositionID")) {
				var invProgramID = oEvent.getSource().getParent().getModel("localDataModel").getProperty(sPath).investmentprogramid;
				if (!invProgramID || invProgramID === "") {
					sap.m.MessageBox.error("Please choose Investment Program ID");
					return;
				}
				aFilters.push(new sap.ui.model.Filter("InvProgram", sap.ui.model.FilterOperator.EQ, invProgramID));
				entitySet = "/InvestmentPositionSet";
			}
			//@START: Task 306868
			else if(fragmentName.endsWith("ProfitCenter")) {
				this.serpProjectSectionEvent.feederServiceList("profitcentre", "ProfitCenterID", "/ProfitCenterSet", this);
			}
			//@END: Task 306868
			//F4 service call
			if(!fragmentName.endsWith("ProfitCenter") && !fragmentName.endsWith("ResponsibleCostCenter")) { //@Task 306868
				context.getView().getModel("serpProjectCreationODataModel").read(entitySet, {
					filters: aFilters,
					success: function (odata, oresponse) {
						if (odata.results && odata.results.length > 0) {
							context.getView().getModel("masterDataModel").setProperty(entitySet, odata.results);
						}
					},
					error: function (oerror, oresponseError) {
						sap.m.MessageBox.error("Error in getting " + fragmentName.substring(fragmentName.lastIndexOf(".") + 1));
					}
				});
			} //@Task 306868
			//Open Value Help
			this.oValueHelp.open();
		},

		//Search for various entities
		onValueHelpSearch: function (oEvent) {
			var filterArray = [];
			jQuery.each(oEvent.getSource().data().filterProp.split(","), function (iy, oy) {
				filterArray.push(new sap.ui.model.Filter(oy, sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value").toUpperCase()));
			});
			oEvent.getSource().getBinding("items").filter([new sap.ui.model.Filter({
				filters: filterArray,
				and: false
			})]);
		},

		//Select IM value from the list
		onValueHelpConfirm: function (oEvent) {
			var localDataModel = oEvent.getSource().getParent().getModel("localDataModel");
			var selctionProperty = oEvent.getSource().data().selctionProperty;
			localDataModel.setProperty(this.sPath + "/" + selctionProperty, oEvent.getParameter("selectedItem").getTitle());
			if (selctionProperty === "investmentprogramid") {
				//Clear the Investment Position ID
				localDataModel.setProperty(this.sPath + "/investmentpositionid", "");
			}
		},

		//Clear IM values on change of year
		onYearChange: function (oEvent) {
			//Clear the Investment Program and Position ID fields
			var localDataModel = oEvent.getSource().getParent().getModel("localDataModel");
			var sPath = oEvent.getSource().getParent().getBindingContextPath("localDataModel");
			localDataModel.setProperty(sPath + "/investmentprogramid", "");
			localDataModel.setProperty(sPath + "/investmentpositionid", "");
		},
		/************************** RNA IM Parameters for Complex Project (SERP) ****************************/

		//@START: Bug 227912
		/*determineWorkflowDetails: function (functionId, serviceId) {
			var context = this;
			var eventProps = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "erpdcdetermination",
				filters: [].concat(context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid"))
					.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
					.concat(context.makeFilterArray(["billingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
					.concat(context.makeFilterArray(["providersystem"], "EQ", context.getPropInModel("localDataModel", "/business") === 'UP' ? "SERP" : "GSAP"))),
				success: function (oData) {
					if (oData.results.length) {
						context.makeBHIRMandatory(oData.results[0].workflowflag);//@Task 232398
					}
				},
				error: ""
			};
			this.readDataFromOdataModel(eventProps);
		},*/
		//@END: Bug 227912

		//@START: Task 232398
		onChangeFDR: function () {
			var status = "",
				statusDesc = "";
			var userRole = this.getPropInModel("tileIdentityModel", "/role");
			var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
			var fdrStatusAll = this.getPropInModel("localDataModel", "/fdrstatusall");
			if (fdrroute === "EBD" || fdrroute === "GCB" || fdrroute === "GCF") {
				status = "INPR";
				statusDesc = "In Process";
			} else {
				switch (userRole) {
				case "GSR":
					status = "INPR"; //@Task 290069
					statusDesc = "In Process"; //@Task 290069
					break;
				//@START: Task 290069
				case "GSRWF":
					status = "CHGSR";
					statusDesc = "Change Pending GSR";
					break;
				//@END: Task 290069
				case "PRC":
					status = "CHPRD";
					statusDesc = "Change Pending Provider Confirmer";
					break;
				case "CNC":
					status = "CHCSR";
					statusDesc = "Change Pending Consumer";
					break;
				case "RNA":
					status = "CHRNA";
					statusDesc = "Change Pending R&A";
					break;
				//@START: Task 319741
				case "SUPADM": 
					if(this.getPropInModel("localDataModel", "/workflowflag") === "X") {
						status = "CHGSR";
						statusDesc = "Change Pending GSR";
					}
					else {
						status = "INPR";
						statusDesc = "In Process";
					}
					break;
				//@END: Task 319741
				default:
					status = "INPR";
					statusDesc = "In Process";
					break;
				}
			}
			this.setPropInModel("localDataModel", "/viewmode", "EDIT"); //@Task 319741
			this.setPropInModel("localDataModel", "/fdrstatus", status);
			this.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] ? fdrStatusAll[status] : statusDesc);
		},

		onChangeSubmit: function () {
			var values = {
				fragmentName: "ChangeApproval",
				fragVariable: "changeApprovalFrag"
			};
			this.onDialogFetch(values);
		},

		onChangeClose: function () {
			if (this.changeApprovalFrag) {
				this.changeApprovalFrag.close();
			}
		},

		setFDRChangeStatus: function (fdrStatusAll, isSimpleProject) {
			var context = this,
				status = "",
				statusDesc = "";
			var tile = context.getPropInModel("tileIdentityModel", "/role");
			if (tile === "GSR" || tile === "GSRWF") { //@Task 290069
				//Depending on radio button selected while Approval, change status
				var option = context.getPropInModel("localDataModel", "/changeApprovalFlag") + "";
				switch (option) {
				case "0":
					status = context.getPropInModel("localDataModel", "/workflowflag") === "X" ? "CHGSR" : "INPR";
					statusDesc = context.getPropInModel("localDataModel", "/workflowflag") === "X" ? "Change Pending GSR" : "In Process";
					break;
				case "1":
					status = "CHPRD";
					statusDesc = "Change Pending Provider Confirmer";
					break;
				case "2":
					status = "CHCSR";
					statusDesc = "Change Pending Consumer";
					break;
				case "3":
					status = "CHRNA";
					statusDesc = "Change Pending R&A";
					break;
				//@START: Task 240410
				case "4":
					status = "CHPCR";
					statusDesc = "Change Pending Provider Confirmer, Consumer, R&A";
					break;
				case "5": 
					status = "CHCRN";
					statusDesc = "Change Pending Consumer, R&A";
					break;
				//@END: Task 240410
				default:
					status = context.getPropInModel("localDataModel", "/fdrstatus");
					statusDesc = context.getPropInModel("localDataModel", "/fdrstatusdesc");
				}
			} else {
				//@START: Task 240410
				if(context.getPropInModel("localDataModel", "/fdrstatus") === "CHPCR") {
					status = "CHCRN";
					statusDesc = "Change Pending Consumer";
				}
				else if(context.getPropInModel("localDataModel", "/fdrstatus") === "CHCRN") {
					status = "CHRNA";
					statusDesc = "Change Pending R&A";
				}
				else {
				//@END: Task 240410
					if (isSimpleProject === "N") {
						status = "CHGSR";
						statusDesc = "Change Pending GSR";
					} else {
						status = "INPR";
						statusDesc = "In Process";
					}
				}//@Task 240410
			}
			context.setPropInModel("localDataModel", "/fdrstatus", status);
			context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll[status] ? fdrStatusAll[status] : statusDesc);
			return status;
		},

		processFDR: function (workflowFlag, fdrStatusAll) {
			var context = this;
			//Record in workflow
			if (workflowFlag === "X") {
				var fdrstatus = context.getPropInModel("localDataModel", "/fdrstatus");
				//Change flow
				if (fdrstatus.startsWith("CH")) {
					fdrstatus = context.setFDRChangeStatus(fdrStatusAll, context.getPropInModel("localDataModel", "/onlyproject"));
					context.setPropInModel("localDataModel", "/fdrstatusauditlog", "Change Approved by GSR");
					if (fdrstatus === "INPR" || fdrstatus === "CHGSR") {
						context.UPDirSubmit(true); //Direct Submission without triggering further workflow
					} else {
						context.onSave();
						context.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
						context.setBusy(false);
					}
				} else {
					if (this.getPropInModel("localDataModel", "/fdrstatus") === "PNGSR") {
						//@START: Bug 227912
						context.makeBHIRMandatory(workflowFlag); //Complex project in workflow mode
						var checkBHMandatory = context.checkBHIRMandatory();
						if (checkBHMandatory) {
							context.UPDirSubmit(true); //Complex project final submission by GSR
						} else {
							context.showMessage("Please Add All Mandatory Fields");
							context.setPropInModel("localDataModel", "/locksubmit", "N");
							context.setBusy(false);
						}
						//@END: Bug 227912
					}
					//Not Pending GSR
					else {
						//@START: Task 285643
						var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
						var planBudgetLimit = fdrdefaults["PLNBD"] ? parseFloat(fdrdefaults["PLNBD"]) : 1000000;
						//@END: Task 285643
						//@START: Task 211175 - In case of R&A rejected, route back to R&A on Submit
						if (context.getPropInModel("localDataModel", "/fdrstatus") === "RNREJ" ||
							(context.getPropInModel("tileIdentityModel", "/role") === "GSRWF" && //@Task 290069
								context.getPropInModel("localDataModel", "/fdrstatus") === "RNUPD")) {
							context.setPropInModel("localDataModel", "/fdrstatus", "RNUPD");
							context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["RNUPD"] ? fdrStatusAll["RNUPD"] :
								"Pending R&A Update"); //@Task 228349
						}
						//@END: Task 211175
						else if (parseFloat(context.getPropInModel("localDataModel", "/planbudgetvalue")) >= planBudgetLimit) { //@Task 285643
							context.setPropInModel("localDataModel", "/fdrstatus", "PCNRD");
							context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["PCNRD"] ? fdrStatusAll["PCNRD"] :
								"Pending Provider Confirmation"); //@Task 228349
						} else {
							context.setPropInModel("localDataModel", "/fdrstatus", "CSCNR");
							context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrStatusAll && fdrStatusAll["CSCNR"] ? fdrStatusAll["CSCNR"] :
								"Pending Consumer Confirmation"); //@Task 228349
						}
						context.setPropInModel("localDataModel", "/fdrstatusauditlog", "Approved by GSR"); //@Task 223652
						context.onSave();
						context.setPropInModel("localDataModel", "/disableaction", "Y");//@Bug 251197
						context.setBusy(false);
					}
				}
			}
			//Non-workflow
			else {
				context.makeBHIRMandatory(workflowFlag);
				var checkBHMandatory = context.checkBHIRMandatory();
				//@START: Task 305941
				var aRCCoding = context.getPropInModel("localDataModel", "/rccoding");
				var aNoCostObjVal = aRCCoding.filter(function (o) {
					return !o.costobj;
				});
				//@END: Task 305941
				if (!checkBHMandatory) {
					context.showMessage("Please Add All Mandatory Fields");
					context.setPropInModel("localDataModel", "/locksubmit", "N");
					context.setBusy(false);
				}
				//@START: Task 305941
				else if(context.getPropInModel("localDataModel", "/fdrroute") === "DIR" && aNoCostObjVal.length) {
					context.showMessage("Please add missing Cost Object Values in Recipient Coding");
					context.setPropInModel("localDataModel", "/locksubmit", "N");
					context.setBusy(false);
				}
				//@END: Task 305941
				//@START: Bug 246881
				/*else if (context.getPropInModel("localDataModel", "/onlyproject") === "N" && 
					!context.getPropInModel("localDataModel", "/fdrrecovertype").toUppercase().startsWith("NON PROJECT") && !aComplexEntries.length) {
					context.showMessage("Please Add IM Parameters");
				}*/
				//@END: Bug 246881
				else {
					context.UPDirSubmit(false); //Non-workflow final submission by GSR
				}
			}
		},
		//@END: Task 232398

		//@START: Task 232399
		onCloseFDR: function () {
			//@START: Bug 294897
			/*var isClose = false;
			var fdrroute = this.getPropInModel("localDataModel", "/fdrroute");
			if(fdrroute === "DIR" || fdrroute === "GCB" || fdrroute === "GCF") {
				this.getPropInModel("localDataModel", "/providerCompanies").forEach(function(o) {
					if(o.providercosttyp === "WBS") {
						isClose = true;
					}
				});
			}
			else if(fdrroute === "EBD") {
				isClose = true;
			}
			if(isClose) {
				var values = {
					fragmentName: "FDRClosure",
					fragVariable: "fdrClosureFrag"
				};
				this.onDialogFetch(values);
			}
			else {
				this.showMessage("FDR cannot be closed as there are no Provider WBS");
			}*/
			//Open FDR Close popup without any restrictions
			var values = {
				fragmentName: "FDRClosure",
				fragVariable: "fdrClosureFrag"
			};
			this.onDialogFetch(values);
			//@END: Bug 294897
		},

		//Once FDR Closure is triggered
		onConfirmClosure: function () {
			var context = this;
			if (this.getPropInModel("localDataModel", "/comment") === "") {
				this.showMessage("Please enter Comments");
				return;
			}
			var fdrno = this.getPropInModel("localDataModel", "/fdrno");
			//SERP-based FDRs
			if (this.getPropInModel("localDataModel", "/business") === "UP") {
				sap.ui.core.BusyIndicator.show(0);
				var status = this.getPropInModel("localDataModel", "/fdrstatus") === "CLPRE" ? "CLOSD" : "CLPRE";
				var statusdesc = this.getPropInModel("localDataModel", "/fdrstatus") === "CLPRE" ? "Closed" : "Pre-Closed";
				//for Complex project
				if (this.getPropInModel("localDataModel", "/onlyproject") === "N") {
					if (status === "CLPRE") {
						context.showMessage("Please make sure you will manually close the Enagements.");
						context.updateClosureScp(fdrno, status, statusdesc);
					} else {
						context.showMessage("Are you sure, all the below activities are completed manually related to this FDR?" + "\n" +
							"1. Close projects" + "\n" + "2. Close Engagements" + "\n" + "3. Block all open documents", "Confirm Closure",
							function (action) {
								if (action === "YES") {
									context.updateClosureScp(fdrno, status, statusdesc);
								} else if (action === "NO") {
									context.fdrClosureFrag.close();
									sap.ui.core.BusyIndicator.hide();
								}
							}, [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO]);
					}
				} 
				//for Simple project
				else {
					this.engagementParser.closeFDRSerp(context, fdrno).then(function () {
						context.updateClosureScp(fdrno, status, statusdesc);
					}).catch(function (oerror) {
						context.showMessage("Error in closing FDR " + fdrno);
						context.fdrClosureFrag.close();
						sap.ui.core.BusyIndicator.hide();
					});
				}
			}
			//GSAP-based FDRs
			else {
				var fdrstatus = this.getPropInModel("localDataModel", "/fdrstatus");
				var status = this.getPropInModel("localDataModel", "/fdrstatus") === "CLPRE" ? "CLOSD" : "CLPRE";
				var statusdesc = this.getPropInModel("localDataModel", "/fdrstatus") === "CLPRE" ? "Closed" : "Pre-Closed";
				
				if(fdrstatus === "CLPRE") {
					this.projectParser.closeFDRGsap(context).then(function() {
						//Close engagement in SERP
						return context.engagementParser.closeFDRSerp(context, fdrno);
					}).then(function () {
						//Update status in SCP as Closed
						context.updateClosureScp(fdrno, status, statusdesc);
					}).catch(function(oerror) {
						context.showMessage(oerror);
						context.fdrClosureFrag.close();
					});
				}
				else {
					context.updateClosureScp(fdrno, status, statusdesc);
				}
				
				context.fdrClosureFrag.close();
			}
		},

		onRejectClosure: function () {
			if (this.fdrClosureFrag && this.fdrClosureFrag.isOpen()) {
				this.fdrClosureFrag.close();
				sap.ui.core.BusyIndicator.hide();
			}
		},

		updateClosureScp: function (fdrno, status, statusdesc) {
			var context = this;
			var fdrstatusAll = this.getPropInModel("localDataModel", "/fdrstatusall");
			context.setPropInModel("localDataModel", "/fdrstatus", status);
			context.setPropInModel("localDataModel", "/fdrstatusdesc", fdrstatusAll[status] ? fdrstatusAll[status] : statusdesc);
			context.makeFDRPayload().then(function (o) {
				context.showMessage("FDR " + fdrno + " is " + statusdesc + " successfully");
				context.utilityParser.updateAuditLog(context, statusdesc + " by GSR");
				//@START: Task 309492
				if(context.getPropInModel("localDataModel", "/workflowflag") === "X") {
					context._makeEmailPayload();
				}
				//@END: Task 309492
				if (context.fdrClosureFrag.isOpen()) {
					context.fdrClosureFrag.close();
				}
				sap.ui.core.BusyIndicator.hide();
			}).catch(function (oerror) {
				context.showMessage("Error in closing FDR " + fdrno);
				if (context.fdrClosureFrag.isOpen()) {
					context.fdrClosureFrag.close();
				}
				sap.ui.core.BusyIndicator.hide();
			});
		},
		//@END: Task 232399
		
		//@START: Task 341435
		onConfirmObsolete: function() {
			sap.ui.core.BusyIndicator.show(0);
			var context = this;
			var fdrstatusAll = this.getPropInModel("localDataModel", "/fdrstatusall");
			var fdrno = this.getPropInModel("localDataModel", "/fdrno");
			this.setPropInModel("localDataModel", "/fdrstatus", "OBSOL");
			this.setPropInModel("localDataModel", "/fdrstatusdesc", fdrstatusAll["OBSOL"] ? fdrstatusAll["OBSOL"] : "Obsolete");
			this.makeFDRPayload().then(function (o) {
				context.showMessage("FDR " + fdrno + " is made Obsolete successfully");
				context.utilityParser.updateAuditLog(context, " FDR made Obsolete");
				if (context.fdrObsoleteFrag.isOpen()) {
					context.fdrObsoleteFrag.close();
				}
				context.setPropInModel("localDataModel", "/viewmode", "DISPLAY");
				sap.ui.core.BusyIndicator.hide();
			}).catch(function (oerror) {
				context.showMessage("Error in making FDR " + fdrno + " Obsolete");
				if (context.fdrObsoleteFrag.isOpen()) {
					context.fdrObsoleteFrag.close();
				}
				sap.ui.core.BusyIndicator.hide();
			});
		},
		//@END: Task 341435
		
		onConsumerHelp: function () {
			//Sharepoint URL configured in Generic Defaults Feeder
			var fdrdefaults = this.getPropInModel("localDataModel", "/fdrdefaults");
			if(fdrdefaults && fdrdefaults["CSRSP"]) {
				window.open(fdrdefaults["CSRSP"]); 
			}
			else {
				this.showMessage("Help document not available - Contact Admin");	
			}
		},
		
		//@START: Task 271625
		onOpenWindow: function(oEvent) {
			var context = this;
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			
			if(values.path === "recoverycc") {
				this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
				this.fieldsToSet = values.fieldsToSet; //@Task 280675
				if(!context.getPropInModel("localDataModel", "/funtionid")) {
					context.showMessage("Select Function to get the list of Recovery Cost Centers");
					return;
				}
				context.setModel(new sap.ui.model.json.JSONModel(), "gcRecoveryCCLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					var eventValues = {
						modelName: "gcBoaFeederODataModel",
						entitySet: "gcleg1rccoding",
						filters: context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid"))
							.concat(context.makeFilterArray(["deletionflag"], "NE", "X")),
						urlParameters: "",
						success: function (oData) {
							context.setPropInModel("gcRecoveryCCLocalModel", "/results", oData.results);
							//sap.ui.core.BusyIndicator.hide();
						},
						error: function (oerror) {
							//sap.ui.core.BusyIndicator.hide();
						}
					};
					context.readDataFromOdataModel(eventValues);
				};
			}
			else if(values.path === "invcompcode") {
				this.itemsPath = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath() + "/" + oEvent.getSource().getBinding(
				"value").getPath();
				context.setModel(new sap.ui.model.json.JSONModel(), "gcInvoiceCCLocalModel");
				values.beforeOpenExecution = true;
				values.beforeOpenFunction = function (values, context) {
					sap.ui.core.BusyIndicator.show();
					var eventValues = {
						modelName: "dsFeederODataModel",
						entitySet: "oucobmapping",
						urlParameters: "",
						success: function (oData) {
							var results = context.getUniqRecords(oData.results);
							context.setPropInModel("gcInvoiceCCLocalModel", "/results", results);
							sap.ui.core.BusyIndicator.hide();
						},
						error: function (oerror) {
							sap.ui.core.BusyIndicator.hide();
						}
					};
					context.readDataFromOdataModel(eventValues);
				};
			}
			else if(values.path === "fdrActualsHistory") {
				this.setPropInModel("localDataModel", "/fdrhistoryyear", this.getPropInModel("fdrHistoryYearModel", "/cYear"));
				this.setPropInModel("localDataModel", "/fdrhistoryqtr", "");
				this.setPropInModel("localDataModel", "/fdrhistory", []);
				
			}
			this.onDialogFetch(values);
		},
		
		onCloseWindow: function(oEvent) {
			var fragmentName = this.getCustomDataValues(oEvent.getSource().getCustomData()).fragVariable;
			if(fragmentName === "recoveryCCFrag" && this.recoveryCCFrag) {
				this.recoveryCCFrag.close();
			}
			else if(fragmentName === "fdrActualsHistoryFrag" && this.fdrActualsHistoryFrag) {
				this.fdrActualsHistoryFrag.close();
			}
			//@START: Task 280675
			else if(fragmentName === "initiatorfrag" && this.initiatorfrag) {
				this.initiatorfrag.close();
			}
			else if(fragmentName === "FocalPointDetermination") {
				if(this.gsrfocalfrag && this.gsrfocalfrag.isOpen()) {
					this.gsrfocalfrag.close();	
				}
				if(this.rnafocalfrag && this.rnafocalfrag.isOpen()) {
					this.rnafocalfrag.close();	
				}
			}
			else if(fragmentName === "fundManFrag" && this.fundManFrag) {
				this.fundManFrag.close();
			}
			else if(fragmentName === "providerConfirmgcr" && this.providerConfirmgcr) {
				this.providerConfirmgcr.close();
			}
			else if(fragmentName === "consumerFrag" && this.consumerFrag) {
				this.consumerFrag.close();
			}
			else if(fragmentName === "invoicFrag" && this.invoicFrag) {
				this.invoicFrag.close();
			}
			else if(fragmentName === "budgetholderfrag" && this.budgetholderfrag) {
				this.budgetholderfrag.close();
			}
			//@END: Task 280675
			//@START: Task 290809
			else if(fragmentName === "regionalCodeFrag" && this.regionalCodeFrag) {
				this.regionalCodeFrag.close();
			}
			//@START: Task 290809
			//@START: Task 295650
			else if(fragmentName === "budgetholderadfrag" && this.budgetholderadfrag) {
				this.budgetholderadfrag.close();
			}
			//@END: Task 295650
			//@START: Task 341435
			else if(fragmentName === "fdrObsoleteFrag" && this.fdrObsoleteFrag) {
				this.fdrObsoleteFrag.close();
			}
			//@END: Task 341435
		},
		
		onSelectCoverage: function(oEvent) {
			//Clear region
			this.setPropInModel("localDataModel", "/region", "");
			
			//Populate Region dropdown
			this.getCoverageRegions(this.getPropInModel("localDataModel","/coverage"));
		},
		
		getCoverageInfo: function() {
			//Update entries in Coverage dropdown
			var context = this;
			var providercompcode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode") === "GB32" ? "GB32" : "ALL";
			var aFilters = context.makeFilterArray(["providercompcode"], "EQ", providercompcode);
			var eventVars = {
				modelName: "gcBoaFeederODataModel",
				entitySet: "coverage",
				filters: aFilters,
				urlParameters: "",
				success: function (data) {
					context.setPropInModel("localDataModel", "/coverages", data.results.length ? data.results : []);
				},
				error: function(oerror) {
					context.showMessageToast("Error in getting Coverages");
				}
			};
			context.readDataFromOdataModel(eventVars);
		},
		
		getCoverageRegions: function(coverage) {
			//Update entries in Region dropdown
			var context = this;
			var aFilters = context.makeFilterArray(["coverage"], "EQ", coverage);
			var eventVars = {
				modelName: "gcBoaFeederODataModel",
				entitySet: "regcode",
				filters: aFilters,
				urlParameters: "",
				success: function (data) {
					context.setPropInModel("localDataModel", "/regions", data.results.length ? data.results : []);
				},
				error: function(oerror) {
					context.showMessageToast("Error in getting Regions");
				}
			};
			context.readDataFromOdataModel(eventVars);
		},
		
		onSelectRegion: function(oEvent) {
			var context = this;
			if(this.getPropInModel("localDataModel", "/coverage") && this.getPropInModel("localDataModel", "/region")) {
				var benifCompanies = this.getPropInModel("localDataModel", "/benifCompanies");
				this.getLeg2SOCurrency(benifCompanies).then(function(results) {
					context.setPropInModel("localDataModel", "/benifCompanies", results);
				});
			}
		},
		//@END: Task 271625
		
		//@START: Task 271624
		onGetFDRActualsHistory: function() {
			var context = this;
			if(!context.getPropInModel("localDataModel", "/fdrhistoryyear") || !context.getPropInModel("localDataModel", "/fdrhistoryqtr")) {
				context.showMessage("Select Year and Quarter");
				return;
			}
			var aFilters = context.makeFilterArray(["fdrno"], "EQ", context.getPropInModel("localDataModel", "/fdrno"))
				.concat(context.makeFilterArray(["finyear"], "EQ", context.getPropInModel("localDataModel", "/fdrhistoryyear")))
				.concat(context.makeFilterArray(["qtr"], "EQ", context.getPropInModel("localDataModel", "/fdrhistoryqtr")));
			var eventVars = {
				modelName: "fdrPlusODataModel",
				entitySet: "fdrhistory",
				filters: aFilters,
				urlParameters: "",
				success: function (data) {
					context.setPropInModel("localDataModel", "/fdrhistory", data.results.length ? data.results : []);
					if(!data.results.length) {
						context.showMessage("No data available");
					}
				},
				error: function(oerror) {
					context.showMessageToast("Error in getting FDR Actuals History");
				}
			};
			context.readDataFromOdataModel(eventVars);
		},
		//@END: Task 271624
		
		//@START: Task 274288
		//Called on Row-level Delete
		onCloseEngagement: function(oEvent) {
			var context = this;
			var section = this.getCustomDataValues(oEvent.getSource().getCustomData()).section;
			var path = oEvent.getSource().getParent().getBindingContext("localDataModel").getPath();
			var objClose = this.getPropInModel("localDataModel", path);
			var costtype = section === "provider" ? "/providercosttyp" : "/bencosttyp";
			var costobjvalue = section === "provider" ? "/providercostobj" : "/sipcrecwbse";
			var fdrno = context.getPropInModel("localDataModel", "/fdrno");
			var engno = context.getPropInModel("localDataModel", path + "/engagmentno");
			var wbs = context.getPropInModel("localDataModel", path + costobjvalue);
			if(wbs && wbs !== "" && ((section === "provider" && context.getPropInModel("localDataModel", path + costtype) === "WBS") 
				|| (section === "beneficiary" && context.getPropInModel("localDataModel", "/fdrroute") === "EBD"))) {
				//Close Provider WBS / Beneficiary SIPC WBS in GSAP
				context.projectParser.closeWBSGSAP(context, wbs).then(function() {
					//Close/Update engagement in ECT and then delete entry from SCP
					context.updateCloseEngagement(section, fdrno, engno, objClose, path, true);//WBS Close = true
				}).catch(function(oerror) {
					context.showMessage(oerror);
				});
			}
			else {
				//Close/Update engagement in ECT and then delete entry from SCP
				context.updateCloseEngagement(section, fdrno, engno, objClose, path, false);//WBS Close = false
			}
		},
		//Close/Update engagement in ECT and then delete entry from SCP
		updateCloseEngagement: function(section, fdrno, engno, objClose, path, isWBSClose) {
			var context = this, isCloseEngagement = false, values = {};
			var aCompanies = (section === "provider") ? context.getPropInModel("localDataModel", "/providerCompanies") : 
				context.getPropInModel("localDataModel", "/benifCompanies");
			var aNewCompanies = aCompanies.filter(function(o) {
				return o !== objClose;
			});
			values.bindingValue = (section === "provider") ? "/providerCompanies" : "/benifCompanies";
			//For provider
			if(section === "provider") {
				var aEngProviders = aCompanies.filter(function(o) {
					return o.engagmentno === engno;
				});
				//1:n Provider:Cost_Objects scenario
				if(aEngProviders.length > 1) {
					//Call Engagement Change service to update Engagement in ECT
					var aUpdatedEngProv = aEngProviders.filter(function(o) {
						return o !== objClose;
					});
					//Update engagement with new set of PrCodings
					context.engagementParser.updateEngPrCoding(context, engno, aUpdatedEngProv).then(function() {
						//Update deletion flag in Provider/Beneficiary
						var message = isWBSClose ? "WBS Closed and Engagement Updated successfully" : "Engagement Updated successfully";
						context.showMessage(message);
						//Delete record from SCP
						context.deleteProvBen(section, fdrno, [objClose], values, aNewCompanies);
					}).catch(function(oerror) {
						context.showMessage("Error in updating Engagement");
					});
				}
				//1:1 Provider:Cost_Object scenario
				else {
					isCloseEngagement = true;
				}
			}
			//Beneficiary
			else {
				isCloseEngagement = true;
			}
			//Close engagement in ECT
			if(isCloseEngagement) {
				context.engagementParser.closeFDRSerp(context, fdrno, engno).then(function() {
					var message = isWBSClose ? "WBS and Engagement Closed successfully" : "Engagement Closed successfully";
					context.showMessage(message);
					//Delete record from SCP
					//context.deleteProvBen(section, fdrno, [objClose], values, aNewCompanies);
					//Update deletion flag in Provider/Beneficiary
					context.setPropInModel("localDataModel", path + "/deletionflag", "X");
					context.onSave(true);
				}).catch(function(oerror) {
					context.showMessage("Error in closing Engagement");
				}); 
			}
		},
		//@END: Task 274288
		
		//@START: Task 280675
		onActiveDirectorySearchSERP: function(oEvent) {
			var context = this, aFilters = [];
			var values = this.getCustomDataValues(oEvent.getSource().getParent().getParent().getParent().getCustomData());//Get Custom Data from Dialog control
			var aliasId = this.getPropInModel("localDataModel", "/adSearchAliasId");
			var firstName = this.getPropInModel("localDataModel", "/adSearchFirstName");
			var lastName = this.getPropInModel("localDataModel", "/adSearchLastName");
			var emailID = this.getPropInModel("localDataModel", "/adSearchEmailID");
			if(!aliasId && !firstName && !lastName && !emailID) {
				this.showMessage("Enter a Alias ID/Name/Email ID for search");
				return;
			}
			if(aliasId) {
				aFilters = aFilters.concat(context.makeFilterArray(["AliasID"], "EQ", aliasId));
			}
			if(firstName) {
				aFilters = aFilters.concat(context.makeFilterArray(["FirstName"], "EQ", firstName));
			}
			if(lastName) {
				aFilters = aFilters.concat(context.makeFilterArray(["LastName"], "EQ", lastName));
			}
			if(emailID) {
				aFilters = aFilters.concat(context.makeFilterArray(["EmailAddress"], "EQ", emailID));
			}
			this.utilityParser.activeDirectorySearchSERP(this, aFilters).then(function(results) {
				var arrayToset = [], displayFields = values.displayFields.split(",");
				jQuery.each(results, function (ix, ox) {
					var obj = {};
					obj[displayFields[0]] = ox["AliasID"];
					obj[displayFields[1]] = ox["DisplayName"];
					arrayToset.push(obj);
				});
				context.setPropInModel(values.selctionBindingContext, "/results", arrayToset);
			}).catch(function(oerror) {
				context.showMessage(oerror);
			});
		},
		
		//Search in AD based on Alias ID/First Name/Last Name/Email ID
		onActiveDirectorySearch: function(oEvent) {
			sap.ui.core.BusyIndicator.show(0);
			var context = this, searchQuery = "";
			var values = this.getCustomDataValues(oEvent.getSource().getParent().getParent().getParent().getCustomData());
			var aliasId = this.getPropInModel("localDataModel", "/adSearchAliasId");
			var firstName = this.getPropInModel("localDataModel", "/adSearchFirstName");
			var lastName = this.getPropInModel("localDataModel", "/adSearchLastName");
			var emailID = this.getPropInModel("localDataModel", "/adSearchEmailID");
			if(!aliasId && !firstName && !lastName && !emailID) {
				sap.ui.core.BusyIndicator.hide();
				this.showMessage("Enter a Alias ID/Name/Email ID for search");
				return;
			}
			if(aliasId) {
				searchQuery += "aliasId=*" + aliasId + "*";
			}
			if(firstName) {
				searchQuery = searchQuery.length > 0 ? searchQuery + "&" : searchQuery;
				searchQuery += "firstName=*" + firstName + "*";
			}
			if(lastName) {
				searchQuery = searchQuery.length > 0 ? searchQuery + "&" : searchQuery;
				searchQuery += "lastName=*" + lastName + "*";
			}
			if(emailID) {
				searchQuery = searchQuery.length > 0 ? searchQuery + "&" : searchQuery;
				searchQuery += "email=*" + emailID + "*";
			}
			
			this.utilityParser.activeDirectorySearch(this, searchQuery).then(function(results) {
				var arrayToset = [], displayFields = values.displayFields.split(",");
				jQuery.each(results, function (ix, ox) {
					var obj = {};
					obj[displayFields[0]] = ox["aliasId"];
					obj[displayFields[1]] = ox["displayName"];
					arrayToset.push(obj);
				});
				context.setPropInModel(values.selctionBindingContext, "/results", arrayToset);
				sap.ui.core.BusyIndicator.hide();
			}).catch(function(oerror) {
				context.showMessage(oerror);
				sap.ui.core.BusyIndicator.hide();
			});
		},
		
		//Select user from list (Focal Point/Funding Manager/Provider Confirmer/Consumer/Invoice Recipient/Budget Holder)
		onListUserSelect: function(oEvent) {
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData());
			if (this.fieldsToSet) {
				var aFields = this.fieldsToSet.split(",");
				this.setPropInModel("localDataModel", aFields[0], oEvent.getParameter("listItem").getTitle());
				if(values.fragVariable === "budgetholderfrag") {
					this.setPropInModel("localDataModel", aFields[1], oEvent.getParameter("listItem").getAttributes()[0].getText());	
				}
				else {
					this.setPropInModel("localDataModel", aFields[1], oEvent.getParameter("listItem").getDescription());
				}
				this.onCloseWindow(oEvent);
			}
		},
		
		//Set default values as blank on opening F4
		setADSearchDefaults: function() {
			this.setPropInModel("localDataModel", "/adSearchAliasId", "");
			this.setPropInModel("localDataModel", "/adSearchFirstName", "");
			this.setPropInModel("localDataModel", "/adSearchLastName", "");
			this.setPropInModel("localDataModel", "/adSearchEmailID", "");
		},
		//@END: Task 280675
		
		//@START: Task 285640
		//Clear the Provider Confirmer details whenever there is a change in Plan Budget Value/Currency
		onPlanBudgetChange: function() {
			var context = this;
			var workflowflag = this.getPropInModel("localDataModel", "/workflowflag"); 
			if(workflowflag === "X") {
				var providerCompanies = this.getPropInModel("localDataModel", "/providerCompanies");
				providerCompanies.forEach(function(ox, ix) {
					context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providerconfirmer", "");
					context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/providerconfirmername", "");
				});
			}
		}
		//@END: Task 285640
	});
});