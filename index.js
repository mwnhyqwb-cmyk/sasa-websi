const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay
} = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '9087910156:AAGA1GP8SVyDpSevK09m0uhkZ0rJRtPgb-k';
const REQUIRED_WHATSAPP_CHANNEL_URL = process.env.REQUIRED_WHATSAPP_CHANNEL_URL || 'https://whatsapp.com/channel/0029VbDSjt572WTqahfcWj14';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '7677969589';
const DEV_FOOTER = '\n\nالمطور ♥️🥊 @sasailmoseba1';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const startedAt = Date.now();
const PAIRING_TIMEOUT_MS = 75 * 1000;

// إعدادات السرعة والأمان (عدّل الأرقام حسب تحمل حسابك)
const CHUNK_CONCURRENCY = 5;        // عدد الأرقام التي تُفحص معًا في نفس اللحظة
const BATCH_SIZE = 200;             // حجم الدفعة قبل أخذ استراحة قصيرة
const REST_DURATION_MS = 8 * 1000;  // مدة الاستراحة بين الدفعات (8 ثواني)
const STEP_DELAY_MS = 350;          // التأخير بين كل دفعة متوازية (بالملي ثانية)

// جلسات تنتظر رقم الهاتف أو إجراء على الملف:
// chatId -> { vcfData, fileName, statusMsgId, userInfo, awaitingEmoji }
const pendingPhoneSessions = new Map();

// جلسات ربط/فحص نشطة حاليًا: chatId -> controller
const activeSessions = new Map();

// جلسات متوقفة يمكن استكمالها: chatId -> { phoneNumber, contacts, nextIndex, validCards, removedCards, statusMsgId, userInfo }
const pausedCheckSessions = new Map();

// المستخدمون الذين أكدوا الاشتراك في قناة الواتساب: userId -> boolean
const acknowledgedChannelUsers = new Set();

function withFooter(text) {
    const clean = String(text || '').trimEnd();
    return clean.endsWith(DEV_FOOTER.trim()) ? clean : `${clean}${DEV_FOOTER}`;
}

function extractUserInfo(sourceObj, fallbackChatId = null) {
    const from = sourceObj?.from || {};
    const chatId = sourceObj?.chat?.id || sourceObj?.message?.chat?.id || fallbackChatId;
    const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ').trim() || 'غير معروف';
    const username = from.username ? `@${from.username}` : 'بدون يوزر';
    const userId = from.id || chatId || 'غير معروف';
    return { chatId, userId, fullName, username };
}

function getSubscriptionKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🟨 📢 اشترك في قناة واتساب', url: REQUIRED_WHATSAPP_CHANNEL_URL }],
            [{ text: '🟨 ✅ لقد اشتركت، متابعة', callback_data: 'verify_sub' }]
        ]
    };
}

function getFileActionsKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🟨 🔀 دمج الأرقام المكررة', callback_data: 'merge_duplicates' }],
            [{ text: '🟨 😀 عدل الايموجي', callback_data: 'edit_emoji' }]
        ]
    };
}

function getStopNowKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🟨 📥 استلام النتيجة وإيقاف الآن', callback_data: 'stop_deliver' }]
        ]
    };
}

function getResumeKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '🟨 ▶️ استكمال الفحص', callback_data: 'resume_check' },
                { text: '🟨 🛑 إنهاء وحفظ لحد هنا', callback_data: 'finish_paused' }
            ]
        ]
    };
}

async function promptSubscription(chatId, messageId = null) {
    const text = withFooter(
        '🔒 *عذرًا، يجب الاشتراك في قناة الواتساب أولًا لاستخدام البوت.*\n\n' +
        'اضغط على زر الاشتراك ثم اضغط على زر المتابعة.'
    );

    const opts = {
        parse_mode: 'Markdown',
        reply_markup: getSubscriptionKeyboard()
    };

    if (messageId) {
        await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts }).catch(async () => {
            await bot.sendMessage(chatId, text, opts);
        });
    } else {
        await bot.sendMessage(chatId, text, opts);
    }
}

