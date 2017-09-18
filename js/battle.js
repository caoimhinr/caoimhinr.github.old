function InitializeTraining() {
	battleInventoryIndex = 0;
	comboLevel = 0;
	battleTimer = 0;
	for (var i in battleInventory) {     
        battleInventory[i].Combo = 0;      
   }
	if (currentHP <= 0) {
		TrainingLog("You cannot train with 0HP.");
	}
	else if (battleInventory.length == 0) {		
		TrainingLog("You need to equip an item first.");	
	} else {		
		$.each(allEnemies, function(i, e) {
			var item = $("<div class='battleLog' data-enemy='" + e.Id + "'><div class='img' style='background-image: url(\"../content/sprites/items/" + e.Name + ".png\"); background-repeat: no-repeat; background-position: center;'></div><span style='font-weight:bold;color:#F00;'>" + e.Name + "</span></div>");
			item.on('click', function() {
				currentEnemy = GetEnemy($(this).attr("data-enemy"));
				StartBattle();
			});
			$('#trainingLog').append(item);
		});
	}
	$('#trainingContent').show();
}

function StartBattle() {
	$('#npcName').text(currentEnemy.Name);
	//enemy health bar
	var hBar = $('#trainingNpcHealth.health-bar'),
		bar = hBar.find('.bar'),
		hit = hBar.find('.hit');
	hBar.data('total', currentEnemy.HP);   
	hBar.data('value', hBar.data('total'));    
	hit.css({'width': '0'});
	bar.css({'width': '100%'});
	//player health bar
	hBar = $('#trainingPlayerHealth.health-bar'),
	bar = hBar.find('.bar'),
	hit = hBar.find('.hit');
	hBar.data('total', hp);   
	hBar.data('value', hBar.data('total'));    
	hit.css({'width': '0'});
	bar.css({'width': '100%'});
	isTraining = true;
	$('#trainingLog').html('');
	TrainingLog(currentEnemy.Name + " appears.");
}

function BattleTraining() {
	if (battleTimer >= 20) {
		var playerSpeedMod = Math.ceil(5 - spd * 0.02);
		if (playerSpeedMod < 1)
			playerSpeedMod = 1;
		var enemySpeedMod = Math.ceil(5 - currentEnemy.SPD * 0.02);
		if (enemySpeedMod < 1)
			enemySpeedMod = 1;
		if (isTraining && battleTimer % playerSpeedMod == 0) {
			PlayerPhase();
		}
		if (isTraining && battleTimer % enemySpeedMod == 0) {
			EnemyPhase();
		}
	}
	battleTimer += 1;
}

function PlayerPhase() {
	var previousItem = GetPreviousBattleInventoryItem();
	var item = GetNextBattleInventoryItem();
	var combo = CheckCombo(previousItem, item);
	var useCombo = typeof(combo) !== "undefined";
	var damage = 0;
	
	if (useCombo) {
		damage = Math.ceil(item.ATK * combo.ModATK);			
		item.Combo = combo.Id;
		ChangeBattleItem(item.Name, item);
		comboLevel += 1;
		gold += combo.Gold;
		exp += combo.Exp;
		spd += combo.SPD;
		
		if (combo.lifesteal != 0) {
			currentHP += combo.lifesteal;		
			if (currentHP > hp) {
				currentHP = hp;
			} else if (currentHP < 0) {
				currentHP = 0;
			}
			var hBar = $('#trainingPlayerHealth.health-bar');
			SetHealthBarValue(hBar, combo.lifesteal, combo.lifesteal < 0);
		}
	} else {
		comboLevel = 0;
		item.Combo = 0;
		ChangeBattleItem(item.Name, item);
		damage = item.ATK;
	}	
	currentEnemy.CurrentHP -= damage;
	
	var hBar = $('#trainingNpcHealth.health-bar');
	SetHealthBarValue(hBar, damage, true);
	
	if (currentEnemy.CurrentHP <= 0) {
		currentEnemy.CurrentHP = 0;
		isTraining = false;		
	}
	
	if (useCombo && combo.ModATK > 1) {
		TrainingLog(item.Name + "'s \"" + combo.Name + "\" deals " + damage + " damage to " + currentEnemy.Name + ". (" + currentEnemy.CurrentHP + "/" + currentEnemy.HP + ")", comboLevel, item);
	} else {
		TrainingLog("Your " + item.Name + " deals " + damage + " damage to " + currentEnemy.Name + ". (" + currentEnemy.CurrentHP + "/" + currentEnemy.HP + ")", 0);
	}
	
	if (!isTraining && currentEnemy.CurrentHP == 0) {
		exp += currentEnemy.EXP;
		gold += currentEnemy.Gold;
		TrainingLog("You defeated " + currentEnemy.Name + " and gained " + currentEnemy.EXP + " Exp and " + currentEnemy.Gold + " gold.");
	}
}

function EnemyPhase() {
	var damage = currentEnemy.ATK;
	currentHP -= damage;
	
	var hBar = $('#trainingPlayerHealth.health-bar');
	SetHealthBarValue(hBar, damage, true);
	
	if (currentHP <= 0) {
		currentHP = 0;
		isTraining = false;
	}
	TrainingLog("Enemy " + currentEnemy.Name + " attacks you. (" + currentHP + "/" + hp + ")");	
	
	if (!isTraining && currentHP == 0) {					
		var goldLost = Math.ceil(gold * 0.5);
		gold -= goldLost;
		exp += 5;
		TrainingLog("You were defeated by " + currentEnemy.Name + " and lost " + goldLost + " gold.");
	}
}

function SetHealthBarValue(hBar, delta, add) {
	var	bar = hBar.find('.bar'),
		hit = hBar.find('.hit');		
	var total = hBar.data('total'),
        value = hBar.data('value');
	var newValue = value;
	if (add) {
		newValue =	value - delta;
		if (newValue < 0)
			newValue = 0;
	} else {
		newValue = value + delta;
		if (newValue >= total)
			newValue = total;
	}
    var barWidth = (newValue / total) * 100;
    var hitWidth = (delta / value) * 100 + "%";
	hit.css('width', hitWidth);
    hBar.data('value', newValue);
	setTimeout(function(){
      hit.css({'width': '0'});
      bar.css('width', barWidth + "%");
    }, 500);
}
	
function TrainingLog(message, comboLevel, item) {
	var imageName = "";
	if (typeof(item) !== "undefined") {
		imageName = item.Name.replace(/\s+/g, '-').toLowerCase();
	}
	var logItem = "<div class='battleLog'><span>" + message + "</span></div>";
	if (comboLevel == 1) {
		logItem = "<div class='battleLog'><div class='img' style='background-image: url(\"../content/sprites/items/" + imageName + ".png\"); background-repeat: no-repeat; background-position: center;'></div><span style='font-weight:bold;color:#F00;'>" + message + "</span></div>";
	} else if (comboLevel == 2) {                                                                                                                                                                               
		logItem = "<div class='battleLog'><div class='img' style='background-image: url(\"../content/sprites/items/" + imageName + ".png\"); background-repeat: no-repeat; background-position: center;'></div><span style='font-weight:bold;color:#0F0;'>" + message + "</span></div>";
	} else if (comboLevel == 3) {                                                                                                                                                                               
		logItem = "<div class='battleLog'><div class='img' style='background-image: url(\"../content/sprites/items/" + imageName + ".png\"); background-repeat: no-repeat; background-position: center;'></div><span style='font-weight:bold;color:#00F;'>" + message + "</span></div>";
	}
	$('#trainingLog').prepend(logItem);
}