import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
    getNumberOfPages(): number;
  }
}
