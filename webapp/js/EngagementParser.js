sap.ui.define([
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/SERPProjectEvents", 
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/js/UnderScoreParse"
], function (SERPProjectEvents, UnderScoreParse) {
	return {
		getEngagementCurrency: function (context, benData, fdrCurr, fdrValue) {
			return new Promise(function (resolve, reject) {
				var currencyValues = {
					modelName: "serp150ODataModel",
					entitySet: "CustomerCurrencySet",
					filters: context.makeFilterArray(["Customer"], "EQ", benData.soldto).concat(context.makeFilterArray(["SalesOrg"], "EQ", benData.saleorg)),
					urlParameters: {},
					success: function (object) {
						if (object.results.length) {
							var engagmentCurrency = object.results[0].Currency ? object.results[0].Currency : fdrCurr;
						} else {
							engagmentCurrency = fdrCurr;
						}
						if (engagmentCurrency !== fdrCurr) {
							var date = new Date();
							date = date.toLocaleDateString().split("/")[2] + "-" + date.toLocaleDateString().split("/")[0] + "-" + date.toLocaleDateString()
								.split(
									"/")[1];
							var converValues = {
								modelName: "serp110ODataModel",
								entitySet: "CurrConvertSet",
								filters: context.makeFilterArray(["Date"], "EQ", date).concat(
									context.makeFilterArray(["ForeignCurrency"], "EQ", fdrCurr)).concat(
									context.makeFilterArray(["ForeignAmount"], "EQ", fdrValue)).concat(
									context.makeFilterArray(["LocalCurrency"], "EQ", engagmentCurrency)),
								urlParameters: "",
								success: function (oSuccessData) {
									if (oSuccessData.results.length) {
										resolve({
											cur: engagmentCurrency,
											val: parseFloat(oSuccessData.results[0].LocalAmount).toString()
										});
									}
								},
								error: ""
							};
							context.readDataFromOdataModel(converValues, true);
						} else {
							resolve({
								cur: engagmentCurrency,
								val: fdrValue
							});
						}
					},
					error: function (error) {

					}
				};
				context.readDataFromOdataModel(currencyValues, true);
			});
		},
		getDefaultsDIR: function (context) {
			return new Promise(function (resolve, reject) {
				var output = {
					EngObjValue: [],
					engCall: false
				};
				var filtersDC = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid"))
					.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
					.concat(context.makeFilterArray(["billingroute"], "EQ", "DIR"))
					.concat(context.makeFilterArray(["providersystem"], "EQ", context.getPropInModel("localDataModel", "/business") === 'UP' ? 'SERP' : "GSAP"))
					.concat(context.makeFilterArray(["deletionflag"], "NE", "X")); //@Task 316401

				var valuesDC = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "erpdcdetermination",
					filters: filtersDC,
					urlParameters: {},
					success: function (osuccessData) {
						output.engCall = true;
						//@START: Task 316401
						var providercompcode = context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode");
						var business = context.getPropInModel("localDataModel", "/business");
						var aDCList = SERPProjectEvents.getDistributionChannel(osuccessData.results, providercompcode, business);
						output.EngObjValue = aDCList;
						//@END: Task 316401
						resolve(output);
					},
					error: function () {},
				};
				context.readDataFromOdataModel(valuesDC);
			});
		},
		getDefaultsEBD: function (context) {
			var currentContext = this; //@Task 306866
			return new Promise(function (resolve, reject) {
				var output = {
					budgetholder: "",
					consumerLegOne: [],
					providerconfirmer: ""
				};
				//@START: Task 306866
				/*var values = {
					modelName: "serp150ODataModel",
					entitySet: "BudgetHolderSet",
					filters: context.makeFilterArray(["RcSysID"], "EQ", "GSAP").concat(context.makeFilterArray(["RcComp"], "EQ", "GB32")).concat(
						context.makeFilterArray(["DisCh"], "EQ", context.getPropInModel("localDataModel", "/dc"))).concat(
						context.makeFilterArray(["Currency"], "EQ", "USD")).concat(
						context.makeFilterArray(["Value"], "EQ", context.getPropInModel("localDataModel", "/planbudgetvalue"))).concat(
						context.makeFilterArray(["WBSE"], "EQ", "")),
					urlParameters: {},
					success: function (osuccessData) {
						try {
							output.budgetholder = UnderScoreParse.max(osuccessData.results, function (e) {
								return parseFloat(e.Limit);
							}).BhID;
						} catch (e) {
							context.showMessageToast("Budget Holder Not Maintained");
							context.setPropInModel("busyModel", "/flag", false);
							reject(e);
						}
						if (output.consumerLegOne.length && output.budgetholder && output.providerconfirmer) {
							resolve(output);
						}
					},
					error: function (e) {
						context.showMessage("Unable to Fetch Budget Holder, Engagement No not created ");
						context.setPropInModel("busyModel", "/flag", false);
						reject(e);
					},
				};
				context.readDataFromOdataModel(values);*/
				//Get Budget Holder from Feeder table
				currentContext.leg1BudgetHolderDetermination(context).then(function(oData) {
					output.budgetholder = oData[0].budgetholder;
					if (output.consumerLegOne.length && output.budgetholder && output.providerconfirmer) {
						resolve(output);
					}
				}).catch(function(oerror) {
					reject(oerror);
				});
				//@END: Task 306866
				var filters = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid"))
					.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
					.concat(context.makeFilterArray(["fundingroute"], "EQ", "EBD"))
					.concat(context.makeFilterArray(["soldtocustomer"], "EQ", "GB32"))
					.concat(context.makeFilterArray(["deletionflag"], "NE", "X"));
				var valuesNew = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "consumerdetermination",
					filters: filters,
					urlParameters: {},
					success: function (osuccessData) {
						output.consumerLegOne = osuccessData.results;
						if (!osuccessData.results.length) {
							context.showMessage("Please maintain Consumer for Leg 1 Entries");
							context.setPropInModel("busyModel", "/flag", false);
						}
						if (output.consumerLegOne.length && output.budgetholder && output.providerconfirmer) {
							resolve(output);
						}
					},
					error: "",
				};
				context.readDataFromOdataModel(valuesNew);
				var provfilters = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid")).concat(
					context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid"))).concat(
					context.makeFilterArray(["companycode"], "EQ", "GB32")).concat(context.makeFilterArray(["deletionflag"], "NE", "X"));
				var provValues = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "providerconfirmer",
					filters: provfilters,
					urlParameters: {},
					success: function (osuccessData) {
						if (osuccessData.results.length) {
							output.providerconfirmer = osuccessData.results[0].providerconfirmerid;
						} else {
							context.showMessage("Unable to Determine Provider Confirmer for Leg 2");
							context.setPropInModel("busyModel", "/flag", false);
						}
						if (output.consumerLegOne.length && output.budgetholder && output.providerconfirmer) {
							resolve(output);
						}
					},
					error: "",
				};
				context.readDataFromOdataModel(provValues);
			});
		},
		getDefaultsGCR: function (context, benData) {
			var currentContext = this; //@Task 306866
			return new Promise(function (resolve, reject) {
				var output = {
					budgetholder: "",
					consumer: "",
					recoverycc: "" //@Task 271625
				};
				if(context.getPropInModel("localDataModel","/benifCompanies/0/recoverycc")){//@Task 271625
					output.recoverycc = context.getPropInModel("localDataModel","/benifCompanies/0/recoverycc");//@Task 271625
				}else{
					context.showMessage("Please Maintain Recovery Cost Center in Beneficiaries");//@Task 271625
					context.setPropInModel("busyModel", "/flag", false);
				}
				var planbudgetvalue = context.getPropInModel("localDataModel", "/planbudgetvalue");
				if(planbudgetvalue === null) {
					planbudgetvalue = "";
				}
				//@START: Task 306866
				/*var values = {
					modelName: "serp150ODataModel",
					entitySet: "BudgetHolderSet",
					filters: context.makeFilterArray(["RcSysID"], "EQ", "GSAP").concat(context.makeFilterArray(["RcComp"], "EQ", "GB32")).concat(
						context.makeFilterArray(["DisCh"], "EQ", context.getPropInModel("localDataModel", "/dc"))).concat(
						context.makeFilterArray(["Currency"], "EQ", "USD")).concat(context.makeFilterArray(["Value"], "EQ", planbudgetvalue)),
						// .concat(context.makeFilterArray(["WBSE"], "EQ", context.getPropInModel("localDataModel", "/benifCompanies/0/mcswbsse") ? context.getPropInModel(
						// 	"localDataModel", "/benifCompanies/0/mcswbsse") : "")), //@Task 271625
					urlParameters: {},
					success: function (osuccessData) {
						try {
							output.budgetholder = UnderScoreParse.max(osuccessData.results, function (e) {
								return parseFloat(e.Limit);
							}).BhID;
						} catch (e) {
							context.showMessage("Unable to determine Budget Holder");
							context.setPropInModel("busyModel", "/flag", false);
							reject();
						}
						if (output.consumer && output.recoverycc && output.budgetholder) {//@Task 271625
							resolve(output);
						}
					},
					error: function (e) {
						context.showMessage("Unable to Fetch Budget Holder, Engagement No not created ");
						reject(e);
					},
				};
				context.readDataFromOdataModel(values);*/
				//Get Budget Holder from Feeder table
				currentContext.leg1BudgetHolderDetermination(context).then(function(oData) {
					output.budgetholder = oData[0].budgetholder;
					if (output.consumer.length && output.recoverycc && output.budgetholder) {
						resolve(output);
					}
				}).catch(function(oerror) {
					reject(oerror);
				});
				//@END: Task 306866
				var filters = context.makeFilterArray(["functionid"], "EQ", context.getPropInModel("localDataModel", "/funtionid"))
					.concat(context.makeFilterArray(["serviceid"], "EQ", context.getPropInModel("localDataModel", "/serviceid")))
					.concat(context.makeFilterArray(["fundingroute"], "EQ", context.getPropInModel("localDataModel", "/fdrroute")))
					.concat(context.makeFilterArray(["providercompcode"], "EQ", context.getPropInModel("localDataModel", "/providerCompanies/0/providercompcode")))
					.concat(context.makeFilterArray(["soldtocustomer"], "EQ", "GB32"))
					.concat(context.makeFilterArray(["deletionflag"], "NE", "X")); //@Bug 233329
				var valuesNew = {
					modelName: "fdrPlusFeedOdataModel",
					entitySet: "consumerdetermination",
					filters: filters,
					urlParameters: {},
					success: function (osuccessData) {
						try {
							output.consumer = osuccessData.results[0].consumer;
						} catch (e) {
							context.showMessage("Unable to determine Consumer from Feeder");
							context.setPropInModel("busyModel", "/flag", false);
						}
						if (output.budgetholder && output.recoverycc) {
							resolve(output);
						}
					},
					error: "",
				};
				context.readDataFromOdataModel(valuesNew);
			});
		},
		onMakeEnagementPayload: function (context) {
			var currentContext = this;
			this.budgetList = context.getView().getModel("localDataModel").getProperty("/addlProjDetails").filter(function (e) {
				return e.code === "PLBD" && e.deletionflag !== "X";
			});
			return new Promise(function (resolve, reject) {
				var allData = context.getPropInModel("localDataModel", "/");
				var headerData, proData, benData, itemNo, leg, refresh, EgStat, engobj, rcCodingArray, etotal, egno, Ecurr, prCoding;
				if (allData.fdrroute === "GCB" || allData.fdrroute === "GCF") {
					//@START: Task 274288
					var aActiveProviders = allData.providerCompanies.filter(function(o) {
						return o.deletionflag !== "X";
					});
					//@END: Task 274288
					var groupOfProv = UnderScoreParse.groupBy(aActiveProviders, "itemno");//@Task 274288
					var promiseArray = [];
					jQuery.each(groupOfProv, function (ix, ox) {
						etotal = "1";
						EgStat = "RLSD";
						//@START: Task 281044
						engobj = {
							engType: allData.fdrroute.slice(0,2), //"NP",
							recType: allData.coverage.slice(0,2)//"LS"
						};
						//@END: Task 281044
						headerData = allData;
						proData = ox[0];
						benData = {
							beneficiarycompcode: "GB32",
							rcgrpcomp: "1124",
							rcaoo: "GB32",
							consumer: "", // 
							budgetholder: "", //using MOA Table 
							invrecipent: "", //
							soldto: "GB32",
							billto: "GB32",
							shipto: "GB32",
							payer: "GB32",
							saleorg: proData.providercompcode,
							resys: "GSAP"
						};
						itemNo = "10";
						leg = "L1";
						refresh = false;
						rcCodingArray = [{
							Posnr: "10",
							Sposnr: "",
							Srvtp: "006",
							Prmat: "",
							// Pwbse: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "WBS" ? benData.BENWBSE : "" : '',
							// Costc: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "CC" ? benData.BENCOSTCEN : "" : '',
							Pwbse: "",
							Costc: "",
							Prfcn: "",
							Glacc: "",
							Objtp: "CC", //@Task 271625 - as its Leg 1 and using Recovery CC
							Obval: "", //will be determined
							Matnr: "",
							Delflg: "",
							Statco: "",
							Prmtx: "",
							Pwbtx: ""
						}];
						prCoding = [];
						var prItemNo = 10;
						ox.forEach(function (s) {
							prCoding.push({
								Posnr: prItemNo.toString(),
								Srvtp: "006",
								Wbse: s.providercosttyp === "WBS" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
								Pbukr: s.providercompcode,
								Prfcn: s.prprftcenter ? s.prprftcenter : "", //validation done and populated in validate provider function , // Task267414
								Costc: s.providercosttyp === "CC" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
								Prres: "",
								Delflg: "",
								Vbeln: "",
								SalesMatnr: engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
							});
							prItemNo = prItemNo + 10;
						});
						egno = "";
						if (ox[0].engagmentno) {
							refresh = true;
							egno = ox[0].engagmentno;
						}
						promiseArray.push(new Promise(function (arrayResolve, arrayReject) {
							var objectToMakeCall = {
								itemno: ix,
								leg: 1,
								payload: ""
							};
							// currentContext.getEngagementCurrency(context, benData, allData.currency, allData.planbudgetvalue).then(function (data) {
							Ecurr = allData.currency ? allData.currency : "USD";//@Task 234638
							// 	etotal = data.val;
							//add local Variables to Relevant Fields
							var allObjects = {
								headerData: headerData,
								proData: proData,
								benData: benData,
								itemNo: itemNo,
								leg: leg,
								refresh: refresh,
								EgStat: EgStat,
								engobj: engobj,
								rcCodingArray: rcCodingArray,
								etotal: etotal,
								egno: egno,
								Ecurr: Ecurr,
								prCoding: prCoding
							};

							currentContext.getDefaultsGCR(context, benData).then(function (outPut) {
								//@START: Bug 233329
								allObjects.benData.consumer = outPut.consumer;
								allObjects.benData.budgetholder = outPut.budgetholder;
								allObjects.benData.invrecipent = outPut.consumer;
								allObjects.rcCodingArray[0].Obval = outPut.recoverycc; //@Task 271625
								//@END: Bug 233329

								var payload = currentContext.getPayloadStructureFromData(allObjects.headerData, allObjects.proData, allObjects.benData,
									allObjects.itemNo, allObjects.leg, allObjects.refresh, allObjects.EgStat,
									allObjects.engobj, allObjects.rcCodingArray, allObjects.etotal, allObjects.egno, allObjects.Ecurr, allObjects.prCoding, context
								);
								//setting coding complete
								payload.Engmnt_PrCodHdr.Cdcmp = "X";
								payload.Engmnt_RcCodHdr.Cdcmp = "X";
								objectToMakeCall.payload = payload;
								arrayResolve(objectToMakeCall);
							}).catch(function(oerror) {
								context.showMessage(oerror);
							});
						}));
					});
					Promise.all(promiseArray).then(function (arrayOfObjects) {
						resolve(arrayOfObjects);
					});
				} else if (allData.fdrroute === "EBD") {
					var returnPayload = [];
					currentContext.getDefaultsEBD(context).then(function (outPut) {
						//leg 1 
						//@START: Task 274288
						var aActiveProviders = allData.providerCompanies.filter(function(o) {
							return o.deletionflag !== "X";
						});
						//@END: Task 274288
						//@START: Task 274288, 355205
						var aActiveBeneficiaries = allData.benifCompanies.filter(function(o) {
							return o.deletionflag !== "X";
						});
						//@END: Task 274288, 355205
						var groupOfProv = UnderScoreParse.groupBy(aActiveProviders, "itemno"); //@Task 274288
						jQuery.each(groupOfProv, function (it, ary) {
							var obj = {
								itemno: it,
								leg: 1,
								payload: ""
							};
							etotal = allData.planbudgetvalue;
							EgStat = "RLSD";
							engobj = {
								engType: ary[0].providercosttyp === "CC" ? "NP" : "PR",
								recType: ary[0].providercosttyp === "CC" ? "LS" : "TM"
							};
							headerData = allData;
							proData = ary[0];
							benData = {
								beneficiarycompcode: "GB32",
								rcgrpcomp: "1124",
								rcaoo: "GB32",
								consumer: outPut.consumerLegOne.filter(function (e) {
									return e.providercompcode === ary[0].providercompcode;
								}).length ? outPut.consumerLegOne.filter(function (e) {
									return e.providercompcode === ary[0].providercompcode;
								})[0].consumer : "",
								budgetholder: outPut.budgetholder, //using MOA Table 
								invrecipent: outPut.consumerLegOne.filter(function (e) {
									return e.providercompcode === ary[0].providercompcode;
								}).length ? outPut.consumerLegOne.filter(function (e) {
									return e.providercompcode === ary[0].providercompcode;
								})[0].consumer : "",
								soldto: "GB32",
								billto: "GB32",
								shipto: "GB32",
								payer: "GB32",
								saleorg: proData.providercompcode,
								resys: "GSAP",
								finyear: aActiveBeneficiaries[0].finyear //@Task 355205
							};
							itemNo = "10";
							leg = "L1";
							refresh = false;
							rcCodingArray = [{
								Posnr: "10",
								Sposnr: "",
								Srvtp: "006",
								Prmat: "",
								// Pwbse: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "WBS" ? benData.BENWBSE : "" : '',
								// Costc: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "CC" ? benData.BENCOSTCEN : "" : '',
								Pwbse: "",
								Costc: "",
								Prfcn: "",
								Glacc: "",
								Objtp: "WBS", // as its Leg 1 and using MCS WBS
								Obval: context.getPropInModel("localDataModel", "/benifCompanies/0/mcswbsse"), //will be determined
								Matnr: "",
								Delflg: "",
								Statco: "",
								Prmtx: "",
								Pwbtx: ""
							}];
							prCoding = [];
							var prItemNo = 10;
							ary.forEach(function (s) {
								prCoding.push({
									Posnr: prItemNo.toString(),
									Srvtp: "006",
									Wbse: s.providercosttyp === "WBS" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
									Pbukr: s.providercompcode,
									Prfcn: s.prprftcenter ? s.prprftcenter : "", //validation done and populated in validate provider function , // Task267414
									Costc: s.providercosttyp === "CC" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
									Prres: "",
									Delflg: "",
									Vbeln: "",
									SalesMatnr: engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
								});
								prItemNo = prItemNo + 10;
							});
							egno = "";
							//check oldEng 
							if (ary[0].engagmentno) {
								refresh = true;
								egno = ary[0].engagmentno;
							} else {
								refresh = false;
								egno = "";
							}
							Ecurr = allData.currency;
							var payload = currentContext.getPayloadStructureFromData(headerData, proData, benData, itemNo, leg, refresh, EgStat,
								engobj, rcCodingArray, etotal, egno, Ecurr, prCoding, context);
							//setting coding complete
							payload.Engmnt_PrCodHdr.Cdcmp = "X";
							payload.Engmnt_RcCodHdr.Cdcmp = "X";
							obj.payload = payload;
							returnPayload.push(obj);
						});

						// leg 2
						jQuery.each(aActiveBeneficiaries, function (ix, ox) { //@Task 274288
							var obj = {
								itemno: ox.itemno,
								leg: 2,
								payload: ""
							};
							etotal = ox.beneficiaryamt;
							headerData = allData;
							EgStat = "RLSD";
							engobj = {
								engType: "PR",
								recType: "TM"
							};
							proData = {
								providersystem: "GSAP",
								providergroupcompany: "1124",
								provideraoo: "GB32",
								providercompcode: "GB32",
								providercosttyp: "WBS",
								providercostobj: ox.sipcrecwbse,
								providerconfirmer: outPut.providerconfirmer
							};
							leg = "L2";
							prCoding = [{
								Posnr: "10",
								Srvtp: "006",
								Wbse: proData.providercosttyp === "WBS" ? (proData.providercostobj ? proData.providercostobj : "") : "", // Task267414
								Pbukr: proData.providercompcode,
								Prfcn: "", //validation done and populated in validate provider function ,
								Costc: proData.providercosttyp === "CC" ? (proData.providercostobj ? proData.providercostobj : "") : "", // Task267414
								Prres: "",
								Delflg: "",
								Vbeln: "",
								SalesMatnr: engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
							}];
							benData = {
								beneficiarycompcode: ox.erpcomcode,
								rcgrpcomp: ox.rcgrpcomp,
								rcaoo: ox.rcaoo,
								consumer: ox.consumer,
								budgetholder: ox.budgetholder, //using MOA Table 
								invrecipent: ox.invrecipent,
								soldto: ox.soldto,
								billto: ox.billto,
								shipto: ox.shipto,
								payer: ox.payer,
								saleorg: proData.providercompcode,
								resys: ox.resys,
								inapr: ox.autoapproval,
								finyear: ox.finyear //@Task 355205
							};
							rcCodingArray = [{
								Posnr: "10",
								Sposnr: "",
								Srvtp: "006",
								Prmat: "",
								// Pwbse: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "WBS" ? benData.BENWBSE : "" : '',
								// Costc: headerData.fdrroute !== 'e' ? benData.BENCOSTTYPE === "CC" ? benData.BENCOSTCEN : "" : '',
								Pwbse: "",
								Costc: "",
								Prfcn: "",
								Glacc: "",
								Objtp: ox.bencosttyp,
								Obval: ox.costobjval,
								Matnr: "",
								Delflg: "",
								Statco: "",
								Prmtx: "",
								Pwbtx: ""
							}];
							egno = "";
							itemNo = "10";
							//check oldEng 
							if (ox.engagmentno) {
								refresh = true;
								egno = ox.engagmentno;
							} else {
								refresh = false;
								egno = "";
							}
							Ecurr = allData.currency;
							var payload = currentContext.getPayloadStructureFromData(headerData, proData, benData, itemNo, leg, refresh, EgStat,
								engobj, rcCodingArray, etotal, egno, Ecurr, prCoding, context);
							//setting coding complete
							payload.Engmnt_PrCodHdr.Cdcmp = "X";
							payload.Engmnt_RcCodHdr.Cdcmp = "X";
							obj.payload = payload;
							returnPayload.push(obj);
						});
						resolve(returnPayload);
					}).catch(function(oerror) {
						context.showMessage(oerror);
					});
				} else if (allData.fdrroute === "DIR") {
					if (allData.business === "DS" || allData.business === "UP") {
						var returnPayload = [];
						currentContext.getDefaultsDIR(context).then(function (outPut) {
							jQuery.each(allData.benifCompanies, function (ix, ox) {
								var groupOfProv = UnderScoreParse.groupBy(allData.providerCompanies, "itemno");
								jQuery.each(groupOfProv, function (it, ary) {
									var obj = {
										proitemno: it,
										benitemno: ox.itemno,
										leg: 1,
										payload: ""
									};
									etotal = allData.planbudgetvalue;
									EgStat = outPut.EngObjValue.length ? outPut.EngObjValue[0].engagementstatus ? outPut.EngObjValue[0].engagementstatus :
										"RLSD" : "RLSD";
									headerData = allData;
									proData = ary[0];
									var defaultsRCType = context.getPropInModel("defaultsRecoveryTypeLocalModel", "/results").filter(function (e) {
										return e.systemid === proData.providersystem;
									});
									engobj = {
										engType: defaultsRCType.filter(function (e) {
											return e.fdrrecovertype === context.getPropInModel("localDataModel", "/fdrrecovertype");
										}).length ? defaultsRCType.filter(function (e) {
											return e.fdrrecovertype === context.getPropInModel("localDataModel", "/fdrrecovertype");
										})[0].ecttype : defaultsRCType[0].ecttype,
										recType: defaultsRCType.filter(function (e) {
											return e.fdrrecovertype === context.getPropInModel("localDataModel", "/fdrrecovertype");
										}).length ? defaultsRCType.filter(function (e) {
											return e.fdrrecovertype === context.getPropInModel("localDataModel", "/fdrrecovertype");
										})[0].rctype : defaultsRCType[0].rctype
									};
									benData = {
										beneficiarycompcode: ox.erpcomcode,
										rcgrpcomp: ox.rcgrpcomp,
										rcaoo: ox.rcaoo,
										consumer: ox.consumer,
										budgetholder: ox.budgetholder, //using MOA Table 
										invrecipent: ox.invrecipent,
										soldto: ox.soldto,
										billto: ox.billto,
										shipto: ox.shipto,
										payer: ox.payer,
										saleorg: proData.providercompcode,
										resys: ox.resys,
										sbmpo: ox.sbmpo,
										smgtd: ox.smgtd,
										ssgbs: ox.ssgbs,
										vendorno: ox.vendorno,
										inapr: ox.autoapproval
									};
									itemNo = "10";
									leg = "L1";
									refresh = false;
									rcCodingArray = [];
									jQuery.each(allData.rccoding, function (iy, oy) {
										if (oy.benitemno === ox.itemno && oy.bensubitemno === ox.subitemno) {
											rcCodingArray.push({
												Posnr: oy.itemno,
												Sposnr: "",
												Srvtp: oy.servicetype ? oy.servicetype : "",
												Prmat: "",
												Pwbse: oy.providerwbs ? oy.providerwbs : "",
												Costc: oy.costcenter ? oy.costcenter : "",
												Prfcn: oy.profitcenter ? oy.profitcenter : "",
												Glacc: oy.costobjtyp === "PO" ? "" : (oy.glaccount ? oy.glaccount : ""),//@Bug 251696
												Objtp: oy.costobjtyp, // as its Leg 1 and using MCS WBS
												Obval: oy.costobj, //will be determined
												Matnr: "",
												Delflg: "",
												Statco: oy.costobjtyp === 'CWBS' ? oy.statco : "",//@Bug
												Prmtx: "",
												Pwbtx: ""
											});
										}
									});
									prCoding = [];
									var prItemNo = 10;
									//@START: Task 223042
									if (ox.codeby === "CBPW") {
										ary.forEach(function (s) {
											jQuery.each(allData.rccoding, function (iy, oy) {
												if (oy.benitemno === ox.itemno && oy.bensubitemno === ox.subitemno) {
													prCoding.push({
														Posnr: prItemNo.toString(),
														Srvtp: "006",
														Wbse: oy.providerwbs ? (oy.providerwbs ? oy.providerwbs : "") : "", // Task267414
														Pbukr: s.providercompcode,
														Prfcn: s.prprftcenter ? s.prprftcenter : "", //validation done and populated in validate provider function , // Task267414
														Costc: s.providercosttyp === "CC" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
														Prres: "",
														Delflg: "",
														Vbeln: "",
														SalesMatnr: allData.business === "DS" && engobj.engType === "NP" ? "700002240" : ""
													});
													prItemNo = prItemNo + 10;
												}
											});
										});
									}
									else {
										ary.forEach(function (s) {
											prCoding.push({
												Posnr: prItemNo.toString(),
												Srvtp: "006",
												Wbse: s.providercosttyp === "WBS" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
												Pbukr: s.providercompcode,
												Prfcn: s.prprftcenter ? s.prprftcenter : "" , //validation done and populated in validate provider function , // Task267414
												Costc: s.providercosttyp === "CC" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
												Prres: "",
												Delflg: "",
												Vbeln: "",
												SalesMatnr: allData.business === "DS" && engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
											});
											prItemNo = prItemNo + 10;
										});
									}
									//@END: Task 223042
									egno = "";
									//check oldEng 
									if (ox.engagmentno) {
										refresh = true;
										egno = ox.engagmentno;
									} else {
										refresh = false;
										egno = "";
									}
									Ecurr = allData.currency;
									//@START: Bug 254541
									var aWbsPrCoding = prCoding.filter(function(o) {
										return o.Wbse !== "";
									});
									if(aWbsPrCoding.length) {
										prCoding = UnderScoreParse.uniq(prCoding, ["Wbse"]);//@Bug 248248	
									}
									//@END: Bug 254541
									var payload = currentContext.getPayloadStructureFromData(headerData, proData, benData, itemNo, leg, refresh, EgStat,
										engobj, rcCodingArray, etotal, egno, Ecurr, prCoding, context);
									//setting coding complete
									payload.Engmnt_PrCodHdr.Cdcmp = "X";
									payload.Engmnt_RcCodHdr.Cdcmp = "X";
									obj.payload = payload;
									returnPayload.push(obj);
								});
							});
							resolve(returnPayload);
						});
					}
				}
			});
		},
		getPayloadStructureFromData: function (headerData, proData, benData, itemNo, leg, refresh, EgStat, engobj, rcCodingArray, etotal, egno,
			Ecurr, prCoding, context) {
			var values = [];
			if (context.getPropInModel("localDataModel", "/fdrroute") === "DIR" && this.budgetList && this.budgetList.length) {
				var index = 10;
				this.budgetList.forEach(function (e) {
					values.push({
						Posnr: index > 90 ? index.toString() : "0" + index,
						Valtp: "006",
						Value: e.description, //amount
						Ecurr: Ecurr ? Ecurr : "USD",
						Eyear: e.value //year
					});
					index = index + 10;
				});
			} else {
				values.push({
					Posnr: "010",
					Valtp: "006",
					Value: etotal,
					Ecurr: Ecurr ? Ecurr : "USD",
					Eyear: context.getPropInModel("localDataModel", "/fdrroute") !== "EBD" ? new Date(headerData.fromdate).toISOString().split("-")[0] 
						: benData.finyear //@Task 355205
				});
			}
			return {
				Ecref: refresh ? egno : "",
				Action: refresh ? "U" : "C",
				Testrun: "",
				//CurrentGID: context.getPropInModel("localDataModel", "/createdby"), //@Bug 249610  ++INC0123662
				CurrentGID: context.getPropInModel("userDetailsModel", "/name"), //++INC0123662
				GSRFocal: context.getPropInModel("localDataModel", "/gsrfocal") ? context.getPropInModel("localDataModel", "/gsrfocal") : "",
				Engmnt_GenDetails: {
					FdrNo: headerData.fdrno ? headerData.fdrno : "",
					FdrPosnr: itemNo,
					FdrSurce: leg === "L1" ? "R" : "B",
					FdrRo: headerData.fdrroute,// === "GCB" ? "GCB" : headerData.fdrroute,//@Task 236929
					FdrBusin: headerData.business ? headerData.business : "",
					FdrSrvtp: headerData.SERVICETYPE ? headerData.SERVICETYPE : "",
					FdrSrvct: headerData.SERVICECAT ? headerData.SERVICECAT : "",
					Crdat: new Date().toISOString().split(".")[0],
					Aedat: new Date().toISOString().split(".")[0],
					Stdat: new Date(headerData.fromdate).toISOString().split(".")[0],
					Endat: new Date(headerData.todate).toISOString().split(".")[0],
					Stcde: EgStat,
					Ectyp: engobj.engType ? engobj.engType : "",
					Rctyp: engobj.recType ? engobj.recType : "",
					Ecref: refresh ? egno : "",
					// Feder: "",
					Ectle: headerData.fdrdescription.substring(0, 50), //determine
					Prsys: proData.providersystem ? proData.providersystem : "GSAP",
					Prcmp: proData.providergroupcompany, //proivider group company 
					Praoo: proData.provideraoo, //provider aoo 
					Perpc: proData.providercompcode, //provider entity
					//Prfcl: context.getPropInModel("userDetailsModel", "/name"), ++INC0123662
					Prfcl: context.getPropInModel("localDataModel", "/initiator"), //++INC0123662
					Prapr: proData.providerconfirmer ? proData.providerconfirmer : "", // add provider confirmer 
					Rcsys: benData.resys ? benData.resys : "GSAP",
					Rccmp: benData.rcgrpcomp, //ben group comp 
					Rcaoo: benData.rcaoo, //ben aoo
					Rerpc: benData.beneficiarycompcode,
					// Rcfcl: "", // Engagement Focal Point Determine ECC
					Rcapr: benData.consumer,
					// Cdmdn: "",
					Ecurr: Ecurr ? Ecurr : "USD",
					Rvowr: headerData.fundingmanager ? headerData.fundingmanager : "", //determine Ecc Revenue Owner
					Invrc: benData.invrecipent ? benData.invrecipent : "",
					Bdgth: benData.budgetholder ? benData.budgetholder : "",
					Etotal: etotal
				},
				Engmnt_PrCodHdr: {
					Soldt: benData.soldto,
					Stnam: "",
					Billt: benData.billto,
					Btnam: "",
					Shipt: benData.shipto,
					Spnam: "",
					Payer: benData.payer,
					Pname: "",
					Slorg: benData.saleorg ? benData.saleorg : proData.providercompcode,
					Disch: headerData.dc ? headerData.dc : "",
					// Divis: "",
					// Plant: "",
					Cdcmp: "",
					Sbdrq: proData.sbdrq === 'X' ? "X" : "",
					Inrrq: proData.inrrq === 'X' ? "X" : "",
					// Socrts: "",
					// Wbsrls: ""
				},
				Engmnt_RcCodHdr: {
					Vendr: benData.vendorno ? benData.vendorno : "",
					Vname: "",
					Cdcmp: "",
					Sbmpo: benData.sbmpo === "X" ? "X" : "",
					Ssgbs: benData.ssgbs === "X" ? "X" : "",
					Smgtd: benData.smgtd === "X" ? "X" : "",
					Inapr: (benData.resys === "EPBP" || benData.resys === "EPBR") ? (benData.inapr ? benData.inapr : "N") : "" //@Task 302226
				},
				Engmnt_Prcoding: prCoding && prCoding.length ? prCoding : [{
					Posnr: itemNo,
					Srvtp: "006",
					Wbse: proData.providercosttyp === "WBS" ? (proData.providercostobj ? proData.providercostobj : "") : "", // Task 267414
					Pbukr: proData.providercompcode,
					Prfcn: "", //validation done and populated in validate provider function ,
					Costc: proData.providercosttyp === "CC" ? (proData.providercostobj ? proData.providercostobj : "") : "", // Task 267414
					Prres: "",
					Delflg: "",
					Vbeln: "",
					SalesMatnr: headerData.business === "DS" && engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
				}],
				Engmnt_Rccoding: rcCodingArray,
				Engmnt_Values: values,
				Engmnt_Return: [{}]
			};
		},

		//@START: Task 223713 - RC Coding Validation
		validateRCCoding: function (context, aRCCodingData) {
			var compCode = context.getPropInModel("localDataModel", "/benifCompanies/0/beneficiarycompcode");
			var vendor = context.getPropInModel("localDataModel", "/benifCompanies/0/vendorno");
			var aCommonFilters = [].concat(context.makeFilterArray(["CompCode"], "EQ", compCode))
				.concat(context.makeFilterArray(["Vendor"], "EQ", vendor ? vendor : ""));
			context.getView().getModel("serp110ODataModelBatch").setDeferredGroups(["rcValidationGrp"]);
			aRCCodingData.forEach(function(oRCData) {
				var aFilters = aCommonFilters.concat(context.makeFilterArray(["GlAccount"], "EQ", oRCData.glaccount ? oRCData.glaccount : ""))
				.concat(context.makeFilterArray(["RcSysID"], "EQ", context.getPropInModel("localDataModel", "/benifCompanies/0/resys")))
				.concat(context.makeFilterArray(["RcComp"], "EQ", context.getPropInModel("localDataModel", "/benifCompanies/0/rcgrpcomp")))
				.concat(context.makeFilterArray(["RcAoo"], "EQ", context.getPropInModel("localDataModel", "/benifCompanies/0/rcaoo")))
				.concat(context.makeFilterArray(["ObjectType"], "EQ", oRCData.costobjtyp))
				.concat(context.makeFilterArray(["ObjectValue"], "EQ", oRCData.costobj ? oRCData.costobj : ""));
				context.getView().getModel("serp110ODataModelBatch").read("/RecipientVaidationSet", {
					groupId: "rcValidationGrp",
					filters: aFilters
				});
			});
			return new Promise(function(resolve, reject) {
				context.getView().getModel("serp110ODataModelBatch").submitChanges({
					groupId: "rcValidationGrp",
					success: function(odata) {
						var isError = false, errorMsg = "";
						odata.__batchResponses.forEach(function(obj) {
							if(obj.data.results[0].MsgType === "E") {
								isError = true;
								errorMsg += obj.data.results[0].MsgText + "\n";
							}
						});
						if(isError) {
							reject(errorMsg);
						}
						else {
							resolve("RC Coding details validated successfully");
						}
					},
					error: function(oerror) {
						reject("Error in validating RC Coding details");
					}
				});
			});
		},
		//@END: Task 223713
		
		//@START: Task 238325
		//Update Leg2 Engagement with FDR Number, FDR Route and FDR Source for GC route
		updateGCLeg2Engagement: function(context) {
			var aBenEngagements = context.getPropInModel("localDataModel", "/benifCompanies").filter(function(o) {
				return o.engagmentno !== "";                         
			});
			context.getView().getModel("serp150ODataModelBatch").setDeferredGroups(["gcLeg2Group"]);
			aBenEngagements.forEach(function(o) {
				var payload = {
					"FDRNo": context.getPropInModel("localDataModel", "/fdrno"),
					"EngNo": o.engagmentno, 
					"FDRRoute": context.getPropInModel("localDataModel", "/fdrroute"),
					"FDRSource": "B"//always B for Beneficiary for Leg2
				};
				context.getView().getModel("serp150ODataModelBatch").create("/FDRDetailsSet", payload, {
					groupId: "gcLeg2Group",
					success: function(odata, oresponse){},
					error: function(oerror){}
				});
			});
			context.getView().getModel("serp150ODataModelBatch").submitChanges({
				groupId: "gcLeg2Group",
				success: function(odata) {
					var isError = false, errorMsg = "";
					odata.__batchResponses.forEach(function(obj) {
						if(obj.__changeResponses) {
							obj.__changeResponses.forEach(function(o) {
								if(o.data.Status === "E") {
									isError = true;
									errorMsg += "Leg2 Engagement Number " + o.data.EngNo + " not found" + "\n";
								}
							});
						}
					});
					if(isError) {
						context.showMessageToast(errorMsg);
					}
					else {
						context.showMessageToast("GC Leg2 Engagements updated successfully");
					}
				},
				error: function(oerror) {
					context.showMessageToast("Error in updating Leg2 Engagements");
				}
			});	
		},
		//@END: Task 238325
		
		//@START: Task 232399
		closeFDRSerp: function(context, fdrno, engno) {//@Task 274288
			var finalcall = context.getPropInModel("localDataModel", "/fdrstatus") === "CLPRE" ? "3" : "2";
			var payload = {
				"FDRNo": fdrno,
				"FinalCall": finalcall
			};
			//@START: Task 274288
			if(engno) {
				payload.EngNo = engno;
				payload.FinalCall = "3";
			}
			//@END: Task 274288
			return new Promise(function(resolve, reject) {
				context.getView().getModel("serp110ODataModel").callFunction("/CloseFDR", {
					method: "POST",
					urlParameters: payload,
					success: function(odata, oresponse) {
						if(odata.MsgType === "S") {
							resolve();
						} else {
							reject(odata.Msg);
						}
					},
					error: function(oerror) {
						reject("Error in closing FDR: " + fdrno);
					}
				});
			});
		},
		
		releaseFDRComplex: function(context) {
			var payload = {
				"FDRNo": context.getPropInModel("localDataModel", "/fdrno"),
				"EngNo": context.getPropInModel("localDataModel", "/benifCompanies/0/engagmentno"), 
				"FDRRoute": context.getPropInModel("localDataModel", "/fdrroute"),
				"FDRSource": "R" //always R for provider for Complex projects
			};
			return new Promise(function(resolve, reject) {
				context.getView().getModel("serp150ODataModel").create("/FDRDetailsSet", payload, {
					success: function(odata, oresponse){
						resolve();
					},
					error: function(oerror) {
						reject();
					}
				});
			});
		},
		//@END: Task 232399
		
		//@START: Task 274288
		updateEngPrCoding: function(context, engno, aUpdatedEngProv) {
			var aPrCoding = [];
			var prItemNo = 10;
			aUpdatedEngProv.forEach(function (s) {
				var engobj = {
					engType: s.providercosttyp === "CC" ? "NP" : "PR",
					recType: s.providercosttyp === "CC" ? "LS" : "TM"
				};
				aPrCoding.push({
					Posnr: prItemNo.toString(),
					Srvtp: "006",
					Wbse: s.providercosttyp === "WBS" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
					Pbukr: s.providercompcode,
					Prfcn: s.prprftcenter ? s.prprftcenter : "", // Task267414
					Costc: s.providercosttyp === "CC" ? (s.providercostobj ? s.providercostobj : "") : "", // Task267414
					Prres: "",
					Delflg: "",
					Vbeln: "",
					SalesMatnr: engobj.engType === "PR" && engobj.recType === "TM" ? "700002240" : ""
				});
				prItemNo = prItemNo + 10;
			});
			var payload = {
				"EngNo": engno, 
				"PrCoding": aPrCoding
			};
			return new Promise(function(resolve, reject) {
				context.getView().getModel("serp150ODataModel").create("/PrCodingModificationSet", payload, {
					success: function(odata, oresponse){
						if(odata.ReturnCode === "S") {
							resolve();
						}
						else {
							reject();
						}
					},
					error: function(oerror) {
						reject();
					}
				});
			});
		},
		//@END: Task 274288
		
		//@START: Task 285644
		getConvertedAmount: function(context, fdrValue, fdrCurr) {
			var date = new Date();
			date = date.toLocaleDateString().split("/")[2] + "-" + date.toLocaleDateString().split("/")[0] + "-" + date.toLocaleDateString()
				.split("/")[1];
			return new Promise(function(resolve, reject) {
				var converValues = {
					modelName: "serp110ODataModel",
					entitySet: "CurrConvertSet",
					filters: context.makeFilterArray(["Date"], "EQ", date).concat(
						context.makeFilterArray(["ForeignCurrency"], "EQ", fdrCurr)).concat(
						context.makeFilterArray(["ForeignAmount"], "EQ", fdrValue)).concat(
						context.makeFilterArray(["LocalCurrency"], "EQ", "USD")),
					urlParameters: "",
					success: function (oData) {
						if (oData.results.length) {
							//@START: Task 320787
							if(oData.results[0].RetMsg) {
								resolve({
									RetMsg: oData.results[0].RetMsg
								});
							}
							else {
								resolve({
									cur: "USD",
									val: parseFloat(oData.results[0].LocalAmount)
								});
							}
							//@END: Task 320787
						}
						else {
							reject("Unable to get list of Provider Confirmers");
						}
					},
					error: function(oerror) {
						reject("Unable to get list of Provider Confirmers");
					}
				};
				context.readDataFromOdataModel(converValues, true);
			});
		},
		//@END: Task 285644
		
		//@START: Task 306866
		leg1BudgetHolderDetermination: function(context) {
			return new Promise(function(resolve, reject) {
				var callingObject = {
					url: "/GF_SCP_HANADB/com/shell/cumulus/fdrplus/services/budgetholderdetermination.xsjs",
					payload: {
						functionid: context.getPropInModel("localDataModel", "/funtionid"),
						serviceid: context.getPropInModel("localDataModel", "/serviceid"),
						fundingroute: context.getPropInModel("localDataModel", "/fdrroute")
					},
					success: function (oData) {
						if (oData.OBUDGETHOLDER.length) {
							resolve(oData.OBUDGETHOLDER);
						}
						else {
							//context.showMessage("Budget Holder Not Maintained, Engagement No not created");
							context.setPropInModel("busyModel", "/flag", false);
							reject("Budget Holder Not Maintained, Engagement No not created");
						}
					},
					error: function (oerror) {
						//context.showMessage("Unable to Fetch Budget Holder, Engagement No not created");
						context.setPropInModel("busyModel", "/flag", false);
						reject("Unable to Fetch Budget Holder, Engagement No not created");
					},
					typeOfCall: "POST"
				};
				context.makeAjaxCall(callingObject.url, callingObject.payload, callingObject.success, callingObject.error, callingObject.typeOfCall);
			});
		},
		//@END: Task 306866
		
		//@START: Task 332986
		onMakeEngagementPayloadComplex: function(context) {
			return new Promise(function(resolve, reject) {
				var allData = context.getPropInModel("localDataModel", "/");
				//ECT payload
				var payload = {
					"Ecref": allData.benifCompanies[0].engagmentno,
					"CurrentGID": context.getPropInModel("userDetailsModel", "/name"),
					"GenDetailsSet": {
						"FdrNo": allData.fdrno,
						"FdrRo": allData.fdrroute,
						"FdrSurce": "R", //always R for complex projects
						"Endat": allData.todate,
						"Ectle": allData.fdrdescription,
						"Prapr": allData.providerCompanies[0].providerconfirmer,
						"Rcapr": allData.benifCompanies[0].consumer,
						"Invrc": allData.benifCompanies[0].invrecipent,
						"Bdgth": allData.benifCompanies[0].budgetholder,
						"Rvowr": allData.fundingmanager
					},
					"ValuesSet": [],
					"ReturnSet": [{}]
				};
				var index = 10;
				var aBudgetList = allData.addlProjDetails.filter(function (e) {
					return e.code === "PLBD" && e.deletionflag !== "X";
				});
				aBudgetList.forEach(function(o) {
					var oBudget = {
						"Posnr": index > 90 ? index.toString() : "0" + index,
					    "Valtp": "006",
					    "Eyear": o.value,
					    "Value": o.description,
					    "Ecurr": allData.currency
					};
					payload.ValuesSet.push(oBudget);
					index = index + 10;
				});
				resolve(payload);
			});
		}
		//@END: Task 332986
	};
});