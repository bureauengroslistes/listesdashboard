var STORES = {
    "88": "St-Jean-sur-Richelieu",
    "105": "St-Hyacinthe",
    "128": "St-Bruno-de-Montarville",
    "139": "Drummondville",
    "164": "Granby",
    "220": "Sorel-Tracy",
    "245": "Boucherville",
    "325": "Candiac",
    "427": "Beloeil"
};
var SHEET_URL = "https://docs.google.com/spreadsheets/d/1RUkDXJUWIutENxUZE8uS331EIgBkiFb2Uqb0Ns3GkKg/edit?gid=1222965783";
var PSK = "a61711e96496bcfce1c2931ec5c2cbe7";
var FORMDATA = {
    datetime: 0,
    storecity: 1,
    schoolname: 2,
    schoolclass: 3,
    schoolgroup: 4,
    childgender: 5,
    childname: 6,
    childcolor: 7,
    labelno: 8,
    specialrequest: 9,
    custname: 10,
    custphone: 11,
    custemail: 12,
    contactpref: 13,
    uniqueid: 14,
    status: 15
}
var FORMSTATUSSTR = ['Nouveau, pas commencé', 'Commencé, pas prêt', 'Prêt au ramassage', 'Ramassé']
var FORMSTATUS = {
    notstarted: 0,
    started: 1,
    pickupready: 2,
    pickupdone: 3
}


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

function uniqueID(arr) {
    var s = '';
    arr.forEach(function (el) {s = s + el});
    return md5(s);
}

var fbaseConfig = {
    apiKey: "AIzaSyDnzDOKKPKpIDgzYrkd8qN8zWzqQPPs6T8",
    authDomain: "listdashboard-1fabe.firebaseapp.com",
    databaseURL: "https://listdashboard-1fabe.firebaseio.com",
    projectId: "listdashboard-1fabe",
    storageBucket: "",
    messagingSenderId: "195799648359"
};
firebase.initializeApp(fbaseConfig);

var Dashdata = function () {
    // Private
    var self = {};

    // Public
    self.answers = Property([]);
    self.error = Property("");
    self.fbase = firebase.database();
    self.getStatuses = function(storeNumber) {
        return self.fbase.ref('/stores/' + storeNumber).once('value');
    }
    self.setStatus = function(storeNumber, uid, status) {
        var updates = {};
        updates[uid] = status;
        return self.fbase.ref('/stores/' + storeNumber).update(updates);
    }
    self.loadData = function(storeName, storeNumber) {
        showLoading(true, "Chargement des données...", "Le chargement de vos données est en cours, merci de patienter...");
        self.error("");
        self.answers([]);
        sheetrock({
            url: SHEET_URL,
            query: "select A,B,C,D,E,F,G,H,I,J,K,L,M,N where B = '" + storeName + "' order by A desc",
            reset: true,
            callback: function(error, options, response) {
                if (!error) {
                    var answers = [];
                    self.getStatuses(storeNumber).then(function(snapshot) {
                        var statuses = snapshot.val() || {};
                        response.rows.forEach(function (el) {
                            var uid = uniqueID(el.cellsArray);
                            el.cellsArray.push(uid);
                            el.cellsArray.push(statuses[uid] || 0)
                            answers.push(el.cellsArray);
                        });
                        self.answers(answers);
                        m.redraw()
                        showLoading(false);
                    }).catch(function(e) {
                        self.error("Une erreur est survenue lors de la récupération des données. (" + e + ") Veuillez contacter le développeur.");
                        m.redraw()
                        showLoading(false);
                    });
                } else {
                    self.error("Une erreur est survenue lors de la récupération des données. (" + error + ") Veuillez contacter le développeur.");
                    m.redraw()
                    showLoading(false);
                }
            }
        });
    };

    return self;
};

var data = Dashdata();

