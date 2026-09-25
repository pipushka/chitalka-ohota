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


/* =====================================================
   БОГ
   ===================================================== */

const BOG_PATROL_POINTS = 1;
const BOG_LEADER_BONUS = 2;
const BOG_LEADING_POINTS = 1.5;
const BOG_LATE_HOURS = 12;


/* =====================================================
   ЭЛЕМЕНТЫ
===================================================== */

const bogReportsArea = document.getElementById("bogReports");
const bogCalculateBtn = document.getElementById("bogCalculateBtn");
const bogClearBtn = document.getElementById("bogClearBtn");
const bogCopyBtn = document.getElementById("bogCopyBtn");

const bogResultsBody = document.getElementById("bogResultsBody");
const bogErrorsBox = document.getElementById("bogErrors");
const bogTotalPlayers = document.getElementById("bogTotalPlayers");

const bogMissingPatrols = document.getElementById("bogMissingPatrols");
const bogMissingPatrolsCount =
    document.getElementById("bogMissingPatrolsCount");


/* =====================================================
   ДАННЫЕ
===================================================== */

let bogPlayers = {};
let bogErrors = [];
let bogMissingPatrolList = [];


/* =====================================================
   ОЧИСТКА BB-CODE
===================================================== */

function cleanBogText(text)
{
    return text
        .replace(/\[\/?u\]/gi, "")
        .replace(/\[\/?b\]/gi, "")
        .replace(/\*\*/g, "")
        .replace(/\r/g, "")
        .trim();
}


/* =====================================================
   ОПРЕДЕЛЕНИЕ ЗАГОЛОВКА
===================================================== */

function isBogPatrolHeader(line)
{
    const value =
        cleanBogText(line)
            .replace(/[.:;]/g, "")
            .trim()
            .toLowerCase();

    return value === "патруль";
}


function isBogWatchHeader(line)
{
    const value =
        cleanBogText(line)
            .replace(/[.:;]/g, "")
            .trim()
            .toLowerCase();

    return value === "дозор";
}


/* =====================================================
   РАЗБИВКА НА ОТЧЁТЫ

   НИКАКИХ # ЗДЕСЬ НЕТ.

   Ищем только:

   **Патруль**
   ...
   **Дозор**
   ...

===================================================== */

function splitBogReports(text)
{
    const lines =
        text.split("\n");

    const reports = [];

    let current = null;


    for(let i = 0; i < lines.length; i++)
    {
        const line =
            lines[i].trim();


        if(isBogPatrolHeader(line))
        {
            if(current)
                reports.push(current);


            current =
            {
                type:"patrol",
                lines:[line]
            };

            continue;
        }


        if(isBogWatchHeader(line))
        {
            if(current)
                reports.push(current);


            current =
            {
                type:"watch",
                lines:[line]
            };

            continue;
        }


        if(current)
        {
            current.lines.push(line);
        }
    }


    if(current)
        reports.push(current);


    return reports.map(report =>
    {
        return {
            type:report.type,
            text:report.lines.join("\n")
        };
    });
}


/* =====================================================
   ПОЛЕ

   Ищем строку:

   **Участник:** Имя [123];

   или:

   [b]Участник:[/b] Имя [123];

===================================================== */

function getBogField(text, fieldName)
{
    const lines =
        text.split("\n");


    const wanted =
        fieldName.toLowerCase();


    for(const originalLine of lines)
    {
        let line =
            cleanBogText(
                originalLine
            );


        const colon =
            line.indexOf(":");


        if(colon === -1)
            continue;


        const field =
            line
                .slice(0, colon)
                .trim()
                .toLowerCase();


        if(field !== wanted)
            continue;


        return line
            .slice(colon + 1)
            .trim()
            .replace(/[.;]\s*$/, "")
            .trim();
    }


    return null;
}


/* =====================================================
   ID
===================================================== */

function getBogIds(text)
{
    if(!text)
        return [];


    const ids = [];
    const used = new Set();

    const regex =
        /\[(\d+)\]/g;


    let match;


    while((match = regex.exec(text)) !== null)
    {
        const id =
            match[1];


        if(used.has(id))
            continue;


        used.add(id);

        ids.push(id);
    }


    return ids;
}


function getBogId(text)
{
    const ids =
        getBogIds(text);


    return ids.length
        ? ids[0]
        : null;
}


/* =====================================================
   ИГРОК
===================================================== */

function createBogPlayer(id)
{
    if(!id)
        return null;


    if(!bogPlayers[id])
    {
        bogPlayers[id] =
        {
            id:id,
            patrolPoints:0,
            leadingPoints:0,
            watchMinutes:0
        };
    }


    return bogPlayers[id];
}


