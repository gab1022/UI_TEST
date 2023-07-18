sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		dateFormatter: function (sDate) {
			if (sDate) {
				return new Date(sDate);
			}
		},
		displayText: function (multiwbsrequiredfor) {
			switch (multiwbsrequiredfor) {
			case "UQEE":
				return "Employee Details";
			case "UQTA":
				return "Activity Details";
			case "UQAS":
				return "Asset Details";
			case "UQTT":
				return "Other Details";
			default:
				return "Employee Details";
			}
		},
		displayValueText: function (multiwbsrequiredfor) {
			switch (multiwbsrequiredfor) {
			case "UQEE":
				return "Employee Code";
			case "UQTA":
				return "Activity Code";
			case "UQAS":
				return "Asset Code";
			case "UQTT":
				return "Other Code";
			default:
				return "Employee Code";
			}
		}
	};

});