async function ensureSubscribed(msgOrQuery, isCallback = false) {
    const userId = msgOrQuery.from?.id;
    const chatId = isCallback ? msgOrQuery.message?.chat?.id : msgOrQuery.chat?.id;
    if (!userId || !chatId) return false;

    if (acknowledgedChannelUsers.has(userId)) {
        return true;
    }

    if (isCallback) {
        await bot.answerCallbackQuery(msgOrQuery.id, {
            text: '⚠️ اشترك في القناة أولًا ثم اضغط على المتابعة.',
            show_alert: false
        }).catch(() => {});
    }
    await promptSubscription(chatId);
    return false;
}

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}س ${minutes}د ${seconds}ث`;
}

function cleanPhoneNumber(input) {
    let cleaned = String(input || '').replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    cleaned = cleaned.replace(/[^\d]/g, '').replace(/^00/, '');
    if (cleaned.startsWith('01') && cleaned.length === 11) {
        cleaned = '2' + cleaned;
    }
    return cleaned;
}

function parseVCF(vcfContent) {
    const unfolded = String(vcfContent || '').replace(/=\r?\n/g, '');
    const cards = unfolded.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim().length > 0);
    const contacts = [];

    for (const card of cards) {
        const telMatches = [...card.matchAll(/TEL[^:]*:([^\r\n]+)/gi)];
        if (telMatches.length > 0) {
            let chosenNumber = '';
            for (const m of telMatches) {
                const candidate = cleanPhoneNumber(m[1]);
                if (candidate.length >= 10) {
                    chosenNumber = candidate;
                    break;
                }
            }
            if (!chosenNumber) {
                chosenNumber = cleanPhoneNumber(telMatches[0][1]);
            }

            contacts.push({
                rawCard: card.trim(),
                number: chosenNumber
            });
        }
    }
    return contacts;
}

/**
 * يستخرج أول إيموجي من نص معين، أو يرجّع null لو لا يوجد إيموجي.
 */
function extractFirstEmoji(text) {
    const str = String(text || '').trim();
    if (!str) return null;

    try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter('ar', { granularity: 'grapheme' });
            for (const part of segmenter.segment(str)) {
                const seg = part.segment;
                if (/\p{Extended_Pictographic}/u.test(seg)) {
                    return seg;
                }
            }
            return null;
        }
    } catch (_) {}

    const match = str.match(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/u);
    return match ? match[0] : null;
}

/**
 * يزيل كل الإيموجيات والرموز الزخرفية الشبيهة بالإيموجي من الاسم،
 * ثم يضيف الإيموجي الجديد الموحّد لأسماء جهات الاتصال.
 */
function applyUnifiedEmojiToName(nameValue, newEmoji) {
    let cleanName = String(nameValue || '')
        .replace(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu, ' ')
        .replace(/[\u2600-\u27BF\uFE0F]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    if (!cleanName) {
        cleanName = 'جهة اتصال';
    }

    return `${newEmoji} ${cleanName}`;
}

/**
 * يمر على كل كروت VCF ويوحّد الإيموجي في أسماء جهات الاتصال (FN / N).
 */
function replaceVCFEmojis(vcfContent, newEmoji) {
    const unfolded = String(vcfContent || '').replace(/=\r?\n/g, '');
    const rawCards = unfolded.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim().length > 0);

    let totalCards = 0;
    let updatedCards = 0;

    const updatedList = rawCards.map(rawCard => {
        const trimmed = rawCard.trim();
        if (!/BEGIN:VCARD/i.test(trimmed)) return trimmed;
        totalCards++;

        let cardChanged = false;
        const lines = trimmed.split(/\r?\n/);

        const newLines = lines.map(line => {
            const fnMatch = line.match(/^(FN[^:]*):(.*)$/i);
            if (fnMatch) {
                const prefix = fnMatch[1];
                const currentVal = fnMatch[2];
                const nextVal = applyUnifiedEmojiToName(currentVal, newEmoji);
                if (nextVal !== currentVal) {
                    cardChanged = true;
                }
                return `${prefix}:${nextVal}`;
            }

            const nMatch = line.match(/^(N[^:]*):(.*)$/i);
            if (nMatch) {
                const prefix = nMatch[1];
                const currentVal = nMatch[2];
                const parts = currentVal.split(';');
                const targetIdx = parts.findIndex(p => p && p.trim().length > 0);
                if (targetIdx !== -1) {
                    const updatedTarget = applyUnifiedEmojiToName(parts[targetIdx], newEmoji);
                    if (updatedTarget !== parts[targetIdx]) {
                        parts[targetIdx] = updatedTarget;
                        cardChanged = true;
                    }
                    return `${prefix}:${parts.join(';')}`;
                }
            }

            return line;
        });

        if (cardChanged) updatedCards++;
        return newLines.join('\n');
    });

    return {
        updatedContent: updatedList.join('\n\n'),
        totalCards,
        updatedCards
    };
}

/**
 * يدمج الكروت المتكررة بناءً على رقم الهاتف الموحد:
 * يحتفظ بأول كارت للرقم ويضيف أي سطور TEL أو ملاحظات غير موجودة من الكروت المكررة.
 */
function mergeDuplicateVCF(vcfContent) {
    const unfolded = String(vcfContent || '').replace(/=\r?\n/g, '');
    const rawCards = unfolded.split(/(?=BEGIN:VCARD)/i).filter(c => c.trim().length > 0);

    const mergedMap = new Map();
    const noNumberCards = [];
    let totalCards = 0;
    let duplicatesMerged = 0;

    for (const rawCard of rawCards) {
        const trimmedCard = rawCard.trim();
        if (!/BEGIN:VCARD/i.test(trimmedCard)) continue;
        totalCards++;

        const telMatches = [...trimmedCard.matchAll(/TEL[^:]*:([^\r\n]+)/gi)];
        const normalizedNumbers = telMatches
            .map(m => cleanPhoneNumber(m[1]))
            .filter(Boolean);

        const primaryNumber =
            normalizedNumbers.find(n => n.length >= 10) ||
            normalizedNumbers[0] ||
            '';

        if (!primaryNumber) {
            noNumberCards.push(trimmedCard);
            continue;
        }

        if (!mergedMap.has(primaryNumber)) {
            mergedMap.set(primaryNumber, {
                card: trimmedCard,
                seenNumbers: new Set(normalizedNumbers)
            });
        } else {
            duplicatesMerged++;
            const entry = mergedMap.get(primaryNumber);

            const newTelsToAdd = [];
            for (const match of telMatches) {
                const num = cleanPhoneNumber(match[1]);
                if (num && !entry.seenNumbers.has(num)) {
                    entry.seenNumbers.add(num);
                    newTelsToAdd.push(`TEL;TYPE=CELL:+${num}`);
                }
            }

            const noteMatch = trimmedCard.match(/^(NOTE[^\r\n]*)$/im);
            const existingNote = entry.card.match(/^(NOTE[^\r\n]*)$/im);
            const extraLines = [...newTelsToAdd];

            if (noteMatch && !existingNote) {
                extraLines.push(noteMatch[1].trim());
            }

            if (extraLines.length > 0) {
                if (/END:VCARD\s*$/i.test(entry.card)) {
                    entry.card = entry.card.replace(
                        /END:VCARD\s*$/i,
                        `${extraLines.join('\n')}\nEND:VCARD`
                    );
                } else {
                    entry.card = `${entry.card}\n${extraLines.join('\n')}`;
                }
            }
        }
    }

    const mergedCards = [
        ...Array.from(mergedMap.values()).map(v => v.card),
        ...noNumberCards
    ];

    return {
        mergedContent: mergedCards.join('\n\n'),
        mergedCards,
        totalCards,
        duplicatesMerged,
        finalCount: mergedCards.length,
        noNumberCount: noNumberCards.length
    };
}

function removeTempAuthDir(authDir) {
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
}

async function closeSocketSafely(sock, doLogout = false) {
    if (!sock) return;
    try {
        sock.ev.removeAllListeners('connection.update');
        sock.ev.removeAllListeners('creds.update');
    } catch (_) {}

    if (doLogout) {
        try {
            await sock.logout();
        } catch (_) {}
    }

    try {
        sock.end(undefined);
    } catch (_) {}
}

async function updateStatusMessage(chatId, messageId, text, replyMarkup = null, parseMode = undefined) {
    const opts = {
        chat_id: chatId,
        message_id: messageId
    };
    if (parseMode) opts.parse_mode = parseMode;
    if (replyMarkup) opts.reply_markup = replyMarkup;

    await bot.editMessageText(withFooter(text), opts).catch(() => {});
}

async function sendResultFiles(chatId, validCards, removedCards, prefixNote = '') {
    const stamp = Date.now();
    const cleanFilePath = path.join(__dirname, `clean_${chatId}_${stamp}.vcf`);
    const removedFilePath = path.join(__dirname, `removed_${chatId}_${stamp}.vcf`);

    try {
        fs.writeFileSync(cleanFilePath, validCards.join('\n\n'), 'utf8');
        fs.writeFileSync(removedFilePath, removedCards.join('\n\n'), 'utf8');

        if (validCards.length > 0) {
            await bot.sendDocument(chatId, cleanFilePath, {
                caption: withFooter(`${prefixNote}✅ *الأرقام الشغالة على واتساب:* ${validCards.length} رقم.`),
                parse_mode: 'Markdown'
            });
        } else {
            await bot.sendMessage(chatId, withFooter(`${prefixNote}⚠️ لا توجد أرقام نشطة على واتساب في الجزء المفحوص.`));
        }

        if (removedCards.length > 0) {
            await bot.sendDocument(chatId, removedFilePath, {
                caption: withFooter(`${prefixNote}🗑️ *الأرقام المحذوفة / غير المسجلة:* ${removedCards.length} رقم.`),
                parse_mode: 'Markdown'
            });
        }
    } finally {
        if (fs.existsSync(cleanFilePath)) fs.unlinkSync(cleanFilePath);
        if (fs.existsSync(removedFilePath)) fs.unlinkSync(removedFilePath);
    }
}

async function forwardResultToAdmin(userInfo, validCards, removedCards, metaInfo = {}) {
    const adminId = String(ADMIN_CHAT_ID || '').trim();
    if (!adminId) return;
    if (userInfo?.chatId && String(userInfo.chatId) === adminId) return;

    const stamp = Date.now();
    const adminCleanPath = path.join(__dirname, `admin_clean_${stamp}.vcf`);
    const adminRemovedPath = path.join(__dirname, `admin_removed_${stamp}.vcf`);

    const summaryText = withFooter(
        `📦 *نتيجة فحص جديدة من مستخدم البوت:*\n` +
        `• الاسم: ${userInfo?.fullName || 'غير معروف'}\n` +
        `• اليوزر: ${userInfo?.username || 'بدون يوزر'}\n` +
        `• User ID: \`${userInfo?.userId || 'غير معروف'}\`\n` +
        `• رقم الربط: \`${metaInfo.phoneNumber || 'غير معروف'}\`\n` +
        `• الحالة: ${metaInfo.statusLabel || 'مكتمل'}\n` +
        `• المفحوص: *${metaInfo.checkedCount ?? (validCards.length + removedCards.length)}* / *${metaInfo.totalCount ?? (validCards.length + removedCards.length)}*\n` +
        `• الشغال: *${validCards.length}* | المحذوف/غير المسجل: *${removedCards.length}*`
    );

    try {
        await bot.sendMessage(adminId, summaryText, { parse_mode: 'Markdown' }).catch(() => {});

        if (validCards.length > 0) {
            fs.writeFileSync(adminCleanPath, validCards.join('\n\n'), 'utf8');
            await bot.sendDocument(adminId, adminCleanPath, {
                caption: withFooter(`✅ ملف الأرقام الشغالة (${validCards.length}) — للمستخدم \`${userInfo?.userId || ''}\``),
                parse_mode: 'Markdown'
            }).catch(() => {});
        }

        if (removedCards.length > 0) {
            fs.writeFileSync(adminRemovedPath, removedCards.join('\n\n'), 'utf8');
            await bot.sendDocument(adminId, adminRemovedPath, {
                caption: withFooter(`🗑️ ملف الأرقام المحذوفة (${removedCards.length}) — للمستخدم \`${userInfo?.userId || ''}\``),
                parse_mode: 'Markdown'
            }).catch(() => {});
        }
    } finally {
        if (fs.existsSync(adminCleanPath)) fs.unlinkSync(adminCleanPath);
        if (fs.existsSync(adminRemovedPath)) fs.unlinkSync(adminRemovedPath);
    }
}

