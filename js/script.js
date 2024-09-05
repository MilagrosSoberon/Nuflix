// TOKENS
var tokenApi = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNDI2MDA1YmY1OWZkOWQxNmVmOTk0YmU2Y2QzMWQ2YiIsIm5iZiI6MTcxOTk1OTQ4NS45ODcwNDEsInN1YiI6IjY2NjY3MDMxNzUyMDYzZWMwZWU5ZGZkYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.515xXPIR5E51CDxk9wyIDBO_s2iauAH9WG0PpWACwg8";
var tokenStrapi = "099da4cc6cbb36bf7af8de6f1f241f8c81e49fce15709c4cfcae1313090fa2c1ac8703b0179863b4eb2739ea65ae435e90999adb870d49f9f94dcadd88999763119edca01a6b34c25be92a80ed30db1bcacb20df40e4e7f45542bd501f059201ad578c18a11e4f5cd592cb25d6c31a054409caa99f11b6d2391440e9c72611ea";

//URLS
const apiURLSeries = "https://api.themoviedb.org/3/discover/tv?first_air_date_year=2020&include_adult=false&include_null_first_air_dates=false&language=es-ES&page=1&sort_by=popularity.desc";
const apiURLGenres = "https://api.themoviedb.org/3/genre/tv/list?language=es-ES";
const apiURLStrapi = "https://gestionweb.frlp.utn.edu.ar/api/g4-series"; 

const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer " + tokenApi);
myHeaders.append("accept", "application/json");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};
//  ----------- BOTONES -------------
// Verifica si el botón debe estar oculto al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const botonCargar = document.getElementById('botonCargar');
  if (localStorage.getItem('botonCargarOculto') === 'true') {
    botonCargar.style.display = '';
  }
});


//  ----------- GENEROS -------------
//Función para cargar géneros
const cargarGeneros = async () => {
  try {
    const respuesta = await fetch(apiURLGenres, requestOptions);
    
    if (respuesta.status === 200) {
      const datos = await respuesta.json();
      console.log("Datos obtenidos de la API:", datos.genres);
    
      const genresMap = {};
      datos.genres.forEach(genre => {
        genresMap[genre.id] = genre.name;
      });
        console.log("Genero por cargar:", genresMap);
        return genresMap; 

    } else {
      throw new Error("Error al cargar los géneros");
    }
  } catch (error) {
    console.log("Error en cargarGeneros:", error);
    return null;
  }
};


//  ----------- SERIES -------------
// Funcion para cargar series
const cargarSeries = async () => {
   // Ocultar el botón y guardar el estado en localStorage
   const botonCargar = document.getElementById('botonCargar');
   botonCargar.style.display = 'none';
   localStorage.setItem('botonCargarOculto', 'true');
 
  try {
   
    const genresMap = await cargarGeneros();
    if (!genresMap) return;

    console.log("Generos cargados:", genresMap);
    const respuesta = await fetch(apiURLSeries, requestOptions);

    if (respuesta.status === 200) {
      const datos = await respuesta.json();
      console.log("Datos obtenidos de la API:", datos.results);

      for (let i = 0; i < 1; i++) {
        const serie = datos.results[i];
        const nombresGeneros = serie.genre_ids.map(id => genresMap[id]).join(', ');
      
        // objeto serie para enviar a Strapi
        const series = {
          data: {
            id: serie.id,
            titulo: serie.name,
            sinopsis: serie.overview,
            genero: nombresGeneros, 
            promedioVotos: serie.vote_average,
            cantidadVotos: serie.vote_count,
            poster: serie.poster_path,
          }
        };
        
        console.log("Serie por cargar:", series);
        await enviarSeriesAStrapi(series);
      }

      alert("Series cargadas correctamente a Strapi! :D. Recargue la página");
    } else {
      throw new Error("Error al cargar las series desde la API externa");
      
    }
  } catch (error) {
    console.log("Error en cargarSeries:", error);
    return null;
  }
};


