(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["mbmb_pvm_PictometryLayer"],{bdd0:function(i,e,t){"use strict";t.r(e);var a,s,c={name:"PictometryLayer",render:function(i){},computed:{ipa:function(){return this.$store.state.pictometry.ipa},activeTopic:function(){return this.$store.state.activeTopic}},mounted:function(){this.didActivateTopic(this.activeTopic)},beforeDestroy:function(){this.didDeactivateTopic(this.activeTopic)},watch:{activeTopic:function(i,e){this.didDeactivateTopic(e),this.didActivateTopic(i)}},methods:{didActivateTopic:function(i){switch(i){case"deeds":this.ipa.showLayer({id:114828,visible:!0});break;case"zoning":this.ipa.showLayer({id:112230,visible:!0});break;case"water":this.ipa.showLayer({id:108982,visible:!0});break;default:this.ipa.showLayer({id:113478,visible:!1}),this.ipa.showLayer({id:112230,visible:!1})}},didDeactivateTopic:function(i){switch(i){case"deeds":this.ipa.showLayer({id:114828,visible:!1});break;case"zoning":this.ipa.showLayer({id:112230,visible:!1});break;case"water":this.ipa.showLayer({id:108982,visible:!1});default:this.ipa.showLayer({id:113478,visible:!1}),this.ipa.showLayer({id:112230,visible:!1})}}}},o=c,d=t("2877"),r=Object(d["a"])(o,a,s,!1,null,null,null);e["default"]=r.exports}}]);
//# sourceMappingURL=mbmb_pvm_PictometryLayer.1d6e8c7f.js.map