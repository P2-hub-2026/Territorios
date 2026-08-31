// ID do Google My Maps para abrir com a camada de polígonos traçada
const GOOGLE_MY_MAPS_MID = '143nsIAW7T0eb1rwMMv3T1YPxIMU86tg';

// 1. Inicialização do Mapa com Camada Satélite Híbrida do Google
const googleSatHibrido = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: 'Google Maps Satélite'
});

const googleRuas = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: 'Google Maps Ruas'
});

const map = L.map('map', {
  center: [-4.245, -56.008],
  zoom: 14,
  layers: [googleSatHibrido]
});

// Controle de Alternância de Camadas (Satélite / Ruas)
L.control.layers({
  "Satélite": googleSatHibrido,
  "Ruas": googleRuas
}, null, { position: 'topright' }).addTo(map);

let geojsonLayer = null;
let dadosTerritorios = [];
let geojsonData = null;
let territorioAtivo = null;
let marcadorUsuario = null;
let camadaDestacada = null;

// 2. Carregar Dados Administrativos e Polígonos GeoJSON
const dadosSalvos = localStorage.getItem('territorios_dados_db');

Promise.all([
  dadosSalvos ? Promise.resolve(JSON.parse(dadosSalvos)) : fetch('dados.json').then(res => res.json()).catch(() => []),
  fetch('territorios.geojson').then(res => res.json())
]).then(([dados, geojson]) => {
  geojsonData = geojson;
  
  const codigosExistentes = new Set(dados.map(d => d.codigo));
  
  geojson.features.forEach(feat => {
    const nome = feat.properties.name;
    if (nome && !codigosExistentes.has(nome)) {
      const numExtraido = nome.replace(/\D/g, '');
      dados.push({
        codigo: nome,
        numero: numExtraido,
        grupo: "Grupo 1",
        corGrupo: "#0F9D58",
        status: "Livre",
        responsavel: "",
        dataInicio: "",
        dataConclusao: ""
      });
    }
  });

  dadosTerritorios = dados;
  localStorage.setItem('territorios_dados_db', JSON.stringify(dadosTerritorios));
  
  renderizarMapa();

  // Enquadra a visão inicial em todos os polígonos
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  }
}).catch(err => {
  console.error("Erro ao carregar os dados:", err);
  alert("Não foi possível carregar os arquivos territoriais.");
});

// 3. Regra de Cores Dinâmicas
function obterCorPoligono(codigo) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  const modo = document.getElementById('modo-exibicao').value;

  if (!item) return '#0F9D58';

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
      fillColor: obterCorPoligono(feature.properties.name),
      fillOpacity: 0.35
    }),
    onEachFeature: (feature, layer) => {
      const nome = feature.properties.name || '';
      
      layer.bindTooltip(nome, {
        permanent: false,
        direction: 'center',
        className: 'label-territorio'
      });

      layer.on('click', () => abrirPainelTerritorio(nome, layer));
    }
  }).addTo(map);
}

// 5. Exibir Ficha do Território
function abrirPainelTerritorio(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  // Se a camada não veio pelo clique direto, busca no GeoJSON
  if (!layer && geojsonLayer) {
    geojsonLayer.eachLayer(l => {
      if (l.feature && l.feature.properties.name === codigo) {
        layer = l;
      }
    });
  }

  territorioAtivo = { info: item, layer: layer };

  document.getElementById('detalhe-codigo').innerText = item.codigo;
  document.getElementById('detalhe-grupo').innerText = item.grupo;
  document.getElementById('detalhe-status').innerText = item.status;
  document.getElementById('detalhe-responsavel').innerText = item.responsavel || 'Ninguém designado';
  document.getElementById('detalhe-inicio').innerText = item.dataInicio || '--/--/----';

  document.getElementById('painel-detalhes').classList.remove('oculto');
}

