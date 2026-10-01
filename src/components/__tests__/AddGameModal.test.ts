import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AddGameModal from '../AddGameModal.vue';

// Mock Supabase & Google Drive helpers
vi.mock('../../lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
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
    addLibraryItemToDB: vi.fn().mockResolvedValue({ id: 'item-1' }),
    updateLibraryItemInDB: vi.fn().mockResolvedValue({ id: 'item-1' }),
  };
});

vi.mock('../../lib/googleDrive', () => ({
  triggerAutoDriveBackupIfEnabled: vi.fn(),
}));

describe('AddGameModal.vue', () => {
  const mockGame = {
    igdb_id: 1020,
    title: 'Super Mario Odyssey',
    cover_url: 'https://images.igdb.com/co123.jpg',
    release_year: 2017,
    genres: ['Platform', 'Adventure'],
    developers: ['Nintendo'],
    platforms: ['Nintendo Switch'],
    summary: 'A 3D platformer game.',
    steam_appid: null,
  };

  const mountModal = (props = {}) => {
    return mount(AddGameModal, {
      props: {
        game: mockGame,
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });
  };

  it('mounts cleanly without initialization or TDZ errors', () => {
    const wrapper = mountModal();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Super Mario Odyssey');
    expect(wrapper.text()).toContain('2017');
    expect(wrapper.text()).toContain('Nintendo');
  });

  it('renders platform options grouped correctly', () => {
    const wrapper = mountModal();

    const options = wrapper.findAll('option');
    const optionTexts = options.map(o => o.text());

    expect(optionTexts).toContain('PlayStation 5');
    expect(optionTexts).toContain('Nintendo Switch');
    expect(optionTexts).toContain('Nintendo Switch 2');
    expect(optionTexts).toContain('Xbox Series X/S');
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mountModal();

    const closeBtn = wrapper.find('.modal-close');
    await closeBtn.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

