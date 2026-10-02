import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import BookGrid from '../BookGrid.vue';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
  getBookLibraryItems: vi.fn().mockResolvedValue([]),
  deleteBookLibraryItemFromDB: vi.fn().mockResolvedValue(true),
}));

describe('BookGrid.vue', () => {
  const mockBookItems = [
    {
      id: 'book-item-1',
      book: {
        id: 'book-1',
        title: 'Cien años de soledad',
        authors: ['Gabriel García Márquez'],
        cover_url: 'https://images.google.com/cien.jpg',
        published_year: 1967,
        publisher: 'Sudamericana',
        page_count: 471,
        categories: ['Ficción'],
        isbn: '9788437604947',
        description: null,
      },
      format: 'Físico',
      status: 'Leído',
      start_date: '2023-01-01',
      finish_date: '2023-01-20',
      current_page: 471,
      total_pages: 471,
      rating: 5,
      lent_to: null,
      notes: null,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'book-item-2',
      book: {
        id: 'book-2',
        title: 'El problema de los tres cuerpos',
        authors: ['Cixin Liu'],
        cover_url: 'https://images.google.com/tres.jpg',
        published_year: 2008,
        publisher: 'Ediciones B',
        page_count: 416,
        categories: ['Ciencia Ficción'],
        isbn: '9788466659733',
        description: null,
      },
      format: 'Ebook',
      status: 'Leyendo',
      start_date: '2023-02-01',
      finish_date: null,
      current_page: 200,
      total_pages: 416,
      rating: 4,
      lent_to: null,
      notes: null,
      created_at: '2023-02-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('bookLibraryItems', JSON.stringify(mockBookItems));
  });

  const mountGrid = () => {
    return mount(BookGrid, {
      global: {
        stubs: {
          AddBookModal: true,
          TransitionGroup: true,
        },
      },
    });
  };

  it('renders book items loaded from localStorage', async () => {
    const wrapper = mountGrid();
    await flushPromises();

    expect(wrapper.text()).toContain('Cien años de soledad');
    expect(wrapper.text()).toContain('El problema de los tres cuerpos');
  });

  it('filters book items by status tab', async () => {
    const wrapper = mountGrid();
    await flushPromises();

    const tabs = wrapper.findAll('.filter-tab');
    const leyendoTab = tabs.find(t => t.text().includes('Leyendo'));
    expect(leyendoTab).toBeDefined();

    await leyendoTab!.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('El problema de los tres cuerpos');
    expect(wrapper.text()).not.toContain('Cien años de soledad');
  });

  it('filters book items by search input', async () => {
    const wrapper = mountGrid();
    await flushPromises();

    const searchInput = wrapper.find('.filter-search');
    await searchInput.setValue('García Márquez');
    await flushPromises();

    expect(wrapper.text()).toContain('Cien años de soledad');
    expect(wrapper.text()).not.toContain('El problema de los tres cuerpos');
  });

  it('deletes book item when delete button is clicked', async () => {
    const wrapper = mountGrid();
    await flushPromises();

    const deleteBtns = wrapper.findAll('.delete-btn');
    expect(deleteBtns.length).toBe(2);

    await deleteBtns[0].trigger('click');
    await flushPromises();

    const remainingCards = wrapper.findAll('.book-card');
    expect(remainingCards.length).toBe(1);
  });
});