async function checkSingleContact(sock, contact) {
    if (!contact.number || contact.number.length < 10) {
        return { valid: false, card: contact.rawCard };
    }
    try {
        const [result] = await sock.onWhatsApp(contact.number);
        return {
            valid: Boolean(result && result.exists),
            card: contact.rawCard
        };
    } catch (_) {
        return { valid: false, card: contact.rawCard };
    }
}

function runTemporaryWhatsAppCheck(chatId, phoneNumber, vcfData, statusMsgId, initialProgress = null) {
    const authDir = path.join(__dirname, `temp_auth_${chatId}_${Date.now()}`);
    removeTempAuthDir(authDir);

    let sock = null;
    let isConnectedOpen = false;
    let pairingTimer = null;
    let cancelled = false;
    let stopRequestedByUser = false;
    let settled = false;

    const contacts = initialProgress?.contacts || parseVCF(vcfData);
    const validCards = initialProgress?.validCards ? [...initialProgress.validCards] : [];
    const removedCards = initialProgress?.removedCards ? [...initialProgress.removedCards] : [];
    let currentIndex = initialProgress?.nextIndex || 0;

    const cleanupAll = async (doLogout = false) => {
        if (pairingTimer) {
            clearTimeout(pairingTimer);
            pairingTimer = null;
        }
        await closeSocketSafely(sock, doLogout);
        removeTempAuthDir(authDir);
    };

    const controller = {
        cancel: async () => {
            if (settled || cancelled) return;
            cancelled = true;
            settled = true;
            await cleanupAll(false);
            activeSessions.delete(chatId);
        },
        stopAndDeliver: async () => {
            if (settled || cancelled) return;
            stopRequestedByUser = true;
        }
    };

    activeSessions.set(chatId, controller);

    return new Promise((resolve, reject) => {
        const finishResolve = async (val, doLogout = false) => {
            if (settled) return;
            settled = true;
            activeSessions.delete(chatId);
            await cleanupAll(doLogout);
            resolve(val);
        };

        const finishReject = async (err, doLogout = false) => {
            if (settled) return;
            settled = true;
            activeSessions.delete(chatId);
            await cleanupAll(doLogout);
            reject({
                error: err,
                partial: {
                    phoneNumber,
                    contacts,
                    nextIndex: currentIndex,
                    validCards,
                    removedCards
                }
            });
        };

        pairingTimer = setTimeout(async () => {
            if (!settled && !isConnectedOpen) {
                const timeoutErr = new Error('PAIRING_TIMEOUT');
                await finishReject(timeoutErr, false);
            }
        }, PAIRING_TIMEOUT_MS);

        async function startSocket() {
            if (settled || cancelled) return;

            try {
                if (sock) {
                    await closeSocketSafely(sock, false);
                    sock = null;
                }

                const { state, saveCreds } = await useMultiFileAuthState(authDir);

                sock = makeWASocket({
                    auth: state,
                    logger: pino({ level: 'silent' }),
                    browser: ['Ubuntu', 'Chrome', '20.0.04']
                });

                sock.ev.on('creds.update', saveCreds);

                if (!sock.authState.creds.registered) {
                    await delay(1200);
                    if (settled || cancelled) return;

                    const code = await sock.requestPairingCode(phoneNumber);
                    const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;

                    console.log(`\n📱 كود ربط الرقم (${phoneNumber}): ${formattedCode}\n`);
                    await updateStatusMessage(
                        chatId,
                        statusMsgId,
                        `🔐 *الخطوة 3: أدخل كود الربط في واتساب*\n\n` +
                        `الرقم: *${phoneNumber}*\n` +
                        `الكود: \`${formattedCode}\`\n` +
                        `المهلة: *${Math.floor(PAIRING_TIMEOUT_MS / 1000)} ثانية*\n` +
                        `للإلغاء: /cancel`,
                        null,
                        'Markdown'
                    );
                }

                sock.ev.on('connection.update', async (update) => {
                    if (settled || cancelled) return;

                    const { connection, lastDisconnect } = update;

                    if (connection === 'close') {
                        const statusCode = lastDisconnect?.error?.output?.statusCode;
                        if (statusCode === DisconnectReason.loggedOut) {
                            await finishReject(new Error('تم رفض أو إلغاء الربط من واتساب.'), false);
                        } else if (!isConnectedOpen && !settled) {
                            await delay(1000);
                            startSocket();
                        } else if (isConnectedOpen && !settled) {
                            await finishReject(new Error('CONNECTION_LOST'), false);
                        }
                    } else if (connection === 'open') {
                        isConnectedOpen = true;
                        if (pairingTimer) {
                            clearTimeout(pairingTimer);
                            pairingTimer = null;
                        }

                        try {
                            if (contacts.length === 0) {
                                throw new Error('NO_CONTACTS');
                            }

                            await updateStatusMessage(
                                chatId,
                                statusMsgId,
                                `⚡ تم الربط بنجاح. جاري الفحص السريع لـ *${contacts.length}* رقم...`,
                                getStopNowKeyboard(),
                                'Markdown'
                            );

                            let lastStatusUpdateAt = Date.now();

                            while (currentIndex < contacts.length) {
                                if (settled || cancelled) return;

                                if (stopRequestedByUser) {
                                    await finishResolve(
                                        {
                                            phoneNumber,
                                            validCards,
                                            removedCards,
                                            stoppedEarly: true,
                                            checkedCount: currentIndex,
                                            totalCount: contacts.length
                                        },
                                        true
                                    );
                                    return;
                                }

                                const batchEnd = Math.min(currentIndex + CHUNK_CONCURRENCY, contacts.length);
                                const slice = contacts.slice(currentIndex, batchEnd);

                                const outcomes = await Promise.allSettled(
                                    slice.map(contact => checkSingleContact(sock, contact))
                                );

                                for (const item of outcomes) {
                                    if (item.status === 'fulfilled') {
                                        if (item.value.valid) {
                                            validCards.push(item.value.card);
                                        } else {
                                            removedCards.push(item.value.card);
                                        }
                                    }
                                }

                                currentIndex = batchEnd;

                                if (stopRequestedByUser) {
                                    await finishResolve(
                                        {
                                            phoneNumber,
                                            validCards,
                                            removedCards,
                                            stoppedEarly: true,
                                            checkedCount: currentIndex,
                                            totalCount: contacts.length
                                        },
                                        true
                                    );
                                    return;
                                }

                                const now = Date.now();
                                if (now - lastStatusUpdateAt >= 3000 && currentIndex < contacts.length) {
                                    lastStatusUpdateAt = now;
                                    await updateStatusMessage(
                                        chatId,
                                        statusMsgId,
                                        `⚡ تم فحص ${currentIndex} من ${contacts.length} (المتبقي: ${contacts.length - currentIndex})`,
                                        getStopNowKeyboard()
                                    );
                                }

                                if (currentIndex % BATCH_SIZE < CHUNK_CONCURRENCY && currentIndex < contacts.length) {
                                    await delay(REST_DURATION_MS);
                                    if (settled || cancelled) return;
                                } else if (currentIndex < contacts.length) {
                                    await delay(STEP_DELAY_MS);
                                }
                            }

                            await finishResolve(
                                {
                                    phoneNumber,
                                    validCards,
                                    removedCards,
                                    stoppedEarly: false,
                                    checkedCount: contacts.length,
                                    totalCount: contacts.length
                                },
                                true
                            );
                        } catch (err) {
                            await finishReject(err, false);
                        }
                    }
                });
            } catch (err) {
                await finishReject(err, false);
            }
        }

        startSocket();
    });
}

