define([
    'arches',
    'underscore',
    'knockout',
    'views/project-manager/identity-list',
    'views/project-manager/resource-list',
    'models/project',
    'bindings/sortable'
], function(arches, _, ko, IdentityList, ResourceList, ProjectModel) {
    /**
    * A base viewmodel for project management
    *
    * @constructor
    * @name ProjectManagerViewModel
    *
    * @param  {string} params - a configuration object
    */
    var ProjectManagerViewModel = function(params) {
        var self = this;
        this.dateFormat = 'YYYY-MM-DD';

        this.identityList = new IdentityList({
            items: ko.observableArray(params.identities)
        });

        this.flattenCards = function(r) {
            var addedCardIds = [];
            _.each(r.cards, function(card) {
                if (card.cards.length > 0) {
                    _.each(card.cards, function(subcard) {
                        subcard.name = card.name + ' - ' + subcard.name;
                        r.cardsflat.push(subcard)
                        addedCardIds.push(subcard.cardid)
                    })
                }
            });
            _.each(r.cards, function(card) {
                if (_.contains(addedCardIds, card.cardid) === false && card.cards.length == 0) {
                    addedCardIds.push(card.cardid)
                    r.cardsflat.push(card)
                }
            });
        }

        _.each(params.resources, function(r){
            r.cardsflat = ko.observableArray();
            self.flattenCards(r);
        });

        this.resourceList = new ResourceList({
            items: ko.observableArray(params.resources)
        });

        this.resourceList.selected.subscribe(function(val){
            var flatten = function(scope) {
                return function(data){
                    var self = scope;
                    self.resourceList.initCards(data.cards)
                    self.resourceList.selected().cards(data.cards)
                    self.flattenCards(self.resourceList.selected())
                }
            }

            if (val) {
                if (ko.unwrap(val.cards).length === 0) {
                    $.ajax({
                        url: arches.urls.resource_cards.replace('//', '/' + val.id + '/')
                    })
                    .done(flatten(self))
                    .fail(function(data){console.log('card request failed', data)})
                }
            }
        }, self);

        this.projects = ko.observableArray(
            params.projects.map(function (project) {
                return new ProjectModel({
                    source: project,
                    identities: params.identities
                });
            })
        );

        this.projectFilter = ko.observable('');
        this.filteredProjects = ko.computed(function () {
            var filter = self.projectFilter();
            var list = self.projects();
            if (filter.length === 0) {
                return list;
            }
            return _.filter(list, function(project) {
                return project.name().toLowerCase().indexOf(filter.toLowerCase()) >= 0;
            });
        });

        this.loading = ko.observable(false);
        this.selectedProject = ko.observable(null);

        this.selectedProject.subscribe(function(val){
            if (val) {
                self.identityList.clearSelection();
                self.identityList.items()[0].selected(true);
                self.resourceList.clearSelection();
                self.resourceList.items()[0].selected(true);
                self.resourceList.resetCards(val.cards());
                val.update();
            }
        });

    };
    return ProjectManagerViewModel;
});
