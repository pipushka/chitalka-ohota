"use strict";

// =======================================
// СЧИТАЛКА ОТЧЁТОВ
// =======================================

// ---------- Элементы ---------

const reportsArea = document.getElementById("reports");
const calculateBtn = document.getElementById("calculateBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const resultsBody = document.getElementById("resultsBody");
const errorsBox = document.getElementById("errors");
const totalPlayers = document.getElementById("totalPlayers");

// ---------- Данные ----------

let players = {};
let errors = [];

// =========================================
// Игрок
// =========================================

function createPlayer(id)
{
    if (!players[id])
    {
        players[id] =
{
    id: id,
    hunt: 0,
    mouse: 0,
    lead: 0,
    dates:
    {}

 };
}

    return players[id];
}

function addHunt(id, value, date)
{
    const player = createPlayer(id);

    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt:0,
            mouse:0
        };
    }


    let available =
        5 - player.dates[date].hunt;


    if(available <= 0)
    {
        return;
    }


    let add =
        Math.min(value, available);


    player.dates[date].hunt += add;

    player.hunt += add;
}



function addMouse(id, value, date)
{
    const player = createPlayer(id);


    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt:0,
            mouse:0
        };
    }


    let available =
        5 - player.dates[date].mouse;


    if(available <= 0)
    {
        return;
    }


    let add =
        Math.min(value, available);


    player.dates[date].mouse += add;

    player.mouse += add;
}

function addLead(id)
{
    createPlayer(id).lead++;
}

// =========================================
// Очистка
// =========================================

function clearAll()
{
    players = {};
    errors = [];

    drawErrors();
    drawResults();
}

// =========================================
// Деление текста на комментарии
// =========================================

function splitReports(text)
{
    const reports = [];

    const regex = /#(\d+)[\s\S]*?(?=(?:#\d+\s)|$)/g;

    let match;

    while ((match = regex.exec(text)) !== null)
    {
        reports.push({
            number: Number(match[1]),
            text: match[0]
        });
    }

    return reports;
}

// =========================================
// Получение игроков из строки
// =========================================

function parsePeople(text)
{
    const list = [];

    const used = new Set();

    const regex =
        /\[(\d+)\]\s*(?:\(([\d.,]+)\))?/g;

    let match;

    while ((match = regex.exec(text)) !== null)
    {
        const id = match[1];

        if (used.has(id))
            continue;

        used.add(id);

        list.push({
            id: id,
            points:
                match[2] == null
                ? null
                : Number(match[2].replace(",", "."))
        });
    }

    return list;
}

// =========================================
// Получение ID без баллов
// =========================================

function parseIds(text)
{
    const ids = [];

    const used = new Set();

    const regex = /\[(\d+)\]/g;

    let match;

    while ((match = regex.exec(text)) !== null)
    {
        if (used.has(match[1]))
            continue;

        used.add(match[1]);

        ids.push(match[1]);
    }

    return ids;
}

// =========================================
// Главная функция
// =========================================

function calculate()
{
    players = {};
    errors = [];

    const text = reportsArea.value.trim();

    if (!text)
    {
        errors.push("Нет вставленных отчётов.");

        drawErrors();
        drawResults();

        return;
    }

    const reports = splitReports(text);

    for (const report of reports)
    {
        parseReport(report.number, report.text);
    }
const dateMatch =
    text.match(/Дата:\s*([^;\n]+)/i);


if(!dateMatch)
{
    errors.push(`#${number} — отсутствует дата.`);
    return;
}


const reportDate =
    dateMatch[1].trim();
    
    drawErrors();
    drawResults();
}

// =========================================
// Пока пусто
// =========================================

