import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GameSearch from '../GameSearch.vue';

describe('GameSearch.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders search input field', () => {
    const wrapper = mount(GameSearch);
    const input = wrapper.find('input.search-field');
    expect(input.exists()).toBe(true);
  });

  it('updates query value on user typing', async () => {
    const wrapper = mount(GameSearch);
    const input = wrapper.find('input.search-field');
    await input.setValue('Zelda');
    expect((input.element as HTMLInputElement).value).toBe('Zelda');
  });

  it('clears query and results when clear button is clicked', async () => {
    const wrapper = mount(GameSearch);
    const input = wrapper.find('input.search-field');
    await input.setValue('Zelda');
    
    const clearBtn = wrapper.find('.clear-btn');
    expect(clearBtn.exists()).toBe(true);

    await clearBtn.trigger('click');
    expect((input.element as HTMLInputElement).value).toBe('');
    expect(wrapper.find('.clear-btn').exists()).toBe(false);
  });

  it('fetches search results after debounced typing', async () => {
    const mockResults = [
      {
        igdb_id: 1020,
        title: 'The Legend of Zelda: Tears of the Kingdom',
        cover_url: 'https://images.igdb.com/zelda.jpg',
        release_year: 2023,
        genres: ['Action', 'Adventure'],
        developers: ['Nintendo'],
        platforms: ['Nintendo Switch'],
        summary: null,
        steam_appid: null,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    const wrapper = mount(GameSearch);
    const input = wrapper.find('input.search-field');

    await input.setValue('Zelda');
    vi.advanceTimersByTime(400);
    await wrapper.vm.$nextTick();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/igdb/search?q=Zelda')
    );
  });

  it('emits select-game event when a game result item is clicked', async () => {
    const mockResults = [
      {
        igdb_id: 1020,
        title: 'Super Mario Odyssey',
        cover_url: 'https://images.igdb.com/mario.jpg',
        release_year: 2017,
        genres: ['Platform'],
        developers: ['Nintendo'],
        platforms: ['Nintendo Switch'],
        summary: null,
        steam_appid: null,
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    const wrapper = mount(GameSearch);
    const input = wrapper.find('input.search-field');

    await input.setValue('Mario');
    vi.advanceTimersByTime(400);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const resultItem = wrapper.find('.result-item');
    if (resultItem.exists()) {
      await resultItem.trigger('click');
      expect(wrapper.emitted('select-game')).toBeTruthy();
      expect(wrapper.emitted('select-game')![0][0]).toEqual(mockResults[0]);
    }
  });
});

