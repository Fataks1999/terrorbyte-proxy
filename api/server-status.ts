// terrorbyte-proxy/api/server-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch'; // Vercel potrzebuje tego importu
import * as cheerio from 'cheerio';

// Funkcja pomocnicza...
const getTextFromRow = ($, label: string): string => {
  try {
    return $(`td:contains("${label}")`).next('td').text().trim();
  } catch (e) { return 'N/A'; }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const PUKAWKA_URL = 'https://serwery.pukawka.pl//ip-193.33.177.182:27015,id-927146.html';

  try {
    const response = await fetch(PUKAWKA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Pukawka zwróciła błąd: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const serverName = $('div.header h1').text().trim();
    const status = getTextFromRow($, 'Status serwera');
    const ip = getTextFromRow($, 'Adres IP serwera');
    const currentMap = getTextFromRow($, 'Aktualna mapa');
    const playersText = getTextFromRow($, 'Ilość graczy');

    const [current, max] = playersText.split(' / ').map(Number);

    const serverData = {
      serverName: serverName || "TERRORBYTE.PL [CS:GO] 5VS5",
      ip: ip || "193.33.177.182:27015",
      status: status === "Serwer jest włączony" ? 'Online' : 'Offline',
      currentMap: currentMap || 'N/A',
      players: {
        current: isNaN(current) ? 0 : current,
        max: isNaN(max) ? 0 : max,
      },
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json(serverData);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Nie udało się pobrać danych z serwera Pukawka.' });
  }
}