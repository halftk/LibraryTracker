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
});

