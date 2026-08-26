// 1. Inicialização do Mapa com Camada Satélite
const map = L.map('map').setView([-4.275, -55.981], 14);

L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: 'Google Maps'
}).addTo(map);

let geojsonLayer;
let dadosTerritorios = [];
let geojsonData = null;
let territorioAtivo = null;
let marcadorUsuario = null;

// 2. Carregar Dados e Polígonos
Promise.all([
  fetch('dados.json').then(res => res.json()),
  fetch('territorios.geojson').then(res => res.json())
]).then(([dados, geojson]) => {
  dadosTerritorios = dados;
  geojsonData = geojson;
  renderizarMapa();
});

// 3. Regra de Cores Dinâmicas
function obterCorPoligono(codigo) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  const modo = document.getElementById('modo-exibicao').value;

  if (!item) return '#999999';

  if (modo === 'grupos') {
    return item.corGrupo || '#3388ff';
  }

  // Cores por Status
  switch (item.status) {
    case 'Iniciado': return '#F4B400';    // Amarelo
    case 'Concluído': return '#007bff';   // Azul
    case 'Atrasado': return '#EA4335';    // Vermelho
    default: return '#0F9D58';            // Verde (Livre)
  }
}

// 4. Renderização dos Polígonos
function renderizarMapa() {
  if (geojsonLayer) map.removeLayer(geojsonLayer);

  const filtroGrupo = document.getElementById('filtro-grupo').value;

  geojsonLayer = L.geoJSON(geojsonData, {
    filter: (feature) => {
      if (filtroGrupo === 'TODOS') return true;
      const item = dadosTerritorios.find(t => t.codigo === feature.properties.name);
      return item && item.grupo === filtroGrupo;
    },
    style: (feature) => ({
      color: obterCorPoligono(feature.properties.name),
      weight: 2,
      fillOpacity: 0.35
    }),
    onEachFeature: (feature, layer) => {
      layer.on('click', () => abrirPainelTerritorio(feature.properties.name, layer));
    }
  }).addTo(map);
}

// 5. Exibir Ficha e Centralizar
function abrirPainelTerritorio(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  territorioAtivo = { info: item, layer: layer };

  document.getElementById('detalhe-codigo').innerText = item.codigo;
  document.getElementById('detalhe-grupo').innerText = item.grupo;
  document.getElementById('detalhe-status').innerText = item.status;
  document.getElementById('detalhe-responsavel').innerText = item.responsavel || 'Ninguém designado';
  document.getElementById('detalhe-inicio').innerText = item.dataInicio || '--/--/----';

  document.getElementById('painel-detalhes').classList.remove('oculto');

  if (layer) {
    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  }
}

function fecharPainel() {
  document.getElementById('painel-detalhes').classList.add('oculto');
}

// 6. Rota Direta no Google Maps
function abrirRotaGoogleMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) return;
  const centro = territorioAtivo.layer.getBounds().getCenter();
  const url = `https://www.google.com/maps/dir/?api=1&destination=${centro.lat},${centro.lng}`;
  window.open(url, '_blank');
}

// 7. Localização GPS e Detecção Automática (Point-in-Polygon)
function ativarGPS() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada pelo seu dispositivo.');
    return;
  }

  navigator.geolocation.watchPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const pontoAtual = turf.point([lng, lat]);

    if (!marcadorUsuario) {
      marcadorUsuario = L.circleMarker([lat, lng], { radius: 8, color: '#0055ff', fillColor: '#3388ff', fillOpacity: 1 }).addTo(map);
    } else {
      marcadorUsuario.setLatLng([lat, lng]);
    }

    // Varredura de território por coordenadas
    let encontrado = false;
    turf.featureEach(geojsonData, (feature) => {
      if (turf.booleanPointInPolygon(pontoAtual, feature)) {
        encontrado = true;
        abrirPainelTerritorio(feature.properties.name);
      }
    });

    if (!encontrado) {
      console.log("Você está fora de todos os territórios cadastrados.");
    }
  }, (erro) => {
    alert('Erro ao obter GPS: ' + erro.message);
  }, { enableHighAccuracy: true });
}

// Event Listeners dos Filtros
document.getElementById('filtro-grupo').addEventListener('change', renderizarMapa);
document.getElementById('modo-exibicao').addEventListener('change', renderizarMapa);