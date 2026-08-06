-- Besöksadressen är frivillig. Tjänsteföretag, konsulter och webbshoppar har
-- inte alltid någon adress att uppge, och kravet stoppade dem från att
-- registrera sig.
--
-- Fakturaadress är något annat och ligger kvar i invoiceAddress, som fortsatt
-- krävs när företaget väljer pappersfaktura.
ALTER TABLE "Company" ALTER COLUMN "address" DROP NOT NULL;