function fecharPainel() {
  document.getElementById('painel-detalhes').classList.add('oculto');
  if (camadaDestacada && geojsonLayer) {
    geojsonLayer.resetStyle(camadaDestacada);
    camadaDestacada = null;
  }
}

// 6. Focar Território: Aplica cor Amarela com 30% de opacidade e abre no Google Maps
function focarTerritorioAtivo() {
  if (!territorioAtivo || !territorioAtivo.layer) return;

  const layer = territorioAtivo.layer;

  // Restaura estilo da camada anterior se houver
  if (camadaDestacada && geojsonLayer) {
    geojsonLayer.resetStyle(camadaDestacada);
  }

  camadaDestacada = layer;

  // Marcação amarela (#FFD600) com 30% de opacidade de preenchimento
  layer.setStyle({
    color: '#FFD600',       // Contorno Amarelo
    weight: 4,              // Borda reforçada
    fillColor: '#FFD600',   // Preenchimento Amarelo
    fillOpacity: 0.30       // 30% de opacidade
  });
  layer.bringToFront();

  // Aproximação suave no mapa local
  map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.0 });

  // Abre o My Maps com os polígonos e focado no centro do território
  const centro = layer.getBounds().getCenter();
  const urlMaps = `https://www.google.com/maps/d/viewer?mid=${GOOGLE_MY_MAPS_MID}&ll=${centro.lat}%2C${centro.lng}&z=17`;
  window.open(urlMaps, '_blank');
}

// 7. Alteração de Status com Salvamento Automático
function alterarStatusTerritorio(novoStatus) {
  if (!territorioAtivo || !territorioAtivo.info) return;

  const hoje = new Date().toISOString().split('T')[0];
  territorioAtivo.info.status = novoStatus;

  if (novoStatus === 'Iniciado') {
    const resp = prompt("Nome do dirigente/publicador responsável:", territorioAtivo.info.responsavel || "");
    if (resp !== null) territorioAtivo.info.responsavel = resp;
    territorioAtivo.info.dataInicio = hoje;
  } else if (novoStatus === 'Concluído') {
    territorioAtivo.info.dataConclusao = hoje;
  } else if (novoStatus === 'Livre') {
    territorioAtivo.info.responsavel = "";
    territorioAtivo.info.dataInicio = "";
    territorioAtivo.info.dataConclusao = "";
  }

  localStorage.setItem('territorios_dados_db', JSON.stringify(dadosTerritorios));
  renderizarMapa();
  abrirPainelTerritorio(territorioAtivo.info.codigo, territorioAtivo.layer);
}

// 8. GPS em Tempo Real e Detecção de Área
function ativarGPS() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada pelo seu dispositivo.');
    return;
  }

  const btnGps = document.getElementById('btn-gps');
  btnGps.innerText = "Buscando...";

  navigator.geolocation.watchPosition((pos) => {
    btnGps.innerText = "GPS Ativo";
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const pontoAtual = turf.point([lng, lat]);

    if (!marcadorUsuario) {
      marcadorUsuario = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#007bff',
        fillOpacity: 1
      }).addTo(map);
    } else {
      marcadorUsuario.setLatLng([lat, lng]);
    }

    let encontrado = false;
    turf.featureEach(geojsonData, (feature) => {
      if (turf.booleanPointInPolygon(pontoAtual, feature)) {
        encontrado = true;
        const camada = geojsonLayer.getLayers().find(l => l.feature.properties.name === feature.properties.name);
        abrirPainelTerritorio(feature.properties.name, camada);
      }
    });

    if (!encontrado) {
      console.log("Localização atual fora dos polígonos.");
    }
  }, (erro) => {
    btnGps.innerText = "📍 Onde Estou?";
    alert('Erro ao obter GPS: ' + erro.message);
  }, { enableHighAccuracy: true });
}

// 9. Event Listeners dos Filtros
document.getElementById('filtro-grupo').addEventListener('change', renderizarMapa);
document.getElementById('modo-exibicao').addEventListener('change', renderizarMapa);