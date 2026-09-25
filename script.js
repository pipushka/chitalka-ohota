"use strict";

/*
=========================================================
СЧИТАЛКА ОТЧЁТОВ
=========================================================
*/


/* =====================================================
   ВКЛАДКИ
===================================================== */

const mainTabs = document.querySelectorAll(".main-tab");
const tabContents = document.querySelectorAll(".tab-content");

mainTabs.forEach(tab =>
{
    tab.addEventListener("click", () =>
    {
        const target = tab.dataset.tab;

        mainTabs.forEach(t =>
        {
            t.classList.remove("active");
        });

        tabContents.forEach(content =>
        {
            content.classList.remove("active");
        });

        tab.classList.add("active");

        const targetElement =
            document.getElementById(target);

        if(targetElement)
            targetElement.classList.add("active");
    });
});



/* =====================================================
   =====================================================
   ОХОТА
   =====================================================
   ===================================================== */


/* ---------- Элементы ---------- */

const reportsArea =
    document.getElementById("reports");

const calculateBtn =
    document.getElementById("calculateBtn");

const clearBtn =
    document.getElementById("clearBtn");

const copyBtn =
    document.getElementById("copyBtn");

const resultsBody =
    document.getElementById("resultsBody");

const errorsBox =
    document.getElementById("errors");

const totalPlayers =
    document.getElementById("totalPlayers");



/* ---------- Данные ---------- */

let players = {};

let errors = [];



/* =====================================================
   Игрок
===================================================== */

function createPlayer(id)
{
    if(!players[id])
    {
        players[id] =
        {
            id:id,
            hunt:0,
            mouse:0,
            lead:0,
            dates:{}
        };
    }

    return players[id];
}



function addHunt(id, value, date, reportNumber)
{
    const player =
        createPlayer(id);

    date = date.trim();


    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt:0,
            mouse:0,
            huntReports:[],
            mouseReports:[]
        };
    }


    player.dates[date].hunt += value;

    player.dates[date]
        .huntReports
        .push(reportNumber);

    player.hunt += value;
}



function addMouse(id, value, date, reportNumber)
{
    const player =
        createPlayer(id);


    if(!player.dates[date])
    {
        player.dates[date] =
        {
            hunt:0,
            mouse:0,
            huntReports:[],
            mouseReports:[]
        };
    }


    const available =
        5 - player.dates[date].mouse;


    if(available <= 0)
        return;


    const add =
        Math.min(value, available);


    player.dates[date].mouse += add;

    player.mouse += add;
}



function addLead(id)
{
    createPlayer(id).lead++;
}



/* =====================================================
   Очистка охоты
===================================================== */

function clearAll()
{
    players = {};

    errors = [];

    drawErrors();

    drawResults();
}



/* =====================================================
   Деление текста на комментарии
===================================================== */

function splitReports(text)
{
    const reports = [];

    const regex =
        /(?:^|\n)\s*\*{0,2}#(\d+)\*{0,2}[\s\S]*?(?=\n\s*\*{0,2}#\d+\*{0,2}|$)/g;


    let match;


    while((match = regex.exec(text)) !== null)
    {
        reports.push(
        {
            number:Number(match[1]),
            text:match[0]
        });
    }


    return reports;
}



/* =====================================================
   Получение игроков
===================================================== */

function parsePeople(text)
{
    const list = [];

    const used = new Set();

    const regex =
        /\[(\d+)\]\s*(?:\(([\d.,]+)\))?/g;


    let match;


    while((match = regex.exec(text)) !== null)
    {
        const id = match[1];


        if(used.has(id))
            continue;


        used.add(id);


        list.push(
        {
            id:id,

            points:
                match[2] == null
                ? null
                : Number(
                    match[2]
                    .replace(",", ".")
                )
        });
    }


    return list;
}



/* =====================================================
   Получение ID
===================================================== */

function parseIds(text)
{
    const ids = [];

    const used = new Set();

    const regex =
        /\[(\d+)\]/g;


    let match;


    while((match = regex.exec(text)) !== null)
    {
        if(used.has(match[1]))
            continue;


        used.add(match[1]);

        ids.push(match[1]);
    }


    return ids;
}



/* =====================================================
   Главная функция охоты
===================================================== */

function calculate()
{
    players = {};

    errors = [];


    const text =
        reportsArea.value.trim();


    if(!text)
    {
        errors.push(
            "Нет вставленных отчётов."
        );

        drawErrors();

        drawResults();

        return;
    }


    const reports =
        splitReports(text);


    for(const report of reports)
    {
        parseHuntReport(
            report.number,
            report.text
        );
    }


    checkDailyLimits();

    drawErrors();

    drawResults();
}



/* =====================================================
   Проверка будущей даты охоты
===================================================== */

