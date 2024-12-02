const translations = {
    English: {
        language_prompt: "Please select your language by sending the number",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "فارسی", name: "Farsi" },
            { number: 4, language: "پښتو", name: "Pashto" },
        ],
        processing: "You selected English. Processing your information...",
        prompts: {
            welcome:
                "Welcome to MENA Health, please use the link below to complete the patient registration form.",
            registration_submitted:
                "You have successfully submitted your patient registration to MENA Health. A member of our medical team will contact you as soon as possible. If you have not received a message from us in the next 24 hours, or if your medical condition has worsened, please let us know by sending the number “9”",
            follow_up:
                "Please standby, a member of our medical team will contact you shortly.",
            additional_message:
                "You have successfully submitted your patient registration to MENA Health, a member of our medical team will contact you as soon as possible.",
        },
    },
    العربية: {
        language_prompt: "الرجاء تحديد اللغة الخاصة بك عن طريق إرسال الرقم",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "فارسی", name: "Farsi" },
            { number: 4, language: "پښتو", name: "Pashto" },
        ],
        processing: "لقد اخترت اللغة العربية. جارٍ معالجة معلوماتك...",
        prompts: {
            welcome:
                "مرحبًا بكم في مينا هيلث، يرجى استخدام الرابط أدناه لاستكمال نموذج تسجيل المريض.",
            registration_submitted:
                "لقد قمت بتقديم تسجيلك كمريض بنجاح إلى مينا هيلث، وسيقوم أحد أعضاء فريقنا الطبي بالتواصل معك في أقرب وقت ممكن. إذا لم تتلق رسالة منا خلال الـ 24 ساعة القادمة، أو إذا ساءت حالتك الطبية، يرجى إخبارنا عن طريق إرسال الرقم '9'",
            follow_up: "يرجى الانتظار، حيث سيتصل بك أحد أعضاء فريقنا الطبي قريبًا.",
            additional_message:
                "لقد قمت بتقديم تسجيلك كمريض بنجاح إلى مينا هيلث، وسيقوم أحد أعضاء فريقنا الطبي بالتواصل معك في أقرب وقت ممكن.",
        },
    },
    فارسی: {
        language_prompt: "لطفا زبان خود را با ارسال شماره انتخاب کنید",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "فارسی", name: "Farsi" },
            { number: 4, language: "پښتو", name: "Pashto" },
        ],
        processing: "شما زبان فارسی را انتخاب کردید. در حال پردازش اطلاعات شما...",
        prompts: {
            welcome:
                "به MENA Health خوش آمدید، لطفا از لینک زیر برای تکمیل فرم ثبت نام بیمار استفاده کنید.",
            registration_submitted:
                "شما با موفقیت ثبت نام بیمار خود را به MENA Health ارسال کردید، یکی از اعضای تیم پزشکی ما در اسرع وقت با شما تماس خواهد گرفت. اگر در 24 ساعت آینده پیامی از ما دریافت نکردید، یا اگر وضعیت پزشکی شما بدتر شده است، لطفا با ارسال شماره '9' به ما اطلاع دهید.",
            follow_up:
                "لطفا آماده باشید، یکی از اعضای تیم پزشکی ما به زودی با شما تماس خواهد گرفت.",
            additional_message:
                "شما با موفقیت ثبت نام بیمار خود را به MENA Health ارسال کردید، یکی از اعضای تیم پزشکی ما در اسرع وقت با شما تماس خواهد گرفت.",
        },
    },
    پښتو: {
        language_prompt: "مهرباني وکړئ د شمیرې په لیږلو سره خپله ژبه وټاکئ",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "فارسی", name: "Farsi" },
            { number: 4, language: "پښتو", name: "Pashto" },
        ],
        processing: "تاسو پښتو غوره کړه. ستاسو معلومات پروسس کول...",
        prompts: {
            welcome:
                "د MENA روغتیا ته ښه راغلاست، مهرباني وکړئ د ناروغ د راجستریشن فارم ډکولو لپاره لاندې لینک وکاروئ.",
            registration_submitted:
                "تاسو په بریالیتوب سره د خپل ناروغ راجستریشن MENA روغتیا ته سپارلی، زموږ د طبي ټیم غړی به څومره ژر چې امکان ولري تاسو سره اړیکه ونیسي. که تاسو په راتلونکو 24 ساعتونو کې زموږ لخوا پیغام نه وي ترلاسه کړی، یا که ستاسو روغتیایی حالت خراب شوی وي نو مهرباني وکړئ موږ ته د '9' شمیرې په لیږلو خبر راکړئ.",
            follow_up:
                "مهرباني وکړئ ولاړ شئ، زموږ د طبي ټیم غړی به ډیر ژر له تاسو سره اړیکه ونیسي.",
            additional_message:
                "تاسو په بریالیتوب سره د خپل ناروغ راجستریشن MENA روغتیا ته سپارلی، زموږ د طبي ټیم غړی به څومره ژر چې امکان ولري تاسو سره اړیکه ونیسي.",
        },
    },
};

export default translations;