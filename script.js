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

    if(reportNumber !== undefined)
    {
        player.dates[date]
            .huntReports
            .push(reportNumber);
    }

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

    if(reportNumber !== undefined)
    {
        player.dates[date]
            .mouseReports
            .push(reportNumber);
    }

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
            `#${reportNumber} — дата отчёта ${reportDate} не может быть позже даты комментария.`
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
   =====================================================
   БОГ
   =====================================================
   ===================================================== */

const BOG_PATROL_POINTS = 1;
const BOG_LEADER_BONUS = 2;
const BOG_LEADING_POINTS = 1.5;
const BOG_LATE_HOURS = 12;

const BOG_PATROL_TIMES =
[
    "09:00",
    "11:00",
    "15:00",
    "18:00",
    "21:00",
    "23:00"
];



/* =====================================================
   DOM БОГ
===================================================== */

const bogReportsArea =
    document.getElementById("bogReports");

const bogCalculateBtn =
    document.getElementById("bogCalculateBtn");

const bogClearBtn =
    document.getElementById("bogClearBtn");

const bogCopyBtn =
    document.getElementById("bogCopyBtn");

const bogResultsBody =
    document.getElementById("bogResultsBody");

const bogErrorsBox =
    document.getElementById("bogErrors");

const bogTotalPlayers =
    document.getElementById("bogTotalPlayers");

const bogMissingPatrols =
    document.getElementById("bogMissingPatrols");

const bogMissingPatrolsCount =
    document.getElementById("bogMissingPatrolsCount");



/* =====================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ БОГ
===================================================== */

function cleanBogText(text)
{
    return String(text || "")
        .replace(/\r/g, "")
        .replace(/\[u\]/gi, "")
        .replace(/\[\/u\]/gi, "")
        .replace(/\[b\]/gi, "")
        .replace(/\[\/b\]/gi, "")
        .replace(/\*\*/g, "")
        .trim();
}



function isBogPatrolHeader(line)
{
    return cleanBogText(line)
        .toLowerCase() === "патруль";
}



function isBogWatchHeader(line)
{
    return cleanBogText(line)
        .toLowerCase() === "дозор";
}



/* =====================================================
   Разделение БОГ-отчётов
===================================================== */

function splitBogReports(text)
{
    const lines =
        String(text || "").split("\n");

    const reports = [];

    let current = null;
    let pendingCommentNumber = null;
    let pendingPublicationDate = null;

    for(let i = 0; i < lines.length; i++)
    {
        const originalLine =
            lines[i];

        const cleanLine =
            cleanBogText(originalLine);

        const commentMatch =
            originalLine.match(
                /#(\d+)\s+(\d{1,2})\s+([а-яё]+)\s+в\s+(\d{1,2})[:.](\d{2})/i
            );

        if(commentMatch)
        {
            pendingCommentNumber =
                commentMatch[1];

            pendingPublicationDate =
                parseBogPublicationLine(
                    originalLine
                );
        }

        if(isBogPatrolHeader(originalLine))
        {
            if(current)
                reports.push(current);

            current =
            {
                type:"patrol",
                commentNumber:
                    pendingCommentNumber,
                publicationDate:
                    pendingPublicationDate,
                lines:[originalLine]
            };

            pendingCommentNumber = null;
            pendingPublicationDate = null;

            continue;
        }

        if(isBogWatchHeader(originalLine))
        {
            if(current)
                reports.push(current);

            current =
            {
                type:"watch",
                commentNumber:
                    pendingCommentNumber,
                publicationDate:
                    pendingPublicationDate,
                lines:[originalLine]
            };

            pendingCommentNumber = null;
            pendingPublicationDate = null;

            continue;
        }

        if(current)
        {
            current.lines.push(originalLine);
        }
    }

    if(current)
        reports.push(current);

    return reports;
}



/* =====================================================
   Дата публикации комментария
===================================================== */

