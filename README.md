# layerboard ([@philly/layerboard](https://www.npmjs.com/package/@philly/layerboard) in [npmjs.com](https://npmjs.com))

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
