import { MessageType } from "@prisma/client";

export const strings = {
  scenes: {
    main: {
      start: {
        new_user: "به ربات دستیار امیرکبیر خوش اومدی😄👋",
        hi_user: "سلام جناب  {name} ✋\nبه ربات دستیار امیرکبیر خوش اومدی😄👋",
        any_help: "خب چه کمک دیگه ای ازم بر میاد؟😄",
      },
      keyboard: {
        send_question: "ارسال سوالات و نظرات",
        // my_info: "اطلاعات من",
        about_us: "درباره ما",
        admin: { review_messages: "بررسی پیام های ارسالی" },
      },
    },
    sendMessage: {
      loading: "در حال بارگزاری...",
      get_message_type: "لطفا نوع پیام ارسالی را وارد کنید.",
      get_text_message_title:
        "لطفا متن پیام خود را ارسال کنید.\nمتن پیام میتواند حداکثر 1500 کارکتر باشد.",
      get_poll_message_title:
        "لطفا سوال نظرسنجی خود را ارسال کنید.\nمتن سوال هر نظرسنجی میتواند حداکثر 250 کارکتر باشد.",
      get_poll_options:
        "گزینه های خود رو هر کدام در یک پیام وارد کنید.\nهر گزینه میتواند حداکثر 100 کاراکتر باشد. \nبرای پایان روی گزینه پایین کلیک کنید.",
      get_next_option: "لطفا گزینه بعدی رو ارسال کنید.",
      should_send_one_option: "حداقل باید یک گزینه را وارد کنید.",
      message_sent_successfully:
        "✅ پیام شما با موفقیت ارسال شد و پس از تایید ادمین در کانال قرار خواهد گرفت.",
      //todo: say more details
      message_can_not_be_send:
        "مشکلی در ثبت پیام ارسالی به وجود آمد. احتمالا از کارکترهایی استفاده کردید که در نظرسنجی تلگرام ساپورت نمیشوند.",
      buttons: {
        end: "پایان و ارسال",
      },
    },
    showMessages: {
      message_list: "لیست پیام ها",
      loading_messages: "در حال بارگزاری پیام ها",
      no_new_messages: "پیام جدیدی وجود ندارد.",
      toasts: {
        message_sent_successfully: "✅ پیام با موفقیت تایید و ارسال شد.",
        message_deleted_successfully: "❎ پیام با موفقیت حذف شد.",
      },
      message: {
        id: "آیدی پیام ارسالی:",
        date: "تاریخ پیام ارسالی:",
        text: "متن پیام ارسالی:",
        type: "نوع پیام ارسالی:",
        option: "گزینه {number}:",
      },
      buttons: {
        last_message: "پیام قبلی ⬅️",
        next_message: "➡️ پیام بعدی",
        confirm_message: "✅ تایید و ارسال در کانال",
        delete_message: "❌ حذف پیام",
        back_to_home: "🏠 بازگشت 🏠",
      },
    },
  },
  invalid_input: "🚫 ورودی معتبر نیست",
  [MessageType.Text]: "📝 متن",
  [MessageType.Poll]: "📊 نظرسنجی",
  back_to_home: "🏠 بازگشت 🏠",
};