function checkFutureDate(
    reportNumber,
    text,
    reportDate
)
{
    const headerMatch =
        text.match(
            /#\d+\s+(Сегодня|Вчера|\d{1,2}\s+[а-яё]+\s+в)/i
        );


    if(!headerMatch)
        return;


    let commentDate;


    const word =
        headerMatch[1].toLowerCase();


    const now =
        new Date();


    if(word === "сегодня")
    {
        commentDate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
    }
    else if(word === "вчера")
    {
        commentDate =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - 1
            );
    }
    else
    {
        const months =
        {
            "января":0,
            "февраля":1,
            "марта":2,
            "апреля":3,
            "мая":4,
            "июня":5,
            "июля":6,
            "августа":7,
            "сентября":8,
            "октября":9,
            "ноября":10,
            "декабря":11
        };


        const dateMatch =
            text.match(
                /#\d+\s+(\d{1,2})\s+([а-яё]+)\s+в/i
            );


        if(!dateMatch)
            return;


        commentDate =
            new Date(
                now.getFullYear(),
                months[
                    dateMatch[2].toLowerCase()
                ],
                Number(dateMatch[1])
            );
    }


    const parts =
        reportDate.split(".");


    const report =
        new Date(
            Number(parts[2]),
            Number(parts[1]) - 1,
            Number(parts[0])
        );


    if(report > commentDate)
    {
        errors.push(
            `Привет из будущего. #${reportNumber} — дата отчёта ${reportDate} не может быть позже даты комментария.`
        );
    }
}



/* =====================================================
   Проверка сломанных участников
===================================================== */

function checkBrokenPeople(
    number,
    text
)
{
    const names =
        text.match(
            /(?:Участник|Участники):([\s\S]*?)(?=\n\*{0,2}[А-ЯЁ]|$)/i
        );


    if(!names)
        return;


    const block =
        names[1];


    if(block.trim() === "-")
        return;


    const hasName =
        /[А-ЯЁа-яё]/.test(block);


    const hasId =
        /\[\d+\]/.test(block);


    if(hasName && !hasId)
    {
        errors.push(
            `#${number} — указан участник без ID.`
        );
    }
}



/* =====================================================
   Парсер охоты
===================================================== */

