'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Module definitions ──────────────────────────────────────────────────── */

type FeatureTab = { icon: string; title: string; desc: string }
type Benefit    = { icon: string; title: string; desc: string }

interface ModuleDef {
  icon: string
  color: string        // accent colour
  pale: string         // pale background
  titleTr: string
  titleEn: string
  titleDe: string
  subtitleTr: string
  subtitleEn: string
  subtitleDe: string
  tabsTr: FeatureTab[]
  tabsEn: FeatureTab[]
  tabsDe: FeatureTab[]
  benefitsTr: Benefit[]
  benefitsEn: Benefit[]
  benefitsDe: Benefit[]
  mockup: React.ReactNode
  related: string[]
}

const MODULE_DEFS: Record<string, ModuleDef> = {
  teacher: {
    icon: '👩‍🏫', color: '#1E3A5F', pale: '#EEF3FB',
    titleTr: 'Öğretmen Paneli', titleEn: 'Teacher Panel', titleDe: 'Lehrerpanel',
    subtitleTr: 'Daha az zaman harca, daha çok öğret',
    subtitleEn: 'Spend less time, teach more',
    subtitleDe: 'Weniger Zeit aufwenden, mehr lehren',
    tabsTr: [
      { icon: '📋', title: 'AI Ders Planı', desc: 'Müfredat tipini seç, konuyu yaz, 30 saniyede profesyonel plan al. IB, AP, MEB, IGCSE destekli.' },
      { icon: '📝', title: 'Test Oluşturma', desc: '18 farklı soru tipi. Çoktan seçmeli, açık uçlu, eşleştirme, sürükle-bırak, tablo doldurma ve daha fazlası.' },
      { icon: '🤖', title: 'AI Puanlama', desc: 'Açık uçlu sorular AI tarafından puanlanır. Öğretmen onaylar veya düzenler. Toplu puanlama — tek tıkla tüm sınıf.' },
      { icon: '📚', title: 'Soru Kütüphanesi', desc: 'Bir kez oluştur, hep kullan. Etiket ve konu bazlı arama. Kullanım sayısı takibi.' },
      { icon: '📊', title: 'Sınıf Analizi', desc: 'Sınıf ortalaması, başarı dağılımı, risk altındaki öğrenciler, soru bazlı hata analizi.' },
      { icon: '📋', title: 'Veli Bülteni', desc: 'Aylık performans bülteni otomatik oluşturur. Devam, notlar, öğretmen değerlendirmesi. WhatsApp ve email ile gönderilir.' },
    ],
    tabsEn: [
      { icon: '📋', title: 'AI Lesson Plan', desc: 'Select curriculum type, write the topic, get a professional plan in 30 seconds. Supports IB, AP, National, IGCSE.' },
      { icon: '📝', title: 'Test Creation', desc: '18 question types. Multiple choice, essays, matching, drag-and-drop, table fill and more.' },
      { icon: '🤖', title: 'AI Grading', desc: 'Open-ended questions graded by AI. Teacher approves or edits. Bulk grading — whole class in one click.' },
      { icon: '📚', title: 'Question Library', desc: 'Create once, use forever. Search by tag and topic. Usage count tracking.' },
      { icon: '📊', title: 'Class Analysis', desc: 'Class average, achievement distribution, at-risk students, question-level error analysis.' },
      { icon: '📋', title: 'Parent Newsletter', desc: 'Auto-generates monthly performance newsletter. Attendance, grades, teacher evaluation. Sent via WhatsApp and email.' },
    ],
    tabsDe: [
      { icon: '📋', title: 'KI-Unterrichtsplan', desc: 'Lehrplantyp wählen, Thema eingeben, in 30 Sekunden professionellen Plan erhalten. IB, AP, National, IGCSE.' },
      { icon: '📝', title: 'Testerstellung', desc: '18 Fragetypen. Multiple Choice, Aufsätze, Zuordnung, Drag-and-Drop, Tabelle ausfüllen und mehr.' },
      { icon: '🤖', title: 'KI-Benotung', desc: 'Offene Fragen von KI benotet. Lehrer bestätigt oder bearbeitet. Massenbenotung — ganze Klasse mit einem Klick.' },
      { icon: '📚', title: 'Fragenbibliothek', desc: 'Einmal erstellen, immer nutzen. Suche nach Tag und Thema. Nutzungszähler.' },
      { icon: '📊', title: 'Klassenanalyse', desc: 'Klassendurchschnitt, Leistungsverteilung, gefährdete Schüler, fragenbasierte Fehleranalyse.' },
      { icon: '📋', title: 'Elternbrief', desc: 'Automatische Erstellung des monatlichen Leistungsbriefs. Anwesenheit, Noten, Lehrerbewertung. Versand per WhatsApp und E-Mail.' },
    ],
    benefitsTr: [
      { icon: '⏱️', title: 'Haftada 10+ Saat Tasarruf', desc: 'Ders planı ve not işlemleri için harcanan süreyi dramatik olarak azaltın.' },
      { icon: '🎯', title: 'Daha Etkili Değerlendirme', desc: 'AI destekli geri bildirim ile her öğrenciye kişisel yanıt verin.' },
      { icon: '📱', title: 'Her Cihazdan Erişim', desc: 'Tablet, telefon veya bilgisayardan — her yerden çalışın.' },
    ],
    benefitsEn: [
      { icon: '⏱️', title: '10+ Hours Saved Weekly', desc: 'Dramatically reduce time spent on lesson planning and grading.' },
      { icon: '🎯', title: 'More Effective Assessment', desc: 'Provide personalised feedback to every student with AI support.' },
      { icon: '📱', title: 'Access from Any Device', desc: 'Tablet, phone or computer — work from anywhere.' },
    ],
    benefitsDe: [
      { icon: '⏱️', title: '10+ Stunden pro Woche gespart', desc: 'Reduzieren Sie den Zeitaufwand für Unterrichtsplanung und Benotung dramatisch.' },
      { icon: '🎯', title: 'Effektivere Beurteilung', desc: 'Geben Sie jedem Schüler mit KI-Unterstützung persönliches Feedback.' },
      { icon: '📱', title: 'Von jedem Gerät aus', desc: 'Tablet, Telefon oder Computer — arbeiten Sie von überall.' },
    ],
    mockup: null,
    related: ['ai-planner', 'test-system', 'gradebook', 'analytics'],
  },

  student: {
    icon: '👨‍🎓', color: '#059669', pale: '#ecfdf5',
    titleTr: 'Öğrenci Paneli', titleEn: 'Student Panel', titleDe: 'Schülerpanel',
    subtitleTr: 'Gelişimini takip et, hedeflerine ulaş',
    subtitleEn: 'Track your progress, reach your goals',
    subtitleDe: 'Verfolge deinen Fortschritt, erreiche deine Ziele',
    tabsTr: [
      { icon: '📊', title: 'Not Takibi', desc: 'Tüm derslerin ağırlıklı ortalamaları. Her sınavın katkısını göster. Harf notu ve GPA hesaplama.' },
      { icon: '📝', title: 'Sınav Sonuçları', desc: 'Sınav sonrası AI geri bildirimi. Hangi sorularda zorlandığını gör. Öğretmen yorumlarını oku.' },
      { icon: '📅', title: 'Devamsızlık Takibi', desc: 'Aylık takvim görünümü. Devam oranı hesaplama. Mazeretli/devamsız ayrımı.' },
      { icon: '🎯', title: 'Yaklaşan Sınavlar', desc: 'Sınav takvimi. Ders bazlı hatırlatmalar.' },
    ],
    tabsEn: [
      { icon: '📊', title: 'Grade Tracking', desc: 'Weighted averages for all subjects. See each exam\'s contribution. Letter grade and GPA calculation.' },
      { icon: '📝', title: 'Exam Results', desc: 'AI feedback after exams. See which questions were challenging. Read teacher comments.' },
      { icon: '📅', title: 'Attendance Tracking', desc: 'Monthly calendar view. Attendance rate calculation. Excused/unexcused distinction.' },
      { icon: '🎯', title: 'Upcoming Exams', desc: 'Exam calendar. Subject-specific reminders.' },
    ],
    tabsDe: [
      { icon: '📊', title: 'Notenverfolgung', desc: 'Gewichtete Durchschnitte für alle Fächer. Beitrag jeder Prüfung sehen. Buchnotenberechnung und GPA.' },
      { icon: '📝', title: 'Prüfungsergebnisse', desc: 'KI-Feedback nach Prüfungen. Schwierige Fragen erkennen. Lehrerkommentare lesen.' },
      { icon: '📅', title: 'Anwesenheitsverfolgung', desc: 'Monatliche Kalenderansicht. Anwesenheitsrate berechnen. Entschuldigt/unentschuldigt Unterscheidung.' },
      { icon: '🎯', title: 'Bevorstehende Prüfungen', desc: 'Prüfungskalender. Fachspezifische Erinnerungen.' },
    ],
    benefitsTr: [
      { icon: '🔍', title: 'Şeffaf Değerlendirme', desc: 'Notların nasıl hesaplandığını anlayın, sürpriz olmaz.' },
      { icon: '📈', title: 'Sürekli Gelişim Takibi', desc: 'Dönem boyunca ilerlemenizi grafik olarak izleyin.' },
      { icon: '📱', title: 'Mobil Uyumlu', desc: 'Telefon, tablet veya bilgisayar — her cihazdan erişin.' },
    ],
    benefitsEn: [
      { icon: '🔍', title: 'Transparent Grading', desc: 'Understand how grades are calculated — no surprises.' },
      { icon: '📈', title: 'Continuous Progress Tracking', desc: 'Follow your progress graphically throughout the term.' },
      { icon: '📱', title: 'Mobile Friendly', desc: 'Phone, tablet or computer — access from any device.' },
    ],
    benefitsDe: [
      { icon: '🔍', title: 'Transparente Benotung', desc: 'Verstehen Sie, wie Noten berechnet werden — keine Überraschungen.' },
      { icon: '📈', title: 'Kontinuierliche Fortschrittsverfolgung', desc: 'Verfolgen Sie Ihren Fortschritt grafisch während des Semesters.' },
      { icon: '📱', title: 'Mobilfreundlich', desc: 'Telefon, Tablet oder Computer — von jedem Gerät aus.' },
    ],
    mockup: null,
    related: ['gradebook', 'attendance', 'parent'],
  },

  parent: {
    icon: '👨‍👩‍👧', color: '#7c3aed', pale: '#f5f3ff',
    titleTr: 'Veli Portalı', titleEn: 'Parent Portal', titleDe: 'Elternportal',
    subtitleTr: 'Çocuğunuzun eğitimine ortak olun',
    subtitleEn: 'Be a partner in your child\'s education',
    subtitleDe: 'Werden Sie Partner in der Bildung Ihres Kindes',
    tabsTr: [
      { icon: '📊', title: 'Anlık Not Takibi', desc: 'Tüm derslerin notlarını anlık görün. Ağırlıklı ortalama ve GPA. Dönem bazlı karşılaştırma.' },
      { icon: '📅', title: 'Devamsızlık Bildirimleri', desc: 'Çocuğunuz devamsız olduğunda WhatsApp ve email ile anında bildirim. Müdür yardımcısı onayından geçer.' },
      { icon: '📋', title: 'Aylık Bülten', desc: 'Her ay öğretmen değerlendirmesi. Güçlü yönler, gelişim alanları. Öğretmen yorumları.' },
      { icon: '👨‍👩‍👧', title: 'Çoklu Çocuk', desc: 'Birden fazla çocuğunuz varsa tek hesaptan yönetin. Her çocuk için ayrı panel.' },
      { icon: '🔒', title: 'Gizlilik', desc: 'Boşanma durumunda veli bilgileri ayrı tutulabilir. Her veliye ayrı bildirim.' },
    ],
    tabsEn: [
      { icon: '📊', title: 'Real-Time Grade Tracking', desc: 'View all subject grades in real time. Weighted average and GPA. Term-by-term comparison.' },
      { icon: '📅', title: 'Absence Notifications', desc: 'Instant WhatsApp and email when your child is absent. Approved by vice principal.' },
      { icon: '📋', title: 'Monthly Newsletter', desc: 'Teacher evaluation every month. Strengths, areas for improvement. Teacher comments.' },
      { icon: '👨‍👩‍👧', title: 'Multiple Children', desc: 'Manage from one account if you have multiple children. Separate panel for each child.' },
      { icon: '🔒', title: 'Privacy', desc: 'In case of divorce, parent information can be kept separate. Separate notifications for each guardian.' },
    ],
    tabsDe: [
      { icon: '📊', title: 'Echtzeit-Notenverfolgung', desc: 'Alle Fachnoten in Echtzeit ansehen. Gewichteter Durchschnitt und GPA. Semestervergleich.' },
      { icon: '📅', title: 'Fehlzeitenbenachrichtigungen', desc: 'Sofortige WhatsApp und E-Mail wenn Ihr Kind fehlt. Vom stellvertretenden Direktor bestätigt.' },
      { icon: '📋', title: 'Monatlicher Newsletter', desc: 'Lehrerbewertung jeden Monat. Stärken, Entwicklungsbereiche. Lehrerkommentare.' },
      { icon: '👨‍👩‍👧', title: 'Mehrere Kinder', desc: 'Verwalten Sie von einem Konto aus wenn Sie mehrere Kinder haben. Separates Panel für jedes Kind.' },
      { icon: '🔒', title: 'Datenschutz', desc: 'Im Scheidungsfall können Elterninformationen getrennt gehalten werden. Separate Benachrichtigungen für jeden Erziehungsberechtigten.' },
    ],
    benefitsTr: [
      { icon: '💬', title: 'Şeffaf İletişim', desc: 'Okul ile her zaman bilgi sahibi olun, sürpriz not yoktur.' },
      { icon: '⚡', title: 'Anlık Bildirimler', desc: 'Devamsızlık, düşük not gibi durumlarda anında haberdar olun.' },
      { icon: '🔒', title: 'Güvenli ve Gizli', desc: 'Verileriniz KVKK kapsamında korunur, sadece siz görebilirsiniz.' },
    ],
    benefitsEn: [
      { icon: '💬', title: 'Transparent Communication', desc: 'Always stay informed about school — no surprise grades.' },
      { icon: '⚡', title: 'Instant Notifications', desc: 'Get notified immediately about absences and low grades.' },
      { icon: '🔒', title: 'Secure and Private', desc: 'Data protected under GDPR, only you can see it.' },
    ],
    benefitsDe: [
      { icon: '💬', title: 'Transparente Kommunikation', desc: 'Bleiben Sie immer über die Schule informiert — keine unerwarteten Noten.' },
      { icon: '⚡', title: 'Sofortige Benachrichtigungen', desc: 'Werden Sie sofort über Fehlzeiten und schlechte Noten informiert.' },
      { icon: '🔒', title: 'Sicher und privat', desc: 'Daten nach DSGVO geschützt, nur Sie können sie sehen.' },
    ],
    mockup: null,
    related: ['student', 'attendance', 'communication'],
  },

  'ai-planner': {
    icon: '🤖', color: '#4F8EF7', pale: '#EEF6FF',
    titleTr: 'AI Ders Planı', titleEn: 'AI Lesson Planner', titleDe: 'KI-Unterrichtsplaner',
    subtitleTr: '2 saatlik işi 2 dakikaya indirin',
    subtitleEn: 'Reduce 2 hours of work to 2 minutes',
    subtitleDe: '2 Stunden Arbeit auf 2 Minuten reduzieren',
    tabsTr: [
      { icon: '⚡', title: 'Hızlı Oluşturma', desc: 'Konu ve müfredatı seç. 30 saniyede tam ders planı. Bloom Taksonomisi uyumlu hedefler.' },
      { icon: '📚', title: 'Müfredat Desteği', desc: 'IB, AP, MEB, IGCSE, Common Core. Her müfredata özel çıktı formatı.' },
      { icon: '✏️', title: 'Düzenlenebilir Çıktı', desc: 'AI çıktısını istediğin gibi düzenle. Slayt taslağı, aktiviteler, değerlendirme. Kaydet ve tekrar kullan.' },
      { icon: '📊', title: 'Slayt Taslağı', desc: 'Her ders için slayt taslağı. Zaman planlaması ile birlikte. PowerPoint\'e aktarılabilir.' },
    ],
    tabsEn: [
      { icon: '⚡', title: 'Fast Generation', desc: 'Select topic and curriculum. Full lesson plan in 30 seconds. Bloom Taxonomy-aligned objectives.' },
      { icon: '📚', title: 'Curriculum Support', desc: 'IB, AP, National, IGCSE, Common Core. Custom output format for each curriculum.' },
      { icon: '✏️', title: 'Editable Output', desc: 'Edit AI output as you like. Slide outline, activities, assessment. Save and reuse.' },
      { icon: '📊', title: 'Slide Outline', desc: 'Slide outline for each lesson. With time planning. Exportable to PowerPoint.' },
    ],
    tabsDe: [
      { icon: '⚡', title: 'Schnelle Erstellung', desc: 'Thema und Lehrplan auswählen. Vollständiger Unterrichtsplan in 30 Sekunden. Bloom-Taxonomie-konforme Ziele.' },
      { icon: '📚', title: 'Lehrplanunterstützung', desc: 'IB, AP, National, IGCSE, Common Core. Benutzerdefiniertes Ausgabeformat für jeden Lehrplan.' },
      { icon: '✏️', title: 'Bearbeitbare Ausgabe', desc: 'KI-Ausgabe nach Belieben bearbeiten. Folienübersicht, Aktivitäten, Beurteilung. Speichern und wiederverwenden.' },
      { icon: '📊', title: 'Folienübersicht', desc: 'Folienübersicht für jede Stunde. Mit Zeitplanung. Nach PowerPoint exportierbar.' },
    ],
    benefitsTr: [
      { icon: '⏱️', title: '2 saat → 2 dakika', desc: 'Ders hazırlığında harcanan süreyi %98 azaltın.' },
      { icon: '🎯', title: 'Müfredat Uyumlu', desc: 'Kullandığınız müfredata göre otomatik uyarlama.' },
      { icon: '♻️', title: 'Şablon Olarak Kaydet', desc: 'Oluşturduğunuz planları kütüphanede saklayın.' },
    ],
    benefitsEn: [
      { icon: '⏱️', title: '2 hours → 2 minutes', desc: 'Reduce time spent on lesson preparation by 98%.' },
      { icon: '🎯', title: 'Curriculum Aligned', desc: 'Automatic adaptation to your curriculum.' },
      { icon: '♻️', title: 'Save as Template', desc: 'Store your created plans in the library.' },
    ],
    benefitsDe: [
      { icon: '⏱️', title: '2 Stunden → 2 Minuten', desc: 'Reduzieren Sie die Unterrichtsvorbereitungszeit um 98%.' },
      { icon: '🎯', title: 'Lehrplankonform', desc: 'Automatische Anpassung an Ihren Lehrplan.' },
      { icon: '♻️', title: 'Als Vorlage speichern', desc: 'Speichern Sie Ihre erstellten Pläne in der Bibliothek.' },
    ],
    mockup: null,
    related: ['teacher', 'test-system', 'gradebook'],
  },

  'test-system': {
    icon: '📝', color: '#0ea5e9', pale: '#f0f9ff',
    titleTr: 'Test & Değerlendirme Sistemi', titleEn: 'Test & Assessment System', titleDe: 'Test- & Bewertungssystem',
    subtitleTr: '18 soru tipiyle kapsamlı değerlendirme',
    subtitleEn: 'Comprehensive assessment with 18 question types',
    subtitleDe: 'Umfassende Beurteilung mit 18 Fragetypen',
    tabsTr: [
      { icon: '✅', title: 'Metin Tabanlı Sorular', desc: 'Çoktan seçmeli (tek/çoklu), Doğru/Yanlış, Kısa Cevap, Uzun Cevap, Boşluk Doldurma (metin/dropdown).' },
      { icon: '🔄', title: 'İnteraktif Sorular', desc: 'Eşleştirme, Sıralama, Sınıflandırma, Tablo Doldurma — öğrenciyi aktif tutar.' },
      { icon: '🔮', title: 'Yakında Geliyor', desc: 'Çizim, Etiket Sürükle, Sıcak Nokta, GeoGebra, Desmos, Ses Kaydı sorularına entegrasyon yolda.' },
      { icon: '📦', title: 'İçerik Blokları', desc: 'Sorular arasına metin, görsel, video, PDF, ses, PowerPoint, simülasyon ekleyin.' },
    ],
    tabsEn: [
      { icon: '✅', title: 'Text-Based Questions', desc: 'Multiple choice (single/multi), True/False, Short Answer, Essay, Fill in the Blank (text/dropdown).' },
      { icon: '🔄', title: 'Interactive Questions', desc: 'Matching, Ordering, Classification, Table Fill — keeps students active.' },
      { icon: '🔮', title: 'Coming Soon', desc: 'Drawing, Label Drag, Hotspot, GeoGebra, Desmos, Audio Recording question integrations on the way.' },
      { icon: '📦', title: 'Content Blocks', desc: 'Add text, images, video, PDF, audio, PowerPoint, simulations between questions.' },
    ],
    tabsDe: [
      { icon: '✅', title: 'Textbasierte Fragen', desc: 'Multiple Choice (einfach/mehrfach), Wahr/Falsch, Kurzantwort, Aufsatz, Lückentext (Text/Dropdown).' },
      { icon: '🔄', title: 'Interaktive Fragen', desc: 'Zuordnung, Reihenfolge, Klassifizierung, Tabelle ausfüllen — hält Schüler aktiv.' },
      { icon: '🔮', title: 'Demnächst', desc: 'Zeichnen, Etikett ziehen, Hotspot, GeoGebra, Desmos, Audioaufzeichnung kommen bald.' },
      { icon: '📦', title: 'Inhaltsblöcke', desc: 'Text, Bilder, Video, PDF, Audio, PowerPoint, Simulationen zwischen Fragen einfügen.' },
    ],
    benefitsTr: [
      { icon: '🎯', title: 'Her Seviye İçin', desc: 'Basit sınavdan ileri değerlendirmeye her türlü test oluşturun.' },
      { icon: '🤖', title: 'Otomatik Puanlama', desc: 'Seçenekli sorular otomatik, açık uçlu sorular AI ile puanlanır.' },
      { icon: '📊', title: 'Detaylı Analiz', desc: 'Her sorunun başarı oranını ve sınıf dağılımını görün.' },
    ],
    benefitsEn: [
      { icon: '🎯', title: 'For Every Level', desc: 'Create tests from simple quizzes to advanced assessments.' },
      { icon: '🤖', title: 'Automatic Grading', desc: 'Choice questions auto-graded, open-ended graded by AI.' },
      { icon: '📊', title: 'Detailed Analysis', desc: 'See success rate and class distribution for every question.' },
    ],
    benefitsDe: [
      { icon: '🎯', title: 'Für jedes Niveau', desc: 'Tests von einfachen Quizzen bis zu fortgeschrittenen Beurteilungen erstellen.' },
      { icon: '🤖', title: 'Automatische Benotung', desc: 'Auswahlfragen automatisch, offene Fragen per KI benotet.' },
      { icon: '📊', title: 'Detaillierte Analyse', desc: 'Erfolgsquote und Klassenverteilung für jede Frage anzeigen.' },
    ],
    mockup: null,
    related: ['teacher', 'gradebook', 'ai-planner'],
  },

  gradebook: {
    icon: '📊', color: '#d97706', pale: '#fffbeb',
    titleTr: 'Not Defteri', titleEn: 'Grade Book', titleDe: 'Notenbuch',
    subtitleTr: 'Ağırlıklı not sistemi, otomatik hesaplama',
    subtitleEn: 'Weighted grade system, automatic calculation',
    subtitleDe: 'Gewichtetes Notensystem, automatische Berechnung',
    tabsTr: [
      { icon: '⚖️', title: 'Ağırlıklı Bileşenler', desc: 'Ödev, sınav, proje gibi bileşenlere ağırlık verin. Dönem notu otomatik hesaplanır.' },
      { icon: '📋', title: 'Grid Bazlı Giriş', desc: 'Excel benzeri not giriş ekranı. Hızlı toplu giriş imkânı.' },
      { icon: '🔢', title: 'Otomatik Hesaplama', desc: 'Ağırlıklı ortalama, harf notu ve GPA dönüşümü anlık hesaplanır.' },
      { icon: '🎨', title: 'Renk Kodlu Görünüm', desc: 'Başarı durumuna göre renk kodlama. Düşük notlar kırmızı, yüksek notlar yeşil.' },
    ],
    tabsEn: [
      { icon: '⚖️', title: 'Weighted Components', desc: 'Assign weights to homework, exams, projects. Term grade calculated automatically.' },
      { icon: '📋', title: 'Grid-Based Entry', desc: 'Excel-like grade entry screen. Fast bulk entry capability.' },
      { icon: '🔢', title: 'Automatic Calculation', desc: 'Weighted average, letter grade and GPA conversion calculated instantly.' },
      { icon: '🎨', title: 'Color-Coded View', desc: 'Color coding by achievement level. Low grades red, high grades green.' },
    ],
    tabsDe: [
      { icon: '⚖️', title: 'Gewichtete Komponenten', desc: 'Hausaufgaben, Prüfungen, Projekten Gewichte zuweisen. Semesternote automatisch berechnet.' },
      { icon: '📋', title: 'Rasterbasierte Eingabe', desc: 'Excel-ähnliche Noteneingabeoberfläche. Schnelle Masseneingabe möglich.' },
      { icon: '🔢', title: 'Automatische Berechnung', desc: 'Gewichteter Durchschnitt, Buchnotenumrechnung und GPA sofort berechnet.' },
      { icon: '🎨', title: 'Farbkodierte Ansicht', desc: 'Farbcodierung nach Leistungsniveau. Schlechte Noten rot, gute grün.' },
    ],
    benefitsTr: [
      { icon: '⚡', title: 'Sıfır Hesap Hatası', desc: 'Tüm hesaplamalar otomatik — insan hatası yok.' },
      { icon: '📤', title: 'Excel\'e Aktar', desc: 'Not defterini tek tıkla Excel dosyasına indirin.' },
      { icon: '📱', title: 'Anlık Güncelleme', desc: 'Not girişi anında öğrenci ve veli panellerine yansır.' },
    ],
    benefitsEn: [
      { icon: '⚡', title: 'Zero Calculation Errors', desc: 'All calculations automatic — no human error.' },
      { icon: '📤', title: 'Export to Excel', desc: 'Download grade book to Excel file in one click.' },
      { icon: '📱', title: 'Instant Update', desc: 'Grade entries immediately reflected in student and parent panels.' },
    ],
    benefitsDe: [
      { icon: '⚡', title: 'Null Berechnungsfehler', desc: 'Alle Berechnungen automatisch — kein menschlicher Fehler.' },
      { icon: '📤', title: 'Nach Excel exportieren', desc: 'Notenbuch mit einem Klick als Excel-Datei herunterladen.' },
      { icon: '📱', title: 'Sofortige Aktualisierung', desc: 'Noteineingaben werden sofort in Schüler- und Elternpanelen angezeigt.' },
    ],
    mockup: null,
    related: ['teacher', 'student', 'test-system', 'analytics'],
  },

  attendance: {
    icon: '📅', color: '#dc2626', pale: '#fef2f2',
    titleTr: 'Devamsızlık Yönetimi', titleEn: 'Attendance Management', titleDe: 'Anwesenheitsverwaltung',
    subtitleTr: 'Akıllı takip, anında bildirim',
    subtitleEn: 'Smart tracking, instant notifications',
    subtitleDe: 'Intelligente Verfolgung, sofortige Benachrichtigungen',
    tabsTr: [
      { icon: '⚡', title: 'Hızlı Yoklama', desc: 'Derse girişte tek tıkla yoklama. Toplu işlem ile tüm sınıf saniyeler içinde.' },
      { icon: '✅', title: 'Müdür Onay Sistemi', desc: 'Devamsızlıklar müdür yardımcısının onayından geçer. Denetim izi kayıt altında.' },
      { icon: '📱', title: 'WhatsApp + Email', desc: 'Onaylanan her devamsızlık için veli anında haberdar olur. Mesaj şablonları hazır.' },
      { icon: '📊', title: 'Aylık Raporlama', desc: 'Her öğrenci için aylık devam raporu. Devam oranı grafikleri.' },
      { icon: '🚨', title: 'Kronik Devamsızlık', desc: 'Risk eşiğini aşan öğrenciler için otomatik uyarı. Yöneticilere bildirim.' },
    ],
    tabsEn: [
      { icon: '⚡', title: 'Quick Attendance', desc: 'One-click attendance at class entry. Process whole class in seconds with bulk action.' },
      { icon: '✅', title: 'Principal Approval', desc: 'Absences go through vice principal approval. Audit trail recorded.' },
      { icon: '📱', title: 'WhatsApp + Email', desc: 'Parents notified instantly for each approved absence. Message templates ready.' },
      { icon: '📊', title: 'Monthly Reporting', desc: 'Monthly attendance report per student. Attendance rate graphs.' },
      { icon: '🚨', title: 'Chronic Absence', desc: 'Automatic alert for students exceeding risk threshold. Notifications to administrators.' },
    ],
    tabsDe: [
      { icon: '⚡', title: 'Schnelle Anwesenheit', desc: 'Ein-Klick-Anwesenheit beim Unterrichtseintritt. Ganze Klasse in Sekunden verarbeiten.' },
      { icon: '✅', title: 'Schulleitergenehmigung', desc: 'Fehlzeiten durchlaufen die Genehmigung des stellvertretenden Direktors. Prüfpfad aufgezeichnet.' },
      { icon: '📱', title: 'WhatsApp + E-Mail', desc: 'Eltern sofort bei jeder genehmigten Fehlzeit benachrichtigt. Nachrichtenvorlagen bereit.' },
      { icon: '📊', title: 'Monatliche Berichterstattung', desc: 'Monatlicher Anwesenheitsbericht pro Schüler. Anwesenheitsraten-Grafiken.' },
      { icon: '🚨', title: 'Chronische Fehlzeiten', desc: 'Automatische Warnung für Schüler die Risikoschwelle überschreiten. Benachrichtigungen an Administratoren.' },
    ],
    benefitsTr: [
      { icon: '⏱️', title: 'Yoklama: 30 Saniye', desc: 'Tüm sınıfın yoklaması 30 saniye içinde tamamlanır.' },
      { icon: '📢', title: 'Sıfır Atlatma', desc: 'Onay akışı sayesinde hiçbir devamsızlık gözden kaçmaz.' },
      { icon: '📈', title: 'Trend Analizi', desc: 'Dönem boyunca devamsızlık örüntülerini takip edin.' },
    ],
    benefitsEn: [
      { icon: '⏱️', title: 'Attendance: 30 Seconds', desc: 'Full class attendance completed in 30 seconds.' },
      { icon: '📢', title: 'Zero Missed Absences', desc: 'Approval workflow ensures no absence goes unnoticed.' },
      { icon: '📈', title: 'Trend Analysis', desc: 'Track absence patterns throughout the term.' },
    ],
    benefitsDe: [
      { icon: '⏱️', title: 'Anwesenheit: 30 Sekunden', desc: 'Vollständige Klassenanwesenheit in 30 Sekunden abgeschlossen.' },
      { icon: '📢', title: 'Null verpasste Fehlzeiten', desc: 'Genehmigungsworkflow stellt sicher, dass keine Fehlzeit unbemerkt bleibt.' },
      { icon: '📈', title: 'Trendanalyse', desc: 'Fehlzeitmuster während des Semesters verfolgen.' },
    ],
    mockup: null,
    related: ['teacher', 'parent', 'analytics', 'communication'],
  },

  analytics: {
    icon: '📈', color: '#0f766e', pale: '#f0fdfa',
    titleTr: 'Analitik Dashboard', titleEn: 'Analytics Dashboard', titleDe: 'Analyse-Dashboard',
    subtitleTr: 'Veriye dayalı kararlar alın',
    subtitleEn: 'Make data-driven decisions',
    subtitleDe: 'Datenbasierte Entscheidungen treffen',
    tabsTr: [
      { icon: '🏫', title: 'Okul Geneli KPI\'lar', desc: 'Ortalama başarı, devam oranı, öğretmen etkinliği. Tek bakışta okulun nabzı.' },
      { icon: '⚠️', title: 'Risk Tespiti', desc: 'Düşen notlar ve kronik devamsızlık olan öğrenciler otomatik tespit edilir.' },
      { icon: '👩‍🏫', title: 'Öğretmen Analizi', desc: 'Sınıf başarıları, test kullanım oranları, bülten gönderim takibi.' },
      { icon: '📉', title: 'Devamsızlık Trendleri', desc: 'Günlük, haftalık, aylık devam grafikleri. Dönem karşılaştırması.' },
      { icon: '📤', title: 'PDF/Excel Export', desc: 'Tüm raporları PDF veya Excel formatında indirin. Okul idaresi için hazır.' },
    ],
    tabsEn: [
      { icon: '🏫', title: 'School-Wide KPIs', desc: 'Average achievement, attendance rate, teacher effectiveness. School pulse at a glance.' },
      { icon: '⚠️', title: 'Risk Detection', desc: 'Students with declining grades and chronic absences automatically detected.' },
      { icon: '👩‍🏫', title: 'Teacher Analysis', desc: 'Class achievements, test usage rates, newsletter send tracking.' },
      { icon: '📉', title: 'Attendance Trends', desc: 'Daily, weekly, monthly attendance graphs. Term comparison.' },
      { icon: '📤', title: 'PDF/Excel Export', desc: 'Download all reports in PDF or Excel format. Ready for school administration.' },
    ],
    tabsDe: [
      { icon: '🏫', title: 'Schulweite KPIs', desc: 'Durchschnittliche Leistung, Anwesenheitsrate, Lehrerwirksamkeit. Schulpuls auf einen Blick.' },
      { icon: '⚠️', title: 'Risikoerkennung', desc: 'Schüler mit sinkenden Noten und chronischen Fehlzeiten automatisch erkannt.' },
      { icon: '👩‍🏫', title: 'Lehreranalyse', desc: 'Klassenleistungen, Testnutzungsraten, Newsletter-Versandverfolgung.' },
      { icon: '📉', title: 'Anwesenheitstrends', desc: 'Tägliche, wöchentliche, monatliche Anwesenheitsgrafiken. Semestervergleich.' },
      { icon: '📤', title: 'PDF/Excel-Export', desc: 'Alle Berichte als PDF oder Excel herunterladen. Bereit für die Schulverwaltung.' },
    ],
    benefitsTr: [
      { icon: '🧠', title: 'Proaktif Yönetim', desc: 'Sorunlar büyümeden, veri sizi uyarır.' },
      { icon: '📋', title: 'Hazır Raporlar', desc: 'Okul idaresi, müfettişlik ve veli toplantıları için tek tıkla rapor.' },
      { icon: '🔍', title: 'Detaylı Filtreleme', desc: 'Sınıf, öğretmen, dönem veya konu bazında filtreleyin.' },
    ],
    benefitsEn: [
      { icon: '🧠', title: 'Proactive Management', desc: 'Data alerts you before problems grow.' },
      { icon: '📋', title: 'Ready Reports', desc: 'One-click reports for administration, inspections and parent meetings.' },
      { icon: '🔍', title: 'Detailed Filtering', desc: 'Filter by class, teacher, term or subject.' },
    ],
    benefitsDe: [
      { icon: '🧠', title: 'Proaktives Management', desc: 'Daten warnen Sie bevor Probleme wachsen.' },
      { icon: '📋', title: 'Fertige Berichte', desc: 'Ein-Klick-Berichte für Verwaltung, Inspektionen und Elterntreffen.' },
      { icon: '🔍', title: 'Detaillierte Filterung', desc: 'Nach Klasse, Lehrer, Semester oder Fach filtern.' },
    ],
    mockup: null,
    related: ['teacher', 'attendance', 'gradebook'],
  },

  communication: {
    icon: '💬', color: '#9333ea', pale: '#faf5ff',
    titleTr: 'İletişim Sistemi', titleEn: 'Communication System', titleDe: 'Kommunikationssystem',
    subtitleTr: 'Velilerle köprü kurun',
    subtitleEn: 'Bridge the gap with parents',
    subtitleDe: 'Die Verbindung zu Eltern herstellen',
    tabsTr: [
      { icon: '💬', title: 'WhatsApp Bildirimleri', desc: 'Devamsızlık, not, bülten gibi bildirimler WhatsApp ile anlık iletilir.' },
      { icon: '📧', title: 'Email Şablonları', desc: 'Hazır şablonlar ile profesyonel email iletişimi. Özelleştirilebilir içerik.' },
      { icon: '📋', title: 'Performans Bülteni', desc: 'Aylık bülten otomatik hazırlanır. Notlar, devam, öğretmen yorumları içerir.' },
      { icon: '🚨', title: 'Devamsızlık Uyarıları', desc: 'Risk eşiğini aşan devamsızlıklarda veliye otomatik uyarı gönderilir.' },
      { icon: '🔒', title: 'KVKK Uyumlu', desc: 'Tüm iletişim KVKK ve GDPR gereksinimlerine uygun şekilde işlenir.' },
    ],
    tabsEn: [
      { icon: '💬', title: 'WhatsApp Notifications', desc: 'Absence, grade, newsletter notifications sent instantly via WhatsApp.' },
      { icon: '📧', title: 'Email Templates', desc: 'Professional email communication with ready templates. Customisable content.' },
      { icon: '📋', title: 'Performance Newsletter', desc: 'Monthly newsletter auto-generated. Includes grades, attendance, teacher comments.' },
      { icon: '🚨', title: 'Absence Alerts', desc: 'Automatic alerts sent to parents when absence threshold exceeded.' },
      { icon: '🔒', title: 'GDPR Compliant', desc: 'All communication processed in compliance with GDPR requirements.' },
    ],
    tabsDe: [
      { icon: '💬', title: 'WhatsApp-Benachrichtigungen', desc: 'Fehlzeiten-, Noten-, Newsletter-Benachrichtigungen sofort per WhatsApp gesendet.' },
      { icon: '📧', title: 'E-Mail-Vorlagen', desc: 'Professionelle E-Mail-Kommunikation mit fertigen Vorlagen. Anpassbarer Inhalt.' },
      { icon: '📋', title: 'Leistungs-Newsletter', desc: 'Monatlicher Newsletter automatisch erstellt. Enthält Noten, Anwesenheit, Lehrerkommentare.' },
      { icon: '🚨', title: 'Fehlzeit-Warnungen', desc: 'Automatische Warnungen an Eltern wenn Fehlzeitschwelle überschritten.' },
      { icon: '🔒', title: 'DSGVO-konform', desc: 'Gesamte Kommunikation gemäß DSGVO-Anforderungen verarbeitet.' },
    ],
    benefitsTr: [
      { icon: '⚡', title: 'Sıfır Manuel İş', desc: 'Bildirimler tamamen otomatik, elle gönderme yok.' },
      { icon: '👥', title: 'Toplu İletişim', desc: 'Tüm velilere tek seferinde ulaşın.' },
      { icon: '🔒', title: 'Yasal Uyum', desc: 'KVKK ve GDPR\'a tam uyum, hukuki güvence.' },
    ],
    benefitsEn: [
      { icon: '⚡', title: 'Zero Manual Work', desc: 'Notifications fully automatic, no manual sending.' },
      { icon: '👥', title: 'Bulk Communication', desc: 'Reach all parents at once.' },
      { icon: '🔒', title: 'Legal Compliance', desc: 'Full GDPR compliance, legal assurance.' },
    ],
    benefitsDe: [
      { icon: '⚡', title: 'Null manuelle Arbeit', desc: 'Benachrichtigungen vollautomatisch, kein manuelles Senden.' },
      { icon: '👥', title: 'Massenkommunikation', desc: 'Alle Eltern auf einmal erreichen.' },
      { icon: '🔒', title: 'Rechtliche Compliance', desc: 'Vollständige DSGVO-Konformität, rechtliche Sicherheit.' },
    ],
    mockup: null,
    related: ['attendance', 'parent', 'analytics'],
  },
}