/* =====================================================
   ПАТРУЛЬ
===================================================== */

function addBogPatrol(id, leader)
{
    const player =
        createBogPlayer(id);


    if(!player)
        return;


    player.patrolPoints +=
        BOG_PATROL_POINTS;


    if(leader)
    {
        player.patrolPoints +=
            BOG_LEADER_BONUS;


        player.leadingPoints +=
            BOG_LEADING_POINTS;
    }
}


/* =====================================================
   ДОЗОР
===================================================== */

function addBogWatchTime(id, minutes)
{
    const player =
        createBogPlayer(id);


    if(!player)
        return;


    player.watchMinutes +=
        minutes;
}


/* =====================================================
   ДАТА
===================================================== */

function parseBogDateTime(value)
{
    if(!value)
        return null;


    /*
       Поддерживаются:

       21.06, 15:00
       21.06. 15.00
       21.06 15:00
       21.06.2026, 15:00
    */

    const match =
        value.match(
            /^\s*(\d{1,2})\s*[./-]\s*(\d{1,2})(?:\s*[./-]\s*(\d{2,4}))?\s*,?\s*(\d{1,2})\s*[:.]\s*(\d{2})\s*$/
        );


    if(!match)
        return null;


    let year =
        match[3]
            ? Number(match[3])
            : new Date().getFullYear();


    if(year < 100)
        year += 2000;


    const day =
        Number(match[1]);

    const month =
        Number(match[2]) - 1;

    const hour =
        Number(match[4]);

    const minute =
        Number(match[5]);


    const date =
        new Date(
            year,
            month,
            day,
            hour,
            minute
        );


    if(
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute
    )
    {
        return null;
    }


    return date;
}


/* =====================================================
   ПРОВЕРКА ФОРМАТА ДАТЫ

   Нестандартная точка не ломает расчёт.
===================================================== */

function checkBogDateFormat(fieldName, value)
{
    if(!value)
        return;


    const valid =
        /^\s*\d{1,2}\s*[./-]\s*\d{1,2}(?:\s*[./-]\s*\d{2,4})?\s*,?\s*\d{1,2}\s*[:.]\s*\d{2}\s*$/
            .test(value);


    if(!valid)
    {
        bogErrors.push(
            `БОГ — поле "${fieldName}" имеет необычный формат: ${value}`
        );
    }
}


/* =====================================================
   ПУСТЫШКА ПАТРУЛЯ

   Например:

   Патруль 18 2 маршрут -

   Это НЕ обычный отчёт.

   Он означает неотписанный патруль.
===================================================== */

function parseBogMissingPatrol(text)
{
    const clean =
        cleanBogText(text);


    const match =
        clean.match(
            /Патруль\s+(\d+)\s+([12])\s+маршрут\s*-\s*$/i
        );


    if(!match)
        return false;


    bogMissingPatrolList.push(
    {
        number:Number(match[1]),
        route:Number(match[2])
    });


    return true;
}


/* =====================================================
   ПАТРУЛЬ
===================================================== */

function parseBogPatrol(text)
{
    /*
       Сначала проверяем пустышку.
    */

    if(parseBogMissingPatrol(text))
        return;


    const dateValue =
        getBogField(
            text,
            "Дата и время"
        );


    const routeValue =
        getBogField(
            text,
            "Маршрут"
        );


    const leaderValue =
        getBogField(
            text,
            "Ведущий"
        );


    const participantsValue =
        getBogField(
            text,
            "Участники"
        );


    const northValue =
        getBogField(
            text,
            "Север"
        );


    const windValue =
        getBogField(
            text,
            "Ветер"
        );


    /* ---------- Проверка шаблона ---------- */

    if(!dateValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Дата и время»."
        );
    }


    if(!routeValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Маршрут»."
        );
    }


    if(!leaderValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Ведущий»."
        );
    }


    if(!participantsValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Участники»."
        );
    }


    if(!northValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Север»."
        );
    }


    if(!windValue)
    {
        bogErrors.push(
            "Патруль — отсутствует поле «Ветер»."
        );
    }


    /* ---------- Дата ---------- */

    if(dateValue)
    {
        checkBogDateFormat(
            "Дата и время",
            dateValue
        );


        const date =
            parseBogDateTime(
                dateValue
            );


        if(!date)
        {
            bogErrors.push(
                `Патруль — невозможно распознать дату: ${dateValue}`
            );
        }
    }


    /* ---------- Маршрут ---------- */

    if(
        routeValue &&
        !/^[12]$/.test(
            routeValue.trim()
        )
    )
    {
        bogErrors.push(
            `Патруль — маршрут должен быть 1 или 2: ${routeValue}`
        );
    }


    /* ---------- Ведущий ---------- */

    const leaderId =
        getBogId(
            leaderValue
        );


    if(
        leaderValue &&
        !leaderId
    )
    {
        bogErrors.push(
            "Патруль — у ведущего не найден ID."
        );
    }


    /* ---------- Участники ---------- */

    const participantIds =
        getBogIds(
            participantsValue
        );


    if(
        participantsValue &&
        participantIds.length === 0 &&
        participantsValue.trim() !== "-"
    )
    {
        bogErrors.push(
            "Патруль — у участников не найдено ни одного ID."
        );
    }


    /* ---------- Начисление ---------- */

    for(const id of participantIds)
    {
        addBogPatrol(
            id,
            id === leaderId
        );
    }


    /*
       Ведущий не обязан быть повторно
       записан в список участников.

       Поэтому если его там нет,
       всё равно начисляем ему патруль.
    */

    if(
        leaderId &&
        !participantIds.includes(
            leaderId
        )
    )
    {
        addBogPatrol(
            leaderId,
            true
        );
    }
}


