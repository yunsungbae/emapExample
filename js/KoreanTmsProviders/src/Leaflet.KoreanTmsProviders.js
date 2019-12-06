(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['leaflet'], factory);
	} else if (typeof modules === 'object' && module.exports) {
		// define a Common JS module that relies on 'leaflet'
		module.exports = factory(require('leaflet'));
	} else {
		// Assume Leaflet is loaded into global object L already
		factory(L);
	}
}(this, function (L) {
	'use strict';

    //emap 좌표계 정의
    L.Proj.CRS.emap = new L.Proj.CRS(
        'EPSG:5179',
        '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        {
            resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
            //[90112, 1192896, 1990673, 2761664],
			// origin: [-200000.000000000, 4000000.000000000],
			//origin: [-200000.000000000,  997738.410700000],
			origin: [4000000.000000000,  -200000.000000000],
            bounds: L.bounds([-200000.000000000, 997738.410700000], [2802261.589000000, 4000000.000000000])
        }
    );



	L.TileLayer.KoreaProvider = L.TileLayer.extend({

		initialize: function (arg, options) {

			var providers = L.TileLayer.KoreaProvider.providers;

			var parts = arg.split('.');

			var providerName = parts[0];
			var variantName = parts[1];

			if (!providers[providerName]) {
				throw 'No such provider (' + providerName + ')';
			}

			var provider = {
				url: providers[providerName].url,
				crs: providers[providerName].crs,
				options: providers[providerName].options
			};

			// overwrite values in provider from variant.
			if (variantName && 'variants' in providers[providerName]) {
				if (!(variantName in providers[providerName].variants)) {
					throw 'No such variant of ' + providerName + ' (' + variantName + ')';
				}
				var variant = providers[providerName].variants[variantName];
				var variantOptions;
				if (typeof variant === 'string') {
					variantOptions = {
						variant: variant
					};
				} else {
					variantOptions = variant.options;
				}
				provider = {
					url: variant.url || provider.url,
					crs: variant.crs || provider.crs,
					options: L.Util.extend({}, provider.options, variantOptions)
				};
			} else if (typeof provider.url === 'function') {
				provider.url = provider.url(parts.splice(1).join('.'));
			}

			var forceHTTP = window.location.protocol === 'file:' || provider.options.forceHTTP;
			if (provider.url.indexOf('//') === 0 && forceHTTP) {
				provider.url = 'http:' + provider.url;
			}

			// If retina option is set
			if (provider.options.retina) {
				// Check retina screen
				if (options.detectRetina && L.Browser.retina) {
					// The retina option will be active now
					// But we need to prevent Leaflet retina mode
					options.detectRetina = false;
				} else {
					// No retina, remove option
					provider.options.retina = '';
				}
			}

			var layerOpts = L.Util.extend({}, provider.options, options);
			L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
		},
		getTileUrl:function(coords){

			var tileSize = this.options.tileSize;
			var nwPoint = coords.multiplyBy(tileSize);
			var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));
			var zoom = this._tileZoom;
			var z = "L" + this.fillzero(zoom+5, 2);
			var nw = L.Proj.CRS.emap.project(this._map.unproject(sePoint, zoom))
			var tilecol=Math.floor((nw.x- -200000.000000000)/(  L.Proj.CRS.emap.options.resolutions[zoom]*256));
			var tilerow=Math.floor((4000000.000000000-nw.y)/ (L.Proj.CRS.emap.options.resolutions[zoom]*256));
			var url = L.Util.template(this._url, {z:z,y:tilerow,x:   tilecol });
			return url;

		},
		 fillzero : function(n, digits) {
			var zero = '';
			n = n.toString();
			if (digits > n.length) {
				for (var i = 0; digits - n.length > i; i++) {
					zero += '0';
				}
			}
			return zero + n;
		},


	});

	L.TileLayer.KoreaProvider.providers = {
	
		emap: {
			url: 'http://map.ngii.go.kr/openapi/Gettile.do?apikey={apikey}&service=wmts&request=GetTile&version=1.0.0&layer=korean_map&style=default&tilematrixset=3006&tilematrix={z}&tilerow={y}&tilecol={x}&format=image%2Fpng',
			crs: L.Proj.CRS.eamp,
			options: {
				maxZoom: 14,
				minZoom: 0,
				zoomOffset: 1,
				//subdomains: '1234',
				continuousWorld:true,
				tms: false
			
			}
		}
	
		}


	L.tileLayer.koreaProvider = function (provider, options) {
		return new L.TileLayer.KoreaProvider(provider, options);
	};

	return L;
}));