const MODULE_LABELS: Record<string, { icon: string; labelTr: string; labelEn: string; labelDe: string }> = {
  teacher:        { icon: '👩‍🏫', labelTr: 'Öğretmen Paneli',  labelEn: 'Teacher Panel',       labelDe: 'Lehrerpanel' },
  student:        { icon: '👨‍🎓', labelTr: 'Öğrenci Paneli',  labelEn: 'Student Panel',       labelDe: 'Schülerpanel' },
  parent:         { icon: '👨‍👩‍👧', labelTr: 'Veli Portalı',   labelEn: 'Parent Portal',       labelDe: 'Elternportal' },
  'ai-planner':   { icon: '🤖', labelTr: 'AI Ders Planı',    labelEn: 'AI Lesson Planner',   labelDe: 'KI-Unterrichtsplaner' },
  'test-system':  { icon: '📝', labelTr: 'Test Sistemi',     labelEn: 'Test System',         labelDe: 'Testsystem' },
  gradebook:      { icon: '📊', labelTr: 'Not Defteri',      labelEn: 'Grade Book',          labelDe: 'Notenbuch' },
  attendance:     { icon: '📅', labelTr: 'Devamsızlık',      labelEn: 'Attendance',          labelDe: 'Anwesenheit' },
  analytics:      { icon: '📈', labelTr: 'Analitik',         labelEn: 'Analytics',           labelDe: 'Analysen' },
  communication:  { icon: '💬', labelTr: 'İletişim',         labelEn: 'Communication',       labelDe: 'Kommunikation' },
}

