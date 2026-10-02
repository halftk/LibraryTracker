import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BookSearch from '../BookSearch.vue';

describe('BookSearch.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders search input field for Google Books', () => {
    const wrapper = mount(BookSearch);
    const input = wrapper.find('input.search-field');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toContain('Google Books');
  });

  it('updates query value on user typing', async () => {
    const wrapper = mount(BookSearch);
    const input = wrapper.find('input.search-field');
    await input.setValue('Cien años de soledad');
    expect((input.element as HTMLInputElement).value).toBe('Cien años de soledad');
  });

  it('clears query and results when clear button is clicked', async () => {
    const wrapper = mount(BookSearch);
    const input = wrapper.find('input.search-field');
    await input.setValue('Quijote');

    const clearBtn = wrapper.find('.clear-btn');
    expect(clearBtn.exists()).toBe(true);

    await clearBtn.trigger('click');
    expect((input.element as HTMLInputElement).value).toBe('');
    expect(wrapper.find('.clear-btn').exists()).toBe(false);
  });

  it('fetches search results from /api/google-books/search', async () => {
    const mockResults = [
      {
        id: 'book-1',
        title: 'Cien años de soledad',
        authors: ['Gabriel García Márquez'],
        cover_url: 'https://books.google.com/cover1.jpg',
        published_year: 1967,
        publisher: 'Editorial Sudamericana',
        page_count: 471,
        categories: ['Ficción'],
        isbn: '9788437604947',
        description: 'Obra maestra de la literatura.',
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    const wrapper = mount(BookSearch);
    const input = wrapper.find('input.search-field');

    await input.setValue('Cien años');
    vi.advanceTimersByTime(400);
    await wrapper.vm.$nextTick();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/google-books/search?q=Cien%20a%C3%B1os')
    );
  });
});
