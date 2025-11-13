import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set style for better-looking plots
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

def analyze_pokemon_data(csv_file='pokemon_complete.csv'):
    """Analyze Pokemon data and create visualizations"""
    
    # Load data
    print(" Loading Pokemon data...")
    df = pd.read_csv(csv_file)
    
    print(f"\nLoaded {len(df)} Pokemon!")
    print("\n" + "="*50)
    print("BASIC STATISTICS")
    print("="*50)
    
    # Basic stats
    print(f"\nTotal Pokemon: {len(df)}")
    print(f"Unique Types: {df['type1'].nunique()}")
    print(f"Dual-type Pokemon: {df['type2'].notna().sum()}")
    
    # Calculate total base stats
    df['total_stats'] = (df['hp'] + df['attack'] + df['defense'] + 
                         df['sp_attack'] + df['sp_defense'] + df['speed'])
    
    print("\n" + "="*50)
    print("TOP 10 STRONGEST POKEMON (by total stats)")
    print("="*50)
    top_10 = df.nlargest(10, 'total_stats')[['name', 'type1', 'type2', 'total_stats']]
    print(top_10.to_string(index=False))
    
    print("\n" + "="*50)
    print("AVERAGE STATS BY PRIMARY TYPE")
    print("="*50)
    type_stats = df.groupby('type1')[['hp', 'attack', 'defense', 
                                       'sp_attack', 'sp_defense', 
                                       'speed']].mean().round(1)
    print(type_stats)
    
    # Determine role based on stats
    df['role'] = df.apply(determine_role, axis=1)
    
    print("\n" + "="*50)
    print("POKEMON BY ROLE")
    print("="*50)
    role_counts = df['role'].value_counts()
    print(role_counts)
    
    # Create visualizations
    create_visualizations(df)
    
    # Save enhanced data
    df.to_csv('pokemon_analyzed.csv', index=False)
    return df

def determine_role(row):
    """Determine Pokemon's competitive role based on stats"""
    atk = row['attack']
    spa = row['sp_attack']
    defense = row['defense']
    spd = row['sp_defense']
    speed = row['speed']
    
    if atk > 120 and speed > 90:
        return "Physical Sweeper"
    elif spa > 120 and speed > 90:
        return "Special Sweeper"
    elif defense > 110:
        return "Physical Wall"
    elif spd > 110:
        return "Special Wall"
    elif atk > 100 and spa > 100:
        return "Mixed Attacker"
    elif (defense > 90 or spd > 90) and speed > 70:
        return "Defensive Pivot"
    elif speed > 100:
        return "Fast Support"
    else:
        return "Balanced"

def create_visualizations(df):
    """Create and save data visualizations"""
    print("\n Creating visualizations...")
    
    # 1. Type Distribution
    plt.figure(figsize=(14, 6))
    type_counts = df['type1'].value_counts()
    plt.bar(type_counts.index, type_counts.values, color='steelblue')
    plt.title('Pokemon Distribution by Primary Type', fontsize=16, fontweight='bold')
    plt.xlabel('Type', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('type_distribution.png', dpi=300, bbox_inches='tight')
    print(" Saved: type_distribution.png")
    
    # 2. Stats Correlation Heatmap
    plt.figure(figsize=(10, 8))
    stat_cols = ['hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed']
    correlation = df[stat_cols].corr()
    sns.heatmap(correlation, annot=True, cmap='coolwarm', center=0,
                square=True, linewidths=1, cbar_kws={"shrink": 0.8})
    plt.title('Pokemon Stat Correlations', fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig('stat_correlations.png', dpi=300, bbox_inches='tight')
    print(" Saved: stat_correlations.png")
    
    # 3. Role Distribution
    plt.figure(figsize=(12, 6))
    role_counts = df['role'].value_counts()
    colors = plt.cm.Set3(range(len(role_counts)))
    plt.bar(role_counts.index, role_counts.values, color=colors)
    plt.title('Pokemon Distribution by Competitive Role', fontsize=16, fontweight='bold')
    plt.xlabel('Role', fontsize=12)
    plt.ylabel('Count', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('role_distribution.png', dpi=300, bbox_inches='tight')
    print("Saved: role_distribution.png")
    
    # 4. Attack vs Defense Scatter
    plt.figure(figsize=(12, 8))
    for role in df['role'].unique():
        role_df = df[df['role'] == role]
        plt.scatter(role_df['attack'], role_df['defense'], alpha=0.6, label=role, s=50)
    plt.xlabel('Attack', fontsize=12)
    plt.ylabel('Defense', fontsize=12)
    plt.title('Attack vs Defense by Role', fontsize=16, fontweight='bold')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.savefig('attack_vs_defense.png', dpi=300, bbox_inches='tight')
    print(" Saved: attack_vs_defense.png")
    
    plt.close('all')

if __name__ == "__main__":
    df = analyze_pokemon_data()
    print("\n" + "="*50)
    print("ANALYSIS COMPLETE!")
    print("="*50)
    print("\nFiles created:")
    print("pokemon_analyzed.csv - Enhanced data with roles")
    print("type_distribution.png")
    print("stat_correlations.png")
    print("role_distribution.png")
    print("attack_vs_defense.png")