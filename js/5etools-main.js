const betteR205etools = function () {
	const IMG_URL = BASE_SITE_URL + "img/";

	const SPELL_DATA_DIR = `${DATA_URL}spells/`;
	const SPELL_META_URL = `${SPELL_DATA_DIR}roll20.json`;
	const MONSTER_DATA_DIR = `${DATA_URL}bestiary/`;
	const ADVENTURE_DATA_DIR = `${DATA_URL}adventure/`;
	const CLASS_DATA_DIR = `${DATA_URL}class/`;

	const ITEM_DATA_URL = `${DATA_URL}items.json`;
	const FEAT_DATA_URL = `${DATA_URL}feats.json`;
	const PSIONIC_DATA_URL = `${DATA_URL}psionics.json`;
	const OBJECT_DATA_URL = `${DATA_URL}objects.json`;
	const BACKGROUND_DATA_URL = `${DATA_URL}backgrounds.json`;
	const OPT_FEATURE_DATA_URL = `${DATA_URL}optionalfeatures.json`;
	const RACE_DATA_URL = `${DATA_URL}races.json`;

	const HOMEBREW_REPO_URL = `https://api.github.com/repos/TheGiddyLimit/homebrew/`;
	// the GitHub API has a 60 requests/hour limit per IP which we quickly hit if the user refreshes their Roll20 a couple of times
	// embed shitty OAth2 details here to enable 5k/hour requests per IP (sending them with requests to the API relaxes the limit)
	// naturally these are client-visible and should not be used to secure anything
	const HOMEBREW_CLIENT_ID = `67e57877469da38a85a7`;
	const HOMEBREW_CLIENT_SECRET = `c00dede21ca63a855abcd9a113415e840aca3f92`;

	const REQUIRED_PROPS = {
		"monster": [
			"ac",
			"alignment",
			"cha",
			"con",
			"cr",
			"dex",
			"hp",
			"int",
			"name",
			"passive",
			"size",
			"source",
			"speed",
			"str",
			"type",
			"wis"
		],
		"spell": [
			"name",
			"level",
			"school",
			"time",
			"range",
			"components",
			"duration",
			"classes",
			"entries",
			"source"
		],
		"item": [
			"name",
			"rarity",
			"source"
		],
		"psionic": [
			"name",
			"source",
			"type"
		],
		"feat": [
			"name",
			"source",
			"entries"
		],
		"object": [
			"name",
			"source",
			"size",
			"type",
			"ac",
			"hp",
			"immune",
			"entries"
		],
		"class": [
			"name",
			"source",
			"hd",
			"proficiency",
			"classTableGroups",
			"startingProficiencies",
			"startingEquipment",
			"classFeatures",
			"subclassTitle",
			"subclasses"
		],
		"subclass": [

		],
		"background": [
			"name",
			"source",
			"skillProficiencies",
			"entries"
		],
		"race": [
			"name",
			"source"
		],
		"optionalfeature": [
			"name",
			"source",
			"entries"
		]
	};

	let spellDataUrls = {};
	let spellMetaData = {};
	let monsterDataUrls = {};
	let monsterFluffDataUrls = {};
	let monsterFluffData = {};
	let adventureMetadata = {};
	let classDataUrls = {};

// build a big dictionary of sheet properties to be used as reference throughout // TODO use these as reference throughout
	function SheetAttribute (name, ogl, shaped) {
		this.name = name;
		this.ogl = ogl;
		this.shaped = shaped;
	}

	NPC_SHEET_ATTRIBUTES = {};
// these (other than the name, which is for display only) are all lowercased; any comparison should be lowercased
	NPC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Empty--", "", "");
// TODO: implement custom entry (enable textarea)
//NPC_SHEET_ATTRIBUTES["custom"] = new SheetAttribute("-Custom-", "-Custom-", "-Custom-");
	NPC_SHEET_ATTRIBUTES["npc_hpbase"] = new SheetAttribute("Avg HP", "npc_hpbase", "npc_hpbase");
	NPC_SHEET_ATTRIBUTES["npc_ac"] = new SheetAttribute("AC", "npc_ac", "ac");
	NPC_SHEET_ATTRIBUTES["passive"] = new SheetAttribute("Passive Perception", "passive", "passive");
	NPC_SHEET_ATTRIBUTES["npc_hpformula"] = new SheetAttribute("HP Formula", "npc_hpformula", "npc_hpformula");
	NPC_SHEET_ATTRIBUTES["npc_speed"] = new SheetAttribute("Speed", "npc_speed", "npc_speed");
	NPC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_DC");
	NPC_SHEET_ATTRIBUTES["npc_legendary_actions"] = new SheetAttribute("Legendary Actions", "npc_legendary_actions", "npc_legendary_actions");
	NPC_SHEET_ATTRIBUTES["npc_challenge"] = new SheetAttribute("CR", "npc_challenge", "challenge");

	PC_SHEET_ATTRIBUTES = {};
	PC_SHEET_ATTRIBUTES["empty"] = new SheetAttribute("--Default--", "", "");
	PC_SHEET_ATTRIBUTES["hp"] = new SheetAttribute("Current HP", "hp", "HP");
	PC_SHEET_ATTRIBUTES["ac"] = new SheetAttribute("AC", "ac", "ac"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["passive_wisdom"] = new SheetAttribute("Passive Perception", "passive_wisdom", "passive_wisdom"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["speed"] = new SheetAttribute("Speed", "speed", "speed"); // TODO check shaped
	PC_SHEET_ATTRIBUTES["spell_save_dc"] = new SheetAttribute("Spell Save DC", "spell_save_dc", "spell_save_dc"); // TODO check shaped

	addConfigOptions("token", {
		"_name": "Tokens",
		"_player": true,
		"bar1": {
			"name": "Bar 1 (NPC)",
			"default": "npc_hpbase",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar1_pc": {
			"name": "Bar 1 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar1_max": {
			"name": "Set Bar 1 Max",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"bar1_reveal": {
			"name": "Reveal Bar 1",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar2": {
			"name": "Bar 2 (NPC)",
			"default": "npc_ac",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar2_pc": {
			"name": "Bar 2 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar2_max": {
			"name": "Set Bar 2 Max",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar2_reveal": {
			"name": "Reveal Bar 2",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar3": {
			"name": "Bar 3 (NPC)",
			"default": "passive",
			"_type": "_SHEET_ATTRIBUTE",
			"_player": true
		},
		"bar3_pc": {
			"name": "Bar 3 (PC)",
			"default": "",
			"_type": "_SHEET_ATTRIBUTE_PC"
		},
		"bar3_max": {
			"name": "Set Bar 3 Max",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"bar3_reveal": {
			"name": "Reveal Bar 3",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"rollHP": {
			"name": "Roll Token HP",
			"default": false,
			"_type": "boolean"
		},
		"maximiseHp": {
			"name": "Maximise Token HP",
			"default": false,
			"_type": "boolean"
		},
		"name": {
			"name": "Show Nameplate",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"name_reveal": {
			"name": "Reveal Nameplate",
			"default": false,
			"_type": "boolean",
			"_player": true
		},
		"tokenactions": {
			"name": "Add TokenAction Macros on Import (Actions)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsTraits": {
			"name": "Add TokenAction Macros on Import (Traits)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsSkillsSaves": {
			"name": "Add TokenAction Macros on Import (Skills, Checks, and Saves)",
			"default": true,
			"_type": "boolean"
		},
		"tokenactionsSpells": {
			"name": "Add TokenAction Macros on Import (Spells)",
			"default": true,
			"_type": "boolean"
		},
		"namesuffix": {
			"name": "Append Text to Names on Import",
			"default": "",
			"_type": "String"
		}
	});
	addConfigOptions("import", {
		"_name": "Import",
		"importIntervalHandout": {
			"name": "Rest Time between Each Handout (msec)",
			"default": 100,
			"_type": "integer"
		},
		"importIntervalCharacter": {
			"name": "Rest Time between Each Character (msec)",
			"default": 2500,
			"_type": "integer"
		},
		"importFluffAs": {
			"name": "Import Creature Fluff As...",
			"default": "Bio",
			"_type": "_enum",
			"__values": ["Bio", "GM Notes"]
		},
		"whispermode": {
			"name": "Sheet Whisper Mode on Import",
			"default": "Toggle (Default GM)",
			"_type": "_WHISPERMODE"
		},
		"advantagemode": {
			"name": "Sheet Advantage Mode on Import",
			"default": "Toggle (Default Advantage)",
			"_type": "_ADVANTAGEMODE"
		},
		"damagemode": {
			"name": "Sheet Auto Roll Damage Mode on Import",
			"default": "Auto Roll",
			"_type": "_DAMAGEMODE"
		},
		"skipSenses": {
			"name": "Skip Importing Creature Senses",
			"default": false,
			"_type": "boolean"
		},
		"showNpcNames": {
			"name": "Show NPC Names in Rolls",
			"default": true,
			"_type": "boolean"
		},
	});
	addConfigOptions("interface", {
		"_name": "Interface",
		"_player": true,
		"customTracker": {
			"name": "Add Additional Info to Tracker",
			"default": true,
			"_type": "boolean"
		},
		"trackerCol1": {
			"name": "Tracker Column 1",
			"default": "HP",
			"_type": "_FORMULA"
		},
		"trackerCol2": {
			"name": "Tracker Column 2",
			"default": "AC",
			"_type": "_FORMULA"
		},
		"trackerCol3": {
			"name": "Tracker Column 3",
			"default": "PP",
			"_type": "_FORMULA"
		},
		"trackerSheetButton": {
			"name": "Add Sheet Button To Tracker",
			"default": false,
			"_type": "boolean"
		},
		"minifyTracker": {
			"name": "Shrink Initiative Tracker Text",
			"default": false,
			"_type": "boolean"
		},
		"showDifficulty": {
			"name": "Show Difficulty in Tracker",
			"default": true,
			"_type": "boolean"
		},
		"emoji": {
			"name": "Add Emoji Replacement to Chat",
			"default": true,
			"_type": "boolean",
			"_player": true
		},
		"showCustomArtPreview": {
			"name": "Show Custom Art Previews",
			"default": true,
			"_type": "boolean"
		}
	});

	d20plus.sheet = "ogl";
	d20plus.spells = {};
	d20plus.psionics = {};
	d20plus.items = {};
	d20plus.feats = {};
	d20plus.races = {};
	d20plus.objects = {};
	d20plus.classes = {};
	d20plus.subclasses = {};
	d20plus.backgrounds = {};
	d20plus.adventures = {};
	d20plus.optionalfeatures = {};

	d20plus.advantageModes = ["Toggle (Default Advantage)", "Toggle", "Toggle (Default Disadvantage)", "Always", "Query", "Never"];
	d20plus.whisperModes = ["Toggle (Default GM)", "Toggle (Default Public)", "Always", "Query", "Never"];
	d20plus.damageModes = ["Auto Roll", "Don't Auto Roll"];

	d20plus.formulas = {
		_options: ["--Empty--", "AC", "HP", "Passive Perception", "Spell DC"],
		"ogl": {
			"cr": "@{npc_challenge}",
			"ac": "@{ac}",
			"npcac": "@{npc_ac}",
			"hp": "@{hp}",
			"pp": "@{passive_wisdom}",
			"macro": "",
			"spellDc": "@{spell_save_dc}"
		},
		"community": {
			"cr": "@{npc_challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "10 + @{perception}",
			"macro": "",
			"spellDc": "@{spell_save_dc}"
		},
		"shaped": {
			"cr": "@{challenge}",
			"ac": "@{AC}",
			"npcac": "@{AC}",
			"hp": "@{HP}",
			"pp": "@{repeating_skill_$11_passive}",
			"macro": "shaped_statblock",
			"spellDc": "@{spell_save_dc}"
		}
	};

	d20plus.js.scripts.push({name: "5etoolsrender", url: `${SITE_JS_URL}entryrender.js`});
	d20plus.js.scripts.push({name: "5etoolsscalecreature", url: `${SITE_JS_URL}scalecreature.js`});

	d20plus.json = [
		{name: "class index", url: `${CLASS_DATA_DIR}index.json`},
		{name: "spell index", url: `${SPELL_DATA_DIR}index.json`},
		{name: "spell metadata", url: SPELL_META_URL},
		{name: "bestiary index", url: `${MONSTER_DATA_DIR}index.json`},
		{name: "bestiary fluff index", url: `${MONSTER_DATA_DIR}fluff-index.json`},
		{name: "adventures index", url: `${DATA_URL}adventures.json`},
		{name: "basic items", url: `${DATA_URL}basicitems.json`}
	];

	// add JSON index/metadata
	d20plus.addJson = function (onLoadFunction) {
		d20plus.ut.log("Load JSON");
		const onEachLoadFunction = function (name, url, data) {
			if (name === "class index") classDataUrls = data;
			else if (name === "spell index") spellDataUrls = data;
			else if (name === "spell metadata") spellMetaData = data;
			else if (name === "bestiary index") monsterDataUrls = data;
			else if (name === "bestiary fluff index") monsterFluffDataUrls = data;
			else if (name === "adventures index") adventureMetadata = data;
			else if (name === "basic items") {
				data.itemProperty.forEach(p => EntryRenderer.item._addProperty(p));
				data.itemType.forEach(t => EntryRenderer.item._addType(t));
			}
			else throw new Error(`Unhandled data from JSON ${name} (${url})`);

			d20plus.ut.log(`JSON [${name}] Loaded`);
		};
		d20plus.js.chainLoad(d20plus.json, 0, onEachLoadFunction, onLoadFunction);
	};

	d20plus.handleConfigChange = function (isSyncingPlayer) {
		if (!isSyncingPlayer) d20plus.ut.log("Applying config");
		if (window.is_gm) {
			d20plus.setInitiativeShrink(d20plus.cfg.getCfgVal("interface", "minifyTracker"));
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.updateDifficulty();
			if (d20plus.art.refreshList) d20plus.art.refreshList();
		}
	};

// get the user config'd token HP bar
	d20plus.getCfgHpBarNumber = function () {
		const bars = [
			d20plus.cfg.getCfgVal("token", "bar1"),
			d20plus.cfg.getCfgVal("token", "bar2"),
			d20plus.cfg.getCfgVal("token", "bar3")
		];
		return bars[0] === "npc_hpbase" ? 1 : bars[1] === "npc_hpbase" ? 2 : bars[2] === "npc_hpbase" ? 3 : null;
	};

	// Page fully loaded and visible
	d20plus.Init = function () {
		d20plus.ut.log("Init (v" + d20plus.version + ")");
		d20plus.ut.checkVersion();
		d20plus.settingsHtmlHeader = `<hr><h3>betteR20-5etools v${d20plus.version}</h3>`;

		d20plus.ut.log("Modifying character & handout editor templates");
		$("#tmpl_charactereditor").html($(d20plus.template_charactereditor).html());
		$("#tmpl_handouteditor").html($(d20plus.template_handouteditor).html());

		d20plus.ut.addAllCss();
		if (window.is_gm) {
			d20plus.ut.log("Is GM");
			d20plus.engine.enhancePageSelector();
		}
		else d20plus.ut.log("Not GM. Some functionality will be unavailable.");
		d20plus.setSheet();
        d20plus.js.addScripts(d20plus.onScriptLoad);

		d20plus.ut.showLoadingMessage(`betteR20-5etools v${d20plus.version}`);
	};

	// continue init once JSON loads
	d20plus.onScriptLoad = function () {
		d20plus.qpi.initMockApi();
		d20plus.js.addApiScripts(d20plus.onApiScriptLoad);
	};

	// continue init once scripts load
	d20plus.onApiScriptLoad = function () {
		d20plus.addJson(d20plus.onJsonLoad);
	};

	// continue init once API scripts load
	d20plus.onJsonLoad = function () {
		IS_ROLL20 = true; // global variable from 5etools' utils.js
		BrewUtil._buildSourceCache = function () {
			// no-op when building source cache; we'll handle this elsewhere
			BrewUtil._sourceCache = BrewUtil._sourceCache || {};
		};
		// dummy values
		BrewUtil.homebrew = {};
		BrewUtil.homebrewMeta = {};

		EntryRenderer.getDefaultRenderer().setBaseUrl(BASE_SITE_URL);
		if (window.is_gm) d20plus.cfg.loadConfig(d20plus.onConfigLoad);
		else d20plus.cfg.loadPlayerConfig(d20plus.onConfigLoad);
	};

	// continue more init after config loaded
	d20plus.onConfigLoad = function () {
		if (window.is_gm) d20plus.art.loadArt(d20plus.onArtLoad);
		else d20plus.onArtLoad();
	};

	// continue more init after art loaded
	d20plus.onArtLoad = function () {
		d20plus.bindDropLocations();
		d20plus.ui.addHtmlHeader();
		d20plus.addCustomHTML();
		d20plus.ui.addHtmlFooter();
		d20plus.engine.enhanceMarkdown();
		d20plus.engine.addProFeatures();
		d20plus.art.initArtFromUrlButtons();
		if (window.is_gm) {
			d20plus.journal.addJournalCommands();
			d20plus.engine.addSelectedTokenCommands();
			d20plus.art.addCustomArtSearch();
			d20plus.cfg.baseHandleConfigChange();
			d20plus.handleConfigChange();
			d20plus.engine.addTokenHover();
			d20plus.engine.enhanceTransmogrifier();
			d20plus.engine.removeLinkConfirmation();
		} else {
			d20plus.cfg.startPlayerConfigHandler();
		}
		d20.Campaign.pages.each(d20plus.bindGraphics);
		d20.Campaign.activePage().collection.on("add", d20plus.bindGraphics);
		d20plus.engine.addSelectedTokenCommands();
		d20plus.engine.enhanceStatusEffects();
		d20plus.engine.enhanceMeasureTool();
		d20plus.engine.enhanceMouseDown();
		d20plus.engine.enhanceMouseMove();
		d20plus.engine.addLineCutterTool();
		d20plus.chat.enhanceChat();
		d20plus.engine.enhancePathWidths();
		d20plus.ut.disable3dDice();
		d20plus.engine.addWeather();
		d20plus.ut.log("All systems operational");
		d20plus.ut.chatTag(`betteR20-5etools v${d20plus.version}`);
	};

	// Bind Graphics Add on page
	d20plus.bindGraphics = function (page) {
		d20plus.ut.log("Bind Graphics");
		try {
			if (page.get("archived") === false) {
				page.thegraphics.on("add", function (e) {
					var character = e.character;
					if (character) {
						var npc = character.attribs.find(function (a) {
							return a.get("name").toLowerCase() == "npc";
						});
						var isNPC = npc ? parseInt(npc.get("current")) : 0;
						// Set bars if configured to do so
						var barsList = ["bar1", "bar2", "bar3"];
						$.each(barsList, (i, barName) => {
							// PC config keys are suffixed "_pc"
							const confVal = d20plus.cfg.getCfgVal("token", `${barName}${isNPC ? "" : "_pc"}`);
							if (confVal) {
								const charAttr = character.attribs.find(a => a.get("name").toLowerCase() == confVal);
								if (charAttr) {
									e.attributes[barName + "_value"] = charAttr.get("current");
									if (d20plus.cfg.hasCfgVal("token", barName + "_max")) {
										if (d20plus.cfg.getCfgVal("token", barName + "_max") && !isNPC && confVal === "hp") { // player HP is current; need to set max to max
											e.attributes[barName + "_max"] = charAttr.get("max");
										} else {
											if (isNPC) {
												// TODO: Setting a value to empty/null does not overwrite existing values on the token.
												// setting a specific value does. Must figure this out.
												e.attributes[barName + "_max"] = d20plus.cfg.getCfgVal("token", barName + "_max") ? charAttr.get("current") : "";
											} else {
												// preserve default token for player tokens
												if (d20plus.cfg.getCfgVal("token", barName + "_max")) {
													e.attributes[barName + "_max"] = charAttr.get("current");
												}
											}
										}
									}
									if (d20plus.cfg.hasCfgVal("token", barName + "_reveal")) {
										e.attributes["showplayers_" + barName] = d20plus.cfg.getCfgVal("token", barName + "_reveal");
									}
								}
							}
						});

						// NPC-only settings
						if (isNPC) {
							// Set Nametag
							if (d20plus.cfg.hasCfgVal("token", "name")) {
								e.attributes["showname"] = d20plus.cfg.getCfgVal("token", "name");
								if (d20plus.cfg.hasCfgVal("token", "name_reveal")) {
									e.attributes["showplayers_name"] = d20plus.cfg.getCfgVal("token", "name_reveal");
								}
							}

							// Roll HP
							// TODO: npc_hpbase appears to be hardcoded here? Refactor for NPC_SHEET_ATTRIBUTES?
							if ((d20plus.cfg.getCfgVal("token", "rollHP") || d20plus.cfg.getCfgVal("token", "maximiseHp")) && d20plus.cfg.getCfgKey("token", "npc_hpbase")) {
								var hpf = character.attribs.find(function (a) {
									return a.get("name").toLowerCase() == NPC_SHEET_ATTRIBUTES["npc_hpformula"][d20plus.sheet];
								});
								var barName = d20plus.cfg.getCfgKey("token", "npc_hpbase");

								if (hpf && hpf.get("current")) {
									var hpformula = hpf.get("current");
									if (d20plus.cfg.getCfgVal("token", "maximiseHp")) {
										const maxSum = hpformula.replace("d", "*");
										try {
											const max = eval(maxSum);
											if (!isNaN(max)) {
												e.attributes[barName + "_value"] = max;
												e.attributes[barName + "_max"] = max;
											}
										} catch (error) {
											d20plus.ut.log("Error Maximising HP");
											console.log(error);
										}
									} else {
										d20plus.ut.randomRoll(hpformula, function (result) {
											e.attributes[barName + "_value"] = result.total;
											e.attributes[barName + "_max"] = result.total;
											d20plus.ut.log("Rolled HP for [" + character.get("name") + "]");
										}, function (error) {
											d20plus.ut.log("Error Rolling HP Dice");
											console.log(error);
										});
									}
								}
							}
						}
					}
				});
			}
		} catch (e) {
			console.log("D20Plus bindGraphics Exception", e);
			console.log("PAGE", page);
		}
	};

// bind token HP to initiative tracker window HP field
	d20plus.bindToken = function (token) {
		function getInitTrackerToken () {
			const $window = $("#initiativewindow");
			if (!$window.length) return [];
			return $window.find(`li.token`).filter((i, e) => {
				return $(e).data("tokenid") === token.id;
			});
		}

		const $initToken = getInitTrackerToken();
		if (!$initToken.length) return;
		const $iptHp = $initToken.find(`.hp.editable`);
		const npcFlag = token.character ? token.character.attribs.find((a) => {
			return a.get("name").toLowerCase() === "npc";
		}) : null;
		// if there's a HP column enabled
		if ($iptHp.length) {
			let toBind;
			if (!token.character || npcFlag && npcFlag.get("current") == "1") {
				const hpBar = d20plus.getCfgHpBarNumber();
				// and a HP bar chosen
				if (hpBar) {
					$iptHp.text(token.attributes[`bar${hpBar}_value`])
				}

				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					const hpBar = d20plus.getCfgHpBarNumber();

					if ($iptHp && hpBar) {
						if (changes.changes[`bar${hpBar}_value`]) {
							$iptHp.text(token.changed[`bar${hpBar}_value`]);
						}
					}
				};
			} else {
				toBind = (token, changes) => {
					const $initToken = getInitTrackerToken();
					if (!$initToken.length) return;
					const $iptHp = $initToken.find(`.hp.editable`);
					if ($iptHp) {
						$iptHp.text(token.character.autoCalcFormula(d20plus.formulas[d20plus.sheet].hp));
					}
				}
			}
			// clean up old handler
			if (d20plus.tokenBindings[token.id]) token.off("change", d20plus.tokenBindings[token.id]);
			// add new handler
			d20plus.tokenBindings[token.id] = toBind;
			token.on("change", toBind);
		}
	};
	d20plus.tokenBindings = {};

// Determine difficulty of current encounter (iniativewindow)
	d20plus.getDifficulty = function () {
		var difficulty = "Unknown";
		var partyXPThreshold = [0, 0, 0, 0];
		var players = [];
		var npcs = [];
		try {
			$.each(d20.Campaign.initiativewindow.cleanList(), function (i, v) {
				var page = d20.Campaign.pages.get(v._pageid);
				if (page) {
					var token = page.thegraphics.get(v.id);
					if (token) {
						var char = token.character;
						if (char) {
							var npc = char.attribs.find(function (a) {
								return a.get("name").toLowerCase() === "npc";
							});
							if (npc && (npc.get("current") === 1 || npc.get("current") === "1")) { // just in casies
								npcs.push(char);
							} else {
								var level = char.attribs.find(function (a) {
									return a.get("name").toLowerCase() === "level";
								});
								// Can't determine difficulty without level
								if (!level || partyXPThreshold === null) {
									partyXPThreshold = null;
									return;
								}
								// Total party threshold
								for (i = 0; i < partyXPThreshold.length; i++) partyXPThreshold[i] += Parser.levelToXpThreshold(level.get("current"))[i];
								players.push(players.length + 1);
							}
						}
					}
				}
			});
			if (!players.length) return difficulty;
			// If a player doesn't have level set, fail out.
			if (partyXPThreshold !== null) {
				var len = npcs.length;
				var multiplier = 0;
				var adjustedxp = 0;
				var xp = 0;
				var index = 0;
				// Adjust for number of monsters
				if (len < 2) index = 0;
				else if (len < 3) index = 1;
				else if (len < 7) index = 2;
				else if (len < 11) index = 3;
				else if (len < 15) index = 4;
				else
					index = 5;
				// Adjust for smaller parties
				if (players.length < 3) index++;
				// Set multiplier
				multiplier = d20plus.multipliers[index];
				// Total monster xp
				$.each(npcs, function (i, v) {
					var cr = v.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc_challenge";
					});
					if (cr && cr.get("current")) xp += parseInt(Parser.crToXpNumber(cr.get("current")));
				});
				// Encounter's adjusted xp
				adjustedxp = xp * multiplier;
				console.log("Party XP Threshold", partyXPThreshold);
				console.log("Adjusted XP", adjustedxp);
				// Determine difficulty
				if (adjustedxp < partyXPThreshold[0]) difficulty = "Trivial";
				else if (adjustedxp < partyXPThreshold[1]) difficulty = "Easy";
				else if (adjustedxp < partyXPThreshold[2]) difficulty = "Medium";
				else if (adjustedxp < partyXPThreshold[3]) difficulty = "Hard";
				else difficulty = "Deadly";
			}
		} catch (e) {
			console.log("D20Plus getDifficulty Exception", e);
		}
		return difficulty;
	};

	d20plus.formSrcUrl = function (dataDir, fileName) {
		return dataDir + fileName;
	};

	d20plus.addCustomHTML = function () {
		function populateDropdown (dropdownId, inputFieldId, baseUrl, srcUrlObject, defaultSel, homebrewDir) {
			const defaultUrl = defaultSel ? d20plus.formSrcUrl(baseUrl, srcUrlObject[defaultSel]) : "";
			$(inputFieldId).val(defaultUrl);
			const dropdown = $(dropdownId);
			$.each(Object.keys(srcUrlObject), function (i, src) {
				dropdown.append($('<option>', {
					value: d20plus.formSrcUrl(baseUrl, srcUrlObject[src]),
					text: homebrewDir === "class" ? src.uppercaseFirst() : Parser.sourceJsonToFullCompactPrefix(src)
				}));
			});
			dropdown.append($('<option>', {
				value: "",
				text: "Custom"
			}));

			const brewUrl = `${HOMEBREW_REPO_URL}contents/${homebrewDir}${d20plus.ut.getAntiCacheSuffix()}&client_id=${HOMEBREW_CLIENT_ID}&client_secret=${HOMEBREW_CLIENT_SECRET}`;
			DataUtil.loadJSON(brewUrl).then((data, debugUrl) => {
				if (data.message) console.error(debugUrl, data.message);
				data.forEach(it => {
					dropdown.append($('<option>', {
						value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
						text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
					}));
				});
			}, brewUrl);

			dropdown.val(defaultUrl);
			dropdown.change(function () {
				$(inputFieldId).val(this.value);
			});
		}

		function populateBasicDropdown (dropdownId, inputFieldId, defaultSel, homebrewDir, addForPlayers) {
			function doPopulate (dropdownId, inputFieldId) {
				const $sel = $(dropdownId);
				if (defaultSel) {
					$(inputFieldId).val(defaultSel);
					$sel.append($('<option>', {
						value: defaultSel,
						text: "Official Sources"
					}));
				}
				$sel.append($('<option>', {
					value: "",
					text: "Custom"
				}));

				const brewUrl = `${HOMEBREW_REPO_URL}contents/${homebrewDir}${d20plus.ut.getAntiCacheSuffix()}&client_id=${HOMEBREW_CLIENT_ID}&client_secret=${HOMEBREW_CLIENT_SECRET}`;
				DataUtil.loadJSON(brewUrl).then((data, debugUrl) => {
					if (data.message) console.error(debugUrl, data.message);
					data.forEach(it => {
						$sel.append($('<option>', {
							value: `${it.download_url}${d20plus.ut.getAntiCacheSuffix()}`,
							text: `Homebrew: ${it.name.trim().replace(/\.json$/i, "")}`
						}));
					});
				}, brewUrl);

				$sel.val(defaultSel);
				$sel.change(function () {
					$(inputFieldId).val(this.value);
				});
			}

			doPopulate(dropdownId, inputFieldId, defaultSel, homebrewDir);
			if (addForPlayers) doPopulate(`${dropdownId}-player`, `${inputFieldId}-player`, defaultSel, homebrewDir);
		}

		const $body = $("body");
		if (window.is_gm) {
			const $wrpSettings = $(`#betteR20-settings`);

			$wrpSettings.append(d20plus.settingsHtmlImportHeader);
			$wrpSettings.append(d20plus.settingsHtmlSelector);
			$wrpSettings.append(d20plus.settingsHtmlPtMonsters);
			$wrpSettings.append(d20plus.settingsHtmlPtItems);
			$wrpSettings.append(d20plus.settingsHtmlPtSpells);
			$wrpSettings.append(d20plus.settingsHtmlPtPsionics);
			$wrpSettings.append(d20plus.settingsHtmlPtRaces);
			$wrpSettings.append(d20plus.settingsHtmlPtFeats);
			$wrpSettings.append(d20plus.settingsHtmlPtObjects);
			$wrpSettings.append(d20plus.settingsHtmlPtClasses);
			$wrpSettings.append(d20plus.settingsHtmlPtSubclasses);
			$wrpSettings.append(d20plus.settingsHtmlPtBackgrounds);
			$wrpSettings.append(d20plus.settingsHtmlPtOptfeatures);
			const $ptAdventures = $(d20plus.settingsHtmlPtAdventures);
			$wrpSettings.append($ptAdventures);
			$ptAdventures.find(`.Vetools-module-tool-open`).click(() => d20plus.tool.get('MODULES').openFn());
			$wrpSettings.append(d20plus.settingsHtmlPtImportFooter);

			$("#mysettings > .content a#button-monsters-load").on(window.mousedowntype, d20plus.monsters.button);
			$("#mysettings > .content a#button-monsters-load-all").on(window.mousedowntype, d20plus.monsters.buttonAll);
			$("#mysettings > .content a#import-objects-load").on(window.mousedowntype, d20plus.objects.button);
			$("#mysettings > .content a#button-adventures-load").on(window.mousedowntype, d20plus.adventures.button);

			$("#mysettings > .content a#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
			$("#initiativewindow .characterlist").before(d20plus.initiativeHeaders);

			d20plus.setTurnOrderTemplate();
			d20.Campaign.initiativewindow.rebuildInitiativeList();
			d20plus.hpAllowEdit();
			d20.Campaign.initiativewindow.model.on("change:turnorder", function () {
				d20plus.updateDifficulty();
			});
			d20plus.updateDifficulty();

			populateDropdown("#button-monsters-select", "#import-monster-url", MONSTER_DATA_DIR, monsterDataUrls, "MM", "creature");
			populateBasicDropdown("#button-objects-select", "#import-objects-url", OBJECT_DATA_URL, "object");

			populateAdventuresDropdown();

			function populateAdventuresDropdown () {
				const defaultAdvUrl = d20plus.formSrcUrl(ADVENTURE_DATA_DIR, "adventure-lmop.json");
				const $iptUrl = $("#import-adventures-url");
				$iptUrl.val(defaultAdvUrl);
				$iptUrl.data("id", "lmop");
				const $sel = $("#button-adventures-select");
				adventureMetadata.adventure.forEach(a => {
					$sel.append($('<option>', {
						value: d20plus.formSrcUrl(ADVENTURE_DATA_DIR, `adventure-${a.id.toLowerCase()}.json|${a.id}`),
						text: a.name
					}));
				});
				$sel.append($('<option>', {
					value: "",
					text: "Custom"
				}));
				$sel.val(defaultAdvUrl);
				$sel.change(() => {
					const [url, id] = $sel.val().split("|");
					$($iptUrl).val(url);
					$iptUrl.data("id", id);
				});
			}

			// import
			$("a#button-spells-load").on(window.mousedowntype, () => d20plus.spells.button());
			$("a#button-spells-load-all").on(window.mousedowntype, () => d20plus.spells.buttonAll());
			$("a#import-psionics-load").on(window.mousedowntype, () => d20plus.psionics.button());
			$("a#import-items-load").on(window.mousedowntype, () => d20plus.items.button());
			$("a#import-races-load").on(window.mousedowntype, () => d20plus.races.button());
			$("a#import-feats-load").on(window.mousedowntype, () => d20plus.feats.button());
			$("a#button-classes-load").on(window.mousedowntype, () => d20plus.classes.button());
			$("a#button-classes-load-all").on(window.mousedowntype, () => d20plus.classes.buttonAll());
			$("a#import-subclasses-load").on(window.mousedowntype, () => d20plus.subclasses.button());
			$("a#import-backgrounds-load").on(window.mousedowntype, () => d20plus.backgrounds.button());
			$("a#import-optionalfeatures-load").on(window.mousedowntype, () => d20plus.optionalfeatures.button());
			$("select#import-mode-select").on("change", () => d20plus.importer.importModeSwitch());
		} else {
			// player-only HTML if required
		}

		$body.append(d20plus.playerImportHtml);
		const $winPlayer = $("#d20plus-playerimport");
		const $appTo = $winPlayer.find(`.append-target`);
		$appTo.append(d20plus.settingsHtmlSelectorPlayer);
		$appTo.append(d20plus.settingsHtmlPtItemsPlayer);
		$appTo.append(d20plus.settingsHtmlPtSpellsPlayer);
		$appTo.append(d20plus.settingsHtmlPtPsionicsPlayer);
		$appTo.append(d20plus.settingsHtmlPtRacesPlayer);
		$appTo.append(d20plus.settingsHtmlPtFeatsPlayer);
		$appTo.append(d20plus.settingsHtmlPtClassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtSubclassesPlayer);
		$appTo.append(d20plus.settingsHtmlPtBackgroundsPlayer);
		$appTo.append(d20plus.settingsHtmlPtOptfeaturesPlayer);

		$winPlayer.dialog({
			autoOpen: false,
			resizable: true,
			width: 800,
			height: 650,
		});

		const $wrpPlayerImport = $(`
			<div style="padding: 0 10px">
				<div style="clear: both"></div>
			</div>`);
		const $btnPlayerImport = $(`<button class="btn" href="#" title="A tool to import temporary copies of various things, which can be drag-and-dropped to character sheets." style="margin-top: 5px">Temp Import Spells, Items, Classes,...</button>`)
			.on("click", () => {
				$winPlayer.dialog("open");
			});
		$wrpPlayerImport.prepend($btnPlayerImport);
		$(`#journal`).prepend($wrpPlayerImport);

		// SHARED WINDOWS/BUTTONS
		// import
		$("a#button-spells-load-player").on(window.mousedowntype, () => d20plus.spells.button(true));
		$("a#button-spells-load-all-player").on(window.mousedowntype, () => d20plus.spells.buttonAll(true));
		$("a#import-psionics-load-player").on(window.mousedowntype, () => d20plus.psionics.button(true));
		$("a#import-items-load-player").on(window.mousedowntype, () => d20plus.items.button(true));
		$("a#import-races-load-player").on(window.mousedowntype, () => d20plus.races.button(true));
		$("a#import-feats-load-player").on(window.mousedowntype, () => d20plus.feats.button(true));
		$("a#button-classes-load-player").on(window.mousedowntype, () => d20plus.classes.button(true));
		$("a#button-classes-load-all-player").on(window.mousedowntype, () => d20plus.classes.buttonAll(true));
		$("a#import-subclasses-load-player").on(window.mousedowntype, () => d20plus.subclasses.button(true));
		$("a#import-backgrounds-load-player").on(window.mousedowntype, () => d20plus.backgrounds.button(true));
		$("a#import-optionalfeatures-load-player").on(window.mousedowntype, () => d20plus.optionalfeatures.button(true));
		$("select#import-mode-select-player").on("change", () => d20plus.importer.importModeSwitch());

		$body.append(d20plus.importDialogHtml);
		$body.append(d20plus.importListHTML);
		$body.append(d20plus.importListPropsHTML);
		$("#d20plus-import").dialog({
			autoOpen: false,
			resizable: false
		});
		$("#d20plus-importlist").dialog({
			autoOpen: false,
			resizable: true,
			width: 1000,
			height: 700
		});
		$("#d20plus-import-props").dialog({
			autoOpen: false,
			resizable: true,
			width: 300,
			height: 600
		});

		populateDropdown("#button-spell-select", "#import-spell-url", SPELL_DATA_DIR, spellDataUrls, "PHB", "spell");
		populateDropdown("#button-spell-select-player", "#import-spell-url-player", SPELL_DATA_DIR, spellDataUrls, "PHB", "spell");
		populateDropdown("#button-classes-select", "#import-classes-url", CLASS_DATA_DIR, classDataUrls, "", "class");
		populateDropdown("#button-classes-select-player", "#import-classes-url-player", CLASS_DATA_DIR, classDataUrls, "", "class");

		populateBasicDropdown("#button-items-select", "#import-items-url", ITEM_DATA_URL, "item", true);
		populateBasicDropdown("#button-psionics-select", "#import-psionics-url", PSIONIC_DATA_URL, "psionic", true);
		populateBasicDropdown("#button-feats-select", "#import-feats-url", FEAT_DATA_URL, "feat", true);
		populateBasicDropdown("#button-races-select", "#import-races-url", RACE_DATA_URL, "race", true);
		populateBasicDropdown("#button-subclasses-select", "#import-subclasses-url", "", "subclass", true);
		populateBasicDropdown("#button-backgrounds-select", "#import-backgrounds-url", BACKGROUND_DATA_URL, "background", true);
		populateBasicDropdown("#button-optionalfeatures-select", "#import-optionalfeatures-url", OPT_FEATURE_DATA_URL, "optionalfeature", true);

		// bind tokens button
		const altBindButton = $(`<button id="bind-drop-locations-alt" class="btn bind-drop-locations" href="#" title="Bind drop locations and handouts">Bind Drag-n-Drop</button>`);
		altBindButton.on("click", function () {
			d20plus.bindDropLocations();
		});

		if (window.is_gm) {
			const $addPoint = $(`#journal button.btn.superadd`);
			altBindButton.css("margin-right", "5px");
			$addPoint.after(altBindButton);
		} else {
			altBindButton.css("margin-top", "5px");
			const $wrprControls = $(`#search-wrp-controls`);
			$wrprControls.append(altBindButton);
		}
		$("#journal btn#bind-drop-locations").on(window.mousedowntype, d20plus.bindDropLocations);
	};

	d20plus.updateDifficulty = function () {
		if (!$("div#initiativewindow").parent().is("body")) {
			var $span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
			var $btnpane = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane");
			if (!$span.length) {
				$btnpane.prepend(d20plus.difficultyHtml);
				$span = $("div#initiativewindow").parent().find(".ui-dialog-buttonpane > span.difficulty");
			}
			if (d20plus.cfg.getCfgVal("interface", "showDifficulty")) {
				$span.text("Difficulty: " + d20plus.getDifficulty());
				$span.show();
			} else {
				$span.hide();
			}
		}
	};

// bind tokens to the initiative tracker
	d20plus.bindTokens = function () {
		// Gets a list of all the tokens on the current page:
		const curTokens = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.toArray();
		curTokens.forEach(t => {
			d20plus.bindToken(t);
		});
	};

// bind drop locations on sheet to accept custom handouts
	d20plus.bindDropLocations = function () {
		if (window.is_gm) {
			// Bind Spells and Items, add compendium-item to each of them
			var journalFolder = d20.Campaign.get("journalfolder");
			if (journalFolder === "") {
				d20.journal.addFolderToFolderStructure("Spells");
				d20.journal.addFolderToFolderStructure("Psionics");
				d20.journal.addFolderToFolderStructure("Items");
				d20.journal.addFolderToFolderStructure("Feats");
				d20.journal.addFolderToFolderStructure("Classes");
				d20.journal.addFolderToFolderStructure("Subclasses");
				d20.journal.addFolderToFolderStructure("Backgrounds");
				d20.journal.addFolderToFolderStructure("Races");
				d20.journal.addFolderToFolderStructure("Optional Features");
				d20.journal.refreshJournalList();
				journalFolder = d20.Campaign.get("journalfolder");
			}
		}

		function addClasses (folderName) {
			$(`#journalfolderroot > ol.dd-list > li.dd-folder > div.dd-content:contains(${folderName})`).parent().find("ol li[data-itemid]").addClass("compendium-item").addClass("ui-draggable").addClass("Vetools-draggable");
		}

		addClasses("Spells");
		addClasses("Psionics");
		addClasses("Items");
		addClasses("Feats");
		addClasses("Classes");
		addClasses("Subclasses");
		addClasses("Backgrounds");
		addClasses("Races");
		addClasses("Optional Features");

		// if player, force-enable dragging
		if (!window.is_gm) {
			$(`.Vetools-draggable`).draggable({
				revert: true,
				distance: 10,
				revertDuration: 0,
				helper: "clone",
				handle: ".namecontainer",
				appendTo: "body",
				scroll: true,
				start: function () {
					$("#journalfolderroot").addClass("externaldrag")
				},
				stop: function () {
					$("#journalfolderroot").removeClass("externaldrag")
				}
			});
		}

		class CharacterAttributesProxy {
			constructor (character) {
				this.character = character;
				this._changedAttrs = [];
			}

			findByName (attrName) {
				return this.character.model.attribs.toJSON()
					.find(a => a.name === attrName) || {};
			}

			findOrGenerateRepeatingRowId (namePattern, current) {
				const [namePrefix, nameSuffix] = namePattern.split(/\$\d?/);
				const attr = this.character.model.attribs.toJSON()
					.find(a => a.name.startsWith(namePrefix) && a.name.endsWith(nameSuffix) && a.current == current);
				return attr ?
					attr.name.replace(RegExp(`^${namePrefix}(.*)${nameSuffix}$`), "$1") :
					d20plus.ut.generateRowId();
			}

			add (name, current, max) {
				this.character.model.attribs.create({
					name: name,
					current: current,
					...(max == undefined ? {} : {max: max})
				}).save();
				this._changedAttrs.push(name);
			}

			addOrUpdate (name, current, max) {
				const id = this.findByName(name).id;
				if (id) {
					this.character.model.attribs.get(id).set({
						current: current,
						...(max == undefined ? {} : {max: max})
					}).save();
					this._changedAttrs.push(name);
				} else {
					this.add(name, current, max);
				}
			}

			notifySheetWorkers () {
				d20.journal.notifyWorkersOfAttrChanges(this.character.model.id, this._changedAttrs);
				this._changedAttrs = [];
			}
		}

		function importFeat (character, data) {
			const featName = data.name;
			const featText = data.Vetoolscontent;
			const attrs = new CharacterAttributesProxy(character);
			const rowId = d20plus.ut.generateRowId();

			if (d20plus.sheet == "ogl") {
				attrs.add(`repeating_traits_${rowId}_options-flag`, "0");
				attrs.add(`repeating_traits_${rowId}_name`, featName);
				attrs.add(`repeating_traits_${rowId}_description`, featText);
				attrs.add(`repeating_traits_${rowId}_source`, "Feat");
			} else if (d20plus.sheet == "shaped") {
				attrs.add(`repeating_feat_${rowId}_name`, featName);
				attrs.add(`repeating_feat_${rowId}_content`, featText);
				attrs.add(`repeating_feat_${rowId}_content_toggle`, "1");
			} else {
				console.warn(`Feat import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importBackground (character, data) {
			const bg = data.Vetoolscontent;

			const renderer = new EntryRenderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			const renderStack = [];
			let feature;
			bg.entries.forEach(e => {
				if (e.name && e.name.includes("Feature:")) {
					feature = JSON.parse(JSON.stringify(e));
					feature.name = feature.name.replace("Feature:", "").trim();
				}
			});
			if (feature)
				renderer.recursiveEntryRender({entries: feature.entries}, renderStack);
			feature.text = renderStack.length ? d20plus.importer.getCleanText(renderStack.join("")) : "";

			const skills = bg.skillProficiencies ? bg.skillProficiencies.split(",").map(s => s.trim()) : [];

			const attrs = new CharacterAttributesProxy(character);
			const fRowId = d20plus.ut.generateRowId();

			if (d20plus.sheet == "ogl") {
				attrs.addOrUpdate("background", bg.name);

				attrs.add(`repeating_traits_${fRowId}_name`, bg.name);
				attrs.add(`repeating_traits_${fRowId}_source`, "Background");
				attrs.add(`repeating_traits_${fRowId}_source_type`, bg.name);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				if (feature.text) {
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
				}

				skills.map(s => s.toLowerCase().replace(/ /g, "_")).forEach(s => {
					attrs.addOrUpdate(`${s}_prof`, `(@{pb}*@{${s}_type})`);
				});
			} else if (d20plus.sheet == "shaped") {
				attrs.addOrUpdate("background", bg.name);
				attrs.add(`repeating_trait_${fRowId}_name`, `${feature.name} (${bg.name})`);
				if (feature.text) {
					attrs.add(`repeating_trait_${fRowId}_content`, feature.text);
					attrs.add(`repeating_trait_${fRowId}_content_toggle`, "1");
				}

				skills.map(s => s.toUpperCase().replace(/ /g, "")).forEach(s => {
					const rowId = attrs.findOrGenerateRepeatingRowId("repeating_skill_$0_storage_name", s);
					attrs.addOrUpdate(`repeating_skill_${rowId}_proficiency`, "proficient");
				});
			} else {
				console.warn(`Background import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importRace (character, data) {
			const race = data.Vetoolscontent;

			race.entries.forEach(e => {
				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);
				const renderStack = [];
				renderer.recursiveEntryRender({entries: e.entries}, renderStack);
				e.text = d20plus.importer.getCleanText(renderStack.join(""));
			});

			const attrs = new CharacterAttributesProxy(character);

			if (d20plus.sheet == "ogl") {
				attrs.addOrUpdate(`race`, race.name);
				attrs.addOrUpdate(`race_display`, race.name);
				attrs.addOrUpdate(`speed`, Parser.getSpeedString(race));

				race.entries.forEach(e => {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_traits_${fRowId}_name`, e.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Race");
					attrs.add(`repeating_traits_${fRowId}_source_type`, race.name);
					attrs.add(`repeating_traits_${fRowId}_description`, e.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				});
			} else if (d20plus.sheet == "shaped") {
				attrs.addOrUpdate("race", race.name);
				attrs.addOrUpdate("size", Parser.sizeAbvToFull(race.size).toUpperCase());
				attrs.addOrUpdate("speed_string", Parser.getSpeedString(race));

				if (race.speed instanceof Object) {
					for (locomotion of ["walk", "burrow", "climb", "fly", "swim"]) {
						if (race.speed[locomotion]) {
							const attrName = locomotion == "walk" ? "speed" : `speed_${locomotion}`;
							if (locomotion != "walk") {
								attrs.addOrUpdate("other_speeds", "1");
							}
							// note: this doesn't cover hover
							attrs.addOrUpdate(attrName, race.speed[locomotion]);
						}
					}
				} else {
					attrs.addOrUpdate("speed", race.speed);
				}

				// really there seems to be only darkvision for PCs
				for (vision of ["darkvision", "blindsight", "tremorsense", "truesight"]) {
					if (race[vision]) {
						attrs.addOrUpdate(vision, race[vision]);
					}
				}

				race.entries.forEach(e => {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_racialtrait_${fRowId}_name`, e.name);
					attrs.add(`repeating_racialtrait_${fRowId}_content`, e.text);
					attrs.add(`repeating_racialtrait_${fRowId}_content_toggle`, "1");
				});

				const fRowId = d20plus.ut.generateRowId();
				attrs.add(`repeating_modifier_${fRowId}_name`, race.name);
				attrs.add(`repeating_modifier_${fRowId}_ability_score_toggle`, "1");
				Object.keys(race.ability).forEach(abilityAbv => {
					const value = race.ability[abilityAbv];
					const ability = Parser.attAbvToFull(abilityAbv).toLowerCase();
					attrs.add(`repeating_modifier_${fRowId}_${ability}_score_modifier`, value);
				});
			} else {
				console.warn(`Race import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importOptionalFeature (character, data) {
			const optionalFeature = data.Vetoolscontent;
			const renderer = new EntryRenderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			const rendered = renderer.renderEntry({entries: optionalFeature.entries});
			const optionalFeatureText = d20plus.importer.getCleanText(rendered);

			const attrs = new CharacterAttributesProxy(character);
			const fRowId = d20plus.ut.generateRowId();

			if (d20plus.sheet == "ogl") {
				attrs.add(`repeating_traits_${fRowId}_name`, optionalFeature.name);
				attrs.add(`repeating_traits_${fRowId}_source`, Parser.optFeatureTypeToFull(optionalFeature.featureType));
				attrs.add(`repeating_traits_${fRowId}_source_type`, optionalFeature.name);
				attrs.add(`repeating_traits_${fRowId}_description`, optionalFeatureText);
				attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
			} else if (d20plus.sheet == "shaped") {
				attrs.add(`repeating_classfeature_${fRowId}_name`, optionalFeature.name);
				attrs.add(`repeating_classfeature_${fRowId}_content`, optionalFeatureText);
				attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
			} else {
				console.warn(`Optional feature (invocation, maneuver, or metamagic) import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importClass (character, data) {
			let levels = d20plus.ut.getNumberRange("What levels?", 1, 20);
			if (!levels)
				return;

			const maxLevel = Math.max(...levels);

			const clss = data.Vetoolscontent;
			const renderer = EntryRenderer.getDefaultRenderer().setBaseUrl(BASE_SITE_URL);
			const shapedSheetPreFilledFeaturesByClass = {
				"Artificer": [
					"Magic Item Analysis",
					"Tool Expertise",
					"Wondrous Invention",
					"Infuse Magic",
					"Superior Attunement",
					"Mechanical Servant",
					"Soul of Artifice",
				],
				"Barbarian": [
					"Rage",
					"Unarmored Defense",
					"Reckless Attack",
					"Danger Sense",
					"Extra Attack",
					"Fast Movement",
					"Feral Instinct",
					"Brutal Critical",
					"Relentless Rage",
					"Persistent Rage",
					"Indomitable Might",
					"Primal Champion",
				],
				"Bard": [
					"Bardic Inspiration",
					"Jack of All Trades",
					"Song of Rest",
					"Expertise",
					"Countercharm",
					"Magical Secrets",
					"Superior Inspiration",
				],
				"Cleric": [
					"Channel Divinity",
					"Turn Undead",
					"Divine Intervention",
				],
				"Druid": [
					"Druidic",
					"Wild Shape",
					"Timeless Body",
					"Beast Spells",
					"Archdruid",
				],
				"Fighter": [
					"Fighting Style",
					"Second Wind",
					"Action Surge",
					"Extra Attack",
					"Indomitable",
				],
				"Monk": [
					"Unarmored Defense",
					"Martial Arts",
					"Ki",
					"Flurry of Blows",
					"Patient Defense",
					"Step of the Wind",
					"Unarmored Movement",
					"Deflect Missiles",
					"Slow Fall",
					"Extra Attack",
					"Stunning Strike",
					"Ki-Empowered Strikes",
					"Evasion",
					"Stillness of Mind",
					"Purity of Body",
					"Tongue of the Sun and Moon",
					"Diamond Soul",
					"Timeless Body",
					"Empty Body",
					"Perfect Soul",
				],
				"Paladin": [
					"Divine Sense",
					"Lay on Hands",
					"Fighting Style",
					"Divine Smite",
					"Divine Health",
					"Channel Divinity",
					"Extra Attack",
					"Aura of Protection",
					"Aura of Courage",
					"Improved Divine Smite",
					"Cleansing Touch",
				],
				"Ranger": [
					"Favored Enemy",
					"Natural Explorer",
					"Fighting Style",
					"Primeval Awareness",
					"Land’s Stride",
					"Hide in Plain Sight",
					"Vanish",
					"Feral Senses",
					"Foe Slayer",
				],
				"Ranger (Revised)": [ // "Ranger UA (2016)"
					"Favored Enemy",
					"Natural Explorer",
					"Fighting Style",
					"Primeval Awareness",
					"Greater Favored Enemy",
					"Fleet of Foot",
					"Hide in Plain Sight",
					"Vanish",
					"Feral Senses",
					"Foe Slayer",
				],
				"Rogue": [
					"Expertise",
					"Sneak Attack",
					"Thieves' Cant",
					"Cunning Action",
					"Uncanny Dodge",
					"Evasion",
					"Reliable Talent",
					"Blindsense",
					"Slippery Mind",
					"Elusive",
					"Stroke of Luck",
				],
				"Sorcerer": [
					"Sorcery Points",
					"Flexible Casting",
					"Metamagic",
					"Sorcerous Restoration",
				],
				"Warlock": [
					"Eldritch Invocations",
					"Pact Boon",
					"Mystic Arcanum",
					"Eldritch Master",
				],
				"Wizard": [
					"Arcane Recovery",
					"Spell Mastery",
					"Signature Spells",
				],
			};
			const shapedSheetPreFilledFeatures = shapedSheetPreFilledFeaturesByClass[clss.name] || [];

			const attrs = new CharacterAttributesProxy(character);

			importClassGeneral(attrs, clss, maxLevel);

			for (let i = 0; i < maxLevel; i++) {
				const level = i + 1;
				if (!levels.has(level)) continue;

				const lvlFeatureList = clss.classFeatures[i];
				for (let j = 0; j < lvlFeatureList.length; j++) {
					const feature = lvlFeatureList[j];
					// don't add "you gain a subclass feature" or ASI's
					if (!feature.gainSubclassFeature && feature.name !== "Ability Score Improvement") {
						const renderStack = [];
						renderer.recursiveEntryRender({entries: feature.entries}, renderStack);
						feature.text = d20plus.importer.getCleanText(renderStack.join(""));
						importClassFeature(attrs, clss, level, feature);
					}
				}
			}

			function importClassGeneral (attrs, clss, maxLevel) {
				if (d20plus.sheet == "ogl") {
					setTimeout(() => {
						attrs.addOrUpdate("pb", d20plus.getProfBonusFromLevel(Number(maxLevel)));
						attrs.addOrUpdate("class", clss.name);
						attrs.addOrUpdate("level", maxLevel);
						attrs.addOrUpdate("base_level", String(maxLevel));
					}, 500);
				} else if (d20plus.sheet == "shaped") {
					const isSupportedClass = clss.source == "PHB" || ["Artificer", "Ranger (Revised)"].includes(clss.name);
					let className = "CUSTOM";
					if (isSupportedClass) {
						className = clss.name.toUpperCase();
						if (clss.name == "Ranger (Revised)")
							className = "RANGERUA";
					}

					const fRowId = attrs.findOrGenerateRepeatingRowId("repeating_class_$0_name", className);
					attrs.addOrUpdate(`repeating_class_${fRowId}_name`, className);
					attrs.addOrUpdate(`repeating_class_${fRowId}_level`, maxLevel);
					if (!isSupportedClass) {
						attrs.addOrUpdate(`repeating_class_${fRowId}_hd`, `d${clss.hd.faces}`);
						attrs.addOrUpdate(`repeating_class_${fRowId}_custom_class_toggle`, "1");
						attrs.addOrUpdate(`repeating_class_${fRowId}_custom_name`, clss.name);
					}

					if (!isSupportedClass && clss.name == "Mystic") {
						const classResourcesForLevel = clss.classTableGroups[0].rows[maxLevel - 1];
						const [talentsKnown, disciplinesKnown, psiPoints, psiLimit] = classResourcesForLevel;

						attrs.addOrUpdate("spell_points_name", "PSI");
						attrs.addOrUpdate("show_spells", "1");
						attrs.addOrUpdate("spell_points_toggle", "1");
						attrs.addOrUpdate("spell_ability", "INTELLIGENCE");
						attrs.addOrUpdate("spell_points_limit", psiLimit);
						attrs.addOrUpdate("spell_points", psiPoints, psiPoints);
						talentsKnown, disciplinesKnown;	// unused

						for (let i = 1; i <= 7; i++) {
							attrs.addOrUpdate(`spell_level_${i}_cost`, i);
						}
						for (let i = 0; i <= psiLimit; i++) {
							attrs.addOrUpdate(`spell_level_filter_${i}`, "1");
						}
					}

					attrs.notifySheetWorkers();
				} else {
					console.warn(`Class import is not supported for ${d20plus.sheet} character sheet`);
				}
			}

			function importClassFeature (attrs, clss, level, feature) {
				if (d20plus.sheet == "ogl") {
					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Class");
					attrs.add(`repeating_traits_${fRowId}_source_type`, `${clss.name} ${level}`);
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				} else if (d20plus.sheet == "shaped") {
					if (shapedSheetPreFilledFeatures.includes(feature.name))
						return;

					const fRowId = d20plus.ut.generateRowId();
					attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${clss.name} ${level})`);
					attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
					attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
				}

				attrs.notifySheetWorkers();
			}
		}

		function importSubclass (character, data) {
			if (d20plus.sheet != "ogl" && d20plus.sheet != "shaped") {
				console.warn(`Subclass import is not supported for ${d20plus.sheet} character sheet`);
				return;
			}

			const attrs = new CharacterAttributesProxy(character);
			const sc = data.Vetoolscontent;

			const desiredIxs = new Set(); // indexes into the subclass feature array
			const gainLevels = [];

			// _gainAtLevels should be a 20-length array of booleans
			if (sc._gainAtLevels) {
				const levels = d20plus.ut.getNumberRange("What levels?", 1, 20);
				if (levels) {
					let scFeatureIndex = 0;
					for (let i = 0; i < 20; i++) {
						if (sc._gainAtLevels[i]) {
							if (levels.has(i + 1)) {
								desiredIxs.add(scFeatureIndex);
							}
							scFeatureIndex++;
							gainLevels.push(i + 1);
						}
					}
				} else {
					return;
				}
			} else {
				throw new Error("No subclass._gainAtLevels supplied!");
			}

			if (!desiredIxs.size) {
				alert("No subclass features were found within the range specified.");
				return;
			}

			const renderer = new EntryRenderer();
			renderer.setBaseUrl(BASE_SITE_URL);
			let firstFeatures = true;
			for (let i = 0; i < sc.subclassFeatures.length; i++) {
				if (!desiredIxs.has(i)) continue;

				const lvlFeatureList = sc.subclassFeatures[i];
				for (let j = 0; j < lvlFeatureList.length; j++) {
					const featureCpy = JSON.parse(JSON.stringify(lvlFeatureList[j]));
					let feature = lvlFeatureList[j];

					try {
						while (!feature.name || (feature[0] && !feature[0].name)) {
							if (feature.entries && feature.entries.name) {
								feature = feature.entries;
								continue;
							} else if (feature.entries[0] && feature.entries[0].name) {
								feature = feature.entries[0];
								continue;
							} else {
								feature = feature.entries;
							}

							if (!feature) {
								// in case something goes wrong, reset break the loop
								feature = featureCpy;
								break;
							}
						}
					} catch (e) {
						console.error("Failed to find feature");
						// in case something goes _really_ wrong, reset
						feature = featureCpy;
					}

					// for the first batch of subclass features, try to split them up
					if (firstFeatures && feature.name && feature.entries) {
						const subFeatures = [];
						const baseFeatures = feature.entries.filter(f => {
							if (f.name && f.type === "entries") {
								subFeatures.push(f);
								return false;
							} else return true;
						});
						importSubclassFeature(attrs, sc, gainLevels[i],
								{name: feature.name, type: feature.type, entries: baseFeatures});
						subFeatures.forEach(sf => {
							importSubclassFeature(attrs, sc, gainLevels[i], sf);
						})
					} else {
						importSubclassFeature(attrs, sc, gainLevels[i], feature);
					}

					firstFeatures = false;
				}
			}

			function importSubclassFeature (attrs, sc, level, feature) {
				const renderStack = [];
				renderer.recursiveEntryRender({entries: feature.entries}, renderStack);
				feature.text = d20plus.importer.getCleanText(renderStack.join(""));

				const fRowId = d20plus.ut.generateRowId();

				if (d20plus.sheet == "ogl") {
					attrs.add(`repeating_traits_${fRowId}_name`, feature.name);
					attrs.add(`repeating_traits_${fRowId}_source`, "Class");
					attrs.add(`repeating_traits_${fRowId}_source_type`, `${sc.class} (${sc.name} ${level})`);
					attrs.add(`repeating_traits_${fRowId}_description`, feature.text);
					attrs.add(`repeating_traits_${fRowId}_options-flag`, "0");
				} else if (d20plus.sheet == "shaped") {
					attrs.add(`repeating_classfeature_${fRowId}_name`, `${feature.name} (${sc.name} ${level})`);
					attrs.add(`repeating_classfeature_${fRowId}_content`, feature.text);
					attrs.add(`repeating_classfeature_${fRowId}_content_toggle`, "1");
				}

				attrs.notifySheetWorkers();
			}
		}

		function importPsionicAbility (character, data) {
			const renderer = new EntryRenderer();
			renderer.setBaseUrl(BASE_SITE_URL);

			const attrs = new CharacterAttributesProxy(character);
			data = data.Vetoolscontent;
			if (!data) {
				alert("Missing data. Please re-import Psionics.");
				return;
			}

			function getCostStr (cost) {
				return cost.min === cost.max ? cost.min : `${cost.min}-${cost.max}`;
			}

			function getCleanText (entries) {
				if (typeof entries == "string") {
					return d20plus.importer.getCleanText(renderer.renderEntry(entries));
				} else {
					const renderStack = [];
					renderer.recursiveEntryRender({entries: entries}, renderStack, 3);
					return d20plus.importer.getCleanText(renderStack.join(""));
				}
			}

			if (d20plus.sheet == "ogl") {
				const makeSpellTrait = function (level, rowId, propName, content) {
					const attrName = `repeating_spell-${level}_${rowId}_${propName}`;
					attrs.add(attrName, content);
				}

				// disable all components
				const noComponents = function (level, rowId, hasM) {
					makeSpellTrait(level, rowId, "spellcomp_v", 0);
					makeSpellTrait(level, rowId, "spellcomp_s", 0);
					if (!hasM) {
						makeSpellTrait(level, rowId, "spellcomp_m", 0);
					}
					makeSpellTrait(level, rowId, "options-flag", 0);
				}

				if (data.type === "D") {
					const rowId = d20plus.ut.generateRowId();

					// make focus
					const focusLevel = "cantrip";
					makeSpellTrait(focusLevel, rowId, "spelllevel", "cantrip");
					makeSpellTrait(focusLevel, rowId, "spellname", `${data.name} Focus`);
					makeSpellTrait(focusLevel, rowId, "spelldescription", getCleanText(data.focus));
					makeSpellTrait(focusLevel, rowId, "spellcastingtime", "1 bonus action");
					noComponents(focusLevel, rowId);

					data.modes.forEach(m => {
						if (m.submodes) {
							m.submodes.forEach(sm => {
								const rowId = d20plus.ut.generateRowId();
								const smLevel = sm.cost.min;
								makeSpellTrait(smLevel, rowId, "spelllevel", smLevel);
								makeSpellTrait(smLevel, rowId, "spellname", `${m.name} (${sm.name})`);
								makeSpellTrait(smLevel, rowId, "spelldescription", getCleanText(sm.entries));
								makeSpellTrait(smLevel, rowId, "spellcomp_materials", `${getCostStr(sm.cost)} psi points`);
								noComponents(smLevel, rowId, true);
							});
						} else {
							const rowId = d20plus.ut.generateRowId();
							const mLevel = m.cost.min;
							makeSpellTrait(mLevel, rowId, "spelllevel", mLevel);
							makeSpellTrait(mLevel, rowId, "spellname", `${m.name}`);
							makeSpellTrait(mLevel, rowId, "spelldescription", `Psionic Discipline mode\n\n${getCleanText(m.entries)}`);
							makeSpellTrait(mLevel, rowId, "spellcomp_materials", `${getCostStr(m.cost)} psi points`);
							if (m.concentration) {
								makeSpellTrait(mLevel, rowId, "spellduration", `${m.concentration.duration} ${m.concentration.unit}`);
								makeSpellTrait(mLevel, rowId, "spellconcentration", "Yes");
							}
							noComponents(mLevel, rowId, true);
						}
					});
				} else {
					const rowId = d20plus.ut.generateRowId();
					const level = "cantrip";
					makeSpellTrait(level, rowId, "spelllevel", "cantrip");
					makeSpellTrait(level, rowId, "spellname", data.name);
					makeSpellTrait(level, rowId, "spelldescription", `Psionic Talent\n\n${getCleanText(EntryRenderer.psionic.getTalentText(data, renderer))}`);
					noComponents(level, rowId, false);
				}
			} else if (d20plus.sheet == "shaped") {
				const makeSpellTrait = function (level, rowId, propName, content) {
					const attrName = `repeating_spell${level}_${rowId}_${propName}`;
					attrs.add(attrName, content);
				}

				const shapedSpellLevel = function (level) {
					return level ? `${Parser.levelToFull(String(level))}_LEVEL`.toUpperCase() : "CANTRIP";
				}

				const shapedConcentration = function (conc) {
					const CONC_ABV_TO_FULL = {
						rnd: "round",
						min: "minute",
						hr: "hour",
					};
					return `CONCENTRATION_UP_TO_${conc.duration}_${CONC_ABV_TO_FULL[conc.unit]}${conc.duration > 1 ? "S" : ""}`.toUpperCase();
				}

				const inferCastingTime = function (content) {
					if (content.search(/\b(as an action)\b/i) >= 0) {
						return "1_ACTION";
					} else if (content.search(/\b(as a bonus action)\b/i) >= 0) {
						return "1_BONUS_ACTION";
					} else if (content.search(/\b(as a reaction)\b/i) >= 0) {
						return "1_REACTION";
					}
					return "1_ACTION";
				}

				const inferDuration = function (content) {
					let duration, unit, match;
					if ((match = content.match(/\b(?:for the next|for 1) (round|minute|hour)\b/i))) {
						[duration, unit] = [1, match[1]];
					} else if ((match = content.match(/\b(?:for|for the next) (\d+) (minutes|hours|days)\b/i))) {
						[duration, unit] = [match[1], match[2]];
					}

					return (duration && unit) ? `${duration}_${unit}`.toUpperCase() : `INSTANTANEOUS`;
				}

				if (data.type === "D") {
					const typeStr = `**Psionic Discipline:** ${data.name}\n**Psionic Order:** ${data.order}\n`;
					const rowId = d20plus.ut.generateRowId();

					// make focus
					const focusLevel = 0;
					makeSpellTrait(focusLevel, rowId, "spell_level", shapedSpellLevel(focusLevel));
					makeSpellTrait(focusLevel, rowId, "name", `${data.name} Focus`);
					makeSpellTrait(focusLevel, rowId, "content", `${typeStr}\n${getCleanText(data.focus)}`);
					makeSpellTrait(focusLevel, rowId, "content_toggle", "1");
					makeSpellTrait(focusLevel, rowId, "casting_time", "1_BONUS_ACTION");
					makeSpellTrait(focusLevel, rowId, "components", "COMPONENTS_M");
					makeSpellTrait(focusLevel, rowId, "duration", "SPECIAL");

					data.modes.forEach(m => {
						const modeContent = `${typeStr}\n${getCleanText(m.entries)}`;

						if (m.submodes) {
							m.submodes.forEach(sm => {
								const rowId = d20plus.ut.generateRowId();
								const smLevel = sm.cost.min;
								const costStr = getCostStr(sm.cost);
								const content = `${modeContent}\n${getCleanText(sm.entries)}`;
								makeSpellTrait(smLevel, rowId, "spell_level", shapedSpellLevel(smLevel));
								makeSpellTrait(smLevel, rowId, "name", `${m.name} (${sm.name})` + (sm.cost.min < sm.cost.max ? ` (${costStr} psi)` : ""));
								makeSpellTrait(smLevel, rowId, "content", content);
								makeSpellTrait(smLevel, rowId, "content_toggle", "1");
								makeSpellTrait(smLevel, rowId, "casting_time", inferCastingTime(content));
								makeSpellTrait(smLevel, rowId, "materials", `${costStr} psi points`);
								makeSpellTrait(smLevel, rowId, "components", "COMPONENTS_M");
								makeSpellTrait(smLevel, rowId, "duration", inferDuration(content));
							});
						} else {
							const rowId = d20plus.ut.generateRowId();
							const mLevel = m.cost.min;
							const costStr = getCostStr(m.cost);
							makeSpellTrait(mLevel, rowId, "spell_level", shapedSpellLevel(mLevel));
							makeSpellTrait(mLevel, rowId, "name", m.name + (m.cost.min < m.cost.max ? ` (${costStr} psi)` : ""));
							makeSpellTrait(mLevel, rowId, "content", modeContent);
							makeSpellTrait(mLevel, rowId, "content_toggle", "1");
							makeSpellTrait(mLevel, rowId, "casting_time", inferCastingTime(modeContent));
							makeSpellTrait(mLevel, rowId, "materials", `${costStr} psi points`);
							makeSpellTrait(mLevel, rowId, "components", "COMPONENTS_M");
							if (m.concentration) {
								makeSpellTrait(mLevel, rowId, "duration", shapedConcentration(m.concentration));
								makeSpellTrait(mLevel, rowId, "concentration", "Yes");
							} else {
								makeSpellTrait(mLevel, rowId, "duration", inferDuration(modeContent));
							}
						}
					});
				} else {
					const typeStr = `**Psionic Talent**\n`;
					const talentContent = `${typeStr}\n${getCleanText(EntryRenderer.psionic.getTalentText(data, renderer))}`;
					const rowId = d20plus.ut.generateRowId();
					const level = 0;
					makeSpellTrait(level, rowId, "spell_level", shapedSpellLevel(level));
					makeSpellTrait(level, rowId, "name", data.name);
					makeSpellTrait(level, rowId, "content", talentContent);
					makeSpellTrait(level, rowId, "content_toggle", "1");
					makeSpellTrait(level, rowId, "casting_time", inferCastingTime(talentContent));
					makeSpellTrait(level, rowId, "components", "COMPONENTS_M");
					makeSpellTrait(level, rowId, "duration", inferDuration(talentContent));
				}
			} else {
				console.warn(`Psionic ability import is not supported for ${d20plus.sheet} character sheet`);
			}

			attrs.notifySheetWorkers();
		}

		function importItem (character, data, event) {
			if (d20plus.sheet == "ogl") {
				if (data.data._versatile) {
					setTimeout(() => {
						const rowId = d20plus.ut.generateRowId();

						function makeItemTrait (key, val) {
							const toSave = character.model.attribs.create({
								name: `repeating_attack_${rowId}_${key}`,
								current: val
							}).save();
							toSave.save();
						}

						const attr = (data.data["Item Type"] || "").includes("Melee") ? "strength" : "dexterity";
						const attrTag = `@{${attr}_mod}`;

						const proficiencyBonus = character.model.attribs.toJSON().find(it => it.name.includes("pb"));
						const attrToFind = character.model.attribs.toJSON().find(it => it.name === attr);
						const attrBonus = attrToFind ? Parser.getAbilityModNumber(Number(attrToFind.current)) : 0;

						// This links the item to the attack, and vice-versa.
						// Unfortunately, it doesn't work,
						//   because Roll20 thinks items<->attacks is a 1-to-1 relationship.
						/*
						let lastItemId = null;
						try {
							const items = character.model.attribs.toJSON().filter(it => it.name.includes("repeating_inventory"));
							const lastItem = items[items.length - 1];
							lastItemId = lastItem.name.replace(/repeating_inventory_/, "").split("_")[0];

							// link the inventory item to this attack
							const toSave = character.model.attribs.create({
								name: `repeating_inventory_${lastItemId}_itemattackid`,
								current: rowId
							});
							toSave.save();
						} catch (ex) {
							console.error("Failed to get last item ID");
							console.error(ex);
						}

						if (lastItemId) {
							makeItemTrait("itemid", lastItemId);
						}
						*/

						makeItemTrait("options-flag", "0");
						makeItemTrait("atkname", data.name);
						makeItemTrait("dmgbase", data.data._versatile);
						makeItemTrait("dmgtype", data.data["Damage Type"]);
						makeItemTrait("atkattr_base", attrTag);
						makeItemTrait("dmgattr", attrTag);
						makeItemTrait("rollbase_dmg", `@{wtype}&{template:dmg} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[${data.data._versatile}+${attrBonus}]]}} {{dmg1type=${data.data["Damage Type"]} }} @{dmg2flag} {{dmg2=[[0]]}} {{dmg2type=}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=[[0]]}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}`);
						makeItemTrait("rollbase_crit", `@{wtype}&{template:dmg} {{crit=1}} {{rname=@{atkname}}} @{atkflag} {{range=@{atkrange}}} @{dmgflag} {{dmg1=[[${data.data._versatile}+${attrBonus}]]}} {{dmg1type=${data.data["Damage Type"]} }} @{dmg2flag} {{dmg2=[[0]]}} {{dmg2type=}} {{crit1=[[${data.data._versatile}]]}} {{crit2=[[0]]}} @{saveflag} {{desc=@{atk_desc}}} @{hldmg}  {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globaldamage=[[0]]}} {{globaldamagecrit=[[0]]}} {{globaldamagetype=@{global_damage_mod_type}}} @{charname_output}`);
						if (proficiencyBonus) {
							makeItemTrait("atkbonus", `+${Number(proficiencyBonus.current) + attrBonus}`);
						}
						makeItemTrait("atkdmgtype", `${data.data._versatile}${attrBonus > 0 ? `+${attrBonus}` : attrBonus < 0 ? attrBonus : ""} ${data.data["Damage Type"]}`);
						makeItemTrait("rollbase", "@{wtype}&{template:atk} {{mod=@{atkbonus}}} {{rname=[@{atkname}](~repeating_attack_attack_dmg)}} {{rnamec=[@{atkname}](~repeating_attack_attack_crit)}} {{r1=[[@{d20}cs>@{atkcritrange} + 2[PROF]]]}} @{rtype}cs>@{atkcritrange} + 2[PROF]]]}} {{range=@{atkrange}}} {{desc=@{atk_desc}}} {{spelllevel=@{spelllevel}}} {{innate=@{spell_innate}}} {{globalattack=@{global_attack_mod}}} ammo=@{ammo} @{charname_output}");
					}, 350); // defer this, so we can hopefully pull item ID
				}

				// for packs, etc
				if (data._subItems) {
					const queue = [];
					data._subItems.forEach(si => {
						function makeProp (rowId, propName, content) {
							character.model.attribs.create({
								"name": `repeating_inventory_${rowId}_${propName}`,
								"current": content
							}).save();
						}

						if (si.count) {
							const rowId = d20plus.ut.generateRowId();
							const siD = typeof si.subItem === "string" ? JSON.parse(si.subItem) : si.subItem;

							makeProp(rowId, "itemname", siD.name);
							const w = (siD.data || {}).Weight;
							if (w) makeProp(rowId, "itemweight", w);
							makeProp(rowId, "itemcontent", Object.entries(siD.data).map(([k, v]) => `${k}: ${v}`).join(", "));
							makeProp(rowId, "itemcount", String(si.count));

						} else {
							queue.push(si.subItem);
						}
					});

					const interval = d20plus.cfg.getCfgVal("import", "importIntervalHandout") || d20plus.cfg.getCfgDefaultVal("import", "importIntervalHandout");
					queue.map(it => typeof it === "string" ? JSON.parse(it) : it).forEach((item, ix) => {
						setTimeout(() => {
							d20plus.importer.doFakeDrop(event, character, item, null);
						}, (ix + 1) * interval);
					});

					return;
				}
			}

			// Fallback to native drag-n-drop
			d20plus.importer.doFakeDrop(event, character, data, null);
		}

		function importData (character, data, event) {
			// TODO remove feature import workarounds below when roll20 and sheets supports their drag-n-drop properly
			if (data.data.Category === "Feats") {
				importFeat(character, data);
			} else if (data.data.Category === "Backgrounds") {
				importBackground(character, data);
			} else if (data.data.Category === "Races") {
				importRace(character, data);
			} else if (data.data.Category === "Optional Features") {
				importOptionalFeature(character, data);
			} else if (data.data.Category === "Classes") {
				importClass(character, data);
			} else if (data.data.Category === "Subclasses") {
				importSubclass(character, data);
			} else if (data.data.Category === "Psionics") {
				importPsionicAbility(character, data);
			} else if (data.data.Category === "Items") {
				importItem(character, data, event);
			} else {
				d20plus.importer.doFakeDrop(event, character, data, null);
			}
		}

		d20.Campaign.characters.models.each(function (v, i) {
			v.view.rebindCompendiumDropTargets = function () {
				// ready character sheet for draggable
				$(".sheet-compendium-drop-target").each(function () {
					$(this).droppable({
						hoverClass: "dropping",
						tolerance: "pointer",
						activeClass: "active-drop-target",
						accept: ".compendium-item",
						drop: function (t, i) {
							var characterid = $(".characterdialog").has(t.target).attr("data-characterid");
							var character = d20.Campaign.characters.get(characterid).view;
							var inputData;
							const $hlpr = $(i.helper[0]);

							if ($hlpr.hasClass("handout")) {
								console.log("Handout item dropped onto target!");
								t.originalEvent.dropHandled = !0;

								if ($hlpr.hasClass(`player-imported`)) {
									const data = d20plus.importer.retreivePlayerImport($hlpr.attr("data-playerimportid"));
									importData(character, data, t);
								} else {
									var id = $hlpr.attr("data-itemid");
									var handout = d20.Campaign.handouts.get(id);
									console.log(character);
									var data = "";
									if (window.is_gm) {
										handout._getLatestBlob("gmnotes", function (gmnotes) {
											data = gmnotes;
											handout.updateBlobs({gmnotes: gmnotes});
											importData(character, JSON.parse(data), t);
										});
									} else {
										handout._getLatestBlob("notes", function (notes) {
											data = $(notes).filter("del").html();
											importData(character, JSON.parse(data), t);
										});
									}
								}
							} else {
								// rename some variables...
								const e = character;
								const n = i;

								// BEGIN ROLL20 CODE
								console.log("Compendium item dropped onto target!"),
									t.originalEvent.dropHandled = !0,
									window.wantsToReceiveDrop(this, t, function() {
										var i = $(n.helper[0]).attr("data-pagename");
										console.log(d20.compendium.compendiumBase + "compendium/" + COMPENDIUM_BOOK_NAME + "/" + i + ".json?plaintext=true"),
											$.get(d20.compendium.compendiumBase + "compendium/" + COMPENDIUM_BOOK_NAME + "/" + i + ".json?plaintext=true", function(n) {
												var o = _.clone(n.data);
												o.Name = n.name,
													o.data = JSON.stringify(n.data),
													o.uniqueName = i,
													o.Content = n.content,
													$(t.target).find("*[accept]").each(function() {
														var t = $(this)
															, n = t.attr("accept");
														o[n] && ("input" === t[0].tagName.toLowerCase() && "checkbox" === t.attr("type") ? t.val() == o[n] ? t.prop("checked", !0) : t.prop("checked", !1) : "input" === t[0].tagName.toLowerCase() && "radio" === t.attr("type") ? t.val() == o[n] ? t.prop("checked", !0) : t.prop("checked", !1) : "select" === t[0].tagName.toLowerCase() ? t.find("option").each(function() {
															var e = $(this);
															e.val() !== o[n] && e.text() !== o[n] || e.prop("selected", !0)
														}) : $(this).val(o[n]),
															e.saveSheetValues(this))
													})
											})
									});
								// END ROLL20 CODE
							}
						}
					});
				});
			};
		});
	};

	d20plus.getProfBonusFromLevel = function (level) {
		if (level < 5) return "2";
		if (level < 9) return "3";
		if (level < 13) return "4";
		if (level < 17) return "5";
		return "6";
	};

	// Import dialog showing names of monsters failed to import
	d20plus.addImportError = function (name) {
		var $span = $("#import-errors");
		if ($span.text() == "0") {
			$span.text(name);
		} else {
			$span.text($span.text() + ", " + name);
		}
	};

	// Get NPC size from chr
	d20plus.getSizeString = function (chr) {
		const result = Parser.sizeAbvToFull(chr);
		return result ? result : "(Unknown Size)";
	};

	// Create editable HP variable and autocalculate + or -
	d20plus.hpAllowEdit = function () {
		$("#initiativewindow").on(window.mousedowntype, ".hp.editable", function () {
			if ($(this).find("input").length > 0) return void $(this).find("input").focus();
			var val = $.trim($(this).text());
			const $span = $(this);
			$span.html(`<input type='text' value='${val}'/>`);
			const $ipt = $(this).find("input");
			$ipt[0].focus();
		});
		$("#initiativewindow").on("keydown", ".hp.editable", function (event) {
			if (event.which == 13) {
				const $span = $(this);
				const $ipt = $span.find("input");
				if (!$ipt.length) return;

				var el, token, id, char, hp,
					val = $.trim($ipt.val());

				// roll20 token modification supports plus/minus for a single integer; mimic this
				const m = /^((\d+)?([+-]))?(\d+)$/.exec(val);
				if (m) {
					let op = null;
					if (m[3]) {
						op = m[3] === "+" ? "ADD" : "SUB";
					}
					const base = m[2] ? eval(m[0]) : null;
					const mod = Number(m[4]);

					el = $(this).parents("li.token");
					id = el.data("tokenid");
					token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(id);
					char = token.character;

					npc = char.attribs ? char.attribs.find(function (a) {
						return a.get("name").toLowerCase() === "npc";
					}) : null;
					let total;
					// char.attribs doesn't exist for generico tokens, in this case stick stuff in an appropriate bar
					if (!char.attribs || npc && npc.get("current") == "1") {
						const hpBar = d20plus.getCfgHpBarNumber();
						if (hpBar) {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								const curr = token.attributes[`bar${hpBar}_value`];
								if (op === "ADD") total = curr + mod;
								else total = curr - mod;
							} else {
								total = mod;
							}
							token.attributes[`bar${hpBar}_value`] = total;
						}
					} else {
						hp = char.attribs.find(function (a) {
							return a.get("name").toLowerCase() === "hp";
						});
						if (hp) {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = hp.attributes.current + mod;
								else total = hp.attributes.current - mod;
							} else {
								total = mod;
							}
							hp.syncedSave({current: total});
						} else {
							total;
							if (base !== null) {
								total = base;
							} else if (op) {
								if (op === "ADD") total = mod;
								else total = 0 - mod;
							} else {
								total = mod;
							}
							char.attribs.create({name: "hp", current: total});
						}
					}
					// convert the field back to text
					$span.html(total);
				}
				d20.Campaign.initiativewindow.rebuildInitiativeList();
			}
		});
	};

// Change character sheet formulas
	d20plus.setSheet = function () {
		d20plus.sheet = "ogl";
		if (window.is_gm && (!d20.journal.customSheets || !d20.journal.customSheets)) {
			d20.textchat.incoming(false, ({
				who: "system",
				type: "system",
				content: `<span style="color: red;">5etoolsR20: no character sheet selected! Exiting...</span>`
			}));
			throw new Error("No character sheet selected!");
		}
		if (d20.journal.customSheets.layouthtml.indexOf("shaped_d20") > 0) d20plus.sheet = "shaped";
		if (d20.journal.customSheets.layouthtml.indexOf("DnD5e_Character_Sheet") > 0) d20plus.sheet = "community";
		d20plus.ut.log("Switched Character Sheet Template to " + d20plus.sheet);
	};

	// Return Initiative Tracker template with formulas
	d20plus.initErrorHandler = null;
	d20plus.setTurnOrderTemplate = function () {
		if (!d20plus.turnOrderCachedFunction) {
			d20plus.turnOrderCachedFunction = d20.Campaign.initiativewindow.rebuildInitiativeList;
			d20plus.turnOrderCachedTemplate = $("#tmpl_initiativecharacter").clone();
		}

		d20.Campaign.initiativewindow.rebuildInitiativeList = function () {
			var html = d20plus.initiativeTemplate;
			var columnsAdded = [];
			$(".tracker-header-extra-columns").empty();

			const cols = [
				d20plus.cfg.getCfgVal("interface", "trackerCol1"),
				d20plus.cfg.getCfgVal("interface", "trackerCol2"),
				d20plus.cfg.getCfgVal("interface", "trackerCol3")
			];

			const headerStack = [];
			const replaceStack = [
				// this is hidden by CSS
				`<span class='cr' alt='CR' title='CR'>
					<$ if(npc && npc.get("current") == "1") { $>
						<$ var crAttr = char.attribs.find(function(e) { return e.get("name").toLowerCase() === "npc_challenge" }); $>
						<$ if(crAttr) { $>
							<$!crAttr.get("current")$>
						<$ } $>
					<$ } $>
				</span>`
			];
			cols.forEach((c, i) => {
				switch (c) {
					case "HP": {
						const hpBar = d20plus.getCfgHpBarNumber();
						replaceStack.push(`
							<span class='hp editable tracker-col' alt='HP' title='HP'>
								<$ if(npc && npc.get("current") == "1") { $>
									${hpBar ? `<$!token.attributes.bar${hpBar}_value$>` : ""}
								<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].hp}')$>
								<$ } else { $>
									<$!"\u2014"$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>HP</span>`);
						break;
					}
					case "AC": {
						replaceStack.push(`
							<span class='ac tracker-col' alt='AC' title='AC'>
								<$ if(npc && npc.get("current") == "1" && typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].npcac}')$>
								<$ } else if (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") { $>
									<$!char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].ac}')$>
								<$ } else { $>
									<$!"\u2014"$>
								<$ } $>
							</span>
						`);
						headerStack.push(`<span class='tracker-col'>AC</span>`);
						break;
					}
					case "Passive Perception": {
						replaceStack.push(`
							<$ var passive = (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") ? (char.autoCalcFormula('@{passive}') || char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].pp}')) : "\u2014"; $>
							<span class='pp tracker-col' alt='Passive Perception' title='Passive Perception'><$!passive$></span>							
						`);
						headerStack.push(`<span class='tracker-col'>PP</span>`);
						break;
					}
					case "Spell DC": {
						replaceStack.push(`
							<$ var dc = (typeof char !== "undefined" && char && typeof char.autoCalcFormula !== "undefined") ? (char.autoCalcFormula('${d20plus.formulas[d20plus.sheet].spellDc}')) : "\u2014"; $>
							<span class='dc tracker-col' alt='Spell DC' title='Spell DC'><$!dc$></span>
						`);
						headerStack.push(`<span class='tracker-col'>DC</span>`);
						break;
					}
					default: {
						replaceStack.push(`<span class="tracker-col"/>`);
						headerStack.push(`<span class="tracker-col"/>`);
					}
				}
			});

			console.log("use custom tracker val was ", d20plus.cfg.getCfgVal("interface", "customTracker"))
			if (d20plus.cfg.getCfgVal("interface", "customTracker")) {
				$(`.init-header`).show();
				if (d20plus.cfg.getCfgVal("interface", "trackerSheetButton")) {
					$(`.init-sheet-header`).show();
				} else {
					$(`.init-sheet-header`).hide();
				}
				$(`.init-init-header`).show();
				const $header = $(".tracker-header-extra-columns");
				// prepend/reverse used since tracker gets populated in right-to-left order
				headerStack.forEach(h => $header.prepend(h))
				html = html.replace(`<!--5ETOOLS_REPLACE_TARGET-->`, replaceStack.reverse().join(" \n"));
			} else {
				$(`.init-header`).hide();
				$(`.init-sheet-header`).hide();
				$(`.init-init-header`).hide();
			}

			$("#tmpl_initiativecharacter").replaceWith(html);

			// Hack to catch errors, part 1
			const startTime = (new Date).getTime();

			var results = d20plus.turnOrderCachedFunction.apply(this, []);
			setTimeout(function () {
				$(".initmacrobutton").unbind("click");
				$(".initmacrobutton").bind("click", function () {
					console.log("Macro button clicked");
					tokenid = $(this).parent().parent().data("tokenid");
					var token, char;
					var page = d20.Campaign.activePage();
					if (page) token = page.thegraphics.get(tokenid);
					if (token) char = token.character;
					if (char) {
						char.view.showDialog();
						// d20.textchat.doChatInput(`%{` + char.id + `|` + d20plus.formulas[d20plus.sheet]["macro"] + `}`)
					}
				});

				d20plus.bindTokens();
			}, 100);

			// Hack to catch errors, part 2
			if (d20plus.initErrorHandler) {
				window.removeEventListener("error", d20plus.initErrorHandler);
			}
			d20plus.initErrorHandler = function (event) {
				// if we see an error within 250 msec of trying to override the initiative window...
				if (((new Date).getTime() - startTime) < 250) {
					d20plus.ut.log("ERROR: failed to populate custom initiative tracker, restoring default...");
					// restore the default functionality
					$("#tmpl_initiativecharacter").replaceWith(d20plus.turnOrderCachedTemplate);
					return d20plus.turnOrderCachedFunction();
				}
			};
			window.addEventListener("error", d20plus.initErrorHandler);
			return results;
		};

		const getTargetWidth = () => d20plus.cfg.getCfgVal("interface", "minifyTracker") ? 250 : 350;
		// wider tracker
		const cachedDialog = d20.Campaign.initiativewindow.$el.dialog;
		d20.Campaign.initiativewindow.$el.dialog = (...args) => {
			const widen = d20plus.cfg.getCfgVal("interface", "customTracker");
			if (widen && args[0] && args[0].width) {
				args[0].width = getTargetWidth();
			}
			cachedDialog.bind(d20.Campaign.initiativewindow.$el)(...args);
		};

		// if the tracker is already open, widen it
		if (d20.Campaign.initiativewindow.model.attributes.initiativepage) d20.Campaign.initiativewindow.$el.dialog("option", "width", getTargetWidth());
	};

	d20plus.spells.formSpellUrl = function (fileName) {
		return d20plus.formSrcUrl(SPELL_DATA_DIR, fileName);
	};

	d20plus.spells._groupOptions = ["Level", "Spell Points", "Alphabetical", "Source"];
	d20plus.spells._listCols = ["name", "class", "level", "source"];
	d20plus.spells._listItemBuilder = (it) => `
		<span class="name col-4" title="name">${it.name}</span>
		<span class="class col-3" title="class">${it.classes.fromClassList.map(c => `CLS[${c.name}]`).join(", ")}</span>
		<span class="level col-3" title="level">LVL[${Parser.spLevelToFull(it.level)}]</span>
		<span title="source (Full: ${Parser.sourceJsonToFull(it.source)})" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.spells._listIndexConverter = (sp) => {
		return {
			name: sp.name.toLowerCase(),
			class: sp.classes.fromClassList.map(c => c.name.toLowerCase()),
			level: Parser.spLevelToFull(sp.level).toLowerCase(),
			source: Parser.sourceJsonToAbv(sp.source).toLowerCase()
		};
	};
	// Import Spells button was clicked
	d20plus.spells.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-spell-url-player").val() : $("#import-spell-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.spells.playerImportBuilder : d20plus.spells.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"spell",
					data.spell,
					handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.spells._listItemBuilder,
						listIndex: d20plus.spells._listCols,
						listIndexConverter: d20plus.spells._listIndexConverter
					}
				);
			});
		}
	};

	// Import All Spells button was clicked
	d20plus.spells.buttonAll = function (forcePlayer) {
		const toLoad = Object.keys(spellDataUrls).filter(src => !SourceUtil.isNonstandardSource(src)).map(src => d20plus.spells.formSpellUrl(spellDataUrls[src]));

		if (toLoad.length) {
			const handoutBuilder = !forcePlayer && window.is_gm ? d20plus.spells.handoutBuilder : d20plus.spells.playerImportBuilder;

			DataUtil.multiLoadJSON(toLoad.map(url => ({url: url})), () => {
			}, (dataStack) => {
				let toAdd = [];
				dataStack.forEach(d => toAdd = toAdd.concat(d.spell));
				d20plus.importer.showImportList(
					"spell",
					toAdd,
					handoutBuilder,
					{
						groupOptions: d20plus.spells._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.spells._listItemBuilder,
						listIndex: d20plus.spells._listCols,
						listIndexConverter: d20plus.spells._listIndexConverter
					}
				);
			});
		}
	};

	// Create spell handout from js data object
	d20plus.spells.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo, builderOptions) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Spells`, folderName);
		const path = ["Spells", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		// build spell handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.spSchoolAbvToFull(data.school),
				Parser.spLevelToFull(data.level),
				...data.classes.fromClassList.map(c => c.name),
				Parser.sourceJsonToFull(data.source)
			], "spell")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_SPELLS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data, builderOptions);

				console.log(notecontents);
				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.spells.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.spells._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.spells._getHandoutData = function (data, builderOptions) {
		builderOptions = builderOptions || {};
		// merge in roll20 metadata, if available
		const spellMeta = spellMetaData.spell.find(sp => sp.name.toLowerCase() === data.name.toLowerCase() && sp.source.toLowerCase() === data.source.toLowerCase());
		if (spellMeta) {
			data.roll20 = spellMeta.data;
		}

		if (!data.school) data.school = "A";
		if (!data.range) data.range = "Self";
		if (!data.duration) data.duration = "Instantaneous";
		if (!data.components) data.components = "";
		if (!data.time) data.components = "1 action";

		const r20Data = {};
		if (data.roll20) Object.assign(r20Data, data.roll20);
		Object.assign(
			r20Data,
			{
				"Level": builderOptions.isSpellPoints ? String(Math.min(9, d20plus.spells.spLevelToSpellPoints(data.level))) : String(data.level),
				"Range": Parser.spRangeToFull(data.range),
				"School": Parser.spSchoolAbvToFull(data.school),
				"Source": "5etoolsR20",
				"Classes": d20plus.importer.getCleanText(Parser.spClassesToFull(data.classes)),
				"Category": "Spells",
				"Duration": Parser.spDurationToFull(data.duration),
				"Material": "",
				"Components": parseComponents(data.components),
				"Casting Time": Parser.spTimeListToFull(data.time)
			}
		);

		if (data.range.type === "point" && (data.range.distance.type === UNT_FEET || data.range.distance.type === UNT_MILES)) {
			r20Data["data-RangeNum"] = data.range.distance.amount + "";
		}

		var r20json = {
			name: data.name,
			content: "",
			htmlcontent: "",
			data: r20Data
		};
		if (data.components.m && data.components.m.length) r20json.data["Material"] = data.components.m;
		if (data.meta) {
			if (data.meta.ritual) r20json.data["Ritual"] = "Yes";
		}
		if (data.duration.filter(d => d.concentration).length > 0) {
			r20json.data["Concentration"] = "Yes";
		}
		var notecontents = "";
		var gmnotes = "";
		notecontents += `<p><h3>${data.name}</h3>
