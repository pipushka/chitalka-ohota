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
   =====================================================
   БОГ
   =====================================================
   ===================================================== */


/*
---------------------------------------------------------
НАСТРОЙКИ НАЧИСЛЕНИЯ БОГ
---------------------------------------------------------

Если правила изменятся, менять нужно только эти
значения.
*/


const BOG_PATROL_POINTS =
    1;


const BOG_LEADER_BONUS =
    2;


const BOG_LEADING_POINTS =
    1.5;


const BOG_LATE_HOURS =
    12;



/* =====================================================
   Элементы БОГ
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

const bogPlaceholderPatrols =
    document.getElementById(
        "bogPlaceholderPatrols"
    );

const bogPlaceholderPatrolsCount =
    document.getElementById(
        "bogPlaceholderPatrolsCount"
    );



/* =====================================================
   Данные БОГ
===================================================== */

let bogPlayers = {};

let bogErrors = [];

let bogPatrolReports = [];

let bogPatrolPlaceholders = [];

let bogExpectedPatrols = [];



/* =====================================================
   Создание игрока
===================================================== */

function createBogPlayer(id)
{
    if(!bogPlayers[id])
    {
        bogPlayers[id] =
        {
            id:id,

            patrolPoints:0,

            leadingPoints:0,

            patrolLeadCount:0,

            watchMinutes:0
        };
    }


    return bogPlayers[id];
}



/* =====================================================
   Добавление патруля
===================================================== */

function addBogPatrol(
    id,
    isLeader
)
{
    const player =
        createBogPlayer(id);


    player.patrolPoints +=
        BOG_PATROL_POINTS;


    if(isLeader)
    {
        player.patrolPoints +=
            BOG_LEADER_BONUS;


        player.leadingPoints +=
            BOG_LEADING_POINTS;


        player.patrolLeadCount++;
    }
}



/* =====================================================
   Добавление времени дозора
===================================================== */

function addBogWatchTime(
    id,
    minutes
)
{
    if(minutes <= 0)
        return;


    const player =
        createBogPlayer(id);


    player.watchMinutes +=
        minutes;
}



/* =====================================================
   Разбор комментариев БОГ
===================================================== */

function splitBogReports(text)
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
   ID из человека
===================================================== */

function getBogId(text)
{
    const match =
        text.match(
            /\[(\d+)\]/
        );


    if(!match)
        return null;


    return match[1];
}



/* =====================================================
   Все ID из блока
===================================================== */

