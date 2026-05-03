// 验算所有组合的坐标转换
// 确保 getOtherPlayerDestToGlobal 在所有情况下返回正确结果

// 原始路径数据（移动1步后的坐标，即索引1）
const colorPaths = {
    0: [2, 6],    // Blue 移动1步
    1: [6, 12],   // Red 移动1步
    2: [12, 8],   // Green 移动1步
    3: [8, 2]     // Yellow 移动1步
};

// 逆时针旋转90度
function rotateOnce(r, c) {
    return [14 - c, r];
}

// 旋转多次
function rotate(r, c, times) {
    let result = [r, c];
    for (let i = 0; i < times; i++) {
        result = rotateOnce(result[0], result[1]);
    }
    return result;
}

// 计算期望结果
function calculateExpected(colorIndex, playerView, otherPlayer) {
    // 座位到颜色的映射
    const seatToColor = (seat) => (colorIndex + seat) % 4;
    
    // 计算实际座位
    const actualSeat = (playerView + otherPlayer) % 4;
    
    // 获取该座位的颜色
    const actualColor = seatToColor(actualSeat);
    
    // 获取该颜色移动1步后的基本盘坐标
    const [baseR, baseC] = colorPaths[actualColor];
    
    // 计算相对旋转次数
    const relativeRotations = (playerView - actualSeat + 4) % 4;
    
    // 应用旋转
    const result = rotate(baseR, baseC, relativeRotations);
    
    return {
        actualSeat,
        actualColor,
        baseCoord: [baseR, baseC],
        relativeRotations,
        result
    };
}

// 验证所有组合
console.log('=== 验算所有组合 ===\n');

const colorNames = ['Blue(0)', 'Red(1)', 'Green(2)', 'Yellow(3)'];
let allCorrect = true;

// 用户的期望结果
const expected = {
    1: [8, 2],
    2: [12, 8],
    3: [6, 12]
};

for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
    for (let playerView = 0; playerView < 4; playerView++) {
        console.log(`\n--- colorIndex=${colorIndex}, playerView=${playerView} ---`);
        console.log(`座位分配: 座位0=${colorNames[(colorIndex+0)%4]}, 座位1=${colorNames[(colorIndex+1)%4]}, 座位2=${colorNames[(colorIndex+2)%4]}, 座位3=${colorNames[(colorIndex+3)%4]}`);
        
        for (let otherPlayer = 1; otherPlayer <= 3; otherPlayer++) {
            const calc = calculateExpected(colorIndex, playerView, otherPlayer);
            const [resultR, resultC] = calc.result;
            const [expectedR, expectedC] = expected[otherPlayer];
            
            const isCorrect = resultR === expectedR && resultC === expectedC;
            const status = isCorrect ? '✓' : '✗';
            
            if (!isCorrect) {
                allCorrect = false;
            }
            
            console.log(`  otherPlayer=${otherPlayer}: 座位${calc.actualSeat}(${colorNames[calc.actualColor]}) 基本盘${JSON.stringify(calc.baseCoord)} 旋转${calc.relativeRotations}次 → [${resultR},${resultC}] ${status} (期望[${expectedR},${expectedC}])`);
        }
    }
}

console.log('\n===================');
console.log(`验算结果: ${allCorrect ? '✓ 全部正确' : '✗ 存在错误'}`);
console.log('===================\n');

// 额外：验证期望值的一致性规律
console.log('\n=== 分析期望值的规律 ===');
for (let otherPlayer = 1; otherPlayer <= 3; otherPlayer++) {
    const [r, c] = expected[otherPlayer];
    console.log(`otherPlayer=${otherPlayer}: [${r},${c}]`);
    
    // 检查这个坐标对应哪个颜色的移动1步
    for (let color = 0; color < 4; color++) {
        const [cr, cc] = colorPaths[color];
        if (cr === r && cc === c) {
            console.log(`  → 这是 ${colorNames[color]} 移动1步的坐标`);
        }
    }
}
