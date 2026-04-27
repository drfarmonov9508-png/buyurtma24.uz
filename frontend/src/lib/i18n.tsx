'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'uz' | 'oz' | 'ru' | 'en';

const STORAGE_KEY = 'buyurtma24_lang';

export const LANG_LABELS: Record<Lang, { label: string; flag: string; short: string }> = {
  uz: { label: "O'zbek", flag: '🇺🇿', short: 'UZ' },
  oz: { label: 'Ўзбек', flag: '🇺🇿', short: 'ЎЗ' },
  ru: { label: 'Русский', flag: '🇷🇺', short: 'RU' },
  en: { label: 'English', flag: '🇬🇧', short: 'EN' },
};

const t = {
  uz: {
    common: {
      save: 'Saqlash', saving: "Saqlanmoqda...", cancel: 'Bekor',
      delete: "O'chirish", edit: 'Tahrirlash', add: "Qo'shish",
      search: 'Qidirish...', loading: 'Yuklanmoqda...', no_data: "Ma'lumot yo'q",
      confirm_delete: "O'chirishni tasdiqlaysizmi?",
      confirm_delete_short: "O'chirilsinmi?",
      active: 'Aktiv', inactive: 'Nofaol', all: 'Barchasi',
      refresh: 'Yangilash', close: 'Yopish', print: 'Chop etish',
      export: 'Eksport', actions: 'Amallar', status: 'Holat',
      name: 'Nomi', phone: 'Telefon', email: 'Email',
      password: 'Parol', role: 'Lavozim', date: 'Sana', total: 'Jami',
    },
    auth: {
      login: 'Tizimga kirish', logout: 'Chiqish',
      phone: 'Telefon raqam', password: 'Parol', submit: 'Kirish',
      welcome: 'Xush kelibsiz!', logged_out: 'Tizimdan chiqildi',
      error: 'Login xatosi', or: 'yoki',
      guest_btn: "Mehmon sifatida ro'yxatdan o'tish",
      guest_title: "Mehmon ro'yxati",
      cafe_select: 'Cafe / Oshxona tanlang *',
      first_name: 'Ism *', last_name: 'Familiya *', phone_req: 'Telefon *',
      select_cafe: '— Tanlang —', loading_cafes: 'Yuklanmoqda...',
      cafe_load_error: "Cafeler yuklanmadi",
      register_error: "Ro'yxatdan o'tish xatosi",
      register: "Kirish",
      subtitle: 'Restaurant Management Platform',
    },
    nav: {
      dashboard: 'Dashboard', categories: 'Kategoriyalar', products: 'Mahsulotlar',
      tables: 'Stollar', orders: 'Buyurtmalar', staff: 'Xodimlar',
      inventory: 'Inventar', discounts: 'Chegirmalar', reports: 'Hisobotlar',
      settings: 'Sozlamalar', cafes: 'Tashkilotlar', subscriptions: 'Obunalar', users: 'Foydalanuvchilar',
    },
    dashboard: {
      title: 'Dashboard', subtitle: "Bugungi ko'rsatkichlar",
      today_orders: 'Bugungi buyurtmalar', today_revenue: 'Bugungi daromad',
      active_orders: 'Aktiv buyurtmalar', monthly_revenue: 'Oylik daromad',
      weekly_sales: 'Haftalik savdo', recent_orders: "So'nggi buyurtmalar",
      top_products: "Eng ko'p sotilgan mahsulotlar", low_stock: 'Kam qolgan mahsulotlar',
      no_orders: "Buyurtmalar yo'q", no_data: "Ma'lumot yo'q",
      all_sufficient: 'Hammasi yetarli', yesterday: 'kecha',
    },
    categories: {
      title: 'Kategoriyalar', count: 'ta kategoriya', add: "Qo'shish",
      create: 'Yangi kategoriya', edit: 'Tahrirlash',
      name_uz: 'Nomi (UZ) *', name_ru: 'Nomi (RU)', name_en: 'Nomi (EN)',
      icon: 'Emoji icon', order: 'Tartib', empty: 'Hali kategoriyalar yo\'q',
    },
    products: {
      title: 'Mahsulotlar', count: 'ta mahsulot', add: "Qo'shish",
      create: 'Yangi mahsulot', edit: 'Mahsulotni tahrirlash',
      all_categories: 'Barcha kategoriyalar', category: 'Kategoriya',
      price: 'Narx (UZS) *', calories: 'Kaloriya', description: 'Tavsif',
      image: 'Rasm', sort_order: 'Tartib raqami', uploading: 'Yuklanmoqda...',
      upload_error: 'Yuklash xatosi', stoplist: 'Stop-list',
      select_category: 'Tanlang...', kcal: 'kkal',
    },
    tables: {
      title: 'Stollar', count: 'ta stol', add: "Stol qo'shish",
      create: 'Yangi stol', edit: 'Tahrirlash',
      table_name: 'Nomi *', capacity: "Sig'imi", zone: 'Zona',
      floor: 'Qavat', persons: 'kishi', qr_title: 'QR Kod',
      status: { FREE: "Bo'sh", OCCUPIED: 'Band', RESERVED: 'Bron' },
    },
    orders: {
      title: 'Buyurtmalar', count: 'ta buyurtma', refresh: 'Yangilash',
      order_number: 'Raqam', table: 'Stol', amount: 'Summa',
      time: 'Vaqt', takeaway: 'Olib ketish', notes: 'Izoh',
      empty: "Buyurtmalar yo'q",
      status: {
        ALL: 'Barchasi', PENDING: 'Yangi', CONFIRMED: 'Qabul qilindi',
        PREPARING: 'Tayyorlanmoqda', READY: 'Tayyor', SERVED: 'Berildi',
        COMPLETED: 'Tugallandi', CANCELLED: 'Bekor qilindi', DELIVERED: 'Yetkazildi',
      },
    },
    staff: {
      title: 'Xodimlar', count: 'ta xodim', add: "Xodim qo'shish",
      create: 'Yangi xodim', edit: 'Xodimni tahrirlash',
      full_name: 'Ism', first_name: 'Ism', last_name: 'Familiya',
      new_password: 'Yangi parol (ixtiyoriy)', password: 'Parol *',
      empty: "Xodimlar yo'q", joined: "Qo'shilgan",
      roles: { CASHIER: 'Kassir', WAITER: 'Ofitsiant', KITCHEN: 'Oshpaz', CAFE_ADMIN: 'Cafe Admin' },
    },
    reports: {
      title: 'Hisobotlar', subtitle: "Savdo va tahlil ma'lumotlari",
      total_revenue: 'Jami daromad', orders_count: 'Buyurtmalar soni',
      avg_check: "O'rtacha chek", cancelled: 'Bekor qilingan',
      sales_chart: 'Savdo dinamikasi', orders_chart: 'Buyurtmalar soni',
      top_products: 'Top mahsulotlar', waiter_performance: 'Ofitsiantlar samaradorligi',
      employee: 'Xodim', order_count: 'Buyurtmalar', revenue: 'Daromad',
      no_data: "Ma'lumot yo'q",
      periods: { daily: 'Bugun', weekly: 'Hafta', monthly: 'Oy', yearly: 'Yil' },
    },
    settings: {
      title: 'Sozlamalar', subtitle: "Café sozlamalarini boshqarish",
      saved: 'Sozlamalar saqlandi', basic_info: "Asosiy ma'lumotlar",
      cafe_name: 'Café nomi', address: 'Manzil',
      financial: 'Moliyaviy sozlamalar', currency: 'Valyuta',
      tax: 'Soliq (%)', service_charge: 'Xizmat haqi (%)',
      appearance: "Ko'rinish", primary_color: 'Asosiy rang', timezone: 'Vaqt zonasi',
    },
  },

  oz: {
    common: {
      save: 'Сақлаш', saving: 'Сақланмоқда...', cancel: 'Бекор',
      delete: 'Ўчириш', edit: 'Таҳрирлаш', add: 'Қўшиш',
      search: 'Қидириш...', loading: 'Юкланмоқда...', no_data: 'Маълумот йўқ',
      confirm_delete: 'Ўчиришни тасдиқлайсизми?',
      confirm_delete_short: 'Ўчирилсинми?',
      active: 'Актив', inactive: 'Нофаол', all: 'Барчаси',
      refresh: 'Янгилаш', close: 'Ёпиш', print: 'Чоп этиш',
      export: 'Экспорт', actions: 'Амаллар', status: 'Ҳолат',
      name: 'Номи', phone: 'Телефон', email: 'Email',
      password: 'Парол', role: 'Лавозим', date: 'Сана', total: 'Жами',
    },
    auth: {
      login: 'Тизимга кириш', logout: 'Чиқиш',
      phone: 'Телефон рақам', password: 'Парол', submit: 'Кириш',
      welcome: 'Хуш келибсиз!', logged_out: 'Тизимдан чиқилди',
      error: 'Логин хатоси', or: 'ёки',
      guest_btn: 'Меҳмон сифатида рўйхатдан ўтиш',
      guest_title: 'Меҳмон рўйхати',
      cafe_select: 'Кафе / Ошхона танланг *',
      first_name: 'Исм *', last_name: 'Фамилия *', phone_req: 'Телефон *',
      select_cafe: '— Танланг —', loading_cafes: 'Юкланмоқда...',
      cafe_load_error: 'Кафелар юкланмади',
      register_error: 'Рўйхатдан ўтиш хатоси',
      register: 'Кириш',
      subtitle: 'Restaurant Management Platform',
    },
    nav: {
      dashboard: 'Дашборд', categories: 'Категориялар', products: 'Маҳсулотлар',
      tables: 'Столлар', orders: 'Буюртмалар', staff: 'Ходимлар',
      inventory: 'Инвентар', discounts: 'Чегирмалар', reports: 'Ҳисоботлар',
      settings: 'Созламалар', cafes: 'Ташкилотлар', subscriptions: 'Обуналар', users: 'Фойдаланувчилар',
    },
    dashboard: {
      title: 'Дашборд', subtitle: 'Бугунги кўрсаткичлар',
      today_orders: 'Бугунги буюртмалар', today_revenue: 'Бугунги даромад',
      active_orders: 'Актив буюртмалар', monthly_revenue: 'Ойлик даромад',
      weekly_sales: 'Ҳафталик савдо', recent_orders: 'Сўнгги буюртмалар',
      top_products: 'Энг кўп сотилган маҳсулотлар', low_stock: 'Кам қолган маҳсулотлар',
      no_orders: 'Буюртмалар йўқ', no_data: 'Маълумот йўқ',
      all_sufficient: 'Ҳаммаси етарли', yesterday: 'кеча',
    },
    categories: {
      title: 'Категориялар', count: 'та категория', add: 'Қўшиш',
      create: 'Янги категория', edit: 'Таҳрирлаш',
      name_uz: 'Номи (UZ) *', name_ru: 'Номи (RU)', name_en: 'Номи (EN)',
      icon: 'Emoji icon', order: 'Тартиб', empty: 'Ҳали категориялар йўқ',
    },
    products: {
      title: 'Маҳсулотлар', count: 'та маҳсулот', add: 'Қўшиш',
      create: 'Янги маҳсулот', edit: 'Маҳсулотни таҳрирлаш',
      all_categories: 'Барча категориялар', category: 'Категория',
      price: 'Нарх (UZS) *', calories: 'Калория', description: 'Тавсиф',
      image: 'Расм', sort_order: 'Тартиб рақами', uploading: 'Юкланмоқда...',
      upload_error: 'Юклаш хатоси', stoplist: 'Стоп-лист',
      select_category: 'Танланг...', kcal: 'ккал',
    },
    tables: {
      title: 'Столлар', count: 'та стол', add: 'Стол қўшиш',
      create: 'Янги стол', edit: 'Таҳрирлаш',
      table_name: 'Номи *', capacity: 'Сиғими', zone: 'Зона',
      floor: 'Қават', persons: 'киши', qr_title: 'QR Код',
      status: { FREE: 'Бўш', OCCUPIED: 'Банд', RESERVED: 'Брон' },
    },
    orders: {
      title: 'Буюртмалар', count: 'та буюртма', refresh: 'Янгилаш',
      order_number: 'Рақам', table: 'Стол', amount: 'Сумма',
      time: 'Вақт', takeaway: 'Олиб кетиш', notes: 'Изоҳ',
      empty: 'Буюртмалар йўқ',
      status: {
        ALL: 'Барчаси', PENDING: 'Янги', CONFIRMED: 'Қабул қилинди',
        PREPARING: 'Тайёрланмоқда', READY: 'Тайёр', SERVED: 'Берилди',
        COMPLETED: 'Тугалланди', CANCELLED: 'Бекор қилинди', DELIVERED: 'Етказилди',
      },
    },
    staff: {
      title: 'Ходимлар', count: 'та ходим', add: 'Ходим қўшиш',
      create: 'Янги ходим', edit: 'Ходимни таҳрирлаш',
      full_name: 'Исм', first_name: 'Исм', last_name: 'Фамилия',
      new_password: 'Янги парол (ихтиёрий)', password: 'Парол *',
      empty: 'Ходимлар йўқ', joined: 'Қўшилган',
      roles: { CASHIER: 'Кассир', WAITER: 'Официант', KITCHEN: 'Ошпаз', CAFE_ADMIN: 'Кафе Админ' },
    },
    reports: {
      title: 'Ҳисоботлар', subtitle: 'Савдо ва таҳлил маълумотлари',
      total_revenue: 'Жами даромад', orders_count: 'Буюртмалар сони',
      avg_check: "Ўртача чек", cancelled: 'Бекор қилинган',
      sales_chart: 'Савдо динамикаси', orders_chart: 'Буюртмалар сони',
      top_products: 'Топ маҳсулотлар', waiter_performance: 'Официантлар самарадорлиги',
      employee: 'Ходим', order_count: 'Буюртмалар', revenue: 'Даромад',
      no_data: 'Маълумот йўқ',
      periods: { daily: 'Бугун', weekly: 'Ҳафта', monthly: 'Ой', yearly: 'Йил' },
    },
    settings: {
      title: 'Созламалар', subtitle: 'Кафе созламаларини бошқариш',
      saved: 'Созламалар сақланди', basic_info: 'Асосий маълумотлар',
      cafe_name: 'Кафе номи', address: 'Манзил',
      financial: 'Молиявий созламалар', currency: 'Валюта',
      tax: 'Солиқ (%)', service_charge: 'Хизмат ҳақи (%)',
      appearance: 'Кўриниш', primary_color: 'Асосий ранг', timezone: 'Вақт зонаси',
    },
  },

  ru: {
    common: {
      save: 'Сохранить', saving: 'Сохранение...', cancel: 'Отмена',
      delete: 'Удалить', edit: 'Редактировать', add: 'Добавить',
      search: 'Поиск...', loading: 'Загрузка...', no_data: 'Нет данных',
      confirm_delete: 'Подтвердите удаление?',
      confirm_delete_short: 'Удалить?',
      active: 'Активен', inactive: 'Неактивен', all: 'Все',
      refresh: 'Обновить', close: 'Закрыть', print: 'Печать',
      export: 'Экспорт', actions: 'Действия', status: 'Статус',
      name: 'Название', phone: 'Телефон', email: 'Email',
      password: 'Пароль', role: 'Роль', date: 'Дата', total: 'Итого',
    },
    auth: {
      login: 'Вход в систему', logout: 'Выйти',
      phone: 'Номер телефона', password: 'Пароль', submit: 'Войти',
      welcome: 'Добро пожаловать!', logged_out: 'Вы вышли из системы',
      error: 'Ошибка входа', or: 'или',
      guest_btn: 'Войти как гость',
      guest_title: 'Регистрация гостя',
      cafe_select: 'Выберите кафе *',
      first_name: 'Имя *', last_name: 'Фамилия *', phone_req: 'Телефон *',
      select_cafe: '— Выберите —', loading_cafes: 'Загрузка...',
      cafe_load_error: 'Ошибка загрузки кафе',
      register_error: 'Ошибка регистрации',
      register: 'Войти',
      subtitle: 'Restaurant Management Platform',
    },
    nav: {
      dashboard: 'Дашборд', categories: 'Категории', products: 'Продукты',
      tables: 'Столы', orders: 'Заказы', staff: 'Персонал',
      inventory: 'Инвентарь', discounts: 'Скидки', reports: 'Отчёты',
      settings: 'Настройки', cafes: 'Организации', subscriptions: 'Подписки', users: 'Пользователи',
    },
    dashboard: {
      title: 'Дашборд', subtitle: 'Показатели на сегодня',
      today_orders: 'Заказы сегодня', today_revenue: 'Выручка сегодня',
      active_orders: 'Активные заказы', monthly_revenue: 'Выручка за месяц',
      weekly_sales: 'Продажи за неделю', recent_orders: 'Последние заказы',
      top_products: 'Топ продаваемых', low_stock: 'Заканчивается на складе',
      no_orders: 'Нет заказов', no_data: 'Нет данных',
      all_sufficient: 'Всего достаточно', yesterday: 'вчера',
    },
    categories: {
      title: 'Категории', count: 'категорий', add: 'Добавить',
      create: 'Новая категория', edit: 'Редактировать',
      name_uz: 'Название (UZ) *', name_ru: 'Название (RU)', name_en: 'Название (EN)',
      icon: 'Emoji иконка', order: 'Порядок', empty: 'Категорий пока нет',
    },
    products: {
      title: 'Продукты', count: 'продуктов', add: 'Добавить',
      create: 'Новый продукт', edit: 'Редактировать продукт',
      all_categories: 'Все категории', category: 'Категория',
      price: 'Цена (UZS) *', calories: 'Калории', description: 'Описание',
      image: 'Фото', sort_order: 'Порядок сортировки', uploading: 'Загрузка...',
      upload_error: 'Ошибка загрузки', stoplist: 'Стоп-лист',
      select_category: 'Выберите...', kcal: 'ккал',
    },
    tables: {
      title: 'Столы', count: 'столов', add: 'Добавить стол',
      create: 'Новый стол', edit: 'Редактировать',
      table_name: 'Название *', capacity: 'Вместимость', zone: 'Зона',
      floor: 'Этаж', persons: 'чел', qr_title: 'QR Код',
      status: { FREE: 'Свободен', OCCUPIED: 'Занят', RESERVED: 'Забронирован' },
    },
    orders: {
      title: 'Заказы', count: 'заказов', refresh: 'Обновить',
      order_number: 'Номер', table: 'Стол', amount: 'Сумма',
      time: 'Время', takeaway: 'С собой', notes: 'Примечание',
      empty: 'Заказов нет',
      status: {
        ALL: 'Все', PENDING: 'Новый', CONFIRMED: 'Принят',
        PREPARING: 'Готовится', READY: 'Готов', SERVED: 'Подан',
        COMPLETED: 'Завершён', CANCELLED: 'Отменён', DELIVERED: 'Доставлен',
      },
    },
    staff: {
      title: 'Персонал', count: 'сотрудников', add: 'Добавить сотрудника',
      create: 'Новый сотрудник', edit: 'Редактировать сотрудника',
      full_name: 'Имя', first_name: 'Имя', last_name: 'Фамилия',
      new_password: 'Новый пароль (необязательно)', password: 'Пароль *',
      empty: 'Нет сотрудников', joined: 'Добавлен',
      roles: { CASHIER: 'Кассир', WAITER: 'Официант', KITCHEN: 'Повар', CAFE_ADMIN: 'Адм. кафе' },
    },
    reports: {
      title: 'Отчёты', subtitle: 'Данные о продажах и аналитика',
      total_revenue: 'Общая выручка', orders_count: 'Количество заказов',
      avg_check: 'Средний чек', cancelled: 'Отменённые',
      sales_chart: 'Динамика продаж', orders_chart: 'Количество заказов',
      top_products: 'Топ продуктов', waiter_performance: 'Эффективность официантов',
      employee: 'Сотрудник', order_count: 'Заказы', revenue: 'Выручка',
      no_data: 'Нет данных',
      periods: { daily: 'Сегодня', weekly: 'Неделя', monthly: 'Месяц', yearly: 'Год' },
    },
    settings: {
      title: 'Настройки', subtitle: 'Управление настройками кафе',
      saved: 'Настройки сохранены', basic_info: 'Основная информация',
      cafe_name: 'Название кафе', address: 'Адрес',
      financial: 'Финансовые настройки', currency: 'Валюта',
      tax: 'Налог (%)', service_charge: 'Сервисный сбор (%)',
      appearance: 'Внешний вид', primary_color: 'Основной цвет', timezone: 'Часовой пояс',
    },
  },

  en: {
    common: {
      save: 'Save', saving: 'Saving...', cancel: 'Cancel',
      delete: 'Delete', edit: 'Edit', add: 'Add',
      search: 'Search...', loading: 'Loading...', no_data: 'No data',
      confirm_delete: 'Confirm delete?',
      confirm_delete_short: 'Delete this item?',
      active: 'Active', inactive: 'Inactive', all: 'All',
      refresh: 'Refresh', close: 'Close', print: 'Print',
      export: 'Export', actions: 'Actions', status: 'Status',
      name: 'Name', phone: 'Phone', email: 'Email',
      password: 'Password', role: 'Role', date: 'Date', total: 'Total',
    },
    auth: {
      login: 'Sign In', logout: 'Sign Out',
      phone: 'Phone number', password: 'Password', submit: 'Sign In',
      welcome: 'Welcome!', logged_out: 'Signed out successfully',
      error: 'Login error', or: 'or',
      guest_btn: 'Continue as guest',
      guest_title: 'Guest Registration',
      cafe_select: 'Select Café *',
      first_name: 'First name *', last_name: 'Last name *', phone_req: 'Phone *',
      select_cafe: '— Select —', loading_cafes: 'Loading...',
      cafe_load_error: 'Failed to load cafes',
      register_error: 'Registration error',
      register: 'Continue',
      subtitle: 'Restaurant Management Platform',
    },
    nav: {
      dashboard: 'Dashboard', categories: 'Categories', products: 'Products',
      tables: 'Tables', orders: 'Orders', staff: 'Staff',
      inventory: 'Inventory', discounts: 'Discounts', reports: 'Reports',
      settings: 'Settings', cafes: 'Organizations', subscriptions: 'Subscriptions', users: 'Users',
    },
    dashboard: {
      title: 'Dashboard', subtitle: "Today's overview",
      today_orders: "Today's orders", today_revenue: "Today's revenue",
      active_orders: 'Active orders', monthly_revenue: 'Monthly revenue',
      weekly_sales: 'Weekly sales', recent_orders: 'Recent orders',
      top_products: 'Top selling products', low_stock: 'Low stock items',
      no_orders: 'No orders', no_data: 'No data',
      all_sufficient: 'All stock sufficient', yesterday: 'yesterday',
    },
    categories: {
      title: 'Categories', count: 'categories', add: 'Add',
      create: 'New Category', edit: 'Edit Category',
      name_uz: 'Name (UZ) *', name_ru: 'Name (RU)', name_en: 'Name (EN)',
      icon: 'Emoji icon', order: 'Order', empty: 'No categories yet',
    },
    products: {
      title: 'Products', count: 'products', add: 'Add',
      create: 'New Product', edit: 'Edit Product',
      all_categories: 'All categories', category: 'Category',
      price: 'Price (UZS) *', calories: 'Calories', description: 'Description',
      image: 'Image', sort_order: 'Sort order', uploading: 'Uploading...',
      upload_error: 'Upload error', stoplist: 'Stop list',
      select_category: 'Select...', kcal: 'kcal',
    },
    tables: {
      title: 'Tables', count: 'tables', add: 'Add Table',
      create: 'New Table', edit: 'Edit Table',
      table_name: 'Name *', capacity: 'Capacity', zone: 'Zone',
      floor: 'Floor', persons: 'ppl', qr_title: 'QR Code',
      status: { FREE: 'Free', OCCUPIED: 'Occupied', RESERVED: 'Reserved' },
    },
    orders: {
      title: 'Orders', count: 'orders', refresh: 'Refresh',
      order_number: 'Number', table: 'Table', amount: 'Amount',
      time: 'Time', takeaway: 'Takeaway', notes: 'Notes',
      empty: 'No orders',
      status: {
        ALL: 'All', PENDING: 'New', CONFIRMED: 'Confirmed',
        PREPARING: 'Preparing', READY: 'Ready', SERVED: 'Served',
        COMPLETED: 'Completed', CANCELLED: 'Cancelled', DELIVERED: 'Delivered',
      },
    },
    staff: {
      title: 'Staff', count: 'employees', add: 'Add Staff',
      create: 'New Employee', edit: 'Edit Employee',
      full_name: 'Name', first_name: 'First name', last_name: 'Last name',
      new_password: 'New password (optional)', password: 'Password *',
      empty: 'No staff', joined: 'Joined',
      roles: { CASHIER: 'Cashier', WAITER: 'Waiter', KITCHEN: 'Kitchen', CAFE_ADMIN: 'Café Admin' },
    },
    reports: {
      title: 'Reports', subtitle: 'Sales data & analytics',
      total_revenue: 'Total revenue', orders_count: 'Orders count',
      avg_check: 'Average check', cancelled: 'Cancelled',
      sales_chart: 'Sales dynamics', orders_chart: 'Orders count',
      top_products: 'Top products', waiter_performance: 'Waiter performance',
      employee: 'Employee', order_count: 'Orders', revenue: 'Revenue',
      no_data: 'No data',
      periods: { daily: 'Today', weekly: 'Week', monthly: 'Month', yearly: 'Year' },
    },
    settings: {
      title: 'Settings', subtitle: 'Manage café settings',
      saved: 'Settings saved', basic_info: 'Basic information',
      cafe_name: 'Café name', address: 'Address',
      financial: 'Financial settings', currency: 'Currency',
      tax: 'Tax (%)', service_charge: 'Service charge (%)',
      appearance: 'Appearance', primary_color: 'Primary color', timezone: 'Timezone',
    },
  },
} as const;

export type Translations = typeof t.uz;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: Translations;
}

const LangCtx = createContext<LangContextValue>({
  lang: 'uz',
  setLang: () => {},
  tr: t.uz,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('uz');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in t) setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <LangCtx.Provider value={{ lang, setLang, tr: t[lang] as Translations }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}
