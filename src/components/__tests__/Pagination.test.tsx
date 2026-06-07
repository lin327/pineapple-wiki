import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page links for small page count", () => {
    render(<Pagination currentPage={1} totalPages={3} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 3")).toBeInTheDocument();
  });

  it("highlights current page", () => {
    render(<Pagination currentPage={2} totalPages={5} />);

    const currentPage = screen.getByText("2");
    expect(currentPage).toHaveAttribute("aria-current", "page");
  });

  it("disables Prev on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} />);

    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("disables Next on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} />);

    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
  });

  it("shows ellipsis for large page counts", () => {
    render(<Pagination currentPage={5} totalPages={10} />);

    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it("renders Prev and Next links on middle pages", () => {
    render(<Pagination currentPage={3} totalPages={5} />);

    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("has accessible navigation label", () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    expect(screen.getByLabelText("Pagination")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={3} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