/* =====================================================
   ДОЗОР
===================================================== */

function parseBogWatch(text)
{
    const startValue =
        getBogField(
            text,
            "Дата и время начала"
        );


    const endValue =
        getBogField(
            text,
            "Дата и время конца"
        );


    const placeValue =
        getBogField(
            text,
            "Место дозора"
        );


    const participantValue =
        getBogField(
            text,
            "Участник"
        );


    /*
       Только начало дозора —
       НЕ считаем.
    */

    if(
        startValue &&
        !endValue
    )
    {
        return;
    }


    if(!startValue)
    {
        bogErrors.push(
            "Дозор — отсутствует поле «Дата и время начала»."
        );
    }


    if(!endValue)
    {
        bogErrors.push(
            "Дозор — отсутствует поле «Дата и время конца»."
        );
    }


    if(!placeValue)
    {
        bogErrors.push(
            "Дозор — отсутствует поле «Место дозора»."
        );
    }


    if(!participantValue)
    {
        bogErrors.push(
            "Дозор — отсутствует поле «Участник»."
        );
    }


    const startDate =
        parseBogDateTime(
            startValue
        );


    const endDate =
        parseBogDateTime(
            endValue
        );


    if(startValue)
    {
        checkBogDateFormat(
            "Дата и время начала",
            startValue
        );
    }


    if(endValue)
    {
        checkBogDateFormat(
            "Дата и время конца",
            endValue
        );
    }


    if(
        !startDate ||
        !endDate
    )
    {
        return;
    }


    if(endDate <= startDate)
    {
        bogErrors.push(
            "Дозор — дата конца должна быть позже даты начала."
        );

        return;
    }


    const participantId =
        getBogId(
            participantValue
        );


    if(!participantId)
    {
        bogErrors.push(
            "Дозор — у участника не найден ID."
        );

        return;
    }


    const minutes =
        Math.floor(
            (
                endDate.getTime() -
                startDate.getTime()
            ) / 60000
        );


    addBogWatchTime(
        participantId,
        minutes
    );
}


/* =====================================================
   ВРЕМЯ
===================================================== */

function formatBogMinutes(minutes)
{
    minutes =
        Math.max(
            0,
            Math.floor(minutes)
        );


    const hours =
        Math.floor(
            minutes / 60
        );


    const mins =
        minutes % 60;


    return (
        String(hours).padStart(2,"0")
        +
        ":"
        +
        String(mins).padStart(2,"0")
    );
}


/* =====================================================
   ЧИСЛА
===================================================== */

function formatBogNumber(value)
{
    if(Number.isInteger(value))
        return String(value);


    return String(value)
        .replace(".",",");
}


/* =====================================================
   РАСЧЁТ
===================================================== */

function calculateBog()
{
    bogPlayers = {};
    bogErrors = [];
    bogMissingPatrolList = [];


    const text =
        bogReportsArea.value.trim();


    if(!text)
    {
        bogErrors.push(
            "Поле БОГ пустое."
        );

        drawBogErrors();
        drawBogResults();
        drawBogMissingPatrols();

        return;
    }


    const reports =
        splitBogReports(
            text
        );


    if(reports.length === 0)
    {
        bogErrors.push(
            "Не найдено ни одного отчёта. Каждый отчёт должен начинаться с «**Патруль**» или «**Дозор**»."
        );

        drawBogErrors();
        drawBogResults();
        drawBogMissingPatrols();

        return;
    }


    for(const report of reports)
    {
        if(report.type === "patrol")
        {
            parseBogPatrol(
                report.text
            );
        }


        if(report.type === "watch")
        {
            parseBogWatch(
                report.text
            );
        }
    }


    drawBogErrors();
    drawBogResults();
    drawBogMissingPatrols();
}


