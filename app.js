// 1. Inicializa Mapa com Satélite do Google
const map = L.map('map').setView([-4.245, -56.008], 14);
L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);

let geojsonLayer = null;
let territorioAtivo = null;
let camadaDestacada = null;

// 2. Sistema de Banco de Dados Local (Carrega ou cria um novo)
let dadosTerritorios = JSON.parse(localStorage.getItem('banco_territorios')) || [];

// 3. Importa o GeoJSON e exibe
fetch('territorios.geojson')
  .then(res => res.json())
  .then(geojson => {
    
    // Garante que todo polígono tenha um cadastro gerado automaticamente
    const codigosSalvos = new Set(dadosTerritorios.map(d => d.codigo));
    geojson.features.forEach(feat => {
      const nome = feat.properties.name;
      if (nome && !codigosSalvos.has(nome)) {
        dadosTerritorios.push({ codigo: nome, status: 'Livre', responsavel: '' });
      }
    });
    localStorage.setItem('banco_territorios', JSON.stringify(dadosTerritorios));

    // Desenha o mapa
    geojsonLayer = L.geoJSON(geojson, {
      style: (feature) => ({
        color: obterCorStatus(feature.properties.name),
        weight: 2,
        fillOpacity: 0.4
      }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties.name, { permanent: false, direction: 'center', className: 'label-territorio' });
        layer.on('click', () => abrirPainel(feature.properties.name, layer));
      }
    }).addTo(map);
    
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  })
  .catch(err => alert("Erro ao carregar territorios.geojson. Verifique se o arquivo está na pasta e se está usando o Live Server."));

// 4. Regra de Cores
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

  // Limpa seleção anterior
  if (camadaDestacada && geojsonLayer) geojsonLayer.resetStyle(camadaDestacada);

  territorioAtivo = { info: item, layer: layer };
  
  // Destaca o polígono na tela
  camadaDestacada = layer;
  layer.setStyle({ weight: 4, color: '#FFFFFF', fillOpacity: 0.7 });
  layer.bringToFront();
  map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 17 });

  // Preenche as informações
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

  // Salva e atualiza o mapa
  localStorage.setItem('banco_territorios', JSON.stringify(dadosTerritorios));
  geojsonLayer.setStyle(f => ({ color: obterCorStatus(f.properties.name), weight: 2, fillOpacity: 0.4 }));
  abrirPainel(territorioAtivo.info.codigo, territorioAtivo.layer);
}

// 7. Integração Direta com Google Maps (Pino + Nome)
function abrirGoogleMaps() {
  if (!territorioAtivo) return;
  
  const centro = territorioAtivo.layer.getBounds().getCenter();
  const lat = centro.lat.toFixed(6);
  const lng = centro.lng.toFixed(6);
  const nome = territorioAtivo.info.codigo;
  
  // Abre o app oficial cravando o pino com o número do território
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}+(${nome})`;
  window.open(url, '_blank');
}

// 8. Leitura de GPS
function ativarGPS() {
  if (!navigator.geolocation) return alert('GPS não suportado.');
  document.getElementById('btn-gps').innerText = "Buscando...";
  
  navigator.geolocation.watchPosition(pos => {
    document.getElementById('btn-gps').innerText = "📍 GPS Ativo";
    const pt = turf.point([pos.coords.longitude, pos.coords.latitude]);
    
    geojsonLayer.eachLayer(layer => {
      if (turf.booleanPointInPolygon(pt, layer.feature)) {
        abrirPainel(layer.feature.properties.name, layer);
      }
    });
  });
}