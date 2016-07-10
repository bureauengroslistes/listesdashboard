var STORES = {"139": "Drummondville", "220": "Sorel", "245": "Boucherville"};
var SHEET_URL = "https://docs.google.com/spreadsheets/d/1CAAR3P6PM2NwHPlyeDfRNQshZyaH8X2mw4ZwxJ_r1CU/pubhtml?gid=1745505354";


var topBanner = function(notLoaded) {
    notLoaded = notLoaded || false;
    return m("div.row" + (notLoaded ? ".text-center" : ""), m("div.col-sm-12", [
                m("img" + (notLoaded ? ".jfdlogo" : ".jfdlogotop"), {src: "/img/logojfdtr.png"}),
                m("h2.apptitle", "Tableau de bord des listes scolaires par Jean-François Desrochers"),
                m("p", "Consultez ici toutes les commandes de préparation de listes scolaires pour votre magasin.")
            ]));
};

function showLoading(show, title, message) {
    if (show) {
        document.getElementById("loadtitle").textContent = title;
        document.getElementById("loadmessage").textContent = message;
        document.getElementById("loadscreen").classList.add("show");
    } else {
        document.getElementById("loadscreen").classList.remove("show");
    }
}

function loadingDone(title, message, reload) {
    document.getElementById("loadtitle").textContent = title;
    document.getElementById("loadmessage").textContent = message;
    var loadscreen = document.getElementById("loadscreen");
    loadscreen.classList.add("done");
    reload = reload || false;
    setTimeout(function() {
        loadscreen.classList.remove("show");
        loadscreen.classList.remove("done");
        if (reload) m.redraw();
    }, 2000);
}

var Dashdata = function () {
    // Private
    var self = {};

    // Public
    self.answers = m.prop([]);
    self.loadData = function(storeName) {
        showLoading(true, "Chargement des données...", "Le chargement de vos données est en cours, merci de patienter...");
        var sheet = new Tabletop({key: SHEET_URL, simpleSheet: true, callback: function(data) {
            m.startComputation();
            self.answers(data);
            m.endComputation();
            showLoading(false);
        }});
    };

    return self;
};

var Dashapp = {
    controller: function(data) {
        // Private
        var self = {};

        // Public
        self.data = data;
        self.store = m.route.param("store");
        self.frontpage = m.prop(true);
        self.storeEntry = m.prop("");
        self.answerIndex = m.prop(-1);

        self.loadStore = function() {
            m.route("/" + self.storeEntry());
        };
        self.reloadData = function() {
            data.loadData(STORES[self.store]);
        };
        self.storeKeyUp = function(e) {
            if (e.keyCode == 13) {
                m.route("/" + self.storeEntry());
            }
        };
        self.printRow = function(rowno) {
            self.answerIndex(rowno);
            m.redraw();
            window.print();
        };

        if (self.store && self.store in STORES) {
            self.frontpage(false);
            data.loadData(STORES[self.store]);
        }

        return self;
    },

    view: function(ctrl) {
        var notLoaded = ctrl.frontpage();
        return m("div.container-fluid", [
                m("div", {className: "noprint"}, m("div" + (notLoaded ? ".row" : ""), m("div" + (notLoaded ? ".col-sm-6.col-sm-offset-3.col-md-4.col-md-offset-4" : ""), [
                topBanner(notLoaded),
                notLoaded ? m("div.jumbotron.row", [
                    m("div.col-sm-8.col-sm-offset-2.text-center", [
                        m("div.lead", "Numéro de magasin :"),
                        m("input.form-control", {type: "text", onchange: m.withAttr("value", ctrl.storeEntry), onkeyup: ctrl.storeKeyUp}),
                        m("button.btn.btn-primary.btn-lg.space-before", {onclick: ctrl.loadStore}, "Charger les données...")
                    ])
                ]) : m("div.space-before", [
                    m("button.btn.btn-primary", {onclick: ctrl.reloadData}, "Rafraîchir les données..."),
                    m("table.table.table-bordered.table-striped.space-before", [
                        m("thead", m("tr", [
                            m("th", "Magasin"),
                                m("th", "Date et heure de soumission"),
                                m("th", "Nom du client"),
                                m("th", "Téléphone du client"),
                                m("th", "Courriel du client"),
                                m("th", "Nom de l'enfant"),
                                m("th", "Garçon ou fille"),
                                m("th", "Nom de l'école"),
                                m("th", "Niveau de la classe"),
                                m("th", "Nom de la classe"),
                                m("th", "Numéro de l'étiquette"),
                                m("th")
                        ])),
                        m("tbody", ctrl.data.answers().filter(function(answer) {
                            return answer.storecity == STORES[ctrl.store];
                        }).map(function(answer) {
                            return m("tr", [
                                m("td", answer.storecity),
                                m("td", answer.datetime),
                                m("td", answer.custname),
                                m("td", answer.custphone),
                                m("td", answer.custemail),
                                m("td", answer.childname),
                                m("td", answer.childgender),
                                m("td", answer.schoolname),
                                m("td", answer.schoolclass),
                                m("td", answer.schoolgroup),
                                m("td", answer.labelno),
                                m("td", m("button.btn.btn-success.btn-xs", {onclick: ctrl.printRow.bind(null, ctrl.data.answers().indexOf(answer))}, "Imprimer..."))
                            ])
                        }))
                    ])
                ])
            ]))),
            notLoaded ? "" : m("div.onlyprint", ctrl.answerIndex() > -1 ? [
                m("h3", "Liste à préparer"),
                m("h4", "Client"),
                m("p", [
                    ctrl.data.answers()[ctrl.answerIndex()].custname,
                    m("br"),
                    ctrl.data.answers()[ctrl.answerIndex()].custphone,
                    m("br"),
                    ctrl.data.answers()[ctrl.answerIndex()].custemail
                ]),
                m("h4", "Enfant"),
                m("p", [
                    ctrl.data.answers()[ctrl.answerIndex()].childname,
                    m("br"),
                    ctrl.data.answers()[ctrl.answerIndex()].childgender,
                    m("br"),
                    "Étiquette #" + ctrl.data.answers()[ctrl.answerIndex()].labelno
                ]),
                m("h4", "École"),
                m("p", [
                    ctrl.data.answers()[ctrl.answerIndex()].schoolname,
                    m("br"),
                    ctrl.data.answers()[ctrl.answerIndex()].schoolclass,
                    m("br"),
                    ctrl.data.answers()[ctrl.answerIndex()].schoolgroup
                ])
            ] : m("h2", "Aucunes données à imprimer."))
        ]);
    }
};