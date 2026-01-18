import React, { useState, useCallback } from 'react';

const GwintCalculator = () => {
  const [weather, setWeather] = useState({ melee: false, ranged: false, siege: false });
  const [activeCardForm, setActiveCardForm] = useState(null);
  const [newCard, setNewCard] = useState({ strength: '', isHero: false, hasMorale: false, hasBond: false });
  
  const [players, setPlayers] = useState({
    player1: {
      name: 'Gracz 1',
      rows: {
        melee: { cards: [], horn: false },
        ranged: { cards: [], horn: false },
        siege: { cards: [], horn: false }
      }
    },
    player2: {
      name: 'Gracz 2',
      rows: {
        melee: { cards: [], horn: false },
        ranged: { cards: [], horn: false },
        siege: { cards: [], horn: false }
      }
    }
  });

  const rowNames = {
    melee: '⚔️ Walka wręcz',
    ranged: '🏹 Dystans',
    siege: '🏰 Oblężenie'
  };

  const weatherNames = {
    melee: 'Mróz',
    ranged: 'Mgła',
    siege: 'Deszcz'
  };

  const calculateCardStrength = useCallback((card, row, playerId, rowType) => {
    if (card.isHero) return card.strength;

    let strength = card.strength;

    // Więź - mnożymy przez liczbę kart z więzią o tej samej sile bazowej
    if (card.hasBond) {
      const bondCards = row.cards.filter(c => c.hasBond && c.strength === card.strength && !c.isHero);
      strength = card.strength * bondCards.length;
    }

    // Wysokie morale - +1 za każdą kartę z morale (oprócz siebie)
    const moraleCards = row.cards.filter(c => c.hasMorale && c.id !== card.id && !c.isHero);
    strength += moraleCards.length;

    // Róg dowódcy - podwaja
    if (row.horn) {
      strength *= 2;
    }

    // Pogoda - na końcu, resetuje do 1
    if (weather[rowType]) {
      strength = 1;
    }

    return strength;
  }, [weather]);

  const calculateRowTotal = useCallback((row, playerId, rowType) => {
    return row.cards.reduce((total, card) => {
      return total + calculateCardStrength(card, row, playerId, rowType);
    }, 0);
  }, [calculateCardStrength]);

  const calculatePlayerTotal = useCallback((player, playerId) => {
    return Object.entries(player.rows).reduce((total, [rowType, row]) => {
      return total + calculateRowTotal(row, playerId, rowType);
    }, 0);
  }, [calculateRowTotal]);

  const toggleHorn = (playerId, rowType) => {
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        rows: {
          ...prev[playerId].rows,
          [rowType]: {
            ...prev[playerId].rows[rowType],
            horn: !prev[playerId].rows[rowType].horn
          }
        }
      }
    }));
  };

  const toggleWeather = (rowType) => {
    setWeather(prev => ({
      ...prev,
      [rowType]: !prev[rowType]
    }));
  };

  const clearWeather = () => {
    setWeather({ melee: false, ranged: false, siege: false });
  };

  const toggleCardForm = (playerId, rowType) => {
    const formKey = `${playerId}-${rowType}`;
    if (activeCardForm === formKey) {
      setActiveCardForm(null);
    } else {
      setActiveCardForm(formKey);
      setNewCard({ strength: '', isHero: false, hasMorale: false, hasBond: false });
    }
  };

  const addCard = (playerId, rowType) => {
    if (!newCard.strength || isNaN(parseInt(newCard.strength))) return;
    
    const card = {
      id: Date.now(),
      strength: parseInt(newCard.strength),
      isHero: newCard.isHero,
      hasMorale: newCard.hasMorale,
      hasBond: newCard.hasBond
    };

    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        rows: {
          ...prev[playerId].rows,
          [rowType]: {
            ...prev[playerId].rows[rowType],
            cards: [...prev[playerId].rows[rowType].cards, card]
          }
        }
      }
    }));

    setNewCard({ strength: '', isHero: false, hasMorale: false, hasBond: false });
  };

  const removeCard = (playerId, rowType, cardId) => {
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        rows: {
          ...prev[playerId].rows,
          [rowType]: {
            ...prev[playerId].rows[rowType],
            cards: prev[playerId].rows[rowType].cards.filter(c => c.id !== cardId)
          }
        }
      }
    }));
  };

  const resetGame = () => {
    setPlayers({
      player1: {
        name: 'Gracz 1',
        rows: {
          melee: { cards: [], horn: false },
          ranged: { cards: [], horn: false },
          siege: { cards: [], horn: false }
        }
      },
      player2: {
        name: 'Gracz 2',
        rows: {
          melee: { cards: [], horn: false },
          ranged: { cards: [], horn: false },
          siege: { cards: [], horn: false }
        }
      }
    });
    setWeather({ melee: false, ranged: false, siege: false });
  };

  const updatePlayerName = (playerId, name) => {
    setPlayers(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], name }
    }));
  };

  const player1Total = calculatePlayerTotal(players.player1, 'player1');
  const player2Total = calculatePlayerTotal(players.player2, 'player2');

  const PlayerRow = ({ playerId, rowType, row }) => {
    const rowTotal = calculateRowTotal(row, playerId, rowType);
    const isWeatherActive = weather[rowType];
    const formKey = `${playerId}-${rowType}`;
    const isFormOpen = activeCardForm === formKey;

    return (
      <div className="row-wrapper">
        <div className="row-container">
          <button
            className={`horn-btn ${row.horn ? 'active' : ''}`}
            onClick={() => toggleHorn(playerId, rowType)}
            title="Róg dowódcy"
          >
            🎺
          </button>
          
          <div className={`row-content ${isWeatherActive ? 'weather-affected' : ''}`}>
            <div className="row-header">
              <span className="row-name">{rowNames[rowType]}</span>
              <span className="row-total">{rowTotal}</span>
            </div>
            
            <div className="cards-container">
              {row.cards.map(card => {
                const calculatedStrength = calculateCardStrength(card, row, playerId, rowType);
                return (
                  <div 
                    key={card.id} 
                    className={`card ${card.isHero ? 'hero' : ''} ${card.hasMorale ? 'morale' : ''} ${card.hasBond ? 'bond' : ''}`}
                    onClick={() => removeCard(playerId, rowType, card.id)}
                    title={`Bazowa: ${card.strength}${card.isHero ? ' (Bohater)' : ''}${card.hasMorale ? ' (Morale)' : ''}${card.hasBond ? ' (Więź)' : ''}\nKliknij aby usunąć`}
                  >
                    <span className="card-strength">{calculatedStrength}</span>
                    {card.isHero && <span className="card-badge hero-badge">★</span>}
                    {card.hasMorale && <span className="card-badge morale-badge">+</span>}
                    {card.hasBond && <span className="card-badge bond-badge">🤝</span>}
                  </div>
                );
              })}
              <button 
                className={`add-card-btn ${isFormOpen ? 'active' : ''}`}
                onClick={() => toggleCardForm(playerId, rowType)}
              >
                {isFormOpen ? '×' : '+'}
              </button>
            </div>
          </div>

          {isFormOpen && (
            <div className="inline-card-form">
              <input
                type="number"
                className="strength-input"
                value={newCard.strength}
                onChange={(e) => setNewCard(prev => ({ ...prev, strength: e.target.value }))}
                placeholder="Siła"
                autoFocus
                min="0"
                onKeyDown={(e) => e.key === 'Enter' && addCard(playerId, rowType)}
              />
              <div className="form-toggles">
                <label className="form-checkbox" title="Bohater - odporny na efekty">
                  <input
                    type="checkbox"
                    checked={newCard.isHero}
                    onChange={(e) => setNewCard(prev => ({ ...prev, isHero: e.target.checked }))}
                  />
                  <span>★</span>
                </label>
                <label className="form-checkbox" title="Wysokie morale - +1 do innych">
                  <input
                    type="checkbox"
                    checked={newCard.hasMorale}
                    onChange={(e) => setNewCard(prev => ({ ...prev, hasMorale: e.target.checked }))}
                  />
                  <span>+</span>
                </label>
                <label className="form-checkbox" title="Więź - mnoży siłę przez liczbę takich samych kart">
                  <input
                    type="checkbox"
                    checked={newCard.hasBond}
                    onChange={(e) => setNewCard(prev => ({ ...prev, hasBond: e.target.checked }))}
                  />
                  <span>🤝</span>
                </label>
              </div>
              <button 
                className="form-add-btn"
                onClick={() => addCard(playerId, rowType)}
              >
                Dodaj
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="gwint-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .gwint-app {
          min-height: 100vh;
          background: 
            radial-gradient(ellipse at top, rgba(45, 52, 54, 0.9) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(30, 30, 30, 0.95) 0%, transparent 50%),
            linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
          background-attachment: fixed;
          font-family: 'Crimson Text', Georgia, serif;
          color: #d4c4a8;
          padding: 1rem;
          position: relative;
        }

        .gwint-app::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 0;
        }

        .header {
          text-align: center;
          padding: 1rem 0 1.5rem;
          position: relative;
          z-index: 1;
        }

        .title {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #c9a227;
          text-shadow: 
            0 0 20px rgba(201, 162, 39, 0.4),
            2px 2px 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 0.3em;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          font-style: italic;
          color: #8b7355;
          font-size: 1rem;
          letter-spacing: 0.1em;
        }

        .reset-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(145deg, #3d2c2c, #2a1f1f);
          border: 1px solid #5c4033;
          color: #d4c4a8;
          padding: 0.5rem 1rem;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.1em;
        }

        .reset-btn:hover {
          background: linear-gradient(145deg, #4a3535, #352828);
          border-color: #8b4513;
          box-shadow: 0 0 15px rgba(139, 69, 19, 0.3);
        }

        .game-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .player-section {
          background: linear-gradient(145deg, rgba(40, 35, 30, 0.95), rgba(25, 22, 18, 0.98));
          border: 2px solid #3d3022;
          padding: 1rem;
          position: relative;
        }

        .player-section.player1 {
          border-radius: 12px 12px 0 0;
          border-bottom: 1px solid #3d3022;
        }

        .player-section.player2 {
          border-radius: 0 0 12px 12px;
          border-top: none;
        }

        .player-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(90deg, transparent 0%, rgba(201, 162, 39, 0.03) 50%, transparent 100%);
          pointer-events: none;
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(201, 162, 39, 0.2);
        }

        .player-name-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          font-family: 'Cinzel', serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: #c9a227;
          padding: 0.25rem;
          width: 200px;
          transition: border-color 0.3s ease;
        }

        .player-name-input:focus {
          outline: none;
          border-bottom-color: #c9a227;
        }

        .player-score {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #c9a227;
          text-shadow: 0 0 20px rgba(201, 162, 39, 0.5);
          min-width: 80px;
          text-align: right;
        }

        .player-score.winning {
          color: #4ade80;
          text-shadow: 0 0 25px rgba(74, 222, 128, 0.6);
        }

        .player-score.losing {
          color: #f87171;
          text-shadow: 0 0 25px rgba(248, 113, 113, 0.4);
        }

        .rows-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .row-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .row-container {
          display: flex;
          align-items: stretch;
          gap: 0.5rem;
        }

        .inline-card-form {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(145deg, rgba(50, 45, 38, 0.95), rgba(35, 30, 25, 0.98));
          border: 1px solid #5c4033;
          border-radius: 6px;
          padding: 0.5rem;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .form-toggles {
          display: flex;
          gap: 0.3rem;
        }

        .strength-input {
          width: 70px;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #3d3022;
          border-radius: 4px;
          color: #d4c4a8;
          font-family: 'Crimson Text', serif;
          font-size: 1.1rem;
          text-align: center;
        }

        .strength-input:focus {
          outline: none;
          border-color: #c9a227;
        }

        .strength-input::placeholder {
          color: #5c4a3a;
        }

        .form-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: linear-gradient(145deg, #2a2520, #1f1b17);
          border: 1px solid #3d3022;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .form-checkbox:hover {
          border-color: #5c4033;
        }

        .form-checkbox input {
          display: none;
        }

        .form-checkbox span {
          font-size: 0.9rem;
          opacity: 0.4;
          transition: opacity 0.2s ease;
        }

        .form-checkbox:has(input:checked) {
          border-color: #c9a227;
          background: linear-gradient(145deg, #3d3328, #2a2520);
        }

        .form-checkbox:has(input:checked) span {
          opacity: 1;
        }

        .form-add-btn {
          padding: 0.4rem 0.6rem;
          background: linear-gradient(145deg, #c9a227, #a08020);
          border: 1px solid #e0c040;
          border-radius: 4px;
          color: #1a1a1a;
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.05em;
        }

        .form-add-btn:hover {
          background: linear-gradient(145deg, #d4ad32, #b08a25);
          box-shadow: 0 0 10px rgba(201, 162, 39, 0.4);
        }

        .add-card-btn.active {
          border-color: #c9a227;
          color: #c9a227;
          background: rgba(201, 162, 39, 0.1);
          transform: rotate(45deg);
        }

        .horn-btn {
          width: 50px;
          min-height: 70px;
          background: linear-gradient(145deg, #2a2520, #1f1b17);
          border: 1px solid #3d3022;
          border-radius: 6px;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: grayscale(100%);
          opacity: 0.6;
        }

        .horn-btn:hover {
          background: linear-gradient(145deg, #352f28, #2a2520);
          border-color: #5c4033;
        }

        .horn-btn.active {
          filter: grayscale(0%);
          opacity: 1;
          background: linear-gradient(145deg, #4a3f35, #3d3328);
          border-color: #c9a227;
          box-shadow: 
            0 0 15px rgba(201, 162, 39, 0.3),
            inset 0 0 10px rgba(201, 162, 39, 0.1);
        }

        .row-content {
          flex: 2;
          min-width: 200px;
          background: linear-gradient(145deg, rgba(35, 30, 25, 0.8), rgba(25, 22, 18, 0.9));
          border: 1px solid #3d3022;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          transition: all 0.3s ease;
        }

        .row-content.weather-affected {
          background: linear-gradient(145deg, rgba(50, 55, 70, 0.8), rgba(35, 40, 50, 0.9));
          border-color: #4a6fa5;
          box-shadow: inset 0 0 20px rgba(100, 150, 200, 0.1);
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .row-name {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          color: #8b7355;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .row-total {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #c9a227;
        }

        .cards-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          min-height: 36px;
          align-items: center;
        }

        .card {
          width: 36px;
          height: 36px;
          background: linear-gradient(145deg, #4a4035, #3d3328);
          border: 1px solid #5c4033;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Cinzel', serif;
          font-weight: 600;
        }

        .card:hover {
          transform: scale(1.1);
          border-color: #8b4513;
          box-shadow: 0 0 10px rgba(139, 69, 19, 0.4);
        }

        .card.hero {
          background: linear-gradient(145deg, #c9a227, #a08020);
          border-color: #e0c040;
          color: #1a1a1a;
        }

        .card.morale {
          box-shadow: inset 0 0 8px rgba(74, 222, 128, 0.3);
        }

        .card.bond {
          box-shadow: inset 0 0 8px rgba(147, 112, 219, 0.3);
        }

        .card-strength {
          font-size: 0.9rem;
        }

        .card-badge {
          position: absolute;
          font-size: 0.5rem;
          line-height: 1;
        }

        .hero-badge {
          top: 1px;
          right: 2px;
          color: #1a1a1a;
        }

        .morale-badge {
          bottom: 1px;
          left: 2px;
          color: #4ade80;
          font-weight: bold;
        }

        .bond-badge {
          bottom: -1px;
          right: 1px;
          color: #9370db;
          font-size: 0.6rem;
        }

        .add-card-btn {
          width: 36px;
          height: 36px;
          background: transparent;
          border: 2px dashed #3d3022;
          border-radius: 4px;
          color: #5c4033;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-card-btn:hover {
          border-color: #c9a227;
          color: #c9a227;
          background: rgba(201, 162, 39, 0.1);
        }

        .weather-bar {
          background: linear-gradient(90deg, rgba(40, 45, 55, 0.95), rgba(50, 55, 65, 0.95), rgba(40, 45, 55, 0.95));
          border-left: 2px solid #3d3022;
          border-right: 2px solid #3d3022;
          padding: 0.75rem;
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
        }

        .weather-bar::before {
          content: 'POGODA';
          position: absolute;
          left: 50%;
          top: -8px;
          transform: translateX(-50%);
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          color: #5c6a7a;
          background: #2d3545;
          padding: 0 0.5rem;
          letter-spacing: 0.2em;
        }

        .weather-btn {
          padding: 0.4rem 0.8rem;
          background: linear-gradient(145deg, #2d3545, #252d3a);
          border: 1px solid #3d4555;
          border-radius: 4px;
          color: #8b9aaa;
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          letter-spacing: 0.05em;
        }

        .weather-btn:hover {
          background: linear-gradient(145deg, #3d4555, #2d3545);
          border-color: #5d6575;
        }

        .weather-btn.active {
          background: linear-gradient(145deg, #4a6fa5, #3d5a8a);
          border-color: #6a9fd5;
          color: #ffffff;
          box-shadow: 0 0 15px rgba(100, 150, 200, 0.4);
        }

        .weather-btn.sun {
          color: #f0c040;
        }

        .weather-btn.sun:hover {
          border-color: #f0c040;
          box-shadow: 0 0 10px rgba(240, 192, 64, 0.3);
        }

        .weather-icon {
          font-size: 1rem;
        }

        @media (max-width: 600px) {
          .title {
            font-size: 1.8rem;
            letter-spacing: 0.15em;
          }
          
          .player-score {
            font-size: 2rem;
          }
          
          .weather-bar {
            flex-wrap: wrap;
          }
          
          .weather-btn {
            font-size: 0.65rem;
            padding: 0.35rem 0.6rem;
          }

          .row-container {
            flex-wrap: wrap;
          }

          .inline-card-form {
            flex-wrap: wrap;
            width: 100%;
          }

          .row-content {
            min-width: 150px;
          }
        }
      `}</style>

      <header className="header">
        <h1 className="title">GWINT</h1>
        <p className="subtitle">Kalkulator punktów</p>
        <button className="reset-btn" onClick={resetGame}>NOWA GRA</button>
      </header>

      <div className="game-container">
        {/* Player 1 */}
        <div className="player-section player1">
          <div className="player-header">
            <input
              type="text"
              className="player-name-input"
              value={players.player1.name}
              onChange={(e) => updatePlayerName('player1', e.target.value)}
            />
            <span className={`player-score ${player1Total > player2Total ? 'winning' : player1Total < player2Total ? 'losing' : ''}`}>
              {player1Total}
            </span>
          </div>
          <div className="rows-container">
            <PlayerRow playerId="player1" rowType="siege" row={players.player1.rows.siege} />
            <PlayerRow playerId="player1" rowType="ranged" row={players.player1.rows.ranged} />
            <PlayerRow playerId="player1" rowType="melee" row={players.player1.rows.melee} />
          </div>
        </div>

        {/* Weather Bar */}
        <div className="weather-bar">
          <button 
            className={`weather-btn ${weather.melee ? 'active' : ''}`}
            onClick={() => toggleWeather('melee')}
          >
            <span className="weather-icon">❄️</span>
            Mróz
          </button>
          <button 
            className={`weather-btn ${weather.ranged ? 'active' : ''}`}
            onClick={() => toggleWeather('ranged')}
          >
            <span className="weather-icon">🌫️</span>
            Mgła
          </button>
          <button 
            className={`weather-btn ${weather.siege ? 'active' : ''}`}
            onClick={() => toggleWeather('siege')}
          >
            <span className="weather-icon">🌧️</span>
            Deszcz
          </button>
          <button 
            className={`weather-btn sun`}
            onClick={clearWeather}
          >
            <span className="weather-icon">☀️</span>
            Słońce
          </button>
        </div>

        {/* Player 2 */}
        <div className="player-section player2">
          <div className="player-header">
            <input
              type="text"
              className="player-name-input"
              value={players.player2.name}
              onChange={(e) => updatePlayerName('player2', e.target.value)}
            />
            <span className={`player-score ${player2Total > player1Total ? 'winning' : player2Total < player1Total ? 'losing' : ''}`}>
              {player2Total}
            </span>
          </div>
          <div className="rows-container">
            <PlayerRow playerId="player2" rowType="melee" row={players.player2.rows.melee} />
            <PlayerRow playerId="player2" rowType="ranged" row={players.player2.rows.ranged} />
            <PlayerRow playerId="player2" rowType="siege" row={players.player2.rows.siege} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default GwintCalculator;