<em>${Parser.spLevelSchoolMetaToFull(data.level, data.school, data.meta)}${builderOptions.isSpellPoints && data.level ? ` (${d20plus.spells.spLevelToSpellPoints(data.level)} spell points)` : ""}</em></p><p>
<strong>Casting Time:</strong> ${Parser.spTimeListToFull(data.time)}<br>
<strong>Range:</strong> ${Parser.spRangeToFull(data.range)}<br>
<strong>Components:</strong> ${Parser.spComponentsToFull(data.components)}<br>
<strong>Duration:</strong> ${Parser.spDurationToFull(data.duration)}<br>
</p>`;
		const renderer = new EntryRenderer();
		const renderStack = [];
		const entryList = {type: "entries", entries: data.entries};
		renderer.setBaseUrl(BASE_SITE_URL);
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		r20json.content = d20plus.importer.getCleanText(renderStack.join(" "));
		r20json.data["data-description"] = r20json.content;
		notecontents += renderStack.join("");
		if (data.entriesHigherLevel) {
			const hLevelRenderStack = [];
			const higherLevelsEntryList = {type: "entries", entries: data.entriesHigherLevel};
			renderer.recursiveEntryRender(higherLevelsEntryList, hLevelRenderStack, 2);
			r20json.content += "\n\nAt Higher Levels: " + d20plus.importer.getCleanText(hLevelRenderStack.join(" ").replace("At Higher Levels.", ""));
			notecontents += hLevelRenderStack.join("");
		}
		notecontents += `<p><strong>Classes:</strong> ${Parser.spClassesToFull(data.classes)}</p>`;
		gmnotes = JSON.stringify(r20json);
		notecontents += `<del class="hidden">${gmnotes}</del>`;

		return [notecontents, gmnotes];
	};

// parse spell components
	function parseComponents (components) {
		const out = [];
		if (components.v) out.push("V");
		if (components.s) out.push("S");
		if (components.m) out.push("M");
		return out.join(" ");
	}

	d20plus.items._groupOptions = ["Type", "Rarity", "Alphabetical", "Source"];
	d20plus.items._listCols = ["name", "type", "rarity", "source"];
	d20plus.items._listItemBuilder = (it) => {
		if (!it._isEnhanced) EntryRenderer.item.enhanceItem(it);

		return `
		<span class="name col-3" title="name">${it.name}</span>
		<span class="type col-5" title="type">${it.typeText.split(",").map(t => `TYP[${t.trim()}]`).join(", ")}</span>
		<span class="rarity col-2" title="rarity">RAR[${it.rarity}]</span>
		<span title="source (Full: ${Parser.sourceJsonToFull(it.source)})" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	};
	d20plus.items._listIndexConverter = (it) => {
		if (!it._isEnhanced) EntryRenderer.item.enhanceItem(it);
		return {
			name: it.name.toLowerCase(),
			type: it.typeText.toLowerCase().split(","),
			rarity: it.rarity.toLowerCase(),
			source: Parser.sourceJsonToAbv(it.source).toLowerCase()
		};
	};