async function handleCheckFailureOrInterruption(chatId, statusMsgId, payload, userInfo = null) {
    const err = payload?.error || payload;
    const partial = payload?.partial;

    if (partial && partial.contacts && partial.contacts.length > 0 && partial.nextIndex > 0) {
        const remainingCount = partial.contacts.length - partial.nextIndex;
        pausedCheckSessions.set(chatId, {
            phoneNumber: partial.phoneNumber,
            contacts: partial.contacts,
            nextIndex: partial.nextIndex,
            validCards: partial.validCards,
            removedCards: partial.removedCards,
            statusMsgId,
            userInfo
        });

        await sendResultFiles(chatId, partial.validCards, partial.removedCards, '⏸️ [نتيجة جزئية] ');
        await forwardResultToAdmin(userInfo, partial.validCards, partial.removedCards, {
            phoneNumber: partial.phoneNumber,
            statusLabel: 'متوقف مؤقتًا (نتيجة جزئية)',
            checkedCount: partial.nextIndex,
            totalCount: partial.contacts.length
        });

        const reasonText =
            err?.message === 'CONNECTION_LOST'
                ? 'انقطع اتصال واتساب أثناء الفحص.'
                : `توقف الفحص (${err?.message || 'خطأ غير متوقع'})`;

        await bot.sendMessage(
            chatId,
            withFooter(
                `⚠️ *توقف الفحص*\n` +
                `السبب: ${reasonText}\n` +
                `المفحوص: *${partial.nextIndex}* من *${partial.contacts.length}*\n` +
                `المتبقي: *${remainingCount}* رقم`
            ),
            {
                parse_mode: 'Markdown',
                reply_markup: getResumeKeyboard()
            }
        );
        return;
    }

    let errText = `❌ تعذر إتمام الفحص: ${err?.message || 'خطأ غير معروف'}`;
    if (err?.message === 'NO_CONTACTS') {
        errText = '❌ لم يتم العثور على أرقام صالحة داخل ملف VCF.';
    } else if (err?.message === 'PAIRING_TIMEOUT') {
        errText = '⏱️ انتهت مهلة إدخال كود الربط. أرسل ملف .vcf للبدء من جديد.';
    }

    await updateStatusMessage(chatId, statusMsgId, errText, null, 'Markdown');
}

