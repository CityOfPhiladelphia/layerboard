/*
The Controller handles events from the UI that have some effect on routing or
data fetching. It is a "thin" class that mostly proxies events to the router and
data manager, and facilitates communication between them.
*/

import Router from './router';
// import DataManager from './data-manager';

class Controller {
  constructor(opts) {
    const store = this.store = opts.store;
    const config = this.config = opts.config;
    const eventBus = this.eventBus = opts.eventBus;
    this.history = window.history;

    // the router and data manager need a ref to the controller
    opts.controller = this;

    // create router
    // opts.dataManager = dataManager;
    this.router = new Router(opts);
  }

  /*
  EVENT HANDLERS
  */

  appDidLoad() {
    // route once on load
    this.router.hashChanged();
  }

  handleSearchFormSubmit(e) {
    console.log('handle search form submit', e, this);
    const input = e.target[0].value;

    this.store.commit('setLastSearchMethod', 'geocode');
    this.store.commit('setClickCoords', null);
    this.store.commit('setGeocodeStatus', null);
    this.store.commit('setGeocodeInput', input);

    // tell router
    this.router.routeToAddress(input);
  }

  handleCheckboxClick(topic) {
    // console.log('Controller.handleTopicHeaderClick', topic);
    this.router.routeToTopic(topic);
  }

  handleCheckboxUnClick(topic) {
    this.router.routeOffTopic(topic);
  }

  goToDefaultAddress(address) {
    this.router.routeToAddress(address);
  }
}

export default Controller;
