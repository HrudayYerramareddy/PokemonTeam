import React, { useState, useMemo } from 'react';
import { Shield, Zap, Heart, Swords, TrendingUp, X, Search, Download } from 'lucide-react';
import { POKEMON_DB } from './pokemonData';

// Type effectiveness chart
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const roleIcons = {
  "Physical Sweeper": Swords,
  "Special Sweeper": Zap,
  "Physical Wall": Shield,
  "Special Wall": Heart,
  "Mixed Attacker": TrendingUp,
  "Defensive Pivot": Shield,
  "Fast Support": Zap,
  "Balanced": TrendingUp
};

function PokemonTeamBuilder() {
  const [team, setTeam] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const addToTeam = (pokemon) => {
    if (team.length < 6 && !team.find(p => p.name === pokemon.name)) {
      setTeam([...team, pokemon]);
      setSearchTerm("");
    }
  };

  const removeFromTeam = (name) => {
    setTeam(team.filter(p => p.name !== name));
  };

  const clearTeam = () => {
    setTeam([]);
  };

  const exportTeam = () => {
    const teamData = {
      team: team.map(p => p.name),
      date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(teamData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokemon-team.json';
    a.click();
  };

  const getDefensiveMultiplier = (types, attackType) => {
    let mult = 1;
    types.forEach(defType => {
      mult *= (TYPE_CHART[attackType]?.[defType] ?? 1);
    });
    return mult;
  };

  const recommendations = useMemo(() => {
    if (team.length === 0 || team.length >= 6) return [];

    const allTypes = Object.keys(TYPE_CHART);
    const teamWeaknesses = {};
    
    allTypes.forEach(attackType => {
      let total = 0;
      team.forEach(member => {
        total += getDefensiveMultiplier(member.types, attackType);
      });
      teamWeaknesses[attackType] = total / team.length;
    });

    const roleCounts = {};
    team.forEach(member => {
      roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
    });

    const candidates = POKEMON_DB
      .filter(p => !team.find(t => t.name === p.name))
      .map(candidate => {
        let coverageScore = 0;
        let offensiveCoverage = 0;

        Object.entries(teamWeaknesses).forEach(([attackType, teamMult]) => {
          if (teamMult > 1) {
            const candMult = getDefensiveMultiplier(candidate.types, attackType);
            if (candMult < 1) {
              coverageScore += (teamMult - candMult) * 2;
            }
          }
        });

        candidate.types.forEach(atkType => {
          const effectiveness = TYPE_CHART[atkType] || {};
          Object.values(effectiveness).forEach(mult => {
            if (mult === 2) offensiveCoverage += 0.5;
          });
        });

        const roleBonus = roleCounts[candidate.role] === 0 ? 5 : 
                         roleCounts[candidate.role] === 1 ? 2 : 0;

        const avgAtk = team.reduce((sum, p) => sum + p.atk, 0) / team.length;
        const avgSpA = team.reduce((sum, p) => sum + p.spa, 0) / team.length;
        const avgDef = team.reduce((sum, p) => sum + p.def, 0) / team.length;
        const avgSpD = team.reduce((sum, p) => sum + p.spd, 0) / team.length;
        
        let statBonus = 0;
        if (avgDef < 90 && candidate.def > 100) statBonus += 2;
        if (avgSpD < 90 && candidate.spd > 100) statBonus += 2;
        if (avgAtk < 100 && candidate.atk > 120) statBonus += 2;
        if (avgSpA < 100 && candidate.spa > 120) statBonus += 2;

        const totalScore = coverageScore + offensiveCoverage + roleBonus + statBonus;

        return {
          ...candidate,
          score: totalScore,
          coverageScore: coverageScore.toFixed(1),
          roleBonus,
          statBonus
        };
      });

    return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [team]);

  const teamWeaknesses = useMemo(() => {
    if (team.length === 0) return [];
    
    const allTypes = Object.keys(TYPE_CHART);
    const weaknesses = [];
    
    allTypes.forEach(attackType => {
      let total = 0;
      team.forEach(member => {
        total += getDefensiveMultiplier(member.types, attackType);
      });
      const avg = total / team.length;
      if (avg > 1) {
        weaknesses.push({ type: attackType, multiplier: avg.toFixed(2) });
      }
    });
    
    return weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  }, [team]);

  const filteredPokemon = POKEMON_DB.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || p.types.includes(typeFilter);
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    return matchesSearch && matchesType && matchesRole;
  });

  const allTypes = [...new Set(POKEMON_DB.flatMap(p => p.types))].sort();
  const allRoles = [...new Set(POKEMON_DB.map(p => p.role))].sort();

  const getTypeColor = (type) => {
    const colors = {
      normal: "bg-gray-400", fire: "bg-orange-500", water: "bg-blue-500",
      electric: "bg-yellow-400", grass: "bg-green-500", ice: "bg-cyan-300",
      fighting: "bg-red-700", poison: "bg-purple-500", ground: "bg-yellow-700",
      flying: "bg-indigo-300", psychic: "bg-pink-500", bug: "bg-lime-500",
      rock: "bg-yellow-800", ghost: "bg-purple-700", dragon: "bg-indigo-600",
      dark: "bg-gray-700", steel: "bg-gray-500", fairy: "bg-pink-300"
    };
    return colors[type] || "bg-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            ⚡ Pokémon Team Builder
          </h1>
          <p className="text-gray-600 mb-1">
            Build your team and get AI-powered recommendations
          </p>
          <p className="text-sm text-gray-500">
            {POKEMON_DB.length} Pokémon available
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Team Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Team */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Your Team ({team.length}/6)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportTeam}
                    disabled={team.length === 0}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  <button
                    onClick={clearTeam}
                    disabled={team.length === 0}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {team.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">No Pokémon selected yet</p>
                  <p className="text-sm">Search and add Pokémon below to get started</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {team.map(pokemon => {
                      const Icon = roleIcons[pokemon.role] || Shield;
                      return (
                        <div key={pokemon.name} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                          <div className="flex-1">
                            <div className="font-bold text-gray-800 text-lg">{pokemon.name}</div>
                            <div className="flex items-center gap-2 mt-2">
                              {pokemon.types.map(type => (
                                <span key={type} className={`${getTypeColor(type)} text-white text-xs px-3 py-1 rounded-full font-semibold`}>
                                  {type}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                              <Icon size={14} />
                              <span>{pokemon.role}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                            HP {pokemon.hp} • ATK {pokemon.atk} • DEF {pokemon.def} • SPA {pokemon.spa} • SPD {pokemon.spd} • SPE {pokemon.spe}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromTeam(pokemon.name)}
                            className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Team Weaknesses */}
                  {teamWeaknesses.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h3 className="font-bold text-red-800 mb-2">⚠️ Team Weaknesses</h3>
                      <div className="flex flex-wrap gap-2">
                        {teamWeaknesses.slice(0, 6).map(w => (
                          <span key={w.type} className={`${getTypeColor(w.type)} text-white text-sm px-3 py-1 rounded-full`}>
                            {w.type} ({w.multiplier}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pokemon Search and Selection */}
            {team.length < 6 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Add Pokémon
                </h2>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="md:col-span-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {allTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  >
                    <option value="all">All Roles</option>
                    {allRoles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Pokemon List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredPokemon
                    .filter(p => !team.find(t => t.name === p.name))
                    .slice(0, 50)
                    .map(pokemon => {
                      const Icon = roleIcons[pokemon.role] || Shield;
                      return (
                        <button
                          key={pokemon.name}
                          onClick={() => addToTeam(pokemon)}
                          className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-800">{pokemon.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {pokemon.types.map(type => (
                                  <span key={type} className={`${getTypeColor(type)} text-white text-xs px-2 py-1 rounded`}>
                                    {type}
                                  </span>
                                ))}
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Icon size={12} />
                                  {pokemon.role}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {pokemon.hp + pokemon.atk + pokemon.def + pokemon.spa + pokemon.spd + pokemon.spe} BST
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  {filteredPokemon.length > 50 && (
                    <div className="text-center text-sm text-gray-500 py-2 bg-gray-50 rounded">
                      Showing first 50 of {filteredPokemon.length} results
                    </div>
                  )}
                  {filteredPokemon.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No Pokémon found matching your filters
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recommendations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🎯 Recommendations
              </h2>

              {team.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">👈</div>
                  <p>Add at least one Pokémon to see recommendations</p>
                </div>
              ) : team.length >= 6 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-bold text-green-600">Team Complete!</p>
                  <p className="text-sm mt-2">You have a full team of 6 Pokémon</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec, idx) => {
                    const Icon = roleIcons[rec.role] || Shield;
                    return (
                      <div 
                        key={rec.name} 
                        className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${
                          idx === 0 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => addToTeam(rec)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg text-gray-800">{rec.name}</span>
                              {idx === 0 && <span className="text-yellow-600 text-xs font-bold">⭐ TOP</span>}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {rec.types.map(type => (
                                <span key={type} className={`${getTypeColor(type)} text-white text-xs px-2 py-0.5 rounded`}>
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-xl font-bold text-blue-600">{rec.score.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">score</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                          <Icon size={14} />
                          <span className="font-medium">{rec.role}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="bg-blue-100 px-2 py-1 rounded">
                            Coverage: <span className="font-bold">{rec.coverageScore}</span>
                          </div>
                          <div className="bg-green-100 px-2 py-1 rounded">
                            Role: <span className="font-bold">+{rec.roleBonus}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          Click to add to team
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Data analyzed using Python • {POKEMON_DB.length} Pokémon loaded</p>
        </div>
      </div>
    </div>
  );
}

export default PokemonTeamBuilder;