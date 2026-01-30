import requests

def translate_text(text, lang):
    if lang == "en":
        return text

    url = "https://libretranslate.com/translate"

    payload = {
        "q": text,
        "source": "en",
        "target": lang,
        "format": "text"
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        r = requests.post(url, data=payload, headers=headers, timeout=8)
        return r.json()["translatedText"]
    except Exception as e:
        print("Translation failed:", e)
        return text