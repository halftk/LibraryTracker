import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import StatsDashboard from '../StatsDashboard.vue';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
  getLibraryItems: vi.fn().mockResolvedValue([]),
}));

describe('StatsDashboard.vue', () => {
  const mockItems = [
    {
      id: 'item-1',
      game: {
        igdb_id: 1,
        title: 'Super Mario Odyssey',
        cover_url: null,
        release_year: 2017,
        genres: ['Platformer', 'Adventure'],
        developers: ['Nintendo'],
        steam_appid: null,
      },
      platform: 'Nintendo Switch',
      status: 'Jugado',
      start_date: '2023-01-01',
      finish_date: '2023-01-15',
      playtime_hours: 25,
      rating: 5,
      lent_to: null,
      notes: null,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      game: {
        igdb_id: 2,
        title: 'Hollow Knight',
        cover_url: null,
        release_year: 2017,
        genres: ['Metroidvania', 'Platformer'],
        developers: ['Team Cherry'],
        steam_appid: null,
      },
      platform: 'PC',
      status: 'Jugado',
      start_date: '2023-02-01',
      finish_date: '2023-02-20',
      playtime_hours: 35,
      rating: 4,
      lent_to: null,
      notes: null,
      created_at: '2023-02-01T00:00:00Z',
    },
    {
      id: 'item-3',
      game: {
        igdb_id: 3,
        title: 'Metroid Dread',
        cover_url: null,
        release_year: 2021,
        genres: ['Metroidvania', 'Action'],
        developers: ['MercurySteam'],
        steam_appid: null,
      },
      platform: 'Nintendo Switch',
      status: 'En curso',
      start_date: '2023-03-01',
      finish_date: null,
      playtime_hours: 10,
      rating: null,
      lent_to: null,
      notes: null,
      created_at: '2023-03-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('libraryItems', JSON.stringify(mockItems));
  });

  it('calculates total items and status counts correctly', async () => {
    const wrapper = mount(StatsDashboard);

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Total Juegos');

    const statValues = wrapper.findAll('.stat-value');
    expect(statValues[0].text()).toBe('3'); // Total
    expect(statValues[1].text()).toBe('2'); // Jugados
    expect(statValues[2].text()).toBe('1'); // En curso
    expect(statValues[3].text()).toBe('0'); // Pendientes
  });

  it('calculates average rating and total playtime', async () => {
    const wrapper = mount(StatsDashboard);

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('4.5'); // (5 + 4) / 2
    expect(wrapper.text()).toContain('70.0h'); // 25 + 35 + 10 = 70
  });
});
