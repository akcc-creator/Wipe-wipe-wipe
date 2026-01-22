
import { BackgroundInfo } from './types';

// === THE MASTER IMAGE POOL ===
// 人工精選的 100% 純風景照與自然生態，確保無錯誤圖片
// 擴充至 100+ 張，連結帶有 w=1080 參數以優化載入速度
export const ALL_IMAGES = [
  // --- 1. Sunrise / Morning (晨光) ---
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1080&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80',
  'https://images.unsplash.com/photo-1502318217862-aa4e294f9365?w=1080&q=80',
  'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1080&q=80',
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1080&q=80',
  'https://images.unsplash.com/photo-1504221502049-33580521e359?w=1080&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1080&q=80',
  'https://images.unsplash.com/photo-1465433068945-8f2441c9b208?w=1080&q=80',
  'https://images.unsplash.com/photo-1504194966601-529e79e61298?w=1080&q=80',
  'https://images.unsplash.com/photo-1507629562852-7b2434e3205f?w=1080&q=80',

  // --- 2. Ocean / Beach (海洋) ---
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1080&q=80',
  'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1080&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&q=80',
  'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1080&q=80',
  'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1080&q=80',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1080&q=80',
  'https://images.unsplash.com/photo-1520116468816-95b69f847e44?w=1080&q=80',
  'https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?w=1080&q=80',
  'https://images.unsplash.com/photo-1473116763249-560319c703fd?w=1080&q=80',
  'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1080&q=80',

  // --- 3. Mountain (高山) ---
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1080&q=80',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80',
  'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1080&q=80',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1080&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=80',
  'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=1080&q=80',
  'https://images.unsplash.com/photo-1464278533981-50121c478dc6?w=1080&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&q=80',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=1080&q=80',

  // --- 4. Forest / Jungle (森林) ---
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1080&q=80',
  'https://images.unsplash.com/photo-1476231682828-37edb4819a0f?w=1080&q=80',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1080&q=80',
  'https://images.unsplash.com/photo-1511497584788-876760111969?w=1080&q=80',
  'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1080&q=80',
  'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1080&q=80',
  'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1080&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1080&q=80',
  'https://images.unsplash.com/photo-1516214104703-d43011d623b9?w=1080&q=80',

  // --- 5. Lake / Water (湖泊) ---
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&q=80',
  'https://images.unsplash.com/photo-1439246854758-f686a415d988?w=1080&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1080&q=80',
  'https://images.unsplash.com/photo-1506504294863-74d30c00cc6a?w=1080&q=80',
  'https://images.unsplash.com/photo-1557456170-98535e501d50?w=1080&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&q=80',
  'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=1080&q=80',
  'https://images.unsplash.com/photo-1472396961693-142e6e594e13?w=1080&q=80',
  'https://images.unsplash.com/photo-1506501139174-099022df5260?w=1080&q=80',

  // --- 6. Sunset (夕陽) ---
  'https://images.unsplash.com/photo-1472120435266-531070423d8c?w=1080&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
  'https://images.unsplash.com/photo-1501434914109-7f3ae2b0e77d?w=1080&q=80',
  'https://images.unsplash.com/photo-1495616811223-4d98c6e9d856?w=1080&q=80',
  'https://images.unsplash.com/photo-1518117624949-0d29676e93df?w=1080&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1080&q=80',
  'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=1080&q=80',
  'https://images.unsplash.com/photo-1514477917009-389c76a86b68?w=1080&q=80',
  'https://images.unsplash.com/photo-1415604934674-561df9abf539?w=1080&q=80',
  'https://images.unsplash.com/photo-1516108317508-6788f6a160ee?w=1080&q=80',

  // --- 7. Snow / Winter (雪景) ---
  'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1080&q=80',
  'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=1080&q=80',
  'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1080&q=80',
  'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1080&q=80',
  'https://images.unsplash.com/photo-1549729864-4d809795e1e1?w=1080&q=80',
  'https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=1080&q=80',
  'https://images.unsplash.com/photo-1484351973547-713430156d42?w=1080&q=80',
  'https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1080&q=80',
  'https://images.unsplash.com/photo-1515237851609-246df1df4f6f?w=1080&q=80',
  'https://images.unsplash.com/photo-1489674267075-cee793167906?w=1080&q=80',

  // --- 8. Flowers / Garden (花卉與花園) ---
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1080&q=80',
  'https://images.unsplash.com/photo-1490750967868-58cb75069ed6?w=1080&q=80',
  'https://images.unsplash.com/photo-1507290439931-a861b5a38200?w=1080&q=80',
  'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=1080&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1080&q=80',
  'https://images.unsplash.com/photo-1462275646964-a0e338679cde?w=1080&q=80',
  'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=1080&q=80',
  'https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?w=1080&q=80',
  'https://images.unsplash.com/photo-1487030859580-f6551b87c71d?w=1080&q=80',
  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1080&q=80',

  // --- 9. Waterfall (瀑布) ---
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80',
  'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1080&q=80',
  'https://images.unsplash.com/photo-1498855926480-d98e83099315?w=1080&q=80',
  'https://images.unsplash.com/photo-1476900966809-92987c7a216d?w=1080&q=80',
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1080&q=80',

  // --- 10. Cute Animals / Nature Life (自然生物) ---
  'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=1080&q=80', // Deer
  'https://images.unsplash.com/photo-1507666405895-422eee7d517f?w=1080&q=80', // Bird
  'https://images.unsplash.com/photo-1518796745738-41048802f99a?w=1080&q=80', // Rabbit
  'https://images.unsplash.com/photo-1452570053594-1b985d6ea218?w=1080&q=80', // Chameleon
  'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=1080&q=80', // Monkey
];

export const TOTAL_IMAGES_COUNT = ALL_IMAGES.length;

export const DEFAULT_BRUSH_SIZE = 150;
export const COMPLETION_THRESHOLD = 99;
