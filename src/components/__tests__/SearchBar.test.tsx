import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "../SearchBar";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders search input with placeholder", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText("Search articles...")).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchBar placeholder="搜索文章..." />);
    expect(screen.getByPlaceholderText("搜索文章...")).toBeInTheDocument();
  });

  it("renders with default value", () => {
    render(<SearchBar defaultValue="初始值" />);
    expect(screen.getByDisplayValue("初始值")).toBeInTheDocument();
  });

  it("navigates to search page on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search articles...");
    await user.type(input, "React 教程");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=React%20%E6%95%99%E7%A8%8B");
  });

  it("calls onSearch callback when provided", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText("Search articles...");
    await user.type(input, "测试查询");
    await user.keyboard("{Enter}");

    expect(onSearch).toHaveBeenCalledWith("测试查询");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not submit empty query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.keyboard("{Enter}");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("trims whitespace from query", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search articles...");
    await user.type(input, "  React  ");
    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/search?q=React");
  });
});