/* =====================================================
   ОШИБКИ
===================================================== */

function drawBogErrors()
{
    bogErrorsBox.innerHTML = "";


    if(bogErrors.length === 0)
    {
        bogErrorsBox.innerHTML =
            `<div class="success">
                Ошибок не найдено.
            </div>`;

        return;
    }


    for(const error of bogErrors)
    {
        const div =
            document.createElement("div");


        div.className =
            "error";


        div.textContent =
            error;


        bogErrorsBox.appendChild(
            div
        );
    }
}


/* =====================================================
   НЕОТПИСАННЫЕ ПАТРУЛИ
===================================================== */

function drawBogMissingPatrols()
{
    bogMissingPatrols.innerHTML = "";


    const unique = [];
    const used = new Set();


    for(
        const patrol
        of bogMissingPatrolList
    )
    {
        const key =
            patrol.number +
            ":" +
            patrol.route;


        if(used.has(key))
            continue;


        used.add(key);

        unique.push(
            patrol
        );
    }


    unique.sort(
        (a,b) =>
            a.number -
            b.number
    );


    bogMissingPatrolsCount.textContent =
        unique.length;


    if(unique.length === 0)
    {
        bogMissingPatrols.innerHTML =
            `<div class="placeholder">
                Неотписанных патрулей не найдено.
            </div>`;

        return;
    }


    for(const patrol of unique)
    {
        const div =
            document.createElement("div");


        div.className =
            "bog-missing-patrol";


        div.textContent =
            `Патруль ${patrol.number} — ${patrol.route} маршрут`;


        bogMissingPatrols.appendChild(
            div
        );
    }
}


/* =====================================================
   РЕЗУЛЬТАТЫ
===================================================== */

function drawBogResults()
{
    bogResultsBody.innerHTML = "";


    const players =
        Object.values(
            bogPlayers
        );


    players.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );


    bogTotalPlayers.textContent =
        "Игроков: " +
        players.length;


    if(players.length === 0)
    {
        bogResultsBody.innerHTML =
            `
            <tr class="placeholderRow">
                <td colspan="4">
                    Пока нет данных.
                </td>
            </tr>
            `;

        return;
    }


    for(const player of players)
    {
        const row =
            document.createElement("tr");


        row.innerHTML =
            `
            <td class="idCell">
                ${player.id}
            </td>

            <td class="scoreCell">
                ${formatBogNumber(
                    player.patrolPoints
                )}
            </td>

            <td class="leadCell">
                ${formatBogNumber(
                    player.leadingPoints
                )}
            </td>

            <td class="watchCell">
                ${formatBogMinutes(
                    player.watchMinutes
                )}
            </td>
            `;


        bogResultsBody.appendChild(
            row
        );
    }
}


/* =====================================================
   КОПИРОВАНИЕ
===================================================== */

function copyBogResult()
{
    const players =
        Object.values(
            bogPlayers
        );


    if(players.length === 0)
        return;


    players.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );


    const result =
        players
            .map(player =>
                [
                    player.id,

                    formatBogNumber(
                        player.patrolPoints
                    ),

                    formatBogNumber(
                        player.leadingPoints
                    ),

                    formatBogMinutes(
                        player.watchMinutes
                    )
                ].join("\t")
            )
            .join("\n");


    navigator.clipboard
        .writeText(result)
        .then(() =>
        {
            const oldText =
                bogCopyBtn.textContent;


            bogCopyBtn.textContent =
                "Скопировано!";


            setTimeout(
                () =>
                {
                    bogCopyBtn.textContent =
                        oldText;
                },
                1500
            );
        });
}


/* =====================================================
   ОЧИСТКА
===================================================== */

function clearBog()
{
    bogReportsArea.value = "";

    bogPlayers = {};

    bogErrors = [];

    bogMissingPatrolList = [];


    drawBogErrors();

    drawBogResults();

    drawBogMissingPatrols();
}


/* =====================================================
   КНОПКИ
===================================================== */

if(bogCalculateBtn)
{
    bogCalculateBtn.addEventListener(
        "click",
        calculateBog
    );
}


if(bogClearBtn)
{
    bogClearBtn.addEventListener(
        "click",
        clearBog
    );
}


if(bogCopyBtn)
{
    bogCopyBtn.addEventListener(
        "click",
        copyBogResult
    );
}


/* =====================================================
   НАЧАЛЬНОЕ СОСТОЯНИЕ
===================================================== */

if(bogErrorsBox)
{
    drawBogErrors();
}


if(bogResultsBody)
{
    drawBogResults();
}


if(bogMissingPatrols)
{
    drawBogMissingPatrols();
}
