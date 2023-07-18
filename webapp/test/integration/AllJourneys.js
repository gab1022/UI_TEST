/* global QUnit*/

sap.ui.define([
	"sap/ui/test/Opa5",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/test/integration/pages/App",
	"com/shell/gf/cumulus/fdrplus/gfcumulusfdrcreat/test/integration/navigationJourney"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.shell.gf.cumulus.fdrplus.gfcumulusfdrcreat.view.",
		autoWait: true
	});
});