var Dashapp = {
    oninit: function() {
        // Private
        var self = this;

        // Public
        self.data = data;
        self.store = m.route.param("store");
        self.key = m.route.param("key");
        self.frontpage = Property(true);
        self.storeEntry = Property("");
        self.passEntry = Property("");
        self.answerIndex = Property(-1);

        self.loadStore = function() {
            m.route.set("/" + self.storeEntry() + "/" + md5(self.passEntry()));
        };
        self.reloadData = function() {
            data.loadData(STORES[self.store], self.store);
        };
        self.storeKeyUp = function(e) {
            if (e.keyCode == 13) {
                m.route.set("/" + self.storeEntry() + "/" + md5(self.passEntry()));
            }
        };
        self.printRow = function(rowno) {
            return function (e) {
                e.preventDefault();
                self.answerIndex(rowno);
                m.redraw();
                window.print();
            }
        };

        self.setStep = function(uid, idx, newStep) {
            return function (e) {
                e.preventDefault();
                e.target.setAttribute("disabled", "disabled");
                self.data.setStatus(self.store, uid, newStep).then(function () {
                    self.data.answers()[idx][FORMDATA.status] = newStep;
                    e.target.removeAttribute("disabled");
                    m.redraw();
                });
            }
        }

        if (self.store && self.store in STORES && self.key == PSK) {
            self.frontpage(false);
            data.loadData(STORES[self.store], self.store);
        }

        return self;
    },

    view: function() {
        var self = this;
        var notLoaded = self.frontpage();
        return m("div.container-fluid", [
                m("div", {className: "noprint"}, m("div" + (notLoaded ? ".row" : ""), m("div" + (notLoaded ? ".col-sm-6.col-sm-offset-3.col-md-4.col-md-offset-4" : ""), [
                topBanner(notLoaded),
                notLoaded ? m("div.jumbotron.row", [
                    m("div.col-sm-8.col-sm-offset-2.text-center", [
                        m("div.lead", "Numéro de magasin :"),
                        m("input.form-control", {type: "text", onchange: m.withAttr("value", self.storeEntry), onkeyup: self.storeKeyUp}),
                        m("div.lead.space-before", "Mot de passe :"),
                        m("input.form-control", {type: "password", onchange: m.withAttr("value", self.passEntry), onkeyup: self.storeKeyUp}),
                        m("button.btn.btn-primary.btn-lg.space-before", {onclick: self.loadStore}, "Charger les données...")
                    ])
                ]) : m("div.space-before", [
                    m("button.btn.btn-primary", {onclick: self.reloadData}, "Rafraîchir les données..."),
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
                                m("th", "Statut de la liste"),
                                m("th"),
                                m("th")
                        ])),
                        m("tbody", self.data.error() ? m("td.text-danger", self.data.error())
                        : (self.data.answers().length > 1) ? self.data.answers().filter(function(answer, index) {
                            return index != 0;
                        }).map(function(answer, idx) {
                            return m("tr.status" + String(answer[FORMDATA.status]), [
                                m("td", answer[FORMDATA.storecity]),
                                m("td", answer[FORMDATA.datetime]),
                                m("td", answer[FORMDATA.custname]),
                                m("td", answer[FORMDATA.custphone]),
                                m("td", answer[FORMDATA.custemail]),
                                m("td", answer[FORMDATA.childname]),
                                m("td", answer[FORMDATA.childgender]),
                                m("td", answer[FORMDATA.schoolname]),
                                m("td", answer[FORMDATA.schoolclass]),
                                m("td", answer[FORMDATA.schoolgroup]),
                                m("td.statuslbl", FORMSTATUSSTR[answer[FORMDATA.status]]),
                                m("td", m("button.btn.btn-success.btn-xs", {onclick: self.printRow(idx + 1)}, "Imprimer les détails...")),
                                m("td", m("button.btn" + (answer[FORMDATA.status] == FORMSTATUSSTR.length - 1 ? ".btn-danger" : ".btn-info") + ".btn-xs", {onclick: self.setStep(
                                    answer[FORMDATA.uniqueid],
                                    idx + 1, 
                                    answer[FORMDATA.status] == FORMSTATUSSTR.length - 1 ? 0 : answer[FORMDATA.status] + 1
                                )}, answer[FORMDATA.status] == FORMSTATUSSTR.length - 1 ? "Réinitialiser..." : "Avancer à " + FORMSTATUSSTR[answer[FORMDATA.status] + 1]))
                            ])
                        }) : m("td.text-warning", "Aucune donnée n'a été trouvée."))
                    ])
                ])
            ]))),
            notLoaded ? "" : m("div.onlyprint", (self.answerIndex() > -1) && (self.data.answers()) ? [
                m("h3", "Liste à préparer"),
                m("h4", "Client"),
                m("p", [
                    "Nom: " + self.data.answers()[self.answerIndex()][FORMDATA.custname],
                    m("br"),
                    "Tél.: " + self.data.answers()[self.answerIndex()][FORMDATA.custphone],
                    m("br"),
                    "Email: " + self.data.answers()[self.answerIndex()][FORMDATA.custemail],
                    m("br"),
                    "Contacter: " + self.data.answers()[self.answerIndex()][FORMDATA.contactpref]
                ]),
                m("hr"),
                m("h4", "Enfant"),
                m("p", [
                    "Nom: " + self.data.answers()[self.answerIndex()][FORMDATA.childname],
                    m("br"),
                    "Sexe: " + self.data.answers()[self.answerIndex()][FORMDATA.childgender],
                    m("br"),
                    "Couleur: " + self.data.answers()[self.answerIndex()][FORMDATA.childcolor] || "Aucune préférence.",
                    m("br"),
                    "Étiquette: " + self.data.answers()[self.answerIndex()][FORMDATA.labelno]
                ]),
                m("hr"),
                m("h4", "École"),
                m("p", [
                    "Nom: " + self.data.answers()[self.answerIndex()][FORMDATA.schoolname],
                    m("br"),
                    "Classe: " + self.data.answers()[self.answerIndex()][FORMDATA.schoolclass],
                    m("br"),
                    "Groupe: " + self.data.answers()[self.answerIndex()][FORMDATA.schoolgroup]
                ]),
                m("hr"),
                m("h4", "Demandes particulières"),
                m("p", [
                    self.data.answers()[self.answerIndex()][FORMDATA.specialrequest] || "Aucune demande spéciale."
                ])
            ] : m("h2", "Aucune donnée à imprimer."))
        ]);
    }
};

m.route(document.getElementById("hbcontents"), "/", {
    "/": Dashapp,
    "/:store/:key": Dashapp
});