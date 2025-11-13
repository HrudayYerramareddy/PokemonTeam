import pandas as pd
import json

def convert_to_react_format():
    #Convert CSV data to JSON format for React app
    # Load analyzed data
    df = pd.read_csv('pokemon_analyzed.csv')
    
    # Convert to list of dictionaries
    pokemon_list = []
    for _, row in df.iterrows():
        pokemon = {
            "name": row['name'],
            "types": [row['type1']] + ([row['type2']] if pd.notna(row['type2']) else []),
            "role": row['role'],
            "hp": int(row['hp']),
            "atk": int(row['attack']),
            "def": int(row['defense']),
            "spa": int(row['sp_attack']),
            "spd": int(row['sp_defense']),
            "spe": int(row['speed'])
        }
        pokemon_list.append(pokemon)
    
    # Save as JavaScript constant
    with open('pokemonData.js', 'w') as f:
        f.write('// Generated Pokemon data from Python analysis\n')
        f.write('// Total Pokemon: ' + str(len(pokemon_list)) + '\n\n')
        f.write('export const POKEMON_DB = ')
        f.write(json.dumps(pokemon_list, indent=2))
        f.write(';\n')
    
    print(f"Converted {len(pokemon_list)} Pokemon to pokemonData.js")

if __name__ == "__main__":
    convert_to_react_format()