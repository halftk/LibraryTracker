import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BookStatsDashboard from '../BookStatsDashboard.vue';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
  getBookLibraryItems: vi.fn().mockResolvedValue([]),
}));

describe('BookStatsDashboard.vue', () => {
  const mockBookItems = [
    {
      id: 'book-item-1',
      book: {
        id: 'book-1',
        title: 'Cien años de soledad',
        authors: ['Gabriel García Márquez'],
        cover_url: null,
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
        title: '1984',
        authors: ['George Orwell'],
        cover_url: null,
        published_year: 1949,
        publisher: 'Secker & Warburg',
        page_count: 328,
        categories: ['Distopía'],
        isbn: '9780451524935',
        description: null,
      },
      format: 'Ebook',
      status: 'Leído',
      start_date: '2023-02-01',
      finish_date: '2023-02-15',
      current_page: 328,
      total_pages: 328,
      rating: 5,
      lent_to: null,
      notes: null,
      created_at: '2023-02-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('bookLibraryItems', JSON.stringify(mockBookItems));
  });

  it('calculates total books and pages read correctly', async () => {
    const wrapper = mount(BookStatsDashboard);

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Total Libros');

    const statValues = wrapper.findAll('.stat-value');
    expect(statValues[0].text()).toBe('2'); // Total
    expect(statValues[1].text()).toBe('2'); // Leídos

    expect(wrapper.text()).toContain('799'); // 471 + 328 pages
    expect(wrapper.text()).toContain('5.0'); // Rating promedio
  });
});