// Import Items button was clicked
	d20plus.items.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-items-url-player").val() : $("#import-items-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.items.playerImportBuilder : d20plus.items.handoutBuilder;

			if (url.trim() === `${DATA_URL}items.json`) {
				EntryRenderer.item.buildList((itemList) => {
						const packNames = new Set([`burglar's pack`, `diplomat's pack`, `dungeoneer's pack`, `entertainer's pack`, `explorer's pack`, `priest's pack`, `scholar's pack`, `monster hunter's pack`]);

						const packs = itemList.filter(it => packNames.has(it.name.toLowerCase()));
						packs.forEach(p => {
							if (!p._r20SubItemData) {
								const contents = p.entries.find(it => it.type === "list").items;

								const out = [];
								contents.forEach(line => {
									if (line.includes("@item")) {
										const [pre, tag, item] = line.split(/({@item)/g);
										const tagItem = `${tag}${item}`;

										let [n, src] = item.split("}")[0].trim().split("|");
										if (!src) src = "dmg";

										n = n.toLowerCase();
										src = src.toLowerCase();


										const subItem = itemList.find(it => n === it.name.toLowerCase() && src === it.source.toLowerCase());

										let count = 1;
										pre.replace(/\d+/g, (m) => count = Number(m));

										out.push({
											type: "item",
											count,
											data: subItem
										})
									} else {
										out.push({
											type: "misc",
											data: {
												name: line.toTitleCase(),
												data: {
													Category: "Items",
													"Item Type": "Adventuring Gear"
												}
											}
										})
									}
								});

								p._r20SubItemData = out;
							}
						})

						d20plus.importer.showImportList(
							"item",
							itemList,
							handoutBuilder,
							{
								groupOptions: d20plus.items._groupOptions,
								forcePlayer,
								listItemBuilder: d20plus.items._listItemBuilder,
								listIndex: d20plus.items._listCols,
								listIndexConverter: d20plus.items._listIndexConverter
							}
						);
					},
					{
						items: `${DATA_URL}items.json`,
						basicitems: `${DATA_URL}basicitems.json`,
						magicvariants: `${DATA_URL}magicvariants.json`
					},
					true);
			} else {
				// for non-standard URLs, do a generic import
				DataUtil.loadJSON(url).then((data) => {
					d20plus.importer.addMeta(data._meta);
					d20plus.importer.showImportList(
						"item",
						data.item,
						handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							forcePlayer,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				});
			}
		}
	};

	// Import individual items
	d20plus.items.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Items`, folderName);
		const path = ["Items", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;

		if (!data._isEnhanced) EntryRenderer.item.enhanceItem(data); // for homebrew items

		// build item handout
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				`rarity ${data.rarity}`,
				...data.procType,
				Parser.sourceJsonToFull(data.source)
			], "item")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_ITEMS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

				handout.updateBlobs({notes: notecontents, gmnotes: gmnotes});
				handout.save({
					notes: (new Date).getTime(),
					inplayerjournals: inJournals
				});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.items.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.items._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.items._getHandoutData = function (data) {
		function removeDiceTags (str) {
			return str ? str.replace(/{@dice /g, "").replace(/}/g, "") : str;
		}

		var notecontents = "";
		const roll20Data = {
			name: data.name,
			data: {
				Category: "Items"
			}
		};
		const typeArray = [];
		if (data.wondrous) typeArray.push("Wondrous Item");
		if (data.technology) typeArray.push(data.technology);
		if (data.age) typeArray.push(data.age);
		if (data.weaponCategory) typeArray.push(data.weaponCategory + " Weapon");
		var type = data.type;
		if (data.type) {
			const fullType = d20plus.items.parseType(data.type);
			typeArray.push(fullType);
			roll20Data.data["Item Type"] = fullType;
		} else if (data.typeText) {
			roll20Data.data["Item Type"] = data.typeText;
		}
		var typestring = typeArray.join(", ");
		var damage = "";
		const cleanDmg1 = removeDiceTags(data.dmg1);
		const cleanDmg2 = removeDiceTags(data.dmg2);
		if (data.dmg1 && data.dmgType) damage = cleanDmg1 + " " + Parser.dmgTypeToFull(data.dmgType);
		var armorclass = "";
		if (type === "S") armorclass = "+" + data.ac;
		if (type === "LA") armorclass = data.ac + " + Dex";
		if (type === "MA") armorclass = data.ac + " + Dex (max 2)";
		if (type === "HA") armorclass = data.ac;
		var properties = "";
		if (data.property) {
			var propertieslist = data.property;
			for (var i = 0; i < propertieslist.length; i++) {
				var a = d20plus.items.parseProperty(propertieslist[i]);
				var b = propertieslist[i];
				if (b === "V") {
					a = a + " (" + cleanDmg2 + ")";
					roll20Data.data._versatile = cleanDmg2;
				}
				if (b === "T" || b === "A") a = a + " (" + data.range + "ft.)";
				if (b === "RLD") a = a + " (" + data.reload + " shots)";
				if (i > 0) a = ", " + a;
				properties += a;
			}
		}
		var reqAttune = data.reqAttune;
		var attunementstring = "";
		if (reqAttune) {
			if (reqAttune === "(Requires Attunement)") {
				attunementstring = " (Requires Attunement)";
			} else if (reqAttune === "OPTIONAL") {
				attunementstring = " (Attunement Optional)";
			} else {
				attunementstring = " (Requires Attunement " + reqAttune + ")";
			}
		}
		notecontents += `<p><h3>${data.name}</h3></p><em>${typestring}`;
		if (data.tier) notecontents += ", " + data.tier;
		var rarity = data.rarity;
		var ismagicitem = (rarity !== "None" && rarity !== "Unknown");
		if (ismagicitem) notecontents += ", " + rarity;
		if (attunementstring) notecontents += attunementstring;
		notecontents += `</em>`;
		if (damage) notecontents += `<p><strong>Damage: </strong>${damage}</p>`;
		if (properties) {
			notecontents += `<p><strong>Properties: </strong>${properties}</p>`;
			roll20Data.data.Properties = properties;
		}
		if (armorclass) {
			notecontents += `<p><strong>Armor Class: </strong>${armorclass}</p>`;
			roll20Data.data.AC = String(data.ac);
		}
		if (data.weight) {
			notecontents += `<p><strong>Weight: </strong>${data.weight} lbs.</p>`;
			roll20Data.data.Weight = String(data.weight);
		}
		var itemtext = data.entries ? data.entries : "";
		const renderer = new EntryRenderer();
		const renderStack = [];
		const entryList = {type: "entries", entries: data.entries};
		renderer.setBaseUrl(BASE_SITE_URL);
		renderer.recursiveEntryRender(entryList, renderStack, 1);
		var textstring = renderStack.join("");
		if (textstring) {
			notecontents += `<hr>`;
			notecontents += textstring;
		}

		if (data.range) {
			roll20Data.data.Range = data.range;
		}
		if (data.dmg1 && data.dmgType) {
			roll20Data.data.Damage = cleanDmg1;
			roll20Data.data["Damage Type"] = Parser.dmgTypeToFull(data.dmgType);
		}
		if (textstring.trim()) {
			roll20Data.content = d20plus.importer.getCleanText(textstring);
			roll20Data.htmlcontent = roll20Data.content;
		}
		if (data.stealth) {
			roll20Data.data.Stealth = "Disadvantage";
		}
		// roll20Data.data.Duration = "1 Minute"; // used by e.g. poison; not show in sheet
		// roll20Data.data.Save = "Constitution"; // used by e.g. poison, ball bearings; not shown in sheet
		// roll20Data.data.Target = "Each creature in a 10-foot square centered on a point within range"; // used by e.g. ball bearings; not shown in sheet
		// roll20Data.data["Item Rarity"] = "Wondrous"; // used by Iron Bands of Binding... and nothing else?; not shown in sheet
		if (data.reqAttune === "YES") {
			roll20Data.data["Requires Attunement"] = "Yes";
		} else {
			roll20Data.data["Requires Attunement"] = "No";
		}
		// TODO handle other magic versions
		// roll20Data.data.Modifiers = ... ; // this can be a variety of things, and is a comma separated list
		// some examples, that are currently handled:
		// "Ranged Attacks +3, Ranged Damage +3"
		// "Ac +2"
		// "Spell Attack +2"
		// "Saving Throws +1"
		// "AC +15, Spell Attack +2, Spell DC +2"
		// ...and some examples, that are not:
		// "Constitution +2"
		// "Strength: 21"
		if (data.modifier) {
			const allModifiers = data.modifier.filter(m => m.__text).map(m => m.__text.split(" ").map(s => s.uppercaseFirst()).join(" ")).join(", ");
			roll20Data.data.Modifiers = allModifiers;
		}

		if (data._r20SubItemData) {
			roll20Data._subItems = data._r20SubItemData.map(subItem => {
				if (subItem.type === "item") {
					const [subNote, subGm] = d20plus.items._getHandoutData(subItem.data);
					return {subItem: subGm, count: subItem.count};
				} else {
					return {subItem: subItem.data};
				}
			});
		}

		const gmnotes = JSON.stringify(roll20Data);

		return [notecontents, gmnotes];
	};

	d20plus.items.parseType = function (type) {
		const result = Parser.itemTypeToAbv(type);
		return result ? result : "n/a";
	};

	d20plus.items.parseDamageType = function (damagetype) {
		const result = Parser.dmgTypeToFull(damagetype);
		return result ? result : false;
	};

	d20plus.items.parseProperty = function (property) {
		if (property === "A") return "ammunition";
		if (property === "AF") return "ammunition";
		if (property === "BF") return "burst fire";
		if (property === "F") return "finesse";
		if (property === "H") return "heavy";
		if (property === "L") return "light";
		if (property === "LD") return "loading";
		if (property === "R") return "reach";
		if (property === "RLD") return "reload";
		if (property === "S") return "special";
		if (property === "T") return "thrown";
		if (property === "2H") return "two-handed";
		if (property === "V") return "versatile";
		return "n/a";
	};

	d20plus.psionics._groupOptions = ["Alphabetical", "Order", "Source"];
	d20plus.psionics._listCols = ["name", "order", "source"];
	d20plus.psionics._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="order col-4">ORD[${it.order || "None"}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.psionics._listIndexConverter = (p) => {
		return {
			name: p.name.toLowerCase(),
			order: (p.order || "none").toLowerCase(),
			source: Parser.sourceJsonToAbv(p.source).toLowerCase()
		};
	};
// Import Psionics button was clicked
	d20plus.psionics.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-psionics-url-player").val() : $("#import-psionics-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.psionics.playerImportBuilder : d20plus.psionics.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"psionic",
					data.psionic,
					handoutBuilder,
					{
						groupOptions: d20plus.psionics._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.psionics._listItemBuilder,
						listIndex: d20plus.psionics._listCols,
						listIndexConverter: d20plus.psionics._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.psionics.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Psionics`, folderName);
		const path = ["Psionics", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.psiTypeToFull(data.type),
				data.order || "orderless",
				Parser.sourceJsonToFull(data.source)
				], "psionic")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_PSIONICS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.psionics._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.psionics.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.psionics._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.psionics._getHandoutData = function (data) {
		function renderTalent () {
			const renderStack = [];
			renderer.recursiveEntryRender(({entries: data.entries, type: "entries"}), renderStack);
			return renderStack.join(" ");
		}

		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);
		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Psionics"
			}
		};
		const gmNotes = JSON.stringify(r20json);

		const baseNoteContents = `
			<h3>${data.name}</h3>
			<p><em>${data.type === "D" ? `${data.order} ${Parser.psiTypeToFull(data.type)}` : `${Parser.psiTypeToFull(data.type)}`}</em></p>
			${data.type === "D" ? `${EntryRenderer.psionic.getDisciplineText(data, renderer)}` : `${renderTalent()}`}
			`;

		const noteContents = `${baseNoteContents}<br><del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Races button was clicked
	d20plus.races.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-races-url-player").val() : $("#import-races-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.races.playerImportBuilder : d20plus.races.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"race",
					EntryRenderer.race.mergeSubraces(data.race),
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.races.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Races`, folderName);
		const path = ["Races", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sizeAbvToFull(data.size),
				Parser.sourceJsonToFull(data.source)
			], "race")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_RACES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.races._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.races.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.races._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.races._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		// TODO
		const renderStack = [];
		const ability = utils_getAbilityData(data.ability);
		renderStack.push(`
		<h3>${data.name}</h3>
		<p>
			<strong>Ability Scores:</strong> ${ability.asText}<br>
			<strong>Size:</strong> ${Parser.sizeAbvToFull(data.size)}<br>
			<strong>Speed:</strong> ${Parser.getSpeedString(data)}<br>
		</p>
	`);
		renderer.recursiveEntryRender({entries: data.entries}, renderStack, 1);
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Races"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Feats button was clicked
	d20plus.feats.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-feats-url-player").val() : $("#import-feats-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.feats.playerImportBuilder : d20plus.feats.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"feat",
					data.feat,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.feats.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Feats`, folderName);
		const path = ["Feats", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "feat")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_FEATS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.feats._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.feats.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.feats._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.feats._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);
		const prerequisite = EntryRenderer.feat.getPrerequisiteText(data.prerequisite);
		EntryRenderer.feat.mergeAbilityIncrease(data);

		const renderStack = [];
		renderer.recursiveEntryRender({entries: data.entries}, renderStack, 2);
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"content": `${prerequisite ? `**Prerequisite**: ${prerequisite}\n\n` : ""}${$(rendered).text()}`,
			"Vetoolscontent": d20plus.importer.getCleanText(rendered),
			"htmlcontent": "",
			"data": {
				"Category": "Feats"
			}
		};
		const gmNotes = JSON.stringify(r20json);

		const baseNoteContents = `${prerequisite ? `<p><i>Prerequisite: ${prerequisite}.</i></p> ` : ""}${rendered}`;
		const noteContents = `${baseNoteContents}<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

