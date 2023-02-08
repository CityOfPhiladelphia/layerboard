# layerboard ([@phila/layerboard](https://www.npmjs.com/package/@phila/layerboard) in [npmjs.com](https://npmjs.com))

layerboard is a framework for creating app that are portals for viewing and downloading data from the City of Philadelphia.

For example, [Openmaps](https://github.com/CityOfPhiladelphia/openmaps) is built using layerboard.

![](https://s3.amazonaws.com/mapboard-images/OpenMaps2.JPG)

Also, [StreetSmartPHL](https://github.com/CityOfPhiladelphia/StreetSmartPHL) is built using layerboard.

![](https://s3.amazonaws.com/mapboard-images/StreetSmart.JPG)

## Usage
Check out [the wiki](https://github.com/CityOfPhiladelphia/layerboard/wiki) for usage documentation.

## Example Sites

See the examples [Openmaps](https://openmaps.phila.gov) and [StreetSmartPHL](https://streetsmartphl.phila.gov/).

## Release Notes

### 2.0.2 - 2/8/2023

* uses upgraded @phila packages
* ran package updates

### 2.0.1 - 9/9/2022

* uses upgraded @phila packages
* ran package upgrade

### 2.0.0 - 7/26/2021

* uses @phila packages that use npm for package commands
* requires using npm for all package commands

### 1.1.14 - 10/27/2020

* uses github actions for pushing to npmjs, uses vue router

### 1.1.13 - 10/7/2020

* uses upgraded vue libraries:
    * @phila/vue-mapping 2.2.9
    * @phila/vue-comps 2.1.15
    * @phila/vue-datafetch 1.4.3

### 1.1.12 - 9/18/2020

* uses pvm 2.2.7 which changes the map address input

### 1.1.11 - 9/18/2020

* changes for streetsmart

### 1.1.10 - 9/17/2020

* adds a layer name if the checkbox is hidden
* adds space between symbols and labels in legends

### 1.1.9 - 9/17/2020

* uses pvc 2.1.12 that fixes checkboxes, allows placement of controls

### 1.1.8 - 9/17/2020

* uses pvc 2.1.10 which adds infoBox.vue component

### 1.1.7 - 9/16/2020

* uses pvd 1.4.2 with updates for layerboard bugs

### 1.1.6 - 9/16/2020

* fixes moving map to geocode location when you first geocode

### 1.1.5 - 8/13/2020

* fixes bug with cyclomedia activation

### 1.1.4 - 7/29/2020

* upgrades to all @phila/vue libraries

### 1.1.3 - 6/23/2020

* upgrades @phila/vue-mapping with new dependencies

### 1.1.2 - 5/27/2020

* upgrades all packages

### 1.1.1 - 5/7/2020

* allows ordering of popups

### 1.1.0 - 5/6/2020

* uses minor releases of libraries:
  * @phila/vue-comps 2.1.1
  * @phila/vue-mapping 2.1.1
  * @phila/vue-datafetch 1.2.0

### 1.0.1 - 2/3/2020

* uses new locations for phila libraries:
  * @phila/vue-comps 2.0.9
  * @phila/vue-mapping 2.0.5
  * @phila/vue-datafetch 1.1.7
* pushes to @phila/layerboard instead of @philly/layerboard

### 1.0.0 - 12/17/2019

* Uses new major releases:
  * Uses @philly/vue-comps 2.0.0
  * Uses @philly/vue-mapping 2.0.0
  * Uses @philly/vue-datafetch 1.0.0

### 0.0.37 - 10/23/2019

* fixes linting issue

### 0.0.36 - 10/23/2019

* you have to use the following (at minimum) with this:

    "@vue/cli-plugin-babel": "^4.0.5",
    "@vue/cli-plugin-eslint": "^4.0.5",
    "@vue/cli-service": "^4.0.5",

### 0.0.35 - 10/9/2019

* Uses pvc 1.0.42, allows LegendBox class to be passed in

### 0.0.34 - 10/9/2019

* Uses update to L.esri.Webmap to add datetime to popups

### 0.0.33 - 10/8/2019

* Uses new releases of @philly libraries which fix bugs:
  * Uses @philly/vue-comps 1.0.41
  * Uses @philly/vue-datafetch 0.0.27

### 0.0.32 - 10/8/2019

* Attempted bug fix for streetsmartphl

### 0.0.31 - 10/7/2019

* Uses new releases of @philly libraries which ran upgrades:
  * Uses @philly/vue-comps 1.0.40
  * Uses @philly/vue-mapping 1.0.41
  * Uses @philly/vue-datafetch 0.0.26

### 0.0.30 - 9/6/2019

* Adds lines to store.js to handle new "fullScreen" changes in pvc

### 0.0.29 - 9/6/2019

* Uses new releases of @philly libraries which ran upgrades:
  * Uses @philly/vue-comps 1.0.37
  * Uses @philly/vue-mapping 1.0.36
  * Uses @philly/vue-datafetch 0.0.24

### 0.0.28 - 8/26/2019

* Allows you to set initial imagery in the config

### 0.0.27 - 8/9/2019

* Uses new releases of @philly libraries which use axios 0.19.0:
  * Uses @philly/vue-comps 1.0.36
  * Uses @philly/vue-mapping 1.0.35
  * Uses @philly/vue-datafetch 0.0.22

### 0.0.26 - 7/11/2019

* Uses new releases of @philly libraries which use axios 0.19.0:
  * Uses @philly/vue-comps 1.0.33
  * Uses @philly/vue-mapping 1.0.33
  * Uses @philly/vue-datafetch 0.0.20

### 0.0.25 - 6/2/2019

* Uses new releases of @philly libraries which use axios 0.19.0:
  * Uses @philly/vue-comps 1.0.31
  * Uses @philly/vue-mapping 1.0.31
  * Uses @philly/vue-datafetch 0.0.18

### 0.0.24 - 5/30/2019

* Uses @philly/vue-comps 1.0.30
* Uses @philly/vue-mapping 1.0.30
* Uses @philly/vue-datafetch 0.0.17
* Allows you to use a [footerContent](https://github.com/CityOfPhiladelphia/mapboard/wiki/footerContent) parameter in your config, which lets you include as many popoverLink and Anchor components in your footer as you need.
* Allows you to use a [customComps](https://github.com/CityOfPhiladelphia/mapboard/wiki/customComps) parameter in your config to include your own components in a project.
* Allows you to set up an [initialPopover](https://github.com/CityOfPhiladelphia/mapboard/wiki/initialPopover) to put an alert modal on your site when it loads.