function parseBogPublicationLine(line)
{
    const match =
        String(line || "").match(
            /#(\d+)\s+(\d{1,2})\s+([а-яё]+)\s+в\s+(\d{1,2})[:.](\d{2})/i
        );

    if(!match)
        return null;

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

    const month =
        months[
            match[3].toLowerCase()
        ];

    if(month === undefined)
        return null;

    const now =
        new Date();

    return new Date(
        now.getFullYear(),
        month,
        Number(match[2]),
        Number(match[4]),
        Number(match[5]),
        0,
        0
    );
}



/* =====================================================
   Получение поля БОГ
===================================================== */

function getBogField(
    text,
    field
)
{
    const escaped =
        field.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    const regex =
        new RegExp(
            escaped +
            "\\s*:\\s*([^\\n\\r]*)",
            "i"
        );

    const match =
        String(text || "").match(regex);

    if(!match)
        return "";

    return cleanBogText(match[1]);
}



/* =====================================================
   Получение ID БОГ
===================================================== */

function getBogIds(text)
{
    const result = [];
    const used = new Set();

    const regex =
        /\[(\d+)\]/g;

    let match;

    while((match = regex.exec(String(text || ""))) !== null)
    {
        const id =
            match[1];

        if(used.has(id))
            continue;

        used.add(id);
        result.push(id);
    }

    return result;
}



/* =====================================================
   Игрок БОГ
===================================================== */

function createBogPlayer(players, id)
{
    if(!players[id])
    {
        players[id] =
        {
            id:id,
            patrol:0,
            leader:0,
            watch:0
        };
    }

    return players[id];
}



/* =====================================================
   Добавление патруля
===================================================== */

function addBogPatrol(
    players,
    id,
    isLeader
)
{
    const player =
        createBogPlayer(
            players,
            id
        );

    /*
    Обычное участие в патруле:
    +1 в ПАТРУЛИ
    */

    player.patrol +=
        BOG_PATROL_POINTS;

    /*
    Ведущий:
    +2 в ПАТРУЛИ
    +1,5 в ВЕДЕНИЯ
    */

    if(isLeader)
    {
        /*
        У ведущего уже есть обычный
        +1 за участие.

        Добавляем ещё +1,
        чтобы всего получилось +2.
        */

        player.patrol += 1;

        player.leader +=
            BOG_LEADING_POINTS;
    }
}

/* =====================================================
   Добавление дозора
===================================================== */

function addBogWatchTime(
    players,
    id,
    minutes
)
{
    const player =
        createBogPlayer(
            players,
            id
        );

    /*
    За дозор даётся РОВНО количество минут.

    30 минут -> +30
    45 минут -> +45
    60 минут -> +60
    90 минут -> +90
    120 минут -> +120

    Никаких коэффициентов и перевода в часы.
    */

    player.watch +=
        minutes;
}

/* =====================================================
   Парсер даты/времени БОГ
===================================================== */