// enviar series a Strapi
const enviarSeriesAStrapi = async (serie) => {
  try {
    console.log("Enviando serie a Strapi:", serie);
  
      const response = await fetch(apiURLStrapi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + tokenStrapi, // Asegúrate de tener el token de autenticación de Strapi correcto
        },
        
        body: JSON.stringify(serie)
        
      });
      console.log(serie);
      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Error al enviar la serie ${serie.titulo} a Strapi: ${response.status} ${response.statusText} - ${errorDetails}`);
      } else {
        console.log(`Serie ${serie.name} enviada correctamente a Strapi`);
      }
  } catch (error) {
    console.error("Error en enviarSeriesAStrapi:", error);
  }
};

// // Función para obtener series desde Strapi
const getSeriesStrapi = async () => {
  try {
    const response = await fetch(apiURLStrapi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tokenStrapi,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener las series desde Strapi: ${response.status} ${response.statusText}`);
    }

    const seriesData = await response.json();
    console.log("Series obtenidas desde Strapi:", seriesData);

    // Mapear los datos de series a un formato deseado
    const series = seriesData.data.map((serie) => ({
      id: serie.id,
      titulo: serie.attributes.titulo,
      sinopsis: serie.attributes.sinopsis,
      genero: serie.attributes.genero,
      promedioVotos: serie.attributes.promedioVotos,
      cantidadVotos: serie.attributes.cantidadVotos,
      poster: serie.attributes.poster, 
    }));

    // Mostrar las series en el DOM
    mostrarSeriesEnDOM(series); 
   
  } catch (error) {
    console.error("Error en getSeriesFromStrapi:", error);
    return null;
  }
};

//  ----------- SERIES POR GENERO -------------
const getSeriesDramaStrapi = async () => {
  try {
    const response = await fetch(apiURLStrapi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tokenStrapi,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener las series desde Strapi: ${response.status} ${response.statusText}`);
    }

    const seriesData = await response.json();
    console.log("Series obtenidas desde Strapi:", seriesData);

    const series = seriesData.data
      .filter((serie) => serie.attributes.genero.includes("Drama"))
      .map((serie) => ({
        id: serie.id,
        titulo: serie.attributes.titulo,
        sinopsis: serie.attributes.sinopsis,
        genero: serie.attributes.genero,
        promedioVotos: serie.attributes.promedioVotos,
        cantidadVotos: serie.attributes.cantidadVotos,
        poster: serie.attributes.poster, 
      }));

    // Mostrar las series en el DOM
    const contenedor = document.getElementById("contenedorDrama");
    series.forEach((serie) => {
      const serieElement = document.createElement("div");
      serieElement.className = "serie";
      poster =  `https://image.tmdb.org/t/p/w500${serie.poster}`
      serieElement.innerHTML =  `
        <img class="poster" src="${poster}" alt="${serie.name}">
        <h3 class="titulo">${serie.titulo}</h3>
        <p class="sinopsis">${serie.sinopsis}</p>
        <p class="genero">Género: ${serie.genero}</p>
        <p class="votos">Cantidad de votos: ${serie.cantidadVotos}</p>
        <p class="promedio">Promedio de votos: ${serie.promedioVotos}</p>
      `;
      contenedor.appendChild(serieElement);
    });
  } catch (error) {
    console.error("Error en getSeriesDramaStrapi:", error);
    return null;
  }
};

const getSeriesComediaStrapi = async () => {
  try {
    const response = await fetch(apiURLStrapi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tokenStrapi,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener las series desde Strapi: ${response.status} ${response.statusText}`);
    }

    const seriesData = await response.json();
    console.log("Series obtenidas desde Strapi:", seriesData);

    const series = seriesData.data
      .filter((serie) => serie.attributes.genero.includes("Comedia"))
      .map((serie) => ({
        id: serie.id,
        titulo: serie.attributes.titulo,
        sinopsis: serie.attributes.sinopsis,
        genero: serie.attributes.genero,
        promedioVotos: serie.attributes.promedioVotos,
        cantidadVotos: serie.attributes.cantidadVotos,
        poster: serie.attributes.poster, 
      }));

    // Mostrar las series en el DOM
    const contenedor = document.getElementById("contenedorComedia");
    series.forEach((serie) => {
      const serieElement = document.createElement("div");
      serieElement.className = "serie";
      poster =  `https://image.tmdb.org/t/p/w500${serie.poster}`
      serieElement.innerHTML =  `
        <img class="poster" src="${poster}" alt="${serie.name}">
        <h3 class="titulo">${serie.titulo}</h3>
        <p class="sinopsis">${serie.sinopsis}</p>
        <p class="genero">Género: ${serie.genero}</p>
        <p class="votos">Cantidad de votos: ${serie.cantidadVotos}</p>
        <p class="promedio">Promedio de votos: ${serie.promedioVotos}</p>
      `;
      contenedor.appendChild(serieElement);
    });
  } catch (error) {
    console.error("Error en getSeriesComediaStrapi:", error);
    return null;
  }
};

