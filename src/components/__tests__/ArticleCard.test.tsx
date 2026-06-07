import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArticleCard } from "../ArticleCard";

describe("ArticleCard", () => {
  const defaultProps = {
    title: "测试文章标题",
    slug: "test-article",
  };

  it("renders title as a link to article page", () => {
    render(<ArticleCard {...defaultProps} />);
    const link = screen.getByRole("link", { name: /测试文章标题/ });
    expect(link).toHaveAttribute("href", "/wiki/test-article");
  });

  it("renders excerpt when provided", () => {
    render(<ArticleCard {...defaultProps} excerpt="这是文章摘要" />);
    expect(screen.getByText("这是文章摘要")).toBeInTheDocument();
  });

  it("does not render excerpt when not provided", () => {
    render(<ArticleCard {...defaultProps} />);
    expect(screen.queryByText(/摘要/)).not.toBeInTheDocument();
  });

  it("renders category badge with link", () => {
    const category = { name: "技术", slug: "tech" };
    render(<ArticleCard {...defaultProps} category={category} />);
    const link = screen.getByRole("link", { name: "技术" });
    expect(link).toHaveAttribute("href", "/category/tech");
  });

  it("renders tags", () => {
    const tags = [
      { id: 1, name: "React" },
      { id: 2, name: "TypeScript" },
    ];
    render(<ArticleCard {...defaultProps} tags={tags} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<ArticleCard {...defaultProps} date="2024-06-07T12:00:00Z" />);
    expect(screen.getByText("2024-06-07")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleCard {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