function parseBogDateTime(value)
{
    if(value === undefined || value === null)
        return null;

    let text = String(value).trim();

    if(!text)
        return null;

    /*
    =====================================================
    БОГ — максимально свободный разбор даты и времени

    Нам НЕ важны:
    . , ; : / - — пробелы и т.п.

    Главное:
    первые два числа = день + месяц
    следующие два числа = часы + минуты

    Примеры, которые понимаются одинаково:

    19.09, 09:00
    19.09 09:00
    19/09 09.00
    19-09 09:00
    19 — 09 — 09:00
    19 09 09 00
    19.09, 9:00
    19/09, 9.00
    */

    /*
    -----------------------------------------------------
    1. Получаем все числа из строки
    -----------------------------------------------------
    */

    const numbers =
        text.match(/\d+/g);

    if(!numbers || numbers.length < 4)
        return null;

    /*
    -----------------------------------------------------
    2. Первые два числа — день и месяц
    -----------------------------------------------------
    */

    const day =
        Number(numbers[0]);

    const month =
        Number(numbers[1]);

    /*
    -----------------------------------------------------
    3. Ищем время
       
       После дня и месяца может быть:
       
       09:00
       9:00
       09.00
       09 00
       09-00
       
       Поэтому просто берём следующие два числа.
    -----------------------------------------------------
    */

    let hour =
        Number(numbers[2]);

    let minute =
        Number(numbers[3]);

    /*
    -----------------------------------------------------
    4. Иногда между датой и временем оказывается год.

       Например:

       19.09.2026 09:00

       Тогда numbers:

       [19, 09, 2026, 09, 00]

       В этом случае пропускаем год.
    -----------------------------------------------------
    */

    if(
        hour > 23 &&
        numbers.length >= 5
    )
    {
        hour =
            Number(numbers[3]);

        minute =
            Number(numbers[4]);
    }

    /*
    -----------------------------------------------------
    5. Проверяем диапазоны
    -----------------------------------------------------
    */

    if(
        day < 1 ||
        day > 31
    )
    {
        return null;
    }

    if(
        month < 1 ||
        month > 12
    )
    {
        return null;
    }

    if(
        hour < 0 ||
        hour > 23
    )
    {
        return null;
    }

    if(
        minute < 0 ||
        minute > 59
    )
    {
        return null;
    }

    /*
    -----------------------------------------------------
    6. Год

       Если год указан — используем его.
       Если нет — текущий год.
    -----------------------------------------------------
    */

    let year =
        new Date().getFullYear();

    if(numbers.length >= 5)
    {
        const possibleYear =
            Number(numbers[2]);

        if(
            possibleYear >= 100 &&
            possibleYear <= 9999
        )
        {
            year = possibleYear;
        }
        else if(
            possibleYear >= 0 &&
            possibleYear <= 99 &&
            hour === Number(numbers[3])
        )
        {
            year =
                2000 + possibleYear;
        }
    }

    /*
    -----------------------------------------------------
    7. Создаём дату
    -----------------------------------------------------
    */

    const result =
        new Date(
            year,
            month - 1,
            day,
            hour,
            minute,
            0,
            0
        );

    /*
    -----------------------------------------------------
    8. Проверяем, что дата действительно существует.

       Например:

       31.02

       JS автоматически превратил бы её в март.
       Нам это не нужно.
    -----------------------------------------------------
    */

    if(
        result.getFullYear() !== year ||
        result.getMonth() !== month - 1 ||
        result.getDate() !== day ||
        result.getHours() !== hour ||
        result.getMinutes() !== minute
    )
    {
        return null;
    }

    return result;
}
/* =====================================================
   Парсер ПАТРУЛЯ
===================================================== */

