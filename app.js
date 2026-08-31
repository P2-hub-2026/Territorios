// Identificador do Google My Maps para exibir os polígonos traçados
const GOOGLE_MY_MAPS_MID = '143nsIAW7T0eb1rwMMv3T1YPxIMU86tg';

// 1. Inicialização do Mapa Leaflet
const map = L.map('map').setView([-4.245, -56.008], 14);

L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: 'Google Maps'
}).addTo(map);

let geojsonLayer = null;
let dadosTerritorios = [];
let geojsonData = null;
let territorioAtivo = null;
let marcadorUsuario = null;
let camadaDestacada = null;

// 2. Carregar Dados com Persistência Local (localStorage)
const dadosSalvos = localStorage.getItem('territorios_dados_db');

Promise.all([
  dadosSalvos ? Promise.resolve(JSON.parse(dadosSalvos)) : fetch('dados.json').then(res => res.json()).catch(() => []),
  fetch('territorios.geojson').then(res => res.json())
]).then(([dados, geojson]) => {
  geojsonData = geojson;
  
  // Cria cadastro padrão para qualquer polígono ausente no dados.json
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

  // Enquadra a visualização na extensão completa de todos os territórios
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  }
}).catch(err => {
  console.error("Erro ao carregar dados geográficos:", err);
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
      fillOpacity: 0.4
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

// 5. Exibir Ficha, Destacar Polígono com Linha Grossa e Centralizar
function abrirPainelTerritorio(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  // Restaura estilo da camada previamente selecionada
  if (camadaDestacada && geojsonLayer) {
    geojsonLayer.resetStyle(camadaDestacada);
  }

  // Localiza camada caso tenha sido acionado pelo GPS
  if (!layer && geojsonLayer) {
    geojsonLayer.eachLayer(l => {
      if (l.feature && l.feature.properties.name === codigo) {
        layer = l;
      }
    });
  }

  territorioAtivo = { info: item, layer: layer };

  // Destaque visual reforçado na tela
  if (layer) {
    camadaDestacada = layer;
    layer.setStyle({
      weight: 4,
      color: '#FFFFFF',
      fillOpacity: 0.65
    });
    layer.bringToFront();
    map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 17 });
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

// 7. Geração de URL Dinâmica do Território
function obterUrlDinamicaMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) return null;

  const bounds = territorioAtivo.layer.getBounds();
  const centro = bounds.getCenter();
  const lat = centro.lat.toFixed(6);
  const lng = centro.lng.toFixed(6);

  // Calcula o zoom ótimo conforme a extensão do polígono
  const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth());
  const lngDiff = Math.abs(bounds.getEast() - bounds.getWest());
  const maxDiff = Math.max(latDiff, lngDiff);

  let zoom = 17;
  if (maxDiff > 0.01) zoom = 15;
  else if (maxDiff > 0.005) zoom = 16;
  else if (maxDiff < 0.002) zoom = 18;

  return `https://www.google.com/maps/d/viewer?mid=${GOOGLE_MY_MAPS_MID}&ll=${lat}%2C${lng}&z=${zoom}`;
}

// Abertura Direta no Maps
function abrirRotaGoogleMaps() {
  const url = obterUrlDinamicaMaps();
  if (url) {
    window.open(url, '_blank');
  } else {
    alert("Selecione um território primeiro.");
  }
}

// 8. Geração e Exibição do QR Code
function gerarQRCodeTerritorio() {
  const urlMaps = obterUrlDinamicaMaps();
  if (!urlMaps) {
    alert("Selecione um território primeiro.");
    return;
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(urlMaps)}`;

  document.getElementById('qr-titulo').innerText = `Território: ${territorioAtivo.info.codigo}`;
  document.getElementById('qr-img').src = qrApiUrl;
  document.getElementById('modal-qrcode').classList.remove('oculto');
}

function fecharModalQRCode(event) {
  document.getElementById('modal-qrcode').classList.add('oculto');
}

// 9. Localização GPS em Tempo Real (Point-in-Polygon)
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
      console.log("Fora dos polígonos cadastrados.");
    }
  }, (erro) => {
    btnGps.innerText = "📍 Onde Estou?";
    alert('Erro ao obter GPS: ' + erro.message);
  }, { enableHighAccuracy: true });
}

// 10. Event Listeners dos Filtros
document.getElementById('filtro-grupo').addEventListener('change', renderizarMapa);
document.getElementById('modo-exibicao').addEventListener('change', renderizarMapa);