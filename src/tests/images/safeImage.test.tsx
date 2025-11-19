import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafeImage from '../../components/Image/SafeImage';

describe('SafeImage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders loading skeleton then image on load', () => {
    render(<SafeImage src="/uploads/test.png" alt="Alt" width={100} height={50} />);
    expect(screen.getByLabelText('Carregando imagem')).toBeInTheDocument();
  });

  it('shows timeout if image takes longer than 2s', async () => {
    render(<SafeImage src="/uploads/slow.png" alt="Alt" width={100} height={50} />);
    await vi.advanceTimersByTimeAsync(2100);
    expect(screen.getByLabelText('Tempo de carregamento excedido')).toBeInTheDocument();
  });
});
