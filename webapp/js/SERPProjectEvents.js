sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/controller/BaseController"
], function (MessageBox, MessageToast, Fragment, JSONModel, UnderScoreParse, BaseController) {
	"use strict";
	return {
		onCreateProjectDialog: function (context, oProviderData) {
			this.getView = function () {
				return context.getView();
			};
			oProviderData.ACTION = oProviderData.projectdef ? "U" : "C";
			//@START: Task 391850
			oProviderData.onlyproject = context.getPropInModel("localDataModel", "/onlyproject"); 
			var fdrdefaults = context.getPropInModel("localDataModel", "/fdrdefaults");
			oProviderData.depthLevel = fdrdefaults && fdrdefaults["DPLVL"] ? fdrdefaults["DPLVL"] : "5";
			//@END: Task 391850
			//Opens the dialog for creating project
			if (!this._oCreateProjectPopover) {
				this._oCreateProjectPopover = sap.ui.xmlfragment("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.serpprojectfrags.Project",
					this);
				this.getView().addDependent(this._oCreateProjectPopover);
			}

			//Initiate creation of project
			this.initiateProjectCreation(oProviderData, context);
		},

		//Closes the Project Creation dialog
		onCloseProjectDialog: function (oEvent) {
			if (this._oCreateProjectPopover) {
				this._oCreateProjectPopover.close();
			}
		},

		//Initial setup for Project Creation
		initiateProjectCreation: function (oProviderData, context) {
			//Turn on Busy indicator
			sap.ui.core.BusyIndicator.show(0);
			
			//Local tree structure object
			this.oProjectHierarchy = {};

			//Create local models
			this._createLocalModels(oProviderData);

			//load initial values for Simple Project
			if(oProviderData.onlyproject !== "N") { //@Task 390769
				this._populateFormValues();
				
				//Get Project and WBS list from SERP/SCP
				this._getProjectWBSList(true); //true - set Busy indicator in function
			//@START: Task 390769
			}
			else {
				//Complex project
				var wbsDefinition = oProviderData.providerwbs.replaceAll("/", "");
				this._getProjectFromSerp(wbsDefinition, "U", true, oProviderData);
			}
			//@END: Task 390769
			
			this.nodeCount = 0; //For correct tree node selection
		},

		//For creating Level 1, 2 and 3 WBS
		onAddWBS: function (oEvent) {
			this.deleteL3Name = "";
			//Provider data
			var oProviderData = this.getView().getModel("providerModel").getData();
			//Get selected Project/WBS
			var oTree = sap.ui.getCore().byId("idProjectHierarchy");
			this.nodeCount = oTree.getItems().length; //For correct tree node selection
			var oFormModel = this.getView().getModel("formModel");
			var oNode = oEvent.getSource().getParent().getParent();
			if (oNode === null) {
				MessageBox.error("Select a Project/WBS");
			} else {
				//Save previously entered values
				this._saveProjectDetails();

				this.nodeCount++; //For correct tree node selection
				oTree.setSelectedItem(oNode);
				oTree.fireSelectionChange(oNode);
				var level = oNode.data().level;
				var intialdef = oFormModel.getProperty("/intialdef");

				var visibility = {
					"projectFormVisible": false,
					"levelFormVisible": true,
					"level1FormVisible": false,
					"level2FormVisible": false,
					"level3FormVisible": false
				};

				//Set action to C
				oFormModel.setProperty("/ACTION", "C");
				oFormModel.setProperty("/parentnode", intialdef);

				if (level === "H") {
					visibility.level1FormVisible = true;
					oFormModel.setProperty("/Level", "1");
					oFormModel.setProperty("/WBS", "Level 1");
					oFormModel.setProperty("/intialdef", "Level 1");
					//Level 1 related fields
					this._populateFDRFormValues(oProviderData);
				} else if (level === "1") {
					visibility.level2FormVisible = true;
					oFormModel.setProperty("/Level", "2");
					oFormModel.setProperty("/WBS", "Level 2");
					oFormModel.setProperty("/BillingElement", true);
					oFormModel.setProperty("/intialdef", "Level 2");
					//Level 2 related fields
					this._populateFDRFormValues(oProviderData);
				} else if (level === "2") {
					visibility.level3FormVisible = true;
					var levelName = this._getL3LevelName();
					oFormModel.setProperty("/Level", "3");
					oFormModel.setProperty("/WBS", levelName);
					oFormModel.setProperty("/AccountAssignment", true);
					oFormModel.setProperty("/intialdef", levelName);
					//Level 3 related fields
					this._populateFDRFormValues(oProviderData);
				}
				this.getView().getModel("visibilityModel").setData(visibility);

				//Highlight non-filled mandatory fields
				this._highlightMandatoryFields();
				
				//Save new entry to project hierarchy
				this._saveProjectDetails();
				
			}
		},
		
		//Only Level 3 WBS (beyond first element and those that have not been created in SERP) can be deleted
		onDeleteL3WBS: function(oEvent) {
			//Save previously entered values
			this._saveProjectDetails();
			
			//Get selected WBS for deletion
			var oTree = sap.ui.getCore().byId("idProjectHierarchy");
			this.nodeCount = oTree.getItems().length; //For correct tree node selection
			
			var oNode = oEvent.getSource().getParent().getParent();
			oTree.setSelectedItem(oNode);
			var oL2Node = oNode.getParentNode();
			var deleteLevel = oNode.data().intialdef;
			this.deleteL3Name = deleteLevel;
			delete this.oProjectHierarchy[deleteLevel];
			
			//Select the item to be deleted, else last element is not getting deleted
			oTree.setSelectedItem(oNode);  
			
			//To indicate one item is deleted
			this.nodeCount--;
			
			//Set selection to L2 node, else last element does not get deleted
			oTree.setSelectedItem(oL2Node);
			
			//Convert to array of values
			var aConvertedProjData = this._convertObjToArray(this.oProjectHierarchy);
			//Build Project Hierarchy
			var aProjectData = this._buildProjectHierarchy(aConvertedProjData, this.getView().getModel("providerModel").getData().onlyproject); //@Task 390771
			this.getView().getModel("projectHierarchyModel").setData(aProjectData);
			
			oTree.fireSelectionChange(oL2Node);
		},

		//Form updated on every selection in Project Hierarchy
		onSelectHierarchyItem: function (oEvent) {
			//Form model
			var oFormModel = this.getView().getModel("formModel");
			var oProviderData = this.getView().getModel("providerModel").getData();

			//Save Previously entered values
			if(oProviderData.onlyproject !== "N") { //@Task 390771
				this._saveProjectDetails();
			}

			//Get selected item
			var oSelectedItem = oEvent.getSource().getSelectedItem();
			//This is required to avoid errors on initial form load in Change mode
			if (oSelectedItem === null) {
				return;
			}
			var sPath = oSelectedItem.getBindingContext("projectHierarchyModel").getPath();
			var projectHierarchyModel = this.getView().getModel("projectHierarchyModel");
			var oItem = projectHierarchyModel.getProperty(sPath);
			var level = oSelectedItem.data().level;

			var visibility = {
				"projectFormVisible": false,
				"levelFormVisible": false,
				"level1FormVisible": false,
				"level2FormVisible": false,
				"level3FormVisible": false
			};

			//Form details based on level
			var controlId = oProviderData.onlyproject !== "N" ? "idProjectHierarchy" : "idWBSHierarchy"; //@Task 390771
			this.nodeCount = sap.ui.getCore().byId(controlId).getItems().length; //For correct tree node selection
			var oProjectData = {};
			if (oProviderData.onlyproject !== "N") { //@Task 390771
				if (level === "H") {
					visibility.projectFormVisible = true;
					oProjectData = Object.assign({}, oItem);
					oProjectData.PersonResponsible = oProviderData.workflowflag === "X" ? oProviderData.PersonResponsible : oItem.PersonResponsible;
					oProjectData.Applicant = oItem.Applicant ? oItem.Applicant : oProviderData.Applicant;
					oProjectData.Plant = oItem.Plant ? oItem.Plant : oFormModel.getProperty("/Plant");
				} else if (level === "1" || level === "2" || level === "3") {
					visibility.levelFormVisible = true;
					oProjectData = Object.assign({}, oItem);
					oProjectData.Plant = oFormModel.getProperty("/Plant");
					oProjectData.PersonResponsible = oProviderData.workflowflag === "X" ? oProviderData.PersonResponsible : oItem.PersonResponsible;
					oProjectData.ProjectType = oItem.ProjectType ? oItem.ProjectType : oFormModel.getProperty("/ProjectType");
					oProjectData.Priority = oItem.Priority ? oItem.Priority : oFormModel.getProperty("/Priority");
					oProjectData.FinanceRep = oItem.FinanceRep ? oItem.FinanceRep : oProviderData.FinanceRep;
					oProjectData.CostCenter = oItem.CostCenter ? oItem.CostCenter : oProviderData.CostCenter;
					oProjectData.ProfitCenter = oFormModel.getProperty("/ProfitCenter");
					oProjectData.FunctionalArea = oFormModel.getProperty("/FunctionalArea");
					oProjectData.PlanningElement = (oItem.PlanningElement === "X" ? true : false);
					oProjectData.BusinessReviewRequired = (oItem.BusinessReviewRequired === "Y" ? true : false);
					oProjectData.BillingMethod = oProviderData.billingmethod;
					oProjectData.BillingMethodDesc = oProviderData.billingmethoddesc;
					oProjectData.WorkDescriptionMandatory = oItem.WorkDescriptionMandatory ? oItem.WorkDescriptionMandatory : oFormModel.getProperty(
							"/WorkDescriptionMandatory");
					oProjectData.CountryofCustomer = oProviderData.CountryofCustomer;
					oProjectData.AccountAssignment = true; //always checked
					oProjectData.BlockTravelExpense = (oItem.BlockTravelExpense === "NOTX" ? true : false);
					oProjectData.BlockPOPR = (oItem.BlockPOPR === "NOCP" ? true : false);
					oProjectData.BlockTimeWriting = (oItem.BlockTimeWriting === "NOTW" ? true : false);
					oProjectData.BlockFIPosting = (oItem.BlockFIPosting === "NOFI" ? true : false);
					if (level === "1") {
						visibility.level1FormVisible = true;
					} else if (level === "2") {
						visibility.level2FormVisible = true;
						jQuery.extend(oProjectData, {
							"BillingElement": true, //Always checked
							"CostCategory": oItem.CostCategory,
							"ORPCategory": oItem.ORPCategory
						});
					} else if (level === "3") {
						visibility.level3FormVisible = true;
						jQuery.extend(oProjectData, {
							"CostCategory": oItem.CostCategory ? oItem.CostCategory : oFormModel.getProperty("/CostCategory"),
							"ORPCategory": oItem.ORPCategory ? oItem.ORPCategory : oFormModel.getProperty("/ORPCategory"),
							"timewriters": oItem.timewriter ? oItem.timewriter : oFormModel.getProperty("/timewriters") //@Task 245230
						});
					}
				}
				this.getView().getModel("visibilityModel").setData(visibility);
			}
			//@START: Task 390771
			else {
				oProjectData = Object.assign({}, oItem);
			}
			//@END: Task 390771
			
			//Form Model update
			oFormModel.setData(oProjectData);
			this.getView().setModel(oFormModel, "formModel");

			//Highlight non-filled mandatory fields
			this._highlightMandatoryFields();
		},

		//Select the correct tree node based on the scenario
		onTreeUpdate: function (oEvent) {
			var itemToSelect;
			//Select the newly added element (last element) in tree
			var controlId = this.getView().getModel("providerModel").getData().onlyproject !== "N" ? "idProjectHierarchy" : "idWBSHierarchy";
			var oTree = sap.ui.getCore().byId(controlId);
			var oSelectedItem = oTree.getSelectedItem();
			var nodeCount = oTree.getItems().length; //For correct tree node selection
			if (oSelectedItem === null) {
				itemToSelect = oTree.getItems()[0];
				oTree.setSelectedItem(itemToSelect);
				oTree.fireSelectionChange(itemToSelect);
			}
			//For correct tree node selection
			else if (this.nodeCount !== nodeCount) {
				itemToSelect = oTree.getItems()[nodeCount - 1];
				oTree.setSelectedItem(itemToSelect);
				oTree.fireSelectionChange(itemToSelect);
			}
		},

		//Called on opening Value Help Dialog
		onValueHelpOpen: function (oEvent) {
			//Open Value Help
			var fragmentName = "com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.fragments.serpprojectfrags." + oEvent.getSource().data().valHelpFragment;
			this.oValueHelp = sap.ui.xmlfragment(fragmentName, this);
			this.getView().addDependent(this.oValueHelp);
			if (fragmentName.endsWith("ProfitCenter")) {
				this._profitCenterList();
			}
			if (fragmentName.endsWith("FunctionalArea")) {
				this._functionalAreaList();
			} else if (fragmentName.endsWith("InvestmentProgramID")) {
				var approvalYear = this.getView().getModel("formModel").getProperty("/ApprovalYear");
				if (approvalYear === "") {
					MessageBox.error("Please choose Approval Year");
					return;
				}
				this._invProgramList();
			} else if (fragmentName.endsWith("InvestmentPositionID")) {
				var approvalYr = this.getView().getModel("formModel").getProperty("/ApprovalYear");
				var invProgramID = this.getView().getModel("formModel").getProperty("/InvProgram");
				if (approvalYr === "" || invProgramID === "") {
					MessageBox.error("Please choose Approval Year and Investment Program ID");
					return;
				}
				this._invPositionList();
			}
			//Open Value Help
			this.oValueHelp.open();
		},

		//Search for various entities
		onValueHelpSearch: function (oEvent) {
			var filterArray = [];
			jQuery.each(oEvent.getSource().data().filterProp.split(","), function (iy, oy) {
				filterArray.push(new sap.ui.model.Filter(oy, sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value").toUpperCase()));
				//filterArray.push(new sap.ui.model.Filter({filters: [new sap.ui.model.Filter(oy, sap.ui.model.FilterOperator.Contains, oEvent.getParameter("value"))], caseSensitive: false}));
			});
			oEvent.getSource().getBinding("items").filter([new sap.ui.model.Filter({
				filters: filterArray,
				and: false
			})]);
		},

		//Upon selecting an item in Value Help
		onValueHelpConfirm: function (oEvent) {
			var formProperty = oEvent.getSource().data().formProp;
			this.getView().getModel("formModel").setProperty("/" + formProperty, oEvent.getParameter("selectedItem").getTitle());
			if (formProperty === "InvProgram") {
				//Clear the Investment Program and Position ID fields
				var oFormModel = this.getView().getModel("formModel");
				oFormModel.setProperty("/InvProgramPosition", "");
			} else if (formProperty === "WorkDescriptionMandatory") {
				this.getView().getModel("formModel").setProperty("/" + formProperty, oEvent.getParameter("selectedItem").getTitle().charAt(3));
			}
			//Reset Value state
			this._highlightMandatoryFields();

		},

		//Triggered when Approval Year changes in Level 2 WBS
		onYearChange: function (oEvent) {
			//Clear the Investment Program and Position ID fields
			var oFormModel = this.getView().getModel("formModel");
			oFormModel.setProperty("/InvProgram", "");
			oFormModel.setProperty("/InvProgramPosition", "");
		},

		//Search for Timewriters for individual/combination of Personnel Number, User ID, First Name, Last Name
		onSearchTimewriters: function (oEvent) {
			var sPersonnelNo = this.getView().getModel("timewritingModel").getProperty("/personnelNo");
			var sUserID = this.getView().getModel("timewritingModel").getProperty("/userID");
			var sFirstName = this.getView().getModel("timewritingModel").getProperty("/firstName");
			var sLastName = this.getView().getModel("timewritingModel").getProperty("/lastName");
			//OData service for Profit Center
			var aFilters = [];
			if (sPersonnelNo === "" && sUserID === "" && sFirstName === "" && sLastName === "") {
				MessageBox.error("Please enter at least one of the following for search: Personnel Number, User ID, First Name, Last Name");
				return;
			}
			if (sPersonnelNo !== "" && isNaN(sPersonnelNo)) {
				MessageBox.error("Please enter a numeric value for Personnel Number");
				return;
			}
			if (sPersonnelNo !== "") {
				aFilters.push(new sap.ui.model.Filter("PersonNo", sap.ui.model.FilterOperator.EQ, sPersonnelNo));
			}
			if (sUserID !== "") {
				aFilters.push(new sap.ui.model.Filter("UserID", sap.ui.model.FilterOperator.EQ, sUserID));
			}
			if (sFirstName !== "") {
				aFilters.push(new sap.ui.model.Filter("FirstName", sap.ui.model.FilterOperator.EQ, sFirstName));
			}
			if (sLastName !== "") {
				aFilters.push(new sap.ui.model.Filter("LastName", sap.ui.model.FilterOperator.EQ, sLastName));
			}
			this._getListFromSerp("/PersonSet", aFilters);
		},

		//Select Timewriters to be added from the list
		onAddTimewriters: function (oEvent) {
			var aTimewriters = this.getView().getModel("formModel").getProperty("/timewriters");
			if (aTimewriters === undefined) {
				aTimewriters = [];
			}
			var oMasterDataModel = this.getView().getModel("masterDataModel");
			var aItems = oEvent.getSource().getParent().getContent()[1].getSelectedItems(); //Dialog 2nd content is table
			aItems.forEach(function (oItem) {
				var oTWItem = oMasterDataModel.getProperty(oItem.getBindingContextPath());
				var aTWs = aTimewriters.filter(function (twItem) {
					return twItem.PersonNo === oTWItem.PersonNo;
				});
				if (aTWs.length === 0) {
					aTimewriters.push({
						"PersonNo": oTWItem.PersonNo,
						"UserID": oTWItem.UserID,
						"FirstName": oTWItem.FirstName,
						"LastName": oTWItem.LastName
					});
				}
			});
			this.getView().getModel("formModel").setProperty("/timewriters", aTimewriters);

			//Clear the previous values
			var oTwModel = this.getView().getModel("timewritingModel");
			oTwModel.setData({
				"personnelNo": "",
				"userID": "",
				"firstName": "",
				"lastName": ""
			});
			oMasterDataModel.setProperty("/PersonSet", []);
		},

		//Remove timewriter(s) from the list
		onRemoveTimewriters: function (oEvent) {
			var oListItem = oEvent.getParameter("listItem");
			var sPath = oListItem.getBindingContextPath();
			var oItem = this.getView().getModel("formModel").getProperty(sPath);
			if (this.aRemTimewriters === undefined) {
				this.aRemTimewriters = [];
			}
			var aRemTWs = this.aRemTimewriters.filter(function (twItem) {
				return twItem.PersonNo === oItem.PersonNo;
			});
			//Update in global object to remove from HANA
			if (aRemTWs.length === 0) {
				this.aRemTimewriters.push({
					"PersonNo": oItem.PersonNo,
					"UserID": oItem.UserID,
					"FirstName": oItem.FirstName,
					"LastName": oItem.LastName
				});
			}

			var aTimewriters = this.getView().getModel("formModel").getData().timewriters;
			aTimewriters.splice(aTimewriters.indexOf(oItem), 1);
			this.getView().getModel("formModel").refresh();
		},

		//Close the dialog for Restricted Timewriters
		onCloseDialog: function (oEvent) {
			this.oValueHelp.close();
		},

		//Submit Project/WBS details to SERP
		onSubmitProjectWBS: function () {
			var _self = this;
			//Update entries from current form to global object (if not saved to SCP)
			this._saveProjectDetails();
			//Get project Mask
			var oProviderData = this.getView().getModel("providerModel").getData();
			var oFormData = this.getView().getModel("formModel").getData();
			var profitCenter = this.oProjectHierarchy.project.ProfitCenter;
			if (!profitCenter || profitCenter === "") {
				MessageBox.error("Please fill all mandatory fields");
				return;
			}
			//Load busy indicator before Service call
			sap.ui.core.BusyIndicator.show(0);
			//Get Project Mask for Profit Center and Provider Company Code
			this._getProjectMask(oProviderData.providercompcode, profitCenter)
				.then(function (projectMask) {
					if (projectMask === "") {
						return Promise.reject("Project Mask cannot be blank");
					}
					//Assign mask to header info
					_self.oProjectHierarchy.project.ProjectCodingKey = projectMask;
					//Convert existing data to SERP format
					var oSerpSubmitData = _self._makeSerpSubmitPayload(_self.oProjectHierarchy);
					var validationMsg = _self._checkMandatoryFields(oSerpSubmitData);
					if(validationMsg) {
						return Promise.reject(validationMsg);
					}
					//@END: Task 324764
					//Save Project in Serp
					return _self._saveProjectInSerp(_self, oSerpSubmitData, oFormData.Level, oProviderData.ACTION);
				})
				.then(function (oScpData) {
					//Save project to SCP
					if (oScpData.projectData) {
						return _self._saveProjectInSCP(oScpData);
					} else {
						return Promise.reject("Error in saving Project details in SERP");
					}
				})
				.then(function (oScpData) {
					//Turn off busy indicator
					sap.ui.core.BusyIndicator.hide();
					//Display message with Project Definition
					var sMessage = " created";
					if (oProviderData.ACTION === "U") {
						sMessage = " updated";
					}
					MessageBox.success("Project " + oScpData.projectData[0].projectdef + sMessage + " successfully");
				})
				.catch(function (errorMsg) {
					//Turn off busy indicator
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(errorMsg);
				});
		},

		//Save multiyear Budget data to SERP
		saveBudgetToSerp: function (projectdef, currency, context) {
			var aSerpBudgetData = [];
			var aBudgetData = context.getView().getModel("localDataModel").getProperty("/addlProjDetails").filter(function (e) {
				return e.code === "PLBD";
			});
			aBudgetData.forEach(function (oBudget) {
				aSerpBudgetData.push({
					"Definition": projectdef,
					"Year": oBudget.value,
					"Amount": oBudget.description,
					"Currency": currency
				});
			});
			var oSerpBudgetData = {
				"d": {
					"Action": "U",
					"Definition": projectdef,
					"return": [],
					"budget": aSerpBudgetData
				}
			};

			//Call Serp service to update budget
			var oPromise = new Promise(function (resolve, reject) {
				if (!aBudgetData.length) {
					reject("No Budget Added. Please Add Budget before Submitting");
				}
				context.getView().getModel("serpProjectCreationODataModel").create("/projectSet", oSerpBudgetData, {
					success: function (odata, oresponse) {
						//Turn off busy indicator
						sap.ui.core.BusyIndicator.hide();
						//Resolve promise
						resolve("Budget data updated in project " + projectdef);
					},
					error: function (oerror, oresponseError) {
						//Turn off busy indicator
						sap.ui.core.BusyIndicator.hide();
						//Reject promise
						reject("Error in saving Budget data");
					}
				});
			});
			return oPromise;
		},

		//For RnA check if all mandatory IM parameters are filled
		checkIMParameters: function (context, projDefinition) {
			var imAvailable = false;
			return new Promise(function (resolve, reject) {
				//Complex project
				if(context.getPropInModel("localDataModel", "/onlyproject") === "N") {
					var aComplexIMData = context.getPropInModel("localDataModel", "/addlProjDetails").filter(function(o) {
						return o.code === "IMCX" && o.deletionflag !== "X";
					});
					if(aComplexIMData.length) {
						resolve(true);
					}
					else {
						resolve(false);
					}
				}
				//Simple project
				else {
					if(projDefinition.indexOf("/") !== -1){
						projDefinition = projDefinition.replace("/","");
					}
					context.getView().getModel("serpProjectCreationODataModel").read("/projectSet('" + projDefinition + "')", {
						"urlParameters": {
							"$expand": "wbs/timewriter",
							"$format": "json"
						},
						success: function (odata, oresponse) {
							if (odata && odata.wbs && odata.wbs.results.length) {
								var wbsL2Data = odata.wbs.results.filter(function (oWbsData) {
									return oWbsData.Level.trim() === "2";
								});
								if (wbsL2Data[0].ApprovalYear && wbsL2Data[0].InvProgram && wbsL2Data[0].InvProgramPosition) {
									imAvailable = true;
								}
							}
							resolve(imAvailable);
						},
						error: function (oerror, oresponseError) {
							MessageBox.error("Error in getting Project from SERP");
							resolve(imAvailable);
						}
					});
				}
			});
		},
		
		//@START: Task 223042
		//Get Level 3 WBS from project
		getL3WBSEntries: function(context, projectdef) {
			var aL3WBS = [];
			return new Promise(function (resolve, reject) {
				if(projectdef.indexOf("/") !== -1){
					projectdef = projectdef.replace("/","");
				}
				context.getView().getModel("serpProjectCreationODataModel").read("/projectSet('" + projectdef + "')", {
					"urlParameters": {
						"$expand": "wbs/timewriter",
						"$format": "json"
					},
					success: function (odata, oresponse) {
						if (odata && odata.wbs && odata.wbs.results.length) {
							var wbsL3Data = odata.wbs.results.filter(function (oWbsData) {
								return oWbsData.Level.trim() === "3";
							});
							wbsL3Data.forEach(function(oL3WBS) {
								aL3WBS.push({
									"WBS": oL3WBS.WBS,
									"Description": oL3WBS.Description
								});
							});
						}
						resolve(aL3WBS);
					},
					error: function (oerror, oresponseError) {
						reject();
					}
				});
			});
		},
		//@END: Task 223042
		
		//@START: Task 217556
		//Upon successful engagement creation, saves the engagement number in Serp for Level 2
		saveEngagementInSerp: function(projectDef, level2Def, engagementNo, context) {
			var oSerpEngagementData = {
				d: {
					"Action": "U",
					"Definition": projectDef,
					"return": [],
					"wbs": [{
						"Action": "A",
						"Definition": projectDef,
						"EngagementNo": engagementNo,
						"Level": "2",
						"WBS": level2Def
					}]
				}
			};
			context.getView().getModel("serpProjectCreationODataModel").create("/projectSet", oSerpEngagementData, {
				success: function (odata, oresponse) {
					sap.m.MessageToast.show("Engagement details updated in project " + projectDef);
				}, error: function(oerror) {
					sap.m.MessageToast.show("Error in saving Engagement details");
				}
			});
		},
		//@END: Task 217556

		//JSON Models
		_createLocalModels: function (oProviderData) {
			//Provider Details Model
			var oProviderModel = new JSONModel(oProviderData);
			this.getView().setModel(oProviderModel, "providerModel");

			//User Details Model
			var oUserDetailsModel = new JSONModel();
			oUserDetailsModel.loadData("/services/userapi/currentUser/", false);
			this.getView().setModel(oUserDetailsModel, "userDetailsModel");

			//Project Hierarchy Model
			var projectHierarchyModel = new JSONModel([]);
			this.getView().setModel(projectHierarchyModel, "projectHierarchyModel");

			//Visibility of various controls
			var oVisibilityModel = new JSONModel();
			oVisibilityModel.setData({
				"projectFormVisible": true,
				"levelFormVisible": false,
				"level1FormVisible": false,
				"level2FormVisible": false,
				"level3FormVisible": false
			});
			this.getView().setModel(oVisibilityModel, "visibilityModel");

			//Model for F4 and dropdowns in form
			var oMasterDataModel = new JSONModel({});
			this.getView().setModel(oMasterDataModel, "masterDataModel");

			//Model for user selected values
			var oFormModel = new JSONModel({});
			this.getView().setModel(oFormModel, "formModel");

			//Model for form enablement (before Submit)
			var oFormEnabledModel = new JSONModel({
				"formEnabled": oProviderData.rnaeditable,
				"deleteMode": oProviderData.rnaeditable ? sap.m.ListMode.Delete : sap.m.ListMode.None
			});
			this.getView().setModel(oFormEnabledModel, "formEnabledModel");

			//Model for Restricted Timewriters Search fields
			var oTimewritingModel = new JSONModel({
				"personnelNo": "",
				"userID": "",
				"firstName": "",
				"lastName": ""
			});
			this.getView().setModel(oTimewritingModel, "timewritingModel");

			//Model for Mandatory/Non-mandatory for Approval Year, Inv Program and Inv Position
			if(oProviderData.onlyproject !== "N") { //@Task 391850
				var oInvMandatoryModel = new JSONModel({
					"required": false,
					"fieldGroupIds": ""
				});
				if (oProviderData.ipMandatory === "Y") {
					oInvMandatoryModel.setData({
						"required": true,
						"fieldGroupIds": "mandatoryLevel2"
					});
				}
				this.getView().setModel(oInvMandatoryModel, "invMandatoryModel");
			}
		},

		//Get project from SERP if Project Definition provided, else create empty form with Project, 1L1, 1L2 and 1L3 nodes 
		_getProjectWBSList: function (bInitial) {
			var oProviderData = this.getView().getModel("providerModel").getData();
			
			if (oProviderData.projectdef !== null && oProviderData.projectdef !== "") {
				var projDefinition = oProviderData.projectdef.replace("/", "");
				//Enable all form fields only for Non-RnA users
				this.getView().getModel("formEnabledModel").setProperty("/formEnabled", oProviderData.rnaeditable);
				this.getView().getModel("formEnabledModel").setProperty("/deleteMode", oProviderData.rnaeditable ? sap.m.ListMode.Delete : sap.m.ListMode
					.None);

				//Load busy indicator before Service call
				if (bInitial) {
					sap.ui.core.BusyIndicator.show(0);
				}
				//Get data from SERP
				this._getProjectFromSerp(projDefinition, oProviderData.ACTION, bInitial, oProviderData); //@Task 390771
			} else {
				//Enable all form fields only for Non-RnA users
				this.getView().getModel("formEnabledModel").setProperty("/formEnabled", oProviderData.rnaeditable);
				this.getView().getModel("formEnabledModel").setProperty("/deleteMode", oProviderData.rnaeditable ? sap.m.ListMode.Delete : sap.m.ListMode
					.None);
				//Create form with Project and 1 each of 3 Levels
				this._createProjectWBSForm(oProviderData);
			}
		},

		//Get Project from SERP
		_getProjectFromSerp: function (projDefinition, action, bInitial, oProviderData) { //@Task 390771
			var _self = this;
			//@START: Task 390771
			var entitySet = "/projectSet('" + projDefinition + "')"; 
			var urlParamsExpandSet = "wbs/timewriter";
			if(oProviderData.onlyproject === "N") {
				entitySet = "/WbseParentSet(WBS='" + projDefinition + "',DepthLevel='" + oProviderData.depthLevel + "')";
				urlParamsExpandSet = "WbseChildSet,WbseChildSet/RestrictedTimeWriterSet";
			}
			//@END: Task 390771
			this.getView().getModel("serpProjectCreationODataModel").read(entitySet, { //@Task 390771
				"urlParameters": {
					"$expand": urlParamsExpandSet, //@Task 390771
					"$format": "json"
				},
				success: function (odata, oresponse) {
					if ((oProviderData.onlyproject !== "N" && odata && odata.Definition) || 
						(oProviderData.onlyproject === "N" && odata.WBS)) { //@Task 390771
						_self._parseSerpProjectData(odata, action, oProviderData.onlyproject); //@Task 390771
						//Open project dialog
						_self._oCreateProjectPopover.open();
					}
					else {
						//@START: Task 390771
						if(oProviderData.onlyproject !== "N") {
							MessageBox.error("Please choose a valid Project Definition");
						}
						else {
							MessageBox.error("Please choose a valid WBS Definition with Hierarchy");
						}
						//@END: Task 390771
					}
					//Turn off busy indicator
					if (bInitial) {
						sap.ui.core.BusyIndicator.hide();
					}
				},
				error: function (oerror, oresponseError) {
					MessageBox.error("Error in getting Project from SERP");
					//Turn off busy indicator
					if (bInitial) {
						sap.ui.core.BusyIndicator.hide();
					}
				}
			});
		},
		
		//Create the following Hierarchy: Project, 1 Level1, 1 Level2 and 1 Level3 WBS
		_createProjectWBSForm: function (oProviderData) {
			var oFormModel = this.getView().getModel("formModel");
			//Create project
			oFormModel.setProperty("/Level", "H");
			oFormModel.setProperty("/parentnode", "");
			oFormModel.setProperty("/intialdef", "Project");
			oFormModel.setProperty("/ProfitCenter", oFormModel.getProperty("/ProfitCenter"));
			oFormModel.setProperty("/FunctionalArea", oFormModel.getProperty("/FunctionalArea"));
			this._saveProjectDetails();
			//Create Level1 WBS
			oFormModel.setProperty("/Level", "1");
			oFormModel.setProperty("/WBS", "Level 1");
			oFormModel.setProperty("/parentnode", "Project");
			oFormModel.setProperty("/intialdef", "Level 1");
			this._populateFDRFormValues(oProviderData);
			this._saveProjectDetails();
			//Create Level2 WBS
			oFormModel.setProperty("/Level", "2");
			oFormModel.setProperty("/WBS", "Level 2");
			oFormModel.setProperty("/BillingElement", true);
			oFormModel.setProperty("/parentnode", "Level 1");
			oFormModel.setProperty("/intialdef", "Level 2");
			this._populateFDRFormValues(oProviderData);
			this._saveProjectDetails();
			//Create Level3 WBS
			oFormModel.setProperty("/Level", "3");
			oFormModel.setProperty("/WBS", "Level 3 - 1");
			oFormModel.setProperty("/AccountAssignment", true);
			oFormModel.setProperty("/parentnode", "Level 2");
			oFormModel.setProperty("/intialdef", "Level 3 - 1");
			oFormModel.setProperty("/timewriters", []); //@Task 245230
			this._populateFDRFormValues(oProviderData);
			this._saveProjectDetails();
			
			//Open project dialog
			this._oCreateProjectPopover.open();
		},

		//Populate default form values
		_populateFormValues: function () {
			var oProviderData = this.getView().getModel("providerModel").getData();

			//Populate Plant dropdown
			this._getPlantList(oProviderData);

			//Get default values for Project Profile and Controlling Area
			this._getWBSDefaults();

			//Get Personnel numbers for User IDs passed for Applicant No, Finance Rep
			if (oProviderData.gsrfocalpoint && oProviderData.gsrfocalpoint !== "") {
				this._getPersonnelNumber(oProviderData.gsrfocalpoint, "/Applicant");
			}
			
			//@START: Task 223015
			if(oProviderData.PersonResponsible && oProviderData.PersonResponsible !== "") {
				this._getResponsibleCostCenter(oProviderData.PersonResponsible);
			}
			else if (oProviderData.fdrrequestor !== "") {
				this._getPersonnelNumber(oProviderData.fdrrequestor, "/PersonResponsible");
			}
			//@END: Task 223015

			//Get Country of Customer
			this._getCountryOfCustomer();

			//Populate values from FDR
			this._populateFDRFormValues(oProviderData);
		},

		//Get default values for Project Profile and Controlling Area from Feeder table
		_getWBSDefaults: function () {
			var _self = this;
			var oProviderModel = this.getView().getModel("providerModel");
			//OData service for WBS Defaults
			var aFilters = [new sap.ui.model.Filter("systemid", sap.ui.model.FilterOperator.EQ, "SERP"),
				new sap.ui.model.Filter("scenarioidentifier", sap.ui.model.FilterOperator.EQ, "DIR"),
				new sap.ui.model.Filter("deletionflag", sap.ui.model.FilterOperator.NE, "X")
			];
			this.getView().getModel("fdrPlusFeedOdataModel").read("/wbstableleg2", {
				filters: aFilters,
				success: function (odata, oresponse) {
					if (odata.results && odata.results.length > 0) {
						odata.results.forEach(function (oResult) {
							if (oResult.defaultkey === "PROJECT_PROFILE_DIR") {
								oProviderModel.setProperty("/projectprofile", oResult.defaultkeyvalue);
							} else if (oResult.defaultkey === "CONTROLLING_AREA") {
								oProviderModel.setProperty("/controllingarea", oResult.defaultkeyvalue);
							}
						});
					}
				},
				error: function (oerror, oresponseError) {
					_self._processErrorMessage(oerror);
				}
			});
		},

		//Populate default form values
		_populateFDRFormValues: function (oProviderData) {
			var oFormModel = this.getView().getModel("formModel");
			oFormModel.setProperty("/Description", oProviderData.fdrdescription);
			oFormModel.setProperty("/Company", oProviderData.providercompcode);
			oFormModel.setProperty("/StartDate", oProviderData.fdrstartdate);
			oFormModel.setProperty("/EndDate", oProviderData.fdrenddate);
			oFormModel.setProperty("/Partner", oProviderData.partnersoldto);
			oFormModel.setProperty("/PartnerName", oProviderData.soldtoname); //@Task 271588
			oFormModel.setProperty("/CountryofCustomer", oProviderData.CountryofCustomer);
			oFormModel.setProperty("/FinanceRep", oProviderData.Applicant);
			oFormModel.setProperty("/BillingMethod", oProviderData.billingmethod);
			oFormModel.setProperty("/BillingMethodDesc", oProviderData.billingmethoddesc);
			oFormModel.setProperty("/Profile", (oProviderData.projectprofile ? oProviderData.projectprofile : "Z003000")); //always defaulted to this value
			oFormModel.setProperty("/Definition", "Project");
			oFormModel.setProperty("/PersonResponsible", oProviderData.PersonResponsible);//@Task 223015
		},

		//F4 Value Help for Plant
		_getPlantList: function (oProviderData) {
			var _self = this;
			//OData service for Plant
			var aFilters = [new sap.ui.model.Filter("systemid", sap.ui.model.FilterOperator.EQ, "SERP"),
				new sap.ui.model.Filter("compcode", sap.ui.model.FilterOperator.EQ, oProviderData.providercompcode),
				new sap.ui.model.Filter("deletionflag", sap.ui.model.FilterOperator.NE, "X")
			];
			this.getView().getModel("fdrPlusFeedOdataModel").read("/plantdetermination", {
				filters: aFilters,
				success: function (odata, oresponse) {
					if (odata.results && odata.results.length > 0) {
						_self.getView().getModel("masterDataModel").setProperty("/plant", odata.results);
						//If there is only 1 plant, select it by default
						if (odata.results.length === 1) {
							_self.getView().getModel("formModel").setProperty("/Plant", odata.results[0].plant);
						}
					}
				},
				error: function (oerror, oresponseError) {
					_self._processErrorMessage(oerror);
				}
			});
		},

		//F4 Value Help for Profit Center
		_profitCenterList: function () {
			this.feederServiceList("profitcentre", "ProfitCenterID", "/ProfitCenterSet"); //@Task 306868
		},

		//F4 Value Help for Functional Area
		_functionalAreaList: function () {
			this.feederServiceList("functionalarea", "FunctionalArea", "/functionalAreaSet"); //@Task 306868
		},

		//Get default values from Feeder (if available), else get all values from SERP
		feederServiceList: function (feederProp, formProp, formPropSet, context) { //@Task 306868
			//@START: Task 306868
			var _self = this, oView, oProviderData; 
			if(context) {
				oView = context.getView();
				oProviderData = context.getPropInModel("localDataModel", "/");
				oProviderData.providercompcode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
				oProviderData.controllingarea = "SV01";
			}
			else {
				oView = this.getView();
				oProviderData = this.getView().getModel("providerModel").getData();
			}
			//@END: Task 306868
				
			//Check in feeder service
			this._getFeederDefaults(oView, oProviderData).then(function (results) {
					var aResults = [],
						aResultsScp = [];
					if (results && results.length > 0) {
						aResultsScp = results[0][feederProp] ? results[0][feederProp].split(",") : []; //Only 1 record per distribution channel
						aResultsScp.forEach(function (oResult) {
							var oForm = {
								"Description": ""
							};
							oForm[formProp] = oResult;
							aResults.push(oForm);
						});
					}
					if (aResults.length) {
						oView.getModel("masterDataModel").setProperty(formPropSet, aResults);
						//If only 1 value is available, select it by default
						if (aResultsScp.length === 1) {
							oView.getModel("formModel").setProperty(formProp, aResultsScp[0]);
						}
					} else {
						if (feederProp === "profitcentre") {
							_self._getProfitCenterFromSerp(oProviderData.providercompcode, oProviderData.controllingarea, oView); //@Task 306868
						} else if (feederProp === "functionalarea") {
							_self._getFunctionalAreaFromSerp(oProviderData.providercompcode, oView); //@Task 306868
						}
					}
				})
				.catch(function (oerror) {
					_self._processErrorMessage(oerror);
				});
		},

		//Check in Feeder table if there are any defaults configured for the distribution channel passed
		_getFeederDefaults: function (oView, oProviderData) {
			var currentContext = this;
			var oPromise = new Promise(function (resolve, reject) {
				var aFeederFilters = [new sap.ui.model.Filter("providersystem", sap.ui.model.FilterOperator.EQ, "SERP"),
					new sap.ui.model.Filter("functionid", sap.ui.model.FilterOperator.EQ, oProviderData.funtionid), //@Task 306868
					new sap.ui.model.Filter("serviceid", sap.ui.model.FilterOperator.EQ, oProviderData.serviceid),
					new sap.ui.model.Filter("billingroute", sap.ui.model.FilterOperator.EQ, "DIR"),
					new sap.ui.model.Filter("erpdc", sap.ui.model.FilterOperator.EQ, oProviderData.dc), //@Task 306868
					new sap.ui.model.Filter("deletionflag", sap.ui.model.FilterOperator.NE, "X")
				];
				oView.getModel("fdrPlusFeedOdataModel").read("/erpdcdetermination", {
					filters: aFeederFilters,
					success: function (odata, oresponse) {
						//@START: Task 316401
						var aDCList = currentContext.getDistributionChannel(odata.results, oProviderData.providercompcode, "UP");
						resolve(aDCList);
						//@END: Task 316401
					},
					error: function (oerror, oresponseError) {
						reject(oerror);
					}
				});
			});
			return oPromise;
		},

		//Get list of Profit centers from SERP
		_getProfitCenterFromSerp: function (providercompcode, controllingarea, oView) { //@Task 306868
			//OData service for Profit Center
			var aFilters = [new sap.ui.model.Filter("Company", sap.ui.model.FilterOperator.EQ, providercompcode),
				new sap.ui.model.Filter("ControllingArea", sap.ui.model.FilterOperator.EQ, controllingarea),
				new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "E")
			];
			this._getListFromSerp("/ProfitCenterSet", aFilters, oView); //@Task 306868
		},

		//Get list of Functional Areas from SERP
		_getFunctionalAreaFromSerp: function (providercompcode, oView) { //@Task 306868
			//OData service for Profit Center
			var aFilters = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "E")];
			this._getListFromSerp("/functionalAreaSet", aFilters);
		},

		//Generic function for getting F4 value helps from SERP
		_getListFromSerp: function (entitySet, aFilters, oView) { //@Task 306868
			sap.ui.core.BusyIndicator.show(0); //@Task 306868
			var _self = this;
			//@START: Task 306868
			if(!oView) {
				oView = _self.getView();
			}
			//@END: Task 306868
			oView.getModel("serpProjectCreationODataModel").read(entitySet, { //@Task 306868
				filters: aFilters,
				success: function (odata, oresponse) {
					if (odata.results && odata.results.length > 0) {
						if(entitySet === "/PersonSet") {
							var aUniqueRecords = UnderScoreParse.uniq(odata.results, ["PersonNo"]);
							oView.getModel("masterDataModel").setProperty(entitySet, aUniqueRecords); //@Task 306868
						}
						else {
							oView.getModel("masterDataModel").setProperty(entitySet, odata.results); //@Task 306868
						}
					}
					else {
						oView.getModel("masterDataModel").setProperty(entitySet, []); //@Task 306868
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oerror, oresponseError) {
					//@START: Task 306868
					sap.m.MessageToast.show("Error in getting the list of values");
					sap.ui.core.BusyIndicator.hide();
					//@END: Task 306868
				}
			});
		},

		//Get Personnel Number for User ID passed
		_getPersonnelNumber: function (userID, formProperty) {
			sap.ui.core.BusyIndicator.show(0);
			//OData service for Finance Rep
			var _self = this;
			var aFilters = [new sap.ui.model.Filter("UserID", sap.ui.model.FilterOperator.EQ, userID)];
			this.getView().getModel("serpProjectCreationODataModel").read("/PersonSet", {
				filters: aFilters,
				success: function (odata, oresponse) {
					if (odata.results && odata.results.length > 0) {
						_self.getView().getModel("providerModel").setProperty(formProperty, odata.results[0].PersonNo);
						_self.getView().getModel("formModel").setProperty(formProperty, odata.results[0].PersonNo);
						//@START: Task 223015
						if(formProperty === "/PersonResponsible") {
							_self._getResponsibleCostCenter(odata.results[0].PersonNo);
						}
						//@END: Task 223015
						else if(formProperty === "/Applicant") {
							_self.getView().getModel("providerModel").setProperty("/FinanceRep", odata.results[0].PersonNo);
							_self.getView().getModel("formModel").setProperty("/FinanceRep", odata.results[0].PersonNo);
						}
					}
					//sap.ui.core.BusyIndicator.hide();
				},
				error: function (oerror, oresponseError) {
					_self._processErrorMessage(oerror);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		
		//@START: Task 223015
		_getResponsibleCostCenter: function(personNo) {
			var _self = this;
			var aFilters = [new sap.ui.model.Filter("PersonNo", sap.ui.model.FilterOperator.EQ, personNo)];
			this.getView().getModel("serpProjectCreationODataModel").read("/PersonSet", {
				filters: aFilters,
				success: function (odata, oresponse) {
					if (odata.results && odata.results.length > 0) {
						_self.getView().getModel("providerModel").setProperty("/CostCenter", odata.results[0].CostCenter);
					}
					//sap.ui.core.BusyIndicator.hide();
				},
				error: function (oerror, oresponseError) {
					_self._processErrorMessage(oerror);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		//@END: Task 223015

		//F4 Value Help for Country of Customer
		_getCountryOfCustomer: function () {
			var _self = this;
			var oProviderData = this.getView().getModel("providerModel").getData();
			var partnerSoldTo = oProviderData.partnersoldto;
			if (partnerSoldTo.length < 10) {
				for (var i = (10 - partnerSoldTo.length); i > 0; i--) {
					partnerSoldTo = "0" + partnerSoldTo;
				}
			}
			//OData service for Country of Customer
			this.getView().getModel("serp110ODataModel").read("/CustomerCountrySet(Customer='" + partnerSoldTo + "')?$value", {
				success: function (odata, oresponse) {
					if (odata) {
						_self.getView().getModel("providerModel").setProperty("/CountryofCustomer", odata.Country);
					}
					sap.ui.core.BusyIndicator.hide();
					//Highlight mandatory fields - this is the last call happening on project form load
					//if(oProviderData.ACTION === "C") {
					_self._highlightMandatoryFields();
					//}
				},
				error: function (oerror, oresponseError) {
					_self._processErrorMessage(oerror);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		//F4 Value Help for Investment Program
		_invProgramList: function () {
			var approvalYear = this.getView().getModel("formModel").getProperty("/ApprovalYear");
			//OData service for Investment Program ID
			var aFilters = [new sap.ui.model.Filter("ApprovalYear", sap.ui.model.FilterOperator.EQ, approvalYear),
				new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "E")
			];
			this._getListFromSerp("/InvestmentProgramSet", aFilters);
		},

		//F4 Value Help for Investment Position
		_invPositionList: function () {
			var approvalYear = this.getView().getModel("formModel").getProperty("/ApprovalYear");
			var invProgramID = this.getView().getModel("formModel").getProperty("/InvProgram");
			//OData service for Investment Position ID
			var aFilters = [new sap.ui.model.Filter("ApprovalYear", sap.ui.model.FilterOperator.EQ, approvalYear),
				new sap.ui.model.Filter("InvProgram", sap.ui.model.FilterOperator.EQ, invProgramID),
				new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, "E")
			];
			this._getListFromSerp("/InvestmentPositionSet", aFilters);
		},

		//Project Mask which is used as prefix for Project Definition
		_getProjectMask: function (companyCode, profitCenter) {
			//OData service for Plant
			var _self = this,
				mask = "";
			var aFilters = [new sap.ui.model.Filter("profitcentre", sap.ui.model.FilterOperator.EQ, profitCenter),
				new sap.ui.model.Filter("compcode", sap.ui.model.FilterOperator.EQ, companyCode),
				new sap.ui.model.Filter("deletionflag", sap.ui.model.FilterOperator.NE, "X")
			];
			var oPromise = new Promise(function (resolve, reject) {
				_self.getView().getModel("fdrPlusFeedOdataModel").read("/projectdefmask", {
					filters: aFilters,
					success: function (odata, oresponse) {
						if (odata.results && odata.results.length > 0) {
							mask = odata.results[0].mask;
						}
						resolve(mask);
					},
					error: function (oerror, oresponseError) {
						reject("Error in getting Project Mask");
					}
				});
			});
			return oPromise;
		},

		//Convert SERP data to a format to be displayed as Hierarchy in app
		_parseSerpProjectData: function (oSerpData, action, isSimple) {
			var _self = this, aProjectData = [], oProjectData = {};
			var oProviderData = this.getView().getModel("providerModel").getData();

			//Project Details
			if(isSimple !== "N") { //@Task 390771
				Object.entries(oSerpData).forEach(function (obj) {
					if (obj[0] === "StartDate" || obj[0] === "EndDate" || typeof (obj[1]) === "string") {
						var key = obj[0];
						oProjectData[key] = obj[1];
					}
				});
				//Additional properties for UI Display
				jQuery.extend(oProjectData, {
					"Action": action,
					"parentnode": "",
					"intialdef": oSerpData.Definition,
					"Level": "H",
					"PersonResponsible": oProviderData.workflowflag === "X" ? oProviderData.PersonResponsible : oSerpData.PersonResponsible  //@Bug 252083
				});
				aProjectData.push(oProjectData);
				//Store in global object
				this.oProjectHierarchy.project = oProjectData;
			//@START: Task 390771
			}
			//Complex
			else {
				//Additional properties for UI Display
				jQuery.extend(oProjectData, {
					"Action": "U",
					"parentnode": "",
					"intialdef": oSerpData.WBS,
					"Description": oSerpData.Description,
					"Level": oSerpData.Level.trim(),
					"PersonResponsible": oSerpData.PersonResponsible,
					"CostCenter": oSerpData.CostCenter,
					"BillingElement": oSerpData.BillingElement,
					"AccountAssignment": oSerpData.AccountAssignment
				});
				aProjectData.push(oProjectData);
				//Store in global object
				this.oProjectHierarchy.project = oProjectData;
			}
			//@END: Task 390771

			//WBS Details
			var aWbsData = isSimple === "N" ? oSerpData.WbseChildSet.results : oSerpData.wbs.results; //@Task 390771
			aWbsData.forEach(function (wbs) {
				var level = wbs.Level.trim();
				var intialdef = wbs.WBS;
				oProjectData = wbs;
				//Convert Date to valid format
				//@START: Task 390771
				if(isSimple !== "N") { 
					oProjectData.StartDate = _self._convertToValidDate(oProjectData.StartDate);
					oProjectData.EndDate = _self._convertToValidDate(oProjectData.EndDate);
					oProjectData.ApprovalYear = (wbs.ApprovalYear === "0000") ? "" : wbs.ApprovalYear;
					oProjectData.BillingMethodDesc = oProviderData.billingmethoddesc;
				}
				//@END: Task 390771
				
				//Additional properties for UI Display
				jQuery.extend(oProjectData, {
					"Action": action,
					"parentnode": isSimple === "N" ? oProjectData.ParentWbse : _self._getParentNodeFromSerpData(level, oSerpData, aWbsData, oProjectData),
					"intialdef": intialdef,
					"Level": level,
					"timewriter": isSimple === "N" ? wbs.RestrictedTimeWriterSet.results : wbs.timewriter.results //@Task 245230
				});
				aProjectData.push(oProjectData);

				//Store in global object
				_self.oProjectHierarchy[intialdef] = oProjectData;
			});

			//Build Project Hierarchy
			var aProjHierarchy = this._buildProjectHierarchy(aProjectData, isSimple); //@Task 390771
			this.getView().getModel("projectHierarchyModel").setData(aProjHierarchy);
			//@CHECK
			//@START: Task 390771
			var controlId = isSimple !== "N" ? "idProjectHierarchy" : "idWBSHierarchy";
			this.nodeCount = sap.ui.getCore().byId(controlId).getItems().length; //For correct tree node selection
			//@END: Task 390771
		},
		
		//Determine the parent node for forming the hierarchy
		_getParentNodeFromSerpData: function (level, oSerpData, aWbsData, oProjectData) {
			//Parent node based on different levels
			if (level === "1") {
				jQuery.extend(oProjectData, {
					"parentnode": oSerpData.Definition
				});
			} else if (level === "2") {
				jQuery.extend(oProjectData, {
					"parentnode": aWbsData[0].WBS
				});
			} else if (level === "3") {
				jQuery.extend(oProjectData, {
					"parentnode": aWbsData[1].WBS
				});
			}
		},

		//Build project hierarchy structure
		_buildProjectHierarchy: function (inputData, isSimple) {
			//Convert to nested structure
			var nodes = {},
				roots = [];
			//Identify all the nodes with children
			for (var i = 0; i < inputData.length; i++) {
				var item = inputData[i];
				item.deleteWBSVisible = false;//Hide 'Delete WBS' button by default
				var p = item.parentnode;
				if ((isSimple === "N" && i === 0) || (isSimple !== "N" && item.Level === "H")) { //@Task 390771
					roots.push(item);
				}
				//WBS Level nodes
				else {
					var target = (nodes[p] || (nodes[p] = []));
					if (item.Level === "3") {
						item.addWBSVisible = false; //Hide 'Add WBS' button
						//Add 'Delete WBS' button for L3 nodes - only when the level is not already stored in SERP
						if(item.WBS.startsWith("Level 3 - ") && item.WBS !== "Level 3 - 1") {
							item.deleteWBSVisible = true;
						}
					}
					target.push(item);
				}
			}

			//Recursive function to add children to parent node
			var findChildren = function (prntNode) {
				if (prntNode && nodes[prntNode.intialdef]) {
					prntNode.nodes = nodes[prntNode.intialdef];
					for (var y = 0; y < prntNode.nodes.length; y++) {
						findChildren(prntNode.nodes[y]);
					}
				}
			};
			//Call to recursive function
			findChildren(roots[0]);

			//Hide 'Add WBS' button where applicable - Simple project
			if (isSimple !== "N" && roots[0] && roots[0].nodes && roots[0].nodes.length > 0) { //@Task 390771
				roots[0].addWBSVisible = false; //If Level1 WBS is available, disable add button at Project level
				var level1Node = roots[0].nodes[0];
				if (level1Node.nodes && level1Node.nodes.length > 0) {
					level1Node.addWBSVisible = false; //If Level2 WBS is available, disable add button at Level1 level
					//Hide Level 3 WBS addition for RnA focal or when Project is Released status//@Task 232398
					var level2Node = level1Node.nodes[0];
					var oProviderData = this.getView().getModel("providerModel").getData();
					var fdrstatus = this.getView().getModel("localDataModel").getProperty("/fdrstatus");//@Task 232398
					if (!oProviderData.rnaeditable || fdrstatus === "RELSD") {//@Task 232398
						level2Node.addWBSVisible = false;
						//Hide Delete button for L3 nodes
						var aLevel3Node = level2Node.nodes;
						aLevel3Node.forEach(function(oL3Node) {
							oL3Node.deleteWBSVisible = false;
						});
					}
				}
			}
			return roots;
		},

		//Highlight non-filled mandatory fields and reset highlighting if filled
		_highlightMandatoryFields: function (oSerpSubmitData) {
			var aControls = [];
			//All mandatory controls
			var level = this.getView().getModel("formModel").getProperty("/Level");
			if (level === "H") {
				aControls = this.getView().getControlsByFieldGroupId("mandatoryProject");
			} else if (level === "1" || level === "2" || level === "3") {
				aControls = this.getView().getControlsByFieldGroupId("mandatoryLevel");
				if (level === "2") {
					var aL2Controls = this.getView().getControlsByFieldGroupId("mandatoryLevel2");
					aControls = aControls.concat(aL2Controls);
				}
			}
			//Check if they are filled
			aControls.forEach(function (oControl) {
				if ((oControl.getMetadata().getName() === "sap.m.Input" && oControl.getValue() === "") || (oControl.getMetadata().getName() ===
						"sap.m.Select" && oControl.getSelectedItem() === null) || (oControl.getMetadata().getName() === "sap.m.MultiComboBox" &&
						oControl.getSelectedItems().length === 0)) {
					//do validation
					oControl.setValueState("Error");
					oControl.setValueStateText("Required Field");
				}
				if ((oControl.getMetadata().getName() === "sap.m.Input" && oControl.getValue() !== "") || (oControl.getMetadata().getName() ===
						"sap.m.Select" && oControl.getSelectedItem() !== null) || (oControl.getMetadata().getName() === "sap.m.MultiComboBox" &&
						oControl.getSelectedItems().length > 0)) {
					//do validation
					oControl.setValueState("None");
					oControl.setValueStateText("");
				}
			});
		},

		//Check if all mandatory fields are filled before Submit to SERP
		_checkMandatoryFields: function (oSerpSubmitData) {
			var bValidated = true, bMsgLengthCheck = true, validationMsg = ""; //@Task 324764
			//Mandatory fields
			var serpMandatoryFields = this.getView().getModel("mandateFieldsLocalModel").getProperty("/DIRSERP");
			var oProviderData = this.getView().getModel("providerModel").getData();
			//Mandatory fields for Project
			var projFields = serpMandatoryFields.project;
			projFields.forEach(function (oField) {
				if (!oSerpSubmitData.d[oField] || oSerpSubmitData.d[oField] === "") {
					bValidated = false;
				}
			});
			//@START: Task 324764
			if(oSerpSubmitData.d.Description && oSerpSubmitData.d.Description.length > 40) {
				bMsgLengthCheck = false;
			}
			//@END: Task 324764
			//Mandatory fields for WBS Levels
			var wbsFields = serpMandatoryFields.wbs;
			var wbsL2Fields = serpMandatoryFields.level2;
			var aWbsData = oSerpSubmitData.d.wbs;
			aWbsData.forEach(function (oWbs) {
				wbsFields.forEach(function (oField) {
					if (!oWbs[oField] || oWbs[oField] === "") {
						bValidated = false;
					}
				});
				if (oProviderData.ipMandatory === "Y" && oWbs.Level === "2") {
					wbsL2Fields.forEach(function (oFieldL2) {
						if (!oWbs[oFieldL2] || oWbs[oFieldL2] === "") {
							bValidated = false;
						}
					});
				}
				//@START: Task 324764
				if(oWbs.Description && oWbs.Description.length > 40) {
					bMsgLengthCheck = false;
				}
				//@END: Task 324764
			});
			//@START: Task 324764
			//return bValidated;
			if(!bValidated) {
				validationMsg = "Please enter all mandatory fields";
			}
			//Check if description more than 40 characters
			else if(!bMsgLengthCheck){
				validationMsg = "Please limit Project Description/WBS Level Name to 40 characters";
			}
			return validationMsg;
			//@END: Task 324764
			
		},

		//Append the Project/WBS details to local hierarchy model
		_saveProjectDetails: function () {
			var _self = this,
				oProjectData = {};
			var oProviderData = this.getView().getModel("providerModel").getData();
			var oFormData = this.getView().getModel("formModel").getData();
			var level = oFormData.Level;
			if (level === "H") {
				oProjectData = {
					"Action": oProviderData.ACTION,
					"Applicant": oFormData.Applicant,
					"Company": oProviderData.providercompcode,
					"ControllingArea": oProviderData.controllingarea ? oProviderData.controllingarea : "SV01", //always hardcoded to SV01
					"Definition": oFormData.Definition ? oFormData.Definition : "Project",
					"Description": oFormData.Description,
					"EndDate": oProviderData.fdrenddate,
					"FunctionalArea": oFormData.FunctionalArea,
					"Level": level,
					"LongText": oFormData.LongText,
					"Partner": oFormData.Partner,
					"PartnerName": oFormData.PartnerName, //@Task 271588
					"PersonResponsible": oFormData.PersonResponsible,
					"Plant": oFormData.Plant,
					"Profile": oProviderData.projectprofile ? oProviderData.projectprofile : "Z003000", //always hardcoded to Z003000
					"ProfitCenter": oFormData.ProfitCenter,
					"ProjectCodingKey": "",
					"StartDate": oProviderData.fdrstartdate,
					"parentnode": "", //for Project it is always empty
					"intialdef": oFormData.Definition ? oFormData.Definition : "Project"
				};
				this.oProjectHierarchy.project = oProjectData;
			} else if (level === "1" || level === "2" || level === "3") {
				var intialdef = oFormData.intialdef;
				if(this.deleteL3Name && this.deleteL3Name === intialdef) {
					return;
				}
				var action = oProviderData.ACTION;
				//Update mandatory fields if filled in either Level 1 or 2
				if (action === "C") {
					var aMandatoryFields = ["CountryofCustomer", "FinanceRep", "FunctionalArea", "ProfitCenter", "ProjectType", "Priority",
						"CostCenter", "WorkDescriptionMandatory"
					];
					aMandatoryFields.forEach(function (oField) {
						if (level === "1" || level === "2") {
							if (level === "1") {
								if (_self.oProjectHierarchy["Level 2"] && !_self.oProjectHierarchy["Level 2"][oField]) {
									_self.oProjectHierarchy["Level 2"][oField] = oFormData[oField];
								}
							}
							Object.entries(_self.oProjectHierarchy).forEach(function (oEntry) {
								if (oEntry[0].startsWith("Level 3 - ")) {
									if (!oEntry[1][oField]) {
										oEntry[1][oField] = _self.oProjectHierarchy["Level 2"][oField];
									}
								}
							});
						}
					});
				}
				if (level === "3") {
					action = intialdef.startsWith("Level 3 - ") ? "C" : oProviderData.ACTION; //In case of new WBS Level 3 - it is C, else whatever is passed from FDR
					//Set updated timewriter data
					oProviderData.timewriters = oFormData.timewriters;
				}

				oProjectData = {
					"AccountAssignment": (level === "3" ? "X" : ""), //always checked for Level 3
					"Action": action,
					"ApprovalYear": (level === "2" ? oFormData.ApprovalYear : ""),
					"BillingElement": (level === "2" ? "X" : ""), //hardcoded to "X" for Level 2 only
					"BillingMethod": oFormData.BillingMethod,
					"BlockFIPosting": oFormData.BlockFIPosting ? "NOFI" : "",
					"BlockPOPR": oFormData.BlockPOPR ? "NOCP" : "",
					"BlockTimeWriting": oFormData.BlockTimeWriting ? "NOTW" : "",
					"BlockTravelExpense": oFormData.BlockTravelExpense ? "NOTX" : "",
					"BusinessReviewRequired": oFormData.BusinessReviewRequired ? "Y" : "N",
					"Company": oProviderData.providercompcode,
					"ControllingArea": oProviderData.controllingarea ? oProviderData.controllingarea : "SV01", //always hardcoded to SV01
					"CostCategory": oFormData.CostCategory ? oFormData.CostCategory : "",
					"CostCenter": oFormData.CostCenter,
					"CountryofCustomer": oFormData.CountryofCustomer,
					"Definition": oFormData.Definition,
					"Description": oFormData.Description ? oFormData.Description : "",
					"EndDate": oProviderData.fdrenddate,
					"EngagementNo": oFormData.engagementno ? oFormData.engagementno : "",//@Task 217556
					"FinanceRep": oFormData.FinanceRep,
					"FunctionalArea": oFormData.FunctionalArea,
					"InvProgram": (level === "2" ? oFormData.InvProgram : ""),
					"InvProgramPosition": (level === "2" ? oFormData.InvProgramPosition : ""),
					"Level": level,
					"ORPCategory": oFormData.ORPCategory ? oFormData.ORPCategory : "",
					"Partner": oFormData.Partner,
					"PartnerName": oFormData.PartnerName, //@Task 271588
					"PlanningElement": oFormData.PlanningElement ? "X" : "",
					"Priority": oFormData.Priority,
					"ProfitCenter": oFormData.ProfitCenter,
					"ProjectID": oFormData.ProjectID ? oFormData.ProjectID : "",
					"ProjectType": oFormData.ProjectType,
					"StartDate": oProviderData.fdrstartdate,
					"WBS": intialdef,
					"WorkDescriptionMandatory": oFormData.WorkDescriptionMandatory,
					"parentnode": oFormData.parentnode,
					"intialdef": intialdef,
					"timewriter": oFormData.timewriters ? oFormData.timewriters : []
				};
				this.oProjectHierarchy[intialdef] = oProjectData;
			}
			
			//Convert to array of values
			var aConvertedProjData = this._convertObjToArray(this.oProjectHierarchy);
			//Build Project Hierarchy
			var aProjectData = this._buildProjectHierarchy(aConvertedProjData, oProviderData.onlyproject); //@Task 390771
			//Get Project Hierarchy Model and set the updated tree structure to it
			var oProjectHierarchyModel = this.getView().getModel("projectHierarchyModel");
			oProjectHierarchyModel.setData(aProjectData);
		},

		//Make payload for submission to SERP
		_makeSerpSubmitPayload: function (oProjWBSData) {
			var _self = this,
				profitCenter = "",
				functionalArea = "",
				projectDefn = "";
			var oSerpSubmitData = {
				"d": {
					"wbs": [],
					"return": []
				}
			};
			//Clone the project data so that original object is unaffected
			var oProjectWBSData = JSON.parse(JSON.stringify(oProjWBSData));
			//Loop through and make the payload
			Object.entries(oProjectWBSData).forEach(function (obj) {
				var key = obj[0];
				if (key === "project") {
					var oProjectData = obj[1];
					//Remove unwanted properties from SERP Payload
					delete oProjectData.addWBSVisible;
					delete oProjectData.deleteWBSVisible;
					delete oProjectData.Level; //Not required at Project Level
					delete oProjectData.intialdef;
					delete oProjectData.nodes;
					delete oProjectData.parentnode;
					//Change structure to suit SERP Payload format
					Object.entries(oProjectData).forEach(function (oProject) {
						var projectKey = oProject[0];
						if (projectKey === "StartDate" || projectKey === "EndDate") {
							oSerpSubmitData.d[projectKey] = _self._convertToJsonDate(oProject[1]);
						} else {
							oSerpSubmitData.d[projectKey] = oProject[1];
						}
					});
					//Project Definition, Profit Center, Functional Area to be populated at WBS Level
					projectDefn = oProjectData.Definition;
					profitCenter = oProjectData.ProfitCenter;
					functionalArea = oProjectData.FunctionalArea;

					//For new project, Definition is blank
					if (oSerpSubmitData.d.Action === "C") {
						oSerpSubmitData.d.Definition = "";
					}
				} else {
					var oWbsData = obj[1];
					//Remove unwanted properties from SERP Payload
					delete oWbsData.addWBSVisible;
					delete oWbsData.deleteWBSVisible;
					delete oWbsData.BillingMethodDesc;
					delete oWbsData.intialdef;
					delete oWbsData.nodes;
					delete oWbsData.parentnode;
					//For new project, Definition and WBS are blank
					if (oSerpSubmitData.d.Action === "C") {
						oWbsData.Definition = "";
						oWbsData.WBS = "";
					}
					//Change structure to suit SERP Payload format
					oWbsData.Definition = projectDefn;
					oWbsData.StartDate = _self._convertToJsonDate(oWbsData.StartDate);
					oWbsData.EndDate = _self._convertToJsonDate(oWbsData.EndDate);
					oWbsData.ProfitCenter = profitCenter;
					oWbsData.FunctionalArea = functionalArea;
					//Timewriter info
					var aTwData = [];
					oWbsData.timewriter.forEach(function (oTimewriter) {
						aTwData.push({
							"PersonNo": oTimewriter.PersonNo,
							"UserID": oTimewriter.UserID,
							"FirstName": oTimewriter.FirstName,
							"LastName": oTimewriter.LastName//,
							//"DelFlag": ""
						});
					});
					oWbsData.timewriter = aTwData;
					oSerpSubmitData.d.wbs.push(oWbsData);
				}
			});
			return oSerpSubmitData;
		},

		//Create/Update Project and WBS details in SERP
		_saveProjectInSerp: function (_self, oSerpSubmitData, level, action) {
			var oPromise = new Promise(function (resolve, reject) {
				_self.getView().getModel("serpProjectCreationODataModel").create("/projectSet", oSerpSubmitData, {
					success: function (odata, oresponse) {
						var oScpData = {};
						if (odata.return && odata.return.results && odata.return.results.length > 0) {
							//Process error messages
							var eMessages = odata.return.results.filter(function (msg) {
								return msg.Type === "E";
							});
							if (eMessages.length > 0) {
								var eMessage = _self._processSerpMessages(eMessages);
								reject(eMessage);
							}
						}
						//Process further if no error messages
						//Project and WBS Definitions returned from SERP
						var oProjectWBSDef = {
							"Project": odata.Definition,
							"1": odata.wbs.results[0].WBS,
							"2": odata.wbs.results[1].WBS
						};
						//Level 3 elements
						for (var i = 2; i < odata.wbs.results.length; i++) {
							oProjectWBSDef[i + 1] = odata.wbs.results[i].WBS;
						}
						//Update the tree and form values - This is required because after submission select event is not fired
						_self.getView().getModel("providerModel").setProperty("/projectdef", oProjectWBSDef.Project);
						_self.getView().getModel("formModel").setProperty("/Definition", oProjectWBSDef.Project);
						//var oSelectedItem = sap.ui.getCore().byId("idProjectHierarchy").getSelectedItem();
						var wbsLevel = 0,
							prevIntialDef = _self.getView().getModel("formModel").getProperty("/intialdef");
						if (prevIntialDef.includes("Level ")) {
							wbsLevel = parseInt(prevIntialDef.charAt(prevIntialDef.length - 1), 0);
							if (prevIntialDef.includes("Level 3 - ")) {
								wbsLevel += 2; //3 - 1, 3 - 2, etc
								//Set parent node only for Level 3 - this resolves the defect that if multiple L3 is created, and if selection changes after Submit, all L3 nodes except first disappear
								_self.getView().getModel("formModel").setProperty("/parentnode", oProjectWBSDef["2"]);
							}
							_self.getView().getModel("formModel").setProperty("/WBS", oProjectWBSDef[wbsLevel]);
							_self.getView().getModel("formModel").setProperty("/intialdef", oProjectWBSDef[wbsLevel]);
						} else {
							_self.getView().getModel("formModel").setProperty("/WBS", prevIntialDef);
							_self.getView().getModel("formModel").setProperty("/intialdef", prevIntialDef);
						}

						//Get latest data from SERP to refresh the hierarchy
						_self.oProjectHierarchy = {};
						//Set action to Update
						_self.getView().getModel("providerModel").setProperty("/ACTION", "U");
						_self._getProjectWBSList(false); //false - dont set Busy indicator in function

						//Make SCP payload
						oScpData = _self._makeScpPayload(odata);
						//update FDR Model 
						if (oProjectWBSDef["2"]) {
							_self.getView().getModel("localDataModel").setProperty(_self.getView().getModel("providerModel").getProperty("/providerPath") +
								"prprftcenter", odata.ProfitCenter ? odata.ProfitCenter : "");
							_self.getView().getModel("localDataModel").setProperty(_self.getView().getModel("providerModel").getProperty("/providerPath") +
								"projectdef", oProjectWBSDef.Project);
							_self.getView().getModel("localDataModel").setProperty(_self.getView().getModel("providerModel").getProperty("/providerPath") +
								"providercosttyp", "WBS");
							_self.getView().getModel("localDataModel").setProperty(_self.getView().getModel("providerModel").getProperty("/providerPath") +
								"providercostobj", oProjectWBSDef["2"]);
						}

						//Process success messages
						if (odata.return && odata.return.results && odata.return.results.length > 0) {
							var sMessages = odata.return.results.filter(function (msg) {
								return msg.Type === "S";
							});
							oScpData.sMessages = sMessages;
							/*if(sMessages.length > 0) {
								oScpData.sMessages = sMessages;
							}*/
						}
						resolve(oScpData);
					},
					error: function (oerror, oresponseError) {
						//Turn off busy indicator
						sap.ui.core.BusyIndicator.hide();
						reject(oerror.responseText);
					}
				});
			});
			return oPromise;
		},

		//Process messages from SERP
		_processSerpMessages: function (aMessages) {
			var message = "";
			aMessages.forEach(function (msg, i) {
				if (i !== 0) {
					message += "\n";
				}
				message += msg.Message;
			});
			return message;
		},

		//Make SCP payload 
		_makeScpPayload: function (oSerpData) {
			var _self = this,
				aProjectData = [],
				aTimewriters = [],
				count = 1;
			var oProviderData = this.getView().getModel("providerModel").getData();
			var userName = this.getView().getModel("userDetailsModel").getProperty("/name");
			var currentDate = new Date();
			var oProjectData = {
				"fdrno": oProviderData.fdrno,
				"compcode": oProviderData.providercompcode,
				"provideritemno": oProviderData.provideritemno,
				"projectitemno": "" + count,
				"level": "H",
				"intialdef": oSerpData.Definition,
				"parentnode": "",
				"systemflag": "S",
				"projectdef": oSerpData.Definition,
				"definition": oSerpData.Definition,
				"projectdesc": oSerpData.Description,
				"projectstartdate": this._convertToValidDate(oSerpData.StartDate),
				"projectenddate": this._convertToValidDate(oSerpData.EndDate),
				"persresponsibleno": oSerpData.PersonResponsible,
				"applicantno": oSerpData.Applicant,
				"projectprofile": oSerpData.Profile,
				"partnersoldto": oSerpData.Partner,
				"soldtoname": oSerpData.PartnerName, //@Task 271588
				"plant": oSerpData.Plant,
				"profitcenter": oSerpData.ProfitCenter,
				"functionalarea": oSerpData.FunctionalArea,
				"longtext": oSerpData.LongText,
				//Additional fields
				"approvalyear": "",
				"projectid": "",
				"wbscostcategory": "",
				"wbsorpcategory": "",
				"leveldef": "",
				"levelname": "",
				"planningelement": "",
				"workstartdate": "",
				"workenddate": "",
				"projtype": "",
				"coarea": "",
				"companycode": "",
				"priority": "",
				"respcostcntr": "",
				"businessreviewrequired": "",
				"billingmethod": "",
				"workdescriptionmandatory": "",
				"countryofcustomer": "",
				"financerep": "",
				"engagementno": "",
				"billingelement": "",
				"investmentprogramid": "",
				"investmentpositionid": "",
				"accountassignment": "",
				"blocktimewriting": "",
				"blocktravelexpense": "",
				"blockfiposting": "",
				"blockpo": "",
				"projectcategory": "",
				"planningprofile": "",
				"objectclass": "",
				"currency": "",
				"taxjur": "",
				"fieldkey": "",
				"ctrreference": "",
				"budgetprofile": "",
				"restrictedtw": "",
				"factorycalendar": "",
				"userstatus": "",
				"deletionflag": "N",
				"createdby": userName,
				"createdon": currentDate,
				"updatedby": userName,
				"updatedon": currentDate,
				"TableName": "fdrproject"
			};
			aProjectData.push(oProjectData);

			var aWbsData = oSerpData.wbs.results;
			aWbsData.forEach(function (wbs) {
				count++;
				var level = wbs.Level.trim();
				oProjectData = {
					"fdrno": oProviderData.fdrno,
					"compcode": oProviderData.providercompcode,
					"provideritemno": oProviderData.provideritemno,
					"projectitemno": "" + count,
					"level": level,
					"systemflag": "S",
					"leveldef": wbs.WBS,
					"definition": wbs.WBS,
					"intialdef": wbs.WBS,
					"levelname": wbs.Description,
					"projtype": wbs.ProjectType,
					"projectid": wbs.ProjectID,
					"companycode": oProviderData.providercompcode,
					"workstartdate": _self._convertToValidDate(wbs.StartDate),
					"workenddate": _self._convertToValidDate(wbs.EndDate),
					"priority": wbs.Priority,
					"financerep": wbs.FinanceRep,
					"engagementno": wbs.EngagementNo,//@Task 217556
					"respcostcntr": wbs.CostCenter,
					"profitcenter": wbs.ProfitCenter,
					"functionalarea": wbs.FunctionalArea,
					"partnersoldto": wbs.Partner,
					"soldtoname": wbs.PartnerName, //@Task 271588
					"businessreviewrequired": wbs.BusinessReviewRequired,
					"billingmethod": oProviderData.billingmethod,
					"workdescriptionmandatory": wbs.WorkDescriptionMandatory,
					"countryofcustomer": wbs.CountryofCustomer,
					"investmentprogramid": wbs.InvProgram,
					"investmentpositionid": wbs.InvProgramPosition,
					"approvalyear": wbs.ApprovalYear,
					"billingelement": "", //Only checked for Level 2
					"wbscostcategory": wbs.CostCategory,
					"wbsorpcategory": wbs.ORPCategory,
					"accountassignment": "X", //always checked
					"blocktravelexpense": wbs.BlockTravelExpense,
					"blockpo": wbs.BlockPOPR,
					"blocktimewriting": wbs.BlockTimeWriting,
					"blockfiposting": wbs.BlockFIPosting,
					//Additional fields
					"projectdef": "",
					"projectdesc": "",
					"planningelement": "",
					"coarea": "",
					"projectstartdate": "",
					"projectenddate": "",
					"persresponsibleno": "",
					"applicantno": "",
					"projectprofile": "",
					"plant": "",
					"longtext": "",
					"projectcategory": "",
					"planningprofile": "",
					"objectclass": "",
					"currency": "",
					"taxjur": "",
					"fieldkey": "",
					"ctrreference": "",
					"budgetprofile": "",
					"restrictedtw": "",
					"factorycalendar": "",
					"userstatus": "",
					"deletionflag": "N",
					"createdby": userName,
					"createdon": currentDate,
					"updatedby": userName,
					"updatedon": currentDate,
					"TableName": "fdrproject"
				};
				if (level === "1") {
					jQuery.extend(oProjectData, {
						"parentnode": oSerpData.Definition
					});
				} else if (level === "2") {
					jQuery.extend(oProjectData, {
						"parentnode": aWbsData[0].WBS,
						"billingelement": "X" //only checked for Level 2
					});
				} else if (level === "3") {
					jQuery.extend(oProjectData, {
						"parentnode": aWbsData[1].WBS
					});
				}
				aProjectData.push(oProjectData);

			});
			return {
				"projectData": aProjectData,
				"timewritersData": aTimewriters
			};
		},

		//After project is created in SERP, save to SCP
		_saveProjectInSCP: function (oScpData) {
			var oPromise = new Promise(function (resolve, reject) {
				$.ajax({
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/fdrupdate.xsjs",
					xhrFields: {
						withCredentials: true
					},
					contentType: "application/json;charset=utf-8",
					data: JSON.stringify(oScpData.projectData),
					dataType: "json",
					type: "POST",
					success: function (response, textStatus) {
						if (response !== "OK") {
							var errorMessage = "Error in saving the Project and WBS in SCP";
							reject(errorMessage);
						} else {
							resolve(oScpData);
						}
					},
					error: function (response, textStatus) {
						var errorMessage = "Error in saving the Project and WBS in SCP";
						reject(errorMessage);
					}
				});
			});
			return oPromise;
		},

		//Error message to be displayed
		_processErrorMessage: function (oerror) {
			if (oerror.responseText && oerror.message) {
				MessageBox.error(oerror.responseText, "Error", oerror.message);
			} else {
				MessageBox.error(oerror);
			}
		},

		//Get the Level name for newly added L3 node
		_getL3LevelName: function () {
			var count = 0, aLocalL3Nodes = [];
			var l3Nodes = this.getView().getModel("projectHierarchyModel").getData()[0].nodes[0].nodes[0].nodes;
			//Get the number of nodes
			if (l3Nodes && l3Nodes.length > 0) {
				count = l3Nodes.length + 1;
			}
			//Construct Level name
			var levelName = "Level 3 - " + count;
			//Get all nodes with "Level 3 - " type
			l3Nodes.forEach(function(oL3Node) {
				if(oL3Node.WBS.startsWith("Level 3 - ")) {
					var l3Name = oL3Node.WBS.substring(10, oL3Node.WBS.length);//10 --> 'Level 3 - '
					aLocalL3Nodes.push(parseInt(l3Name, 0));
				}
			});
			//If level name already exists, pick a level name incrementing the last element
			if(aLocalL3Nodes.indexOf(count) !== -1) {
				aLocalL3Nodes = aLocalL3Nodes.sort(function(a, b) {
					return a - b;
				});
				var lastL3Count = aLocalL3Nodes[aLocalL3Nodes.length - 1];
				levelName = "Level 3 - " + (lastL3Count + 1);
			}
			return levelName;
		},

		//Number padding for Project Item No - to make it as 4 digits
		_padNumber: function (number, length) {
			var len = length - ("" + number).length;
			return (len > 0 ? new Array(++len).join("0") : "") + number;
		},

		//Convert Date to Json date formar - to pass to SERP
		_convertToJsonDate: function (date) {
			return "/Date(" + new Date(date).getTime() + ")/";
		},

		//Convert String to Date - to pass to SCP
		_convertToValidDate: function (date) {
			if (typeof (date) === "string" && date.includes("/Date(")) {
				return new Date(parseInt(date.replace("/Date(", ""), 0));
			} else {
				return date;
			}
		},

		//Convert JSON object to array
		_convertObjToArray: function (oProjectData) {
			var aConverted = [];
			Object.values(oProjectData).forEach(function (oItem) {
				aConverted.push(oItem);
			});
			return aConverted;
		},
		
		//@START: Task 316387
		getDistributionChannel: function(results, providercompcode, business) {
			var aDCList = [];
			if(business === "UP") {
				aDCList =  results.filter(function(o) {
					return o.providercompcode === providercompcode;
				});
			}
			if(!aDCList.length) {
				aDCList =  results.filter(function(o) {
					return o.providercompcode === "ALL";
				});
			}
			return aDCList;
		}
		//@END: Task 316387
	};

});