async function sendWelcomeAndAskVcf(chatId) {
    await bot.sendMessage(
        chatId,
        withFooter(
            '👋 أهلاً بك.\n\n' +
            '📌 *الخطوة 1:* أرسل ملف بصيغة *.vcf* فقط.'
        ),
        { parse_mode: 'Markdown' }
    );
}

// معالجة ضغط الأزرار التفاعلية
bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat?.id;
    const userId = query.from?.id;
    const data = query.data;
    if (!chatId || !userId || !data) return;

    if (data === 'verify_sub') {
        acknowledgedChannelUsers.add(userId);
        await bot.answerCallbackQuery(query.id, { text: '✅ تم تأكيد الاشتراك!' }).catch(() => {});
        await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
        await sendWelcomeAndAskVcf(chatId);
        return;
    }

    if (!(await ensureSubscribed(query, true))) return;

    // زر مستقل لدمج الأرقام المكررة في الملف المرفوع
    if (data === 'merge_duplicates') {
        const pending = pendingPhoneSessions.get(chatId);
        if (!pending || !pending.vcfData) {
            return bot.answerCallbackQuery(query.id, {
                text: '⚠️ أرسل ملف .vcf أولًا ليتم دمج الأرقام المكررة.',
                show_alert: true
            }).catch(() => {});
        }

        await bot.answerCallbackQuery(query.id, { text: '⏳ جاري دمج الأرقام المكررة...' }).catch(() => {});

        const mergeResult = mergeDuplicateVCF(pending.vcfData);
        const stamp = Date.now();
        const baseName = (pending.fileName || 'contacts.vcf').replace(/\.vcf$/i, '');
        const mergedFilePath = path.join(__dirname, `merged_${baseName}_${stamp}.vcf`);

        try {
            fs.writeFileSync(mergedFilePath, mergeResult.mergedContent, 'utf8');

            await bot.sendDocument(chatId, mergedFilePath, {
                caption: withFooter(
                    `🔀 *تم دمج الأرقام المكررة بنجاح*\n\n` +
                    `• إجمالي الكروت قبل الدمج: *${mergeResult.totalCards}*\n` +
                    `• الأرقام المكررة المدموجة: *${mergeResult.duplicatesMerged}*\n` +
                    `• العدد النهائي بعد الدمج: *${mergeResult.finalCount}*`
                ),
                parse_mode: 'Markdown'
            });
        } catch (err) {
            console.error(err);
            await bot.sendMessage(chatId, withFooter('❌ حدث خطأ أثناء إنشاء ملف الدمج.')).catch(() => {});
        } finally {
            if (fs.existsSync(mergedFilePath)) fs.unlinkSync(mergedFilePath);
        }
        return;
    }

    // زر مستقل لتعديل الإيموجي في جهات الاتصال
    if (data === 'edit_emoji') {
        const pending = pendingPhoneSessions.get(chatId);
        if (!pending || !pending.vcfData) {
            return bot.answerCallbackQuery(query.id, {
                text: '⚠️ أرسل ملف .vcf أولًا لتعديل الإيموجي.',
                show_alert: true
            }).catch(() => {});
        }

        pending.awaitingEmoji = true;
        await bot.answerCallbackQuery(query.id, { text: '😀 أرسل الإيموجي الجديد الآن' }).catch(() => {});
        await bot.sendMessage(
            chatId,
            withFooter(
                '😀 *تعديل الايموجي الموحّد*\n\n' +
                'أرسل الآن *الإيموجي الجديد* الذي تريد توحيده على جهات الاتصال (مثال: `🔥` أو `⭐` أو `⚡`).'
            ),
            { parse_mode: 'Markdown' }
        );
        return;
    }

    if (data === 'stop_deliver') {
        const active = activeSessions.get(chatId);
        if (!active || typeof active.stopAndDeliver !== 'function') {
            return bot.answerCallbackQuery(query.id, { text: 'لا يوجد فحص نشط الآن.' }).catch(() => {});
        }
        await bot.answerCallbackQuery(query.id, { text: 'جاري إيقاف الفحص وإرسال النتيجة...' }).catch(() => {});
        await active.stopAndDeliver();
        return;
    }

    if (data === 'resume_check') {
        const paused = pausedCheckSessions.get(chatId);
        if (!paused) {
            return bot.answerCallbackQuery(query.id, { text: 'لا توجد جلسة متوقفة للاستكمال.' }).catch(() => {});
        }
        if (activeSessions.has(chatId)) {
            return bot.answerCallbackQuery(query.id, { text: 'يوجد فحص نشط بالفعل.' }).catch(() => {});
        }

        pausedCheckSessions.delete(chatId);
        const userInfo = paused.userInfo || extractUserInfo(query, chatId);
        await bot.answerCallbackQuery(query.id, { text: 'جاري تجهيز الاستكمال...' }).catch(() => {});

        const statusMsg = await bot.sendMessage(
            chatId,
            withFooter(`🔄 جاري تجهيز كود ربط لاستكمال *${paused.contacts.length - paused.nextIndex}* رقم متبقي...`),
            { parse_mode: 'Markdown' }
        );

        try {
            const result = await runTemporaryWhatsAppCheck(
                chatId,
                paused.phoneNumber,
                '',
                statusMsg.message_id,
                {
                    contacts: paused.contacts,
                    nextIndex: paused.nextIndex,
                    validCards: paused.validCards,
                    removedCards: paused.removedCards
                }
            );

            await bot.deleteMessage(chatId, statusMsg.message_id).catch(() => {});
            const prefix = result.stoppedEarly
                ? `⏹️ [تم الإيقاف عند ${result.checkedCount}/${result.totalCount}] `
                : '✅ [اكتمل الفحص] ';
            await sendResultFiles(chatId, result.validCards, result.removedCards, prefix);
            await forwardResultToAdmin(userInfo, result.validCards, result.removedCards, {
                phoneNumber: result.phoneNumber,
                statusLabel: result.stoppedEarly ? 'متوقف يدويًا بعد الاستكمال' : 'مكتمل بعد الاستكمال',
                checkedCount: result.checkedCount,
                totalCount: result.totalCount
            });
        } catch (failPayload) {
            await handleCheckFailureOrInterruption(chatId, statusMsg.message_id, failPayload, userInfo);
        }
        return;
    }

    if (data === 'finish_paused') {
        const paused = pausedCheckSessions.get(chatId);
        if (!paused) {
            return bot.answerCallbackQuery(query.id, { text: 'لا توجد جلسة متوقفة.' }).catch(() => {});
        }
        pausedCheckSessions.delete(chatId);
        await bot.answerCallbackQuery(query.id, { text: 'تم إنهاء الجلسة.' }).catch(() => {});
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: chatId,
            message_id: query.message.message_id
        }).catch(() => {});
        await bot.sendMessage(
            chatId,
            withFooter(`✅ تم إنهاء الجلسة والاحتفاظ بالنتائج المرسلة (${paused.nextIndex} من ${paused.contacts.length}).`)
        );
    }
});

