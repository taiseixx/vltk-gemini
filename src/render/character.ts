export interface DrawHumanImages {
  playerSprite: CanvasImageSource | null;
  bossSprite: CanvasImageSource | null;
  mobSprite: CanvasImageSource | null;
  playerSectSprites: Record<string, CanvasImageSource | null>;
}

export interface DrawHumanParams {
  x: number;
  y: number;
  sz: number;
  c: string;
  facing: number;
  isBoss: boolean;
  moving: boolean;
  time: number;
  hasCloak?: boolean;
  sectId?: string | null;
  images: DrawHumanImages;
}

export function drawHuman(
  ctx: CanvasRenderingContext2D,
  params: DrawHumanParams
): void {
  const {
    x,
    y,
    sz,
    c,
    facing,
    isBoss,
    moving,
    time,
    hasCloak = false,
    sectId,
    images,
  } = params;

  // Elegant Angelic Wings (Cloak equipment) - Rendered behind player
  if (hasCloak) {
    const wingFlap = Math.sin(time * 0.008) * sz * 0.4;
    ctx.save();
    ctx.shadowBlur = 5;
    
    let mainWingColor = 'rgba(235, 95, 175, 0.95)';
    let fillWingColor = 'rgba(235, 95, 175, 0.18)';
    let shadowWingColor = 'rgb(235, 95, 175)';
    
    if (sectId === 'sl' || sectId === 'cl' || sectId === 'vd') {
      mainWingColor = 'rgba(241, 196, 15, 0.95)';
      fillWingColor = 'rgba(241, 196, 15, 0.2)';
      shadowWingColor = '#f1c40f';
    } else if (sectId === 'cb' || sectId === 'tn') {
      mainWingColor = 'rgba(231, 76, 60, 0.95)';
      fillWingColor = 'rgba(231, 76, 60, 0.2)';
      shadowWingColor = '#e74c3c';
    } else if (sectId === 'nd' || sectId === 'tm') {
      mainWingColor = 'rgba(155, 89, 182, 0.95)';
      fillWingColor = 'rgba(155, 89, 182, 0.2)';
      shadowWingColor = '#9b59b6';
    } else if (sectId === 'ty' || sectId === 'nm') {
      mainWingColor = 'rgba(52, 152, 219, 0.95)';
      fillWingColor = 'rgba(52, 152, 219, 0.2)';
      shadowWingColor = '#3498db';
    }
    
    ctx.strokeStyle = mainWingColor;
    ctx.fillStyle = fillWingColor;
    ctx.shadowColor = shadowWingColor;
    
    // Draw 3 layers of feathered curves for spectacular wing detailing
    for (let layer = 0; layer < 3; layer++) {
      const offset = layer * 4;
      const scale = 1 - layer * 0.2;
      ctx.lineWidth = 4 - layer * 1.2;
      
      ctx.beginPath();
      ctx.moveTo(x - sz * 0.1, y + offset);
      ctx.bezierCurveTo(
        x - sz * 3.2 * scale, y - sz * 2.2 * scale + wingFlap,
        x - sz * 3.8 * scale, y + sz * 1.2 * scale + wingFlap,
        x - sz * 0.1, y + sz * 0.8
      );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + sz * 0.1, y + offset);
      ctx.bezierCurveTo(
        x + sz * 3.2 * scale, y - sz * 2.2 * scale + wingFlap,
        x + sz * 3.8 * scale, y + sz * 1.2 * scale + wingFlap,
        x + sz * 0.1, y + sz * 0.8
      );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y + sz * 0.1, sz * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(x, y + sz, sz * 0.8, sz * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  let bodyBounce = moving ? Math.abs(Math.sin(time * 0.015)) * sz * 0.1 : 0;
  let by = y - bodyBounce;

  let spriteImg: CanvasImageSource | null = null;
  if (sectId) {
    spriteImg = images.playerSectSprites[sectId] || images.playerSprite;
  } else if (isBoss) {
    spriteImg = images.bossSprite;
  } else {
    spriteImg = images.mobSprite;
  }

  if (spriteImg) {
    ctx.save();
    const spriteW = sz * 2.8;
    const spriteH = sz * 2.8;
    
    ctx.translate(x, y + sz * 0.3 - bodyBounce);
    ctx.scale(facing, 1);
    
    ctx.drawImage(spriteImg, -spriteW / 2, -spriteH * 0.85, spriteW, spriteH);
    
    if (sectId) {
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.25;
      ctx.drawImage(spriteImg, -spriteW / 2, -spriteH * 0.85, spriteW, spriteH);
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
    }
    
    ctx.restore();
  } else {
    // Fallback Legs
    let legPhase = 0;
    if (moving) legPhase = Math.sin(time * 0.015) * sz * 0.4;
    ctx.fillStyle = "#111";
    ctx.fillRect(x - sz * 0.4 + legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);
    ctx.fillRect(x + sz * 0.1 - legPhase, y + sz * 0.4, sz * 0.3, sz * 0.6);

    // Fallback Body
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - sz * 0.8, by + sz * 0.8);
    ctx.lineTo(x + sz * 0.8, by + sz * 0.8);
    ctx.lineTo(x + sz * 0.6, by - sz * 0.2);
    ctx.lineTo(x - sz * 0.6, by - sz * 0.2);
    ctx.fill();

    // Fallback Head
    if (sectId) {
      ctx.fillStyle = "#fce0cf";
      ctx.beginPath();
      ctx.arc(x, by - sz * 0.5, sz * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isBoss ? "#8e44ad" : "#1a1a1a";
      ctx.beginPath();
      ctx.arc(x, by - sz * 0.6, sz * 0.55, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
    } else {
      ctx.fillStyle = isBoss ? "#b71c1c" : c;
      ctx.beginPath();
      ctx.arc(x, by - sz * 0.5, sz * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Weapon Animation (Arm and Physical features)
  ctx.save();
  let armPhase = moving ? Math.sin(time * 0.015) * sz * 0.4 : 0;
  const hx = x + facing * sz * 0.6;
  const hy = by + sz * 0.15;
  const wx = x + facing * sz * 1.5;
  const wy = by - sz * 0.3 + armPhase;
  
  // Draw back hand
  ctx.fillStyle = sectId ? "#fce0cf" : (isBoss ? "#b71c1c" : c);
  ctx.beginPath();
  ctx.arc(hx, hy + sz * 0.2, sz * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  if (sectId) {
    // Draw arms / sleeves based on sect
    ctx.strokeStyle = c;
    ctx.lineWidth = sz * 0.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + facing * sz * 0.3, by + sz * 0.2);
    ctx.lineTo(hx, hy + sz * 0.2);
    ctx.stroke();

    if (sectId === 'sl') {
      const spinA = (time * 0.005) % (Math.PI * 2);
      ctx.translate(wx, wy);
      ctx.rotate(spinA);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-sz * 1.8, 0);
      ctx.lineTo(sz * 1.8, 0);
      ctx.stroke();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(-sz * 1.8, 0, sz * 0.3, 0, Math.PI * 2);
      ctx.arc(sz * 1.8, 0, sz * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(-spinA);
      ctx.translate(-wx, -wy);
    } 
    else if (sectId === 'vd' || sectId === 'cl' || sectId === 'nm' || sectId === 'ty') {
      // Swordsmen sects
      const swordColor = sectId === 'vd' ? '#3498db' : (sectId === 'nm' ? '#e91e63' : (sectId === 'cl' ? '#f1c40f' : '#00bcd4'));
      
      // Draw thicker outer glowing qi aura
      ctx.save();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = swordColor;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(hx, hy + sz * 0.2);
      ctx.lineTo(wx, wy - sz * 0.5);
      ctx.stroke();
      ctx.restore();
      
      // Draw solid high-intensity core
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(hx, hy + sz * 0.2);
      ctx.lineTo(wx, wy - sz * 0.5);
      ctx.stroke();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx + facing * 4, hy + sz * 0.2 - 4);
      ctx.lineTo(hx + facing * 8, hy + sz * 0.2 + 4);
      ctx.stroke();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - facing * sz * 0.5, hy + sz * 0.2);
      ctx.lineTo(x - facing * sz * 1.2, hy - sz * 0.8);
      ctx.stroke();
    } 
    else if (sectId === 'cb' || sectId === 'nd') {
      // Staff / Whip
      const wColor = sectId === 'cb' ? '#27ae60' : '#9b59b6';
      ctx.strokeStyle = wColor;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(hx, hy + sz * 0.2);
      if (sectId === 'nd') {
         ctx.quadraticCurveTo(wx, wy + sz, wx + facing * sz * 0.8, wy - sz * 0.6);
      } else {
         ctx.lineTo(wx + facing * sz * 0.5, wy - sz * 0.4);
      }
      ctx.stroke();
      
      ctx.fillStyle = sectId === 'cb' ? '#2ecc71' : '#8e44ad';
      ctx.beginPath();
      ctx.arc(wx + (sectId === 'nd' ? facing * sz * 0.8 : facing * sz * 0.5), wy - (sectId === 'nd' ? sz * 0.6 : sz * 0.4), 4, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (sectId === 'tm') {
      // Hidden weapons / Bow
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(hx, hy + sz * 0.2 - 3, sz * 1.2 * facing, 6);
      ctx.fillStyle = '#8a2be2';
      ctx.fillRect(hx + sz * 0.8 * facing, hy + sz * 0.2 - sz * 0.6, 4 * facing, sz * 1.2);
    } 
    else if (sectId === 'tv' || sectId === 'tn') {
      // Spear / Heavy Halberd
      const wColor = sectId === 'tv' ? '#f44336' : '#d35400';
      ctx.strokeStyle = wColor;
      ctx.lineWidth = 4;
      const sLength = sz * 3.2;
      const txPointX = hx + facing * sLength;
      const txPointY = hy + sz * 0.2 - sz * 0.8;
      
      ctx.beginPath();
      ctx.moveTo(hx - facing * sz, hy + sz * 0.2 + sz * 0.4);
      ctx.lineTo(txPointX, txPointY);
      ctx.stroke();
      
      ctx.fillStyle = wColor;
      ctx.beginPath();
      ctx.arc(txPointX - facing * sz * 0.3, txPointY + sz * 0.1, sz * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(txPointX, txPointY);
      ctx.lineTo(txPointX - facing * sz * 0.6, txPointY - sz * 0.2);
      ctx.lineTo(txPointX - facing * sz * 0.6, txPointY + sz * 0.2);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Monster claws / weapons
    ctx.strokeStyle = "#444";
    ctx.lineWidth = isBoss ? 6 : 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + facing * sz * 0.4, by + sz * 0.2);
    ctx.lineTo(wx, wy);
    ctx.stroke();
    
    // Giant spiked club for bosses
    if (isBoss) {
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.ellipse(wx, wy - sz * 0.4, sz * 0.6, sz * 1.0, facing > 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      for(let i=0; i<3; i++) {
         ctx.beginPath();
         ctx.arc(wx + (Math.random()-0.5)*sz*0.6, wy - sz*0.4 + (Math.random()-0.5)*sz*0.8, sz*0.15, 0, Math.PI*2);
         ctx.fill();
      }
    }
  }
  
  // Front hand over weapon
  ctx.fillStyle = sectId ? "#fce0cf" : (isBoss ? "#b71c1c" : c);
  ctx.beginPath();
  ctx.arc(hx + facing * sz * 0.2, hy + sz * 0.2, sz * 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
