sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"
], function (UnderScoreParse) {
	return {
		getDeterminedValuesEBD: function (context) {
			return new Promise(function (resolve, reject) {
				if (context.getPropInModel("localDataModel", "/funtionid") && context.getPropInModel("localDataModel", "/serviceid")) {
					var eventValue = {
						modelName: "fdrPlusFeedOdataModel",
						entitySet: "profitcenterdet",
						filters: context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
							context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid"))).concat(context.makeFilterArray(
							["deletionflag"], "NE", "X")),
						urlParameters: "",
						success: function (oData) {
							if (oData.results.length) {
								resolve({
									ResponsibleNo: oData.results[0].personresp,
									ProfitCtr: oData.results[0].profitcentre,
									RespsblCctr: oData.results[0].costcentre,
								});
							} else {
								reject("Maintain Profit Center Responsible No and Cost Center in Feeder");
							}
						},
						error: "",
					};
					context.readDataFromOdataModel(eventValue, true);
				} else {
					reject("Please Select Function and Service");
				}
			});
		},
		getDependentValuesForGSAPProject: function (context, providerPath) {
			return new Promise(function (resolve, reject) {
				var eventValues = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "plantdetermination",
					filters: context.makeFilterArray(["systemid"], "EQ", "GSAP").concat(
						context.makeFilterArray(["compcode"], "EQ", context.getPropInModel("localDataModel", providerPath + "providercompcode"))),
					urlParameters: {},
					success: function (oData) {
						if (oData.results.length) {
							resolve(oData.results[0].plant);
						} else {
							context.showMessage("Please Maintain Plant in Feeder");
							if (context.gsapProjFrag && context.gsapProjFrag.isOpen()) {
								context.gsapProjFrag.close();
							}
						}
					},
					error: ""
				};
				context.readDataFromOdataModel(eventValues, true);
			});
		},
		gsapProjectTrigger: function (context, providerPath) {
			var providerDetails = context.getPropInModel("localDataModel", providerPath);
			if (context.getPropInModel("localDataModel", "/fdrroute") === "GCB" || context.getPropInModel("localDataModel", "/fdrroute") === "GCF" || 
				context.getPropInModel("localDataModel", "/fdrroute") ===
				"EBD" || (context.getPropInModel(
					"localDataModel", "/fdrroute") === "DIR" && context.getPropInModel("localDataModel", "/business") === 'DS')) {
				if (providerDetails.projectdef) {
					this.getGSAPProjectStructFromProjDef(context, providerDetails.projectdef).then(function (data) {
						if (data.state === "S") {
							context.setPropInModel("gsapProjectLocalModel", "/", data.structure);
							context.setPropInModel("gsapProjectLocalModel", "/provPath", providerPath);
						}
					});
				} else {
					this.getDependentValuesForGSAPProject(context, providerPath).then(function (plantDetermined) {
						var defaults = context.getPropInModel("defaultsWBSLocalModel", "/results").filter(function (e) {
							return e.scenarioidentifier === "GCB" || e.scenarioidentifier === "GCF" || e.scenarioidentifier === "ALL";
						});
						//if No Project Details not found 
						var projTableDetails = context.getPropInModel("localDataModel", "/fdrproject").filter(function (e) {
							return (e.compcode === providerDetails.providercompcode && e.provideritemno === providerDetails.itemno);
						});

						if (!projTableDetails.length) {
							var projArray = [];
							var headObj = {
								ACTION: "C",
								compcode: providerDetails.providercompcode,
								provideritemno: providerDetails.itemno,
								level: "H",
								projectitemno: "10",
								fdrno: "",
								intialdef: "",
								systemflag: "G",
								projectdef: providerDetails.projectdef,
								projectdesc: context.getPropInModel("localDataModel", "/fdrdescription"),
								leveldef: "",
								levelname: "",
								coarea: defaults.filter(function (e) {
									return e.defaultkey === "CONTROLLING_AREA";
								})[0].defaultkeyvalue,
								companycode: providerDetails.providercompcode,
								profitcenter: providerDetails.prprftcenter,
								currency: context.getPropInModel("localDataModel", "/currency"),
								taxjur: "",
								respcostcntr: "",
								fieldkey: "",
								billingelement: "",
								accountassignment: "",
								projectstartdate: "",
								projectenddate: "",
								persresponsibleno: context.getPropInModel("localDataModel", "/fdrroute") === "DIR" ? "" : defaults.filter(function (e) {
									return e.defaultkey === "PERSON_RESP_NO";
								})[0].defaultkeyvalue,
								projectprofile: defaults.filter(function (e) {
									return e.defaultkey === "PROJECT_PROFILE";
								})[0].defaultkeyvalue,
								plant: plantDetermined
							};
							projArray.push(headObj);
							var levlOne = {
								compcode: providerDetails.providercompcode,
								provideritemno: providerDetails.itemno,
								level: "L",
								projectitemno: "20",
								fdrno: "",
								intialdef: "L1-1",
								systemflag: "G",
								projectdef: "",
								projectdesc: context.getPropInModel("localDataModel", "/fdrdescription"),
								leveldef: "",
								levelname: "",
								coarea: defaults.filter(function (e) {
									return e.defaultkey === "CONTROLLING_AREA";
								})[0].defaultkeyvalue,
								companycode: providerDetails.providercompcode,
								profitcenter: "",
								currency: "",
								taxjur: "",
								respcostcntr: providerDetails.cleancostcenter,
								fieldkey: "Z007000",
								billingelement: "X",
								accountassignment: "",
								projectstartdate: "",
								projectenddate: "",
								persresponsibleno: "",
								projectprofile: "",
								investmentprogramid: "RE",
								plant: ""
							};
							projArray.push(levlOne);
							var levlTwo = {
								compcode: providerDetails.providercompcode,
								provideritemno: providerDetails.itemno,
								level: "L",
								projectitemno: "30",
								fdrno: "",
								parentnode: "L1-1",
								intialdef: "L2-1",
								systemflag: "G",
								projectdef: "",
								projectdesc: context.getPropInModel("localDataModel", "/fdrdescription"),
								leveldef: "",
								levelname: "",
								coarea: defaults.filter(function (e) {
									return e.defaultkey === "CONTROLLING_AREA";
								})[0].defaultkeyvalue,
								companycode: providerDetails.providercompcode,
								profitcenter: "",
								currency: "",
								taxjur: "",
								respcostcntr: providerDetails.cleancostcenter,
								fieldkey: "Z007000",
								billingelement: "",
								accountassignment: "X",
								projectstartdate: "",
								projectenddate: "",
								persresponsibleno: "",
								projectprofile: "",
								investmentprogramid: "RE",
								plant: ""
							};
							projArray.push(levlTwo);
							context.setPropInModel("localDataModel", "/fdrproject", context.getPropInModel("localDataModel", "/fdrproject").concat(
								projArray));
						}
						//setProjectDetails  gsapProjectLocalModel
						context.setPropInModel("gsapProjectLocalModel", "/provPath", providerPath);
						context.setPropInModel("gsapProjectLocalModel", "/ProjectDefinition", providerDetails.projectdef);
						context.setPropInModel("gsapProjectLocalModel", "/ProjectProfile", defaults.filter(function (e) {
							return e.defaultkey === "PROJECT_PROFILE";
						})[0].defaultkeyvalue);
						context.setPropInModel("gsapProjectLocalModel", "/ControllingArea", defaults.filter(function (e) {
							return e.defaultkey === "CONTROLLING_AREA";
						})[0].defaultkeyvalue);
						context.setPropInModel("gsapProjectLocalModel", "/CompanyCode", providerDetails.providercompcode);
						context.setPropInModel("gsapProjectLocalModel", "/Plant", plantDetermined);
						context.setPropInModel("gsapProjectLocalModel", "/ProjectCurrency", context.getPropInModel("localDataModel", "/currency"));
						//need to get Profit center dynamically 
						context.setPropInModel("gsapProjectLocalModel", "/ProfitCtr", providerDetails.prprftcenter);
						context.setPropInModel("gsapProjectLocalModel", "/Description", context.getPropInModel("localDataModel", "/fdrdescription"));
						//start Date 
						context.setPropInModel("gsapProjectLocalModel", "/Start", context.getPropInModel("localDataModel", "/fromdate"));
						//End Date 
						context.setPropInModel("gsapProjectLocalModel", "/Finish", context.getPropInModel("localDataModel", "/todate"));
						var headerFields = projTableDetails.filter(function (e) {
							if (e.level === "H") {
								return true;
							}
						});
						if (context.getPropInModel("localDataModel", "/fdrroute") !== "DIR") {
							context.setPropInModel("gsapProjectLocalModel", "/ResponsibleNo", headerFields.length ? headerFields[0].persresponsibleno ?
								headerFields[0].persresponsibleno : defaults.filter(function (e) {
									return e.defaultkey === "PERSON_RESP_NO";
								})[0].defaultkeyvalue : defaults.filter(function (e) {
									return e.defaultkey === "PERSON_RESP_NO";
								})[0].defaultkeyvalue);
						} else {
							context.setPropInModel("gsapProjectLocalModel", "/ResponsibleNo", "");
						}
						context.setPropInModel("gsapProjectLocalModel", "/Taxjurcode", "");
						var levelOne = projTableDetails.filter(function (e) {
							if (e.level === "L") {
								if (e.intialdef && e.intialdef.indexOf("L1") !== -1) {
									return true;
								}
							}
						});
						var levelTwo = projTableDetails.filter(function (e) {
							if (e.level === "L") {
								if (e.intialdef && e.intialdef.indexOf("L2") !== -1) {
									return true;
								}
							}
						});
						//line items 
						var levelItems = [{
							WbsElement: levelOne.length ? levelOne[0].leveldef : "",
							Description: context.getPropInModel("localDataModel", "/fdrdescription"),
							RespsblCctr: providerDetails.cleancostcenter,
							InvReason: "RE",
							WbsAccountAssignmentElement: "X",//@Task 234099
							WbsBillingElement: "X",
							UserFieldKey: "Z007000",
							UserFieldChar202: "",
							settlementRule: [{
								AccntAssCat: "CTR",
								SettlementRecevier: providerDetails.cleancostcenter,
								PercentageRate: "100"
							}],
							level: [{
								WbsElement: levelTwo.length ? levelTwo[0].leveldef : "",
								Description: context.getPropInModel("localDataModel", "/fdrdescription"),
								RespsblCctr: providerDetails.cleancostcenter,
								InvReason: "RE",
								WbsAccountAssignmentElement: "X",
								WbsBillingElement: "",
								UserFieldKey: "Z007000",
								UserFieldChar202: "",
								settlementRule: [{
									AccntAssCat: "CTR",
									SettlementRecevier: providerDetails.cleancostcenter,
									PercentageRate: "100"
								}]
							}]
						}];
						context.setPropInModel("gsapProjectLocalModel", "/results", levelItems);
					});
				}
			}
		},
		getGSAPProjectStructFromProjDef: function (context, projectDef) {
			return new Promise(function (resolve, reject) {
				var eventProps = {
					modelName: "gsapModelXODataModel",
					entitySet: "ProjectSet('" + projectDef.replace("/", "") + "')",
					filters: [],
					urlParameters: {
						"$expand": "wbs"
					},
					success: function (oData) {
						var levelOnes = [];
						jQuery.each(oData.wbs.results.filter(function (e) {
							return !e.WBSparent;
						}), function (ix, ox) {
							var level2s = [];
							jQuery.each(oData.wbs.results.filter(function (e) {
								return e.WBSparent === ox.WBS;
							}), function (iy, oy) {
								level2s.push({
									WbsElement: oy.WBS,
									Description: oy.Description,
									RespsblCctr: oy.CostCenter,
									InvReason: "RE",
									WbsAccountAssignmentElement: oy.AccountAssignment,
									WbsBillingElement: "",
									UserFieldKey: oy.Userfieldkey,
									UserFieldChar202: oy.Userfield,
									settlementRule: [{
										AccntAssCat: "CTR",
										SettlementRecevier: oy.CostCenter,
										PercentageRate: "100"
									}]
								});
							});
							levelOnes.push({
								WbsElement: ox.WBS,
								Description: ox.Description,
								RespsblCctr: ox.CostCenter,
								InvReason: ox.Investmntreason,
								WbsAccountAssignmentElement: ox.AccountAssignment,
								WbsBillingElement: ox.BillingElement,
								UserFieldKey: ox.Userfieldkey,
								UserFieldChar202: ox.Userfield,
								settlementRule: [{
									AccntAssCat: "CTR",
									SettlementRecevier: ox.CostCenter,
									PercentageRate: "100"
								}],
								level: level2s
							});
						});
						var header = {
							ProjectDefinition: oData.Definition,
							ProjectProfile: oData.Profile,
							ControllingArea: oData.ControllingArea,
							CompanyCode: oData.Company,
							Plant: oData.Plant,
							ProjectCurrency: oData.ProjectCurrency,
							ProfitCtr: oData.ProfitCenter,
							Description: oData.Description,
							Start: oData.StartDate,
							Finish: oData.EndDate,
							ResponsibleNo: oData.PersonResponsible,
							Taxjurcode: oData.TaxJurcode,
							results: levelOnes
						};
						resolve({
							state: "S",
							structure: header
						});
						// context.setModel(new sap.ui.model.json.JSONModel(oData), "serpProfitCenterLocalModel");
					},
					error: function (oError) {

					}
				};
				context.readDataFromOdataModel(eventProps, true);
			});
		},
		makeGSAPProjectCall: function (context, forGCR) {
			var payload = this.makeGSAPSubmitPayload(context);
			if (typeof (payload) === "boolean") {
				return;
			}
			context.setPropInModel("busyModel", "/flag", true);
			var eventParams = {
				modelName: "gsapProjectODataModel",
				entitySet: "unameset",
				payload: payload,
				urlParameters: "",
				success: function (oData) {
					context.setPropInModel("busyModel", "/flag", false);
					if (oData.ProjectSet.results[0].ProjectDefinition) {
						//AS DS take only the level 1 WBS 
						var provPath = context.getPropInModel("gsapProjectLocalModel", "/provPath");
						context.setPropInModel("localDataModel", provPath + "projectdef", oData.ProjectSet.results[0].ProjectDefinition);
						context.setPropInModel("localDataModel", provPath + "providercosttyp", "WBS");
						context.setPropInModel("localDataModel", provPath + "prprftcenter", oData.ProjectSet.results[0].ProfitCtr); //@Task 342207
						context.setPropInModel("localDataModel", provPath + "providercostobj", oData.ProjectSet.results[0].ProjectToWBS.results[
							0].WbsElement);
						var projectDetails = context.getPropInModel("localDataModel", "/fdrproject").filter(function (e) {
							return (e.compcode === context.getPropInModel("localDataModel", provPath + "providercompcode") && e.provideritemno ===
								context.getPropInModel("localDataModel", provPath + "/itemno"));
						});
						projectDetails.forEach(function (e) {
							e.projectdef = oData.ProjectSet.results[0].ProjectDefinition;
							if (e.level === "H") {
								e.persresponsibleno = oData.ProjectSet.results[0].ResponsibleNo;
							}
							if (e.level === "L") {
								if (e.intialdef && e.intialdef.indexOf("L1") !== -1) {
									e.leveldef = oData.ProjectSet.results[0].ProjectToWBS.results[0].WbsElement;
								}
								if (e.intialdef && e.intialdef.indexOf("L2") !== -1) {
									// TODO: need to change IPROJECTDEF t oWbsElement
									e.leveldef = oData.ProjectSet.results[0].ProjectToWBSLevel.results[0].IProjectDefinition;
								}
							}
						});
						context.setPropInModel("localDataModel", "/fdrproject", projectDetails);
						//update in Substitution Logic
						if (context.getPropInModel("localDataModel", provPath + "cleancostcenter")) {
							var payloadS = {
								"action": "U",
								"ItemSet": [{
									"action": "U",
									"COSTC_FROM": context.getPropInModel("localDataModel", provPath + "cleancostcenter"),
									"TAR_WBS": oData.ProjectSet.results[0].ProjectToWBSLevel.results[0].IProjectDefinition //level 2 WBS is passed back in IProject Def
								}]
							};
							var val = {
								modelName: "gsapModelXODataModel",
								entitySet: "HeaderSet",
								payload: payloadS,
								urlParameters: "",
								success: function (successOd) {
									sap.m.MessageToast.show("Substitution logic updated");
								},
								error: function (error) {}
							};
							context.createDataFromOdataModel(val);
						}
						if (context.gsapProjFrag && context.gsapProjFrag.isOpen()) {
							context.gsapProjFrag.close();
						}
					}
				},
				error: function () {
					context.setPropInModel("busyModel", "/flag", false);
				}
			};
			context.createDataFromOdataModel(eventParams);
		},
		makeGSAPSubmitPayload: function (context) {
			var payload = [];
			var modelData = context.getView().getModel("gsapProjectLocalModel").getProperty("/");
			var check = this.mandateGSAPCheckCycle(context, 'project', modelData);
			if (!check) {
				return false;
			}
			var trailingIndex = modelData.Business === 1 ? 'IT' : 'DB';
			var prifxPart = modelData.CompanyCode[0] + modelData.CompanyCode[1];
			//@START: Bug 231777
			if(prifxPart === "BM") {
				prifxPart = "AE";
			}
			//@END: Bug 231777
			var projectDef = prifxPart + trailingIndex;
			var headerOps;
			if (modelData.ProjectDefinition) {
				headerOps = "U";
			} else {
				headerOps = "C";
			}
			var obj = {
				"ProjectDefinition": headerOps === "C" ? (projectDef + "1") : modelData.ProjectDefinition,
				"Description": modelData.Description ? modelData.Description : "",
				"ResponsibleNo": modelData.ResponsibleNo ? modelData.ResponsibleNo : "",
				"CompanyCode": modelData.CompanyCode ? modelData.CompanyCode : "",
				"ControllingArea": modelData.ControllingArea ? modelData.ControllingArea : "",
				"ProfitCtr": modelData.ProfitCtr ? modelData.ProfitCtr : "",
				"ProjectCurrency": modelData.ProjectCurrency ? modelData.ProjectCurrency : "",
				"Start": modelData.Start ? new Date(modelData.Start).toISOString().split(".")[0] : "",
				"Finish": modelData.Finish ? new Date(modelData.Finish).toISOString().split(".")[0] : "",
				"Plant": modelData.Plant ? modelData.Plant : "",
				"ProjectProfile": modelData.ProjectProfile ? modelData.ProjectProfile : "",
				"Taxjurcode": modelData.Taxjurcode ? modelData.Taxjurcode : "",
				"Operation": headerOps,
				ProjectToWBS: [],
				ProjectToSettlement: [],
				ProjectToWBSLevel: []
			};
			//to add projectTOWBS
			if (modelData.results.length) {
				for (var i = 0; i < modelData.results.length; i++) {
					var lineObj = modelData.results[i];
					var check = this.mandateGSAPCheckCycle(context, 'levelWBS', lineObj);
					if (!check) {
						return false;
					}
					var objIdx = (i + 1) > 9 ? ((i + 1) + projectDef) : (("0" + (i + 1)) + projectDef);
					var toPush = {
						"WbsElement": lineObj.WbsElement ? lineObj.WbsElement : objIdx,
						"IProjectDefinition": obj.ProjectDefinition,
						"Description": lineObj.Description ? lineObj.Description : "",
						"WbsAccountAssignmentElement": lineObj.WbsAccountAssignmentElement ? lineObj.WbsAccountAssignmentElement : "",
						"WbsBillingElement": lineObj.WbsBillingElement ? lineObj.WbsBillingElement : "",
						"RespsblCctr": lineObj.RespsblCctr ? lineObj.RespsblCctr : "",
						"UserFieldKey": lineObj.UserFieldKey ? lineObj.UserFieldKey : "",
						"UserFieldChar202": lineObj.UserFieldChar202 ? lineObj.UserFieldChar202 : "",
						"InvReason": lineObj.InvReason ? lineObj.InvReason : "",
						"Operation": headerOps,
						"SubLevel": i.toString()
					};
					obj.ProjectToWBS.push(toPush);
					//add settlement rule for level 1 WBS
					if (lineObj.settlementRule && lineObj.settlementRule.length) {
						for (var j = 0; j < lineObj.settlementRule.length; j++) {
							var setlObj = lineObj.settlementRule[j];
							var check = this.mandateGSAPCheckCycle(context, 'settlement', setlObj);
							if (!check) {
								return false;
							}
							var setToPush = {
								"WbsElement": toPush.WbsElement,
								"SettlementWBS": setlObj.AccntAssCat === 'WBS' ? setlObj.SettlementRecevier : '',
								"Operation": toPush.Operation,
								"RuleSeqNo": (j + 1).toString(),
								"SettlementType": "GES",
								"PercentageRate": setlObj.PercentageRate ? setlObj.PercentageRate : "",
								"AccntAssCat": setlObj.AccntAssCat ? setlObj.AccntAssCat : "",
								"COArea": obj.ControllingArea ? obj.ControllingArea : "",
								"Recvcostcenter": setlObj.AccntAssCat === 'CTR' ? setlObj.SettlementRecevier : ''
							};
							obj.ProjectToSettlement.push(setToPush);
						}
					} else {
						sap.m.MessageToast.show("Please Add settlement rule to Continue");
						return false;
					}
					//add level details 
					if (lineObj.level) {
						for (var z = 0; z < lineObj.level.length; z++) {
							var levelObj = lineObj.level[z];
							var check = this.mandateGSAPCheckCycle(context, 'levelWBS', levelObj);
							if (!check) {
								return false;
							}
							var levelIdx = (z + 1) > 9 ? (toPush.WbsElement + (z + 1)) : (toPush.WbsElement + ("0" + (z + 1)));
							var levelToPush = {
								"WbsElement": levelObj.WbsElement ? levelObj.WbsElement : levelIdx,
								"IProjectDefinition": obj.ProjectDefinition,
								"Description": levelObj.Description ? levelObj.Description : "",
								"WbsAccountAssignmentElement": levelObj.WbsAccountAssignmentElement ? levelObj.WbsAccountAssignmentElement : "",
								"WbsBillingElement": levelObj.WbsBillingElement ? levelObj.WbsBillingElement : "",
								"RespsblCctr": levelObj.RespsblCctr ? levelObj.RespsblCctr : "",
								"UserFieldKey": levelObj.UserFieldKey ? levelObj.UserFieldKey : "",
									"UserFieldChar202": levelObj.UserFieldChar202 ? levelObj.UserFieldChar202 : "",
								"WbsUp": toPush.WbsElement,
								"Operation": levelObj.Operation ? levelObj.Operation : headerOps,
								"SubLevel": i.toString()
							};
							obj.ProjectToWBSLevel.push(levelToPush);
							//add settlement rule for Level 2 WBS 
							if (levelObj.settlementRule && levelObj.settlementRule.length) {
								for (var x = 0; x < levelObj.settlementRule.length; x++) {
									var setlObjLevel = levelObj.settlementRule[x];
									var check = this.mandateGSAPCheckCycle(context, 'settlement', setlObjLevel);
									if (!check) {
										return false;
									}
									var setLevelToPush = {
										"WbsElement": levelToPush.WbsElement, //01GBDB01
										"SettlementWBS": setlObjLevel.AccntAssCat === 'WBS' ? setlObjLevel.SettlementRecevier : '',
										"Operation": levelToPush.Operation,
										"RuleSeqNo": (x + 1).toString(),
										"SettlementType": "GES",
										"PercentageRate": setlObjLevel.PercentageRate ? setlObjLevel.PercentageRate : "",
										"AccntAssCat": setlObjLevel.AccntAssCat ? setlObjLevel.AccntAssCat : "",
										"COArea": obj.ControllingArea ? obj.ControllingArea : "",
										"Recvcostcenter": setlObjLevel.AccntAssCat === 'CTR' ? setlObjLevel.SettlementRecevier : ''
									};
									if (setlObjLevel.SettlementRecevier && setlObjLevel.PercentageRate) {
										obj.ProjectToSettlement.push(setLevelToPush);
									} else {
										if (!setlObjLevel.SettlementRecevier) {
											sap.m.MessageToast.show("Please add Settlement Recevier to Continue");
										} else {
											sap.m.MessageToast.show("Please add Settlement Percentage to Continue");
										}
										return false;
									}
								}
							} else {
								sap.m.MessageToast.show("Please add Settlement rule to Continue.");
								return false;
							}
						}
					}
				}
			} else {
				sap.m.MessageToast.show("please Add Level 1 Details to continue");
				return false;
			}
			var toReturn = {
				d: {
					Uname: "",
					ProjectSet: [obj]
				}
			};
			return toReturn;
		},
		mandateGSAPCheckCycle: function (context, prop, obj) {
			var mandateFieldsCheck = context.getView().getModel('gsapProjectMandateFields').getProperty("/");
			var mandateCheck = true;
			jQuery.each(mandateFieldsCheck[prop], function (ix, ox) {
				if (!obj[ox.name]) {
					mandateCheck = false;
					sap.m.MessageToast.show(ox.msg);
				}
			});
			return mandateCheck;
		},
		makeEBDHUBProject: function (context) {
			var currentContext = this;
			return new Promise(function (resolve, reject) {
				currentContext.getDeterminedValuesEBD(context).then(function (object) {
					var allData = context.getPropInModel("localDataModel", "/");
					//check if MCS is created
					var defaultValues = context.getPropInModel("defaultsWBSLocalModel", "/results").filter(function (e) {
						return e.scenarioidentifier === "EBD" || e.scenarioidentifier === "ALL";
					});
					var payloadDataRRB = {
						Operation: context.getPropInModel("localDataModel", "/benifCompanies/0/rrbprojdef") ? 'U' : "C",
						ProjectDefinition: context.getPropInModel("localDataModel", "/benifCompanies/0/rrbprojdef") ? context.getPropInModel(
							"localDataModel", "/benifCompanies/0/rrbprojdef") : "GBDB1",
						Description: (allData.fdrdescription + "RRB").substring(0,40),
						ResponsibleNo: object.ResponsibleNo ? object.ResponsibleNo : "",
						CompanyCode: 'GB32',
						ControllingArea: defaultValues.filter(function (e) {
							return e.defaultkey === 'CONTROLLING_AREA';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'CONTROLLING_AREA';
						})[0].defaultkeyvalue : 'OP01',
						ProfitCtr: object.ProfitCtr ? object.ProfitCtr : '100010',
						ProjectCurrency: "USD",
						Start: new Date(allData.fromdate).toISOString().split(".")[0],
						Finish: new Date(allData.todate).toISOString().split(".")[0],
						Plant: defaultValues.filter(function (e) {
							return e.defaultkey === 'WBS_DEFAULT_PLANT';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'WBS_DEFAULT_PLANT';
						})[0].defaultkeyvalue : 'GA91',
						ProjectProfile: defaultValues.filter(function (e) {
							return e.defaultkey === 'PROJECT_PROFILE_RRB';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'PROJECT_PROFILE_RRB';
						})[0].defaultkeyvalue : "Z009000",
						Taxjurcode: "",
						ProjectToWBS: [],
						ProjectToWBSLevel: [],
						ProjectToSettlement: []
					};
					var payloadDataMCS = {
						Operation: context.getPropInModel("localDataModel", "/benifCompanies/0/mcsprojdef") ? 'U' : "C",
						ProjectDefinition: context.getPropInModel("localDataModel", "/benifCompanies/0/mcsprojdef") ? context.getPropInModel(
							"localDataModel", "/benifCompanies/0/mcsprojdef") : "GBDB2",
						Description: (allData.fdrdescription + "MCS").substring(0,40),
						ResponsibleNo: object.ResponsibleNo ? object.ResponsibleNo : "",
						CompanyCode: 'GB32',
						ControllingArea: defaultValues.filter(function (e) {
							return e.defaultkey === 'CONTROLLING_AREA';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'CONTROLLING_AREA';
						})[0].defaultkeyvalue : 'OP01',
						ProfitCtr: object.ProfitCtr ? object.ProfitCtr : '100010',
						ProjectCurrency: "GBP",
						Start: new Date(allData.fromdate).toISOString().split(".")[0],
						Finish: new Date(allData.todate).toISOString().split(".")[0],
						Plant: defaultValues.filter(function (e) {
							return e.defaultkey === 'WBS_DEFAULT_PLANT';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'WBS_DEFAULT_PLANT';
						})[0].defaultkeyvalue : 'GA91',
						ProjectProfile: defaultValues.filter(function (e) {
							return e.defaultkey === 'PROJECT_PROFILE_MCS';
						})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
							return e.defaultkey === 'PROJECT_PROFILE_MCS';
						})[0].defaultkeyvalue : "Z009001",
						Taxjurcode: "",
						ProjectToWBS: [{
							Operation: context.getPropInModel("localDataModel", "/benifCompanies/0/mcsprojdef") ? 'U' : "C",
							WbsElement: context.getPropInModel("localDataModel", "/benifCompanies/0/mcswbsse") ? context.getPropInModel(
								"localDataModel",
								"/benifCompanies/0/mcswbsse") : "01MCSGBDB",
							WbsBillingElement: "",
							IProjectDefinition: context.getPropInModel("localDataModel", "/benifCompanies/0/mcsprojdef") ? context.getPropInModel(
								"localDataModel", "/benifCompanies/0/mcsprojdef") : "GBDB2",
							Description: (allData.fdrdescription + " MCS").substring(0,40),
							RespsblCctr: object.RespsblCctr ? object.RespsblCctr : 'GB32023439',
							UserFieldKey: defaultValues.filter(function (e) {
								return e.defaultkey === 'USER_FIELD_KEY';
							})[0].ALLOWEDENTRIES ? defaultValues.filter(function (e) {
								return e.defaultkey === 'USER_FIELD_KEY';
							})[0].defaultkeyvalue : "Z007000",
							UserFieldChar202: " ",
							InvReason: defaultValues.filter(function (e) {
								return e.defaultkey === 'INV_REASON';
							})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
								return e.defaultkey === 'INV_REASON';
							})[0].defaultkeyvalue : 'RE',
							WbsAccountAssignmentElement: "X",
							SubLevel: "1"
						}],
						ProjectToWBSLevel: [],
						ProjectToSettlement: []
					};
					// rrb projects 
					jQuery.each(allData.benifCompanies, function (ix, ox) {
						var i = ix;
						//rrb wbs creation
						var obj = {
							Operation: ox.sipcrecwbse ? 'U' : "C",
							WbsElement: ox.sipcrecwbse ? ox.sipcrecwbse : (i + 1) > 9 ? (i + 1) + "GBDB" : ("0" + (i + 1)) +
								"GBDB",
							WbsBillingElement: "X",
							IProjectDefinition: payloadDataRRB.ProjectDefinition,
							Description: (ox.beneficiarycompcode + " " + allData.fdrdescription).substring(0,40),
							RespsblCctr: object.RespsblCctr ? object.RespsblCctr : 'GB32023439',
							UserFieldKey: defaultValues.filter(function (e) {
								return e.defaultkey === 'USER_FIELD_KEY';
							})[0].ALLOWEDENTRIES ? defaultValues.filter(function (e) {
								return e.defaultkey === 'USER_FIELD_KEY';
							})[0].defaultkeyvalue : "Z007000",
							UserFieldChar202: " ",
							InvReason: defaultValues.filter(function (e) {
								return e.defaultkey === 'INV_REASON';
							})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
								return e.defaultkey === 'INV_REASON';
							})[0].defaultkeyvalue : 'RE',
							WbsAccountAssignmentElement: "X",
							SubLevel: (i + 1).toString()
						};
						payloadDataRRB.ProjectToWBS.push(obj);
						//rrb settlement
						var sObj = {
							"WbsElement": obj.WbsElement,
							"SettlementWBS": " ",
							"Operation": obj.Operation,
							"RuleSeqNo": (i + 1).toString(),
							"SettlementType": "GES",
							"PercentageRate": "100",
							"AccntAssCat": "CTR",
							"COArea": defaultValues.filter(function (e) {
								return e.defaultkey === 'CONTROLLING_AREA';
							})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
								return e.defaultkey === 'CONTROLLING_AREA';
							})[0].defaultkeyvalue : 'OP01',
							"Recvcostcenter": object.RespsblCctr ? object.RespsblCctr : 'GB32023439'
						};
						payloadDataRRB.ProjectToSettlement.push(sObj);
						//mcs Settlement
						if (ox.beneficiaryper) {
							var mcsObjSet = {
								"Operation": obj.Operation, //a new addition to the line item will need new settlement hence operation is like rrb creation
								"WbsElement": payloadDataMCS.ProjectToWBS[0].WbsElement,
								"SettlementWBS": obj.WbsElement,
								"RuleSeqNo": (i + 1).toString(),
								"SettlementType": "GES",
								"PercentageRate": ox.beneficiaryper ? parseFloat(ox.beneficiaryper).toFixed(2) : '0',
								"AccntAssCat": "WBS",
								"COArea": defaultValues.filter(function (e) {
									return e.defaultkey === 'CONTROLLING_AREA';
								})[0].defaultkeyvalue ? defaultValues.filter(function (e) {
									return e.defaultkey === 'CONTROLLING_AREA';
								})[0].defaultkeyvalue : 'OP01',
								"Recvcostcenter": ""
							};
							//Add period information to settlement rule
							mcsObjSet = currentContext.addPeriodInfoToSettlement(mcsObjSet);//@Bug 243199
							payloadDataMCS.ProjectToSettlement.push(mcsObjSet);
						}
					});

					var payloadData = {
						d: {
							Uname: context.getPropInModel("userDetailsModel", "/name"),
							ProjectSet: [
								payloadDataRRB,
								payloadDataMCS
							]
						}
					};
					var eventParams = {
						modelName: "gsapProjectODataModel",
						entitySet: "unameset",
						payload: payloadData,
						urlParameters: {},
						success: function (odata) {
							var masterCheck = true;
							if (odata.ProjectSet.results.length === payloadData.d.ProjectSet.length) {
								for (var i = 0; i < odata.ProjectSet.results.length; i++) {
									var obj = odata.ProjectSet.results[i];
									if (obj.ProjectProfile === defaultValues.filter(function (e) {
											return e.defaultkey === 'PROJECT_PROFILE_RRB';
										})[0].defaultkeyvalue) {
										//add WBS to line items 
										for (var j = 0; j < obj.ProjectToWBS.results.length; j++) {
											var lineItems = allData.benifCompanies;
											var lineObj = obj.ProjectToWBS.results[j];
											var cc = lineObj.Description.split(" ")[0];
											var idx, check = '';
											jQuery.each(lineItems, function (ix, ox) {
												if (ox.beneficiarycompcode.toUpperCase() === cc.toUpperCase()) {
													idx = ix;
													check = true;
												}
											});
											if (check) {
												context.setPropInModel("localDataModel", "/benifCompanies/" + idx + "/sipcrecwbse", lineObj.WbsElement);
												context.setPropInModel("localDataModel", "/benifCompanies/" + idx + "/rrbprojdef", obj.ProjectDefinition);
												masterCheck = lineObj.WbsElement && masterCheck ? true : false;
											}
										}
									} else if (obj.ProjectProfile === defaultValues.filter(function (e) {
											return e.defaultkey === 'PROJECT_PROFILE_MCS';
										})[0].defaultkeyvalue) {
										// context.getView().getModel('headerModel').setProperty('/PROJDEFMCS', obj.ProjectDefinition);
										var lineObj = obj.ProjectToWBS.results[0];
										jQuery.each(allData.benifCompanies, function (ix, ox) {
											context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcswbsse", lineObj.WbsElement);
											context.setPropInModel("localDataModel", "/benifCompanies/" + ix + "/mcsprojdef", obj.ProjectDefinition);
											masterCheck = lineObj.WbsElement && masterCheck ? true : false;
										});
									}
								}
							}
							if (masterCheck) {
								resolve("SUCCESS");
							} else {
								reject("Successfully Created WBS for few line items, please review and complete");
							}
						},
						error: function (error) {
							reject(JSON.stringify(error));
						}
					};
					context.createDataFromOdataModel(eventParams);
				}).catch(function (error) {
					reject(error);
				});
			});
		},
		
		//@START: Update MCS WBS Settlement Rule
		readGSAPProjectDetails: function(context, mcsProjDefn) {
			return new Promise(function(resolve, reject) {
				context.getView().getModel('gsapModelXODataModel').read("/ProjectSet('" + mcsProjDefn + "')", {
					"urlParameters": {
						"$expand": "wbs",
						"$format": "json"
					},
					success: function(odata, oresponse) {
						resolve(odata);
					}, 
					error: function(oerror) {
						reject("Error in getting L1 WBS Details");
					}
				});
			});
		},
		
		makeSettlementPayload: function(context, odata, oL1WBS) {
			var currentContext = this;
			return new Promise(function(resolve, reject) {
				var payloadDataMCS = {
					"Operation": "U",
					"ProjectDefinition": odata.Definition,
					"Description": odata.Description,
					"ResponsibleNo": odata.PersonResponsible,
					"CompanyCode": odata.Company,
					"ControllingArea": odata.ControllingArea,
					"ProfitCtr": odata.ProfitCenter,
					"ProjectCurrency": odata.ProjectCurrency,
					"Start": odata.StartDate,
					"Finish": odata.EndDate,
					"Plant": odata.Plant,
					"ProjectProfile": odata.Profile,
					"Taxjurcode": "",
					"ProjectToWBS": [{
						"Operation": "U",
						"WbsElement": oL1WBS.WBS,
						"WbsBillingElement": "",
						"IProjectDefinition": oL1WBS.Definition,
						"Description": oL1WBS.Description,
						"RespsblCctr": oL1WBS.CostCenter,
						"UserFieldKey": oL1WBS.Userfieldkey,
						"UserFieldChar202": "",
						"InvReason": oL1WBS.Investmntreason,
						"WbsAccountAssignmentElement": "X",
						"SubLevel": "1"
					}],
					"ProjectToWBSLevel": [],
					"ProjectToSettlement": []
				};
				var aRecipients = context.getPropInModel("localDataModel", "/benifCompanies").filter(function(o) {
					return parseFloat(o.beneficiaryper) > 0;                         
				});
				aRecipients.forEach(function(item, i) {
					var oMCSSettlement = {
						"Operation": "U",//@Bug 243199
						"WbsElement": oL1WBS.WBS,
						"SettlementWBS": item.sipcrecwbse,
						"RuleSeqNo": (i + 1).toString(),
						"SettlementType": "GES",
						"PercentageRate": item.beneficiaryper ? parseFloat(item.beneficiaryper).toFixed(2) : '0',
						"AccntAssCat": "WBS",
						"COArea": odata.ControllingArea,
						"Recvcostcenter": ""
					};
					//Add period information to settlement rule
					oMCSSettlement = currentContext.addPeriodInfoToSettlement(oMCSSettlement);//@Bug 243199
					payloadDataMCS.ProjectToSettlement.push(oMCSSettlement);
				});
				var payloadData = {
					d: {
						Uname: context.getPropInModel("userDetailsModel", "/name"),
						ProjectSet: [payloadDataMCS]
					}
				};
				//Call method to update MCS WBS in GSAP
				var eventParams = {
					modelName: "gsapProjectODataModel",
					entitySet: "unameset",
					payload: payloadData,
					urlParameters: {},
					success: function (odata) {
						resolve(odata);
					},
					error: function (error) {
						reject("Unable to update MCS WBS Settlement Rule");
					}
				};
				context.createDataFromOdataModel(eventParams);
			});
		},
		//@END: Update MCS WBS Settlement Rule
		
		//@START: Task 232399
		closeFDRGsap: function(context) {
			//@START: Bug 294897
			return new Promise(function(resolve, reject) {
				var aProviderCompanies = context.getPropInModel("localDataModel", "/providerCompanies");
				var aProviderCompWBS = aProviderCompanies.filter(function(o) {
					return o.providercosttyp === "WBS";
				});
				if(context.getPropInModel("localDataModel", "/fdrroute") !== "EBD" && !aProviderCompWBS.length) { //@Bug 320729
					resolve();
				}
				else {
				//@END: Bug 294897
					context.getView().getModel("gsapProjectCloseODataModel").setDeferredGroups(["closeFDRGsap"]);
					aProviderCompWBS.forEach(function(ox) { //@Bug 294897
						//if(ox.providercosttyp === "WBS") { //@Bug 294897
							var payload = {
								"POSID": ox.providercostobj,
								"ACTION": "D"
							};
							context.getView().getModel("gsapProjectCloseODataModel").create("/Wbs_element_closeSet", payload, {
								groupId: "closeFDRGsap",
								urlParameters: {},
								success: function(odata, oresponse){},
								error: function(oerror){}
							});
						//} //@Bug 294897
					});
					
					//For EBD, also include SIPC WBS
					if(context.getPropInModel("localDataModel", "/fdrroute") === "EBD") {
						var aBenifCompanies = context.getPropInModel("localDataModel", "/benifCompanies");
						aBenifCompanies.forEach(function(ox) {
							var payload = {
								"POSID": ox.sipcrecwbse,
								"ACTION": "D"
							};
							context.getView().getModel("gsapProjectCloseODataModel").create("/Wbs_element_closeSet", payload, {
								groupId: "closeFDRGsap",
								urlParameters: {},
								success: function(odata, oresponse){},
								error: function(oerror){}
							});
						});
					}
			
				//return new Promise(function(resolve, reject) { //@Bug 294897
					try {
						context.getView().getModel("gsapProjectCloseODataModel").submitChanges({
							groupId: "closeFDRGsap",
							success: function(odata) {
								var isError = false, errorMsg = "";
								odata.__batchResponses.forEach(function(obj) {
									if(obj.__changeResponses) {
										obj.__changeResponses.forEach(function(o) {
											if(o.data.MSGTYPE === "E") {
												isError = true;
												errorMsg += o.data.POSID + " - " + o.data.MSG + "\n";
											}
										});
									}
								});
								if(isError) {
									reject(errorMsg);
								}
								else {
									resolve();
								}
							},
							error: function(oerror) {
								reject("Error in closing WBS. Reason: " + oerror);
							}
						});
					}
					catch(err) {
						reject("Error in closing WBS. Reason: " + err); //@Bug 294897
					}
				} //@Bug 294897
			}); //@Bug 294897
		},
		//@END: Task 232399
		
		//@START: Task 274288
		closeWBSGSAP: function(context, wbs) {
			var payload = {
				"POSID": wbs,
				"ACTION": "D"
			};
			return new Promise(function(resolve, reject) {
				context.getView().getModel("gsapProjectCloseODataModel").create("/Wbs_element_closeSet", payload, {
					urlParameters: {},
					success: function(odata, oresponse){
						if(odata.MSGTYPE === "S") {
							resolve();
						} else {
							reject(wbs + " - " + odata.MSG);
						}
					},
					error: function(oerror){
						reject("Error in closing WBS " + wbs);
					}
				});
			});
		},
		//@END: Task 274288
		
		//@START: Bug 243199
		addPeriodInfoToSettlement: function(setToPush) {
			var currentDate = new Date();
			var currentYear = "" + currentDate.getFullYear();
			var currentQuarter = "Q" + Math.ceil((currentDate.getMonth() + 1)/3);
			switch (currentQuarter) {
	           case 'Q1':
	              setToPush.ValidFromPeriod = '01';
	              setToPush.ValidFromYear = currentYear;
	              setToPush.ValidToPeriod = '03';
	              setToPush.ValidToYear = currentYear;
	              break;
	           case 'Q2':
	              setToPush.ValidFromPeriod = '04';
	              setToPush.ValidFromYear = currentYear;
	              setToPush.ValidToPeriod = '06';
	              setToPush.ValidToYear = currentYear;
	              break;
	           case 'Q3':
	              setToPush.ValidFromPeriod = '07';
	              setToPush.ValidFromYear = currentYear;
	              setToPush.ValidToPeriod = '09';
	              setToPush.ValidToYear = currentYear;
	              break;
	           case 'Q4':
	              setToPush.ValidFromPeriod = '10';
	              setToPush.ValidFromYear = currentYear;
	              setToPush.ValidToPeriod = '12';
	              setToPush.ValidToYear = currentYear;
	              break;
	           default:
	              setToPush.ValidFromPeriod = '01';
	              setToPush.ValidFromYear = currentYear;
	              setToPush.ValidToPeriod = '12';
	              setToPush.ValidToYear = currentYear;
	              break;
	    	}
	    	return setToPush;
		}
		//@END: Bug 243199
	};
});