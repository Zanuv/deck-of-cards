import React, { useEffect, useState, useRef } from "react";
import Card from "./Card";
import axios from "axios";
import "./Deck.css";

const API_BASE_URL = "http://deckofcardsapi.com/api/deck";

function Deck() {
	const [deck, setDeck] = useState(null);
	const [drawn, setDrawn] = useState([]);
	const [autoDraw, setAutoDraw] = useState(false);
	const [error, setError] = useState(null);
	const timerRef = useRef(null);
	const cancelTokenSource = useRef(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axios.get(
					`${API_BASE_URL}/new/shuffle/`
				);
				setDeck(response.data);
			} catch (error) {
				setError("Error creating deck!");
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		cancelTokenSource.current = axios.CancelToken.source();

		const drawCard = async () => {
			const { deck_id } = deck;

			try {
				const drawRes = await axios.get(
					`${API_BASE_URL}/${deck_id}/draw/`,
					{
						cancelToken: cancelTokenSource.current.token,
					}
				);

				if (drawRes.data.remaining === 0) {
					setAutoDraw(false);
					setError("Error: no cards remaining!");
				} else {
					const card = drawRes.data.cards[0];
					setDrawn((prevDrawn) => [
						...prevDrawn,
						{
							id: card.code,
							name: card.suit + " " + card.value,
							image: card.image,
						},
					]);
				}
			} catch (error) {
				if (!axios.isCancel(error)) {
					setError("Error drawing a card!");
				}
			}
		};

		if (autoDraw && !timerRef.current) {
			timerRef.current = setInterval(drawCard, 1000);
		}

		return () => {
			clearInterval(timerRef.current);
			timerRef.current = null;
			cancelTokenSource.current.cancel(); // Cancel the request on unmount
		};
	}, [autoDraw, deck]);

	const toggleAutoDraw = () => {
		setAutoDraw((auto) => !auto);
	};

	const shuffleDeck = async () => {
		try {
			const shuffleRes = await axios.get(
				`${API_BASE_URL}/${deck.deck_id}/shuffle/`,
				{
					cancelToken: cancelTokenSource.current.token,
				}
			);
			setDrawn([]); // Reset the drawn cards
			setError(null);
			setDeck(shuffleRes.data);
		} catch (error) {
			setError("Error shuffling the deck!");
		}
	};

	const cards = drawn.map((card) => (
		<Card key={card.id} name={card.name} image={card.image} />
	));

	return (
		<div className="Deck">
			{error && <div className="error">{error}</div>}
			{deck && (
				<>
					<button className="Deck-shuffle" onClick={shuffleDeck}>
						SHUFFLE DECK
					</button>
					<button className="Deck-gimme" onClick={toggleAutoDraw}>
						{autoDraw ? "STOP" : "KEEP"} DRAWING FOR ME!
					</button>
				</>
			)}
			<div className="Deck-cardarea">{cards}</div>
		</div>
	);
}

export default Deck;