function parseHuntReport(
    number,
    text
)
{
    if(/Название команды:/i.test(text))
        return;


    const dateMatch =
        text.match(
            /Дата:\s*\*?(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)/i
        );


    if(!dateMatch)
    {
        errors.push(
            `#${number} — не найдена дата.`
        );

        return;
    }


    let reportDate =
        dateMatch[1];


    let parts =
        reportDate.split(".");


    if(parts.length === 2)
    {
        parts.push(
            String(new Date().getFullYear())
        );
    }


    if(parts[2].length === 2)
    {
        parts[2] =
            "20" + parts[2];
    }


    parts[0] =
        parts[0].padStart(2, "0");

    parts[1] =
        parts[1].padStart(2, "0");


    reportDate =
        parts.join(".");


    checkFutureDate(
        number,
        text,
        reportDate
    );


    const typeMatch =
        text.match(
            /Вид:\s*([^;\n]+)/i
        );


    if(!typeMatch)
    {
        errors.push(
            `#${number} — отсутствует поле "Вид".`
        );

        return;
    }


    const type =
        typeMatch[1]
        .trim()
        .toLowerCase();


    const hasLeader =
        /\*{0,2}Ведущий\*{0,2}\s*:/i
        .test(text);


    if(!hasLeader)
    {
        const allowedTypes =
        [
            "свободная",
            "на мышей"
        ];


        if(!allowedTypes.includes(type))
        {
            errors.push(
                `#${number} — неизвестный вид охоты: "${typeMatch[1].trim()}". Допустимо: свободная или на мышей.`
            );

            return;
        }
    }


    text =
        text.replace(
            /\*{0,2}(Север|Ветер):\*{0,2}[\s\S]*?(?=\*{0,2}[А-ЯЁ]|$)/gi,
            ""
        );


    checkBrokenPeople(
        number,
        text
    );


    if(
        !/История/i.test(text) &&
        !/Ведущий:/i.test(text)
    )
    {
        errors.push(
            `#${number} — отсутствует история.`
        );
    }


    if(
        type.includes("утрен") ||
        type.includes("вечер") ||
        type.includes("ноч") ||
        type.includes("днев")
    )
    {
        if(!/Место охоты:/i.test(text))
        {
            errors.push(
                `#${number} — отсутствует место охоты.`
            );
        }
    }


    if(type.includes("мыш"))
    {
        const participant =
            text.match(
                /\*{0,2}Участник:\*{0,2}[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i
            );


        if(!participant)
        {
            errors.push(
                `#${number} — не найден участник.`
            );

            return;
        }


        const id =
            participant[1];


        const points =
            Number(
                participant[2]
                .replace(",", ".")
            );


        addMouse(
            id,
            points,
            reportDate,
            number
        );


        return;
    }


    const single =
        text.match(
            /Участник:([\s\S]*?)(?=\n[A-ЯЁ]|$)/i
        );


    if(single)
    {
        const people =
            parsePeople(single[1]);


        if(people.length === 0)
        {
            errors.push(
                `#${number} — неверный участник.`
            );
        }


        for(const person of people)
        {
            if(person.points == null)
            {
                errors.push(
                    `#${number} — нет баллов у ${person.id}.`
                );

                continue;
            }


            addHunt(
                person.id,
                person.points,
                reportDate,
                number
            );
        }
    }


    const multi =
        text.match(
            /\*{0,2}Участники:\*{0,2}\s*([\s\S]*?)(?:;)?\s*(?=\*{0,2}Таскающие:|\*{0,2}Север:|\*{0,2}Ветер:|$)/i
        );


    if(multi)
    {
        let participantText =
            multi[1]
            .replace(/;/g, "")
            .trim();


        if(
            participantText !== "-" &&
            participantText !== ""
        )
        {
            const people =
                parsePeople(
                    participantText
                );


            for(const person of people)
            {
                if(person.points == null)
                {
                    errors.push(
                        `#${number} — нет баллов у ${person.id}.`
                    );

                    continue;
                }


                addHunt(
                    person.id,
                    person.points,
                    reportDate,
                    number
                );
            }
        }
    }


    const leader =
        text.match(
            /Ведущий:\*{0,2}[\s\S]*?\[(\d+)\]\s*\(([\d.,]+)\)/i
        );


    if(leader)
    {
        const id =
            leader[1];


        const points =
            Number(
                leader[2]
                .replace(",", ".")
            );


        addLead(id);


        let alreadyParticipant = false;


        if(single)
        {
            alreadyParticipant =
                parsePeople(
                    single[1]
                )
                .some(
                    p => p.id === id
                );
        }


        if(multi)
        {
            alreadyParticipant =
                alreadyParticipant ||
                parsePeople(
                    multi[1]
                )
                .some(
                    p => p.id === id
                );
        }


        if(!alreadyParticipant)
        {
            addHunt(
                id,
                points,
                reportDate,
                number
            );
        }
    }
    else if(
        type.includes("утрен") ||
        type.includes("вечер") ||
        type.includes("ноч") ||
        type.includes("днев")
    )
    {
        errors.push(
            `#${number} — отсутствует ведущий.`
        );
    }


    const carriers =
        text.match(
            /\*{0,2}Таскающие:\*{0,2}([\s\S]*?)(?=\n\*{0,2}[А-ЯЁ]|$)/i
        );


    if(carriers)
    {
        const ids =
            parseIds(
                carriers[1]
            );


        for(const id of ids)
        {
            addHunt(
                id,
                2.5,
                reportDate
            );
        }
    }


    if(
        !single &&
        !multi &&
        !type.includes("мыш")
    )
    {
        errors.push(
            `#${number} — отсутствуют участники.`
        );
    }
}



/* =====================================================
   Ограничения охоты
===================================================== */

function checkDailyLimits()
{
    for(const player of Object.values(players))
    {
        for(const date in player.dates)
        {
            const data =
                player.dates[date];


            if(data.hunt > 5)
            {
                errors.push(
                    `Игрок ${player.id} уже получил максимум дичи за ${date}, комментарии того дня: ${data.huntReports.join(", ")}`
                );


                const excess =
                    data.hunt - 5;


                player.hunt -= excess;

                data.hunt = 5;
            }


            if(data.mouse > 5)
            {
                errors.push(
                    `Игрок ${player.id} уже получил максимум мышей за ${date}, комментарии того дня: ${data.mouseReports.join(", ")}`
                );


                const excess =
                    data.mouse - 5;


                player.mouse -= excess;

                data.mouse = 5;
            }
        }
    }
}



/* =====================================================
   Вывод ошибок охоты
===================================================== */

function drawErrors()
{
    errorsBox.innerHTML = "";


    if(errors.length === 0)
    {
        errorsBox.innerHTML =
            "<div class='success'>Ошибок не найдено.</div>";

        return;
    }


    for(const error of errors)
    {
        const div =
            document.createElement("div");


        div.className =
            "error";


        div.textContent =
            error;


        errorsBox.appendChild(div);
    }
}



/* =====================================================
   Вывод результатов охоты
===================================================== */

function drawResults()
{
    resultsBody.innerHTML = "";


    const list =
        Object.values(players);


    list.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );


    totalPlayers.textContent =
        "Игроков: " + list.length;


    if(list.length === 0)
    {
        resultsBody.innerHTML = `
            <tr class="placeholderRow">
                <td colspan="4">
                    Пока нет данных.
                </td>
            </tr>
        `;

        return;
    }


    for(const player of list)
    {
        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td class="idCell">
                ${player.id}
            </td>

            <td class="scoreCell">
                ${formatNumber(player.hunt)}
            </td>

            <td class="leadCell">
                ${player.lead}
            </td>

            <td class="mouseCell">
                ${formatNumber(player.mouse)}
            </td>
        `;


        resultsBody.appendChild(row);
    }
}



/* =====================================================
   Формат чисел
===================================================== */

function formatNumber(value)
{
    if(Number.isInteger(value))
        return value;


    return value
        .toFixed(1)
        .replace(".", ",");
}



/* =====================================================
   Копирование охоты
===================================================== */

function copyResult()
{
    const list =
        Object.values(players);


    if(list.length === 0)
        return;


    list.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );


    let result = "";


    for(const player of list)
    {
        result +=
            `${player.id}\t${formatNumber(player.hunt)}\t${player.lead}\t${formatNumber(player.mouse)}\n`;
    }


    navigator.clipboard.writeText(result);


    copyBtn.textContent =
        "Скопировано!";


    setTimeout(() =>
    {
        copyBtn.textContent =
            "Копировать результат";
    },1500);
}



/* =====================================================
   Кнопки охоты
===================================================== */

calculateBtn.addEventListener(
    "click",
    calculate
);


clearBtn.addEventListener(
    "click",
    () =>
    {
        reportsArea.value = "";

        clearAll();
    }
);


copyBtn.addEventListener(
    "click",
    copyResult
);


drawErrors();

drawResults();


// ============================================================
// БОГ — РАСЧЁТ
// ============================================================

const BOG_PATROL_POINTS = 1;
const BOG_LEADER_BONUS = 2;
const BOG_LEADING_POINTS = 1.5;

// Обязательные времена патрулей
const BOG_PATROL_TIMES = [
    "09:00",
    "11:00",
    "15:00",
    "18:00",
    "21:00",
    "23:00"
];


// ------------------------------------------------------------
// DOM
// ------------------------------------------------------------

const bogReportsArea = document.getElementById("bogReports");
const bogCalculateBtn = document.getElementById("bogCalculateBtn");
const bogClearBtn = document.getElementById("bogClearBtn");
const bogCopyBtn = document.getElementById("bogCopyBtn");

const bogResultsBody = document.getElementById("bogResultsBody");
const bogErrorsBox = document.getElementById("bogErrors");
const bogTotalPlayers = document.getElementById("bogTotalPlayers");

const bogMissingPatrols = document.getElementById("bogMissingPatrols");
const bogMissingPatrolsCount = document.getElementById("bogMissingPatrolsCount");


// ------------------------------------------------------------
// Вспомогательные функции
// ------------------------------------------------------------

function cleanBogText(text) {
    return String(text || "")
        .replace(/\r/g, "")
        .replace(/\[u\]/gi, "")
        .replace(/\[\/u\]/gi, "")
        .replace(/\[b\]/gi, "")
        .replace(/\[\/b\]/gi, "")
        .replace(/\*\*/g, "")
        .trim();
}


// Проверяем начало отчёта.
// Поддерживаются:
//
// **Патруль**
// [u][b]Патруль[/b][/u]
//
// **Дозор**
// [u][b]Дозор[/b][/u]
//
function isBogPatrolHeader(line) {
    return cleanBogText(line).toLowerCase() === "патруль";
}

function isBogWatchHeader(line) {
    return cleanBogText(line).toLowerCase() === "дозор";
}


// ------------------------------------------------------------
// Разделение текста на отчёты
// ------------------------------------------------------------

function splitBogReports(text) {
    const lines = String(text || "").split("\n");

    const reports = [];
    let current = null;

    for (let i = 0; i < lines.length; i++) {
        const originalLine = lines[i];
        const cleanLine = cleanBogText(originalLine);

        if (isBogPatrolHeader(originalLine)) {

            if (current) {
                reports.push(current);
            }

            current = {
                type: "patrol",
                lines: [originalLine]
            };

            continue;
        }

        if (isBogWatchHeader(originalLine)) {

            if (current) {
                reports.push(current);
            }

            current = {
                type: "watch",
                lines: [originalLine]
            };

            continue;
        }

        if (current) {
            current.lines.push(originalLine);
        }
    }

    if (current) {
        reports.push(current);
    }

    return reports;
}


// ------------------------------------------------------------
// Получение значения поля
// ------------------------------------------------------------

function getBogField(text, fieldName) {

    const lines = String(text || "").split("\n");

    const wanted = fieldName.toLowerCase();

    for (let i = 0; i < lines.length; i++) {

        const line = cleanBogText(lines[i]);

        const colonIndex = line.indexOf(":");

        if (colonIndex === -1) {
            continue;
        }

        const field = line
            .substring(0, colonIndex)
            .trim()
            .toLowerCase();

        if (field === wanted) {

            return line
                .substring(colonIndex + 1)
                .trim()
                .replace(/[;,]\s*$/, "")
                .trim();
        }
    }

    return "";
}


// ------------------------------------------------------------
// ID из [123456]
// ------------------------------------------------------------

function getBogIds(text) {

    const result = [];
    const regex = /\[(\d+)\]/g;

    let match;

    while ((match = regex.exec(String(text || ""))) !== null) {
        result.push(match[1]);
    }

    return result;
}


// ------------------------------------------------------------
// Игрок
// ------------------------------------------------------------

function createBogPlayer(id) {

    return {
        id: String(id),
        patrolPoints: 0,
        leadingPoints: 0,
        watchMinutes: 0
    };
}


// ------------------------------------------------------------
// Добавить игрока
// ------------------------------------------------------------

function getOrCreateBogPlayer(players, id) {

    id = String(id);

    if (!players[id]) {
        players[id] = createBogPlayer(id);
    }

    return players[id];
}


// ------------------------------------------------------------
// Патруль
// ------------------------------------------------------------

function addBogPatrol(players, id, isLeader) {

    const player = getOrCreateBogPlayer(players, id);

    // Обычный балл за патруль
    player.patrolPoints += BOG_PATROL_POINTS;

    // Дополнительные баллы ведущему
    if (isLeader) {
        player.patrolPoints += BOG_LEADER_BONUS;
        player.leadingPoints += BOG_LEADING_POINTS;
    }
}


// ------------------------------------------------------------
// Дозор
// ------------------------------------------------------------

function addBogWatchTime(players, id, minutes) {

    const player = getOrCreateBogPlayer(players, id);

    player.watchMinutes += Math.max(0, Math.floor(minutes));
}


// ------------------------------------------------------------
// Дата и время
// ------------------------------------------------------------

function parseBogDateTime(value) {

    if (!value) {
        return null;
    }

    let text = String(value)
        .trim()
        .replace(",", " ");

    // 24.09 11:00
    // 24.09.2026 11:00
    // 24.09 11.00
    const match = text.match(
        /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\s+(\d{1,2})[:.](\d{2})$/
    );

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);

    let year = match[3]
        ? Number(match[3])
        : new Date().getFullYear();

    if (year < 100) {
        year += 2000;
    }

    const hour = Number(match[4]);
    const minute = Number(match[5]);

    if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31 ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {
        return null;
    }

    const date = new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        0,
        0
    );

    // Защита от 31.02 и подобных дат
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute
    ) {
        return null;
    }

    return date;
}


// ------------------------------------------------------------
// Проверка необычного формата даты
// Формат не блокирует расчёт
// ------------------------------------------------------------

function checkBogDateFormat(value) {

    if (!value) {
        return false;
    }

    return !/^\d{1,2}\.\d{1,2}(?:\.\d{2,4})?\s*,?\s*\d{1,2}[:.]\d{2}$/.test(
        String(value).trim()
    );
}


// ------------------------------------------------------------
// Пустышка патруля
//
// Старый вариант:
// Патруль 18 2 маршрут -
//
// Оставляем поддержку этого формата.
// ------------------------------------------------------------

function parseBogMissingPatrol(text) {

    const cleaned = cleanBogText(text);

    const match = cleaned.match(
        /^Патруль\s+(\d+)\s+([12])\s+маршрут\s*-\s*$/i
    );

    if (!match) {
        return null;
    }

    return {
        number: Number(match[1]),
        route: Number(match[2])
    };
}


// ------------------------------------------------------------
// Патруль
// ------------------------------------------------------------

function parseBogPatrol(reportText, players, errors, patrolReports) {

    // Если это старый placeholder — больше не считаем его
    // обычным патрулём.
    const missing = parseBogMissingPatrol(reportText);

    if (missing) {
        return;
    }

    const dateValue = getBogField(
        reportText,
        "Дата и время"
    );

    const routeValue = getBogField(
        reportText,
        "Маршрут"
    );

    const leaderValue = getBogField(
        reportText,
        "Ведущий"
    );

    const participantsValue = getBogField(
        reportText,
        "Участники"
    );

    // --------------------------------------------------------
    // Север и Ветер намеренно НЕ читаем.
    // Их отсутствие НЕ является ошибкой.
    // --------------------------------------------------------

    if (!dateValue) {
        errors.push("Патруль: отсутствует «Дата и время».");
        return;
    }

    if (!routeValue) {
        errors.push("Патруль: отсутствует «Маршрут».");
        return;
    }

    if (!leaderValue) {
        errors.push("Патруль: отсутствует «Ведущий».");
        return;
    }

    if (!participantsValue) {
        errors.push("Патруль: отсутствует «Участники».");
        return;
    }


    // --------------------------------------------------------
    // Дата
    // --------------------------------------------------------

    const patrolDate = parseBogDateTime(dateValue);

    if (!patrolDate) {
        errors.push(
            `Патруль: неправильная дата/время «${dateValue}».`
        );
        return;
    }


    // --------------------------------------------------------
    // Маршрут
    // --------------------------------------------------------

    const routeMatch = String(routeValue).match(/[12]/);

    if (!routeMatch) {
        errors.push(
            `Патруль ${dateValue}: маршрут должен быть 1 или 2.`
        );
        return;
    }

    const route = Number(routeMatch[0]);


    // --------------------------------------------------------
    // ID ведущего
    // --------------------------------------------------------

    const leaderIds = getBogIds(leaderValue);

    if (leaderIds.length === 0) {
        errors.push(
            `Патруль ${dateValue}: у ведущего нет ID.`
        );
        return;
    }

    const leaderId = leaderIds[0];


    // --------------------------------------------------------
    // ID участников
    // --------------------------------------------------------

    const participantIds = getBogIds(participantsValue);

    if (participantIds.length === 0) {
        errors.push(
            `Патруль ${dateValue}: у участников нет ID.`
        );
        return;
    }


    // --------------------------------------------------------
    // Сохраняем реальный патруль
    // --------------------------------------------------------

    patrolReports.push({
        date: patrolDate,
        dateText: dateValue,
        route: route,
        leaderId: leaderId,
        participantIds: participantIds
    });


    // --------------------------------------------------------
    // Участники
    // --------------------------------------------------------

    const uniqueParticipants = [...new Set(participantIds)];

    for (const id of uniqueParticipants) {
        addBogPatrol(
            players,
            id,
            id === leaderId
        );
    }


    // --------------------------------------------------------
    // Ведущий
    //
    // Если его почему-то нет среди участников,
    // всё равно засчитываем ему патруль + ведение.
    // --------------------------------------------------------

    if (!uniqueParticipants.includes(leaderId)) {
        addBogPatrol(
            players,
            leaderId,
            true
        );
    }
}

function getBogPublicationDate(text) {

    const lines = String(text || "").split("\n");

    for (const rawLine of lines) {

        const line = String(rawLine).trim();

        // Примеры:
        //
        // #78 22 сентября в 20:55
        // #78 22 сентября в 20:55 @ Полнолунье
        //
        const match = line.match(
            /#\d+\s+(\d{1,2})\s+([а-яё]+)\s+в\s+(\d{1,2}):(\d{2})/i
        );

        if (!match) {
            continue;
        }

        const day = Number(match[1]);
        const monthName = match[2].toLowerCase();
        const hour = Number(match[3]);
        const minute = Number(match[4]);


        const months = {
            "января": 0,
            "февраля": 1,
            "марта": 2,
            "апреля": 3,
            "мая": 4,
            "июня": 5,
            "июля": 6,
            "августа": 7,
            "сентября": 8,
            "октября": 9,
            "ноября": 10,
            "декабря": 11
        };


        if (!(monthName in months)) {
            continue;
        }


        const currentYear =
            new Date().getFullYear();


        const date = new Date(
            currentYear,
            months[monthName],
            day,
            hour,
            minute,
            0,
            0
        );


        if (
            date.getDate() !== day ||
            date.getMonth() !== months[monthName] ||
            date.getHours() !== hour ||
            date.getMinutes() !== minute
        ) {
            continue;
        }


        return date;
    }


    return null;
}

// ------------------------------------------------------------
// Дозор
// ------------------------------------------------------------

function parseBogWatch(reportText, players, errors) {

    const startValue = getBogField(
        reportText,
        "Дата и время начала"
    );

    const endValue = getBogField(
        reportText,
        "Дата и время конца"
    );

    const placeValue = getBogField(
        reportText,
        "Место дозора"
    );

    const participantValue = getBogField(
        reportText,
        "Участник"
    );


    // Только начало дозора.
    // Такой комментарий не считается.
    if (!endValue) {
        return;
    }


    // --------------------------------------------------------
    // Обязательные поля
    // --------------------------------------------------------

    if (!startValue) {
        errors.push(
            "Дозор: отсутствует «Дата и время начала»."
        );
        return;
    }

    if (!placeValue) {
        errors.push(
            "Дозор: отсутствует «Место дозора»."
        );
        return;
    }

    if (!participantValue) {
        errors.push(
            "Дозор: отсутствует «Участник»."
        );
        return;
    }


    // --------------------------------------------------------
    // Даты
    // --------------------------------------------------------

    const startDate = parseBogDateTime(startValue);
    const endDate = parseBogDateTime(endValue);

    if (!startDate) {
        errors.push(
            `Дозор: неправильная дата начала «${startValue}».`
        );
        return;
    }

    if (!endDate) {
        errors.push(
            `Дозор: неправильная дата конца «${endValue}».`
        );
        return;
    }


    // --------------------------------------------------------
    // Конец не может быть раньше начала
    // --------------------------------------------------------

    if (endDate <= startDate) {
        errors.push(
            `Дозор ${startValue}: дата конца раньше или совпадает с началом.`
        );
        return;
    }


    // --------------------------------------------------------
    // ID участника
    // --------------------------------------------------------

    const ids = getBogIds(participantValue);

    if (ids.length === 0) {
        errors.push(
            `Дозор ${startValue}: у участника нет ID.`
        );
        return;
    }

    const participantId = ids[0];


    // --------------------------------------------------------
    // Время дозора — только минуты
    // --------------------------------------------------------

    const milliseconds =
        endDate.getTime() - startDate.getTime();

    const minutes =
        Math.floor(milliseconds / 60000);


    addBogWatchTime(
        players,
        participantId,
        minutes
    );


    // --------------------------------------------------------
    // Проверяем, не был ли дозор отписан позже 12 часов
    // после его окончания
    // --------------------------------------------------------

    const publicationDate =
        getBogPublicationDate(reportText);

    if (publicationDate) {

        const twelveHours =
            12 * 60 * 60 * 1000;

        const lateLimit =
            endDate.getTime() + twelveHours;


        if (publicationDate.getTime() > lateLimit) {

            const lateHours =
                (
                    publicationDate.getTime() -
                    endDate.getTime()
                ) / (60 * 60 * 1000);

            errors.push(
                `Дозор ${startValue} — ${endValue}: отчёт отписан спустя ${formatBogNumber(lateHours)} ч. после окончания.`
            );
        }
    }
}

// ------------------------------------------------------------
// Числа
// ------------------------------------------------------------

function formatBogNumber(value) {

    const number = Number(value) || 0;

    if (Number.isInteger(number)) {
        return String(number);
    }

    return number
        .toFixed(1)
        .replace(".", ",");
}


// ============================================================
// ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПАТРУЛЕЙ
// ============================================================
//
// Для каждой даты, которая встречается в отчётах,
// ожидаются:
//
// 09:00 маршрут 1
// 09:00 маршрут 2
//
// 11:00 маршрут 1
// 11:00 маршрут 2
//
// и т.д.
//
// Если какого-то отчёта нет — выводим:
//
// 11:00 24.09
//
// Один раз, независимо от того, какой маршрут отсутствует.
// ============================================================

function checkBogRequiredPatrols(patrolReports, missingPatrols) {

    if (!patrolReports || patrolReports.length === 0) {
        return;
    }


    // --------------------------------------------------------
    // Собираем даты, на которые есть хотя бы один патруль
    // --------------------------------------------------------

    const dates = new Map();

    for (const patrol of patrolReports) {

        const d = patrol.date;

        const key =
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0");

        if (!dates.has(key)) {
            dates.set(key, {
                date: d,
                routes: {}
            });
        }

        const day = dates.get(key);

        const hour = d.getHours();
        const minute = d.getMinutes();

        const time =
            String(hour).padStart(2, "0") +
            ":" +
            String(minute).padStart(2, "0");

        if (!day.routes[time]) {
            day.routes[time] = new Set();
        }

        day.routes[time].add(
            Number(patrol.route)
        );
    }


    // --------------------------------------------------------
    // Проверяем каждый день
    // --------------------------------------------------------

    for (const day of dates.values()) {

        for (const requiredTime of BOG_PATROL_TIMES) {

            const routes =
                day.routes[requiredTime] || new Set();


            // НЕТ маршрута 1
            if (!routes.has(1)) {

                missingPatrols.push({
                    date: day.date,
                    time: requiredTime,
                    route: 1
                });
            }


            // НЕТ маршрута 2
            if (!routes.has(2)) {

                missingPatrols.push({
                    date: day.date,
                    time: requiredTime,
                    route: 2
                });
            }
        }
    }
}


// ------------------------------------------------------------
// Формат даты для «Неотписанные патрули»
// ------------------------------------------------------------

function formatBogMissingDate(date) {

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    return `${day}.${month}`;
}


// ------------------------------------------------------------
// Вывод ошибок
// ------------------------------------------------------------

function drawBogErrors(errors) {

    if (!bogErrorsBox) {
        return;
    }

    if (!errors || errors.length === 0) {

        bogErrorsBox.innerHTML =
            `<div class="empty-message">Ошибок не найдено.</div>`;

        return;
    }

    bogErrorsBox.innerHTML =
        errors
            .map(error =>
                `<div class="error-item">${error}</div>`
            )
            .join("");
}


// ------------------------------------------------------------
// Вывод неотписанных патрулей
// ------------------------------------------------------------

function drawBogMissingPatrols(missingPatrols) {

    if (!bogMissingPatrols) {
        return;
    }

    if (!missingPatrols || missingPatrols.length === 0) {

        bogMissingPatrols.innerHTML =
            `<div class="empty-message">Все обязательные патрули отписаны.</div>`;

        if (bogMissingPatrolsCount) {
            bogMissingPatrolsCount.textContent = "0";
        }

        return;
    }


    // Удаляем возможные дубли
    const unique = [];
    const seen = new Set();

    for (const patrol of missingPatrols) {

        const key =
            formatBogMissingDate(patrol.date) +
            "|" +
            patrol.time +
            "|" +
            patrol.route;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        unique.push(patrol);
    }


    // Сортировка по дате / времени / маршруту
    unique.sort((a, b) => {

        const dateA = a.date.getTime();
        const dateB = b.date.getTime();

        if (dateA !== dateB) {
            return dateA - dateB;
        }

        if (a.time !== b.time) {
            return a.time.localeCompare(b.time);
        }

        return a.route - b.route;
    });


    bogMissingPatrols.innerHTML =
        unique
            .map(patrol => {

                return `
                    <div class="bog-missing-patrol">
                        ${patrol.time} ${formatBogMissingDate(patrol.date)}
                    </div>
                `;
            })
            .join("");


    if (bogMissingPatrolsCount) {
        bogMissingPatrolsCount.textContent =
            String(unique.length);
    }
}


// ------------------------------------------------------------
// Вывод результатов
// ------------------------------------------------------------

function drawBogResults(players) {

    if (!bogResultsBody) {
        return;
    }

    const list = Object.values(players);

    if (list.length === 0) {

        bogResultsBody.innerHTML = `
            <tr class="placeholderRow">
                <td colspan="4">Пока нет данных.</td>
            </tr>
        `;

        if (bogTotalPlayers) {
            bogTotalPlayers.textContent = "Игроков: 0";
        }

        return;
    }

    list.sort((a, b) => {
        const idA = Number(a.id);
        const idB = Number(b.id);

        return idA - idB;
    });

    bogResultsBody.innerHTML =
        list
            .map(player => {

                return `
                    <tr>
                        <td class="idCell">${player.id}</td>

                        <td class="scoreCell">
                            ${formatBogNumber(player.patrolPoints)}
                        </td>

                        <td class="watchCell">
                            ${player.watchMinutes}
                        </td>

                        <td class="leadCell">
                            ${formatBogNumber(player.leadingPoints)}
                        </td>
                    </tr>
                `;
            })
            .join("");

    if (bogTotalPlayers) {
        bogTotalPlayers.textContent =
            `Игроков: ${list.length}`;
    }
}
// ============================================================
// ОСНОВНОЙ РАСЧЁТ БОГ
// ============================================================

function calculateBog() {

    if (!bogReportsArea) {
        return;
    }


    const text = bogReportsArea.value || "";


    // --------------------------------------------------------
    // Состояние
    // --------------------------------------------------------

    const players = {};
    const errors = [];
    const patrolReports = [];
    const missingPatrols = [];


    // --------------------------------------------------------
    // Разбираем отчёты
    // --------------------------------------------------------

    const reports = splitBogReports(text);


    if (reports.length === 0) {

        drawBogErrors([
            "Не найдено ни одного отчёта «Патруль» или «Дозор»."
        ]);

        drawBogMissingPatrols([]);
        drawBogResults({});

        return;
    }


    // --------------------------------------------------------
    // Парсинг
    // --------------------------------------------------------

    for (const report of reports) {

        const reportText =
            report.lines.join("\n");

        if (report.type === "patrol") {

            parseBogPatrol(
                reportText,
                players,
                errors,
                patrolReports
            );

        } else if (report.type === "watch") {

            parseBogWatch(
                reportText,
                players,
                errors
            );
        }
    }


    // --------------------------------------------------------
    // Проверяем обязательные патрули
    // --------------------------------------------------------

    checkBogRequiredPatrols(
        patrolReports,
        missingPatrols
    );


    // --------------------------------------------------------
    // Вывод
    // --------------------------------------------------------

    drawBogErrors(errors);
    drawBogMissingPatrols(missingPatrols);
    drawBogResults(players);
}


// ============================================================
// КОПИРОВАНИЕ
// ============================================================

function copyBogResult() {

    if (!bogResultsBody) {
        return;
    }

    const rows =
        bogResultsBody.querySelectorAll("tr");

    const output = [];

    for (const row of rows) {

        const cells =
            row.querySelectorAll("th, td");

        if (cells.length !== 4) {
            continue;
        }

        const values =
            Array.from(cells).map(
                cell => cell.innerText.trim()
            );

        if (values[0] === "Пока нет данных.") {
            continue;
        }

        output.push(
            values.join("\t")
        );
    }


    if (output.length === 0) {
        return;
    }


    const text =
        output.join("\n");


    navigator.clipboard.writeText(text)
        .then(() => {

            if (bogCopyBtn) {

                const oldText =
                    bogCopyBtn.textContent;

                bogCopyBtn.textContent =
                    "Скопировано!";

                setTimeout(() => {

                    bogCopyBtn.textContent =
                        oldText;

                }, 1200);
            }

        })
        .catch(() => {
            console.log(
                "Не удалось скопировать результат."
            );
        });
}


// ============================================================
// ОЧИСТКА
// ============================================================

function clearBog() {

    if (bogReportsArea) {
        bogReportsArea.value = "";
    }

    if (bogErrorsBox) {

        bogErrorsBox.innerHTML =
            `<div class="empty-message">Ошибок пока нет.</div>`;
    }

    if (bogMissingPatrols) {

        bogMissingPatrols.innerHTML =
            `<div class="empty-message">Пока нет данных.</div>`;
    }

    if (bogMissingPatrolsCount) {
        bogMissingPatrolsCount.textContent = "0";
    }

    if (bogResultsBody) {

        bogResultsBody.innerHTML = `
            <tr class="placeholderRow">
                <td colspan="4">Пока нет данных.</td>
            </tr>
        `;
    }

    if (bogTotalPlayers) {
        bogTotalPlayers.textContent = "Игроков: 0";
    }
}


// ============================================================
// КНОПКИ
// ============================================================

if (bogCalculateBtn) {

    bogCalculateBtn.addEventListener(
        "click",
        calculateBog
    );
}


if (bogClearBtn) {

    bogClearBtn.addEventListener(
        "click",
        clearBog
    );
}


if (bogCopyBtn) {

    bogCopyBtn.addEventListener(
        "click",
        copyBogResult
    );
}
