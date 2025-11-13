import requests
import pandas as pd
import time

def fetch_all_pokemon():
    print("Fetching Pokemon from PokeAPI...")
    
    # Get list of all Pokemon
    url = "https://pokeapi.co/api/v2/pokemon?limit=1025"
    response = requests.get(url)
    pokemon_list = response.json()['results']
    
    all_pokemon_data = []
    total = len(pokemon_list)
    
    for i, pokemon in enumerate(pokemon_list):
        if (i + 1) % 50 == 0:
            print(f" Fetched {i + 1}/{total} Pokemon...")
        
        try:
            # Get detailed Pokemon data
            detail_response = requests.get(pokemon['url'])
            data = detail_response.json()
            
            # Extract stats
            stats = {stat['stat']['name']: stat['base_stat'] 
                    for stat in data['stats']}
            
            # Extract types
            types = [t['type']['name'] for t in data['types']]
            
            pokemon_data = {
                'name': data['name'].title(),
                'pokedex_number': data['id'],
                'type1': types[0] if len(types) > 0 else None,
                'type2': types[1] if len(types) > 1 else None,
                'hp': stats.get('hp', 0),
                'attack': stats.get('attack', 0),
                'defense': stats.get('defense', 0),
                'sp_attack': stats.get('special-attack', 0),
                'sp_defense': stats.get('special-defense', 0),
                'speed': stats.get('speed', 0),
                'height': data['height'],
                'weight': data['weight'],
            }
            
            all_pokemon_data.append(pokemon_data)
            
            time.sleep(0.05)
            
        except Exception as e:
            print(f"Error fetching {pokemon['name']}: {e}")
            continue
    
    return pd.DataFrame(all_pokemon_data)

if __name__ == "__main__":
    print("Starting Pokemon data fetch...")
    df = fetch_all_pokemon()
    
    # Save to CSV
    df.to_csv('pokemon_complete.csv', index=False)
    print(f"\n SUCCESS! Saved {len(df)} Pokemon to pokemon_complete.csv")
    print("\nFirst 5 Pokemon:")
    print(df.head())