function parseBogPatrol(
    reportText,
    players,
    errors,
    patrolReports,
    report
)
{
    const commentNumber =
        report.commentNumber
        ? `#${report.commentNumber}`
        : "#?";

    const dateValue =
        getBogField(
            reportText,
            "Дата и время"
        ) ||
        getBogField(
            reportText,
            "Дата"
        );

    if(!dateValue)
    {
        errors.push(
            `${commentNumber} — Патруль: отсутствует «Дата и время».`
        );

        return;
    }

    const patrolDate =
        parseBogDateTime(dateValue);

    if(!patrolDate)
    {
        errors.push(
            `${commentNumber} — Патруль ${dateValue}: не удалось распознать дату и время.`
        );

        return;
    }

    const route =
        getBogField(
            reportText,
            "Маршрут"
        ) ||
        getBogField(
            reportText,
            "Место патруля"
        );

    const leaderValue =
        getBogField(
            reportText,
            "Ведущий"
        );

    const participantsValue =
        getBogField(
            reportText,
            "Участники"
        );

    if(!leaderValue)
    {
        errors.push(
            `${commentNumber} — Патруль ${dateValue}: отсутствует «Ведущий».`
        );

        return;
    }

    const leaderIds =
        getBogIds(leaderValue);

    if(leaderIds.length === 0)
    {
        errors.push(
            `${commentNumber} — Патруль ${dateValue}: у ведущего нет ID.`
        );

        return;
    }

    const leaderId =
        leaderIds[0];

    let participantIds = [];

/*
=====================================================
УЧАСТНИКИ ПАТРУЛЯ

Допустимые варианты отсутствия участников:

-
--
---
—
–
нет
нет участников

Также поле "Участники" вообще может
отсутствовать.

Во всех этих случаях это НЕ ошибка.
=====================================================
*/

if(participantsValue)
{
    const normalized =
        participantsValue
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "");

    const emptyParticipants =
        normalized === "" ||
        normalized === "-" ||
        normalized === "--" ||
        normalized === "---" ||
        normalized === "—" ||
        normalized === "–" ||
        normalized === "нет" ||
        normalized === "нетучастников";

    /*
    Если участников действительно нет —
    просто продолжаем.
    */

    if(!emptyParticipants)
    {
        participantIds =
            getBogIds(
                participantsValue
            );

        /*
        Здесь уже написаны настоящие люди.
        Поэтому если ID нет вообще —
        это ошибка.
        */

        if(participantIds.length === 0)
        {
            errors.push(
                `${commentNumber} — Патруль ${dateValue}: в «Участники» указаны люди, но ни у одного не найден ID.`
            );

            return;
        }
    }
}

/*
Если participantsValue вообще отсутствует,
это тоже нормально.

Если там "-" / "—" / "--" —
тоже нормально.

Ошибка только тогда, когда там
действительно указан человек,
но нет ни одного ID.
*/

    patrolReports.push(
    {
        date:patrolDate,
        dateText:dateValue,
        route:route,
        leaderId:leaderId,
        participantIds:participantIds
    });

    const uniqueParticipants =
        [...new Set(participantIds)];

    for(const id of uniqueParticipants)
    {
        addBogPatrol(
            players,
            id,
            id === leaderId
        );
    }

    if(!uniqueParticipants.includes(leaderId))
    {
        addBogPatrol(
            players,
            leaderId,
            true
        );
    }
}



/* =====================================================
   Дата публикации ДОЗОРА
===================================================== */

function getBogPublicationDate(text)
{
    const lines =
        String(text || "").split("\n");

    for(const rawLine of lines)
    {
        const line =
            String(rawLine).trim();

        const match =
            line.match(
                /#\d+\s+(\d{1,2})\s+([а-яё]+)\s+в\s+(\d{1,2})[:.](\d{2})/i
            );

        if(!match)
            continue;

        const day =
            Number(match[1]);

        const monthName =
            match[2].toLowerCase();

        const hour =
            Number(match[3]);

        const minute =
            Number(match[4]);

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

        if(!(monthName in months))
            continue;

        const currentYear =
            new Date().getFullYear();

        const date =
            new Date(
                currentYear,
                months[monthName],
                day,
                hour,
                minute,
                0,
                0
            );

        if(
            date.getDate() !== day ||
            date.getMonth() !== months[monthName] ||
            date.getHours() !== hour ||
            date.getMinutes() !== minute
        )
        {
            continue;
        }

        return date;
    }

    return null;
}



/* =====================================================
   ДОЗОР
===================================================== */