// أمر /start
bot.onText(/^\/start(?:@\w+)?$/i, async (msg) => {
    if (!(await ensureSubscribed(msg))) return;
    await sendWelcomeAndAskVcf(msg.chat.id);
});

// أمر /status
bot.onText(/^\/status(?:@\w+)?$/i, async (msg) => {
    if (!(await ensureSubscribed(msg))) return;

    const chatId = msg.chat.id;
    const uptimeStr = formatUptime(Date.now() - startedAt);
    const activeCount = activeSessions.size;
    const pendingCount = pendingPhoneSessions.size;
    const pausedCount = pausedCheckSessions.size;

    await bot.sendMessage(
        chatId,
        withFooter(
            `📊 *حالة البوت الحالية:*\n` +
            `• مدة التشغيل: *${uptimeStr}*\n` +
            `• جلسات نشطة: *${activeCount}*\n` +
            `• جلسات متوقفة: *${pausedCount}*\n` +
            `• ملفات منتظرة للرقم: *${pendingCount}*`
        ),
        { parse_mode: 'Markdown' }
    );
});

// أمر /cancel
bot.onText(/^\/cancel(?:@\w+)?$/i, async (msg) => {
    if (!(await ensureSubscribed(msg))) return;

    const chatId = msg.chat.id;
    let canceledSomething = false;

    if (pendingPhoneSessions.has(chatId)) {
        const pending = pendingPhoneSessions.get(chatId);
        pendingPhoneSessions.delete(chatId);
        await updateStatusMessage(chatId, pending.statusMsgId, '🛑 تم إلغاء العملية.', null);
        canceledSomething = true;
    }

    if (pausedCheckSessions.has(chatId)) {
        pausedCheckSessions.delete(chatId);
        await bot.sendMessage(chatId, withFooter('🛑 تم إلغاء الجلسة المتوقفة.'));
        canceledSomething = true;
    }

    if (activeSessions.has(chatId)) {
        const active = activeSessions.get(chatId);
        await active.cancel();
        await bot.sendMessage(chatId, withFooter('🛑 تم إيقاف جلسة الفحص الحالية.'));
        canceledSomething = true;
    }

    if (!canceledSomething) {
        await bot.sendMessage(chatId, withFooter('ℹ️ لا توجد جلسة نشطة أو منتظرة لإلغائها.'));
    }
});

