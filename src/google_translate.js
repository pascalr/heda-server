import {TranslationServiceClient} from '@google-cloud/translate';

// Instantiates a client
const translationClient = new TranslationServiceClient();

const projectId = 'hedacuisine';
const location = 'global';

// FIXME: fromLocale
// FIXME: toLocale
export async function googleTranslate(text) {
  throw "Safety disabled google translate"
  
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: fromLocale,
    targetLanguageCode: toLocale,
  };

  const [response] = await translationClient.translateText(request);

  for (const translation of response.translations) {
    console.log(`Translation: ${translation.translatedText}`);
  }

  return response.translations[0].translatedText
}