const getSeriesCienciaFiccionStrapi = async () => {
  try {
    const response = await fetch(apiURLStrapi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tokenStrapi,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener las series desde Strapi: ${response.status} ${response.statusText}`);
    }

    const seriesData = await response.json();
    console.log("Series obtenidas desde Strapi:", seriesData);

    const series = seriesData.data
      .filter((serie) => serie.attributes.genero.includes("Sci-Fi"))
      .map((serie) => ({
        id: serie.id,
        titulo: serie.attributes.titulo,
        sinopsis: serie.attributes.sinopsis,
        genero: serie.attributes.genero,
        promedioVotos: serie.attributes.promedioVotos,
        cantidadVotos: serie.attributes.cantidadVotos,
        poster: serie.attributes.poster, 
      }));

    // Mostrar las series en el DOM
    const contenedor = document.getElementById("contenedorCienciaFiccion");
    series.forEach((serie) => {
      const serieElement = document.createElement("div");
      serieElement.className = "serie";
      poster =  `https://image.tmdb.org/t/p/w500${serie.poster}`
      serieElement.innerHTML =  `
        <img class="poster" src="${poster}" alt="${serie.name}">
        <h3 class="titulo">${serie.titulo}</h3>
        <p class="sinopsis">${serie.sinopsis}</p>
        <p class="genero">Género: ${serie.genero}</p>
        <p class="votos">Cantidad de votos: ${serie.cantidadVotos}</p>
        <p class="promedio">Promedio de votos: ${serie.promedioVotos}</p>
      `;
      contenedor.appendChild(serieElement);
    });
  } catch (error) {
    console.error("Error en getSeriesCienciaFiccionStrapi:", error);
    return null;
  }
};

const getSeriesAccionStrapi = async () => {
  try {
    const response = await fetch(apiURLStrapi, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tokenStrapi,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener las series desde Strapi: ${response.status} ${response.statusText}`);
    }

    const seriesData = await response.json();
    console.log("Series obtenidas desde Strapi:", seriesData);

    const series = seriesData.data
      .filter((serie) => serie.attributes.genero.includes("Action"))
      .map((serie) => ({
        id: serie.id,
        titulo: serie.attributes.titulo,
        sinopsis: serie.attributes.sinopsis,
        genero: serie.attributes.genero,
        promedioVotos: serie.attributes.promedioVotos,
        cantidadVotos: serie.attributes.cantidadVotos,
        poster: serie.attributes.poster, 
      }));

    // Mostrar las series en el DOM
    const contenedor = document.getElementById("contenedorAccion");
    series.forEach((serie) => {
      const serieElement = document.createElement("div");
      serieElement.className = "serie";
      poster =  `https://image.tmdb.org/t/p/w500${serie.poster}`
      serieElement.innerHTML =  `
        <img class="poster" src="${poster}" alt="${serie.name}">
        <h3 class="titulo">${serie.titulo}</h3>
        <p class="sinopsis">${serie.sinopsis}</p>
        <p class="genero">Género: ${serie.genero}</p>
        <p class="votos">Cantidad de votos: ${serie.cantidadVotos}</p>
        <p class="promedio">Promedio de votos: ${serie.promedioVotos}</p>
      `;
      contenedor.appendChild(serieElement);
    });
  } catch (error) {
    console.error("Error en getSeriesAccionStrapi:", error);
    return null;
  }
};

// Llamar a la función para cargar las series de su genero al cargar la página
document.addEventListener("DOMContentLoaded", getSeriesDramaStrapi);
document.addEventListener("DOMContentLoaded", getSeriesComediaStrapi);
document.addEventListener("DOMContentLoaded", getSeriesCienciaFiccionStrapi);
document.addEventListener("DOMContentLoaded", getSeriesAccionStrapi);

const mostrarSeriesEnDOM = (series) => {
  let seriesHTML = '';

  series.forEach((serie) => {
    // const generos = series.genero.map(id => genresMap[id]).join(', ');
    poster =  `https://image.tmdb.org/t/p/w500${serie.poster}`
    seriesHTML += `
      <div class="serie">
        <img class="poster" src="${poster}" alt="${serie.name}">
        <h3 class="titulo">${serie.titulo}</h3>
        <p class="sinopsis">${serie.sinopsis}</p>
        <p class="genero">Género: ${serie.genero}</p>
        <p class="votos">Cantidad de votos: ${serie.cantidadVotos}</p>
        <p class="promedio">Promedio de votos: ${serie.promedioVotos}</p>
      </div>`;
  
  // Insertar las series en el contenedor del DOM
  const contenedorSeries = document.getElementById('contenedor');
  contenedorSeries.innerHTML = seriesHTML;
  });
};

// FUNCION PARA obtener las series desde Strapi
getSeriesStrapi();
// // FUNCION PARA CARGAR SERIES

//cargarSeries();