// Import Object button was clicked
	d20plus.objects.button = function () {
		const url = $("#import-objects-url").val();
		if (url && url.trim()) {
			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"object",
					data.object,
					d20plus.objects.handoutBuilder
				);
			});
		}
	};

	d20plus.objects.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Objects`, folderName);
		const path = ["Objects", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.characters.create(
			{
				name: name,
				tags: d20plus.importer.getTagString([
					Parser.sizeAbvToFull(data.size),
					Parser.sourceJsonToFull(data.source)
				], "object")
			},
			{
			success: function (character) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OBJECTS](data)] = {name: data.name, source: data.source, type: "character", roll20Id: character.id};

				try {
					const avatar = data.tokenURL || `${IMG_URL}objects/${name}.png`;
					character.size = data.size;
					character.name = name;
					character.senses = data.senses;
					character.hp = data.hp;
					$.ajax({
						url: avatar,
						type: 'HEAD',
						error: function () {
							d20plus.importer.getSetAvatarImage(character, `${IMG_URL}blank.png`);
						},
						success: function () {
							d20plus.importer.getSetAvatarImage(character, avatar);
						}
					});
					const ac = data.ac.match(/^\d+/);
					const size = Parser.sizeAbvToFull(data.size);
					character.attribs.create({name: "npc", current: 1});
					character.attribs.create({name: "npc_toggle", current: 1});
					character.attribs.create({name: "npc_options-flag", current: 0});
					character.attribs.create({name: "wtype", current: d20plus.importer.getDesiredWhisperType()});
					character.attribs.create({name: "rtype", current: d20plus.importer.getDesiredRollType()});
					character.attribs.create({
						name: "advantagetoggle",
						current: d20plus.importer.getDesiredAdvantageToggle()
					});
					character.attribs.create({
						name: "whispertoggle",
						current: d20plus.importer.getDesiredWhisperToggle()
					});
					character.attribs.create({name: "dtype", current: d20plus.importer.getDesiredDamageType()});
					character.attribs.create({name: "npc_name", current: name});
					character.attribs.create({name: "npc_size", current: size});
					character.attribs.create({name: "type", current: data.type});
					character.attribs.create({name: "npc_type", current: `${size} ${data.type}`});
					character.attribs.create({name: "npc_ac", current: ac != null ? ac[0] : ""});
					character.attribs.create({name: "npc_actype", current: ""});
					character.attribs.create({name: "npc_hpbase", current: data.hp});
					character.attribs.create({name: "npc_hpformula", current: data.hp ? `${data.hp}d1` : ""});

					character.attribs.create({name: "npc_immunities", current: data.immune ? data.immune : ""});
					character.attribs.create({name: "damage_immunities", current: data.immune ? data.immune : ""});

					//Should only be one entry for objects
					if (data.entries != null) {
						character.attribs.create({name: "repeating_npctrait_0_name", current: name});
						character.attribs.create({name: "repeating_npctrait_0_desc", current: data.entries});
						if (d20plus.cfg.getCfgVal("token", "tokenactionsTraits")) {
							character.abilities.create({
								name: "Information: " + name,
								istokenaction: true,
								action: d20plus.actionMacroTrait(0)
							});
						}
					}

					const renderer = new EntryRenderer();
					renderer.setBaseUrl(BASE_SITE_URL);
					if (data.actionEntries) {
						data.actionEntries.forEach((e, i) => {
							const renderStack = [];
							renderer.recursiveEntryRender({entries: e.entries}, renderStack, 2);
							const actionText = d20plus.importer.getCleanText(renderStack.join(""));
							d20plus.importer.addAction(character, d20plus.importer.getCleanText(renderer.renderEntry(e.name)), actionText, i);
						});
					}

					character.view._updateSheetValues();

					if (data.entries) {
						const bio = renderer.renderEntry({type: "entries", entries: data.entries});

						setTimeout(() => {
							const fluffAs = d20plus.cfg.getCfgVal("import", "importFluffAs") || d20plus.cfg.getCfgDefaultVal("import", "importFluffAs");
							let k = fluffAs === "Bio"? "bio" : "gmnotes";
							character.updateBlobs({
								[k]: Markdown.parse(bio)
							});
							character.save({
								[k]: (new Date).getTime()
							});
						}, 500);
					}
				} catch (e) {
					d20plus.ut.log(`Error loading [${name}]`);
					d20plus.addImportError(name);
					console.log(data);
					console.log(e);
				}
				d20.journal.addItemToFolderStructure(character.id, folder.id);
			}
		});
	};

	// Import Classes button was clicked
	d20plus.classes.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-classes-url-player").val() : $("#import-classes-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.classes.playerImportBuilder : d20plus.classes.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"class",
					data.class,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	// Import All Classes button was clicked
	d20plus.classes.buttonAll = function (forcePlayer) {
		const handoutBuilder = !forcePlayer && window.is_gm ? d20plus.classes.handoutBuilder : d20plus.classes.playerImportBuilder;

		DataUtil.class.loadJSON(BASE_SITE_URL).then((data) => {
			d20plus.importer.showImportList(
				"class",
				data.class,
				handoutBuilder,
				{
					forcePlayer
				}
			);
		});
	};

	d20plus.classes.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Classes`, folderName);
		const path = ["Classes", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "class")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.classes._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});

		d20plus.classes._handleSubclasses(data, overwrite, inJournals, folderName);
	};

	d20plus.classes._handleSubclasses = function (data, overwrite, inJournals, outerFolderName, forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		// import subclasses
		if (data.subclasses) {
			const allSubclasses = (data.source && !SourceUtil.isNonstandardSource(data.source)) || !window.confirm(`${data.name} subclasses: import published/official only?`);

			const gainFeatureArray = d20plus.classes._getGainAtLevelArr(data);

			data.subclasses.forEach(sc => {
				if (!allSubclasses && !SourceUtil.isNonstandardSource(sc.source)) return;

				sc.class = data.name;
				sc.classSource = sc.classSource || data.source;
				sc._gainAtLevels = gainFeatureArray;
				if (playerMode) {
					d20plus.subclasses.playerImportBuilder(sc);
				} else {
					const folderName = d20plus.importer._getHandoutPath("subclass", sc, "Class");
					const path = [folderName];
					if (outerFolderName) path.push(sc.source || data.source); // if it wasn't None, group by source
					d20plus.subclasses.handoutBuilder(sc, overwrite, inJournals, path);
				}
			});
		}
	};

	d20plus.classes._getGainAtLevelArr = function (clazz) {
		const gainFeatureArray = [];
		outer: for (let i = 0; i < 20; i++) {
			const lvlFeatureList = clazz.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				if (feature.gainSubclassFeature) {
					gainFeatureArray.push(true);
					continue outer;
				}
			}
			gainFeatureArray.push(false);
		}
		return gainFeatureArray;
	};

	d20plus.classes.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.classes._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);

		d20plus.classes._handleSubclasses(data, false, false, null, true);
	};

	d20plus.classes._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];
		// make a copy of the data to modify
		const curClass = JSON.parse(JSON.stringify(data));
		// render the class text
		for (let i = 0; i < 20; i++) {
			const lvlFeatureList = curClass.classFeatures[i];
			for (let j = 0; j < lvlFeatureList.length; j++) {
				const feature = lvlFeatureList[j];
				renderer.recursiveEntryRender(feature, renderStack);
			}
		}
		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Classes"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	d20plus.subclasses._groupOptions = ["Class", "Alphabetical", "Source"];
	d20plus.subclasses._listCols = ["name", "class", "source"];
	d20plus.subclasses._listItemBuilder = (it) => `
		<span class="name col-6">${it.name}</span>
		<span class="class col-4">CLS[${it.class}]</span>
		<span title="${Parser.sourceJsonToFull(it.source)}" class="source col-2">SRC[${Parser.sourceJsonToAbv(it.source)}]</span>`;
	d20plus.subclasses._listIndexConverter = (sc) => {
		return {
			name: sc.name.toLowerCase(),
			class: sc.class.toLowerCase(),
			source: Parser.sourceJsonToAbv(sc.source).toLowerCase()
		};
	};
