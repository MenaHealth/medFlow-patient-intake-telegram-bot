const translations = {
    English: {
        language_prompt: "Please select your language by sending the number:",
        options: [
            { number: 1, language: "العربية", name: "Arabic" },
            { number: 2, language: "فارسی", name: "Persian" },
            { number: 3, language: "پښتو", name: "Pashto" },
        ],
        processing: "You selected English. Processing your information...",
        welcome: "Welcome! Please complete your registration using the link provided.",
        registration_completed: "Welcome back! Here's your patient info.",
        error: "Sorry, there was an issue processing your request. Please try again later.",
    },
    العربية: {
        language_prompt: "الرجاء اختيار لغتك عن طريق إرسال الرقم:",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "فارسی", name: "Persian" },
            { number: 3, language: "پښتو", name: "Pashto" },
        ],
        processing: "لقد اخترت اللغة الإنجليزية. جارٍ معالجة معلوماتك...",
        welcome: "مرحبًا! يرجى إكمال التسجيل باستخدام الرابط المقدم.",
        registration_completed: "مرحبًا بعودتك! إليك معلومات المريض الخاصة بك.",
        error: "عذرًا، حدثت مشكلة أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى لاحقًا.",
    },
    فارسی: {
        language_prompt: "لطفاً با ارسال شماره، زبان خود را انتخاب کنید:",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "پښتو", name: "Pashto" },
            // Add more options as needed
        ],
        processing: "شما انگلیسی را انتخاب کردید. در حال پردازش اطلاعات شما...",
        welcome: "خوش آمدید! لطفاً ثبت نام خود را با استفاده از لینک ارائه شده کامل کنید.",
        registration_completed: "خوش آمدید دوباره! اطلاعات بیمار شما در اینجا است.",
        error: "متأسفیم، مشکلی در پردازش درخواست شما وجود داشت. لطفاً دوباره تلاش کنید.",
    },
    پښتو: {
        language_prompt: "مهرباني وکړئ د شمېرې په لېږلو سره خپله ژبه وټاکئ:",
        options: [
            { number: 1, language: "English", name: "English" },
            { number: 2, language: "العربية", name: "Arabic" },
            { number: 3, language: "فارسی", name: "Persian" },
            // Add more options as needed
        ],
        processing: "تاسو پښتو غوره کړې ده. ستاسو معلومات پروسس کول...",
        welcome: "ښه راغلاست! مهرباني وکړئ د ورکړل شوي لینک په کارولو سره خپل ثبت بشپړ کړئ.",
        registration_completed: "بېرته ښه راغلاست! دا ستاسو د ناروغ معلومات دي.",
        error: "بخښنه غواړم، ستاسو د غوښتنې پروسس کولو پر مهال یوه ستونزه پېښه شوه. مهرباني وکړئ بیا هڅه وکړئ.",
    },
};

export default translations;