const version = "0.0.4"
import utils from '../_utils'
const apiVersion = "1"

async function getSummonerName() {
  const res = await fetch('/lol-summoner/v1/current-summoner')
  const data = await res.json()
  return data['displayName']
}

async function checkIfSummonerAllowed() {
  try {
    // Get the summoner name
    const summonerName = await getSummonerName();

    // Array of stored summoner names
    const storedSummoners = ["Conkana", "LMAOXD", "Scarlet", "Vyntyst"]; // Replace with your actual array

    // Check if the summoner name is in the array
    const isSummonerInArray = storedSummoners.includes(summonerName);

    return isSummonerInArray;

  } catch (error) {
    console.error(error); // Handle errors if any
    return false; // Return false in case of an error
  }
}


///////////////////// AUTHENTICATION /////////////////////////////

// Check if summoner is in the array
    const summonerIsInArray = await checkIfSummonerAllowed();

    // If summoner is not in the array, abort the function
    if (!summonerIsInArray) {
      const summonerName = await getSummonerName();
      Toast.error("Failed to Authenticate. Please contact En with your summoner name: " + summonerName)
      console.log("Failed to Authenticate. Please contact En with your summoner name.");
    }
    else {

	Toast.success("Authenticated. The crasher is ready!")

	}

///////////////////// AUTHENTICATION /////////////////////////////

async function getClientVersion() {
	const res = await fetch('/lol-patch/v1/game-version');
	const data = await res.json();
	return data;
}

async function getUserInfoJwt() {
	const res = await fetch('/lol-rso-auth/v1/authorization/access-token');
	const data = await res.json();
	return data.token;
}

async function getSummonerToken() {

	const res = await fetch('/lol-league-session/v1/league-session-token');
	const data = await res.json();
	return data;
}

async function getSummoner() {

	const res = await  fetch('/lol-login/v1/session');
	const data = await res.json();
	return data;
}

async function quitCustomLobby() {
	const params = new URLSearchParams({
	  destination: 'gameService',
	  method: 'quitGame',
	  args: JSON.stringify([]),
	})
	const url = '/lol-login/v1/session/invoke?' + params.toString()
	await fetch(url, { method: 'POST' })
}

async function getIdToken() {

	const res = await fetch('/lol-rso-auth/v1/authorization/id-token');
	const data = await res.json();
	return data.token;
}

async function getRegion() {
	
	const res = await fetch('/riotclient/region-locale');
	const data = await res.json();
	

	const res2 = await fetch('/lol-chat/v1/me');
	const data2 = await res2.json();

	const regions = {
		friendlyName: data.webRegion,
		platformId: data2.platformId.toLowerCase()
	}

	return regions;
}

async function getSimpleInventoryJwt() {
	const summoner = await getSummoner();
	const summonerToken = await getSummonerToken();
	const region = await getRegion();

	const accountId =  summoner.accountId;
	const puuid = summoner.puuid;
    
	const res = await fetch(`https://${region.friendlyName}-red.lol.sgp.pvp.net/lolinventoryservice-ledge/v${apiVersion}/inventories/simple?puuid=${puuid}&location=lolriot.ams1.${region.platformId}&inventoryTypes=CHAMPION&inventoryTypes=CHAMPION_SKIN&inventoryTypes=COMPANION&inventoryTypes=TFT_MAP_SKIN&inventoryTypes=EVENT_PASS&inventoryTypes=BOOST&accountId=${accountId}`, {
		headers: {
			'Authorization': `Bearer ${summonerToken}`,
			'Accept': 'application/json',

		}
	});
	const data = await res.json();
	return data.data.itemsJwt;
}

