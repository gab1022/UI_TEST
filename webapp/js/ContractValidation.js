sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"
], function (UnderScoreParse) {
	return {
		pickcontractFields: function (validContracts) {
			var neededContractFieldsArray = [];
			validContracts.forEach(function (e) {
				neededContractFieldsArray.push(UnderScoreParse.pick(e, ["contractid", "provcompcode", "bencompcode", "functionid",
					"functiondescription", "serviceid", "servicedescription", "activityid", "activitydescription", "agrvalfrom", "agrvalto"
				]));
			});
			return neededContractFieldsArray;
		},
		getAllowedContractsForCmobi: function (leg1Array, leg2Array, directFlag) {
			var allCombinedArray = [];
			leg1Array.forEach(function (e) {
				allCombinedArray = allCombinedArray.concat(e.combiAllowed);
			});
			leg2Array.forEach(function (e) {
				allCombinedArray = allCombinedArray.concat(e.combiAllowed);
			});
			if (directFlag) {
				var toReturn = this.getIntersectionContracts(allCombinedArray, "leg");
				toReturn.commonContract = UnderScoreParse.uniq(allCombinedArray, ["functionid",
					"serviceid", "activityid"
				]);
				return toReturn;
			} else {
				return this.getIntersectionContracts(allCombinedArray, "leg");
			}
		},
		getIntersectionContracts: function (allcontracts, groupper) {
			var commonArray = [];
			var contractDetails = [];
			groupper = groupper ? groupper : "contractid";
			var groupedObject = UnderScoreParse.groupBy(allcontracts, groupper); //mutiple Arrays 
			jQuery.each(groupedObject, function (keyVal, arrayVal) {
				contractDetails.push(UnderScoreParse.pick(arrayVal[0], ["contractid", "agrvalfrom", "agrvalto"]));
				jQuery.each(arrayVal, function (arIdx, arObj) {
					var common = true;
					jQuery.each(groupedObject, function (otherKeyVal, otherArray) {
						if (otherKeyVal !== keyVal) {
							var isPresentCheck = UnderScoreParse.where(otherArray, UnderScoreParse.pick(arObj, ["functionid",
								"serviceid", "activityid"
							]));
							if (!isPresentCheck.length) {
								common = false;
							}
						}
					});
					if (common) {
						commonArray.push(arObj);
					}
				});
			});
			commonArray = UnderScoreParse.uniq(commonArray, ["functionid", "serviceid", "activityid"]);
			return {
				commonContract: commonArray,
				contractDetails: contractDetails
			};
		},
		getFromContractDetails: function (context, filters) {
			var currentContext = this;
			var allData = context.getPropInModel("localDataModel", "/");
			return new Promise(function (resolve, reject) {
				var allContracts = [];
				var commonContract = [];
				if (filters.length > 0 && filters.length < 3) {
					var eventValues = {
						modelName: "contractODataModel",
						entitySet: "contractview",
						filters: filters[0],
						// filters: [],
						success: function (oContracts) {
							oContracts.results = oContracts.results.filter(function (e) {
								return e.hstatus === "Active" && e.servstatus !== "Blocked";
							});
							if (oContracts.results.length) {
								//get only for contracts applicable 
								var provArray = allData.providerCompanies;
								var benArray = allData.benifCompanies;
								var validContracts, mappedContracts = [];
								var neededContractFieldsArray;
								if (filters[0][0].sPath === "bencompcode") {
									validContracts = currentContext.getValidContracts(context, oContracts.results, provArray, "providercompcode",
										"provcompcode");
									neededContractFieldsArray = currentContext.pickcontractFields(validContracts);
									if (context.getPropInModel("localDataModel", "/fdrroute") !== "DIR") {
										jQuery.each(provArray, function (ix, ox) {
											var obj = {
												pro: ox.providercompcode,
												ben: "GB32",
												contArray: []
											};
											jQuery.each(neededContractFieldsArray, function (iy, oy) {
												if (oy.provcompcode === ox.providercompcode && oy.bencompcode === "GB32") {
													obj.contArray.push(oy);
												}
											});
											mappedContracts.push(obj);
										});
										var check = mappedContracts.filter(function (e) {
											return !e.contArray.length;
										}).length;
										if (check) {
											context.showMessage("Not All Providers have a mapping contract.");
										} else {
											jQuery.each(mappedContracts, function (ix, ox) {
												var combiAllow = UnderScoreParse.uniq(ox.contArray, ["functionid", "serviceid", "activityid"]);
												jQuery.each(combiAllow, function (iy, oy) {
													oy.leg = "L1" + ix;
												});
												ox.combiAllowed = combiAllow;
											});
										}
									} else {
										//console.log("Can not have direct here");
									}
								} else if (filters[0][0].sPath === "provcompcode") {
									validContracts = currentContext.getValidContracts(context, oContracts.results, benArray, "beneficiarycompcode",
										"bencompcode");
									neededContractFieldsArray = currentContext.pickcontractFields(validContracts);
									var mappedContractsBen = [];
									jQuery.each(benArray, function (ix, ox) {
										var obj = {
											pro: provArray[0].providercompcode,
											ben: ox.beneficiarycompcode,
											contArray: []
										};
										jQuery.each(neededContractFieldsArray, function (iy, oy) {
											if (oy.provcompcode === provArray[0].providercompcode && oy.bencompcode === ox.beneficiarycompcode) {
												obj.contArray.push(oy);
											}
										});
										mappedContractsBen.push(obj);
									});
									var check = mappedContractsBen.filter(function (e) {
										return !e.contArray.length;
									}).length;
									if (check) {
										context.showMessage("Not All Benficiary have a mapping contract.");
									} else {
										jQuery.each(mappedContractsBen,function(ix,ox){
											var combiAllow = UnderScoreParse.uniq(ox.contArray, ["functionid", "serviceid", "activityid"]);
											jQuery.each(combiAllow, function (iy, oy) {
												ox.leg = "L1" + ix;
											});
											ox.combiAllowed = combiAllow;
										});
										mappedContractsBen.forEach(function (e) {});
										var toResolveArray = currentContext.getAllowedContractsForCmobi(mappedContractsBen, [], true);
										resolve(toResolveArray);
									}
								}
								allContracts = allContracts.concat(neededContractFieldsArray);
							}
							if (filters.length > 1) {
								//is present only for leg two. where provider is always GB32
								var secondEventParams = {
									modelName: "contractODataModel",
									entitySet: "contractview",
									filters: filters[1],
									success: function (oSecContractsDetails) {
										oSecContractsDetails.results = oSecContractsDetails.results.filter(function (e) {
											return e.hstatus === "Active" && e.servstatus !== "Blocked";
										});
										var neededContractFieldsArray = [];
										var benArray = allData.benifCompanies;
										if (oSecContractsDetails.results.length) {
											var validContracts = currentContext.getValidContracts(context, oSecContractsDetails.results, benArray,
												"beneficiarycompcode", "bencompcode");
											neededContractFieldsArray = currentContext.pickcontractFields(validContracts);
										}
										allContracts = allContracts.concat(neededContractFieldsArray);
										//Check for each Company Code
										if (context.getPropInModel("localDataModel", "/fdrroute") !== "DIR") {
											var mappedContractsBen = [];
											jQuery.each(benArray, function (ix, ox) {
												var obj = {
													pro: "GB32",
													ben: ox.beneficiarycompcode,
													contArray: []
												};
												jQuery.each(neededContractFieldsArray, function (iy, oy) {
													if (oy.provcompcode === "GB32" && oy.bencompcode === ox.beneficiarycompcode) {
														obj.contArray.push(oy);
													}
												});
												mappedContractsBen.push(obj);
											});
											var check = mappedContractsBen.filter(function (e) {
												return !e.contArray.length;
											}).length;
											if (check) {
												context.showMessage("Not All Benficiary have a mapping contract.");
											} else {
												jQuery.each(mappedContractsBen, function (ix, ox) {
													var combiAllow = UnderScoreParse.uniq(ox.contArray, ["functionid", "serviceid", "activityid"]);
													jQuery.each(combiAllow, function (iy, oy) {
														oy.leg = "L2" + ix;
													});
													ox.combiAllowed = combiAllow;
												});
												var toResolveArray = currentContext.getAllowedContractsForCmobi(mappedContracts, mappedContractsBen);
												resolve(toResolveArray);
											}
										} else {
											//console.log("Can not have direct here");
										}
										// resolve(currentContext.getIntersectionContracts(allContracts));
									},
									error: function () {}
								};
								context.readDataFromOdataModel(secondEventParams);
							}
						},
						error: ""
					};
					context.readDataFromOdataModel(eventValues);
				} else {
					reject("Contract Validation Failed - Contact Admin");
				}
			});
		},
		getValidContracts: function (context, contractArray, validatingArray, assinginKey, takenKey) {
			var mappedContracts = UnderScoreParse.map(contractArray, function (obj) {
				obj[assinginKey] = obj[takenKey];
				return obj;
			});
			return context.checkForDuplicates(validatingArray, mappedContracts, [assinginKey]).duplicateArray;
		}
	};
});