function parseBogWatch(
    reportText,
    players,
    errors,
    report
)
{
    const commentNumber =
        report && report.commentNumber
            ? `#${report.commentNumber}`
            : "#?";

    const startValue =
        getBogField(
            reportText,
            "Дата и время начала"
        );

    const endValue =
        getBogField(
            reportText,
            "Дата и время конца"
        );

    const participantValue =
        getBogField(
            reportText,
            "Участник"
        );

    if (!startValue)
    {
        errors.push(
            `${commentNumber} — Дозор: отсутствует «Дата и время начала».`
        );

        return;
    }

    if (!endValue)
    {
        errors.push(
            `${commentNumber} — Дозор ${startValue}: отсутствует «Дата и время конца».`
        );

        return;
    }

    const startDate =
        parseBogDateTime(startValue);

    const endDate =
        parseBogDateTime(endValue);

    if (!startDate)
    {
        errors.push(
            `${commentNumber} — Дозор ${startValue}: не удалось распознать начало дозора.`
        );

        return;
    }

    if (!endDate)
    {
        errors.push(
            `${commentNumber} — Дозор ${endValue}: не удалось распознать конец дозора.`
        );

        return;
    }

    /*
    Если дозор перешёл через полночь,
    конец относится к следующему дню.
    */
    if (endDate.getTime() < startDate.getTime())
    {
        endDate.setTime(
            endDate.getTime() +
            24 * 60 * 60 * 1000
        );
    }

    const minutes =
        (
            endDate.getTime() -
            startDate.getTime()
        ) /
        (60 * 1000);

    if (minutes <= 0)
    {
        errors.push(
            `${commentNumber} — Дозор ${startValue}: продолжительность должна быть больше нуля.`
        );

        return;
    }

    /*
    Получаем участников.
    */
    const participantIds =
        getBogIds(
            participantValue
        );

    if (participantIds.length === 0)
    {
        errors.push(
            `${commentNumber} — Дозор ${startValue}: у участника не найден ID.`
        );

        return;
    }

    /*
    Каждый участник получает время дозора.
    */
    const uniqueParticipantIds =
        [...new Set(participantIds)];

    for (const participantId of uniqueParticipantIds)
    {
        addBogWatchTime(
            players,
            participantId,
            minutes
        );
    }

    /*
    Проверяем опоздание с отчётом.
    Допустимо 12 часов после окончания дозора.
    */
    const publicationDate =
        report &&
        report.publicationDate
            ? report.publicationDate
            : getBogPublicationDate(
                reportText
            );

    if (publicationDate)
    {
        const lateLimit =
            endDate.getTime() +
            (
                BOG_LATE_HOURS *
                60 *
                60 *
                1000
            );

        if (
            publicationDate.getTime() >
            lateLimit
        )
        {
            const lateHours =
                (
                    publicationDate.getTime() -
                    endDate.getTime()
                ) /
                (
                    60 *
                    60 *
                    1000
                );

            errors.push(
                `${commentNumber} — Дозор ${startValue} — ${endValue}: отчёт отписан спустя ${formatBogNumber(lateHours)} ч. после окончания.`
            );
        }
    }
}
/* =====================================================
   Числа БОГ
===================================================== */

function formatBogNumber(value)
{
    const number =
        Number(value) || 0;

    if(Number.isInteger(number))
        return String(number);

    return number
        .toFixed(1)
        .replace(".", ",");
}



/* =====================================================
   ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПАТРУЛЕЙ
===================================================== */