async function generateCustomLobby() {

	const object = {"__class": "com.riotgames.platform.game.lcds.dto.CreatePracticeGameRequestDto"};
	const practiceGameConfig = {"__class": "com.riotgames.platform.game.PracticeGameConfig"};
	practiceGameConfig.allowSpectators = "NONE";
	const gameMap = {
		"__class": "com.riotgames.platform.game.map.GameMap",
		description: "",
		displayName: "",
		mapId: 11,
		minCustomPlayers: 1,
		name: "",
		totalPlayers: 10
	}
	practiceGameConfig.gameMap = gameMap;
	practiceGameConfig.gameMode = "CLASSIC";
	practiceGameConfig.gameMutators = []; 
	practiceGameConfig.gameName = "test";
	practiceGameConfig.gamePassword = "";
	practiceGameConfig.gameTypeConfig = 1;
	practiceGameConfig.gameVersion = await getClientVersion(),
	practiceGameConfig.maxNumPlayers = 10;
	practiceGameConfig.passbackDataPacket= null;
	practiceGameConfig.passbackUrl = null;
	practiceGameConfig.region = "";
	object.practiceGameConfig = practiceGameConfig;
	object.simpleInventoryJwt = await getSimpleInventoryJwt();
	const tokens = {
		"__class": "com.riotgames.platform.util.tokens.PlayerGcoTokens",
		"idToken": await getIdToken(),
		"userInfoJwt":  await getUserInfoJwt(),
		"summonerToken":  await getSummonerToken()
	};
	object.playerGcoTokens = tokens;

	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'createPracticeGameV4',
		args: JSON.stringify([object]),
	  });

	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  const res = await fetch(url, { method: 'POST' })
	  const data = await res.json();

	  if(res.ok) {
			const gameDTO = {"__class": "com.riotgames.platform.game.GameDTO"};
			return {...gameDTO, ...data.body};	
	  }

	  Toast.error('Failed to create the custom lobby!');
		return false;
	
}

window.crashLobby = crashLobby
window.lobbyReveal = lobbyReveal

