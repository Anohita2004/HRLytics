sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("LocalCrudApp.controller.Main", {

       onInit: function () {
    var oModel = new JSONModel({
        items: [],
        filteredItems: [],
        form: {
            id: "",
            name: "",
            designation: "",
            email: "",
            department: "",
            doj: "",
            salary: "",
            location: "",
            dob: "",
            status: ""
        },
        itemsCount: 0,
        filteredCount: 0
    });
    this.getView().setModel(oModel);

    // 💡 Fetch data from Flask backend
    var that = this;
    jQuery.ajax({
        url: "http://127.0.0.1:5000/api/data",
        method: "GET",
        success: function (data) {
            var convertedData = data.map(function (item) {
                return {
                    id: item.ID,
                    name: item.Name,
                    designation: item.Designation,
                    email: item.EMail,
                    department: item.Department,
                    doj: item.DateOfJoining,
                    salary: item.Salary,
                    location: item.Location,
                    dob: item.DateOfBirth,
                    status: item.Status
                };
            });

            oModel.setProperty("/items", convertedData);
            that._refreshFilteredItems();
        },
        error: function () {
            console.error("❌ Failed to fetch data from backend");
        }
    });
}
,
 _copyObject: function (oSource) {
            return JSON.parse(JSON.stringify(oSource));
        },

        onAdd: function () {
            var oModel = this.getView().getModel();
            var oForm = oModel.getProperty("/form");

            if (!oForm.id || !oForm.name) {
                MessageToast.show("Please enter both ID and Name!");
                return;
            }

            var aItems = oModel.getProperty("/items");
            aItems.push(this._copyObject(oForm));
            oModel.setProperty("/items", aItems);

            this._refreshFilteredItems();
            this._clearForm();
            this._syncWithFlask(); // 🔄
        },

        onUpdate: function () {
            var oModel = this.getView().getModel();
            var oForm = oModel.getProperty("/form");
            var aItems = oModel.getProperty("/items");

            var index = aItems.findIndex(function (item) {
                return item.id === oForm.id;
            });

            if (index !== -1) {
                aItems[index] = this._copyObject(oForm);
                oModel.setProperty("/items", aItems);
                this._refreshFilteredItems();
                this._clearForm();
                this._syncWithFlask(); // 🔄
            } else {
                MessageToast.show("Item with this ID not found.");
            }
        },

        onDelete: function () {
            var oModel = this.getView().getModel();
            var oForm = oModel.getProperty("/form");
            var aItems = oModel.getProperty("/items");

            var aFiltered = aItems.filter(function (item) {
                return item.id !== oForm.id;
            });

            oModel.setProperty("/items", aFiltered);
            this._refreshFilteredItems();
            this._clearForm();
            this._syncWithFlask(); // 🔄
        },

        onUndo: function () {
            this._clearForm();
        },

        onExport: function () {
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/items");

            var exportData = aItems.map(function (item) {
                return {
                    ID: item.id,
                    Name: item.name,
                    Designation: item.designation,
                    EMail: item.email,
                    Department: item.department,
                    DateOfJoining: item.doj,
                    Salary: item.salary,
                    Location: item.location,
                    DateOfBirth: item.dob,
                    Status: item.status
                };
            });

            jQuery.ajax({
                url: "http://127.0.0.1:5000/api/data",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(exportData),
                success: function () {
                    MessageToast.show("Exported to Flask/SQLite backend ✅");
                },
                error: function () {
                    MessageToast.show("Export failed ❌");
                }
            });

            // Save to local file
            var sData = JSON.stringify(aItems, null, 2);
            var blob = new Blob([sData], { type: "application/json" });
            var url = URL.createObjectURL(blob);

            var link = document.createElement("a");
            link.href = url;
            link.download = "exported_data.json";
            link.click();

            URL.revokeObjectURL(url);
        },

        onCardSelect: function (oEvent) {
            var oSelected = oEvent.getSource().getBindingContext().getObject();
            this.getView().getModel().setProperty("/form", this._copyObject(oSelected));
        },

        onFilter: function () {
            this._refreshFilteredItems();
        },

        onSortAsc: function () {
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/filteredItems");
            aItems.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            oModel.setProperty("/filteredItems", aItems);
        },

        onSortDesc: function () {
            var oModel = this.getView().getModel();
            var aItems = oModel.getProperty("/filteredItems");
            aItems.sort(function (a, b) {
                return b.name.localeCompare(a.name);
            });
            oModel.setProperty("/filteredItems", aItems);
        },

        onThemeToggle: function () {
            var oCore = sap.ui.getCore();
            var sCurrent = oCore.getConfiguration().getTheme();
            var sNew = sCurrent === "sap_fiori_3_dark" ? "sap_fiori_3" : "sap_fiori_3_dark";
            oCore.applyTheme(sNew);
        },

        onLaunchDashboard: function () {
            MessageToast.show("Launching Power BI Dashboard... 🚀");

            var oRequest = new XMLHttpRequest();
            oRequest.open("GET", "http://127.0.0.1:5000/launch_dashboard", true);
            oRequest.onreadystatechange = function () {
                if (oRequest.readyState === 4) {
                    if (oRequest.status === 200) {
                        MessageToast.show(oRequest.responseText);
                    } else {
                        MessageToast.show("Failed to launch dashboard 😢");
                    }
                }
            };
            oRequest.send();
        },

        _clearForm: function () {
            this.getView().getModel().setProperty("/form", {
                id: "", name: "", designation: "", email: "", department: "",
                doj: "", salary: "", location: "", dob: "", status: ""
            });
        },
        _syncWithFlask: function () {
    var oModel = this.getView().getModel();
    var aItems = oModel.getProperty("/items");

    var exportData = aItems.map(function (item) {
        return {
            ID: item.id,
            Name: item.name,
            Designation: item.designation,
            EMail: item.email,
            Department: item.department,
            DateOfJoining: item.doj,
            Salary: item.salary,
            Location: item.location,
            DateOfBirth: item.dob,
            Status: item.status
        };
    });

    jQuery.ajax({
        url: "http://127.0.0.1:5000/api/data",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(exportData),
        success: function () {
            console.log("Synced with Flask backend.");
        },
        error: function () {
            console.error("Failed to sync with backend.");
        }
    });
}
,

        _refreshFilteredItems: function () {
    var oModel = this.getView().getModel();
    var sQuery = this.byId("searchField").getValue().toLowerCase();
    var aItems = oModel.getProperty("/items") || [];

    var aFiltered = aItems.filter(function (item) {
        return (
            String(item.id).toLowerCase().includes(sQuery) ||
            String(item.name).toLowerCase().includes(sQuery) ||
            String(item.designation).toLowerCase().includes(sQuery)
        );
    });

    oModel.setProperty("/filteredItems", aFiltered);
    oModel.setProperty("/filteredCount", aFiltered.length);
    oModel.setProperty("/itemsCount", aItems.length);
}

    });
});

