sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/m/MessageBox',
	"sap/ui/model/json/JSONModel",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/ContractValidation",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/ProjectParser",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/FDRPlusParser",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/EngagementParser",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/Utility", //@Task 223652
	"sap/m/UploadCollectionParameter" //@Task 346718
], function (Controller, MessageBox, JSONModel, usp, ContractValidation, ProjectParser, FDRPlusParser, EngagementParser, Utility, UploadCollectionParameter) {//@Task 223652, 346718
	"use strict";
	return Controller.extend("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function (code, array) {
			if (code) {
				return array && array.length ? this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(code, array) : this.getOwnerComponent()
					.getModel("i18n").getResourceBundle().getText(code);
			} else {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			}
		},

		/**
		 * Convenience method for loading the data froma local json file.
		 * @public
		 * @param {string} Modulepath of the file in structure
		 * @returns {function} Promise function - inturn resolve the json data.
		 */
		getLocalFileData: function (path) {
			var oModel = new sap.ui.model.json.JSONModel(path);
			var context = this;
			return new Promise(
				function (resolve, reject) {
					oModel.attachRequestCompleted(function (object) {
						var data = oModel.getData();
						if (data.results.length) {
							resolve(data);
						} else {
							reject(context.getResourceBundle().getText("unableTo", 'load data from local file.'));
						}
					});
				}
			);
		},
		showMessageToast: function (msg) {
			sap.m.MessageToast.show(msg);
		},
		/**
		 * Convenience method for showing message on screen.
		 * @public
		 * @param {string} Msg to be displayed
		 */
		showMessage: function (msg, title, onClose, actions) {
			title = title ? title : "Alert";
			actions = actions ? actions : [sap.m.MessageBox.Action.OK];
			MessageBox.show(msg, {
				title: title,
				actions: actions,
				onClose: onClose
			});
		},

		/**
		 * Convenience method for setting the entire app busy or not.
		 * @public
		 * @param {bollean} state to set
		 */
		setBusy: function (state) {
			if (typeof (state) === "boolean") {
				this.getModel('busyModel').setProperty("/flag", state);
			}
		},

		/**
		 * Convenience method for setting a property in a model.
		 * @public
		 * @param {string} modelName
		 * @param {string} path in the model
		 * @param {object} the value to be set in the path
		 */
		setPropInModel: function (modelName, path, value) {
			this.getModel(modelName).setProperty(path, value);
		},

		/**
		 * Convenience method for fetching a property in a model.
		 * @public
		 * @param {string} modelName
		 * @param {string} path in the model
		 * @param {object} the value to be set in the path
		 */
		getPropInModel: function (modelName, path) {
			return this.getModel(modelName).getProperty(path);
		},

		/**
		 * used to call all the ajax calls
		 * @params
		 * {string} contain the url path for the call
		 * {object} payload in json
		 * {function} ex:function (oSuccess) {}
		 * {function} ex:function (jqXHR, textStatus, errorThrown) {
		 */
		makeAjaxCall: function (url, payload, success, error, typeOfCall) {
			var ajaxRequest = {
				url: url,
				xhrFields: {
					withCredentials: true
				},
				type: typeOfCall,
				contentType: 'application/json;charset=utf-8',
				dataType: 'json',
				success: success,
				error: error
			};
			if(payload !== "") {
				ajaxRequest.data =  JSON.stringify(payload);
			}
			$.ajax(ajaxRequest);
		},
		checkForDuplicates: function (originalArray, compArray, comprisonFields) {
			var duplicateArray = [];
			var uniqArray = [];
			if (!jQuery.isArray(originalArray)) {
				originalArray = [];
			}
			if (!jQuery.isArray(compArray)) {
				compArray = [];
			}
			jQuery.each(compArray, function (ix, ox) {
				var smallObj = {};
				jQuery.each(comprisonFields, function (iy, oy) {
					smallObj[oy] = ox[oy];
				});
				var duplicateCheck = usp.where(originalArray, smallObj);
				if (duplicateCheck.length) {
					duplicateArray.push(ox);
				} else {
					uniqArray.push(ox);
				}
			});
			return {
				uniqueArray: uniqArray,
				duplicateArray: duplicateArray
			};
		},
		createDataFromOdataModel: function (eventValues) {
			var context = this;
			context.getView().getModel(eventValues.modelName).create("/" + eventValues.entitySet, eventValues.payload, {
				urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
				success: eventValues.success,
				error: eventValues.error
			});
		},
		readDataFromOdataModel: function (eventValues, dontNeedCount) {
			var context = this;
			if (dontNeedCount) {
				context.getView().getModel(eventValues.modelName).read("/" + eventValues.entitySet, {
					filters: eventValues.hasOwnProperty("filters") ? eventValues.filters : [],
					urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
					success: eventValues.success,
					error: eventValues.error
				});
			} else {
				this.getView().getModel(eventValues.modelName).read("/" + eventValues.entitySet + "/$count", {
					filters: eventValues.hasOwnProperty("filters") ? eventValues.filters : [],
					success: function (oCount) {
						var urlParams = jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {
							"$top": oCount
						});
						context.getView().getModel(eventValues.modelName).read("/" + eventValues.entitySet, {
							filters: eventValues.hasOwnProperty("filters") ? eventValues.filters : [],
							urlParameters: urlParams,
							success: eventValues.success,
							error: eventValues.error
						});
					}
				});
			}
		},
		loadDataToDialog: function (values) {
			var context = this;
			this.readDataFromOdataModel({
				filters: values.filterToSet && values.filterToSet.length ? values.filterToSet : [],
				success: function (oData) {
					if (oData.results.length) {
						context.getView().setModel(new JSONModel(oData), values.fragModelName);
					} else {
						context.getView().setModel(new JSONModel({
							results: []
						}), values.fragModelName);
					}
				},
				error: function () {},
				entitySet: values.fragOdataEntitySet,
				modelName: values.fragoDataModelName
			});
		},
		getCustomDataValues: function (customData) {
			var values = {};
			jQuery.each(customData, function (ix, ox) {
				values[ox.getKey()] = ox.getValue();
			});
			return values;
		},
		makeFilterArray: function (propsArray, filterOprator, query, orAnd) {
			var filterArray = [];
			jQuery.each(propsArray, function (ix, ox) {
				filterArray.push(new sap.ui.model.Filter(ox, sap.ui.model.FilterOperator[filterOprator], query));
			});
			if (filterArray.length > 1 && orAnd) {
				filterArray = [new sap.ui.model.Filter({
					filters: filterArray,
					and: orAnd.toUpperCase() === "OR" ? false : true
				})];
			}
			return filterArray;
		},
		setFDRRoute: function (route) {
			this.setPropInModel("localDataModel", "/fdrroute", route);
			//load Mandatory Model
			route = route === 'DIR' ? (route + this.getPropInModel("localDataModel", "/business")) : route;
			var mandateFields = this.getPropInModel("mandateFieldsLocalModel", "/" + route);
			var objectToSet = {};
			jQuery.each(mandateFields.header, function (ix, ox) {
				objectToSet[ox] = "X";
			});
			jQuery.each(mandateFields.provider, function (ix, ox) {
				objectToSet["PR" + ox] = "X";
			});
			//@START: Task 279627
			var fdrstatus = this.getPropInModel("localDataModel", "/fdrstatus");
			var role = this.getPropInModel("tileIdentityModel", "/role");
			if(route === "DIRUP" && this.getPropInModel("localDataModel", "/workflowflag") === "X" && 
				this.getPropInModel("localDataModel", "/onlyproject") !== "N") {
				objectToSet["PRprojectdef"] = "X";
				objectToSet["PRprovidercostobj"] = "X";
			}
			if((role === "GSR" || role === "GSRWF") && route === "DIRUP" && this.getPropInModel("localDataModel", "/onlyproject") === "N" && //@Task 290069
				(fdrstatus === "INPR" || fdrstatus === "PNGSR" || fdrstatus === "CHGSR")) {
				objectToSet["PRprovidercostobj"] = "X";
			}
			//@END: Task 279627
			jQuery.each(mandateFields.benificiary, function (ix, ox) {
				objectToSet["BEN" + ox] = "X";
			});
			this.setModel(new sap.ui.model.json.JSONModel(objectToSet), "mandateIndicatorModel");
		},
		//@START: Task 228349
		//Get description of all status
		getFDRStatusAll: function() {
			var context = this, oFdrStatus = {}, oFdrDefaults = {};
			return new Promise(function(resolve, reject) {
				var eventProps = {
					modelName: "feederMainODataModel",
					entitySet: "generic",
					filters: [].concat(context.makeFilterArray(["deletionflag"], "NE", "X")),//@Task 241246
					success: function (oData) {
						if (oData.results && oData.results.length) {
							oData.results.forEach(function(obj) {
								if(obj.code && obj.desc) {
									//@START: Task 241246
									if(obj.varfld === "STAS") {
										oFdrStatus[obj.code] = obj.desc;	
									}
									else if(obj.varfld === "DEFL") {
										oFdrDefaults[obj.code] = obj.desc;
									}
									//@END: Task 241246
								}
							});
							context.setPropInModel("localDataModel", "/fdrstatusall", oFdrStatus);
							context.setPropInModel("localDataModel", "/fdrdefaults", oFdrDefaults);//@Task 241246
							resolve();
						}
						else {
							context.setPropInModel("localDataModel", "/fdrstatusall", oFdrStatus);
							context.setPropInModel("localDataModel", "/fdrdefaults", oFdrDefaults);
							resolve();
						}
					},
					error: function(oerror) {
						context.showMessageToast("Unable to get FDR Status");
						reject();
					}
				};
				context.readDataFromOdataModel(eventProps);
			});
			
		},
		//@END: Task 228349
		
		//@START: Task 265116
		getHoverTexts: function() {
			var context = this, oFdrTexts = {};
			var eventProps = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "hoveringtext",
				filters: [].concat(context.makeFilterArray(["deletionflag"], "NE", "X"))
					.concat(context.makeFilterArray(["appidentifer"], "EQ", context.getPropInModel("tileIdentityModel", "/role"))),
				success: function (oData) {
					if (oData.results && oData.results.length) {
						oData.results.forEach(function(obj) {
							oFdrTexts[obj.fieldname] = obj.fielddesc;
						});
						context.setPropInModel("localDataModel", "/fdrhovertexts", oFdrTexts);
					}
				},
				error: function(oerror) {
					context.showMessageToast("Unable to get FDR Texts");
				}
			};
			this.readDataFromOdataModel(eventProps);
		},
		//@END: Task 265116
		
		getDefaultFeederValues: function() {
			var context = this, oFdrStatus = {};
			var eventProps = {
				modelName: "feederMainODataModel",
				entitySet: "generic",
				filters: [].concat(context.makeFilterArray(["deletionflag"], "NE", "X")),
				success: function (oData) {
					if (oData.results && oData.results.length) {
						oData.results.forEach(function(obj) {
							if(obj.code && obj.desc) {
								oFdrStatus[obj.code] = obj.desc;
							}
						});
						context.setPropInModel("localDataModel", "/fdrstatusall", oFdrStatus);
					}
				},
				error: function(oerror) {
					context.showMessageToast("Unable to get FDR Status");
				}
			};
			this.readDataFromOdataModel(eventProps);
		},
		
		//@START: Bug 227912
		//Make Budget Holder and Invoice Recipient mandatory for Consumer and R&A (WF mode) and GSR (non-WF mode)
		makeBHIRMandatory: function(isWorkflow) {
			var route = this.getPropInModel("localDataModel", "/fdrroute") + this.getPropInModel("localDataModel", "/business");
			var role = this.getPropInModel("tileIdentityModel", "/role");
			if(route === "DIRUP")
			{
				if((isWorkflow === "X" && (role === "CNC" || role === "RNA")) || isWorkflow !== "X") {
					this.setPropInModel("mandateIndicatorModel", "/BENbudgetholder", "X");
					this.setPropInModel("mandateIndicatorModel", "/BENinvrecipent", "X");
					var resys = this.getPropInModel("localDataModel", "/benifCompanies/0/resys");
					if(resys !== "OTHER") {
						this.setPropInModel("mandateIndicatorModel", "/BENinvrecipent", "X");
					}
					else {
						this.setPropInModel("mandateIndicatorModel", "/BENinvrecipent", "");
					}
				}
				else {
					this.setPropInModel("mandateIndicatorModel", "/BENbudgetholder", "");
					this.setPropInModel("mandateIndicatorModel", "/BENinvrecipent", "");
				}
			}
		},
		//@END: Bug 227912
		onProfitCenterFetchSERP: function (object) {
			var context = this;
			object.position = object.position ? object.position : "000010";
			if (object.position.length !== 6) {
				for (var i = 0; i < (6 - object.position.length); i++) {
					object.position = "0" + object.position;
				}
			}
			var filterArray = [
				new sap.ui.model.Filter("CompCode", sap.ui.model.FilterOperator.EQ, "'" + object.providercompcode + "'"), //provider entity 
				new sap.ui.model.Filter("EngType", sap.ui.model.FilterOperator.EQ, "'" + object.enagementType + "'"), //
				new sap.ui.model.Filter("RcSys", sap.ui.model.FilterOperator.EQ, "'" + object.recipSystem + "'"), //
				new sap.ui.model.Filter("RcComp", sap.ui.model.FilterOperator.EQ, "'" + object.recipCompCode + "'"), //Benficiery Comapay ????
				new sap.ui.model.Filter("RecType", sap.ui.model.FilterOperator.EQ, "'" + object.recoveryType + "'") //
				// new sap.ui.model.Filter("PCLineNo", sap.ui.model.FilterOperator.EQ, "'" + object.position + "'") //postion
			];
			if (object.provCostType === "CC") {
				filterArray.push(new sap.ui.model.Filter("CCCostCenter", sap.ui.model.FilterOperator.EQ, "'" + object.provCostObj + "'"));
			} else {
				filterArray.push(new sap.ui.model.Filter("WBSNo", sap.ui.model.FilterOperator.EQ, "'" + object.provCostObj + "'"));
			}
			return new Promise(function (resolve, reject) {
				var eventParams = {
					modelName: "serp110ODataModelWOB",
					entitySet: "/ProviderValidationSet",
					filters: filterArray,
					urlParameters: "",
					success: function (oData) {
						if (object.provCostType === "CC") {
							if (oData.results && oData.results[0].PCProfitCenter) {
								resolve(oData.results[0].PCProfitCenter);
							} else {
								reject("No Profit Center Found");
							}
						} else {
							if (oData.results && oData.results[0].WBSProfitCenter) {
								resolve(oData.results[0].WBSProfitCenter);
							} else {
								reject("No Profit Center Found");
							}
						}
					},
					error: function (error) {
						context.showMessageToast("Unable to determine Profit Center");
						reject("Issue in Profit Center Service");
					}
				};
				context.readDataFromOdataModel(eventParams, true);
			});
		},
		onProfitCenterFetch: function (object) {
			var context = this;
			object.position = object.position ? object.position : "000010";
			if (object.position.length !== 6) {
				for (var i = 0; i < (6 - object.position.length); i++) {
					object.position = "0" + object.position;
				}
			}
			var filterArray = [
				new sap.ui.model.Filter("IBukrs", sap.ui.model.FilterOperator.EQ, "'" + object.providercompcode + "'"), //provider entity 
				new sap.ui.model.Filter("CcPosnr", sap.ui.model.FilterOperator.EQ, "'" + object.position + "'") //postion
			];
			if (object.enagementType) {
				filterArray.push(new sap.ui.model.Filter("IEctyp", sap.ui.model.FilterOperator.EQ, "'" + object.enagementType + "'"));
			}
			if (object.recoveryType) {
				filterArray.push(new sap.ui.model.Filter("ISubtype", sap.ui.model.FilterOperator.EQ, "'" + object.recoveryType + "'"));
			}
			if (object.recipSystem) {
				filterArray.push(new sap.ui.model.Filter("IRcsys", sap.ui.model.FilterOperator.EQ, "'" + object.recipSystem + "'"));
			}
			if (object.recipCompCode) {
				filterArray.push(new sap.ui.model.Filter("IRerpc", sap.ui.model.FilterOperator.EQ, "'" + object.recipCompCode + "'"));
			}
			if (object.provCostType === "CC") {
				filterArray.push(new sap.ui.model.Filter("CcKostl", sap.ui.model.FilterOperator.EQ, "'" + object.provCostObj + "'"));
			} else {
				filterArray.push(new sap.ui.model.Filter("WbsPosid", sap.ui.model.FilterOperator.EQ, "'" + object.provCostObj + "'"));
			}
			return new Promise(function (resolve, reject) {
				var eventParams = {
					modelName: "gsapProviderCodingODataModel",
					entitySet: "/ProviderCodeSet",
					filters: filterArray,
					urlParameters: "",
					success: function (oData) {
						if (object.provCostType === "CC") {
							if (oData.results && oData.results[0].CcPrctr) {
								resolve(oData.results[0].CcPrctr);
							} else {
								reject("No Profit Center Found");
							}
						} else {
							if (oData.results && oData.results[0].Wbspc) {
								resolve(oData.results[0].Wbspc);
							} else {
								reject("No Profit Center Found");
							}
						}
					},
					error: function (error) {
						context.showMessage(JSON.stringify(error));
						reject("Issue in Profit Center Service");
					}
				};
				if (object.provCostObj) {
					context.readDataFromOdataModel(eventParams, true);
				}
			});
		},
		checkForFurterTrigger: function (validator, value, object) {
			var context = this;
			if (validator.indexOf("sipcrecwbse") !== -1) {
				this.setPropInModel("localDataModel", validator.replace("sipcrecwbse", "rrbprojdef"), value.substring(0, 10));
			}
			if (validator.indexOf("mcswbsse") !== -1) {
				jQuery.each(this.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
					context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcswbsse", value);
					context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcsprojdef", value.substring(0, 10));
				});
			}
			if (validator.indexOf("soldto") !== -1) {
				this.setPropInModel("localDataModel", validator.replace("soldto", "shipto"), object["Kunsh"]);
				this.setPropInModel("localDataModel", validator.replace("soldto", "billto"), object["Kunbp"]);
				this.setPropInModel("localDataModel", validator.replace("soldto", "payer"), object["Kunpy"]);
				this.setPropInModel("localDataModel", validator.replace("soldto", "soldtoname"), object["Name1"]); //@Task 271588
				this.onFurtherToFunctionAndService();
				this.vendorDetermination();
			}
			if (validator.indexOf("providercostobj") !== -1) {
				if (this.getPropInModel("localDataModel", validator.replace("providercostobj", "providercosttyp")) === "WBS") {
					this.setPropInModel("localDataModel", validator.replace("providercostobj", "projectdef"), 
						this.getPropInModel("localDataModel", "/business") === "UP" ? value.substring(0, 11) : value.substring(0, 10));//@Task 239944
				} else {
					this.setPropInModel("localDataModel", validator.replace("providercostobj", "projectdef"), "");
				}
				//if profit center is not determined
				if ((this.getPropInModel(
						"localDataModel", "/fdrroute") === "EBD" || this.getPropInModel("localDataModel", "/fdrroute") === "GCB"
						 || this.getPropInModel("localDataModel", "/fdrroute") === "GCF")) {
					this.onProfitCenterFetch({
						providercompcode: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercompcode")),
						enagementType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "NP" : "PR",
						recipSystem: "GSAP",
						recipCompCode: "GB32",
						recoveryType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "LS" : "TM",
						position: "10",
						provCostType: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercosttyp")),
						provCostObj: value
					}).then(function (profitCenter) {
						context.setPropInModel("localDataModel", validator.replace("providercostobj", "prprftcenter"), profitCenter);
					}).catch(function (error) {
						context.showMessageToast("error");
					});
				} else if ((this.getPropInModel(
						"localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/business") === "DS")) {
					this.onProfitCenterFetch({
						providercompcode: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercompcode")),
						enagementType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "NP" : "PR",
						recipSystem: this.getPropInModel("localDataModel", "/benifCompanies/0/resys"),
						recipCompCode: this.getPropInModel("localDataModel", "/benifCompanies/0/erpcomcode"),
						recoveryType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "LS" : "TM",
						position: "10",
						provCostType: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercosttyp")),
						provCostObj: value
					}).then(function (profitCenter) {
						context.setPropInModel("localDataModel", validator.replace("providercostobj", "prprftcenter"), profitCenter);
					}).catch(function (error) {
						context.showMessageToast("error");
					});
				} else if ((this.getPropInModel(
						"localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/business") === "UP")) {
					this.onProfitCenterFetchSERP({
						providercompcode: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercompcode")),
						enagementType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "NP" : "PR",
						recipSystem: this.getPropInModel("localDataModel", "/benifCompanies/0/resys"),
						recipCompCode: this.getPropInModel("localDataModel", "/benifCompanies/0/erpcomcode"),
						recoveryType: this.getPropInModel("localDataModel", "/fdrroute") === "EBD" && context.getPropInModel("localDataModel",
							validator.replace("providercostobj", "providercosttyp")) === "CC" ? "LS" : "TM",
						position: "10",
						provCostType: context.getPropInModel("localDataModel", validator.replace("providercostobj", "providercosttyp")),
						provCostObj: value
					}).then(function (profitCenter) {
						context.setPropInModel("localDataModel", validator.replace("providercostobj", "prprftcenter"), profitCenter);
					}).catch(function (error) {
						context.showMessageToast(error);
					});
				}
			}
			if (validator.indexOf("cleancostcenter") !== -1 && (this.getPropInModel("localDataModel", "/fdrroute") === "GCB" || 
				this.getPropInModel("localDataModel", "/fdrroute") === "GCF" || 
				this.getPropInModel("localDataModel", "/fdrroute") === "EBD" || (this.getPropInModel(
				"localDataModel", "/fdrroute") === "DIR" && this.getPropInModel("localDataModel", "/business") === 'DS'))) {
				this.setPropInModel("localDataModel", validator.replace("cleancostcenter", "cleancostflag"), "X");
				this.onProfitCenterFetch({
					providercompcode: this.getPropInModel("localDataModel", validator.replace("cleancostcenter", "providercompcode")),
					enagementType: "PR",
					recipSystem: "GSAP",
					recipCompCode: "GB32",
					recoveryType: "TM",
					position: "10",
					provCostType: "CC",
					provCostObj: value
				}).then(function (profitCenter) {
					context.setPropInModel("localDataModel", validator.replace("cleancostcenter", "prprftcenter"), profitCenter);
				}).catch(function (error) {
					context.showMessageToast("error");
				});
			}
			if (validator.indexOf("planfdrno") !== -1) {
				var qtr = new Date().getMonth() < 3 ? "q1" : new Date().getMonth() < 6 ? "q2" : new Date().getMonth() < 9 ? "q3" : "q4";
				this.setPropInModel("localDataModel", "/planbudgetvalue", value["planvalue" + qtr]);
			}
			//@START: Task 271625
			if (validator.indexOf("invcompcode") !== -1) {
				this.setPropInModel("localDataModel", validator.replace("invcompcode", "invgrpcomp"), object["grpcompcode"]);
				this.setPropInModel("localDataModel", validator.replace("invcompcode", "invccaoo"), object["aoo"]);
			}
			if (validator.indexOf("recoverycc") !== -1) {
				var benifCompanies = this.getPropInModel("localDataModel", "/benifCompanies");
				benifCompanies.forEach(function(o) {
					o.recoverycc = value;
				});
				this.setPropInModel("localDataModel", "/benifCompanies", benifCompanies);
			}
			//@END: Task 271625
		},
		getFragment: function (sName) {
			return sap.ui.xmlfragment("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments." + sName, this);
		},
		onDialogFetch: function (values) {
			if (values.hasOwnProperty("fragVariable") && values.hasOwnProperty("fragmentName") && !this[values.fragVariable]) {
				this[values.fragVariable] = this.getFragment(values.fragmentName);
				this.getView().addDependent(this[values.fragVariable]);
			}
			if (values.setData) {
				this.loadDataToDialog(values);
			}
			if (values.initialFilterflag) {
				var fragvalues = this.getCustomDataValues(this[values.fragVariable].getCustomData());
				this.executeFilter(this[values.fragVariable][fragvalues.fragControl].getBinding(fragvalues.fragBindingInfo), this.makeFilterArray(
					fragvalues.searchField.split(","), fragvalues.hasOwnProperty("searchOperator") ? fragvalues.searchOperator : "Contains", values
					.initalFilterValue));
			}
			if (values.beforeOpenExecution) {
				values.beforeOpenFunction(values, this);
			}
			this[values.fragVariable].open();
			//@INVRECIPIENT
			if (values.afterOpenExecution) {
				values.afterOpenFunction();
			}
			//@INVRECIPIENT
		},
		executeFilter: function (binding, filters, filterType) {
			if (binding) {
				binding.filter(filters, filterType ? filterType : "");
			}
		},
		valueHelpSearch: function (oEvent) {
			var context = this;
			var values = this.getCustomDataValues(oEvent.getSource().getCustomData()),
				query = oEvent.getParameter("value") ? oEvent.getParameter("value") : "",
				filters = [];
			if (values.hasOwnProperty("searchField") && query) {
				filters = this.makeFilterArray(values.searchField.split(","), values.hasOwnProperty("searchOperator") ? values.searchOperator :
					"Contains", query, values.searchCondition);
			}
			else {
				filters = [];
			}
			if (values.hasOwnProperty("fragControl") && oEvent.getSource().hasOwnProperty(values.fragControl) && oEvent.getSource()[values.fragControl] &&
				values.hasOwnProperty("fragBindingInfo")) {
				this.executeFilter(oEvent.getSource()[values.fragControl].getBinding(values.fragBindingInfo), filters, values.fragfilterType);
				
				if (values.hasOwnProperty("defaultFilter") && (values.defaultFilter === "true" || values.defaultFilter === true)) {
					this.executeFilter(oEvent.getSource()[values.fragControl].getBinding(values.fragBindingInfo), context.makeFilterArray([values.defaultFilterProp],
						values.defaultFilterOp, values.defaultFilterValue), "Application");
				}
			}
			if (values.hasOwnProperty("selctionBindingContext") && values.selctionBindingContext === 'gsapCCSearchModel' && query !== "") {//@Bug 242563, Task 242908
				var itemsPath = oEvent.getSource().getParent().getController().itemsPath;
				var providerPath = itemsPath.substring(0, itemsPath.lastIndexOf("/")) + "/";
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
							.concat(this.makeFilterArray(["providercostobj"], "EQ", query)),
						// filters: [].concat(this.makeFilterArray(["providercostobj"], "EQ", query))
						// 	.concat(this.makeFilterArray(["providersystem"], "EQ", this.getPropInModel("localDataModel", providerPath + "providersystem")))
						// 	.concat(this.makeFilterArray(["providercompcode"], "EQ", this.getPropInModel("localDataModel", providerPath + "providercompcode"))), //@Bug 242563
						//@END: Task 274288
						urlParameters: {},
						success: function (oData) {
							if (oData.results.length) {
								context.showMessage("Cost Center " + query + " is already used in FDR: " + oData.results[0].fdrno);
								context.setPropInModel("localDataModel", providerPath + "providercostobj", "");
							}
						},
						error: function (oError) {
	
						}
					});
				} //@Task 301408
			}
		},
		//TODO Comment method
		getContractDetails1: function () {
			var context = this;
			return new Promise(function (resolve, reject) {
				// var commonContracts =[];
				var allData = context.getPropInModel("localDataModel", "/");
				var route = context.getPropInModel("localDataModel", "/fdrroute");
				var masterfilterArray = [];
				if (route === "DIR") {
					//get wrt to BenCompany
					masterfilterArray.push(context.makeFilterArray(["provcompcode"], "EQ", allData.providerCompanies[0].providercompcode));
				} else {
					//leg 1 get WRT BenComapny as GB32
					masterfilterArray.push(context.makeFilterArray(["bencompcode"], "EQ", "GB32"));
					//leg 2 get WRT Provider Company as GB32
					masterfilterArray.push(context.makeFilterArray(["provcompcode"], "EQ", "GB32"));
				}
				context.setModel(new JSONModel(), "contractSearchLocalModel");
				ContractValidation.getFromContractDetails(context, masterfilterArray).then(function (contractObj) {
					// {commonContract:commonArray,contractDetails:contractDetails}
					if (contractObj.commonContract.length) {
						resolve(contractObj);
						//TODO: Uncomment makeContractDetailsModels
						// this.makeContractDetailsModels(contractObj);
					} else {
						reject("No Common Contract Line Items Available for the selected service provider and recipient. Please contact your Key Account Manager @ GXGLSBOINGSRKeyAccountManagers@shell.com");
					}
				});
			});
		},
		makeContractDetailsModels: function (contractObj) {
			var isContract = true;
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
			
			if(isContract && !contractObj.providerContracts.length && !contractObj.benifContracts.length){
				this.showMessage("No contracts available for selected Function/Service/Activity");
				this.setPropInModel("contractDatesModel", "/allowTo", false);
				this.setPropInModel("localDataModel", "/todate", "");
				return;
			}
			
			//FDR Table
			var contractDetailArray = [];
			jQuery.each(contractObj.providerContracts, function (ix, ox) {
				contractDetailArray.push({
					ACTION: "C",
					contractid: ox.contractid,
					contractfrom: new Date(ox.agrvalfrom) ? new Date(ox.agrvalfrom) : "",
					contractto: new Date(ox.agrvalto) ? new Date(ox.agrvalto) : ""
				});
			});
			jQuery.each(contractObj.benifContracts, function (ix, ox) {
				contractDetailArray.push({
					ACTION: "C",
					contractid: ox.contractid,
					contractfrom: new Date(ox.agrvalfrom) ? new Date(ox.agrvalfrom) : "",
					contractto: new Date(ox.agrvalto) ? new Date(ox.agrvalto) : ""
				});
			});
			contractDetailArray = usp.uniq(contractDetailArray, ["contractid"]);
			var oldContracts = this.getPropInModel("localDataModel", "/contractkey");
			if (oldContracts.length) {
				var contArray = this.checkForDuplicates(oldContracts, contractDetailArray, ["contractid"]);
				jQuery.each(oldContracts, function (ix, ox) {
					jQuery.each(contArray.duplicateArray, function (iy, oy) {
						if (ox.contractid === oy.contractid) {
							oy.ACTION = ox.ACTION;
						}
					});
				});
				contractDetailArray = contArray.uniqueArray.concat(contArray.duplicateArray);
			}
			this.setPropInModel("localDataModel", "/contractkey", contractDetailArray);
			this.setMinMaxFDRValidity(contractObj);
		},
		getProjectScreen: function (provderPath) {
			//first Open Project Screen 
			var providerDetails = this.getPropInModel("localDataModel", provderPath);
			if (providerDetails.providersystem === "SERP") {
				//
			} else {
				// if(providerDetails.projectdef){
				// 	this.showMessage("Project Already Created");
				// 	return;
				// }
				this.setModel(new JSONModel({
					Business: 0,
					results: []
				}), "gsapProjectLocalModel");
				this.onDialogFetch({
					fragmentName: "GSAPProjectScreen",
					fragVariable: "gsapProjFrag"
				});
				this["gsapProjFrag"].getContent()[0].goToStep("wbsLevelDetails");
				ProjectParser.gsapProjectTrigger(this, provderPath);
				this.gsapProjectSectionEvent.loadFewthings(this);
			}
		},
		makeFDRPayload: function () {
			var context = this;
			return new Promise(function (resolve, reject) {
				var payload = FDRPlusParser.makePayload(context, "C", "STATUS");
				//@START: Task 317284 - Send Date as String to SCP to fix UTC timestamp issue
				payload[0].header.fromdate = payload[0].header.fromdate ? context.convertDate(payload[0].header.fromdate) : payload[0].header.fromdate;
				payload[0].header.todate = payload[0].header.todate ? context.convertDate(payload[0].header.todate) : payload[0].header.todate;
				//@END: Task 317284
				var callingObject = {
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/fdrplus.xsjs",
					payload: {
						TableName: "fdrheader",
						data: payload
					},
					success: function (oSuccess) {
						if (oSuccess.rcode === "SUCCESS") {
							resolve(oSuccess);
						}
						var successMessages = oSuccess.messages.filter(function (e) {
							return e.mtype === "S";
						});
						var errorMessages = oSuccess.messages.filter(function (e) {
							return e.mtype === "E";
						});
						//Check SuccessMessages
						jQuery.each(successMessages, function (ix, ox) {
							// setPropInModel getPropInModel
							if (ox.fdrno && context.getPropInModel("localDataModel", "/ACTION") === "C") {
								context.setPropInModel("localDataModel", "/ACTION", "U");
								context.setPropInModel("localDataModel", "/fdrno", ox.fdrno);
							}
						});
						//@START: Task 223042
						if(errorMessages.length) {
							reject("Error in saving FDR");
						}
						//@END: Task 223042
						
						context.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
					},
					error: function (oerror) {
						reject("Error in saving FDR");
						context.setPropInModel("localDataModel", "/locksubmit", "N");//@Bug 242893
					},
					typeOfCall: "POST"
				};
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
			});
		},
		determineItemNo: function () {
			FDRPlusParser.determineItemNo(this);
		},
		determineSubItemNo: function () {
			FDRPlusParser.determineSubItemNo(this);
		},
		onGSAPProjectSubmit: function () {
			ProjectParser.makeGSAPProjectCall(this);
		},
		loadDefaults: function () {
			var context = this;
			this.getView().getModel("feederMainODataModel").read("/cobparentmapping", {
				filters: [
					new sap.ui.model.Filter("deletionflag", sap.ui.model.FilterOperator.NE, 'X')
				],
				success: function (odata) {
					context.getView().setModel(new sap.ui.model.json.JSONModel(odata), "subSetLocalModel");
					context.subsetFrag = "";
				},
				error: function (oError) {

				}
			});

			var wbsDefaultsService = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "wbstableleg2",
				filters: [],
				urlParameters: {},
				success: function (oData) {
					context.setModel(new JSONModel(oData), "defaultsWBSLocalModel");
				},
				error: ""
			};
			this.readDataFromOdataModel(wbsDefaultsService);

			var allocationKeys = {
				modelName: "normalizationDataODataModel",
				entitySet: "normalization",
				filters: [],
				urlParameters: {},
				success: function (oData) {
					var uniqueRecords = [];
					usp.uniq(oData.results, ["allockeycode"]).forEach(function (e) {
						uniqueRecords.push(usp.pick(e, ["allockeycode", "division"]));
					});
					context.setModel(new JSONModel({
						results: uniqueRecords
					}), "defaultsAllocationKeyModel");
				},
				error: ""
			};
			this.readDataFromOdataModel(allocationKeys);

			var recoveryType = {
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "recoverytype",
				filters: [],
				urlParameters: {},
				success: function (oData) {
					context.setModel(new JSONModel(oData), "defaultsRecoveryTypeLocalModel");
				},
				error: ""
			};
			this.readDataFromOdataModel(recoveryType);
		},
		makeEngagmentOdatCallWithPayload: function (eventValues) {
			var context = this;
			if (eventValues.payload.Ecref) {
				//checkFor SO
				var undpateSO = {
					modelName: "serp150ODataModel",
					entitySet: "SOStatusSet",
					filters: [new sap.ui.model.Filter("FDRNo", sap.ui.model.FilterOperator.EQ, eventValues.payload.Ecref)],
					urlParameters: {},
					success: function (oData) {
						if (eventValues.payload.Engmnt_Prcoding.length === oData.results.length) {
							jQuery.each(eventValues.payload.Engmnt_Prcoding, function (ix, ox) {
								ox.Vbeln = oData.results[ix].SONo;
							});
							context.getView().getModel(eventValues.modelName).create("/" + eventValues.entitySet, eventValues.payload, {
								urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
								success: eventValues.success,
								error: eventValues.error
							});
						} else {
							context.getView().getModel(eventValues.modelName).create("/" + eventValues.entitySet, eventValues.payload, {
								urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
								success: eventValues.success,
								error: eventValues.error
							});
						}
					},
					error: function () {
						context.getView().getModel(eventValues.modelName).create("/" + eventValues.entitySet, eventValues.payload, {
							urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
							success: eventValues.success,
							error: eventValues.error
						});
					}
				};
				context.readDataFromOdataModel(undpateSO);
			} else {
				context.getView().getModel(eventValues.modelName).create("/" + eventValues.entitySet, eventValues.payload, {
					urlParameters: jQuery.extend({}, eventValues.hasOwnProperty("urlParameters") ? eventValues.urlParameters : {}, {}),
					success: eventValues.success,
					error: eventValues.error
				});
			}
		},
		onEngagementOperation: function () {
			var context = this;
			return new Promise(function (resolve, reject) {
				if (context.getPropInModel("localDataModel", "/fdrroute") === 'GCB' || context.getPropInModel("localDataModel", "/fdrroute") === 'GCF') {
					EngagementParser.onMakeEnagementPayload(context).then(function (data) {
						var promiseArray = [];
						jQuery.each(data, function (ix, ox) {
							promiseArray.push(new Promise(function (arrResolve, arrReject) {
								var obj = ox;
								var engeObjToCall = {
									modelName: "serp150ODataModel",
									entitySet: "CreateEngmntSet",
									payload: obj.payload,
									urlParameters: "",
									success: function (oData) {
										if (oData.Ecref && oData.Action === "C") {
											obj.state = "S";
											obj.engno = oData.Ecref;
											//@START: Task 234717
											obj.engtype = oData.Engmnt_GenDetails.Ectyp;
											obj.engrecoverytype = oData.Engmnt_GenDetails.Rctyp;
											obj.engstatus = oData.Engmnt_GenDetails.Stcde;
											//@END: Task 234717
											arrResolve(obj);
										} else {
											/*obj.state = "E";
											obj.engno = "";
											//@START: Task 234717
											obj.engtype = "";
											obj.engrecoverytype = "";
											obj.engstatus = "";
											//@END: Task 234717
											arrResolve(obj);*/
											if (oData.Engmnt_Return.results.length) {
												var msg = "", type = "";
												jQuery.each(oData.Engmnt_Return.results, function (ix, ox) {
													msg = msg + ox.Message + "\n";
													type = ox.Type;
												});
											}
											context.showMessage(msg, "Leg 1 - Engagement Result");
											//@START: Task 274288 - Bugfix
											obj.state = type === "E" ? type : "S";
											obj.engno = oData.Ecref;
											obj.engtype = type === "E" ? "" : oData.Engmnt_GenDetails.Ectyp;
											obj.engrecoverytype = type === "E" ? "" : oData.Engmnt_GenDetails.Rctyp;
											obj.engstatus = type === "E" ? "" : oData.Engmnt_GenDetails.Stcde;
											arrResolve(obj);
											//@END: Task 274288 - Bugfix
										}
									},
									error: function(oerror) {
										context.showMessageToast(oerror);
									}
								};
								//check if Object has Engement Number
								context.getFeederGLAccount(obj.payload.Engmnt_PrCodHdr.Slorg, "1", false, null).then(function (glaccount) {
									obj.payload.Engmnt_Rccoding[0].Glacc = glaccount;
									context.makeEngagmentOdatCallWithPayload(engeObjToCall);
								});
							}));
						});
						Promise.all(promiseArray).then(function (arrayObj) {
							jQuery.each(arrayObj, function (ix, ox) {
								jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (iy, oy) {
									if (oy.itemno === ox.itemno && ox.state === "S") {
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagmentno", ox.engno);
										//@START: Task 234717
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagmentstatus", ox.engstatus);
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagementtype", ox.engtype);
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagementrectyp", ox.engrecoverytype);
										//@END: Task 234717
									}
								});
							});
							resolve("SUCCESS");
						});
					});
				} else if (context.getPropInModel("localDataModel", "/fdrroute") === 'EBD') {
					EngagementParser.onMakeEnagementPayload(context).then(function (payloadObject) {
						var promiseArray = [];
						jQuery.each(payloadObject, function (ix, ox) {
							promiseArray.push(new Promise(function (resolve, reject) {
								var objctCopy = jQuery.extend({}, {}, ox);
								//determine GL here 
								//@START: Task 313026
								var glObj = {
									salesorg: objctCopy.payload.Engmnt_PrCodHdr.Slorg,
									leg: objctCopy.leg.toString(),
									systemid: objctCopy.payload.Engmnt_GenDetails.Rcsys
								};
								context.getGLAccount(glObj).then(
								//context.getFeederGLAccount(objctCopy.payload.Engmnt_PrCodHdr.Slorg, objctCopy.leg.toString(), false, null).then(
								//@END: Task 313026
									function (glaccount) {
										objctCopy.payload.Engmnt_Rccoding[0].Glacc = glaccount;
										var callingObj = {
											modelName: "serp150ODataModel",
											entitySet: "CreateEngmntSet",
											payload: objctCopy.payload,
											urlParameters: "",
											success: function (oData) {
												if (oData.Ecref && oData.Action === "C") {
													objctCopy.status = "S";
													objctCopy.engno = oData.Ecref;
													//@START: Task 234717
													objctCopy.engtype = oData.Engmnt_GenDetails.Ectyp;
													objctCopy.engrecoverytype = oData.Engmnt_GenDetails.Rctyp;
													objctCopy.engstatus = oData.Engmnt_GenDetails.Stcde;
													//@END: Task 234717
													resolve(objctCopy);
												} else {
													if (oData.Engmnt_Return.results.length) {
														var msg = "", type = "";
														jQuery.each(oData.Engmnt_Return.results, function (ix, ox) {
															msg = msg + ox.Message + "\n";
															type = ox.Type;
														});
													}
													context.showMessage(msg, "Engagement Result");
													objctCopy.status = type === "E" ? type : "S"; //@Task 274288 - Bugfix
													objctCopy.msg = msg;
													//@START: Task 274288 - Bugfix
													objctCopy.engno = oData.Ecref; 
													objctCopy.engtype = type === "E" ? "" : oData.Engmnt_GenDetails.Ectyp;
													objctCopy.engrecoverytype = type === "E" ? "" : oData.Engmnt_GenDetails.Rctyp;
													objctCopy.engstatus = type === "E" ? "" : oData.Engmnt_GenDetails.Stcde;
													//@END: Task 274288 - Bugfix
													resolve(objctCopy);
												}
											},
											error: function(oerror) {
												context.showMessageToast(oerror);
											}
										};
										if (parseFloat(objctCopy.payload.Engmnt_GenDetails.Etotal) && objctCopy.leg === 1) {
											context.makeEngagmentOdatCallWithPayload(callingObj);
										} else if (parseFloat(objctCopy.payload.Engmnt_GenDetails.Etotal) && objctCopy.leg === 2) {
											//make profit center Determination first 
											context.onProfitCenterFetch({
												providercompcode: objctCopy.payload.Engmnt_GenDetails.Perpc,
												enagementType: objctCopy.payload.Engmnt_GenDetails.Ectyp,
												recipSystem: objctCopy.payload.Engmnt_GenDetails.Rcsys,
												recipCompCode: objctCopy.payload.Engmnt_GenDetails.Rerpc,
												recoveryType: objctCopy.payload.Engmnt_GenDetails.Rctyp,
												position: "10",
												provCostType: objctCopy.payload.Engmnt_Prcoding[0].Costc ? "CC" : "WBS",
												provCostObj: objctCopy.payload.Engmnt_Prcoding[0].Costc ? objctCopy.payload.Engmnt_Prcoding[0].Costc : objctCopy
													.payload
													.Engmnt_Prcoding[0].Wbse
											}).then(function (profictCenter) {
												objctCopy.payload.Engmnt_Prcoding[0].Prfcn = profictCenter;
												context.makeEngagmentOdatCallWithPayload(callingObj);
											});
										} else {
											objctCopy.status = "E";
											objctCopy.msg = "No Engagement Value";
											resolve(objctCopy);
										}
									});
								// resolve({idx:ix,engno:"",itemno:ox.itemno,leg:ox.leg});
							}));
						});
						Promise.all(promiseArray).then(function (values) {
							var providerUpdate = values.filter(function (e) {
								return e.leg === 1;
							});
							var benUpdate = values.filter(function (e) {
								return e.leg === 2;
							});
							jQuery.each(providerUpdate, function (ix, ox) {
								jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (iy, oy) {
									if (oy.itemno === ox.itemno && ox.status === "S") {
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagmentno", ox.engno);
										//@START: Task 234717
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagmentstatus", ox.engstatus);
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagementtype", ox.engtype);
										context.setPropInModel("localDataModel", "/providerCompanies/" + iy + "/engagementrectyp", ox.engrecoverytype);
										//@END: Task 234717
									}
								});
							});
							jQuery.each(benUpdate, function (ix, ox) {
								jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (iy, oy) {
									if (oy.itemno === ox.itemno && ox.status === "S") {
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagmentno", ox.engno);
										//@START: Task 234717
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagmentstatus", ox.engstatus);
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagementtype", ox.engtype);
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagementrectyp", ox.engrecoverytype);
										//@END: Task 234717
									}
								});
							});
							resolve("SUCCESS");
						});
					});
				} else if (context.getPropInModel("localDataModel", "/fdrroute") === "DIR") {
					// if (context.getPropInModel("localDataModel", "/business") === 'DS') {
					EngagementParser.onMakeEnagementPayload(context).then(function (payloadObject) {
						var promiseArray = [];
						jQuery.each(payloadObject, function (ix, ox) {
							promiseArray.push(new Promise(function (resolve, reject) {
								var objctCopy = jQuery.extend({}, {}, ox);
								var callingObj = {
									modelName: "serp150ODataModel",
									entitySet: "CreateEngmntSet",
									payload: objctCopy.payload,
									urlParameters: "",
									success: function (oData) {
										if (oData.Ecref && oData.Action === "C") {
											objctCopy.status = "S";
											objctCopy.engno = oData.Ecref;
											//@START: Task 234717
											objctCopy.engtype = oData.Engmnt_GenDetails.Ectyp;
											objctCopy.engrecoverytype = oData.Engmnt_GenDetails.Rctyp;
											objctCopy.engstatus = oData.Engmnt_GenDetails.Stcde;
											//@END: Task 234717
											resolve(objctCopy);
										} else {
											if (oData.Engmnt_Return.results.length) {
												var msg = "", type = "";
												jQuery.each(oData.Engmnt_Return.results, function (ix, ox) {
													msg = msg + ox.Message + "\n";
													type = ox.Type;
												});
											}
											context.showMessage(msg, "Engagement Result");
											objctCopy.status = type === "E" ? type : "S"; //@Task 274288 - Bugfix
											objctCopy.msg = msg;
											//@START: Bug 298461
											objctCopy.engno = oData.Ecref; 
											objctCopy.engtype = type === "E" ? "" : oData.Engmnt_GenDetails.Ectyp;
											objctCopy.engrecoverytype = type === "E" ? "" : oData.Engmnt_GenDetails.Rctyp;
											objctCopy.engstatus = type === "E" ? "" : oData.Engmnt_GenDetails.Stcde;
											//@END: Bug 298461
											resolve(objctCopy);
										}
									},
									error: function(oerror) {
										context.showMessageToast(oerror);
									}
								};
								if (parseFloat(objctCopy.payload.Engmnt_GenDetails.Etotal) && objctCopy.leg === 1) {
									context.makeEngagmentOdatCallWithPayload(callingObj);
								} else {
									objctCopy.status = "E";
									objctCopy.msg = "No Engagement Value";
									resolve(objctCopy);
								}
								// resolve({idx:ix,engno:"",itemno:ox.itemno,leg:ox.leg});
							}));
						});
						Promise.all(promiseArray).then(function (values) {
							var providerUpdate = values.filter(function (e) {
								return e.leg === 1;
							});
							jQuery.each(providerUpdate, function (ix, ox) {
								jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (iy, oy) {
									if (oy.itemno === ox.benitemno && ox.status === "S") {
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagmentno", ox.engno);
										//@START: Task 234717
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagmentstatus", ox.engstatus);
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagementtype", ox.engtype);
										context.setPropInModel("localDataModel", "/benifCompanies/" + iy + "/engagementrectyp", ox.engrecoverytype);
										//@END: Task 234717
									}
								});
							});
							resolve("SUCCESS");
						});
					});
				}
			});
		},
		setToUpdateFlag: function () {
			this.setPropInModel("localDataModel", "/ACTION", "U");
			var context = this;
			jQuery.each(context.getPropInModel("localDataModel", "/providerCompanies"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/providerCompanies/" + ix + "/ACTION", "U");
			});
			jQuery.each(context.getPropInModel("localDataModel", "/benifCompanies"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/ACTION", "U");
			});
			jQuery.each(context.getPropInModel("localDataModel", "/contractkey"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/contractkey/" + ix + "/ACTION", "U");
			});
			jQuery.each(context.getPropInModel("localDataModel", "/fdrproject"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/fdrproject/" + ix + "/ACTION", "U");
			});
			jQuery.each(context.getPropInModel("localDataModel", "/rccoding"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/rccoding/" + ix + "/ACTION", "U");
				context.setPropInModel("localDataModel", "/rccoding/" + ix + "/fdrno", context.getPropInModel("localDataModel", "/fdrno"));//@Task 223042
			});
			jQuery.each(context.getPropInModel("localDataModel", "/addlProjDetails"), function (ix, ox) {
				context.setPropInModel("localDataModel", "/addlProjDetails/" + ix + "/ACTION", "U");
			});
		},
		makeEBDHUBProject: function () {
			var context = this;
			return new Promise(function (resolve, reject) {
				ProjectParser.makeEBDHUBProject(context).then(function (data) {
					resolve(data);
				}).catch(function (error) {
					reject(error);
				});
			});
		},
		//@START: Bug 233072
		getContractDetails: function() {
			var context = this;
			var fdrno = context.getPropInModel("localDataModel", "/fdrno");
			var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
			return new Promise(function(resolve, reject) {
				if(!fdrno || !fdrroute) {
					reject("Contract Validation Failed - Contact Admin");
				}
				var callingObject = {
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/contractvalidationcall1.xsjs", //contractvalidation.xsjs",
					payload: {
						TableName: fdrroute,
						fdrno: fdrno
					},
					success: function (oData) {
						//Process Contracts data
						if(oData && oData.OGCCONTRACTID.length) {//@Bug 241714
							var contractData = oData.OGCCONTRACTID ? oData.OGCCONTRACTID : [];
							context.setPropInModel("localDataModel", "/selfBilling", oData.OSAME ? oData.OSAME : "");
							resolve(contractData);
						}
						else {
							reject("No Common Contract Line Items Available for the selected service provider and recipient. Please contact your Key Account Manager @ GXGLSBOINGSRKeyAccountManagers@shell.com");
						}
					},
					error: function (oerror) {
						reject("Contract Validation Failed - Contact Admin");
					},
					typeOfCall: "POST"
				};
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
			});
		},
		
		getContractDates: function() {
			var context = this;
			var fdrno = context.getPropInModel("localDataModel", "/fdrno");
			var fdrroute = context.getPropInModel("localDataModel", "/fdrroute");
			return new Promise(function(resolve, reject) {
				if(!fdrno || !fdrroute) {
					reject("Contract Validation failed - Contact Admin");
				}
				if(!context.getPropInModel("localDataModel", "/funtionid") || !context.getPropInModel("localDataModel", "/serviceid")) {
					resolve ({providerContracts: [], benifContracts: []});
				}
				if(fdrroute === "GCB" || fdrroute === "GCF") {
					if(!context.getPropInModel("localDataModel", "/funtionid") || !context.getPropInModel("localDataModel", "/serviceid") || !context.getPropInModel("localDataModel", "/activityid")) {
						resolve ({providerContracts: [], benifContracts: []});
					}
				}
				//@START: Task 257521 - Self billing (Prov and Beneficiary is same)
				if(context.getPropInModel("localDataModel", "/fdrroute") === "DIR" && context.getPropInModel("localDataModel", "/selfBilling") === "X") {
					resolve ({providerContracts: [], benifContracts: []});
				}
				//@END: Task 257521
				
				var callingObject = {
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/contractvalidationcall2.xsjs",
					payload: {
						TableName: fdrroute,
						fdrno: fdrno,
						functionid: context.getPropInModel("localDataModel", "/funtionid"),
						serviceid: context.getPropInModel("localDataModel", "/serviceid"),
						activityid: context.getPropInModel("localDataModel", "/fdrroute").startsWith("GC") ? context.getPropInModel("localDataModel", "/activityid") : ""
					},
					success: function (oData) {
						//Process Contracts data
						if(oData && (oData.OPROVIDER || oData.OBENI)) {
							var contractData = {
								providerContracts: oData.OPROVIDER ? oData.OPROVIDER : [],
								benifContracts: oData.OBENI ? oData.OBENI : [],
							};
							resolve(contractData);
						}
						else {
							reject("No Common Contract Line Items Available for the selected service provider and recipient. Please contact your Key Account Manager @ GXGLSBOINGSRKeyAccountManagers@shell.com");
						}
					},
					error: function (oerror) {
						reject("Contract Validation Failed - Contact Admin");
					},
					typeOfCall: "POST"
				};
				
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
			});
		},
		
		//Delete selected Provider/Beneficiary records
		deleteProvBen: function(tableName, fdrno, deleteData, values, newData) {
			var context = this, payload = [];
			deleteData.forEach(function(o) {
				payload.push({
					TableName: tableName,
					fdrno: fdrno,
					itemno: o.itemno,
					subitemno: o.subitemno,
					ACTION: "D",
					appname:context.getPropInModel("tileIdentityModel", "/role") ? context.getPropInModel("tileIdentityModel", "/role") : "X" // CHG0411505 
				});
			});
			var callingObject = {
				url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/fdrindividual.xsjs",
				payload: payload,
				success: function (oData) {
					//Do nothing
					context.showMessageToast("Delete successful");
					//@START: Task 274288
					if(tableName === "provider") {
						context.addPlusSignForProviders(newData);
					}
					//@END: Task 274288
					context.setPropInModel("localDataModel", "/" + values.bindingValue, newData);
				},
				error: function (oerror) {
					context.showMessage("Unable to delete " + tableName);
				},
				typeOfCall: "POST"
			};
			this.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
		},
		//@END: Bug 233072
		
		//@START: Task 271625
		//Get Unique records for a combination of Company code, Company name, AOO and Group Company code
		getUniqRecords: function(aData) {
			var oUniq = {}, aUniqData = [];
			aData.forEach(function(o) {
				if(o.deletionflag !== "X") {
					oUniq[o.aoo + "-" + o.compcode + "-" + o.grpcompcode + "-" + o.compname] = o;	
				}
			});
			//Convert unique object to array
			Object.values(oUniq).forEach(function(o) {
				aUniqData.push(o);
			});
			return aUniqData;
		},
		//@END: Task 271625
		
		//@START: Task 274288
		addPlusSignForProviders: function(aData) {
			var aProviderData = [];
			var groupOfProv = usp.groupBy(aData, "itemno");
			jQuery.each(groupOfProv, function(ix, ox) {
				ox.forEach(function(oy, iy) {
					oy.addPlus = (iy === 0) ? true : false;
					aProviderData.push(oy);
				});
			});
			return aProviderData;
		},
		//@END: Task 274288
		
		//@START: Task 278528
		updateFDRActualsHistory: function() {
			var context = this, aHistoryData = [];
			var benifData = context.getPropInModel("localDataModel", "/benifCompanies").filter(function(o) {
				return o.deletionflag !== "X";
			});
			benifData.forEach(function(o) {
				aHistoryData.push({
					fdrno: context.getPropInModel("localDataModel", "/fdrno"),
					itemno: o.itemno,
					subitemno: o.subitemno,
					finyear: o.finyear,
					qtr: o.qtr,
					beneficiarycompcode: o.beneficiarycompcode,
					refofbusiness: o.refofbusiness,
					invcompcode: o.invcompcode ? o.invcompcode : "", //For GCB/GCF
					fdrheadervalue: context.getPropInModel("localDataModel", "/planbudgetvalue") ? context.getPropInModel("localDataModel", "/planbudgetvalue") : "1",
					actualpercentage: o.beneficiaryper,
					actualcalculvalue: o.beneficiaryamt,
					mcswbse: o.mcswbsse ? o.mcswbsse : "", //For EBD
					recoverywbse: o.sipcrecwbse ? o.sipcrecwbse : "", //For GCB/GCF
					costobjtype: o.bencosttyp ? o.bencosttyp : "", //For EBD
					costobjval: o.costobjval ? o.costobjval : "" //For EBD
				});
			});
			var callingObject = {
				url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/fdrhistory.xsjs",
				payload: {
					data: aHistoryData
				},
				success: function (oData) {
					context.showMessageToast("FDR Actuals History updated successfully");
				},
				error: function (oerror) {
					context.showMessageToast("Error in updating FDR Actuals History");
				},
				typeOfCall: "POST"
			};
			context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
		},
		//@END: Task 278528
		
		//@START: Task 300908
		roundOffValue: function(value, baseValue) {
			var roundOff = baseValue.toString().split(".")[1] ? baseValue.toString().split(".")[1].length : 0;
			var numbersBeforePoint = value.toString().split(".")[0].length;
			return parseFloat(value.toPrecision(numbersBeforePoint + roundOff));
		},
		//@END: Task 300908
		
		//@START: Task 313026
		//Get GL Account based on the Recipient system
		getGLAccount: function(glObj) {
			var context = this;
			return new Promise(function(resolve, reject) {
				//GSAP Recipient System - Get GL account from Feeder table
				if(glObj.systemid === "GSAP") {
					context.getFeederGLAccount(glObj.salesorg, glObj.leg, false, null).then(function(glaccount) {
						resolve(glaccount);
					}).catch(function(oerror) {
						reject(oerror);
					});
				}
				//Non-GSAP Recipient System - GL Account is blank
				else {
					resolve("");
				}
			});
		},
		//@END: Task 313026
		
		//@START: Task 317284
		padMonthDate: function(n) {
			return n < 10 ? '0' + n : n;
		},
		
		convertDate: function(date) {
			var convertedDate = new Date(date);
			return convertedDate.getFullYear() + "-" + this.padMonthDate(convertedDate.getMonth() + 1) + "-" + this.padMonthDate(convertedDate.getDate()) + "T00:00:00.000Z";
		},
		//@END: Task 317284
		
		//@START: Task 319428
		//Compare previous data with what has changed in current session
		compareUserData: function() {
			var toRecipients = [];
			var dbData = this.getPropInModel("dbDataModel", "/");
			var localData = this.getPropInModel("localDataModel", "/");
			if(localData.providerCompanies[0].providerconfirmer !== dbData.provCompanies.providerconfirmer) {
				toRecipients.push({"ToRecipient": localData.providerCompanies[0].providerconfirmer});
			}
			if(localData.benifCompanies[0].consumer !== dbData.benCompanies.consumer) {
				toRecipients.push({"ToRecipient": localData.benifCompanies[0].consumer});
			}
			if(localData.rnafocal !== dbData.rnafocal) {
				toRecipients.push({"ToRecipient": localData.rnafocal});
			}
			//@START: Task 349972
			if(!toRecipients.length && localData.gsrfocal !== dbData.gsrfocal) {
				toRecipients.push({"ToRecipient": localData.gsrfocal});
			}
			//@END: Task 349972
			return toRecipients;
		},
		
		//Once FDR saved to SCP, update the dbDataModel for next iteration
		updatePreviousUserValues: function() {
			var localData = this.getPropInModel("localDataModel", "/");
			var dbHeaderData = Object.assign(true, {}, localData);
			this.setPropInModel("dbDataModel", "/", dbHeaderData);
			var dbProvData = Object.assign(true, {}, localData.providerCompanies[0]);
			this.setPropInModel("dbDataModel", "/provCompanies", dbProvData);
			var dbBenData = Object.assign(true, {}, localData.benifCompanies[0]);
			this.setPropInModel("dbDataModel", "/benCompanies", dbBenData);
		},
		//@END: Task 319428
		
		//@START: Task 332986
		//OData call to update Complex FDR engagements in ECT
		onEngagementOperationComplex: function() {
			var context = this;
			return new Promise(function (resolve, reject) {
				//Make payload
				EngagementParser.onMakeEngagementPayloadComplex(context).then(function(payloadObject) {
					var objctCopy = jQuery.extend({}, {}, payloadObject);
					var callingObj = {
						modelName: "serp150ODataModel",
						entitySet: "EngagementSet",
						payload: objctCopy,
						urlParameters: "",
						success: function (oData) {
							if(oData.ReturnSet.results.length) {
								var msg = "", type = "";
								jQuery.each(oData.ReturnSet.results, function (ix, ox) {
									msg = msg + ox.Message + "\n";
									type = ox.Type;
								});
								var aErrorList = oData.ReturnSet.results.filter(function(o) {
									return o.Type === "E";
								});
								if(!aErrorList.length) {
									context.showMessage(msg, "Engagement Update Result");
									resolve();
								}
								else {
									context.showMessage(msg, "Error in Engagement Update");
									reject();
								}
							}
							else {
								context.showMessage("Error in Engagement update");
								reject();
							}
						},
						error: function(oerror) {
							reject(oerror);
						}
					};
					//Make OData call
					context.getView().getModel(callingObj.modelName).create("/" + callingObj.entitySet, callingObj.payload, {
						urlParameters: jQuery.extend({}, callingObj.hasOwnProperty("urlParameters") ? callingObj.urlParameters : {}, {}),
						success: callingObj.success,
						error: callingObj.error
					});
				});
			});
		},
		//@START: Task 332986
		
		//@START: Task 346718
		//Set URL for attachments
		setAttachmentURLPath: function (fileName, id) {
			return this.getView().getModel("serp110ODataModel").sServiceUrl + "/AttachmentSet(FileName='" + fileName + "',FDRNo='" + id + "')/$value";
		},
		
		//Read the list of uploaded documents from the entityset and set them to model
		onUploadAttachments: function () {
			var context = this;
			//Get the list of files to be uploaded
			var aUploadCollection = this.attachmentSetFrag.getContent()[0];
			//Set CSRF token for each file
			jQuery.each(aUploadCollection._aFileUploadersForPendingUpload, function (ix, ox) {
				jQuery.each(ox.getHeaderParameters(), function (inx, cx) {
					if (cx.getName() === "x-csrf-token") {
						cx.setValue(context.token);
					}
				});
			});
			//Set the upload URL
			if (aUploadCollection._aFileUploadersForPendingUpload.length > 0) {
				var uploadUrl = context.getView().getModel("serp110ODataModel").sServiceUrl + "/AttachmentSet";
				aUploadCollection.setUploadUrl(uploadUrl);
				aUploadCollection.upload();
				context.getView().setBusy(true);
			}
		},
		
		//Action to be performed before upload starts - Add FDR Number to each file
		onBeforeUploadStarts: function (oEvent) {
			var ofileNameHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName") + "," + this.getPropInModel("localDataModel", "/fdrno") + "," + this.getPropInModel("userDetailsModel", "/name")
			});
			oEvent.getParameters().addHeaderParameter(ofileNameHeaderSlug);

		},
		//Refresh CSRF token on timeout
		refreshSecurityTokenForUpload: function () {
			var context = this;
			var fnSuccess = function (data, response) {
				context.token = response.headers['x-csrf-token'];

			};
			var fnError = function (oError) {};
			context.getView().getModel("serp110ODataModel").refreshSecurityToken(fnSuccess, fnError, true);
		},

		//No action to be performed
		onDelete: function (oEvent) {

		},
		
		//Method called whenever there is a change in the list of files to be uploaded
		onChangeDocUpload: function (oEvent) {
			var context = this;
			var selectedFiles = [];
			//Get files to be uploaded
			var aUploadCollection = this.attachmentSetFrag.getContent()[0];
			var selectedItems = aUploadCollection.getItems();
			//Refresh CSRF token
			this.refreshSecurityTokenForUpload();
			for (var k = 0; k < selectedItems.length; k++) {
				selectedFiles.push(selectedItems[k].getFileName());
			}
			var file = oEvent.getParameter("files");
			var fileName = file[0].name;
			var fileSize = file[0].size;
			//Check if file name has any special characters other than allowed ones
			if ((/^[a-zA-Z0-9-._]*$/.test(fileName)) == false) {
				MessageBox.error(
					"Filename cannot have special characters. Only allowed characters are alphabets, numbers, (-)hyphen and (_) underscore.", {
						title: "Invalid File Name"
					});
				//Remove files with special characters
				jQuery.each(fileName, function (ix, ox) {
					aUploadCollection.removeItem(selectedItems[selectedFiles.indexOf(fileName)]);
				});
				// event.stopPropogation();
			} 
			//Display error message when empty file is uploaded and remove this file from upload
			else if (fileSize == 0) {
				MessageBox.error("Cannot upload files with no content.", {
					title: "Empty File"
				});
				jQuery.each(fileName, function (ix, ox) {
					aUploadCollection.removeItem(selectedItems[selectedFiles.indexOf(fileName)]);
				});
			} 
			//If same file exists multiple times, display error message and remove the duplicate files
			else {
				if (jQuery.inArray(fileName, selectedFiles) !== -1) {
					MessageBox.error("File " + fileName + " already exists", {
						icon: MessageBox.Icon.ERROR,
						title: "Error",
						onClose: function (oAction) {
							if (oAction === "CLOSE") {
								aUploadCollection.removeItem(selectedItems[selectedFiles.indexOf(fileName)]);
							}
						}
					});
				} else {
					//Set CSRF token and Content Type for valid files
					aUploadCollection.addHeaderParameter(
						new sap.m.UploadCollectionParameter({
							name: "x-csrf-token",
							value: context.token
						})
					);
					aUploadCollection.addHeaderParameter(
						new sap.m.UploadCollectionParameter({
							name: "Content-Type",
							value: file.type
						})
					);
				}
			}
		},

		/**
		 * Function to get selected attached document and its data and update the documents model.
		 * @param {oEvent} oEvent as event of selected document
		 */
		onUploadComplete: function (oEvent) {
			var context = this;
			var sErrorString = "";
			var sUploadedFile = oEvent.getParameter("files");
			var sEventUploaderID = oEvent.getParameters().getParameters().id;
			var oUploadCollection = oEvent.getSource();
			for (var i = 0; i < sUploadedFile.length; i++) {
				//Display error when status code is 400 or 403
				if (sUploadedFile[i].status === 400) {
					sErrorString += "Unable to upload file: " + sUploadedFile[i].fileName;
				} else if (sUploadedFile[i].status === 403) {
					sErrorString += "Unable to upload file: " + sUploadedFile[i].fileName;
				}
			}
			//In case of no errors, display message that file upload is successful
			if (!sErrorString) {
				MessageBox.success("File Upload Success" + " : " +
					sUploadedFile[0].fileName, {
						onClose: function () {
							//Remove files uploaded from pending status
							context.removeUploadedFiles(oUploadCollection, sEventUploaderID);
							//Update attachment list
							context.getListOfAttachment();
						}
					});
			} else {
				MessageBox.error(sErrorString, {
					onClose: function () {
						//Remove files uploaded from pending status
						context.removeUploadedFiles(oUploadCollection, sEventUploaderID);
					}
				});
			}
			context.getView().setBusy(false);
		},
		
		//Function to clear the files from pending status, to avoid getting re-uploaded on next attempt
		removeUploadedFiles: function(oUploadCollection, sEventUploaderID){
			for (var j = 0; j < oUploadCollection._aFileUploadersForPendingUpload.length; j++) {
		 		//File name
				var sPendingUploaderID = oUploadCollection._aFileUploadersForPendingUpload[j].oFileUpload.id;
				//Check if file is in pending status
				if (sPendingUploaderID.includes(sEventUploaderID)) {
					//Remove from pending status
					oUploadCollection._aFileUploadersForPendingUpload[j].destroy(); 
					oUploadCollection._aFileUploadersForPendingUpload.splice([j], 1);
				}
			}
		},
		 
		//Function triggers when file size exceed more than 10MB
		onFileSizeExceed: function (oEvent) {
			MessageBox.error("File exceeds 10MB");
		},
		
		//Get extension of file
		getFileExtension: function (filename) {
			var parts = filename.split('.');
			return parts[parts.length - 1];
		}
		//@END: Task 346718
	});
});