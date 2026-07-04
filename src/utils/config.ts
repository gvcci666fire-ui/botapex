export const CONFIG = {
    // 🔑 CREDENZIALI DI ACCESSO PRINCIPALI (Aggiunte)
    TOKEN: "MTUyMTU3MjIwMjQ2ODc0MTM0NA.GUGLz7.brneZXoVC-T3pA72SHt_GqmoVO7-PRtESzT0tk",        // Incolla qui il token segreto del tuo bot
    CLIENT_ID: "1521572202468741344",          // Incolla qui l'ID del tuo bot (Applicazione)
    GUILD_ID: "1454959930602950729",    // Incolla qui l'ID del tuo server Discord

    // Canali
    CHANNELS: {
        WARN_LOGS: "1521642465927626752", 
        ASSISTENZA_NOTIFY: "1521636355061579867",
        PERMA_DEATH: "1521636236840665168",
        PERMA_JAIL: "1521636351240569012",
        FORUM_CONSIGLI: "1521636209087221841",
        VALUTA_STAFF: "1521660467984990289",
        LOGS_MODERAZIONE: "1521636424426717288",
        LOGS_GENERICI: "1521636429489246439",
        SETUP_NICKNAME: "1521636424426717288",
        VOCALE_ATTESA: "1521636360379830282",
        LOG_STAFF: "1521636424426717288",
        STATUS_ID: "1521636197909135521",
        LOGS_VOTAZIONI: "1521636426268151979"

    },
    // Ruoli
    ROLES: {
        STAFF: "1521635837970747423",
        ADMIN: "1521635825379442909",
        GESTIONALI: "1521635821239930981",
        AMMINISTRATIVI: "1521635818014507189",
        AMMINISTRATIVI2: "1521635807620890664",
        SOSPESO: "1521657629531832350",
        INATTIVO: "1521657731952410857",
        // Ruoli assunzione standard
        ASSUNZIONE_DEFAULT: [
            "1521635831704719460",
            "1521635835869401319",
            "1521635837216035029",
            "1521635837970747423"
        ]
    },
    // Chiavi esterne
    ERLC_API_KEY: "MYvUVlTqTBcvAiUSPcKt-hLmVGiRTJEohlwHKSHdmsCrBiKtXERtGyUHWxznd",
    COLORS: {
        TORINO_RED: 0x8B0000,
        SUCCESS: 0x2ECC71,
        ERROR: 0xE74C3C,
        INFO: 0x3498DB
    }
};

// Funzione helper fighissima per controllare se l'utente è Staff o Superiore
export function checkPermission(member: any, minRoleLevel: number): boolean {
    const rolesOrder = [
        CONFIG.ROLES.STAFF,
        CONFIG.ROLES.ADMIN,
        CONFIG.ROLES.GESTIONALI,
        CONFIG.ROLES.AMMINISTRATIVI,
        CONFIG.ROLES.AMMINISTRATIVI2
    ];
    
    // Controlla l'indice massimo che possiede l'utente
    const userMaxIndex = rolesOrder.reduce((max, roleId, index) => {
        return member.roles.cache.has(roleId) ? index : max;
    }, -1);

    return userMaxIndex >= (minRoleLevel - 1);
}

// Mappa dei font speciali richiesti
export const SPECIAL_FONTS: { [key: string]: string } = {
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ',
    'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 'ꜱ', 'T': 'ᴛ',
    'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
};

export function convertToSpecialFont(text: string): string {
    return text.toUpperCase().split('').map(char => SPECIAL_FONTS[char] || char).join('');
}