function parseReport(number, text)
{
    //------------------------------------
    // Вид
    //------------------------------------

    const typeMatch =
        text.match(/Вид:\s*([^;\n]+)/i);

    if(!typeMatch)
    {
        errors.push(`#${number} — отсутствует поле "Вид".`);
        return;
    }

    const type =
        typeMatch[1].trim().toLowerCase();

    //------------------------------------
    // История
    //------------------------------------

    if(!/История/i.test(text))
    {
        errors.push(`#${number} — отсутствует история.`);
    }

    //------------------------------------
    // Место охоты
    //------------------------------------

    if(
        type.includes("утрен") ||
        type.includes("вечер") ||
        type.includes("ноч") ||
        type.includes("днев")
    )
    {
        if(!/Место охоты:/i.test(text))
        {
            errors.push(`#${number} — отсутствует место охоты.`);
        }
    }

    //------------------------------------
    // Мышиная охота
    //------------------------------------

    if(type.includes("мыш"))
    {
        const participant =
            text.match(/Участник:[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i);

        if(!participant)
        {
            errors.push(`#${number} — не найден участник.`);
            return;
        }

        const id = participant[1];
        const points =
            Number(participant[2].replace(",", "."));

        addMouse(id, points, reportDate);

        return;
    }

    //------------------------------------
    // Один участник
    //------------------------------------

    const single =
        text.match(/Участник:([\s\S]*?)(?=\n[A-ЯЁ]|$)/i);

    if(single)
    {
        const people =
            parsePeople(single[1]);

        if(people.length===0)
        {
            errors.push(`#${number} — неверный участник.`);
        }

        for(const person of people)
        {
            if(person.points==null)
            {
                errors.push(`#${number} — нет баллов у ${person.id}.`);
                continue;
            }

            addHunt(person.id, person.points, reportDate);
        }
    }

    //------------------------------------
    // Несколько участников
    //------------------------------------

    const multi =
        text.match(/Участники:([\s\S]*?)(?=\n[A-ЯЁ]|$)/i);

    if(multi)
    {
        const people =
            parsePeople(multi[1]);

        if(people.length===0)
        {
            errors.push(`#${number} — участники не найдены.`);
        }

        for(const person of people)
        {
            if(person.points==null)
            {
                errors.push(`#${number} — нет баллов у ${person.id}.`);
                continue;
            }

            addHunt(person.id, person.points, reportDate);
        }
    }

    //------------------------------------
    // Ведущий
    //------------------------------------

    const leader =
    text.match(/Ведущий:[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i);

if (leader)
{
    const id = leader[1];
    const points = Number(leader[2].replace(",", "."));

    addLead(id);

    // Если ведущего нет среди участников,
    // начисляем ему баллы за дичь.
    let found = false;

    if (single)
    {
        for (const p of parsePeople(single[1]))
        {
            if (p.id === id)
            {
                found = true;
                break;
            }
        }
    }

    if (multi)
    {
        for (const p of parsePeople(multi[1]))
        {
            if (p.id === id)
            {
                found = true;
                break;
            }
        }
    }

    if (!found)
    {
       addHunt(id, points, reportDate);
    }
}
else if (
    type.includes("утрен") ||
    type.includes("вечер") ||
    type.includes("ноч") ||
    type.includes("днев")
)
{
    errors.push(`#${number} — отсутствует ведущий.`);
}

    //------------------------------------
    // Таскающие
    //------------------------------------

    const carriers =
        text.match(/Таскающие:([\s\S]*?)(?=\n[A-ЯЁ]|$)/i);

    if(carriers)
    {
        const ids =
            parseIds(carriers[1]);

        for(const id of ids)
        {
            addHunt(id,2.5,reportDate);
        }
    }

    //------------------------------------
    // Проверка участников
    //------------------------------------

    if(
        !single &&
        !multi &&
        !type.includes("мыш")
    )
    {
        errors.push(`#${number} — отсутствуют участники.`);
    }
}

// =========================================
// Вывод ошибок
// =========================================

function drawErrors()
{
    errorsBox.innerHTML = "";

    if (errors.length === 0)
    {
        errorsBox.innerHTML =
            "<div class='success'>Ошибок не найдено.</div>";

        return;
    }

    for (const error of errors)
    {
        const div = document.createElement("div");

        div.className = "error";

        div.textContent = error;

        errorsBox.appendChild(div);
    }
}

// =========================================
// Вывод результатов
// =========================================

function drawResults()
{
    resultsBody.innerHTML = "";

    const list = Object.values(players);

    list.sort((a, b) => Number(a.id) - Number(b.id));

    totalPlayers.textContent =
        "Игроков: " + list.length;

    if (list.length === 0)
    {
        resultsBody.innerHTML = `
        <tr class="placeholderRow">
            <td colspan="4">
                Пока нет данных.
            </td>
        </tr>`;

        return;
    }

    for (const player of list)
    {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="idCell">${player.id}</td>
            <td class="scoreCell">${formatNumber(player.hunt)}</td>
            <td class="leadCell">${player.lead}</td>
            <td class="mouseCell">${formatNumber(player.mouse)}</td>
        `;

        resultsBody.appendChild(row);
    }
}

// =========================================
// Красивый вывод чисел
// =========================================

function formatNumber(value)
{
    if (Number.isInteger(value))
        return value;

    return value.toFixed(1).replace(".", ",");
}

// =========================================
// Копирование результата
// =========================================

function copyResult()
{
    const list = Object.values(players);

    if (list.length === 0)
        return;

    list.sort((a, b) => Number(a.id) - Number(b.id));

    let result = "";

    for (const player of list)
    {
        result +=
`${player.id}\t${formatNumber(player.hunt)}\t${player.lead}\t${formatNumber(player.mouse)}\n`;
    }

    navigator.clipboard.writeText(result);

    copyBtn.textContent = "Скопировано!";

    setTimeout(() =>
    {
        copyBtn.textContent =
            "Копировать результат";
    }, 1500);
}

// =========================================
// Первоначальная отрисовка
// =========================================

drawErrors();
drawResults();

// =========================================
// Кнопки
// =========================================

calculateBtn.addEventListener("click", calculate);

clearBtn.addEventListener("click", () =>
{
    reportsArea.value = "";
    clearAll();
});

copyBtn.addEventListener("click", copyResult);
