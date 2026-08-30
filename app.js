// ID oficial do seu projeto no Google My Maps onde os polígonos foram criados
const GOOGLE_MY_MAPS_MID = '143nsIAW7T0eb1rwMMv3T1YPxIMU86tg';

// 1. Inicialização do Mapa com Imagens de Satélite Híbridas do Google
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

// Controle de alternância entre Satélite e Ruas
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

// 2. Carregamento dos Polígonos e Sincronização Local
const dadosSalvos = localStorage.getItem('territorios_dados_db');

Promise.all([
  dadosSalvos ? Promise.resolve(JSON.parse(dadosSalvos)) : fetch('dados.json').then(res => res.json()).catch(() => []),
  fetch('territorios.geojson').then(res => res.json())
]).then(([dados, geojson]) => {
  geojsonData = geojson;
  
  // Cadastra automaticamente qualquer polígono desenhado no My Maps
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

  // Enquadra a tela em todos os polígonos ao carregar
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  }
}).catch(err => {
  console.error("Erro ao carregar os dados:", err);
  alert("Erro ao carregar dados. Verifique a pasta dos arquivos.");
});

// 3. Regra de Cores Dinâmicas
function obterCorPoligono(codigo) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  const modo = document.getElementById('modo-exibicao').value;

  if (!item) return '#0F9D58';

  if (modo === 'grupos') {
    return item.corGrupo || '#3388ff';
  }

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

// 5. Destacar Território Selecionado
function abrirPainelTerritorio(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  if (camadaDestacada && geojsonLayer) {
    geojsonLayer.resetStyle(camadaDestacada);
  }

  if (!layer && geojsonLayer) {
    geojsonLayer.eachLayer(l => {
      if (l.feature && l.feature.properties.name === codigo) {
        layer = l;
      }
    });
  }

  territorioAtivo = { info: item, layer: layer };

  // Destaque: borda espessa branca e opacidade reforçada
  if (layer) {
    camadaDestacada = layer;
    layer.setStyle({
      weight: 5,
      color: '#FFFFFF',
      fillOpacity: 0.7
    });
    layer.bringToFront();
    map.flyToBounds(layer.getBounds(), { padding: [40, 40], duration: 1.0 });
  }

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

// 6. Alteração de Status com Salvamento Automático
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

// 7. Abertura do Território Selecionado no Google My Maps Oficial
function abrirNoMyMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) return;
  const centro = territorioAtivo.layer.getBounds().getCenter();
  
  // Abre o My Maps com todos os polígonos carregados e focado no centro do território clicado
  const urlMyMaps = `https://www.google.com/maps/d/viewer?mid=${GOOGLE_MY_MAPS_MID}&ll=${centro.lat}%2C${centro.lng}&z=17`;
  window.open(urlMyMaps, '_blank');
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