import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Get language from localStorage or default to Estonian
const savedLanguage = localStorage.getItem('bookingLanguage') || 'ee';

// Translation resources
const resources = {
  ee: {
    translation: {
      "booking": {
        "title": "Broneeri oma aeg",
        "loading": "Laen broneerimist...",
        "steps": {
          "services": "Teenused",
          "professional": "Spetsialist",
          "dateTime": "Kuupäev ja aeg",
          "yourDetails": "Sinu andmed"
        },
        "step1": {
          "title": "Vali teenused",
          "subtitle": "Vali üks või mitu teenust, mida soovid broneerida",
          "searchPlaceholder": "Otsi teenuseid...",
          "duration": "Kestus",
          "min": "min",
          "noServices": "Teenuseid ei leitud",
          "selectService": "Vali teenus"
        },
        "step2": {
          "title": "Vali spetsialist",
          "subtitle": "Vali spetsialist oma teenuste jaoks",
          "searchPlaceholder": "Otsi spetsialiste...",
          "noProfessionals": "Spetsialiste ei leitud",
          "languages": "Keeled"
        },
        "step3": {
          "title": "Vali kuupäev ja aeg",
          "subtitle": "Vali, millal soovid oma broneeringut",
          "loadingAvailability": "Laen saadavust...",
          "selectDate": "Vali kuupäev",
          "selectTime": "Vali aeg",
          "noSlotsAvailable": "Valitud kuupäeval pole vabad ajad",
          "noSlotsForMonth": "Sellel kuul pole vabu aegu",
          "days": {
            "sun": "P",
            "mon": "E",
            "tue": "T",
            "wed": "K",
            "thu": "N",
            "fri": "R",
            "sat": "L"
          }
        },
        "step4": {
          "title": "Sinu andmed",
          "subtitle": "Sisesta oma kontaktandmed",
          "firstName": "Eesnimi",
          "lastName": "Perekonnanimi",
          "email": "E-post",
          "phone": "Telefoninumber",
          "birthday": "Sünnipäev (valikuline)",
          "notes": "Täiendavad märkused (valikuline)",
          "notesPlaceholder": "Kas on erinõudeid või teavet, mida peaksime teadma...",
          "terms": "Nõustun",
          "termsLink": "broneerimise tingimustega",
          "and": "ja",
          "privacyLink": "privaatsuspoliitikaga",
          "required": "*"
        },
        "navigation": {
          "previous": "Eelmine",
          "next": "Järgmine",
          "nextPickDateTime": "Järgmine: Vali kuupäev ja aeg",
          "completeBooking": "Lõpeta broneering",
          "creatingBooking": "Loon broneeringut..."
        },
        "summary": {
          "title": "Broneeringu kokkuvõte",
          "services": "Teenused",
          "professional": "Spetsialist",
          "dateTime": "Kuupäev ja aeg",
          "duration": "Kestus",
          "minutes": "minutit",
          "total": "Kokku",
          "notSelected": "Pole valitud",
          "noServices": "Teenuseid pole valitud"
        },
        "success": {
          "title": "Broneering õnnestus!",
          "message": "Sinu broneering on kinnitatud",
          "confirmationSent": "Kinnituskiri on saadetud aadressile",
          "bookingDetails": "Broneeringu üksikasjad",
          "bookAgain": "Tee uus broneering"
        },
        "errors": {
          "termsRequired": "Palun nõustu tingimustega",
          "loadingFailed": "Broneerimise andmete laadimine ebaõnnestus",
          "bookingFailed": "Broneeringu loomine ebaõnnestus. Palun proovi uuesti."
        }
      }
    }
  },
  en: {
    translation: {
      "booking": {
        "title": "Book your appointment",
        "loading": "Loading your booking experience...",
        "steps": {
          "services": "Services",
          "professional": "Professional",
          "dateTime": "Date & Time",
          "yourDetails": "Your Details"
        },
        "step1": {
          "title": "Choose Services",
          "subtitle": "Select one or more services you'd like to book",
          "searchPlaceholder": "Search services...",
          "duration": "Duration",
          "min": "min",
          "noServices": "No services found",
          "selectService": "Select service"
        },
        "step2": {
          "title": "Choose Professional",
          "subtitle": "Select a professional for your services",
          "searchPlaceholder": "Search professionals...",
          "noProfessionals": "No professionals found",
          "languages": "Languages"
        },
        "step3": {
          "title": "Pick Date & Time",
          "subtitle": "Choose when you'd like your appointment",
          "loadingAvailability": "Loading availability...",
          "selectDate": "Select a date",
          "selectTime": "Select a time",
          "noSlotsAvailable": "No available times for selected date",
          "noSlotsForMonth": "No available times in this month",
          "days": {
            "sun": "Sun",
            "mon": "Mon",
            "tue": "Tue",
            "wed": "Wed",
            "thu": "Thu",
            "fri": "Fri",
            "sat": "Sat"
          }
        },
        "step4": {
          "title": "Your Details",
          "subtitle": "Enter your contact information",
          "firstName": "First Name",
          "lastName": "Last Name",
          "email": "Email",
          "phone": "Phone Number",
          "birthday": "Birthday (Optional)",
          "notes": "Additional Notes (Optional)",
          "notesPlaceholder": "Any special requests or information we should know...",
          "terms": "I agree to the",
          "termsLink": "Booking Terms & Conditions",
          "and": "and",
          "privacyLink": "Privacy Policy",
          "required": "*"
        },
        "navigation": {
          "previous": "Previous",
          "next": "Next",
          "nextPickDateTime": "Next: Pick Date & Time",
          "completeBooking": "Complete Booking",
          "creatingBooking": "Creating Booking..."
        },
        "summary": {
          "title": "Booking Summary",
          "services": "Services",
          "professional": "Professional",
          "dateTime": "Date & Time",
          "duration": "Duration",
          "minutes": "minutes",
          "total": "Total",
          "notSelected": "Not selected",
          "noServices": "No services selected"
        },
        "success": {
          "title": "Booking Successful!",
          "message": "Your booking has been confirmed",
          "confirmationSent": "A confirmation email has been sent to",
          "bookingDetails": "Booking Details",
          "bookAgain": "Book Another Appointment"
        },
        "errors": {
          "termsRequired": "Please agree to the terms and conditions",
          "loadingFailed": "Failed to load booking data",
          "bookingFailed": "Failed to create booking. Please try again."
        }
      }
    }
  },
  ru: {
    translation: {
      "booking": {
        "title": "Забронируйте время",
        "loading": "Загрузка бронирования...",
        "steps": {
          "services": "Услуги",
          "professional": "Специалист",
          "dateTime": "Дата и время",
          "yourDetails": "Ваши данные"
        },
        "step1": {
          "title": "Выберите услуги",
          "subtitle": "Выберите одну или несколько услуг, которые вы хотите забронировать",
          "searchPlaceholder": "Поиск услуг...",
          "duration": "Продолжительность",
          "min": "мин",
          "noServices": "Услуги не найдены",
          "selectService": "Выбрать услугу"
        },
        "step2": {
          "title": "Выберите специалиста",
          "subtitle": "Выберите специалиста для ваших услуг",
          "searchPlaceholder": "Поиск специалистов...",
          "noProfessionals": "Специалисты не найдены",
          "languages": "Языки"
        },
        "step3": {
          "title": "Выберите дату и время",
          "subtitle": "Выберите, когда вы хотите записаться",
          "loadingAvailability": "Загрузка доступности...",
          "selectDate": "Выберите дату",
          "selectTime": "Выберите время",
          "noSlotsAvailable": "Нет свободных времен для выбранной даты",
          "noSlotsForMonth": "В этом месяце нет свободных времен",
          "days": {
            "sun": "Вс",
            "mon": "Пн",
            "tue": "Вт",
            "wed": "Ср",
            "thu": "Чт",
            "fri": "Пт",
            "sat": "Сб"
          }
        },
        "step4": {
          "title": "Ваши данные",
          "subtitle": "Введите вашу контактную информацию",
          "firstName": "Имя",
          "lastName": "Фамилия",
          "email": "Электронная почта",
          "phone": "Номер телефона",
          "birthday": "День рождения (необязательно)",
          "notes": "Дополнительные заметки (необязательно)",
          "notesPlaceholder": "Особые пожелания или информация, о которой нам следует знать...",
          "terms": "Я согласен с",
          "termsLink": "условиями бронирования",
          "and": "и",
          "privacyLink": "политикой конфиденциальности",
          "required": "*"
        },
        "navigation": {
          "previous": "Назад",
          "next": "Далее",
          "nextPickDateTime": "Далее: Выберите дату и время",
          "completeBooking": "Завершить бронирование",
          "creatingBooking": "Создание бронирования..."
        },
        "summary": {
          "title": "Итоги бронирования",
          "services": "Услуги",
          "professional": "Специалист",
          "dateTime": "Дата и время",
          "duration": "Продолжительность",
          "minutes": "минут",
          "total": "Итого",
          "notSelected": "Не выбрано",
          "noServices": "Услуги не выбраны"
        },
        "success": {
          "title": "Бронирование успешно!",
          "message": "Ваше бронирование подтверждено",
          "confirmationSent": "Письмо с подтверждением было отправлено на",
          "bookingDetails": "Детали бронирования",
          "bookAgain": "Забронировать снова"
        },
        "errors": {
          "termsRequired": "Пожалуйста, согласитесь с условиями",
          "loadingFailed": "Не удалось загрузить данные бронирования",
          "bookingFailed": "Не удалось создать бронирование. Пожалуйста, попробуйте снова."
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'ee',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

