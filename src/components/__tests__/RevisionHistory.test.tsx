import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RevisionHistory } from "../RevisionHistory";

globalThis.fetch = vi.fn();

describe("RevisionHistory", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it("shows loading state initially", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<RevisionHistory articleSlug="test" />);

    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders revisions after loading", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, content: "版本 1 内容", createdAt: "2024-06-07T10:00:00Z" },
            { id: 2, content: "版本 2 内容", createdAt: "2024-06-08T10:00:00Z" },
          ],
        }),
    } as Response);

    render(<RevisionHistory articleSlug="test" />);

    await waitFor(() => {
      expect(screen.getByText("2024-06-07 18:00")).toBeInTheDocument();
      expect(screen.getByText("2024-06-08 18:00")).toBeInTheDocument();
    });
  });

  it("shows empty message when no revisions", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    } as Response);

    render(<RevisionHistory articleSlug="test" />);

    await waitFor(() => {
      expect(screen.getByText("暂无版本历史")).toBeInTheDocument();
    });
  });

  it("shows error message on fetch failure", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
    } as Response);

    render(<RevisionHistory articleSlug="test" />);

    await waitFor(() => {
      expect(screen.getByText("获取版本历史失败")).toBeInTheDocument();
    });
  });

  it("expands revision content on click", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: 1, content: "这是版本内容", createdAt: "2024-06-07T10:00:00Z" },
          ],
        }),
    } as Response);

    const user = userEvent.setup();
    render(<RevisionHistory articleSlug="test" />);

    await waitFor(() => {
      expect(screen.getByText("2024-06-07 18:00")).toBeInTheDocument();
    });

    await user.click(screen.getByText("2024-06-07 18:00"));

    expect(screen.getByText("这是版本内容")).toBeInTheDocument();
  });
});