function getBogIds(text)
{
    const ids = [];

    const used =
        new Set();


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



/* =====================================================
   Очистка значения поля
===================================================== */

function cleanBogField(value)
{
    return value
        .replace(/\*{0,2}/g,"")
        .trim()
        .replace(/[.;]\s*$/,"")
        .trim();
}



/* =====================================================
   Получение поля отчёта
===================================================== */

function getBogField(
    text,
    field
)
{
    const regex =
        new RegExp(
            `\\*{0,2}${field}\\*{0,2}\\s*:\\s*([\\\\s\\\\S]*?)(?=\\n\\s*\\*{0,2}[А-ЯЁ][А-ЯЁа-яё ]{1,40}\\*{0,2}\\s*:|$)`,
            "i"
        );


    const match =
        text.match(regex);


    if(!match)
        return null;


    return cleanBogField(
        match[1]
    );
}



/* =====================================================
   Проверка заголовка
===================================================== */

function getBogReportType(text)
{
    if(/Патруль/i.test(text))
        return "patrol";


    if(/Дозор/i.test(text))
        return "watch";


    return "unknown";
}



/* =====================================================
   Нормализация даты
===================================================== */

function parseBogDate(
    dateText,
    timeText
)
{
    if(!dateText || !timeText)
        return null;


    const dateMatch =
        dateText.match(
            /^(\d{1,2})\s*[./-]\s*(\d{1,2})(?:\s*[./-]\s*(\d{2,4}))?$/
        );


    const timeMatch =
        timeText.match(
            /^(\d{1,2})\s*[:.]\s*(\d{2})$/
        );


    if(!dateMatch || !timeMatch)
        return null;


    let year;


    if(dateMatch[3])
    {
        year =
            Number(dateMatch[3]);


        if(year < 100)
            year += 2000;
    }
    else
    {
        year =
            new Date().getFullYear();
    }


    const day =
        Number(dateMatch[1]);


    const month =
        Number(dateMatch[2]) - 1;


    const hours =
        Number(timeMatch[1]);


    const minutes =
        Number(timeMatch[2]);


    if(
        month < 0 ||
        month > 11 ||
        day < 1 ||
        day > 31 ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    )
    {
        return null;
    }


    const date =
        new Date(
            year,
            month,
            day,
            hours,
            minutes
        );


    if(
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day ||
        date.getHours() !== hours ||
        date.getMinutes() !== minutes
    )
    {
        return null;
    }


    return date;
}



/* =====================================================
   Разбор даты + времени из одного поля
===================================================== */

function parseBogDateTime(value)
{
    if(!value)
        return null;


    const match =
        value.match(
            /(\d{1,2})\s*[./-]\s*(\d{1,2})(?:\s*[./-]\s*(\d{2,4}))?\s*,?\s*(\d{1,2})\s*[:.]\s*(\d{2})/
        );


    if(!match)
        return null;


    return parseBogDate(
        `${match[1]}.${match[2]}${match[3] ? "." + match[3] : ""}`,
        `${match[4]}:${match[5]}`
    );
}



/* =====================================================
   Дата комментария
===================================================== */

function getCommentDate(text)
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


    const now =
        new Date();


    const todayMatch =
        text.match(
            /#\d+\s+Сегодня\s+в\s+(\d{1,2})[:.](\d{2})/i
        );


    if(todayMatch)
    {
        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            Number(todayMatch[1]),
            Number(todayMatch[2])
        );
    }


    const yesterdayMatch =
        text.match(
            /#\d+\s+Вчера\s+в\s+(\d{1,2})[:.](\d{2})/i
        );


    if(yesterdayMatch)
    {
        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 1,
            Number(yesterdayMatch[1]),
            Number(yesterdayMatch[2])
        );
    }


    const match =
        text.match(
            /#\d+\s+(\d{1,2})\s+([а-яё]+)\s+в\s+(\d{1,2})[:.](\d{2})/i
        );


    if(!match)
        return null;


    const month =
        months[
            match[2].toLowerCase()
        ];


    if(month === undefined)
        return null;


    return new Date(
        now.getFullYear(),
        month,
        Number(match[1]),
        Number(match[3]),
        Number(match[4])
    );
}



/* =====================================================
   Форматирование времени
===================================================== */

function formatBogMinutes(totalMinutes)
{
    totalMinutes =
        Math.max(
            0,
            Math.floor(totalMinutes)
        );


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    return (
        String(hours)
        .padStart(2,"0")
        +
        ":"
        +
        String(minutes)
        .padStart(2,"0")
    );
}



/* =====================================================
   Проверка формата даты
===================================================== */

function checkBogDateFormat(
    number,
    fieldName,
    value
)
{
    if(!value)
        return false;


    const match =
        value.match(
            /^(\d{1,2})\s*[./-]\s*(\d{1,2})(?:\s*[./-]\s*(\d{2,4}))?\s*,?\s*(\d{1,2})\s*[:.]\s*(\d{2})/
        );


    if(!match)
    {
        bogErrors.push(
            `#${number} — поле "${fieldName}" оформлено не по шаблону.`
        );

        return false;
    }


    return true;
}



/* =====================================================
   Проверка даты относительно комментария
===================================================== */

function checkBogFutureDate(
    number,
    text,
    reportDate,
    label
)
{
    const commentDate =
        getCommentDate(text);


    if(!commentDate || !reportDate)
        return;


    if(reportDate > commentDate)
    {
        bogErrors.push(
            `#${number} — ошибка времени: "${label}" (${formatBogDate(reportDate)}) позже даты публикации комментария (${formatBogDate(commentDate)}).`
        );
    }
}