/* ─── Page component ──────────────────────────────────────────────────────── */

export default function FeaturePage({ params }: { params: { module: string } }) {
  const { lang } = useLanguage()
  const [activeTab, setActiveTab] = useState(0)

  const mod = MODULE_DEFS[params.module]
  if (!mod) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-body">
        <p className="text-2xl">404 — Modül bulunamadı</p>
        <Link href="/" className="text-blue-600 underline">Ana Sayfaya Dön</Link>
      </div>
    )
  }

  const title     = lang === 'tr' ? mod.titleTr     : lang === 'en' ? mod.titleEn     : mod.titleDe
  const subtitle  = lang === 'tr' ? mod.subtitleTr  : lang === 'en' ? mod.subtitleEn  : mod.subtitleDe
  const tabs      = lang === 'tr' ? mod.tabsTr      : lang === 'en' ? mod.tabsEn      : mod.tabsDe
  const benefits  = lang === 'tr' ? mod.benefitsTr  : lang === 'en' ? mod.benefitsEn  : mod.benefitsDe

  const breadcrumbHome = lang === 'tr' ? 'Ana Sayfa' : lang === 'en' ? 'Home' : 'Startseite'
  const breadcrumbFeat = lang === 'tr' ? 'Özellikler' : lang === 'en' ? 'Features' : 'Funktionen'
  const ctaTry   = lang === 'tr' ? 'Hemen Dene' : lang === 'en' ? 'Try Now' : 'Jetzt testen'
  const ctaDemo  = lang === 'tr' ? 'Demo Talep Et' : lang === 'en' ? 'Request Demo' : 'Demo anfragen'
  const benefitsTitle = lang === 'tr' ? 'Ne Kazanırsınız?' : lang === 'en' ? 'What You Gain' : 'Was Sie gewinnen'
  const relatedTitle  = lang === 'tr' ? 'Bunları da inceleyin' : lang === 'en' ? 'Also explore' : 'Auch erkunden'
  const backHome      = lang === 'tr' ? '← Ana Sayfaya Dön' : lang === 'en' ? '← Back to Home' : '← Zurück zur Startseite'

  const modLabel = MODULE_LABELS[params.module]
  const modLabelText = modLabel ? (lang === 'tr' ? modLabel.labelTr : lang === 'en' ? modLabel.labelEn : modLabel.labelDe) : title

  return (
    <div className="font-body" style={{ overflowX: 'hidden', color: 'var(--text)' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(196,181,253,0.12) 0%, transparent 50%), #F8FAFC',
        paddingTop: '96px', paddingBottom: '80px',
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 font-body text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
            <Link href="/" className="hover:underline" style={{ color: 'var(--accent)' }}>{breadcrumbHome}</Link>
            <span>›</span>
            <Link href="/#features" className="hover:underline" style={{ color: 'var(--accent)' }}>{breadcrumbFeat}</Link>
            <span>›</span>
            <span>{modLabelText}</span>
          </nav>

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
            style={{ backgroundColor: mod.pale }}>
            {mod.icon}
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-4xl md:text-6xl mb-4 leading-tight" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          <p className="font-body text-xl mb-8" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login"
              className="inline-flex items-center font-body font-bold px-7 py-3.5 rounded-xl text-white text-base transition-all hover:scale-105"
              style={{ backgroundColor: mod.color, boxShadow: `0 4px 20px ${mod.pale}` }}>
              {ctaTry}
            </Link>
            <a href="/#contact"
              className="inline-flex items-center font-body font-semibold px-7 py-3.5 rounded-xl text-base border transition-all hover:bg-white"
              style={{ borderColor: 'var(--gray-200)', color: 'var(--primary)' }}>
              {ctaDemo}
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURE TABS ──────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left: tab list */}
            <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {tabs.map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-body text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink"
                  style={activeTab === i ? {
                    backgroundColor: mod.pale,
                    color: mod.color,
                    borderLeft: `3px solid ${mod.color}`,
                    fontWeight: 700,
                  } : {
                    color: 'var(--text-muted)',
                    borderLeft: '3px solid transparent',
                  }}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>

            {/* Right: description + mockup */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl p-8 md:p-10 h-full"
                style={{ backgroundColor: mod.pale, border: `1px solid ${mod.color}20` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{tabs[activeTab]?.icon}</span>
                  <h3 className="font-display font-bold text-2xl" style={{ color: 'var(--text)' }}>
                    {tabs[activeTab]?.title}
                  </h3>
                </div>
                <p className="font-body text-base leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                  {tabs[activeTab]?.desc}
                </p>

                {/* CSS Mockup card */}
                <div className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: '#fff', border: '1px solid var(--gray-200)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--gray-200)' }}>
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 h-5 rounded-md" style={{ backgroundColor: 'var(--gray-100)' }} />
                  </div>
                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex gap-3">
                      <div className="w-1/3 h-3 rounded" style={{ backgroundColor: mod.pale }} />
                      <div className="w-1/4 h-3 rounded" style={{ backgroundColor: 'var(--gray-100)' }} />
                    </div>
                    {[80, 60, 90, 45].map((w, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: mod.pale }} />
                        <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--gray-100)' }}>
                          <div className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${w}%`, backgroundColor: mod.color, opacity: 0.7 }} />
                        </div>
                        <span className="font-body text-xs font-semibold" style={{ color: mod.color }}>{w}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: 'var(--gray-50)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center mb-12" style={{ color: 'var(--text)' }}>
            {benefitsTitle}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: '#fff', border: '1px solid var(--gray-200)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>{b.title}</h3>
                <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED ───────────────────────────────────────────────────────── */}
      {mod.related.length > 0 && (
        <section className="py-20" style={{ backgroundColor: '#fff' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold text-2xl text-center mb-8" style={{ color: 'var(--text)' }}>
              {relatedTitle}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {mod.related.map(rel => {
                const lbl = MODULE_LABELS[rel]
                if (!lbl) return null
                const labelText = lang === 'tr' ? lbl.labelTr : lang === 'en' ? lbl.labelEn : lbl.labelDe
                return (
                  <Link
                    key={rel}
                    href={`/features/${rel}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold border transition-all hover:scale-105"
                    style={{ borderColor: 'var(--gray-200)', color: 'var(--primary)', backgroundColor: 'var(--primary-pale)' }}
                  >
                    <span>{lbl.icon}</span> {labelText}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── BACK TO HOME ──────────────────────────────────────────────────── */}
      <section className="py-12" style={{ backgroundColor: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/"
            className="inline-flex items-center font-body text-sm font-semibold transition-colors"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
          >
            {backHome}
          </Link>
        </div>
      </section>

    </div>
  )
}
