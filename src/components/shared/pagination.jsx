import { Field, FieldLabel } from '@/components/ui/field';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PaginationIconsOnly({ setCurrentPage, setRows, rows, pages, currentPage }) {
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < pages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
        <Select
          value={rows}
          onValueChange={(val) => {
            setRows(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-20" id="select-rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {import.meta.env.DEV ? <SelectItem value={1}>1</SelectItem> : null}
              <SelectItem value={10}>10</SelectItem>
              <SelectItem value={25}>25</SelectItem>
              <SelectItem value={50}>50</SelectItem>
              <SelectItem value={100}>100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePrev();
              }}
            />{' '}
          </PaginationItem>
          <Select value={currentPage} onValueChange={(val) => setCurrentPage(val)}>
            <SelectTrigger className="w-20" id="select-rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                {[...Array(pages)].map((e, key) => (
                  <SelectItem value={key + 1} key={key}>
                    {key + 1}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNext();
              }}
            />{' '}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