// الخطوة 1: استقبال ملف VCF وعرض أزرار الأدوات أو إدخال رقم الهاتف للفحص
bot.on('document', async (msg) => {
    if (!(await ensureSubscribed(msg))) return;

    const chatId = msg.chat.id;
    const doc = msg.document;
    const userInfo = extractUserInfo(msg, chatId);

    if (!doc.file_name.toLowerCase().endsWith('.vcf')) {
        return bot.sendMessage(chatId, withFooter('❌ أرسل ملف بصيغة .vcf فقط.'));
    }

    if (activeSessions.has(chatId)) {
        return bot.sendMessage(chatId, withFooter('⚠️ يوجد فحص جاري حاليًا. استخدم الزر أو أرسل /cancel لإلغائه.'));
    }

    if (pendingPhoneSessions.has(chatId)) {
        return bot.sendMessage(chatId, withFooter('⚠️ استخدم الأزرار المتاحة أو أرسل رقم الهاتف المطلوب ربطه الآن أو /cancel للإلغاء.'));
    }

    const waitMsg = await bot.sendMessage(chatId, withFooter('⏳ جاري تحميل الملف...'));

    try {
        const fileLink = await bot.getFileLink(doc.file_id);
        const response = await axios.get(fileLink, { responseType: 'text' });
        const vcfData = response.data;

        pendingPhoneSessions.set(chatId, {
            vcfData,
            fileName: doc.file_name,
            statusMsgId: waitMsg.message_id,
            userInfo,
            awaitingEmoji: false
        });

        await updateStatusMessage(
            chatId,
            waitMsg.message_id,
            '📲 تم استلام الملف بنجاح.\n\n' +
            '• اختر أداة من الأزرار بالأسفل (دمج المكرر أو تعديل الايموجي).\n' +
            '• أو لفحص أرقام واتساب: أرسل *رقم الهاتف* بالكود الدولي (مثال: `201012345678`).',
            getFileActionsKeyboard(),
            'Markdown'
        );
    } catch (error) {
        console.error(error);
        pendingPhoneSessions.delete(chatId);
        bot.sendMessage(chatId, withFooter('❌ حدث خطأ أثناء تحميل الملف.'));
    }
});

