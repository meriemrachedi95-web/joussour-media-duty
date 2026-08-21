import os
import sys
import json
import time
import requests
import schedule
import threading
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# مسار ملفات التكوين والبيانات
CONFIG_FILE = r"C:\JoussourDuty\data\bot_config.json"
MEMBERS_MAP_FILE = r"C:\JoussourDuty\data\telegram_members_map.json"
FIREBASE_KEY_PATH = r"C:\JoussourDuty\firebase_admin_key.json"
DASHBOARD_URL = "https://meriemrachedi95-web.github.io/joussour-media-duty/"

# قائمة أعضاء فريق الإعلام والإنتاج المحدثة بدقة من واقع المجموعة الرسمية
TEAM_MEMBERS = [
    "مريم",
    "أشواق",
    "هديل",
    "خولة",
    "معاذ",
    "نعمة الله هند",
    "خديجة",
    "سجود",
    "عبد الرحيم قاسي",
    "آية زايدي",
    "سيرين",
    "إسراء جزيري",
    "إكرام",
    "أميمة تومي",
    "أسماء لعناني",
    "وصال شام",
    "أكرم",
    "فيصل طيبي",
    "ريان مهوني"
]

def load_bot_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "bot_token": "8756829465:AAEEMoOnXK-FeCs-FNHLtxLE8sK8lYhi3ek",
        "bot_username": "JoussourDuty_bot",
        "admin_chat_id": "7101142364",
        "current_month": "august_2026",
        "current_week": 3
    }

def save_bot_config(config):
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def load_members_map():
    if os.path.exists(MEMBERS_MAP_FILE):
        with open(MEMBERS_MAP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    # خريطة مبدئية بحساب مريم
    return {
        "7101142364": "مريم"
    }

def save_members_map(m_map):
    os.makedirs(os.path.dirname(MEMBERS_MAP_FILE), exist_ok=True)
    with open(MEMBERS_MAP_FILE, "w", encoding="utf-8") as f:
        json.dump(m_map, f, ensure_ascii=False, indent=2)

def get_firestore_db():
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_KEY_PATH)
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"⚠️ خطأ في الاتصال بـ Firestore: {e}")
        return None

def fetch_councils_from_db(month="august_2026"):
    db = get_firestore_db()
    if db:
        try:
            doc = db.collection("production").document(month).get()
            if doc.exists:
                data = doc.to_dict()
                return data.get("councils", []), data.get("blockers", [])
        except Exception as e:
            print(f"Error fetching from DB: {e}")
    return [], []

def update_council_in_db(council_id, task_type, is_done, month="august_2026"):
    db = get_firestore_db()
    if db:
        try:
            doc_ref = db.collection("production").document(month)
            doc = doc_ref.get()
            if doc.exists:
                councils = doc.to_dict().get("councils", [])
                for c in councils:
                    if c.get("id") == council_id:
                        if "tasks" not in c:
                            c["tasks"] = {}
                        c["tasks"][task_type] = is_done
                        break
                doc_ref.update({"councils": councils, "updatedAt": datetime.now().isoformat()})
                return True
        except Exception as e:
            print(f"Error updating council: {e}")
    return False

def add_blocker_to_db(member_name, council_title, details, month="august_2026"):
    db = get_firestore_db()
    if db:
        try:
            doc_ref = db.collection("production").document(month)
            doc = doc_ref.get()
            if doc.exists:
                blockers = doc.to_dict().get("blockers", [])
                new_blocker = {
                    "id": int(time.time() * 1000),
                    "member": member_name,
                    "council": council_title or "استشكال عام في المونتاج",
                    "type": "طلب مساعدة / صعوبة في الإنجاز",
                    "details": details,
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M")
                }
                blockers.insert(0, new_blocker)
                doc_ref.update({"blockers": blockers, "updatedAt": datetime.now().isoformat()})
                return True
        except Exception as e:
            print(f"Error adding blocker: {e}")
    return False

class TelegramDutyBot:
    def __init__(self, bot_token=None):
        self.config = load_bot_config()
        self.bot_token = bot_token or self.config.get("bot_token", "8756829465:AAEEMoOnXK-FeCs-FNHLtxLE8sK8lYhi3ek")
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
        self.members_map = load_members_map()
        self.last_update_id = 0

    def send_message(self, chat_id, text, reply_markup=None):
        if not self.bot_token:
            print("⚠️ لا يوجد Bot Token محدد!")
            return None
        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            res = requests.post(url, json=payload, timeout=10)
            return res.json()
        except Exception as e:
            print(f"❌ خطأ أثناء إرسال الرسالة إلى {chat_id}: {e}")
            return None

    def send_welcome_and_registration(self, chat_id, first_name):
        text = (
            f"🌿 <b>أهلاً وسهلاً بك {first_name} في بوت متابعة فريق الإنتاج الإعلامي!</b>\n"
            f"نادي جسور العلمي • نحو أفق الفكر والمعرفة 🏛️✨\n\n"
            f"يسعدنا وجودك معنا في خدمة ونشر المحتوى العلمي والرسالي. "
            f"يرجى تحديد اسمك من القائمة أدناه لربط حسابك بمهامك وتلقي التذكيرات وإرسال التقارير بسهولة:"
        )
        keyboard = []
        row = []
        for idx, m in enumerate(TEAM_MEMBERS):
            row.append({"text": m, "callback_data": f"register_{m}"})
            if len(row) == 2:
                keyboard.append(row)
                row = []
        if row:
            keyboard.append(row)
        
        reply_markup = {"inline_keyboard": keyboard}
        self.send_message(chat_id, text, reply_markup)

    def send_member_weekly_tasks(self, chat_id, member_name, week=3):
        councils, _ = fetch_councils_from_db()
        # مطابقة مرنة للاسم
        member_tasks = [c for c in councils if member_name in c.get("assignee", "") or c.get("assignee", "") in member_name and c.get("week") == week]

        if not member_tasks:
            text = (
                f"🌸 <b>مرحباً {member_name}!</b>\n\n"
                f"✨ لا توجد مهام مبرمجة باسمك في الأسبوع ({week}) حالياً.\n"
                f"بارك الله في جهودك وعطائك الدائم لنادي جسور! 🌿\n\n"
                f"🔗 يمكنك دائماً الاطلاع على الخطة العامة عبر المنصة:\n{DASHBOARD_URL}"
            )
            reply_markup = {
                "inline_keyboard": [[{"text": "🌐 فتح منصة المتابعة", "url": DASHBOARD_URL}]]
            }
            self.send_message(chat_id, text, reply_markup)
            return

        text = (
            f"✨ <b>السلام عليكم ورحمة الله وبركاته، أهلاً {member_name}</b> 🌿\n\n"
            f"📅 <b>مهامك المبرمجة للأسبوع ({week}) من شهر أوت 2026:</b>\n\n"
        )

        keyboard = []
        for idx, t in enumerate(member_tasks, start=1):
            is_trans = t.get("tasks", {}).get("transcription", False)
            is_des = t.get("tasks", {}).get("design", False)
            is_mon = t.get("tasks", {}).get("montage", False)

            status_icon = "🟢 تم الإنجاز" if is_mon else "⏳ قيد الإنتاج"

            text += (
                f"📌 <b>{idx}. {t.get('title')}</b>\n"
                f"   • اليوم: {t.get('day')} ({t.get('date')})\n"
                f"   • الحالة: {status_icon}\n"
                f"   • التفريغ: {'✅' if is_trans else '⏳'} | التصميم: {'✅' if is_des else '⏳'} | المونتاج: {'✅' if is_mon else '⏳'}\n\n"
            )

            btn_text = f"{'✅ إلغاء تم' if is_mon else '🎬 تم المونتاج'}: {t.get('title')[:22]}..."
            keyboard.append([
                {"text": btn_text, "callback_data": f"toggle_montage_{t.get('id')}_{0 if is_mon else 1}"}
            ])

        keyboard.append([
            {"text": "⚠️ أحتاج مساعدة / أواجه صعوبة", "callback_data": f"help_blocker_{member_name}"}
        ])
        keyboard.append([
            {"text": "🌐 فتح منصة المتابعة والتأشير", "url": DASHBOARD_URL}
        ])

        text += (
            f"💡 <i>نسعد جداً بتأشيرك للمهام فور إتمامها عبر الأزرار أعلاه أو عبر المنصة، "
            f"وإذا واجهتك أي عقبة أو احتجت تمديداً، فضلاً اضغطي على زر المساعدة وسنكون بجانبك فوراً.</i> 🤍"
        )

        reply_markup = {"inline_keyboard": keyboard}
        self.send_message(chat_id, text, reply_markup)

    def send_midweek_checkin(self, chat_id, member_name, week=3):
        councils, _ = fetch_councils_from_db()
        pending = [c for c in councils if (member_name in c.get("assignee", "") or c.get("assignee", "") in member_name) and c.get("week") == week and not c.get("tasks", {}).get("montage", False)]

        if not pending:
            text = (
                f"🎉 <b>ما شاء الله يا {member_name}!</b>\n\n"
                f"تم التحقق ووجدنا أن جميع مهامك للأسبوع {week} منجزة ومكتملة بامتياز. "
                f"جزاك الله خيراً على همتك العالية وبارك في وقتك وجهدك! 🌿🤍"
            )
            self.send_message(chat_id, text)
            return

        text = (
            f"🌸 <b>مرحباً {member_name}، كيف حالك وكيف تسير الأمور معك؟</b> ✨\n\n"
            f"نحن الآن في منتصف الأسبوع، ونحب الاطمئنان على تقدمك في مهام الأسبوع ({week}):\n\n"
        )
        for p in pending:
            text += f"• 🎬 <b>{p.get('title')}</b> ({p.get('day')})\n"

        text += (
            f"\nنحن هنا دوماً لتقديم العون وتيسير أي صعوبة تقنية أو ظرف طارئ قد يواجهك. "
            f"هل تسير المهام بسلاسة، أم تحتاج أي مساعدة أو تمديد أجل؟ 🤍"
        )

        reply_markup = {
            "inline_keyboard": [
                [{"text": "✅ كل شيء يسير على ما يرام", "callback_data": f"midweek_ok_{member_name}"}],
                [{"text": "⚠️ أحتاج مساعدة أو توضيح", "callback_data": f"help_blocker_{member_name}"}],
                [{"text": "🌐 فتح منصة المتابعة", "url": DASHBOARD_URL}]
            ]
        }
        self.send_message(chat_id, text, reply_markup)

    def send_endweek_wrapup(self, chat_id, member_name, week=3):
        councils, _ = fetch_councils_from_db()
        member_tasks = [c for c in councils if (member_name in c.get("assignee", "") or c.get("assignee", "") in member_name) and c.get("week") == week]
        pending = [c for c in member_tasks if not c.get("tasks", {}).get("montage", False)]

        text = (
            f"🌟 <b>السلام عليكم ورحمة الله وبركاته، أهلاً {member_name}</b>\n\n"
            f"مع اقتراب نهاية الأسبوع ({week})، نود تذكيرك بالتحقق من إتمام مهامك والتأشير عليها عبر المنصة "
            f"لتظهر مباشرة في تقرير إنجاز خلية الإعلام السحابي: 🏛️\n\n"
        )

        if pending:
            text += f"⏳ <b>المهام المتبقية للتأشير:</b>\n"
            for p in pending:
                text += f"• {p.get('title')}\n"
        else:
            text += f"✅ <b>الحمد لله، جميع مهامك للأسبوع مكتملة ومؤشرة بالكامل!</b> 🏆\n"

        text += f"\n🔗 <b>رابط المنصة للتأشير والمتابعة:</b>\n{DASHBOARD_URL}\n\nبوركت جهودكم وكل الشكر لعطائكم المستمر! 🌿🤍"

        reply_markup = {
            "inline_keyboard": [
                [{"text": "🌐 الدخول إلى المنصة وتأشير الإنجاز", "url": DASHBOARD_URL}],
                [{"text": "⚠️ رفع استشكال / إشعار الأمينة", "callback_data": f"help_blocker_{member_name}"}]
            ]
        }
        self.send_message(chat_id, text, reply_markup)

    def send_admin_comprehensive_report(self, admin_chat_id, report_type="نصف أسبوعي", week=3):
        councils, blockers = fetch_councils_from_db()
        week_councils = [c for c in councils if c.get("week") == week and not c.get("isExtra")]

        total_week = len(week_councils)
        done_montage = sum(1 for c in week_councils if c.get("tasks", {}).get("montage", False))
        done_yt = sum(1 for c in week_councils if c.get("tasks", {}).get("youtube", False))
        compliance_pct = round((done_montage / total_week) * 100) if total_week > 0 else 0

        text = (
            f"📊 <b>تقرير متابعة الإنتاج الإعلامي ({report_type})</b> 🏛️\n"
            f"👤 <b>إلى أمينة الإعلام: أ. مريم</b>\n"
            f"📅 <b>الأسبوع ({week}) - شهر أوت 2026</b>\n"
            f"🕒 <i>توقيت التقرير: {datetime.now().strftime('%Y-%m-%d %H:%M')}</i>\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📈 <b>مؤشرات الإنجاز الأسبوعية:</b>\n"
            f"• إجمالي مجالس الأسبوع: <b>{total_week} مجالس ومناقشات</b>\n"
            f"• المكتمل مونتاجاً: <b>{done_montage} من أصل {total_week}</b>\n"
            f"• المنشور بيوتيوب: <b>{done_yt}</b>\n"
            f"• معدل التزام الفريق: <b>{compliance_pct}%</b>\n\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"👥 <b>تفصيل إنجاز أعضاء الفريق:</b>\n"
        )

        for m in TEAM_MEMBERS:
            m_tasks = [c for c in week_councils if m in c.get("assignee", "") or c.get("assignee", "") in m]
            if m_tasks:
                m_done = sum(1 for c in m_tasks if c.get("tasks", {}).get("montage", False))
                m_status = "✅ مكتمل" if m_done == len(m_tasks) else f"⏳ ({m_done}/{len(m_tasks)})"
                text += f"• <b>{m}:</b> {m_status}\n"

        if blockers:
            text += f"\n━━━━━━━━━━━━━━━━━━━━\n⚠️ <b>صندوق الاستشكالات المعلقة ({len(blockers)}):</b>\n"
            for b in blockers[:3]:
                text += f"• <b>{b.get('member')}:</b> {b.get('details')} ({b.get('council')[:25]})\n"

        text += f"\n🔗 <b>رابط المنصة المباشر:</b>\n{DASHBOARD_URL}"

        reply_markup = {
            "inline_keyboard": [
                [{"text": "🌐 فتح لوحة التحكم السحابية", "url": DASHBOARD_URL}]
            ]
        }
        self.send_message(admin_chat_id, text, reply_markup)

    def handle_updates(self):
        if not self.bot_token:
            return
        url = f"{self.base_url}/getUpdates?offset={self.last_update_id + 1}&timeout=5"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                return
            data = res.json()
            for update in data.get("result", []):
                self.last_update_id = update["update_id"]
                
                # رسائل نصية عادية
                if "message" in update:
                    msg = update["message"]
                    chat_id = str(msg["chat"]["id"])
                    text = msg.get("text", "").strip()
                    first_name = msg.get("from", {}).get("first_name", "أخي/أختي")

                    if text == "/start":
                        self.send_welcome_and_registration(chat_id, first_name)
                    elif text == "/tasks":
                        member_name = self.members_map.get(chat_id)
                        if member_name:
                            self.send_member_weekly_tasks(chat_id, member_name)
                        else:
                            self.send_welcome_and_registration(chat_id, first_name)
                    elif text == "/report":
                        self.send_admin_comprehensive_report(chat_id, "فوري وشامل")
                    elif text.startswith("/help_msg "):
                        details = text.replace("/help_msg ", "").strip()
                        member_name = self.members_map.get(chat_id, first_name)
                        add_blocker_to_db(member_name, "استشكال مرسل عبر البوت", details)
                        self.send_message(chat_id, "✅ تم تسجيل استشكالك وإشعار أمينة الإعلام وفريق العمل فورياً!")

                # أزرار Callback Query
                elif "callback_query" in update:
                    cb = update["callback_query"]
                    cb_id = cb["id"]
                    chat_id = str(cb["message"]["chat"]["id"])
                    cb_data = cb.get("data", "")
                    
                    requests.post(f"{self.base_url}/answerCallbackQuery", json={"callback_query_id": cb_id})

                    if cb_data.startswith("register_"):
                        member_name = cb_data.replace("register_", "")
                        self.members_map[chat_id] = member_name
                        save_members_map(self.members_map)
                        
                        if member_name == "مريم":
                            self.config["admin_chat_id"] = chat_id
                            save_bot_config(self.config)

                        self.send_message(chat_id, f"🎉 <b>تم تسجيلك بنجاح باسم: {member_name}!</b>\nجاري جلب مهامك الحالية...")
                        self.send_member_weekly_tasks(chat_id, member_name)

                    elif cb_data.startswith("toggle_montage_"):
                        parts = cb_data.split("_")
                        council_id = int(parts[2])
                        is_done = (parts[3] == "1")
                        update_council_in_db(council_id, "montage", is_done)
                        
                        member_name = self.members_map.get(chat_id, "عضو الفريق")
                        self.send_message(chat_id, f"✨ <b>تم تحديث حالة المهمة بنجاح سحابياً وعلى المنصة!</b> {'(تم المونتاج ✅)' if is_done else '(تم إلغاء المونتاج ⏳)'}")
                        self.send_member_weekly_tasks(chat_id, member_name)

                    elif cb_data.startswith("help_blocker_"):
                        self.send_message(chat_id, "📝 <b>اكتبي رسالتك بهذا الشكل:</b>\n<code>/help_msg شرح الصعوبة أو المساعدة المطلوبة</code>\nوستصل مباشرة إلى أمينة الإعلام والمنصة.")

                    elif cb_data.startswith("midweek_ok_"):
                        self.send_message(chat_id, "🌸 <b>الحمد لله، بارك الله في همتك وعملك الرائع! دمتم ذخراً لنادي جسور.</b> 🤍✨")

        except Exception as e:
            print(f"Error handling updates: {e}")

    def run_broadcast_schedules(self):
        """تشغيل التوزيع التلقائي للمهام والتذكيرات في المواعيد المحددة"""
        # 1. السبت صباحاً: توزيع المهام
        schedule.every().saturday.at("09:00").do(self.broadcast_start_of_week)
        # 2. الثلاثاء مساءً: تذكير منتصف الأسبوع
        schedule.every().tuesday.at("18:00").do(self.broadcast_midweek)
        # 3. الخميس مساءً: تأكيد الإنجاز وتقارير الأمينة
        schedule.every().thursday.at("20:00").do(self.broadcast_end_of_week)

        while True:
            schedule.run_pending()
            time.sleep(30)

    def broadcast_start_of_week(self):
        print("🚀 بدء إرسال مهام بداية الأسبوع...")
        for chat_id, member_name in self.members_map.items():
            self.send_member_weekly_tasks(chat_id, member_name)

    def broadcast_midweek(self):
        print("🚀 بدء إرسال تذكيرات منتصف الأسبوع...")
        for chat_id, member_name in self.members_map.items():
            self.send_midweek_checkin(chat_id, member_name)
        
        admin_id = self.config.get("admin_chat_id")
        if admin_id:
            self.send_admin_comprehensive_report(admin_id, "نصف أسبوعي")

    def broadcast_end_of_week(self):
        print("🚀 بدء إرسال تذكيرات نهاية الأسبوع...")
        for chat_id, member_name in self.members_map.items():
            self.send_endweek_wrapup(chat_id, member_name)
        
        admin_id = self.config.get("admin_chat_id")
        if admin_id:
            self.send_admin_comprehensive_report(admin_id, "أسبوعي ختامي")

if __name__ == "__main__":
    bot = TelegramDutyBot()
    print("🤖 جاري تشغيل بوت تيليجرام الرسمي...")
    scheduler_thread = threading.Thread(target=bot.run_broadcast_schedules, daemon=True)
    scheduler_thread.start()
    print("📅 الجدولة الآلية نشطة ومفعلة.")
    while True:
        bot.handle_updates()
        time.sleep(1.5)
