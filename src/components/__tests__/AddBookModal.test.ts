import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AddBookModal from '../AddBookModal.vue';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [] }),
    then: (resolve: any) => resolve({ data: [] }),
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
      },
      from: vi.fn().mockReturnValue(chain),
    },
    addBookLibraryItemToDB: vi.fn().mockResolvedValue({ id: 'item-1' }),
    updateBookLibraryItemInDB: vi.fn().mockResolvedValue({ id: 'item-1' }),
  };
});

describe('AddBookModal.vue', () => {
  const mockBook = {
    id: 'zyTCAl4tu-UC',
    title: 'Don Quijote de la Mancha',
    authors: ['Miguel de Cervantes'],
    cover_url: 'https://images.google.com/quijote.jpg',
    published_year: 1605,
    publisher: 'Francisco de Robles',
    page_count: 863,
    categories: ['Novela', 'Clásico'],
    isbn: '9788424116033',
    description: 'En un lugar de la Mancha...',
  };

  const mountModal = (props = {}) => {
    return mount(AddBookModal, {
      props: {
        book: mockBook,
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });
  };

  it('mounts cleanly displaying book title and authors', () => {
    const wrapper = mountModal();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Don Quijote de la Mancha');
    expect(wrapper.text()).toContain('Miguel de Cervantes');
    expect(wrapper.text()).toContain('863 páginas');
  });

  it('renders format and status options', () => {
    const wrapper = mountModal();

    const options = wrapper.findAll('option');
    const optionTexts = options.map(o => o.text());

    expect(optionTexts.some(t => t.includes('Físico'))).toBe(true);
    expect(optionTexts.some(t => t.includes('Ebook'))).toBe(true);
    expect(optionTexts.some(t => t.includes('Audiolibro'))).toBe(true);
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mountModal();

    const closeBtn = wrapper.find('.modal-close');
    await closeBtn.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
