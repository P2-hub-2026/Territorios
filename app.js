// ID oficial do seu My Maps atualizado
const MY_MAPS_MID = '1dAuHzaipAg8qPOzuzKCQ8lB3FWW_MiI';

// 1. Inicializa Mapa Leaflet com Camada Satélite
const map = L.map('map').setView([-4.236661, -56.006867], 14);
L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);

let geojsonLayer = null;
let territorioAtivo = null;
let camadaDestacada = null;

// 2. Sistema de Banco de Dados Local (localStorage)
let dadosTerritorios = JSON.parse(localStorage.getItem('banco_territorios')) || [];

// 3. Importa o GeoJSON e Desenha no Mapa
fetch('territorios.geojson')
  .then(res => res.json())
  .then(geojson => {
    // Garante que todo território tenha seu registro de status
    const codigosSalvos = new Set(dadosTerritorios.map(d => d.codigo));
    geojson.features.forEach(feat => {
      const nome = feat.properties.name;
      if (nome && !codigosSalvos.has(nome)) {
        dadosTerritorios.push({ codigo: nome, status: 'Livre', responsavel: '' });
      }
    });
    localStorage.setItem('banco_territorios', JSON.stringify(dadosTerritorios));

    // Renderiza a camada com polígonos
    geojsonLayer = L.geoJSON(geojson, {
      style: (feature) => ({
        color: obterCorStatus(feature.properties.name),
        weight: 2,
        fillOpacity: 0.4
      }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.name, { 
          permanent: false, 
          direction: 'center', 
          className: 'label-territorio' 
        });
        layer.on('click', () => abrirPainel(feature.properties.name, layer));
      }
    }).addTo(map);
    
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  })
  .catch(err => alert("Erro ao carregar territorios.geojson. Verifique se o arquivo está na pasta e execute via Live Server."));

// 4. Regra de Cores por Status
function obterCorStatus(codigo) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return '#0F9D58';
  
  if (item.status === 'Iniciado') return '#F4B400';
  if (item.status === 'Concluído') return '#007bff';
  return '#0F9D58'; // Livre
}

// 5. Interação ao Clicar no Território
function abrirPainel(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  // Limpa seleção visual anterior
  if (camadaDestacada && geojsonLayer) geojsonLayer.resetStyle(camadaDestacada);

  territorioAtivo = { info: item, layer: layer };
  
  // Destaca o polígono com contorno reforçado
  camadaDestacada = layer;
  layer.setStyle({ weight: 4, color: '#FFFFFF', fillOpacity: 0.7 });
  layer.bringToFront();
  map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 17 });

  // Preenche a ficha do território
  document.getElementById('detalhe-codigo').innerText = item.codigo;
  document.getElementById('detalhe-status').innerText = item.status;
  document.getElementById('detalhe-responsavel').innerText = item.responsavel || 'Ninguém';
  
  document.getElementById('painel-detalhes').classList.remove('oculto');
}

function fecharPainel() {
  document.getElementById('painel-detalhes').classList.add('oculto');
  if (camadaDestacada && geojsonLayer) geojsonLayer.resetStyle(camadaDestacada);
}

// 6. Atualização de Status
function alterarStatus(novoStatus) {
  if (!territorioAtivo) return;

  territorioAtivo.info.status = novoStatus;
  
  if (novoStatus === 'Iniciado') {
    territorioAtivo.info.responsavel = prompt("Nome do responsável:", territorioAtivo.info.responsavel) || "";
  } else if (novoStatus === 'Livre') {
    territorioAtivo.info.responsavel = "";
  }

  localStorage.setItem('banco_territorios', JSON.stringify(dadosTerritorios));
  geojsonLayer.setStyle(f => ({ color: obterCorStatus(f.properties.name), weight: 2, fillOpacity: 0.4 }));
  abrirPainel(territorioAtivo.info.codigo, territorioAtivo.layer);
}

// 7. Abertura Dinâmica no Google Maps com o novo ID do My Maps
function abrirGoogleMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) {
    alert("Selecione um território primeiro.");
    return;
  }
  
  // Calcula o centro do polígono selecionado
  const bounds = territorioAtivo.layer.getBounds();
  const centro = bounds.getCenter();
  const lat = centro.lat.toFixed(6);
  const lng = centro.lng.toFixed(6);

  // Calcula o zoom dinâmico proporcional à área do território
  const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth());
  const lngDiff = Math.abs(bounds.getEast() - bounds.getWest());
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 17;
  if (maxDiff > 0.01) zoom = 15;
  else if (maxDiff > 0.005) zoom = 16;
  else if (maxDiff < 0.002) zoom = 18;

  // Monta a URL parametrizada exatamente com a sua estrutura do My Maps
  const urlMyMaps = `https://www.google.com/maps/d/viewer?mid=${MY_MAPS_MID}&ll=${lat}%2C${lng}&z=${zoom}`;
  
  window.open(urlMyMaps, '_blank');
}

// 8. GPS em Tempo Real
function ativarGPS() {
  if (!navigator.geolocation) return alert('GPS não suportado pelo dispositivo.');
  document.getElementById('btn-gps').innerText = "Buscando...";
  
  navigator.geolocation.watchPosition(pos => {
    document.getElementById('btn-gps').innerText = "📍 GPS Ativo";
    const pt = turf.point([pos.coords.longitude, pos.coords.latitude]);
    
    geojsonLayer.eachLayer(layer => {
      if (turf.booleanPointInPolygon(pt, layer.feature)) {
        abrirPainel(layer.feature.properties.name, layer);
      }
    });
  }, (erro) => {
    document.getElementById('btn-gps').innerText = "📍 Onde Estou?";
    alert("Erro ao obter GPS: " + erro.message);
  }, { enableHighAccuracy: true });
}