/* =====================================================
   Формат даты для ошибки
===================================================== */

function formatBogDate(date)
{
    if(!date)
        return "";


    return (
        String(date.getDate()).padStart(2,"0")
        +
        "."
        +
        String(date.getMonth()+1).padStart(2,"0")
        +
        "."
        +
        date.getFullYear()
        +
        ", "
        +
        String(date.getHours()).padStart(2,"0")
        +
        ":"
        +
        String(date.getMinutes()).padStart(2,"0")
    );
}



/* =====================================================
   ПАТРУЛИ
===================================================== */

function parseBogPatrol(
    number,
    text
)
{
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


    /*
    -----------------------------------------------------
    Проверяем наличие полей.
    Ошибка шаблона не прекращает разбор.
    -----------------------------------------------------
    */

    if(!dateValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Дата и время".`
        );
    }


    if(!routeValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Маршрут".`
        );
    }


    if(!leaderValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Ведущий".`
        );
    }


    if(!participantsValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Участники".`
        );
    }


    if(!northValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Север".`
        );
    }


    if(!windValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Ветер".`
        );
    }


    /*
    -----------------------------------------------------
    Дата
    -----------------------------------------------------
    */

    const date =
        parseBogDateTime(
            dateValue
        );


    if(dateValue)
    {
        if(!checkBogDateFormat(
            number,
            "Дата и время",
            dateValue
        ))
        {
            // только ошибка оформления
        }
        else if(!date)
        {
            bogErrors.push(
                `#${number} — неверная дата или время в поле "Дата и время".`
            );
        }
    }


    if(date)
    {
        checkBogFutureDate(
            number,
            text,
            date,
            "Дата и время"
        );
    }


    /*
    -----------------------------------------------------
    Маршрут
    -----------------------------------------------------
    */

    if(routeValue)
    {
        const routeMatch =
            routeValue.match(
                /^\s*(1|2)\s*$/
            );


        if(!routeMatch)
        {
            bogErrors.push(
                `#${number} — маршрут "${routeValue}" не равен 1 или 2.`
            );
        }
    }


    /*
    -----------------------------------------------------
    Ведущий
    -----------------------------------------------------
    */

    let leaderId = null;


    if(leaderValue)
    {
        leaderId =
            getBogId(
                leaderValue
            );


        if(!leaderId)
        {
            bogErrors.push(
                `#${number} — у ведущего отсутствует ID.`
            );
        }
    }


    /*
    -----------------------------------------------------
    Участники
    -----------------------------------------------------
    */

    let participantIds = [];


    if(participantsValue)
    {
        if(
            participantsValue.trim() !== "-" &&
            participantsValue.trim() !== ""
        )
        {
            participantIds =
                getBogIds(
                    participantsValue
                );


            if(
                participantIds.length === 0 &&
                /[А-ЯЁа-яё]/.test(
                    participantsValue
                )
            )
            {
                bogErrors.push(
                    `#${number} — в поле "Участники" не найдены ID.`
                );
            }
        }
    }


    /*
    -----------------------------------------------------
    Начисление.
    Ведущий получает участие отдельно.
    -----------------------------------------------------
    */

    for(const id of participantIds)
    {
        addBogPatrol(
            id,
            id === leaderId
        );
    }


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


    /*
    -----------------------------------------------------
    Сохраняем информацию о нормальном патруле.
    -----------------------------------------------------
    */

    if(
        date &&
        routeValue
    )
    {
        const routeMatch =
            routeValue.match(
                /^\s*(1|2)\s*$/
            );


        if(routeMatch)
        {
            bogPatrolReports.push(
            {
                number:number,

                route:Number(
                    routeMatch[1]
                ),

                date:date
            });
        }
    }
}



/* =====================================================
   ПАТРУЛЬ-ПУСТЫШКА
===================================================== */

