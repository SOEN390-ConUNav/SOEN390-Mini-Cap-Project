import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { RoutePoint } from '../types/indoorDirections';
import { BuildingId } from '../data/buildings';

export interface PoiMarker {
  x: number;
  y: number;
  id: string;
  displayName: string;
  type: string;
}

export interface RoomMarkerData {
  x: number;
  y: number;
  id: string;
}

interface FloorPlanWebViewProps {
  buildingId?: BuildingId;
  floorNumber?: string;
  onPoiTap?: (poi: PoiMarker) => void;
  onRoomTap?: (room: RoomMarkerData) => void;
  routePoints?: RoutePoint[]; 
  poiData?: PoiMarker[];     
  roomData?: RoomMarkerData[]; 
}

export interface FloorPlanWebViewRef {
  drawRoute: (routePoints: RoutePoint[]) => void;
  clearRoute: () => void;
  showWaypoints: (waypoints: Array<{x: number, y: number, id: string}>) => void;
  hideWaypoints: () => void;
  showRoomMarkers: (roomPoints: Array<{x: number, y: number, id: string}>) => void;
  hideRoomMarkers: () => void;
  showPois: (pois: PoiMarker[]) => void;
  hidePois: () => void;
}


function getSvgAsset(buildingId: BuildingId, floorNumber: string): any {
  if (buildingId === 'H') {
    if (floorNumber === '8') return require('../../assets/building_plans /h8.svg');
    if (floorNumber === '9') return require('../../assets/building_plans /Hall-9.svg');
    if (floorNumber === '2') return require('../../assets/building_plans /Hall-2.svg');
    if (floorNumber === '1') return require('../../assets/building_plans /Hall-1.svg');
  } else if (buildingId === 'VL') {
    if (floorNumber === '1') return require('../../assets/building_plans /VL-1.svg');
    if (floorNumber === '2') return require('../../assets/building_plans /VL-2.svg');
  } else if (buildingId === 'LB') {
    if (floorNumber === '2') return require('../../assets/building_plans /LB2-n-s.svg');
    if (floorNumber === '3') return require('../../assets/building_plans /LB3-n-s.svg');
    if (floorNumber === '4') return require('../../assets/building_plans /LB4-n-s.svg');
    if (floorNumber === '5') return require('../../assets/building_plans /LB5-n-s.svg');
  } else if (buildingId === 'MB') {
    if (floorNumber === 'S2') return require('../../assets/building_plans /MB-S2.svg');
  }
  
  return null;
}