function checkBogRequiredPatrols(
    patrolReports,
    missingPatrols
)
{
    if(
        !patrolReports ||
        patrolReports.length === 0
    )
    {
        return;
    }

    /*
    =====================================================
    Собираем данные по каждому дню.

    Структура:

    дата
      ↓
    время
      ↓
    маршруты [1, 2]
    =====================================================
    */

    const dates =
        new Map();

    for(const patrol of patrolReports)
    {
        if(!patrol.date)
            continue;

        const d =
            patrol.date;

        const dateKey =
            d.getFullYear() +
            "-" +
            String(
                d.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                d.getDate()
            ).padStart(2, "0");

        if(!dates.has(dateKey))
        {
            dates.set(
                dateKey,
                {
                    date:d,
                    times:{}
                }
            );
        }

        const day =
            dates.get(dateKey);

        const hour =
            String(
                d.getHours()
            ).padStart(2, "0");

        const minute =
            String(
                d.getMinutes()
            ).padStart(2, "0");

        const time =
            hour +
            ":" +
            minute;

        if(!day.times[time])
        {
            day.times[time] =
            {
                1:false,
                2:false
            };
        }

        /*
        =================================================
        Определяем маршрут.

        Поддерживаются:

        1
        2
        1 маршрут
        2 маршрут
        маршрут 1
        маршрут 2
        =================================================
        */

        const routeText =
            String(
                patrol.route || ""
            ).trim();

        const routeMatch =
            routeText.match(
                /(?:^|\D)([12])(?:\D|$)/
            );

        if(routeMatch)
        {
            const routeNumber =
                Number(
                    routeMatch[1]
                );

            day.times[time][routeNumber] =
                true;
        }
    }

    /*
    =====================================================
    Теперь проверяем каждый день.

    Для каждого обязательного времени:
    обязательно должны существовать:

    маршрут 1
    маршрут 2
    =====================================================
    */

    for(const day of dates.values())
    {
        for(const requiredTime of BOG_PATROL_TIMES)
        {
            const routes =
                day.times[requiredTime];

            /*
            Если в это время вообще ничего
            не отписано — оба маршрута отсутствуют.
            */

            if(!routes)
            {
                addMissingBogPatrol(
                    day.date,
                    requiredTime,
                    1,
                    missingPatrols
                );

                addMissingBogPatrol(
                    day.date,
                    requiredTime,
                    2,
                    missingPatrols
                );

                continue;
            }

            /*
            Маршрут 1 отсутствует.
            */

            if(!routes[1])
            {
                addMissingBogPatrol(
                    day.date,
                    requiredTime,
                    1,
                    missingPatrols
                );
            }

            /*
            Маршрут 2 отсутствует.
            */

            if(!routes[2])
            {
                addMissingBogPatrol(
                    day.date,
                    requiredTime,
                    2,
                    missingPatrols
                );
            }
        }
    }
}

function addMissingBogPatrol(
    date,
    time,
    route,
    missingPatrols
)
{
    const dateText =
        String(
            date.getDate()
        ).padStart(2, "0") +
        "." +
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    /*
    Выводим именно в требуемом формате:

    19.09 09 2 маршрут
    */

    const hour =
        time.split(":")[0];

    missingPatrols.push(
        `${dateText} ${hour} ${route} маршрут`
    );
}

/* =====================================================
   Вывод ошибок БОГ
===================================================== */

function drawBogErrors(errors)
{
    if(!bogErrorsBox)
        return;

    bogErrorsBox.innerHTML = "";

    if(
        !errors ||
        errors.length === 0
    )
    {
        bogErrorsBox.innerHTML =
            `<div class="success">Ошибок не найдено.</div>`;

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

        bogErrorsBox.appendChild(div);
    }
}



/* =====================================================
   Вывод отсутствующих патрулей
===================================================== */

function drawBogMissingPatrols(
    missingPatrols
)
{
    if(bogMissingPatrols)
    {
        bogMissingPatrols.innerHTML = "";

        if(
            !missingPatrols ||
            missingPatrols.length === 0
        )
        {
            bogMissingPatrols.innerHTML =
                `<div class="empty-message">Пропущенных патрулей нет.</div>`;
        }
        else
        {
            for(const item of missingPatrols)
            {
                const div =
                    document.createElement("div");

                div.className =
                    "missing-patrol";

                div.textContent =
                    item;

                bogMissingPatrols.appendChild(div);
            }
        }
    }

    if(bogMissingPatrolsCount)
    {
        bogMissingPatrolsCount.textContent =
            String(
                missingPatrols
                ? missingPatrols.length
                : 0
            );
    }
}



/* =====================================================
   Вывод результатов БОГ
===================================================== */

