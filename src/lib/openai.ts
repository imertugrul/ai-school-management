// OpenAI Data Processing Agreement (DPA) imzalanmalıdır.
// https://openai.com/policies/data-processing-addendum
//
// KVKK / GDPR GEREKSİNİMLERİ:
// - Öğrenci kişisel verisi (isim, email, TC kimlik no, ID) prompt'lara dahil edilmemelidir.
// - Yalnızca anonim içerik (cevap metni, soru metni) AI'a gönderilebilir.
// - Her AI çağrısı src/lib/anonymize.ts helper'ı kullanılarak temizlenmelidir.
// - Tüm AI çağrıları AiLog tablosuna kaydedilmektedir (bkz. src/lib/aiLogger.ts).

import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. AI grading will not work.')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
})