function parseBogPatrolPlaceholder(
    number,
    text
)
{
    /*
    Поддерживаем варианты:

    Патруль 18 2 маршрут -
    патруль 18 2 маршрут
    Патруль №18 2 маршрут -
    Патруль #18 2 маршрут -
    */


    const match =
        text.match(
            /Патруль\s*(?:№|#)?\s*(\d+)\s+(?:маршрут\s*)?([12])\s+маршрут\s*-?/i
        );


    if(!match)
    {
        /*
        Второй более мягкий вариант:
        "Патруль 18 2 маршрут -"
        */

        const second =
            text.match(
                /Патруль\s*(?:№|#)?\s*(\d+)\s+([12])\s+маршрут\s*-?/i
            );


        if(!second)
            return false;


        bogPatrolPlaceholders.push(
        {
            number:number,

            patrolNumber:
                Number(second[1]),

            route:
                Number(second[2])
        });


        return true;
    }


    bogPatrolPlaceholders.push(
    {
        number:number,

        patrolNumber:
            Number(match[1]),

        route:
            Number(match[2])
    });


    return true;
}



/* =====================================================
   ДОЗОР
===================================================== */

function parseBogWatch(
    number,
    text
)
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
    -----------------------------------------------------
    Если это начало дозора — игнорируем.
    -----------------------------------------------------
    */

    if(
        startValue &&
        !endValue
    )
    {
        return;
    }


    /*
    -----------------------------------------------------
    Конец дозора.
    -----------------------------------------------------
    */

    if(!startValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Дата и время начала".`
        );
    }


    if(!endValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Дата и время конца".`
        );
    }


    if(!placeValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Место дозора".`
        );
    }


    if(!participantValue)
    {
        bogErrors.push(
            `#${number} — отсутствует поле "Участник".`
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


    /*
    -----------------------------------------------------
    Ошибки оформления времени.
    -----------------------------------------------------
    */

    if(startValue)
    {
        checkBogDateFormat(
            number,
            "Дата и время начала",
            startValue
        );
    }


    if(endValue)
    {
        checkBogDateFormat(
            number,
            "Дата и время конца",
            endValue
        );
    }


    if(startValue && !startDate)
    {
        bogErrors.push(
            `#${number} — неверная дата или время начала дозора.`
        );
    }


    if(endValue && !endDate)
    {
        bogErrors.push(
            `#${number} — неверная дата или время конца дозора.`
        );
    }


    if(!startDate || !endDate)
        return;


    /*
    -----------------------------------------------------
    Конец раньше начала.
    -----------------------------------------------------
    */

    if(endDate <= startDate)
    {
        /*
        Возможен переход через полночь.
        Если конец на следующий календарный день
        не указан, считаем это ошибкой.
        */

        bogErrors.push(
            `#${number} — время конца дозора не может быть раньше или равно времени начала.`
        );

        return;
    }


    /*
    -----------------------------------------------------
    Дата относительно публикации.
    -----------------------------------------------------
    */

    checkBogFutureDate(
        number,
        text,
        startDate,
        "Дата и время начала"
    );


    checkBogFutureDate(
        number,
        text,
        endDate,
        "Дата и время конца"
    );


    /*
    -----------------------------------------------------
    Больше 12 часов до публикации.
    -----------------------------------------------------
    */

    const commentDate =
        getCommentDate(text);


    if(commentDate)
    {
        const delay =
            commentDate.getTime()
            -
            endDate.getTime();


        const twelveHours =
            BOG_LATE_HOURS *
            60 *
            60 *
            1000;


        if(delay > twelveHours)
        {
            const totalMinutes =
                Math.floor(
                    delay / 60000
                );


            bogErrors.push(
                `#${number} — отпись о дозоре сделана спустя ${formatBogMinutes(totalMinutes)} после окончания дозора.`
            );
        }
    }


    /*
    -----------------------------------------------------
    Участник
    -----------------------------------------------------
    */

    const id =
        getBogId(
            participantValue
        );


    if(!id)
    {
        bogErrors.push(
            `#${number} — у участника дозора отсутствует ID.`
        );

        return;
    }


    /*
    -----------------------------------------------------
    Время дозора.
    -----------------------------------------------------
    */

    const minutes =
        Math.floor(
            (
                endDate.getTime()
                -
                startDate.getTime()
            ) / 60000
        );


    addBogWatchTime(
        id,
        minutes
    );
}



/* =====================================================
   Главный разбор БОГ
===================================================== */

function calculateBog()
{
    bogPlayers = {};

    bogErrors = [];

    bogPatrolReports = [];

    bogPatrolPlaceholders = [];

    bogExpectedPatrols = [];


    const text =
        bogReportsArea.value.trim();


    if(!text)
    {
        bogErrors.push(
            "Нет вставленных отчётов."
        );


        drawBogErrors();

        drawBogResults();

        drawBogSpecialBlocks();

        return;
    }


    const reports =
        splitBogReports(text);


    if(reports.length === 0)
    {
        bogErrors.push(
            "Не найдено ни одного комментария с номером #."
        );


        drawBogErrors();

        drawBogResults();

        drawBogSpecialBlocks();

        return;
    }


    for(const report of reports)
    {
        const type =
            getBogReportType(
                report.text
            );


        /*
        -------------------------------------------------
        Пустышка
        -------------------------------------------------
        */

        if(
            /Патруль\s*(?:№|#)?\s*\d+\s+[12]\s+маршрут/i
            .test(report.text)
        )
        {
            parseBogPatrolPlaceholder(
                report.number,
                report.text
            );

            continue;
        }


        /*
        -------------------------------------------------
        Патруль
        -------------------------------------------------
        */

        if(type === "patrol")
        {
            parseBogPatrol(
                report.number,
                report.text
            );

            continue;
        }


        /*
        -------------------------------------------------
        Дозор
        -------------------------------------------------
        */

        if(type === "watch")
        {
            parseBogWatch(
                report.number,
                report.text
            );

            continue;
        }
    }


    calculateBogMissingPatrols();


    drawBogErrors();

    drawBogResults();

    drawBogSpecialBlocks();
}



/* =====================================================
   Определение неотписанных патрулей
===================================================== */

function calculateBogMissingPatrols()
{
    /*
    -----------------------------------------------------
    Здесь пустышки считаются заявкой на существующий
    патруль.

    Если нормального отчёта с таким номером/маршрутом
    нет — выводим его в отдельный блок.
    -----------------------------------------------------
    */

    const reported =
        new Set();


    for(const report of bogPatrolReports)
    {
        reported.add(
            `${report.number}:${report.route}`
        );
    }


    const placeholderSet =
        new Set();


    for(
        const placeholder
        of bogPatrolPlaceholders
    )
    {
        const key =
            `${placeholder.patrolNumber}:${placeholder.route}`;


        placeholderSet.add(key);
    }


    /*
    -----------------------------------------------------
    Пустышка сама по себе не является ошибкой.

    Она просто сообщает считалке, что такой патруль
    должен существовать.
    -----------------------------------------------------
    */

    bogExpectedPatrols = [];


    for(
        const placeholder
        of bogPatrolPlaceholders
    )
    {
        const key =
            `${placeholder.patrolNumber}:${placeholder.route}`;


        if(!reported.has(key))
        {
            bogExpectedPatrols.push(
            {
                patrolNumber:
                    placeholder.patrolNumber,

                route:
                    placeholder.route,

                sourceComment:
                    placeholder.number
            });
        }
    }


    /*
    -----------------------------------------------------
    Убираем дубликаты.
    -----------------------------------------------------
    */

    const unique = [];

    const used = new Set();


    for(
        const item
        of bogExpectedPatrols
    )
    {
        const key =
            `${item.patrolNumber}:${item.route}`;


        if(used.has(key))
            continue;


        used.add(key);

        unique.push(item);
    }


    bogExpectedPatrols =
        unique;
}



/* =====================================================
   Вывод ошибок БОГ
===================================================== */

function drawBogErrors()
{
    bogErrorsBox.innerHTML = "";


    if(bogErrors.length === 0)
    {
        bogErrorsBox.innerHTML =
            "<div class='success'>Ошибок не найдено.</div>";

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


        bogErrorsBox.appendChild(div);
    }
}



/* =====================================================
   Вывод специальных блоков
===================================================== */

function drawBogSpecialBlocks()
{
    /*
    -----------------------------------------------------
    Неотписанные
    -----------------------------------------------------
    */

    bogMissingPatrols.innerHTML = "";


    bogMissingPatrolsCount.textContent =
        bogExpectedPatrols.length;


    if(bogExpectedPatrols.length === 0)
    {
        bogMissingPatrols.innerHTML =
            "<div class='success'>Неотписанных патрулей не найдено.</div>";
    }
    else
    {
        for(
            const item
            of bogExpectedPatrols
        )
        {
            const div =
                document.createElement("div");


            div.className =
                "special-item";


            div.textContent =
                `Патруль ${item.patrolNumber} — ${item.route} маршрут (пустышка #${item.sourceComment})`;


            bogMissingPatrols.appendChild(div);
        }
    }


    /*
    -----------------------------------------------------
    Пустышки
    -----------------------------------------------------
    */

    bogPlaceholderPatrols.innerHTML = "";


    bogPlaceholderPatrolsCount.textContent =
        bogPatrolPlaceholders.length;


    if(bogPatrolPlaceholders.length === 0)
    {
        bogPlaceholderPatrols.innerHTML =
            "<div class='placeholder'>Пустышек не найдено.</div>";
    }
    else
    {
        for(
            const item
            of bogPatrolPlaceholders
        )
        {
            const div =
                document.createElement("div");


            div.className =
                "special-item";


            div.textContent =
                `#${item.number} — патруль ${item.patrolNumber}, ${item.route} маршрут`;


            bogPlaceholderPatrols.appendChild(div);
        }
    }
}



/* =====================================================
   Результаты БОГ
===================================================== */

function drawBogResults()
{
    bogResultsBody.innerHTML = "";


    const list =
        Object.values(
            bogPlayers
        );


    list.sort(
        (a,b) =>
            Number(a.id) -
            Number(b.id)
    );


    bogTotalPlayers.textContent =
        "Игроков: " + list.length;


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
                ${formatNumber(player.patrolPoints)}
            </td>

            <td class="leadCell">
                ${formatNumber(player.leadingPoints)}
            </td>

            <td class="watchCell">
                ${formatBogMinutes(player.watchMinutes)}
            </td>
        `;


        bogResultsBody.appendChild(row);
    }
}



/* =====================================================
   Копирование БОГ
===================================================== */

function copyBogResult()
{
    const list =
        Object.values(
            bogPlayers
        );


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
            `${player.id}\t${formatNumber(player.patrolPoints)}\t${formatNumber(player.leadingPoints)}\t${formatBogMinutes(player.watchMinutes)}\n`;
    }


    navigator.clipboard.writeText(
        result
    );


    bogCopyBtn.textContent =
        "Скопировано!";


    setTimeout(() =>
    {
        bogCopyBtn.textContent =
            "Копировать результат";
    },1500);
}



/* =====================================================
   Очистка БОГ
===================================================== */

function clearBog()
{
    bogReportsArea.value = "";

    bogPlayers = {};

    bogErrors = [];

    bogPatrolReports = [];

    bogPatrolPlaceholders = [];

    bogExpectedPatrols = [];


    drawBogErrors();

    drawBogResults();

    drawBogSpecialBlocks();
}



/* =====================================================
   Кнопки БОГ
===================================================== */

bogCalculateBtn.addEventListener(
    "click",
    calculateBog
);


bogClearBtn.addEventListener(
    "click",
    clearBog
);


bogCopyBtn.addEventListener(
    "click",
    copyBogResult
);



/* =====================================================
   Первоначальная отрисовка БОГ
===================================================== */

drawBogErrors();

drawBogResults();

drawBogSpecialBlocks();
```
