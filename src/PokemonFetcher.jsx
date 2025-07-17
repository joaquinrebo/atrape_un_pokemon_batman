import React, { useState, useEffect } from 'react';
import './PokemonFetcher.css';

const BuscadorDePokemon = () => {
  const [pokemones, setPokemones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [tiposDisponibles, setTiposDisponibles] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');

  const obtenerPokemonesAleatorios = async () => {
    try {
      setCargando(true);
      setError(null);

      const pokemonesObtenidos = [];
      const idsPokemon = new Set();

      while (idsPokemon.size < 20) {
        const idAleatorio = Math.floor(Math.random() * 898) + 1;
        idsPokemon.add(idAleatorio);
      }

      const arrayIds = Array.from(idsPokemon);

      for (const id of arrayIds) {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
        if (!respuesta.ok) {
          throw new Error(`Error al cargar el Pokémon con ID ${id}: ${respuesta.statusText}`);
        }
        const datos = await respuesta.json();
        pokemonesObtenidos.push({
          id: datos.id,
          nombre: datos.name,
          imagen: datos.sprites.front_default,
          tipos: datos.types.map(infoTipo => infoTipo.type.name),
        });
      }

      setPokemones(pokemonesObtenidos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const obtenerDatosIniciales = async () => {
      try {
        setCargando(true);
        setError(null);

        const respuestaTipos = await fetch('https://pokeapi.co/api/v2/type/');
        if (!respuestaTipos.ok) {
          throw new Error(`Error al cargar los tipos de Pokémon: ${respuestaTipos.statusText}`);
        }
        const datosTipos = await respuestaTipos.json();
        const tiposFiltrados = datosTipos.results
          .filter(tipo => !['unknown', 'shadow'].includes(tipo.name))
          .map(tipo => tipo.name);
        setTiposDisponibles(tiposFiltrados);

        await obtenerPokemonesAleatorios();
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosIniciales();
  }, []);

  useEffect(() => {
    const obtenerPokemonesPorTipo = async () => {
      if (!tipoSeleccionado) return;

      setCargando(true);
      setError(null);
      setPokemones([]);

      try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/type/${tipoSeleccionado}/`);
        if (!respuesta.ok) {
          throw new Error(`Error al cargar Pokémon del tipo ${tipoSeleccionado}: ${respuesta.statusText}`);
        }
        const datos = await respuesta.json();
        const pokemonesAObtener = datos.pokemon.slice(0, 20);

        const pokemonesDelTipo = await Promise.all(
          pokemonesAObtener.map(async (entradaPokemon) => {
            const respuestaPokemon = await fetch(entradaPokemon.pokemon.url);
            if (!respuestaPokemon.ok) {
              console.warn(`No se pudieron obtener los detalles de ${entradaPokemon.pokemon.name}`);
              return null;
            }
            const datosPokemon = await respuestaPokemon.json();
            return {
              id: datosPokemon.id,
              nombre: datosPokemon.name,
              imagen: datosPokemon.sprites.front_default,
              tipos: datosPokemon.types.map(infoTipo => infoTipo.type.name),
            };
          })
        );

        setPokemones(pokemonesDelTipo.filter(Boolean));
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerPokemonesPorTipo();
  }, [tipoSeleccionado]);

  const manejarSeleccionTipo = (tipo) => {
    setTipoSeleccionado(tipo);
  };

  return (
    <div className="pokedex-container">
      <div className="pokedex-header">
        <h1>Pokédex</h1>
        <div className="leds">
          <span className="led red"></span>
          <span className="led blue"></span>
          <span className="led green"></span>
        </div>
      </div>

      <div className="pantalla">
        {cargando ? (
          <p className="mensaje">Cargando Pokémon...</p>
        ) : error ? (
          <p className="mensaje error">Error: {error}</p>
        ) : (
          <>
            <h2>
              {tipoSeleccionado
                ? `Pokémon de tipo: ${tipoSeleccionado.charAt(0).toUpperCase() + tipoSeleccionado.slice(1)}`
                : 'Pokémon Aleatorios'}
            </h2>

            <div className="selector-tipo">
              <select onChange={(e) => manejarSeleccionTipo(e.target.value)} value={tipoSeleccionado}>
                <option value="">Selecciona un tipo</option>
                {tiposDisponibles.map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </option>
                ))}
              </select>

              <button onClick={() => {
                setTipoSeleccionado('');
                obtenerPokemonesAleatorios();
              }}>
                Mostrar aleatorios
              </button>
            </div>

            <div className="pokemon-grid">
              {pokemones.length > 0 ? (
                pokemones.map(pokemon => (
                  <div key={pokemon.id} className="pokemon-card">
                    <img src={pokemon.imagen} alt={pokemon.nombre} />
                    <h3>{pokemon.nombre}</h3>
                    <p><strong>Tipos:</strong> {pokemon.tipos.join(', ')}</p>
                  </div>
                ))
              ) : (
                <p className="mensaje">No se encontraron Pokémon.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuscadorDePokemon;