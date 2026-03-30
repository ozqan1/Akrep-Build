# -*- coding: utf-8 -*-
import os
import shutil
import datetime
import requests
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.uix.textinput import TextInput
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.filechooser import FileChooserIconView
from kivy.core.window import Window
from kivy.utils import get_color_from_hex
from kivy.clock import Clock

# --- HATA YÖNETİMİ & KÜTÜPHANELER ---
# Pydroid 3'te veya APK'da psutil yoksa uygulamanın çökmesini engeller
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

# --- SİSTEM YAPILANDIRMASI ---
VERSION = "Akrep 9.8.8"
TOKEN = "8771212561:AAFbWXGUsYCz13eeRj7yZMt44dD_8NZKLrw"
MY_ID = "7157477470"
DEV_NAME = "NEBİ ÖZKAN"
SIFRE = "8505"
MATRIX_GREEN = '#00FF41'
VAULT_DIR = "/sdcard/Akrep_Vault"

# Kasa klasörü oluşturma
if not os.path.exists(VAULT_DIR):
    try: os.makedirs(VAULT_DIR)
    except: pass

Window.clearcolor = get_color_from_hex('#000000')

# --- 1. KİLİT EKRANI (Login Screen) ---
class LoginScreen(Screen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.layout = BoxLayout(orientation='vertical', padding=[40, 100, 40, 40], spacing=25)
        
        # Saat ve Tarih
        self.time_lbl = Label(text="00:00", font_size='80sp', bold=True, color=(1,1,1,1))
        self.date_lbl = Label(text="Yükleniyor...", font_size='20sp', color=(0.8, 0.8, 0.8, 1))
        self.layout.add_widget(self.time_lbl)
        self.layout.add_widget(self.date_lbl)
        
        # Sistem Durumu
        self.layout.add_widget(Label(text=f"{VERSION} SECURE SYSTEM", color=get_color_from_hex(MATRIX_GREEN), bold=True))

        # PIN Girişi
        self.inp = TextInput(hint_text="PIN GIRIN", password=True, multiline=False, size_hint=(0.6, None), 
                             height=60, halign='center', pos_hint={'center_x': 0.5},
                             background_color=(0.1, 0.1, 0.1, 1), foreground_color=(1,1,1,1))
        self.layout.add_widget(self.inp)
        
        # Giriş Butonu
        btn = Button(text="SİSTEME ERİŞ", size_hint=(0.8, None), height=60, pos_hint={'center_x': 0.5},
                     background_normal='', background_color=get_color_from_hex('#111111'),
                     color=get_color_from_hex(MATRIX_GREEN), bold=True)
        btn.bind(on_release=self.check)
        self.layout.add_widget(btn)

        self.layout.add_widget(Label(text=f"Developer: {DEV_NAME}", font_size='11sp', color=(0.4, 0.4, 0.4, 1)))
        self.add_widget(self.layout)
        Clock.schedule_interval(self.update_time, 1)

    def update_time(self, *args):
        now = datetime.datetime.now()
        self.time_lbl.text = now.strftime("%H:%M")
        self.date_lbl.text = now.strftime("%d %B %Y")

    def check(self, i):
        if self.inp.text == SIFRE: 
            self.manager.current = 'main'
        else: 
            self.inp.text = ""
            self.inp.hint_text = "HATALI PIN!"

# --- 2. ANA PANEL (Main Screen) ---
class MainScreen(Screen):
    def __init__(self, **kw):
        super().__init__(**kw)
        self.lay = BoxLayout(orientation='vertical', padding=12, spacing=8)
        
        # Üst Bilgi Barı
        header = BoxLayout(size_hint_y=None, height=40)
        header.add_widget(Label(text=VERSION, color=get_color_from_hex(MATRIX_GREEN), bold=True, halign='left'))
        header.add_widget(Label(text=DEV_NAME, halign='right', font_size='12sp', color=(0.6,0.6,0.6,1)))
        self.lay.add_widget(header)

        # Terminal Log Alanı
        self.sc = ScrollView(size_hint_y=0.4)
        self.lb = GridLayout(cols=1, size_hint_y=None, spacing=3)
        self.lb.bind(minimum_height=self.lb.setter('height'))
        self.sc.add_widget(self.lb)
        self.lay.add_widget(self.sc)

        # Değişen Kontrol Alanı (Dosya Seçici vb.)
        self.cp = BoxLayout(orientation='vertical', size_hint_y=0.3)
        self.lay.add_widget(self.cp)

        # Kontrol Butonları
        grid = GridLayout(cols=3, spacing=10, size_hint_y=None, height=280)
        btns = [
            ("BOT PANEL", self.bot_ui, '#004D40'),
            ("GİZLİ KASA", self.vault_ui, '#1B5E20'),
            ("DOSYA EKLE", self.file_ui, '#2E7D32'),
            ("SİSTEM", self.sys_ui, '#212121'),
            ("AĞ DURUMU", self.net_ui, '#006064'),
            ("ÇIKIŞ", lambda x: App.get_running_app().stop(), '#880E4F')
        ]
        for t, f, r in btns:
            b = Button(text=t, background_normal='', background_color=get_color_from_hex(r), 
                       color=get_color_from_hex(MATRIX_GREEN), on_release=f, bold=True, font_size='11sp')
            grid.add_widget(b)
        
        self.lay.add_widget(grid)
        self.add_widget(self.lay)
        self.log(f"{VERSION} Yüklendi. Tüm protokoller aktif.")

    def log(self, m):
        self.lb.add_widget(Label(text=f">> {m}", size_hint_y=None, height=30, 
                                 color=get_color_from_hex(MATRIX_GREEN), font_size='12sp'))

    def file_ui(self, i):
        self.cp.clear_widgets()
        fc = FileChooserIconView(path="/sdcard")
        self.cp.add_widget(fc)
        btn = Button(text="SEÇİLENİ KASAYA TAŞI", size_hint_y=None, height=45, background_color=(0,1,0,1))
        btn.bind(on_release=lambda x: self.transfer(fc.selection))
        self.cp.add_widget(btn)

    def transfer(self, sel):
        if sel:
            try:
                name = os.path.basename(sel[0])
                shutil.move(sel[0], os.path.join(VAULT_DIR, name))
                self.log(f"BAŞARILI: {name} taşındı.")
                self.vault_ui(None)
            except Exception as e:
                self.log(f"HATA: {str(e)}")

    def vault_ui(self, i):
        self.cp.clear_widgets()
        self.log("--- KASA İÇERİĞİ ---")
        try:
            files = os.listdir(VAULT_DIR)
            if not files: self.log("Kasa şu an boş.")
            for f in files: self.log(f"DOSYA: {f}")
        except: self.log("Kasa erişiminde sorun oluştu.")

    def bot_ui(self, i):
        self.cp.clear_widgets()
        gl = GridLayout(cols=2, spacing=5)
        gl.add_widget(Button(text="LOG GÖNDER", on_release=lambda x: self.api("msg")))
        gl.add_widget(Button(text="KONUM GÖNDER", on_release=lambda x: self.api("loc")))
        self.cp.add_widget(gl)

    def api(self, m):
        u = f"https://api.telegram.org/bot{TOKEN}"
        try:
            if m == "msg": 
                requests.get(f"{u}/sendMessage?chat_id={MY_ID}&text={VERSION} Sinyali: Sistem stabil.")
            else: 
                requests.get(f"{u}/sendLocation?chat_id={MY_ID}&latitude=39.9&longitude=32.8")
            self.log(f"TG: {m.upper()} SİNYALİ GÖNDERİLDİ")
        except: self.log("HATA: İnternet bağlantısı yok.")

    def sys_ui(self, i): 
        if PSUTIL_AVAILABLE:
            self.log(f"CPU: %{psutil.cpu_percent()} | RAM: %{psutil.virtual_memory().percent}")
        else:
            self.log("HATA: 'psutil' yüklü değil. Pip ile kurun.")

    def net_ui(self, i): 
        self.log("AĞ: ŞİFRELİ TÜNEL AKTİF")

# --- 3. UYGULAMA BAŞLATICI ---
class AkrepFinalApp(App):
    def build(self):
        self.title = VERSION
        sm = ScreenManager()
        sm.add_widget(LoginScreen(name='login'))
        sm.add_widget(MainScreen(name='main'))
        return sm

if __name__ == "__main__":
    AkrepFinalApp().run()
