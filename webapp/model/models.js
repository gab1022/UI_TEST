sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";
	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createTileIdenfier: function (role) {
			var oModel = new JSONModel({
				role: role
			});
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createUserModel: function () {
			var userModel = new sap.ui.model.json.JSONModel();
			userModel.loadData("/services/userapi/currentUser", null, false);
			return userModel;
		},
		createLoadIndicatorModel: function(){
			return new JSONModel({});
		},
		//@START: Task 271624
		createFdrHistoryYearModel: function () {
			var aYears = [], currentYear = new Date().getFullYear();
			for(var i=-5; i<=5; i++) {
				aYears.push({year: currentYear + i});
			}
			var oModel = new JSONModel({
				cYear: currentYear,
				minYear: aYears[0].year,
				maxYear: aYears[aYears.length - 1].year,
				years: aYears
			});
			return oModel;
		}
		//@END: Task 271624
	};
});