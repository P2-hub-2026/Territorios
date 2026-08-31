// Dicionário com os 58 MIDs individuais de cada território
const MAPS_MID_DICT = {
  "jrdTer01": "143nsIAW7T0eb1rwMMv3T1YPxIMU86tg",
  "jrdTer02": "15JZ9M3fb8LNgFdO1AjaRDYQ0doXd6FY",
  "jrdTer03": "1jfiXS77PODUD7XaKpq9vUeIVw8Z-L5Q",
  "jrdTer04": "1erRNl2DxpFMP33znePN0mAO8oKM1rHA",
  "jrdTer05": "1ToCioJ9TLlom_T-745ammSnI8yKoZjU",
  "jrdTer06": "1wdc2dhsY9qhUSVLv_Op7MxyEoW-MhH8",
  "jrdTer07": "13XmMkARz2y7d1Qiy_2Dy_G8SdHx9_kU",
  "jrdTer08": "1tARgl3P4l5qObQHQ97fL521qcYfJRjU",
  "jrdTer09": "1Q6T9OgOxHi37ZAPhYT55HyAbrtqjE2o",
  "jrdTer10": "1rCekVn7klm2erLF50_K10Iv7O4UhVGg",
  "jrdTer11": "19wd9Gb_19cmJIj8YaC7sqQSeku92J2s",
  "jrdTer12": "1gLzBbKSozn2PZoDLtPRpz_h3Ih--MGI",
  "jrdTer13": "1TSWmznQlzfdH0opKBwKoWQOEtJhArx8",
  "jrdTer14": "1JuBw3uXWjHYAhp3kvtXgr9mFSVFTrYc",
  "jrdTer15": "1pT4XRVGVD0H-xQlsJZbab7T8N7Wpg1A",
  "jrdTer16": "14cmuKoN8iLaaOTLTA-0C5DrCGz5enrs",
  "jrdTer17": "134yRyFuPkDMh8GHWqQhMDKolVDjpJOk",
  "jrdTer18": "16TEv1rGFUPP56I0thzkcKNdq-XPW-Ig",
  "jrdTer19": "15PtrFGOg1-0ELeXj4Cws95FWYaAkkjg",
  "jrdTer20": "1dAuHzaipAg8qPOzuzKCQ8lB3FWW_MiI",
  "jrdTer21": "1Ki37Xpv8H-HKv3P-HDNL6kYKkqHMa5A",
  "jrdTer22": "1PpQDpI-UVuwJYG-MxjqpHzPbQud6iss",
  "jrdTer23": "1Q9H0L_Y2Sum_w-5X1ZAYnAlJ6SuSQcU",
  "jrdTer24": "1aYBfbgkGwxVnDN4uZFT2rfDxIarG7HI",
  "jrdTer25": "1cwo-aBUBHuLDQaDNfbY2NpH0p9plYWI",
  "jrdTer26": "1kuvvqDTtzRjwOgDCiCvB87JAjHZqVok",
  "jrdTer27": "10T9SotT80SzxVDxAIPWmYbt8JjtlHYU",
  "jrdTer28": "17xzdeMXC9yhDtf0G8leu6AOL02lZds8",
  "jrdTer29": "18i8-WclYyy48MpCfmoKXxJxqjEDPxZs",
  "jrdTer30": "17WCykHpEhAkdBxWSn66fp6tZfoHT7Ls",
  "jrdTer31": "1T2ROTIZI5poj7rLeD5VU3tvze2DRGDc",
  "jrdTer32": "1j5ejjQ1529ZNQjwKCZHZ84eB3oQKDE4",
  "jrdTer33": "1a88-7z4qbb4VKPu1I36xUR3ogYbTNYg",
  "jrdTer34": "1kJONRS83u971SojunjpcH-jkMHa4828",
  "jrdTer35": "13LZ7LWlKEDRLoi1qC8gXDEo1_l5zvrE",
  "jrdTer36": "1QJSkfKx5sUbksJe4GQY7oTCMkqxI65A",
  "jrdTer37": "1TDaGSKmLn9YHYU1Vk8CnMkdWrQIyJd8",
  "jrdTer38": "1tTEb5q4MshCR_pp_sTDe3oiIMDe79ZU",
  "jrdTer39": "1BNOdfhWVZW0e0NRO58sszdpcE-lWwZ4",
  "jrdTer40": "1VROx8EouqOdmkMN6LnI4kwuFfMYXbyM",
  "jrdTer41": "1zTxeZyorfLLvUypkdCfcOHa6z-mNhGI",
  "jrdTer42": "1iI_KKq_bfmOkXray3vLAnaRyr5ogRzk",
  "jrdTer43": "1kBJ756zfQZtitwxWGKqEHO_49AWEMHc",
  "jrdTer44": "1qBoCKh5hVXOow2Qr2uWRELhn_0uLjt4",
  "jrdTer45": "17iGF-ozgwQNC_6qf4bGoRMh84IgnDgE",
  "jrdTer46": "11ygCPhXsfz8nl4ZF3WsAJQKEkNExstE",
  "jrdTer47": "1d3kyL1qX0PgHFUxewTCS8bdFdlVaVIw",
  "jrdTer48": "1ndhxKy38yutXjabo9yzEkFyue83kTHk",
  "jrdTer49": "1VP1B_6L-3fR57ihsLm9mms1TR422eis",
  "jrdTer50": "1f4JeFs7sRtnxRuxu42jXTuqx4MOL2ik",
  "jrdTer51": "1tPxG3iGyihwk_WOnik1X7AQAzgyQ1zI",
  "jrdTer52": "1Y-RoSuax18a0b4GKdYgWQiP3yaM4t7M",
  "jrdTer53": "1X9nKd6ClR34zR-rAtUl2vCARAHWGOEM",
  "jrdTer54": "10rgBiaxOK8Bk9wVN_zmPtMll9GyH5UE",
  "jrdTer55": "13TTbP390BVNcX3AIq29fw7e8CR94vJI",
  "jrdTer56": "10YYYlwEhZvkrzTfFxnanpY68BXe_FjA",
  "jrdTer57": "1_BF9AC9eFNlOZ1J8xUCER9g0rYOp7L8",
  "jrdTer58": "1HVlYVZ_InYSMw98d25ERM0hxELY42hc"
};

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
      style: (feature) => obterEstiloPoligono(feature.properties.name),
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