// Import Subclasses button was clicked
	d20plus.subclasses.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-subclasses-url-player").val() : $("#import-subclasses-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.subclasses.playerImportBuilder : d20plus.subclasses.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"subclass",
					data.subclass,
					handoutBuilder,
					{
						groupOptions: d20plus.subclasses._groupOptions,
						forcePlayer,
						listItemBuilder: d20plus.subclasses._listItemBuilder,
						listIndex: d20plus.subclasses._listCols,
						listIndexConverter: d20plus.subclasses._listIndexConverter
					}
				);
			});
		}
	};

	d20plus.subclasses._preloadClass = function (subclass) {
		if (!subclass.class) Promise.resolve();

		d20plus.ut.log("Preloading class...");
		return DataUtil.class.loadJSON(BASE_SITE_URL).then((data) => {
			const clazz = data.class.find(it => it.name.toLowerCase() === subclass.class.toLowerCase() && it.source.toLowerCase() === (subclass.classSource || SRC_PHB).toLowerCase());
			if (!clazz) {
				throw new Error(`Could not find class for subclass ${subclass.name}::${subclass.source} with class ${subclass.class}::${subclass.classSource || SRC_PHB}`);
			}

			const gainAtLevelArr = d20plus.classes._getGainAtLevelArr(clazz);
			subclass._gainAtLevels = gainAtLevelArr;
		});
	};

	d20plus.subclasses.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Subclasses`, folderName);
		const path = ["Sublasses", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		d20plus.subclasses._preloadClass(data).then(() => {
			const name = `${data.shortName} (${data.class})`;
			d20.Campaign.handouts.create({
				name: name,
				tags: d20plus.importer.getTagString([
					data.class,
					Parser.sourceJsonToFull(data.source)
				], "subclass")
			}, {
				success: function (handout) {
					if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_CLASSES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

					const [noteContents, gmNotes] = d20plus.subclasses._getHandoutData(data);

					handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
					handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
					d20.journal.addItemToFolderStructure(handout.id, folder.id);
				}
			});
		});
	};

	d20plus.subclasses.playerImportBuilder = function (data) {
		d20plus.subclasses._preloadClass(data).then(() => {
			const [notecontents, gmnotes] = d20plus.subclasses._getHandoutData(data);

			const importId = d20plus.ut.generateRowId();
			d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
			const name = `${data.class ? `${data.class} \u2014 ` : ""}${data.name}`;
			d20plus.importer.makePlayerDraggable(importId, name);
		});
	};

	d20plus.subclasses._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		data.subclassFeatures.forEach(lvl => {
			lvl.forEach(f => {
				renderer.recursiveEntryRender(f, renderStack);
			});
		});

		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Subclasses"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	d20plus.backgrounds.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-backgrounds-url-player").val() : $("#import-backgrounds-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.backgrounds.playerImportBuilder : d20plus.backgrounds.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"background",
					data.background,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.backgrounds.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Backgrounds`, folderName);
		const path = ["Backgrounds", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "background")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BACKGROUNDS](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.backgrounds._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.backgrounds.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.backgrounds._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.backgrounds._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		renderer.recursiveEntryRender({entries: data.entries}, renderStack, 1);

		const rendered = renderStack.join("");

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Backgrounds"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	d20plus.optionalfeatures.button = function (forcePlayer) {
		const playerMode = forcePlayer || !window.is_gm;
		const url = playerMode ? $("#import-optionalfeatures-url-player").val() : $("#import-optionalfeatures-url").val();
		if (url && url.trim()) {
			const handoutBuilder = playerMode ? d20plus.optionalfeatures.playerImportBuilder : d20plus.optionalfeatures.handoutBuilder;

			DataUtil.loadJSON(url).then((data) => {
				d20plus.importer.addMeta(data._meta);
				d20plus.importer.showImportList(
					"optionalfeature",
					data.optionalfeature,
					handoutBuilder,
					{
						forcePlayer
					}
				);
			});
		}
	};

	d20plus.optionalfeatures.handoutBuilder = function (data, overwrite, inJournals, folderName, saveIdsTo) {
		// make dir
		const folder = d20plus.importer.makeDirTree(`Optional Features`, folderName);
		const path = ["Optional Features", folderName, data.name];

		// handle duplicates/overwrites
		if (!d20plus.importer._checkHandleDuplicate(path, overwrite)) return;

		const name = data.name;
		d20.Campaign.handouts.create({
			name: name,
			tags: d20plus.importer.getTagString([
				Parser.sourceJsonToFull(data.source)
			], "optionalfeature")
		}, {
			success: function (handout) {
				if (saveIdsTo) saveIdsTo[UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_OPT_FEATURES](data)] = {name: data.name, source: data.source, type: "handout", roll20Id: handout.id};

				const [noteContents, gmNotes] = d20plus.optionalfeatures._getHandoutData(data);

				handout.updateBlobs({notes: noteContents, gmnotes: gmNotes});
				handout.save({notes: (new Date).getTime(), inplayerjournals: inJournals});
				d20.journal.addItemToFolderStructure(handout.id, folder.id);
			}
		});
	};

	d20plus.optionalfeatures.playerImportBuilder = function (data) {
		const [notecontents, gmnotes] = d20plus.optionalfeatures._getHandoutData(data);

		const importId = d20plus.ut.generateRowId();
		d20plus.importer.storePlayerImport(importId, JSON.parse(gmnotes));
		d20plus.importer.makePlayerDraggable(importId, data.name);
	};

	d20plus.optionalfeatures._getHandoutData = function (data) {
		const renderer = new EntryRenderer();
		renderer.setBaseUrl(BASE_SITE_URL);

		const renderStack = [];

		renderer.recursiveEntryRender({entries: data.entries}, renderStack, 1);

		const rendered = renderStack.join("");
		const prereqs = EntryRenderer.optionalfeature.getPrerequisiteText(data.prerequisites);

		const r20json = {
			"name": data.name,
			"Vetoolscontent": data,
			"data": {
				"Category": "Optional Features"
			}
		};
		const gmNotes = JSON.stringify(r20json);
		const noteContents = `${prereqs ? `<p><i>Prerequisite: ${prereqs}.</i></p>` : ""}${rendered}\n\n<del class="hidden">${gmNotes}</del>`;

		return [noteContents, gmNotes];
	};

	// Import Adventures button was clicked
	d20plus.adventures.button = function () {
		const url = $("#import-adventures-url").val();
		if (url !== null) d20plus.adventures.load(url);
	};

	d20plus.spells.spLevelToSpellPoints = function (level) {
		switch (level) {
			case 1:
				return 2;
			case 2:
				return 3;
			case 3:
				return 5;
			case 4:
				return 6;
			case 5:
				return 7;
			case 6:
				return 8;
			case 7:
				return 10;
			case 8:
				return 11;
			case 9:
				return 13;
			case 0:
			default:
				return 0;
		}
	};

	// Fetch adventure data from file
	d20plus.adventures.load = function (url) {
		$("a.ui-tabs-anchor[href='#journal']").trigger("click");
		$.ajax({
			type: "GET",
			url: url,
			dataType: "text",
			success: function (data) {
				data = JSON.parse(data);

				function isPart (e) {
					return typeof e === "string" || typeof e === "object" && (e.type !== "entries");
				}

				// open progress window
				$("#d20plus-import").dialog("open");
				$("#import-remaining").text("Initialising...");

				// get metadata
				const adMeta = adventureMetadata.adventure.find(a => a.id.toLowerCase() === $("#import-adventures-url").data("id").toLowerCase())

				const addQueue = [];
				const sections = JSON.parse(JSON.stringify(data.data));
				const adDir = `${Parser.sourceJsonToFull(adMeta.id)}`;
				sections.forEach((s, i) => {
					if (i >= adMeta.contents.length) return;

					const chapterDir = [adDir, adMeta.contents[i].name];

					const introEntries = [];
					if (s.entries && s.entries.length && isPart(s.entries[0])) {
						while (isPart(s.entries[0])) {
							introEntries.push(s.entries[0]);
							s.entries.shift();
						}
					}
					addQueue.push({
						dir: chapterDir,
						type: "entries",
						name: s.name,
						entries: introEntries,
					});

					// compact entries into layers
					front = null;
					let tempStack = [];
					let textIndex = 1;
					while ((front = s.entries.shift())) {
						if (isPart(front)) {
							tempStack.push(front);
						} else {
							if (tempStack.length) {
								addQueue.push({
									dir: chapterDir,
									type: "entries",
									name: `Text ${textIndex++}`,
									entries: tempStack
								});
								tempStack = [];
							}
							front.dir = chapterDir;
							addQueue.push(front);
						}
					}
				});

				const renderer = new EntryRenderer();
				renderer.setBaseUrl(BASE_SITE_URL);

				const $stsName = $("#import-name");
				const $stsRemain = $("#import-remaining");
				const interval = d20plus.cfg.getCfgVal("import", "importIntervalHandout") || d20plus.cfg.getCfgDefaultVal("import", "importIntervalHandout");

				////////////////////////////////////////////////////////////////////////////////////////////////////////
				EntryRenderer.getDefaultRenderer().setBaseUrl(BASE_SITE_URL);
				// pre-import tags
				const tags = {};
				renderer.doExportTags(tags);
				addQueue.forEach(entry => {
					renderer.recursiveEntryRender(entry, []);
				});

				// storage for returned handout/character IDs
				const RETURNED_IDS = {};

				// monsters
				const preMonsters = Object.keys(tags)
					.filter(k => tags[k].page === "bestiary.html")
					.map(k => tags[k]);
				if (confirm("Import creatures from this adventure?")) doPreImport(preMonsters, showMonsterImport);
				else doItemImport();

				function showMonsterImport (toImport) {
					d20plus.ut.log(`Displaying monster import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"monster",
						toImport.filter(it => it),
						d20plus.monsters.handoutBuilder,
						{
							groupOptions: d20plus.monsters._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doItemImport,
							listItemBuilder: d20plus.monsters._listItemBuilder,
							listIndex: d20plus.monsters._listCols,
							listIndexConverter: d20plus.monsters._listIndexConverter
						}
					);
				}

				// items
				function doItemImport () {
					const preItems = Object.keys(tags)
						.filter(k => tags[k].page === "items.html")
						.map(k => tags[k]);
					if (confirm("Import items from this adventure?")) doPreImport(preItems, showItemImport);
					else doMainImport();
				}

				function showItemImport (toImport) {
					d20plus.ut.log(`Displaying item import list for [${adMeta.name}]`);
					d20plus.importer.showImportList(
						"item",
						toImport.filter(it => it),
						d20plus.items.handoutBuilder,
						{
							groupOptions: d20plus.items._groupOptions,
							saveIdsTo: RETURNED_IDS,
							callback: doMainImport,
							listItemBuilder: d20plus.items._listItemBuilder,
							listIndex: d20plus.items._listCols,
							listIndexConverter: d20plus.items._listIndexConverter
						}
					);
				}

				function doPreImport (asTags, callback) {
					const tmp = [];
					let cachedCount = asTags.length;
					asTags.forEach(it => {
						try {
							EntryRenderer.hover._doFillThenCall(
								it.page,
								it.source,
								it.hash,
								() => {
									tmp.push(EntryRenderer.hover._getFromCache(it.page, it.source, it.hash));
									cachedCount--;
									if (cachedCount <= 0) callback(tmp);
								}
							);
						} catch (x) {
							console.log(x);
							cachedCount--;
							if (cachedCount <= 0) callback(tmp);
						}
					});
				}
				////////////////////////////////////////////////////////////////////////////////////////////////////////
				function doMainImport () {
					// pass in any created handouts/characters to use for links in the renderer
					renderer.setRoll20Ids(RETURNED_IDS);

					let cancelWorker = false;
					const $btnCancel = $(`#importcancel`);
					$btnCancel.off("click");
					$btnCancel.on("click", () => {
						cancelWorker = true;
					});

					let remaining = addQueue.length;

					d20plus.ut.log(`Running import of [${adMeta.name}] with ${interval} ms delay between each handout create`);
					let lastId = null;
					let lastName = null;

					const worker = setInterval(() => {
						if (!addQueue.length || cancelWorker) {
							clearInterval(worker);
							$stsName.text("DONE!");
							$stsRemain.text("0");
							d20plus.ut.log(`Finished import of [${adMeta.name}]`);
							renderer.resetRoll20Ids();
							return;
						}

						// pull items out the queue in LIFO order, for journal ordering (last created will be at the top)
						const entry = addQueue.pop();
						entry.name = entry.name || "(Unknown)";
						entry.name = d20plus.importer.getCleanText(renderer.renderEntry(entry.name));
						$stsName.text(entry.name);
						$stsRemain.text(remaining--);
						const folder = d20plus.importer.makeDirTree(entry.dir);

						d20.Campaign.handouts.create({
							name: entry.name
						}, {
							success: function (handout) {
								const renderStack = [];
								renderer.recursiveEntryRender(entry, renderStack);
								if (lastId && lastName) renderStack.push(`<br><p>Next handout: <a href="http://journal.roll20.net/handout/${lastId}">${lastName}</a></p>`);
								const rendered = renderStack.join("");

								lastId = handout.id;
								lastName = entry.name;
								handout.updateBlobs({notes: rendered});
								handout.save({notes: (new Date).getTime(), inplayerjournals: ""});
								d20.journal.addItemToFolderStructure(handout.id, folder.id);
							}
						});
					}, interval);
				}
			}
		});
	};

	d20plus.miniInitStyle = `
	#initiativewindow button.initmacrobutton {
		padding: 1px 4px;
	}

	#initiativewindow input {
		font-size: 8px;
	}

	#initiativewindow ul li span.name {
		font-size: 13px;
		padding-top: 0;
		padding-left: 4px;
		margin-top: -3px;
	}

	#initiativewindow ul li img {
		min-height: 15px;
		max-height: 15px;
	}

	#initiativewindow ul li {
		min-height: 15px;
	}

	#initiativewindow div.header span.initiative,
	#initiativewindow ul li span.initiative,
	#initiativewindow ul li span.tracker-col,
	#initiativewindow div.header span.tracker-col,
	#initiativewindow div.header span.initmacro,
	#initiativewindow ul li span.initmacro {
		font-size: 10px;
		font-weight: bold;
		text-align: right;
		float: right;
		padding: 0 5px;
		width: 7%;
		min-height: 20px;
		display: block;
		overflow: hidden;
	}

	#initiativewindow ul li .controls {
		padding: 0 3px;
	}
`;

	d20plus.setInitiativeShrink = function (doShrink) {
		const customStyle = $(`#dynamicStyle`);
		if (doShrink) {
			customStyle.html(d20plus.miniInitStyle);
		} else {
			customStyle.html("");
		}
	};

	d20plus.difficultyHtml = `<span class="difficulty" style="position: absolute"></span>`;

	d20plus.multipliers = [1, 1.5, 2, 2.5, 3, 4, 5];

	d20plus.playerImportHtml = `<div id="d20plus-playerimport" title="Temporary Import">
	<div class="append-target">
		<!-- populate with js -->
	</div>
	<div class="append-list-journal" style="max-height: 400px; overflow-y: auto;">
		<!-- populate with js -->		
	</div>
	<p><i>Player-imported items are temporary, as players can't make handouts. GMs may also use this functionality to avoid cluttering the journal. Once imported, items can be drag-dropped to character sheets.</i></p>
	</div>`;

	d20plus.importListHTML = `<div id="d20plus-importlist" title="Import..." style="width: 1000px;">
<p style="display: flex">
	<button type="button" id="importlist-selectall" class="btn" style="margin: 0 2px;"><span>Select All</span></button>
	<button type="button" id="importlist-deselectall" class="btn" style="margin: 0 2px;"><span>Deselect All</span></button>
	<button type="button" id="importlist-selectvis" class="btn" style="margin: 0 2px;"><span>Select Visible</span></button>
	<button type="button" id="importlist-deselectvis" class="btn" style="margin: 0 2px;"><span>Deselect Visible</span></button>
	<span style="width:1px;background: #bbb;height: 26px;margin: 2px;"></span>
	<button type="button" id="importlist-selectall-published" class="btn" style="margin: 0 2px;"><span>Select All Published</span></button>
</p>
<p>
<span id="import-list">
	<input class="search" autocomplete="off" placeholder="Search list...">
	<input type="search" id="import-list-filter" class="filter" placeholder="Filter...">
	<span id ="import-list-filter-help" title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM' -- hover over the columns to see the filterable name." style="cursor: help;">[?]</span>
	<br>
	<span class="list" style="max-height: 400px; overflow-y: auto; overflow-x: hidden; display: block; margin-top: 1em; transform: translateZ(0);"></span>
</span>
</p>
<p id="import-options">
<label style="display: inline-block">Group Handouts By... <select id="organize-by"></select></label>
<button type="button" id="import-open-props" class="btn" role="button" aria-disabled="false" style="padding: 3px; display: inline-block;">Select Properties</button>
<label>Make handouts visible to all players? <input type="checkbox" title="Make items visible to all players" id="import-showplayers" checked></label>
<label>Overwrite existing? <input type="checkbox" title="Overwrite existing" id="import-overwrite"></label>
</p>
<button type="button" id="importstart" class="btn" role="button" aria-disabled="false">
<span>Start Import</span>
</button>
</div>`;

	d20plus.importListPropsHTML = `<div id="d20plus-import-props" title="Choose Properties to Import">
	<div class="select-props" style="max-height: 400px; overflow-y: auto; transform: translateZ(0)">
		<!-- populate with JS -->		
	</div>
	<p>
		Warning: this feature is highly experimental, and disabling <span style="color: red;">properties which are assumed to always exist</span> is not recommended.
		<br>
		<button type="button" id="save-import-props" class="btn" role="button" aria-disabled="false">Save</button>
	</p>
	</div>`;

	d20plus.importDialogHtml = `<div id="d20plus-import" title="Importing">
<p>
<h3 id="import-name"></h3>
</p>
<b id="import-remaining"></b> <span id="import-remaining-text">remaining</span>
<p>
Errors: <b id="import-errors">0</b>
</p>
<p>
<button style="width: 90%" type="button" id="importcancel" alt="Cancel" title="Cancel Import" class="btn btn-danger" role="button" aria-disabled="false">
	<span>Cancel</span>
</button>
</p>
</div>`;

	d20plus.settingsHtmlImportHeader = `
<h4>Import By Category</h4>
<p><small><i>We strongly recommend the OGL sheet for importing. You can switch afterwards.</i></small></p>
`;
	d20plus.settingsHtmlSelector = `
<select id="import-mode-select">
<option value="none" disabled selected>Select category...</option>
<option value="adventure">Adventures</option>
<option value="background">Backgrounds</option>
<option value="class">Classes</option>
<option value="feat">Feats</option>
<option value="item">Items</option>
<option value="monster">Monsters</option>
<option value="object">Objects</option>
<option value="optionalfeature">Optional Features (Invocations, etc.)</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="spell">Spells</option>
<option value="subclass">Subclasses</option>
</select>
`;
	d20plus.settingsHtmlSelectorPlayer = `
<select id="import-mode-select-player">
<option value="none" disabled selected>Select category...</option>
<option value="background">Backgrounds</option>
<option value="class">Classes</option>
<option value="feat">Feats</option>
<option value="item">Items</option>
<option value="optionalfeature">Optional Features (Invocations, etc.)</option>
<option value="psionic">Psionics</option>
<option value="race">Races</option>
<option value="spell">Spells</option>
<option value="subclass">Subclasses</option>
</select>
`;
	d20plus.settingsHtmlPtMonsters = `
<div class="importer-section" data-import-group="monster">
<h4>Monster Importing</h4>
<label for="import-monster-url">Monster Data URL:</label>
<select id="button-monsters-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-monster-url">
<p><a class="btn" href="#" id="button-monsters-load">Import Monsters</a></p>
<p><a class="btn" href="#" id="button-monsters-load-all" title="Standard sources only; no third-party or UA">Import Monsters From All Sources</a></p>
<p>
WARNING: Importing huge numbers of character sheets slows the game down. We recommend you import them as needed.<br>
The "Import Monsters From All Sources" button presents a list containing monsters from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Monsters."
</p>
</div>
`;

	d20plus.settingsHtmlPtItems = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url">Item Data URL:</label>
<select id="button-items-select"><!-- populate with JS--></select>
<input type="text" id="import-items-url">
<a class="btn" href="#" id="import-items-load">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtItemsPlayer = `
<div class="importer-section" data-import-group="item">
<h4>Item Importing</h4>
<label for="import-items-url-player">Item Data URL:</label>
<select id="button-items-select-player"><!-- populate with JS--></select>
<input type="text" id="import-items-url-player">
<a class="btn" href="#" id="import-items-load-player">Import Items</a>
</div>
`;

	d20plus.settingsHtmlPtSpells = `
<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url">Spell Data URL:</label>
<select id="button-spell-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url">
<p><a class="btn" href="#" id="button-spells-load">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>
`;

	d20plus.settingsHtmlPtSpellsPlayer = `
<div class="importer-section" data-import-group="spell">
<h4>Spell Importing</h4>
<label for="import-spell-url-player">Spell Data URL:</label>
<select id="button-spell-select-player">
<!-- populate with JS-->
</select>
<input type="text" id="import-spell-url-player">
<p><a class="btn" href="#" id="button-spells-load-player">Import Spells</a><p/>
<p><a class="btn" href="#" id="button-spells-load-all-player" title="Standard sources only; no third-party or UA">Import Spells From All Sources</a></p>
<p>
The "Import Spells From All Sources" button presents a list containing spells from official sources only.<br>
To import from third-party sources, either individually select one available in the list or enter a custom URL, and "Import Spells."
</p>
</div>
`;

	d20plus.settingsHtmlPtPsionics = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url">Psionics Data URL:</label>
<select id="button-psionics-select"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url">
<a class="btn" href="#" id="import-psionics-load">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtPsionicsPlayer = `
<div class="importer-section" data-import-group="psionic">
<h4>Psionic Importing</h4>
<label for="import-psionics-url-player">Psionics Data URL:</label>
<select id="button-psionics-select-player"><!-- populate with JS--></select>
<input type="text" id="import-psionics-url-player">
<a class="btn" href="#" id="import-psionics-load-player">Import Psionics</a>
</div>
`;

	d20plus.settingsHtmlPtFeats = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url">Feat Data URL:</label>
<select id="button-feats-select"><!-- populate with JS--></select>
<input type="text" id="import-feats-url">
<a class="btn" href="#" id="import-feats-load">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtFeatsPlayer = `
<div class="importer-section" data-import-group="feat">
<h4>Feat Importing</h4>
<label for="import-feats-url-player">Feat Data URL:</label>
<select id="button-feats-select-player"><!-- populate with JS--></select>
<input type="text" id="import-feats-url-player">
<a class="btn" href="#" id="import-feats-load-player">Import Feats</a>
</div>
`;

	d20plus.settingsHtmlPtObjects = `
<div class="importer-section" data-import-group="object">
<h4>Object Importing</h4>
<label for="import-objects-url">Object Data URL:</label>
<select id="button-objects-select"><!-- populate with JS--></select>
<input type="text" id="import-objects-url">
<a class="btn" href="#" id="import-objects-load">Import Objects</a>
</div>
`;

	d20plus.settingsHtmlPtRaces = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url">Race Data URL:</label>
<select id="button-races-select"><!-- populate with JS--></select>
<input type="text" id="import-races-url">
<a class="btn" href="#" id="import-races-load">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtRacesPlayer = `
<div class="importer-section" data-import-group="race">
<h4>Race Importing</h4>
<label for="import-races-url-player">Race Data URL:</label>
<select id="button-races-select-player"><!-- populate with JS--></select>
<input type="text" id="import-races-url-player">
<a class="btn" href="#" id="import-races-load-player">Import Races</a>
</div>
`;

	d20plus.settingsHtmlPtClasses = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<p style="margin-top: 5px"><a class="btn" href="#" id="button-classes-load-all" title="Standard sources only; no third-party or UA">Import Classes from 5etools</a></p>
<label for="import-classes-url">Class Data URL:</label>
<select id="button-classes-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-classes-url">
<p><a class="btn" href="#" id="button-classes-load">Import Classes from URL</a><p/>
</div>
`;

	d20plus.settingsHtmlPtClassesPlayer = `
<div class="importer-section" data-import-group="class">
<h4>Class Importing</h4>
<p style="margin-top: 5px"><a class="btn" href="#" id="button-classes-load-all-player">Import Classes from 5etools</a></p>
<label for="import-classes-url-player">Class Data URL:</label>
<select id="button-classes-select-player">
<!-- populate with JS-->
</select>
<input type="text" id="import-classes-url-player">
<p><a class="btn" href="#" id="button-classes-load-player">Import Classes from URL</a><p/>
</div>
`;

	d20plus.settingsHtmlPtSubclasses = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url">Subclass Data URL:</label>
<select id="button-subclasses-select"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url">
<a class="btn" href="#" id="import-subclasses-load">Import Subclasses</a>
<p>
<b>Default subclasses are imported as part of Classes import. This can be used to load homebrew classes.</b>
</p>
</div>
`;

	d20plus.settingsHtmlPtSubclassesPlayer = `
<div class="importer-section" data-import-group="subclass">
<h4>Subclass Importing</h4>
<label for="import-subclasses-url-player">Subclass Data URL:</label>
<select id="button-subclasses-select-player"><!-- populate with JS--></select>
<input type="text" id="import-subclasses-url-player">
<a class="btn" href="#" id="import-subclasses-load-player">Import Subclasses</a>
<p>
<b>Default subclasses are imported as part of Classes import. This can be used to load homebrew classes.</b>
</p>
</div>
`;

	d20plus.settingsHtmlPtBackgrounds = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url">Background Data URL:</label>
<select id="button-backgrounds-select"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url">
<a class="btn" href="#" id="import-backgrounds-load">Import Backgrounds</a>
</div>
`;

	d20plus.settingsHtmlPtBackgroundsPlayer = `
<div class="importer-section" data-import-group="background">
<h4>Background Importing</h4>
<label for="import-backgrounds-url-player">Background Data URL:</label>
<select id="button-backgrounds-select-player"><!-- populate with JS--></select>
<input type="text" id="import-backgrounds-url-player">
<a class="btn" href="#" id="import-backgrounds-load-player">Import Backgrounds</a>
</div>
`;


	d20plus.settingsHtmlPtOptfeatures = `
<div class="importer-section" data-import-group="optionalfeature">
<h4>Optional Feature (Invocations, etc.) Importing</h4>
<label for="import-optionalfeatures-url">Optional Feature Data URL:</label>
<select id="button-optionalfeatures-select"><!-- populate with JS--></select>
<input type="text" id="import-optionalfeatures-url">
<a class="btn" href="#" id="import-optionalfeatures-load">Import Optional Features</a>
</div>
`;

	d20plus.settingsHtmlPtOptfeaturesPlayer = `
<div class="importer-section" data-import-group="optionalfeature">
<h4>Optional Feature (Invocations, etc.) Importing</h4>
<label for="import-optionalfeatures-url-player">Optional Feature Data URL:</label>
<select id="button-optionalfeatures-select-player"><!-- populate with JS--></select>
<input type="text" id="import-optionalfeatures-url-player">
<a class="btn" href="#" id="import-optionalfeatures-load-player">Import Optional Features</a>
</div>
`;

	d20plus.settingsHtmlPtAdventures = `
<div class="importer-section" data-import-group="adventure">
<b style="color: red">Please note that this importer has been superceded by the Module Importer tool, found in the Tools List, or <a href="#" class="Vetools-module-tool-open" style="color: darkred; font-style: italic">by clicking here</a>.</b>
<h4>Adventure Importing</h4>
<label for="import-adventures-url">Adventure Data URL:</label>
<select id="button-adventures-select">
<!-- populate with JS-->
</select>
<input type="text" id="import-adventures-url">
<p><a class="btn" href="#" id="button-adventures-load">Import Adventure</a><p/>
<p>
</p>
</div>
`;

	d20plus.settingsHtmlPtImportFooter = `
<br>
<a class="btn bind-drop-locations" href="#" id="bind-drop-locations" style="margin-top: 3px;">Bind Drag-n-Drop</a>
<p><strong>Readme</strong></p>
<p>
You can drag-and-drop imported handouts to character sheets.<br>
If a handout is glowing green in the journal, it's draggable. This breaks when Roll20 decides to hard-refresh the journal.<br>
To restore this functionality, press the "Bind Drag-n-Drop" button.<br>
<i>Note: to drag a handout to a character sheet, you need to drag the name, and not the handout icon.</i>
</p>
`;

	d20plus.css.cssRules = d20plus.css.cssRules.concat([
		{
			s: ".no-shrink",
			r: "flex-shrink: 0;"
		},
		{
			s: "#initiativewindow ul li span.initiative,#initiativewindow ul li span.tracker-col,#initiativewindow ul li span.initmacro",
			r: "font-size: 25px;font-weight: bold;text-align: right;float: right;padding: 2px 5px;width: 10%;min-height: 20px;display: block;"
		},
		{
			s: "#initiativewindow ul li span.editable input",
			r: "width: 100%; box-sizing: border-box;height: 100%;"
		},
		{
			s: "#initiativewindow div.header",
			r: "height: 30px;"
		},
		{
			s: "#initiativewindow div.header span",
			r: "cursor: default;font-size: 15px;font-weight: bold;text-align: right;float: right;width: 10%;min-height: 20px;padding: 5px;"
		},
		{
			s: ".ui-dialog-buttonpane span.difficulty",
			r: "display: inline-block;padding: 5px 4px 6px;margin: .5em .4em .5em 0;font-size: 18px;"
		},
		{
			s: ".ui-dialog-buttonpane.buttonpane-absolute-position",
			r: "position: absolute;bottom: 0;box-sizing: border-box;width: 100%;"
		},
		{
			s: ".ui-dialog.dialog-collapsed .ui-dialog-buttonpane",
			r: "position: initial;"
		},
		{
			s: ".token .cr,.header .cr",
			r: "display: none!important;"
		},
		{
			s: "li.handout.compendium-item .namecontainer",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: ".bind-drop-locations:active",
			r: "box-shadow: inset 0px 0px 25px 2px rgb(195, 239, 184);"
		},
		{
			s: "del.userscript-hidden",
			r: "display: none;"
		},
		{
			s: ".importer-section",
			r: "display: none;"
		},
		{
			s: ".userscript-entry-title",
			r: "font-weight: bold;"
		},
		{
			s: ".userscript-statsBlockHead > .userscript-entry-title",
			r: "font-weight: bold; font-size: 1.5em;"
		},
		{
			s: ".userscript-statsBlockHead > .userscript-statsBlockSubHead > .userscript-entry-title",
			r: "font-weight: bold; font-size: 1.3em;"
		},
		{
			s: ".userscript-statsInlineHead > .userscript-entry-title, .userscript-statsInlineHeadSubVariant > .userscript-entry-title",
			r: "font-style: italic"
		},
		{
			s: ".userscript-statsBlockInsetReadaloud",
			r: "background: #cbd6c688 !important"
		},
	]);

	d20plus.tool.tools = d20plus.tool.tools.concat([
		{
			name: "Shapeshifter Token Builder",
			desc: "Build a rollable table and related token to represent a shapeshifting creature.",
			html: `
				<div id="d20plus-shapeshiftbuild" title="Shapeshifter Token Builder">
					<div id="shapeshiftbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<input id="shapeshift-name" placeholder="Table name">
				<button class="btn">Create Table</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-shapeshiftbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-shapeshiftbuild");
				$win.dialog("open");

				const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));

				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);
				let tokenList;

				DataUtil.multiLoadJSON(
					toLoad.map(url => ({url})),
					() => {},
					(dataStack) => {
						$lst.empty();

						let toShow = [];
						dataStack.forEach(d => toShow = toShow.concat(d.monster));
						toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

						let tmp = "";
						toShow.forEach((m, i)  => {
							m.__pType = Parser.monTypeToFullObj(m.type).asText;

							tmp += `
								<label class="import-cb-label" data-listid="${i}">
									<input type="checkbox">
									<span class="name col-4">${m.name}</span>
									<span class="type col-4">TYP[${m.__pType.uppercaseFirst()}]</span>
									<span class="cr col-2">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
									<span title="${Parser.sourceJsonToFull(m.source)}" class="source">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
								</label>
							`;
						});
						$lst.html(tmp);
						tmp = null;

						tokenList = new List("shapeshiftbuild-list", {
							valueNames: ["name", "type", "cr", "source"]
						});

						d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

						$win.find(`button`).on("click", () => {
							function getSizeInTiles (size) {
								switch (size) {
									case SZ_TINY:
										return 0.5;
									case SZ_SMALL:
									case SZ_MEDIUM:
										return 1;
									case SZ_LARGE:
										return 2;
									case SZ_HUGE:
										return 3;
									case SZ_GARGANTUAN:
										return 4;
									case SZ_COLOSSAL:
										return 5;
								}
							}

							console.log("Assembling creature list");
							if (tokenList) {
								$("a.ui-tabs-anchor[href='#deckstables']").trigger("click");

								const sel = tokenList.items
									.filter(it => $(it.elm).find(`input`).prop("checked"))
									.map(it => toShow[$(it.elm).attr("data-listid")]);

								const id = d20.Campaign.rollabletables.create().id;
								const table = d20.Campaign.rollabletables.get(id);
								table.set("name", $(`#shapeshift-name`).val().trim() || "Shapeshifter");
								table.save();
								sel.forEach(m => {
									const item = table.tableitems.create();
									item.set("name", m.name);
									// encode size info into the URL, which will get baked into the token
									const avatar = m.tokenURL || `${IMG_URL}${Parser.sourceJsonToAbv(m.source)}/${m.name.replace(/"/g, "")}.png?roll20_token_size=${getSizeInTiles(m.size)}`;
									item.set("avatar", avatar);
									item.set("token_size", getSizeInTiles(m.size));
									item.save();
								});
								table.save();
								d20.rollabletables.refreshTablesList();
								alert("Created table!")
							}
						});
					}
				);
			}
		},
		{
			name: "Pauper's Character Vault",
			desc: "Dump characters to JSON, or import dumped characters.",
			html: `
				<div id="d20plus-paupervault" title="Pauper's Character Vault">
				<p>
					This experimental tool allows you to download characters as JSON, to later upload to other games.
				</p>
				<select style="margin-bottom: 0;"></select> <button class="btn download">Download</button>
				<hr>
				<button class="btn upload">Upload</button><input accept=".json" type="file" style="position: absolute; left: -9999px;"> (Previously Download-ed files only)
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-paupervault").dialog({
					autoOpen: false,
					resizable: true,
					width: 400,
					height: 250,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-paupervault");
				$win.dialog("open");

				const $selChar = $win.find(`select`);

				$selChar.append(d20.Campaign.characters.toJSON().sort((a, b) => SortUtil.ascSort(a.name, b.name)).map(c => {
					return `<option value="${c.id}">${c.name || `(Unnamed; ID ${c.id})`}</option>`
				}).join(""));

				const $btnDl = $win.find(`.download`);
				$btnDl.off("click");
				$btnDl.on("click", () => {
					const id = $selChar.val();
					const rawChar = d20.Campaign.characters.get(id);
					const char = rawChar.toJSON();
					char.attribs = rawChar.attribs.toJSON();
					const out = {
						char,
						blobs: {}
					};
					blobCount = 3;
					const onBlobsReady = () => DataUtil.userDownload(char.name.replace(/[^0-9A-Za-z -_()[\]{}]/, "_"), JSON.stringify(out, null, "\t"));

					const handleBlob = (asKey, data) => {
						out.blobs[asKey] = data;
						blobCount--;
						if (blobCount === 0) onBlobsReady();
					};

					rawChar._getLatestBlob("bio", (data) => handleBlob("bio", data));
					rawChar._getLatestBlob("gmnotes", (data) => handleBlob("gmnotes", data));
					rawChar._getLatestBlob("defaulttoken", (data) => handleBlob("defaulttoken", data));
				});

				const $btnUl = $win.find(`.upload`);
				$btnUl.off("click");
				$btnUl.on("click", () => {
					const $iptFile = $win.find(`input[type="file"]`);

					const input = $iptFile[0];

					const reader = new FileReader();
					reader.onload = () => {
						$("a.ui-tabs-anchor[href='#journal']").trigger("click");

						try {
							const text = reader.result;
							const json = JSON.parse(text);

							if (!json.char) {
								window.alert("Failed to import character! See the log for details.");
								console.error(`No "char" attribute found in parsed JSON!`);
								return;
							}
							const char = json.char;

							const newId = d20plus.ut.generateRowId();
							d20.Campaign.characters.create(
								{
									...char,
									id: newId
								},
								{
									success: function (character) {
										try {
											character.attribs.reset();
											if (!char.attribs) {
												window.alert(`Warning: Uploaded character had no "attribs" attribute. The character sheet will contain no data.`);
												return;
											}
											const toSave = char.attribs.map(a => character.attribs.push(a));
											toSave.forEach(s => s.syncedSave());

											const blobs = json.blobs;
											if (blobs) {
												character.updateBlobs({
													bio: blobs.bio || "",
													gmnotes: blobs.gmnotes || "",
													defaulttoken: blobs.defaulttoken || ""
												});
											}
										} catch (e) {
											window.alert("Failed to import character! See the log for details.");
											console.error(e);
										}
									}
								}
							);
						} catch (e) {
							console.error(e);
							window.alert("Failed to load file! See the log for details.")
						}
					};
					input.onchange = function () {
						reader.readAsText(input.files[0]);
					};

					$iptFile.click();
				});
			}
		},
		{
			name: "Wild Form Builder",
			desc: "Build a character sheet to represent a character in Wild Form.",
			html: `
				<div id="d20plus-wildformbuild" title="Wild Form Character Builder">
					<div id="wildformbuild-list">
						<input type="search" class="search" placeholder="Search creatures...">
						<input type="search" class="filter" placeholder="Filter...">
						<span title="Filter format example: 'cr:1/4; cr:1/2; type:beast; source:MM'" style="cursor: help;">[?]</span>
						<div class="list" style="transform: translateZ(0); max-height: 490px; overflow-y: auto; overflow-x: hidden;"><i>Loading...</i></div>
					</div>
				<br>
				<select id="wildform-character">
					<option value="" disabled selected>Select Character</option>
				</select>
				<button class="btn">Create Character Sheet</button>
				</div>
				`,
			dialogFn: () => {
				$("#d20plus-wildformbuild").dialog({
					autoOpen: false,
					resizable: true,
					width: 800,
					height: 650,
				});
			},
			openFn: () => {
				const $win = $("#d20plus-wildformbuild");
				$win.dialog("open");

				const $selChar = $(`#wildform-character`);
				$selChar.empty();
				$selChar.append(`<option value="" disabled>Select Character</option>`);
				const allChars = d20.Campaign.characters.toJSON().map(it => {
					const out = {id: it.id, name: it.name || ""};
					const npc = d20.Campaign.characters.get(it.id).attribs.toJSON().find(it => it.name === "npc");
					out.npc = !!(npc && npc.current && Number(npc.current));
					return out;
				});
				let hasNpc = false;
				allChars.sort((a, b) => a.npc - b.npc || SortUtil.ascSort(a.name.toLowerCase(), b.name.toLowerCase()))
					.forEach(it => {
						if (it.npc && !hasNpc) {
							$selChar.append(`<option value="" disabled>--NPCs--</option>`);
							hasNpc = true;
						}
						$selChar.append(`<option value="${it.id}">${it.name}</option>`)
					});


				const $fltr = $win.find(`.filter`);
				$fltr.off("keydown").off("keyup");
				$win.find(`button`).off("click");

				const $lst = $win.find(`.list`);

				let tokenList;
				loadData();

				function loadData() {
					const toLoad = Object.keys(monsterDataUrls).map(src => d20plus.monsters.formMonsterUrl(monsterDataUrls[src]));
					DataUtil.multiLoadJSON(
						toLoad.map(url => ({url})),
						() => {},
						(dataStack) => {
							$lst.empty();

							let toShow = [];
							dataStack.forEach(d => toShow = toShow.concat(d.monster));
							toShow = toShow.sort((a, b) => SortUtil.ascSort(a.name, b.name));

							let tmp = "";
							toShow.forEach((m, i)  => {
								m.__pType = Parser.monTypeToFullObj(m.type).asText;

								tmp += `
								<label class="import-cb-label" data-listid="${i}">
								<input type="radio" name="wildform-monster">
								<span class="name col-4">${m.name}</span>
								<span class="type col-4">TYP[${m.__pType.uppercaseFirst()}]</span>
								<span class="cr col-2">${m.cr === undefined ? "CR[Unknown]" : `CR[${(m.cr.cr || m.cr)}]`}</span>
								<span title="${Parser.sourceJsonToFull(m.source)}" class="source">SRC[${Parser.sourceJsonToAbv(m.source)}]</span>
								</label>
								`;
							});
							$lst.html(tmp);
							tmp = null;

							tokenList = new List("wildformbuild-list", {
								valueNames: ["name", "type", "cr", "source"]
							});

							d20plus.importer.addListFilter($fltr, toShow, tokenList, d20plus.monsters._listIndexConverter);

							$win.find(`button`).on("click", () => {
								let sel = toShow[$(tokenList.items.find(it => $(it.elm).find(`input`).prop("checked")).elm).attr("data-listid")];
								sel = $.extend(true, {}, sel);

								const character = $selChar.val();
								if (!character) return;

								const d20Character = d20.Campaign.characters.get(character);

								if (tokenList && sel && d20Character) {
									sel.wis = (d20Character.attribs.toJSON().find(x => x.name === "wisdom")|| {}).current || 10;
									sel.int = (d20Character.attribs.toJSON().find(x => x.name === "intelligence")|| {}).current || 10;
									sel.cha = (d20Character.attribs.toJSON().find(x => x.name === "charisma")|| {}).current || 10;

									const attribsSkills = {
										acrobatics_bonus: "acrobatics",
										animal_handling_bonus: "animal_handling",
										arcana_bonus: "arcana",
										athletics_bonus: "athletics",
										deception_bonus: "deception",
										history_bonus: "history",
										insight_bonus: "insight",
										intimidation_bonus: "intimidation",
										investigation_bonus: "investigation",
										medicine_bonus: "medicine",
										nature_bonus: "nature",
										perception_bonus: "perception",
										performance_bonus: "performance",
										persuasion_bonus: "persuasion",
										religion_bonus: "religion",
										slight_of_hand_bonus: "slight_of_hand",
										stealth_bonus: "stealth",
									};
									const attribsSaves = {
										npc_int_save: "int",
										npc_wis_save: "wis",
										npc_cha_save: "cha"
									};
									sel.skill = sel.skill || {};
									sel.save = sel.save || {};

									for (const a in attribsSkills) {
										const characterValue = d20Character.attribs.toJSON().find(x => x.name === a);
										if (characterValue) {
											sel.skill[attribsSkills[a]] = Math.max(sel.skill[attribsSkills[a]] || 0, characterValue.current);
										}
									}

									for (const a in attribsSaves) {
										const characterValue = d20Character.attribs.toJSON().find(x => x.name === a);
										if (characterValue) {
											sel.save[attribsSkills[a]] = Math.max(sel.save[attribsSkills[a]] || 0, characterValue.current);
										}
									}

									const doBuild = (result) => {
										const options = {
											charFunction: (character) => {
												character._getLatestBlob("defaulttoken", y => {
													if (y) {
														const token = JSON.parse(y);
														token.name = `${sel.name} (${d20Character.attributes.name})`;
														token.showplayers_aura1 = true;
														token.showplayers_aura2 = true;
														token.showplayers_bar1 = true;
														token.showplayers_bar2 = true;
														token.showplayers_bar3 = true;
														token.showplayers_name = true;
														token.bar3_max = result.total;
														token.bar3_value = result.total;
														character.updateBlobs({defaulttoken: JSON.stringify(token)});
														character.save({defaulttoken: (new Date()).getTime()});
													}
												});

												$("a.ui-tabs-anchor[href='#journal']").trigger("click");
												alert("Created character!");
											},
											charOptions: {
												inplayerjournals: d20Character.attributes.inplayerjournals,
												controlledby: d20Character.attributes.controlledby
											}
										};

										d20plus.monsters.handoutBuilder(sel, true, options, `Wild Forms - ${d20Character.attributes.name}`);
									};

									if (sel.hp.formula) d20plus.ut.randomRoll(sel.hp.formula, result => doBuild(result))
									else doBuild({total: 0});
								}

								console.log("Assembling creature list");
							});
						}
					);
				}
			}
		}
	]);

	d20plus.initiativeHeaders = `<div class="header init-header">
<span class="ui-button-text initmacro init-sheet-header"></span>
<span class="initiative init-init-header" alt="Initiative" title="Initiative">Init</span>
<span class="cr" alt="CR" title="CR">CR</span>
<div class="tracker-header-extra-columns"></div>
</div>`;

	d20plus.initiativeTemplate = `<script id="tmpl_initiativecharacter" type="text/html">
<![CDATA[
	<li class='token <$ if (this.layer === "gmlayer") { $>gmlayer<$ } $>' data-tokenid='<$!this.id$>' data-currentindex='<$!this.idx$>'>
		<$ var token = d20.Campaign.pages.get(d20.Campaign.activePage()).thegraphics.get(this.id); $>
		<$ var char = (token) ? token.character : null; $>
		<$ if (d20plus.cfg.getCfgVal("interface", "customTracker") && d20plus.cfg.getCfgVal("interface", "trackerSheetButton")) { $>
			<span alt='Sheet Macro' title='Sheet Macro' class='initmacro'>
				<button type='button' class='initmacrobutton ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only pictos' role='button' aria-disabled='false'>
				<span class='ui-button-text'>N</span>
				</button>
			</span>		
		<$ } $>
		<span alt='Initiative' title='Initiative' class='initiative <$ if (this.iseditable) { $>editable<$ } $>'>
			<$!this.pr$>
		</span>
		<$ if (char) { $>
			<$ var npc = char.attribs ? char.attribs.find(function(a){return a.get("name").toLowerCase() == "npc" }) : null; $>
		<$ } $>
		<div class="tracker-extra-columns">
			<!--5ETOOLS_REPLACE_TARGET-->
		</div>
		<$ if (this.avatar) { $><img src='<$!this.avatar$>' /><$ } $>
		<span class='name'><$!this.name$></span>
			<div class='clear' style='height: 0px;'></div>
			<div class='controls'>
		<span class='pictos remove'>#</span>
		</div>
	</li>
]]>
</script>`;

	d20plus.actionMacroPerception = "%{Selected|npc_perception} /w gm &{template:default} {{name=Senses}}  /w gm @{Selected|npc_senses} ";
	d20plus.actionMacroInit = "%{selected|npc_init}";
	d20plus.actionMacroDrImmunities = "/w gm &{template:default} {{name=DR/Immunities}} {{Damage Resistance= @{selected|npc_resistances}}} {{Damage Vulnerability= @{selected|npc_vulnerabilities}}} {{Damage Immunity= @{selected|npc_immunities}}} {{Condition Immunity= @{selected|npc_condition_immunities}}} ";
	d20plus.actionMacroStats = "/w gm &{template:default} {{name=Stats}} {{Armor Class= @{selected|npc_AC}}} {{Hit Dice= @{selected|npc_hpformula}}} {{Speed= @{selected|npc_speed}}} {{Skills= @{selected|npc_skills}}} {{Senses= @{selected|npc_senses}}} {{Languages= @{selected|npc_languages}}} {{Challenge= @{selected|npc_challenge}(@{selected|npc_xp}xp)}}";
	d20plus.actionMacroSaves = "/w gm &{template:simple}{{always=1}}?{Saving Throw?|STR,{{rname=Strength Save&#125;&#125;{{mod=@{npc_str_save}&#125;&#125; {{r1=[[1d20+@{npc_str_save}]]&#125;&#125;{{r2=[[1d20+@{npc_str_save}]]&#125;&#125;|DEX,{{rname=Dexterity Save&#125;&#125;{{mod=@{npc_dex_save}&#125;&#125; {{r1=[[1d20+@{npc_dex_save}]]&#125;&#125;{{r2=[[1d20+@{npc_dex_save}]]&#125;&#125;|CON,{{rname=Constitution Save&#125;&#125;{{mod=@{npc_con_save}&#125;&#125; {{r1=[[1d20+@{npc_con_save}]]&#125;&#125;{{r2=[[1d20+@{npc_con_save}]]&#125;&#125;|INT,{{rname=Intelligence Save&#125;&#125;{{mod=@{npc_int_save}&#125;&#125; {{r1=[[1d20+@{npc_int_save}]]&#125;&#125;{{r2=[[1d20+@{npc_int_save}]]&#125;&#125;|WIS,{{rname=Wisdom Save&#125;&#125;{{mod=@{npc_wis_save}&#125;&#125; {{r1=[[1d20+@{npc_wis_save}]]&#125;&#125;{{r2=[[1d20+@{npc_wis_save}]]&#125;&#125;|CHA,{{rname=Charisma Save&#125;&#125;{{mod=@{npc_cha_save}&#125;&#125; {{r1=[[1d20+@{npc_cha_save}]]&#125;&#125;{{r2=[[1d20+@{npc_cha_save}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroSkillCheck = "/w gm &{template:simple}{{always=1}}?{Ability?|Acrobatics,{{rname=Acrobatics&#125;&#125;{{mod=@{npc_acrobatics}&#125;&#125; {{r1=[[1d20+@{npc_acrobatics}]]&#125;&#125;{{r2=[[1d20+@{npc_acrobatics}]]&#125;&#125;|Animal Handling,{{rname=Animal Handling&#125;&#125;{{mod=@{npc_animal_handling}&#125;&#125; {{r1=[[1d20+@{npc_animal_handling}]]&#125;&#125;{{r2=[[1d20+@{npc_animal_handling}]]&#125;&#125;|Arcana,{{rname=Arcana&#125;&#125;{{mod=@{npc_arcana}&#125;&#125; {{r1=[[1d20+@{npc_arcana}]]&#125;&#125;{{r2=[[1d20+@{npc_arcana}]]&#125;&#125;|Athletics,{{rname=Athletics&#125;&#125;{{mod=@{npc_athletics}&#125;&#125; {{r1=[[1d20+@{npc_athletics}]]&#125;&#125;{{r2=[[1d20+@{npc_athletics}]]&#125;&#125;|Deception,{{rname=Deception&#125;&#125;{{mod=@{npc_deception}&#125;&#125; {{r1=[[1d20+@{npc_deception}]]&#125;&#125;{{r2=[[1d20+@{npc_deception}]]&#125;&#125;|History,{{rname=History&#125;&#125;{{mod=@{npc_history}&#125;&#125; {{r1=[[1d20+@{npc_history}]]&#125;&#125;{{r2=[[1d20+@{npc_history}]]&#125;&#125;|Insight,{{rname=Insight&#125;&#125;{{mod=@{npc_insight}&#125;&#125; {{r1=[[1d20+@{npc_insight}]]&#125;&#125;{{r2=[[1d20+@{npc_insight}]]&#125;&#125;|Intimidation,{{rname=Intimidation&#125;&#125;{{mod=@{npc_intimidation}&#125;&#125; {{r1=[[1d20+@{npc_intimidation}]]&#125;&#125;{{r2=[[1d20+@{npc_intimidation}]]&#125;&#125;|Investigation,{{rname=Investigation&#125;&#125;{{mod=@{npc_investigation}&#125;&#125; {{r1=[[1d20+@{npc_investigation}]]&#125;&#125;{{r2=[[1d20+@{npc_investigation}]]&#125;&#125;|Medicine,{{rname=Medicine&#125;&#125;{{mod=@{npc_medicine}&#125;&#125; {{r1=[[1d20+@{npc_medicine}]]&#125;&#125;{{r2=[[1d20+@{npc_medicine}]]&#125;&#125;|Nature,{{rname=Nature&#125;&#125;{{mod=@{npc_nature}&#125;&#125; {{r1=[[1d20+@{npc_nature}]]&#125;&#125;{{r2=[[1d20+@{npc_nature}]]&#125;&#125;|Perception,{{rname=Perception&#125;&#125;{{mod=@{npc_perception}&#125;&#125; {{r1=[[1d20+@{npc_perception}]]&#125;&#125;{{r2=[[1d20+@{npc_perception}]]&#125;&#125;|Performance,{{rname=Performance&#125;&#125;{{mod=@{npc_performance}&#125;&#125; {{r1=[[1d20+@{npc_performance}]]&#125;&#125;{{r2=[[1d20+@{npc_performance}]]&#125;&#125;|Persuasion,{{rname=Persuasion&#125;&#125;{{mod=@{npc_persuasion}&#125;&#125; {{r1=[[1d20+@{npc_persuasion}]]&#125;&#125;{{r2=[[1d20+@{npc_persuasion}]]&#125;&#125;|Religion,{{rname=Religion&#125;&#125;{{mod=@{npc_religion}&#125;&#125; {{r1=[[1d20+@{npc_religion}]]&#125;&#125;{{r2=[[1d20+@{npc_religion}]]&#125;&#125;|Sleight of Hand,{{rname=Sleight of Hand&#125;&#125;{{mod=@{npc_sleight_of_hand}&#125;&#125; {{r1=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;{{r2=[[1d20+@{npc_sleight_of_hand}]]&#125;&#125;|Stealth,{{rname=Stealth&#125;&#125;{{mod=@{npc_stealth}&#125;&#125; {{r1=[[1d20+@{npc_stealth}]]&#125;&#125;{{r2=[[1d20+@{npc_stealth}]]&#125;&#125;|Survival,{{rname=Survival&#125;&#125;{{mod=@{npc_survival}&#125;&#125; {{r1=[[1d20+@{npc_survival}]]&#125;&#125;{{r2=[[1d20+@{npc_survival}]]&#125;&#125;}{{charname=@{character_name}}} ";
	d20plus.actionMacroAbilityCheck = "/w gm &{template:simple}{{always=1}}?{Ability?|STR,{{rname=Strength&#125;&#125;{{mod=@{strength_mod}&#125;&#125; {{r1=[[1d20+@{strength_mod}]]&#125;&#125;{{r2=[[1d20+@{strength_mod}]]&#125;&#125;|DEX,{{rname=Dexterity&#125;&#125;{{mod=@{dexterity_mod}&#125;&#125; {{r1=[[1d20+@{dexterity_mod}]]&#125;&#125;{{r2=[[1d20+@{dexterity_mod}]]&#125;&#125;|CON,{{rname=Constitution&#125;&#125;{{mod=@{constitution_mod}&#125;&#125; {{r1=[[1d20+@{constitution_mod}]]&#125;&#125;{{r2=[[1d20+@{constitution_mod}]]&#125;&#125;|INT,{{rname=Intelligence&#125;&#125;{{mod=@{intelligence_mod}&#125;&#125; {{r1=[[1d20+@{intelligence_mod}]]&#125;&#125;{{r2=[[1d20+@{intelligence_mod}]]&#125;&#125;|WIS,{{rname=Wisdom&#125;&#125;{{mod=@{wisdom_mod}&#125;&#125; {{r1=[[1d20+@{wisdom_mod}]]&#125;&#125;{{r2=[[1d20+@{wisdom_mod}]]&#125;&#125;|CHA,{{rname=Charisma&#125;&#125;{{mod=@{charisma_mod}&#125;&#125; {{r1=[[1d20+@{charisma_mod}]]&#125;&#125;{{r2=[[1d20+@{charisma_mod}]]&#125;&#125;}{{charname=@{character_name}}} ";

	d20plus.actionMacroTrait = function (index) {
		return "/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npctrait_$" + index + "_name}}} {{description=@{selected|repeating_npctrait_$" + index + "_desc} }}";
	};

	d20plus.actionMacroAction = function (index) {
		return "%{selected|repeating_npcaction_$" + index + "_npc_action}";
	};

	d20plus.actionMacroReaction = "/w gm &{template:npcaction} {{name=@{selected|npc_name}}} {{rname=@{selected|repeating_npcreaction_$0_name}}} {{description=@{selected|repeating_npcreaction_$0_desc} }} ";

	d20plus.actionMacroLegendary = function (tokenactiontext) {
		return "/w gm @{selected|wtype}&{template:npcaction} {{name=@{selected|npc_name}}} {{rname=Legendary Actions}} {{description=The @{selected|npc_name} can take @{selected|npc_legendary_actions} legendary actions, choosing from the options below. Only one legendary option can be used at a time and only at the end of another creature's turn. The @{selected|npc_name} regains spent legendary actions at the start of its turn.\n\r" + tokenactiontext + "}} ";
	}
};

SCRIPT_EXTENSIONS.push(betteR205etools);