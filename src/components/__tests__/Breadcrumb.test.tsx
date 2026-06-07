import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "../Breadcrumb";

describe("Breadcrumb", () => {
  it("renders Home link", () => {
    render(<Breadcrumb items={[]} />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders items with links", () => {
    const items = [
      { label: "技术", href: "/category/tech" },
      { label: "React 教程", href: "/wiki/react-tutorial" },
    ];
    render(<Breadcrumb items={items} />);

    expect(screen.getByRole("link", { name: "技术" })).toHaveAttribute(
      "href",
      "/category/tech"
    );
    expect(screen.getByRole("link", { name: "React 教程" })).toHaveAttribute(
      "href",
      "/wiki/react-tutorial"
    );
  });

  it("renders last item as text (no link)", () => {
    const items = [
      { label: "技术", href: "/category/tech" },
      { label: "当前文章" },
    ];
    render(<Breadcrumb items={items} />);

    expect(screen.getByText("当前文章")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "当前文章" })
    ).not.toBeInTheDocument();
  });

  it("has accessible navigation label", () => {
    render(<Breadcrumb items={[]} />);
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Breadcrumb items={[]} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
