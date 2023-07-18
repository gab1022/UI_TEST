sap.ui.define([
	"sap/m/UploadCollection"
], function (UploadCollection) {
	"use strict";

	return UploadCollection.extend("com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.js.CustomUploadCollection", {

		metadata: {},
		/**
		 * Sets the upload url by changing the instant upload to true then sets it back to false again
		 * We need to override the uploadurl for the files pending for upload since changing the
		 * upload url is not allowed if the instant upload of the upload collection is set to false
		 */
		setUploadUrl: function (value) {
			this.setProperty("instantUpload", true, true); // disables the default check
			if (sap.m.UploadCollection.prototype.setUploadUrl) {
				for (var i = 0; i < this._aFileUploadersForPendingUpload.length; i++) {
					this._aFileUploadersForPendingUpload[i].setUploadUrl(value);
				}
				// ensure that the default setter is called. Doing so ensures that every extension or change will be executed as well.
				sap.m.UploadCollection.prototype.setUploadUrl.apply(this, arguments);
				// Because before we call the original function we override the instantUpload property for short time, to disable the check
			}
			// Afterwards we set back the instantUpload property to be back in a save and consistent state
			this.setProperty("instantUpload", false, true);
		},
		
		renderer: "sap.m.UploadCollectionRenderer"

	});
});