function drawBogResults(players)
{
    if(!bogResultsBody)
        return;

    bogResultsBody.innerHTML = "";

    const list =
        Object.values(players || {});

    list.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );

    if(bogTotalPlayers)
    {
        bogTotalPlayers.textContent =
            "Игроков: " + list.length;
    }

    if(list.length === 0)
    {
        bogResultsBody.innerHTML = `
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
                ${formatBogNumber(player.patrol)}
            </td>

       <td class="mouseCell">
    ${formatBogNumber(player.watch)}
</td>

<td class="leadCell">
    ${formatBogNumber(player.leader)}
</td>
        `;

        bogResultsBody.appendChild(row);
    }
}



/* =====================================================
   ГЛАВНЫЙ РАСЧЁТ БОГ
===================================================== */

function calculateBog()
{
    const text =
        bogReportsArea
        ? bogReportsArea.value.trim()
        : "";

    const players = {};
    const errors = [];
    const patrolReports = [];
    const missingPatrols = [];

    if(!text)
    {
        drawBogErrors(
        [
            "Нет вставленных отчётов."
        ]);

        drawBogMissingPatrols([]);

        drawBogResults({});

        return;
    }

    const reports =
        splitBogReports(text);

    if(reports.length === 0)
    {
        drawBogErrors(
        [
            "Не найдено ни одного отчёта «Патруль» или «Дозор»."
        ]);

        drawBogMissingPatrols([]);

        drawBogResults({});

        return;
    }

    for(const report of reports)
    {
        const reportText =
            report.lines.join("\n");

        if(report.type === "patrol")
        {
            parseBogPatrol(
                reportText,
                players,
                errors,
                patrolReports,
                report
            );
        }
        else if(report.type === "watch")
        {
            parseBogWatch(
                reportText,
                players,
                errors,
                report
            );
        }
    }

    checkBogRequiredPatrols(
        patrolReports,
        missingPatrols
    );

    drawBogErrors(errors);

    drawBogMissingPatrols(
        missingPatrols
    );

    drawBogResults(players);
}



/* =====================================================
   КОПИРОВАНИЕ БОГ
===================================================== */

function copyBogResult()
{
    if(!bogResultsBody)
        return;

    const rows =
        bogResultsBody
        .querySelectorAll("tr");

    const output = [];

    for(const row of rows)
    {
        const cells =
            row.querySelectorAll(
                "th, td"
            );

        if(cells.length !== 4)
            continue;

        const values =
            Array.from(cells).map(
                cell =>
                    cell.innerText.trim()
            );

        if(
            values[0] ===
            "Пока нет данных."
        )
        {
            continue;
        }

        output.push(
            values.join("\t")
        );
    }

    if(output.length === 0)
        return;

    const text =
        output.join("\n");

    navigator.clipboard
        .writeText(text)
        .then(() =>
        {
            if(bogCopyBtn)
            {
                const oldText =
                    bogCopyBtn.textContent;

                bogCopyBtn.textContent =
                    "Скопировано!";

                setTimeout(() =>
                {
                    bogCopyBtn.textContent =
                        oldText;
                },1200);
            }
        })
        .catch(() =>
        {
            console.log(
                "Не удалось скопировать результат."
            );
        });
}



/* =====================================================
   ОЧИСТКА БОГ
===================================================== */

function clearBog()
{
    if(bogReportsArea)
    {
        bogReportsArea.value = "";
    }

    if(bogErrorsBox)
    {
        bogErrorsBox.innerHTML =
            `<div class="empty-message">Ошибок пока нет.</div>`;
    }

    if(bogMissingPatrols)
    {
        bogMissingPatrols.innerHTML =
            `<div class="empty-message">Пока нет данных.</div>`;
    }

    if(bogMissingPatrolsCount)
    {
        bogMissingPatrolsCount.textContent =
            "0";
    }

    if(bogResultsBody)
    {
        bogResultsBody.innerHTML = `
            <tr class="placeholderRow">
                <td colspan="4">Пока нет данных.</td>
            </tr>
        `;
    }

    if(bogTotalPlayers)
    {
        bogTotalPlayers.textContent =
            "Игроков: 0";
    }
}



/* =====================================================
   КНОПКИ БОГ
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
