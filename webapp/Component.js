sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			this.demoSwitch = true;
			var check = this.getComponentData();
			var role;
			if (check) {
				role = check.startupParameters["role"][0];
				if (!role) {
					role = "GSR";
				}
			} else {
				if (this.demoSwitch) {
					role = "GSR"; //GSR/GSRWF/PRC/CNC/RNA/ADMIN/SUPADM/DISPLAY
				}
			}
			// enable routing
			this.getRouter().initialize();
			this.setModel(models.createTileIdenfier(role),"tileIdentityModel");
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.setModel(new sap.ui.model.json.JSONModel({flag:false}),"busyModel");
			//set UserDetails Model for sap.m.App
			this.setModel(models.createUserModel(), "userDetailsModel");
			this.setModel(models.createLoadIndicatorModel(), "loadIndicatorModel");
			this.setModel(models.createFdrHistoryYearModel(), "fdrHistoryYearModel"); //@Task 271624
		}
	});
});