// 4. Regra de Estilo e Cores (Livre = sem preenchimento)
function obterEstiloPoligono(codigo) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  const status = item ? item.status : 'Livre';

  if (status === 'Iniciado') {
    return {
      color: '#F4B400',
      weight: 2,
      fillColor: '#F4B400',
      fillOpacity: 0.45
    };
  } else if (status === 'Concluído') {
    return {
      color: '#007bff',
      weight: 2,
      fillColor: '#007bff',
      fillOpacity: 0.45
    };
  }

  // Status "Livre" (ou padrão): Apenas linha delimitadora, sem preenchimento
  return {
    color: '#0F9D58',
    weight: 2,
    fillColor: 'transparent',
    fillOpacity: 0
  };
}

// 5. Interação ao Clicar no Território
function abrirPainel(codigo, layer) {
  const item = dadosTerritorios.find(t => t.codigo === codigo);
  if (!item) return;

  // Limpa seleção visual anterior
  if (camadaDestacada && geojsonLayer) geojsonLayer.resetStyle(camadaDestacada);

  territorioAtivo = { info: item, layer: layer };
  
  // Destaca o polígono selecionado com contorno reforçado
  camadaDestacada = layer;
  layer.setStyle({ 
    weight: 4, 
    color: '#FFFFFF', 
    fillOpacity: item.status === 'Livre' ? 0.2 : 0.7 
  });
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
  
  // Atualiza todo o estilo do mapa aplicando a transparência
  geojsonLayer.setStyle(f => obterEstiloPoligono(f.properties.name));
  abrirPainel(territorioAtivo.info.codigo, territorioAtivo.layer);
}

// 7. Abertura Exata da URL do My Maps com o MID Correspondente
function abrirGoogleMaps() {
  if (!territorioAtivo || !territorioAtivo.layer) {
    alert("Selecione um território primeiro.");
    return;
  }
  
  const codigo = territorioAtivo.info.codigo;
  const mid = MAPS_MID_DICT[codigo];

  if (!mid) {
    alert(`Link do mapa não cadastrado para o território ${codigo}.`);
    return;
  }

  const bounds = territorioAtivo.layer.getBounds();
  const centro = bounds.getCenter();
  const lat = centro.lat.toFixed(14);
  const lng = centro.lng.toFixed(14);

  const urlMyMaps = `https://www.google.com/maps/d/u/0/embed?mid=${mid}&ehbc=2E312F&noprof=1&ll=${lat}%2C${lng}&z=16`;
  
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