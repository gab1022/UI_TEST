sap.ui.define(["com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"], 
	function (UnderScoreParse) {
	return {
		//@START: Task 223652
		//Update audit log entry for every Submit/Approve/Reject action
		updateAuditLog: function(context, action) {
			var currentContext = this;
			var fdrno = context.getPropInModel("localDataModel", "/fdrno");
			var callingObject = {
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/auditlog.xsjs",
					payload: {
						TableName: "auditlog",
						data: [{
							ACTION: "C",
							fdrno: fdrno,
							personresponsible: context.getPropInModel("userDetailsModel", "/name"),
							changedon: new Date(), 
							fdrstatus: action,
							status: context.getPropInModel("localDataModel", "/fdrstatus") //@Task 247720
						}]
					},
					success: function (oMessage) {
						if (oMessage === "SUCCESS") {
							//Read from Audit Log table to update history section
							currentContext.readAuditLog(context, fdrno);
						}
						else {
							context.showMessageToast("Error in updating Audit log table");
						}
					},
					error: function (oerror) {
						context.showMessageToast("Error in updating Audit log table");
					},
					typeOfCall: "POST"
				};
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
		},
		
		//Read Audit Log table entries for the given FDR Number
		readAuditLog: function(context, fdrno) {
			context.readDataFromOdataModel({
				modelName: "fdrPlusODataModel",
				entitySet: "auditlog",
				filters: context.makeFilterArray(["fdrno"], "EQ", fdrno),
				urlParameters: {},
				success: function (oData) {
					if (oData.results.length) {
						var datas = context.addActionFlag(oData.results, "U");
						context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
							auditlog: datas
						}));
					}
				},
				error: function (oError) {
					context.showMessageToast("Error in getting the FDR History");
				}
			});
		},
		//@END: Task 223652
		
		//@START: Task 269676
		readChangeLog: function(context, fdrno) {
			context.readDataFromOdataModel({
				modelName: "fdrPlusODataModel",
				entitySet: "fdrchangelog",
				filters: context.makeFilterArray(["fdrno"], "EQ", fdrno),
				urlParameters: {},
				success: function (oData) {
					if (oData.results.length) {
						var datas = context.addActionFlag(oData.results, "U");
						context.setPropInModel("localDataModel", "/", jQuery.extend({}, context.getPropInModel("localDataModel", "/"), {
							changelog: datas
						}));
					}
				},
				error: function (oError) {
					context.showMessageToast("Error in getting the FDR Change Log");
				}
			});
		},
		//END: Task 269676
		
		//@START: Task 229719
		sendWFEmail: function(context, toRecipient, ccList) {
			var fdrstatus = context.getPropInModel("localDataModel", "/fdrstatus"); //@Task 309492
			var emailPayload =  {
				"FDRNo": context.getPropInModel("localDataModel", "/fdrno"),
				"ToRecipient": context.getPropInModel("tileIdentityModel", "/role") === "ADMIN" ? "" : toRecipient, //@Task 319428
				"Sender": "RFC_CUMULUS",
				"MailStep": context.getPropInModel("tileIdentityModel", "/role") === "ADMIN" ? "RASGN" : 
					context.getPropInModel("tileIdentityModel", "/role") === "SUPADM" ? "RERUT" : context.getPropInModel("localDataModel", "/fdrstatus"), //@Task 319428, 343532
				"FDRDesc": context.getPropInModel("localDataModel", "/fdrdescription"),
				"Consumer": context.getPropInModel("localDataModel", "/benifCompanies/0/consumer"),
				"PrComp": context.getPropInModel("localDataModel", "/providerCompanies/0/provideraoodesc"), //@Task 265132
				"RcComp": context.getPropInModel("localDataModel", "/benifCompanies/0/rcaoodesc"), //@Task 265132
				"Rejector": context.getPropInModel("userDetailsModel", "/name"),
				"PrConfirmer": context.getPropInModel("localDataModel", "/providerCompanies/0/providerconfirmer"),
				"RNA": context.getPropInModel("localDataModel", "/rnafocal") ? context.getPropInModel("localDataModel", "/rnafocal") : "",
				"Requestor": context.getPropInModel("localDataModel", "/createdby"),
				"GSRFocal": context.getPropInModel("tileIdentityModel", "/role") === "SUPADM" ? context.getPropInModel("userDetailsModel", "/name") : 
					context.getPropInModel("localDataModel", "/gsrfocal") ? context.getPropInModel("localDataModel", "/gsrfocal") : "", //@Task 343532
				"PersonResp": (fdrstatus === "RELSD" || fdrstatus === "CLOSD") ? context.getPropInModel("localDataModel", "/personresponsible") : "", //@Task 309492, 325202
				"GSRMailbox": "", //@Task 314913
				"ReturnMsg": "", 
				"EmailToRecipientSet": context.getPropInModel("tileIdentityModel", "/role") === "ADMIN" ? toRecipient : [], //@Task 319428
				"EmailCCSet": [],
				"BillableCodesSet": [] //@Task 309492
			};
			ccList.forEach(function(oRecipient) {
				emailPayload.EmailCCSet.push({"CCRecipient": oRecipient});
			});
			
			//@START: Task 309492
			//Add all billable WBS for Released and Closed FDRs
			if(fdrstatus === "RELSD" || fdrstatus === "CLOSD") {
				var provCompanies = context.getPropInModel("localDataModel", "/providerCompanies");
				provCompanies.forEach(function(o) {
					emailPayload.BillableCodesSet.push({"BillableCode": o.providercostobj});
				});
			}
			//@END: Task 309492
			
			//@START: Task 268587 - Get GSR COE Mailbox from feeder
			var provCompanyCode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
			context.readDataFromOdataModel({
				modelName: "fdrPlusFeedOdataModel",
				entitySet: "gsremail",
				filters: context.makeFilterArray(["companycode"], "EQ", provCompanyCode),
				urlParameters: {},
				success: function (oData) {
					if (oData.results.length) {
						emailPayload.GSRMailbox = oData.results[0].email; //@Task 314913
						emailPayload.EmailCCSet.push({"CCRecipient": oData.results[0].email});	
					}
					//Trigger email service
					context.getView().getModel("serp110ODataModel").create("/EmailToSet", emailPayload, {
						success: function (oData) {
							context.showMessageToast("Email sent successfully");
						},
						error: function () {
							context.showMessageToast("Something went wrong, unable to send email");
						}
					});
				},
				error: function (oError) {
					context.showMessageToast("Something went wrong, unable to send email");
				}
			});
			//@END: Task 268587 - Get GSR COE Mailbox from feeder
		},
		//@END: Task 229719
		
		//@START: Task 276794
		sendDSEmail: function(context, fdrno) {
			var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
			var emailTo = context.getPropInModel("localDataModel", "/fundingmanager") ? context.getPropInModel("localDataModel", "/fundingmanager") : "";
			var emailPayload =  {
				"FDRNo": context.getPropInModel("localDataModel", "/fdrno"),
				"ToRecipient": emailTo,
				"Sender": fdrdefaults["DSFRM"] ? fdrdefaults["DSFRM"] : "RFC_CUMULUS",
				"Creator": context.getPropInModel("localDataModel", "/updatedby"),
				"MailStep": "CRTDS",
				"ReturnMsg": "", 
				"EmailToRecipientSet": [{"ToRecipient": emailTo}],
				"EmailCCSet": [{"CCRecipient": fdrdefaults["DSPMB"]}]
			};
			//Trigger email service
			context.getView().getModel("serp110ODataModel").create("/EmailToSet", emailPayload, {
				success: function (oData) {
					context.showMessageToast("Email sent successfully");
				},
				error: function () {
					context.showMessageToast("Something went wrong, unable to send email");
				}
			});
		},
		//@END: Task 276794
		
		//@START: Task 280675
		activeDirectorySearchSERP: function(context, aFilters) {
			return new Promise(function (resolve, reject) {
				var modelValues = {
					modelName: "serp110ODataModel",
					entitySet: "ActiveDirectorySearchSet",
					filters: aFilters,
					urlParameters: "",
					success: function (oData) {
						resolve(oData.results);
					},
					error: function(oerror) {
						reject("Error in getting User details from Active Directory");
					}
				};
				context.readDataFromOdataModel(modelValues, true);
			});
		},
		//Search from Active Directory
		activeDirectorySearch: function(context, searchQuery) {
			var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
			var apikey = fdrdefaults["APIKY"] ? fdrdefaults["APIKY"] : "crLtKPvXf2RKTMlB2gFXnbrAuq3vpuy5"; 
			return new Promise(function (resolve, reject) {
				var callingObject = {
					url: "/GF_CUMULUS_AD_SRCH_API/searchUserDetails?apiKey=" + apikey + "&"+searchQuery,
					payload: "",
					success: function (oData) {
						resolve(oData);
					},
					error: function (oerror) {
						reject("Error in getting User details from Active Directory");
					},
					typeOfCall: "GET"
				};
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
			});
		}
		//@END: Task 280675
	};
});