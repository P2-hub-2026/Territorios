// 1. Inicialização do Mapa com Camada Satélite do Google
const map = L.map('map').setView([-4.245, -56.008], 14);

L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: 'Google Maps'
}).addTo(map);

let geojsonLayer;
let dadosTerritorios = [];
let geojsonData = null;
let territorioAtivo = null;
let marcadorUsuario = null;

// 2. Carregar Dados com Persistência Local (localStorage)
const dadosSalvos = localStorage.getItem('territorios_dados_db');

Promise.all([
  dadosSalvos ? Promise.resolve(JSON.parse(dadosSalvos)) : fetch('dados.json').then(res => res.json()).catch(() => []),
  fetch('territorios.geojson').then(res => res.json())
]).then(([dados, geojson]) => {
  geojsonData = geojson;
  
  // Garante que todo território do GeoJSON tenha registro nos dados administrativos
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

  // Ajusta o zoom inicial para enquadrar todos os polígonos
  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
  }
}).catch(err => {
  console.error("Erro ao carregar os arquivos:", err);
  alert("Erro ao carregar dados. Verifique se os arquivos dados.json e territorios.geojson estão na mesma pasta.");
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
      fillOpacity: 0.45
    }),
    onEachFeature: (feature, layer) => {
      const nome = feature.properties.name || '';
      
      // Rótulo permanente com o código do território
      layer.bindTooltip(nome, {
        permanent: false,
        direction: 'center',
        className: 'label-territorio'
      });

      layer.on('click', () => abrirPainelTerritorio(nome, layer));
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
    map.fitBounds(layer.getBounds(), { padding: [40, 40] });
  }
}

function fecharPainel() {
  document.getElementById('painel-detalhes').classList.add('oculto');
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

  // Persistir no LocalStorage
  localStorage.setItem('territorios_dados_db', JSON.stringify(dadosTerritorios));

  // Atualizar visualização
  renderizarMapa();
  abrirPainelTerritorio(territorioAtivo.info.codigo, territorioAtivo.layer);
}

// 7. Rota Direta no Google Maps
function abrirRotaGoogleMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) return;
  const centro = territorioAtivo.layer.getBounds().getCenter();
  const url = `https://www.google.com/maps/dir/?api=1&destination=${centro.lat},${centro.lng}`;
  window.open(url, '_blank');
}

// 8. Localização GPS e Detecção Automática (Point-in-Polygon)
function ativarGPS() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada pelo seu dispositivo.');
    return;
  }

  const btnGps = document.getElementById('btn-gps');
  btnGps.innerText = "Buscando GPS...";

  navigator.geolocation.watchPosition((pos) => {
    btnGps.innerText = "GPS Ativo";
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const pontoAtual = turf.point([lng, lat]);

    if (!marcadorUsuario) {
      marcadorUsuario = L.circleMarker([lat, lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: '#007bff',
        fillOpacity: 1
      }).addTo(map);
    } else {
      marcadorUsuario.setLatLng([lat, lng]);
    }

    // Detecção se o usuário está dentro de algum polígono
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

// 9. Event Listeners dos Filtros
document.getElementById('filtro-grupo').addEventListener('change', renderizarMapa);
document.getElementById('modo-exibicao').addEventListener('change', renderizarMapa);