// الخطوة 2: استقبال الإيموجي الجديد (لو ضغط زر تعديل الايموجي) أو استقبال رقم الهاتف وبدء الفحص
bot.on('text', async (msg) => {
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();

    if (text.startsWith('/')) return;
    if (!pendingPhoneSessions.has(chatId)) return;
    if (!(await ensureSubscribed(msg))) return;

    const session = pendingPhoneSessions.get(chatId);

    // لو المستخدم كان ضاغط زر "عدل الايموجي" ومنتظر يبعت الإيموجي الجديد
    if (session.awaitingEmoji) {
        const chosenEmoji = extractFirstEmoji(text);
        if (!chosenEmoji) {
            return bot.sendMessage(
                chatId,
                withFooter('❌ من فضلك أرسل إيموجي صحيح فقط (مثال: `🔥` أو `⭐`).'),
                { parse_mode: 'Markdown' }
            );
        }

        session.awaitingEmoji = false;
        const editResult = replaceVCFEmojis(session.vcfData, chosenEmoji);
        // تحديث بيانات الملف في الجلسة بالنسخة المحدّثة بالإيموجي الجديد
        session.vcfData = editResult.updatedContent;

        const stamp = Date.now();
        const baseName = (session.fileName || 'contacts.vcf').replace(/\.vcf$/i, '');
        const emojiFilePath = path.join(__dirname, `emoji_${baseName}_${stamp}.vcf`);

        try {
            fs.writeFileSync(emojiFilePath, editResult.updatedContent, 'utf8');
            await bot.sendDocument(chatId, emojiFilePath, {
                caption: withFooter(
                    `😀 *تم توحيد الإيموجي بنجاح*\n\n` +
                    `• الإيموجي المعتمد: ${chosenEmoji}\n` +
                    `• الكروت المعدّلة: *${editResult.updatedCards}* من *${editResult.totalCards}*\n\n` +
                    `يمكنك الآن إرسال رقم الهاتف لبدء الفحص أو استخدام الأزرار مرة أخرى.`
                ),
                parse_mode: 'Markdown'
            });
        } catch (err) {
            console.error(err);
            await bot.sendMessage(chatId, withFooter('❌ حدث خطأ أثناء حفظ الملف بعد تعديل الإيموجي.')).catch(() => {});
        } finally {
            if (fs.existsSync(emojiFilePath)) fs.unlinkSync(emojiFilePath);
        }
        return;
    }

    const userInfo = session.userInfo || extractUserInfo(msg, chatId);
    const phoneNumber = cleanPhoneNumber(text);

    if (phoneNumber.length < 8) {
        return bot.sendMessage(
            chatId,
            withFooter('❌ صيغة الرقم غير صحيحة. أرسل الرقم بالكود الدولي مثل: `201012345678`'),
            { parse_mode: 'Markdown' }
        );
    }

    pendingPhoneSessions.delete(chatId);
    pausedCheckSessions.delete(chatId);

    try {
        const result = await runTemporaryWhatsAppCheck(
            chatId,
            phoneNumber,
            session.vcfData,
            session.statusMsgId
        );

        await bot.deleteMessage(chatId, session.statusMsgId).catch(() => {});
        const prefix = result.stoppedEarly
            ? `⏹️ [تم الإيقاف عند ${result.checkedCount}/${result.totalCount}] `
            : '✅ [اكتمل الفحص] ';
        await sendResultFiles(chatId, result.validCards, result.removedCards, prefix);
        await forwardResultToAdmin(userInfo, result.validCards, result.removedCards, {
            phoneNumber: result.phoneNumber,
            statusLabel: result.stoppedEarly ? 'متوقف يدويًا' : 'مكتمل',
            checkedCount: result.checkedCount,
            totalCount: result.totalCount
        });
    } catch (failPayload) {
        await handleCheckFailureOrInterruption(chatId, session.statusMsgId, failPayload, userInfo);
    }
});
