import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import LibraryGrid from '../LibraryGrid.vue';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
  getLibraryItems: vi.fn().mockResolvedValue([]),
  deleteLibraryItemFromDB: vi.fn().mockResolvedValue(true),
}));

describe('LibraryGrid.vue', () => {
  const mockItems = [
    {
      id: 'item-1',
      game: {
        igdb_id: 101,
        title: 'The Legend of Zelda: Breath of the Wild',
        cover_url: 'https://images.igdb.com/botw.jpg',
        release_year: 2017,
        genres: ['Action'],
        developers: ['Nintendo'],
        steam_appid: null,
      },
      platform: 'Nintendo Switch',
      status: 'Jugado',
      start_date: '2023-01-01',
      finish_date: '2023-02-01',
      playtime_hours: 80,
      rating: 5,
      lent_to: null,
      notes: null,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      game: {
        igdb_id: 102,
        title: 'Elden Ring',
        cover_url: 'https://images.igdb.com/elden.jpg',
        release_year: 2022,
        genres: ['RPG'],
        developers: ['FromSoftware'],
        steam_appid: null,
      },
      platform: 'PlayStation 5',
      status: 'En curso',
      start_date: '2023-03-01',
      finish_date: null,
      playtime_hours: 45,
      rating: 4,
      lent_to: null,
      notes: null,
      created_at: '2023-03-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('libraryItems', JSON.stringify(mockItems));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const mountGrid = () => {
    return mount(LibraryGrid, {
      global: {
        stubs: {
          AddGameModal: true,
          TransitionGroup: true,
        },
      },
    });
  };

  it('renders library items loaded from localStorage', async () => {
    const wrapper = mountGrid();

    await flushPromises();

    expect(wrapper.text()).toContain('The Legend of Zelda: Breath of the Wild');
    expect(wrapper.text()).toContain('Elden Ring');
  });

  it('filters items by status tab', async () => {
    const wrapper = mountGrid();

    await flushPromises();

    const tabs = wrapper.findAll('.filter-tab');
    const enCursoTab = tabs.find(t => t.text().includes('En curso'));
    expect(enCursoTab).toBeDefined();

    await enCursoTab!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Elden Ring');
    expect(wrapper.text()).not.toContain('The Legend of Zelda: Breath of the Wild');
  });

  it('filters items by search query input', async () => {
    const wrapper = mountGrid();

    await flushPromises();

    const searchInput = wrapper.find('.filter-search');
    await searchInput.setValue('Zelda');
    await flushPromises();

    expect(wrapper.text()).toContain('The Legend of Zelda: Breath of the Wild');
    expect(wrapper.text()).not.toContain('Elden Ring');
  });

  it('shows empty state when no items match filter', async () => {
    const wrapper = mountGrid();

    await flushPromises();

    const searchInput = wrapper.find('.filter-search');
    await searchInput.setValue('NonExistentGame123');
    await flushPromises();

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('No se encontraron juegos');
  });

  it('deletes item when clicking delete action button', async () => {
    const wrapper = mountGrid();

    await flushPromises();

    const deleteBtns = wrapper.findAll('.delete-btn');
    expect(deleteBtns.length).toBe(2);

    await deleteBtns[0].trigger('click');
    await flushPromises();

    const remainingCards = wrapper.findAll('.game-card');
    expect(remainingCards.length).toBe(1);
  });

  it('renders Nintendo Switch 2 box art banner for Switch 2 games', async () => {
    const switch2Items = [
      {
        id: 'item-switch2',
        game: {
          igdb_id: 201,
          title: 'Hyrule Warriors: Age of Imprisonment',
          cover_url: 'https://images.igdb.com/hyrule.jpg',
          release_year: 2025,
          genres: ['Action'],
          developers: ['Koei Tecmo'],
          steam_appid: null,
        },
        platform: 'Switch 2',
        status: 'Pendiente',
        start_date: null,
        finish_date: null,
        playtime_hours: 0,
        rating: null,
        lent_to: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    localStorage.setItem('libraryItems', JSON.stringify(switch2Items));

    const wrapper = mountGrid();
    await flushPromises();

    const header = wrapper.find('.box-art-header.header-switch2');
    expect(header.exists()).toBe(true);
    expect(header.find('.ns2-banner-logo-svg').exists()).toBe(true);
  });

  it('renders Nintendo Switch 1 box art badge for Switch games', async () => {
    const switch1Items = [
      {
        id: 'item-switch1',
        game: {
          igdb_id: 202,
          title: 'The Legend of Zelda: Breath of the Wild',
          cover_url: 'https://images.igdb.com/botw.jpg',
          release_year: 2017,
          genres: ['Action'],
          developers: ['Nintendo'],
          steam_appid: null,
        },
        platform: 'Nintendo Switch',
        status: 'Jugado',
        start_date: null,
        finish_date: null,
        playtime_hours: 80,
        rating: 5,
        lent_to: null,
        notes: null,
        created_at: '2017-03-03T00:00:00Z',
      },
    ];
    localStorage.setItem('libraryItems', JSON.stringify(switch1Items));

    const wrapper = mountGrid();
    await flushPromises();

    const header = wrapper.find('.box-art-header.header-switch1');
    expect(header.exists()).toBe(true);
    expect(header.find('.ns1-badge-logo-svg').exists()).toBe(true);
  });

  it('renders Nintendo DS box art spine for DS games', async () => {
    const dsItems = [
      {
        id: 'item-ds',
        game: {
          igdb_id: 203,
          title: 'Pokémon Edición Negra',
          cover_url: 'https://images.igdb.com/pokemon_black.jpg',
          release_year: 2010,
          genres: ['RPG'],
          developers: ['Game Freak'],
          steam_appid: null,
        },
        platform: 'Nintendo DS',
        status: 'Jugado',
        start_date: null,
        finish_date: null,
        playtime_hours: 40,
        rating: 5,
        lent_to: null,
        notes: null,
        created_at: '2010-09-18T00:00:00Z',
      },
    ];
    localStorage.setItem('libraryItems', JSON.stringify(dsItems));

    const wrapper = mountGrid();
    await flushPromises();

    const header = wrapper.find('.box-art-header.header-ds');
    expect(header.exists()).toBe(true);
    expect(header.find('.nds-spine-logo').exists()).toBe(true);
  });

  it('renders Nintendo 3DS box art spine for 3DS games', async () => {
    const n3dsItems = [
      {
        id: 'item-3ds',
        game: {
          igdb_id: 204,
          title: 'Pokémon Sol',
          cover_url: 'https://images.igdb.com/pokemon_sun.jpg',
          release_year: 2016,
          genres: ['RPG'],
          developers: ['Game Freak'],
          steam_appid: null,
        },
        platform: 'Nintendo 3DS',
        status: 'Jugado',
        start_date: null,
        finish_date: null,
        playtime_hours: 50,
        rating: 4,
        lent_to: null,
        notes: null,
        created_at: '2016-11-18T00:00:00Z',
      },
    ];
    localStorage.setItem('libraryItems', JSON.stringify(n3dsItems));

    const wrapper = mountGrid();
    await flushPromises();

    const header = wrapper.find('.box-art-header.header-3ds');
    expect(header.exists()).toBe(true);
    expect(header.find('.n3ds-spine-logo').exists()).toBe(true);
  });

  it('renders Nintendo Wii box art banner for Wii games', async () => {
    const wiiItems = [
      {
        id: 'item-wii',
        game: {
          igdb_id: 205,
          title: 'Wii Sports',
          cover_url: 'https://images.igdb.com/wii_sports.jpg',
          release_year: 2006,
          genres: ['Sports'],
          developers: ['Nintendo'],
          steam_appid: null,
        },
        platform: 'Nintendo Wii',
        status: 'Jugado',
        start_date: null,
        finish_date: null,
        playtime_hours: 30,
        rating: 5,
        lent_to: null,
        notes: null,
        created_at: '2006-11-19T00:00:00Z',
      },
    ];
    localStorage.setItem('libraryItems', JSON.stringify(wiiItems));

    const wrapper = mountGrid();
    await flushPromises();

    const header = wrapper.find('.box-art-header.header-wii');
    expect(header.exists()).toBe(true);
    expect(header.find('.wii-banner-logo').exists()).toBe(true);
  });
});


