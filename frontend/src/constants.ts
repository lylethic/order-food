import { MenuItem, Order } from './types';

// Fallback mock data — used when backend is unavailable
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 's1',
    name: 'Crispy Calamari',
    description:
      'Lightly dusted, flash-fried calamari served with house-made garlic aioli and charred lemon.',
    price: 14.0,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDwedFlKwLaRwCbE0lowiPRg6gNZBag0KpbcnwhDUxi3V0Ldx5Z3U1bwK0MQEXlyQ1v7DCIZMh1vJx3epTHvQUgrVmLvhrPPdn-hnkUk-r5lps-DZOEApBqfkMiQtKJpudcSaf10CKTdqjvnL_uYHoDqvQ5dhSeXGhuLctQHlgUnDNqLQu1rCES2c059_zSRpC_ve53zWqYUoit070bM1e4KumQUnHdKkAdQnETRYZt8H2yzyRr8s6WYQvOwmEOJjPbCPlu6ieS2I',
    category: 'Starters',
    rating: 4.8,
  },
  {
    id: 's2',
    name: 'Heirloom Bruschetta',
    description:
      'Toasted sourdough topped with marinated seasonal heirloom tomatoes, fresh basil, and aged balsamic reduction.',
    price: 12.5,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiCW0p7ND4Y076DXg6HedZg4BufwJxry9YBfIs8T0Cc5cSCPUDx6vyWda9snJ3O-43Bq9xnYkZHCkngvtfSCWdMjYg79xhsQKSzD9pnj1ms5vxaXed33VYcLso4aS3uFEO0ERBZlkbFV140ybUq9NWZc1wbW2_ERI_zjLST3WUDmffcZo62bnBDdYSTE22L7N3m7WJjcvwgwrcLHt4QNJGf_lfNrW1N7L-chB83tyuXunrD9nYVkPKpww3DDEB1coDW5thJenssqQ',
    category: 'Starters',
    tag: 'Vegan',
  },
  {
    id: 's3',
    name: 'Truffle Parmesan Fries',
    description:
      'Crispy shoestring fries tossed in white truffle oil, grated parmesan, and fresh parsley.',
    price: 9.0,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAKxs1c5V0UYvVPc0HKwV8UOPkdBYuwGEYXsO6f3pBjW72HX2iy_KeNio-bE8riXLbxVZau3dni77ieyKwbGUL6YafNPWJ3PPOccrm2VUoTf5LFTxDuDE2U-kaTDb69S0yQ3q5o2KcvGu1AEIohhtNMlTVTir7XWQGrjQtRaXorP9Xwsw51Skm_iWeWaoh33fdMVWZ3KyFYA1KzB4k1kx-6X3VWdxc5_4zLMhCRy9bzBtNX-VQ6WpmnJsa6UI0NCBjytPRw0up0fz4',
    category: 'Starters',
  },
  {
    id: 'm1',
    name: 'Wood-fired Wagyu Ribeye',
    description:
      '12oz premium Wagyu beef, grilled over an open flame, served with smoked garlic butter and seasonal greens.',
    price: 55.0,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBvfPNZHVpGHHC0RMv6ibj_zhkZQQgrn5nu0bGHtH04CFs8gzqvCY_lrHUGees7lAph7zpj9imze-4ep154KjvoxS4v7LFFGL5wuIXaW_OwfePJGMASB4C2Mkx5-dO0KhN9xfupXAFrw3dnfmWiYel8YoBhqqG8wyt_i1Jg3b65kuGt1AdVeDE5fqWfkj3nZYkpxJ-n7hbO0Wm6oAo83bI-Y-6xL9oa_ILAB4aSSSD6AaNWEgMnULBxpii2rwJuOz2jjKQAE12PzuE',
    category: 'Mains',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    ticketNumber: 'RBK-84729',
    table: '12',
    status: 'Preparing',
    total: 68,
    timestamp: '12:42 PM',
    items: [
      {
        id: 'i1',
        name: 'Truffle Mushroom Pasta',
        qty: 1,
        price: 24.0,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuABRpWo-6VdL1fnH6B5mrXKmMfRmd_-IWFvkQo2rdgkaRQSg7ZxtV_DY6O_ffCAyWW53EsPhTyZ3Ul4n73xGckqVhyD2Vc3Q74zXtK6XNbZnwd5WwcSSpzAdj9mC-jVIkUUYNan5saO61iElCU2O3XcYUfUCU33PnlpinEEjbpQQ8b9iCEdDiAdFyrDyAvnRCCy7LFvE_GnyrSSxPwY8TUElthNPwUCHztFT681ubszIQn9Wk7lt_12wnKxZoJCJgePbxNfLHIajhE',
      },
      {
        id: 'i2',
        name: 'Grilled King Salmon',
        qty: 1,
        price: 32.0,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBQk2RaKqP3m3rjy8zGPRILhF8PUTpSG79yGOH-JKgi96A1DYn2B6ZdWekBJz7SUVsXXLaydc5Y1ecbPNw_2zJzzRLp7sCu19s-82yAkSetDI7Oh7ESEXo0NlMBY36h04W5XvC78Yd62RlBEEFJ4KvZAdx1HDQ2Viw1ZMf-khbLWP8s7pDEaYFT2vtqUqdSgS67rvv1tho2KAcsOipKbFDkebf39m5iFn8PZIbX2NF9Bk6p7SW-MqVNjp0aWttf1o0rKuKbL6TB36I',
        modifications: ['Sauce on side'],
      },
      {
        id: 'i3',
        name: 'Classic Tiramisu',
        qty: 1,
        price: 12.0,
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAaeQXtxPkXNBwf8FW1NAEhB95YTwkVOyrgVGWAwFS2vE_13lNl5gmZeCjosTLgVaz8hZbEEXv4I9CkXbyayXoq7tIeq9eABduoqjgmOCNDphUXraTStOOcoC9Prbr-wGD0AUkEiinRRzHayFDseQWn-v8nm79S8VEC8IX7UBgkqf_6qjstyaZTrpQuhTzVLHMzTNcGaitx2BU9Bi9I2yXe8Yg8vt8u3biDORuqZEdcTWCaP3GivI6tLu2Bl4U',
      },
    ],
  },
  {
    id: 'o2',
    ticketNumber: '#1042',
    table: '12',
    status: 'Cooking',
    total: 111,
    timestamp: '24m',
    items: [
      { id: 'i4', name: 'Truffle Risotto', qty: 2, price: 28.0 },
      {
        id: 'i5',
        name: 'Wagyu Ribeye',
        qty: 1,
        price: 55.0,
        modifications: ['Medium Rare', 'No garlic'],
      },
    ],
    waitLevel: 'High',
    waitTimeMinutes: 24,
  },
  {
    id: 'o3',
    ticketNumber: '#402',
    table: '12',
    status: 'Ready',
    total: 96,
    timestamp: '4 mins waiting',
    items: [
      {
        id: 'i6',
        name: 'Seared Scallops',
        qty: 2,
        price: 34.0,
        modifications: ['No garlic'],
      },
      { id: 'i7', name: 'Truffle Risotto', qty: 1, price: 28.0 },
    ],
    waitTimeMinutes: 4,
  },
];