async function startChampionSelection(id, gameTypeConfigId){
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'startChampionSelection',
		args: JSON.stringify([id, gameTypeConfigId]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}

async function setClientReceivedGameMessage(id) {
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'setClientReceivedGameMessage',
		args: JSON.stringify([id, "CHAMP_SELECT_CLIENT"]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}

async function selectSpells(spell1, spell2) {
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'selectSpells',
		args: JSON.stringify([spell1, spell2]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}

async function selectChampionV2(championId, skinId) {
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'selectChampionV2',
		args: JSON.stringify([championId, skinId]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}


async function championSelectCompleted() {
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'championSelectCompleted',
		args: JSON.stringify([]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}

async function setClientReceivedMaestroMessage(gameId) {
	const params = new URLSearchParams({
		destination: 'gameService',
		method: 'setClientReceivedMaestroMessage',
		args: JSON.stringify([gameId, "GameClientConnectedToServer"]),
	  })
	  const url = '/lol-login/v1/session/invoke?' + params.toString()
	  await fetch(url, { method: 'POST' })
}

async function getCheckTimerSelectedChamp(){

	const res = await fetch('/lol-champ-select/v1/session')
	const data = await res.json() 
	const timer =  data.timer;
	
	if(data.isCustomGame) {
		Toast.error('You can not crash in a custom game.');
		return false;
	}

	const res2 = await fetch('/lol-champ-select/v1/session/my-selection')
	const data2 = await res2.json()
	if(data2.championId == 0) {
		Toast.error('You must lock in your champion before you can crash the lobby.');
		return false;
	}

	if(timer.phase == "FINALIZATION")
	{
		const current = Date.now();
		const remaining = (timer.internalNowInEpochMs + timer.adjustedTimeLeftInPhase) - current;

		if(remaining < 13000) {
			Toast.error('It is too late. Minimum 15 seconds.');
			return false;
		}
	}

	return true;
}

async function getSummonersInLobby() {
	const res = await  fetch('//riotclient/chat/v5/participants/champ-select');
	const data = await res.json();
	const summoners = [];

	for(const summoner of data.participants) {
		console.log(summoner.name)
		summoners.push(summoner.name);
	}

	return summoners;
}

async function lobbyReveal(type) {
	const summonersInLobby = await getSummonersInLobby();
	const region = await getRegion();
	let url = "";

	if(type == "opgg") 
		url = `https://www.op.gg/multisearch/${region.friendlyName}?summoners=${summonersInLobby.join("%2C")}`;
	
	if(type == "ugg")
		url = `https://u.gg/multisearch?summoners=${summonersInLobby.join(",")}&region=${region.platformId}`;

	window.open(url);

}

async function crashLobby() {

	await quitCustomLobby();
	const checkTimerSelectedChamp = await getCheckTimerSelectedChamp();

	if(checkTimerSelectedChamp) {
		const customLobby = await generateCustomLobby();
		if(customLobby) {
			await startChampionSelection(customLobby.id, customLobby.gameTypeConfigId);
			await setClientReceivedGameMessage(customLobby.id);
			await selectSpells(32, 4);
			await selectChampionV2(1, 1000);
			await championSelectCompleted();
			await new Promise(resolve => setTimeout(resolve, 15000));
			await quitCustomLobby();
			await setClientReceivedMaestroMessage(customLobby.id);
		}
	}
}

function generateLobbyRevealButtons(siblingDiv) {

	const div = document.createElement("div");
	const parentDiv = document.createElement("div")
	const placeHolderDiv = document.createElement("div")

	parentDiv.setAttribute("class", "dodge-button-container")
	parentDiv.setAttribute("style", "position: absolute; right: 10px; bottom: 57px; display: flex; align-items: flex-end;")
	div.setAttribute("class", "quit-button ember-view");
	div.setAttribute("style", "width: 115px;")
	div.setAttribute("onclick", "window.lobbyReveal('opgg')")
	div.setAttribute("id", "dodgeButton");

	placeHolderDiv.setAttribute("class", "quit-button ember-view");
	placeHolderDiv.setAttribute("style", "width: 115px;")
	
	placeHolderDiv.setAttribute("id", "exitButton");

	const buttonPlaceHolder = document.createElement("lol-uikit-flat-button");
	const button = document.createElement("lol-uikit-flat-button");
	button.innerHTML = "OP.GG";
	buttonPlaceHolder.innerHTML = "U.GG";
	
	div.appendChild(button);
	placeHolderDiv.appendChild(buttonPlaceHolder)

	parentDiv.appendChild(div);
	parentDiv.appendChild(placeHolderDiv);
	siblingDiv.parentNode.insertBefore(parentDiv, siblingDiv)

	
}

async function generateCrashLobbyButton(siblingDiv) {

	// Check if summoner is in the array
    const summonerIsInArray = await checkIfSummonerAllowed();

    // If summoner is not in the array, abort the function
    if (!summonerIsInArray) {
      console.log("Failed to Authenticate. Please contact En.");
      return;
    }

	console.log("summoner:")
	const summonerName = await getSummonerName();
	console.log(summonerName)

	const div = document.createElement("div");
	const parentDiv = document.createElement("div")

	parentDiv.setAttribute("class", "dodge-button-container")
	parentDiv.setAttribute("style", "position: absolute; right: 10px; bottom: 96px; display: flex; align-items: flex-end;")
	div.setAttribute("class", "quit-button ember-view")
	div.setAttribute("style", "width: 115px;")
	div.setAttribute("onclick", "window.crashLobby()")
	div.setAttribute("id", "dodgeButton");


	const button = document.createElement("lol-uikit-flat-button");
	button.innerHTML = "Crash Lobby";
	
	
	div.appendChild(button);

	parentDiv.appendChild(div);

	siblingDiv.parentNode.insertBefore(parentDiv, siblingDiv)

	
}

let addCrashLobbyButtonObserver = (mutations) => {
	if (utils.phase == "ChampSelect" && document.querySelector(".bottom-right-buttons") && !document.querySelector(".dodge-button-container")) {
		generateLobbyRevealButtons(document.querySelector(".bottom-right-buttons"))
		generateCrashLobbyButton(document.querySelector(".bottom-right-buttons"))
	}
}

window.addEventListener('load', async () => {

	utils.routineAddCallback(addCrashLobbyButtonObserver, ["bottom-right-buttons"])
	utils.addCss("//plugins/crash_lobby/assets/crash_button.css")
})