const FloorPlanWebView = forwardRef<FloorPlanWebViewRef, FloorPlanWebViewProps>(
  ({ buildingId = 'H', floorNumber = '8', onPoiTap, onRoomTap, routePoints: propRoutePoints, poiData, roomData }, ref) => {
    const webViewRef = useRef<WebView>(null);
  const [svgHtml, setSvgHtml] = React.useState<string | null>(null);
  const [isWebViewReady, setIsWebViewReady] = React.useState(false);
  const pendingRouteRef = React.useRef<RoutePoint[] | null>(null);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        const asset = getSvgAsset(buildingId, floorNumber);
        if (!asset) {
          console.error('No SVG asset found for', buildingId, floorNumber);
          return;
        }
        
        const assetModule = await Asset.fromModule(asset).downloadAsync();
        const uri = assetModule.localUri || assetModule.uri;
        
        setSvgHtml(null);
        setIsWebViewReady(false);
        pendingRouteRef.current = null;

        const response = await fetch(uri);
        const svgText = await response.text();
        const svgMatch = svgText.match(/<svg[\s\S]*<\/svg>/i);
        
        if (svgMatch) {
          let svgContent = svgMatch[0];
         
          if (!svgContent.includes('viewBox')) {
            svgContent = svgContent.replace(/<svg/, '<svg viewBox="0 0 1024 1024"');
          }
          if (!svgContent.includes('preserveAspectRatio')) {
            svgContent = svgContent.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"');
          }
          
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=10.0, minimum-scale=0.1, user-scalable=yes">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  html, body { 
                    width: 100%;
                    height: 100%;
                    background: white; 
                    overflow: auto;
                    -webkit-overflow-scrolling: touch;
                  }
                  body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 10px;
                  }
                  svg { 
                    display: block;
                    max-width: 100vw;
                    max-height: 100vh;
                    width: auto;
                    height: auto;
                  }
                </style>
              </head>
              <body>
                ${svgContent}
                <script>
                  (function() {
                    const svg = document.querySelector('svg');
                    if (!svg) return;
                    
                    const SVG_NS = 'http://www.w3.org/2000/svg';
                    
                    // All coordinates are pre-transformed in the backend to root SVG space.
                    // The frontend simply renders them as-is (pass-through).
                    
                    window.drawRouteFromPoints = function(routePoints) {
                      try {
                        if (!routePoints || routePoints.length < 2) return false;
                      
                        
                        ['#routePath', '#routePathOutline', '#startMarker', '#endMarker'].forEach(function(sel) {
                          try {
                            var el = svg.querySelector(sel);
                            if (el && el.parentNode) el.parentNode.removeChild(el);
                          } catch(e) {}
                        });

                        // Build SVG path data through all waypoints
                        var pathData = 'M ' + routePoints[0].x + ' ' + routePoints[0].y;
                        for (var i = 1; i < routePoints.length; i++) {
                          pathData += ' L ' + routePoints[i].x + ' ' + routePoints[i].y;
                      }
                      
                        
                        var pathOutline = document.createElementNS(SVG_NS, 'path');
                        pathOutline.id = 'routePathOutline';
                        pathOutline.setAttribute('d', pathData);
                        pathOutline.setAttribute('stroke', '#FFFFFF');
                        pathOutline.setAttribute('stroke-width', '16');
                        pathOutline.setAttribute('fill', 'none');
                        pathOutline.setAttribute('stroke-linecap', 'round');
                        pathOutline.setAttribute('stroke-linejoin', 'round');
                        pathOutline.setAttribute('stroke-dasharray', '4 18');
                        pathOutline.setAttribute('style', 'pointer-events: none;');
                        svg.appendChild(pathOutline);
                        
                        
                        var path = document.createElementNS(SVG_NS, 'path');
                      path.id = 'routePath';
                      path.setAttribute('d', pathData);
                      path.setAttribute('stroke', '#8B1538');
                        path.setAttribute('stroke-width', '12');
                      path.setAttribute('fill', 'none');
                      path.setAttribute('stroke-linecap', 'round');
                      path.setAttribute('stroke-linejoin', 'round');
                        path.setAttribute('stroke-dasharray', '4 18');
                        path.setAttribute('style', 'pointer-events: none;');
                        svg.appendChild(path);
                      
                      
                        var startPoint = routePoints[0];
                        var startMarker = document.createElementNS(SVG_NS, 'g');
                        startMarker.id = 'startMarker';
                        startMarker.setAttribute('transform', 'translate(' + startPoint.x + ',' + startPoint.y + ')');
                        startMarker.setAttribute('style', 'pointer-events: none;');
                        
                        var sc = document.createElementNS(SVG_NS, 'circle');
                        sc.setAttribute('cx', '0'); sc.setAttribute('cy', '-8'); sc.setAttribute('r', '10');
                        sc.setAttribute('fill', '#8B1538'); sc.setAttribute('stroke', '#fff'); sc.setAttribute('stroke-width', '2');
                        startMarker.appendChild(sc);
                        var st = document.createElementNS(SVG_NS, 'path');
                        st.setAttribute('d', 'M -6,2 L 0,18 L 6,2 Z');
                        st.setAttribute('fill', '#8B1538'); st.setAttribute('stroke', '#fff'); st.setAttribute('stroke-width', '2');
                        startMarker.appendChild(st);
                        var sd = document.createElementNS(SVG_NS, 'circle');
                        sd.setAttribute('cx', '0'); sd.setAttribute('cy', '-8'); sd.setAttribute('r', '4');
                        sd.setAttribute('fill', '#fff');
                        startMarker.appendChild(sd);
                        svg.appendChild(startMarker);
                        
                        
                        var endPoint = routePoints[routePoints.length - 1];
                        var endMarker = document.createElementNS(SVG_NS, 'g');
                        endMarker.id = 'endMarker';
                        endMarker.setAttribute('transform', 'translate(' + endPoint.x + ',' + endPoint.y + ')');
                        endMarker.setAttribute('style', 'pointer-events: none;');
                        
                        var ec = document.createElementNS(SVG_NS, 'circle');
                        ec.setAttribute('cx', '0'); ec.setAttribute('cy', '-8'); ec.setAttribute('r', '10');
                        ec.setAttribute('fill', '#8B1538'); ec.setAttribute('stroke', '#fff'); ec.setAttribute('stroke-width', '2');
                        endMarker.appendChild(ec);
                        var et = document.createElementNS(SVG_NS, 'path');
                        et.setAttribute('d', 'M -6,2 L 0,18 L 6,2 Z');
                        et.setAttribute('fill', '#8B1538'); et.setAttribute('stroke', '#fff'); et.setAttribute('stroke-width', '2');
                        endMarker.appendChild(et);
                        var ed = document.createElementNS(SVG_NS, 'circle');
                        ed.setAttribute('cx', '0'); ed.setAttribute('cy', '-8'); ed.setAttribute('r', '4');
                        ed.setAttribute('fill', '#fff');
                        endMarker.appendChild(ed);
                        svg.appendChild(endMarker);
                      
                        return true;
                      } catch (error) {
                        console.error('Error in drawRouteFromPoints:', error);
                        return false;
                      }
                    };
                    
                    window.clearRoute = function() {
                      ['#routePath', '#routePathOutline', '#startMarker', '#endMarker'].forEach(function(sel) {
                        try {
                          var el = svg.querySelector(sel);
                          if (el && el.parentNode) el.parentNode.removeChild(el);
                        } catch(e) {}
                      });
                    };
                    
                    window.showWaypoints = function(waypoints) {
                      try {
                        if (!waypoints || waypoints.length === 0) return;
                        window.hideWaypoints();
                        
                        var g = document.createElementNS(SVG_NS, 'g');
                        g.id = 'waypointsGroup';
                        g.setAttribute('style', 'pointer-events: none;');
                        
                        waypoints.forEach(function(wp, index) {
                          var circle = document.createElementNS(SVG_NS, 'circle');
                          circle.setAttribute('cx', wp.x.toString());
                          circle.setAttribute('cy', wp.y.toString());
                          circle.setAttribute('r', '10');
                          circle.setAttribute('fill', '#4285F4');
                          circle.setAttribute('stroke', '#FFFFFF');
                          circle.setAttribute('stroke-width', '3');
                          
                          var text = document.createElementNS(SVG_NS, 'text');
                          text.setAttribute('x', wp.x.toString());
                          text.setAttribute('y', (wp.y - 15).toString());
                          text.setAttribute('font-size', '14');
                          text.setAttribute('fill', '#FF0000');
                          text.setAttribute('text-anchor', 'middle');
                          text.setAttribute('font-weight', 'bold');
                          text.setAttribute('style', 'pointer-events: none;');
                          text.textContent = wp.id || ('WP' + index);
                          
                          g.appendChild(circle);
                          g.appendChild(text);
                        });
                        
                        svg.appendChild(g);
                      } catch(e) {
                        console.error('Error showing waypoints:', e);
                      }
                    };
                    
                    window.hideWaypoints = function() {
                      try {
                        var g = svg.querySelector('#waypointsGroup');
                        if (g && g.parentNode) g.parentNode.removeChild(g);
                      } catch(e) {}
                    };
                    
                    window.showRoomMarkers = function(roomPoints) {
                      try {
                        if (!roomPoints || roomPoints.length === 0) return;
                        window.hideRoomMarkers();
                        
                        var g = document.createElementNS(SVG_NS, 'g');
                        g.id = 'roomMarkersGroup';
                        
                        roomPoints.forEach(function(room) {
                          if (!room || !room.id) return;
                          var x = room.x, y = room.y;
                          if (isNaN(x) || isNaN(y)) return;
                          
                          var sz = 10;
                          var rect = document.createElementNS(SVG_NS, 'rect');
                          rect.setAttribute('x', (x - sz).toString());
                          rect.setAttribute('y', (y - sz).toString());
                          rect.setAttribute('width', (sz * 2).toString());
                          rect.setAttribute('height', (sz * 2).toString());
                          rect.setAttribute('rx', '3'); rect.setAttribute('ry', '3');
                          rect.setAttribute('fill', '#FF6B35');
                          rect.setAttribute('stroke', '#fff'); rect.setAttribute('stroke-width', '1.5');
                          rect.setAttribute('opacity', '0.9');
                          rect.setAttribute('cursor', 'pointer');
                          rect.addEventListener('click', function() {
                            if (window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'roomTap', room: room }));
                            }
                          });
                          g.appendChild(rect);
                          
                          var icon = document.createElementNS(SVG_NS, 'text');
                          icon.setAttribute('x', x.toString());
                          icon.setAttribute('y', (y + 4).toString());
                          icon.setAttribute('text-anchor', 'middle');
                          icon.setAttribute('font-size', '12'); icon.setAttribute('font-weight', 'bold');
                          icon.setAttribute('fill', '#fff');
                          icon.setAttribute('style', 'pointer-events: none;');
                          icon.textContent = 'R';
                          g.appendChild(icon);
                          
                          var label = document.createElementNS(SVG_NS, 'text');
                          label.setAttribute('x', x.toString());
                          label.setAttribute('y', (y + sz + 12).toString());
                          label.setAttribute('text-anchor', 'middle');
                          label.setAttribute('font-size', '9'); label.setAttribute('font-weight', '700');
                          label.setAttribute('fill', '#333');
                          label.setAttribute('stroke', '#fff'); label.setAttribute('stroke-width', '2');
                          label.setAttribute('paint-order', 'stroke');
                          label.setAttribute('style', 'pointer-events: none;');
                          label.textContent = room.id;
                          g.appendChild(label);
                        });
                        
                        svg.appendChild(g);
                      } catch(e) {
                        console.error('Error showing room markers:', e);
                      }
                    };
                    
                    window.hideRoomMarkers = function() {
                      try {
                        var g = svg.querySelector('#roomMarkersGroup');
                        if (g && g.parentNode) g.parentNode.removeChild(g);
                      } catch(e) {}
                    };
                    
                    // POI icon config per type
                    var POI_ICONS = {
                      'elevator':        { bg: '#FFC107', letter: 'E',  color: '#000' },
                      'stairs':          { bg: '#4CAF50', letter: 'S',  color: '#fff' },
                      'stairs-down':     { bg: '#388E3C', letter: '↓',  color: '#fff' },
                      'stairs-up':       { bg: '#66BB6A', letter: '↑',  color: '#fff' },
                      'emergency-exit':  { bg: '#F44336', letter: '!',  color: '#fff' },
                      'bathroom-men':    { bg: '#2196F3', letter: 'M',  color: '#fff' },
                      'bathroom-women':  { bg: '#E91E63', letter: 'W',  color: '#fff' },
                      'water-fountain':  { bg: '#00BCD4', letter: 'W',  color: '#fff' },
                      'computer-station':{ bg: '#9C27B0', letter: 'C',  color: '#fff' },
                      'study-area':      { bg: '#FF9800', letter: 'A',  color: '#fff' },
                      'printer':         { bg: '#607D8B', letter: 'P',  color: '#fff' },
                      'bookshelf':       { bg: '#795548', letter: 'B',  color: '#fff' },
                      'entrance-exit':   { bg: '#FF5722', letter: 'D',  color: '#fff' }
                    };

                    window.showPois = function(pois) {
                      try {
                        if (!pois || pois.length === 0) return;
                        window.hidePois();

                        var g = document.createElementNS(SVG_NS, 'g');
                        g.id = 'poisGroup';

                        pois.forEach(function(poi) {
                          var x = poi.x, y = poi.y;
                          if (isNaN(x) || isNaN(y)) return;
                          var icon = POI_ICONS[poi.type] || { bg: '#888', letter: '?', color: '#fff' };
                          var sz = 14;

                          var rect = document.createElementNS(SVG_NS, 'rect');
                          rect.setAttribute('x', (x - sz).toString());
                          rect.setAttribute('y', (y - sz).toString());
                          rect.setAttribute('width', (sz * 2).toString());
                          rect.setAttribute('height', (sz * 2).toString());
                          rect.setAttribute('rx', '4'); rect.setAttribute('ry', '4');
                          rect.setAttribute('fill', icon.bg);
                          rect.setAttribute('stroke', '#fff'); rect.setAttribute('stroke-width', '2');
                          rect.setAttribute('opacity', '0.95');
                          rect.setAttribute('cursor', 'pointer');
                          rect.addEventListener('click', function() {
                            if (window.ReactNativeWebView) {
                              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'poiTap', poi: poi }));
                            }
                          });
                          g.appendChild(rect);

                          var txt = document.createElementNS(SVG_NS, 'text');
                          txt.setAttribute('x', x.toString());
                          txt.setAttribute('y', (y + 5).toString());
                          txt.setAttribute('text-anchor', 'middle');
                          txt.setAttribute('font-size', '16'); txt.setAttribute('font-weight', 'bold');
                          txt.setAttribute('fill', icon.color);
                          txt.setAttribute('style', 'pointer-events: none;');
                          txt.textContent = icon.letter;
                          g.appendChild(txt);

                          var label = document.createElementNS(SVG_NS, 'text');
                          label.setAttribute('x', x.toString());
                          label.setAttribute('y', (y + sz + 14).toString());
                          label.setAttribute('text-anchor', 'middle');
                          label.setAttribute('font-size', '10'); label.setAttribute('font-weight', '600');
                          label.setAttribute('fill', '#333');
                          label.setAttribute('style', 'pointer-events: none;');
                          label.textContent = poi.displayName || poi.type;
                          g.appendChild(label);
                        });

                        svg.appendChild(g);
                      } catch(e) {
                        console.error('Error showing POIs:', e);
                      }
                    };

                    window.hidePois = function() {
                      try {
                        var g = svg.querySelector('#poisGroup');
                        if (g && g.parentNode) g.parentNode.removeChild(g);
                      } catch(e) {}
                    };

                   
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'webViewReady' }));
                    }
                  })();
                </script>
              </body>
            </html>
          `;
          setSvgHtml(html);
          setIsWebViewReady(false);
        }
      } catch (e) {
        console.error('Error loading SVG:', e);
      }
    };
    
    loadSvg();
  }, [buildingId, floorNumber]);


  const executeDrawRoute = React.useCallback((routePoints: RoutePoint[], retryCount = 0) => {
      if (!webViewRef.current) {
      if (retryCount < 3) {
        setTimeout(() => executeDrawRoute(routePoints, retryCount + 1), 500);
      }
        return;
      }

    if (!isWebViewReady) {
      pendingRouteRef.current = routePoints;
      if (retryCount === 0) {
        setTimeout(() => {
          if (webViewRef.current) executeDrawRoute(routePoints, retryCount + 1);
        }, 1000);
      }
      return;
    }
    
    if (!routePoints || routePoints.length === 0) return;
    
      const pointsJson = JSON.stringify(routePoints);
      webViewRef.current.injectJavaScript(`
        (function() {
        if (typeof window.drawRouteFromPoints === 'function') {
          try {
            var result = window.drawRouteFromPoints(${pointsJson});
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'routeDrawn', success: result, pointCount: ${routePoints.length}
              }));
            }
          } catch (e) {
            console.error('Error in drawRouteFromPoints:', e);
          }
        }
        true;
      })();
    `);
  }, [isWebViewReady]);


  React.useEffect(() => {
    if (isWebViewReady) {
      if (pendingRouteRef.current) {
        const pendingRoute = pendingRouteRef.current;
        pendingRouteRef.current = null;
        setTimeout(() => {
          if (webViewRef.current && isWebViewReady) executeDrawRoute(pendingRoute, 0);
        }, 300);
      } else if (propRoutePoints && propRoutePoints.length > 0) {
        setTimeout(() => {
          if (webViewRef.current && isWebViewReady) executeDrawRoute(propRoutePoints, 0);
        }, 300);
      }
    }
  }, [isWebViewReady, propRoutePoints]);


  React.useEffect(() => {
    if (!isWebViewReady || !webViewRef.current) return;

    if (roomData && roomData.length > 0) {
      const roomsJson = JSON.stringify(roomData);
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            try { if (typeof window.showRoomMarkers === 'function') window.showRoomMarkers(${roomsJson}); }
            catch(e) { console.error('Error auto-showing rooms:', e); }
            true;
          })();
        `);
      }, 300);
    }
  }, [isWebViewReady, roomData]);

 
  React.useEffect(() => {
    if (!isWebViewReady || !webViewRef.current) return;

    if (poiData && poiData.length > 0) {
      const poisJson = JSON.stringify(poiData);
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            try { if (typeof window.showPois === 'function') window.showPois(${poisJson}); }
            catch(e) { console.error('Error auto-showing POIs:', e); }
            true;
          })();
        `);
      }, 400);
    } else {
      webViewRef.current?.injectJavaScript(`
        (function() {
          if (typeof window.hidePois === 'function') window.hidePois();
          true;
        })();
      `);
    }
  }, [isWebViewReady, poiData]);

  
  useImperativeHandle(ref, () => ({
    drawRoute: (routePoints: RoutePoint[]) => {
      executeDrawRoute(routePoints);
    },
    clearRoute: () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`
        (function() { if (window.clearRoute) window.clearRoute(); true; })();
      `);
    },
    showWaypoints: (waypoints: Array<{x: number, y: number, id: string}>) => {
      if (!webViewRef.current || !isWebViewReady) return;
      const waypointsJson = JSON.stringify(waypoints);
      webViewRef.current.injectJavaScript(`
        (function() {
          try { if (typeof window.showWaypoints === 'function') window.showWaypoints(${waypointsJson}); }
          catch(e) { console.error('Error in showWaypoints:', e); }
          true;
        })();
      `);
    },
    hideWaypoints: () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`
        (function() { if (typeof window.hideWaypoints === 'function') window.hideWaypoints(); true; })();
      `);
    },
    showRoomMarkers: (roomPoints: Array<{x: number, y: number, id: string}>) => {
      if (!webViewRef.current || !roomPoints || roomPoints.length === 0) return;
      const roomPointsJson = JSON.stringify(roomPoints);
      webViewRef.current.injectJavaScript(`
        (function() {
          try { if (typeof window.showRoomMarkers === 'function') window.showRoomMarkers(${roomPointsJson}); }
          catch(e) { console.error('Error in showRoomMarkers:', e); }
          true;
        })();
      `);
    },
    hideRoomMarkers: () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`
        (function() { if (typeof window.hideRoomMarkers === 'function') window.hideRoomMarkers(); true; })();
      `);
    },
    showPois: (pois: PoiMarker[]) => {
      if (!webViewRef.current || !isWebViewReady) return;
      const poisJson = JSON.stringify(pois);
      webViewRef.current.injectJavaScript(`
        (function() {
          try { if (typeof window.showPois === 'function') window.showPois(${poisJson}); }
          catch(e) { console.error('Error in showPois:', e); }
          true;
        })();
      `);
    },
    hidePois: () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`
        (function() { if (typeof window.hidePois === 'function') window.hidePois(); true; })();
      `);
    },
  }), [isWebViewReady]);

  if (!svgHtml) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading floor plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: svgHtml }}
        style={styles.webView}
        scalesPageToFit={true}
        bounces={true}
        scrollEnabled={true}
        javaScriptEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'webViewReady') {
              setIsWebViewReady(true);
              if (pendingRouteRef.current) {
                const pendingRoute = pendingRouteRef.current;
                pendingRouteRef.current = null;
                setTimeout(() => executeDrawRoute(pendingRoute, 0), 100);
              }
            } else if (data.type === 'poiTap' && onPoiTap && data.poi) {
              onPoiTap(data.poi as PoiMarker);
            } else if (data.type === 'roomTap' && onRoomTap && data.room) {
              onRoomTap(data.room as RoomMarkerData);
            } else if (data.type === 'routeDrawError') {
              console.error('Route draw error:', data.message);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        }}
        onError={(syntheticEvent) => {
          console.error('WebView error:', syntheticEvent.nativeEvent);
        }}
        onLoadEnd={() => {
          setTimeout(() => {
            if (!isWebViewReady) {
              setIsWebViewReady(true);
              if (pendingRouteRef.current) {
                const pendingRoute = pendingRouteRef.current;
                pendingRouteRef.current = null;
                setTimeout(() => executeDrawRoute(pendingRoute, 0), 100);
              }
            }
          }, 500);
        }}
      />
    </View>
  );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
});

export default FloorPlanWebView;
