-- Optional demo catalog: two English and two Amharic listings.
-- Language is a publisher choice stored in details.language; no translation
-- is required and users may submit either language through the normal form.
SET search_path TO bids;
INSERT INTO listings
  (source_key,title,sector,vehicle,access,status,issuer,region,deadline,details)
VALUES
  ('demo-en-public-001','Supply of classroom desks','public',false,'free','active','Ministry of Education','Addis Ababa','2027-03-15T12:00:00Z','{"language":"en","summary":"Supply and delivery of durable classroom desks for public schools.","contact":"procurement@example.gov.et"}'),
  ('demo-en-vehicle-001','Auction of government vehicles','public',true,'free','active','Public Assets Authority','Addis Ababa','2027-04-10T12:00:00Z','{"language":"en","summary":"Public auction for used government vehicles in good running condition.","contact":"auctions@example.gov.et"}'),
  ('demo-am-ngo-001','የትምህርት መሳሪያዎች አቅርቦት','ngo',false,'free','active','የትምህርት ልማት ድርጅት','አዲስ አበባ','2027-03-25T12:00:00Z','{"language":"am","summary":"ለትምህርት ቤቶች የመማሪያ መሳሪያዎችን ማቅረብና ማድረስ።","contact":"procurement@example.org"}'),
  ('demo-am-private-001','የግንባታ እቃዎች ግዥ','private',false,'free','active','አበበ ኮንስትራክሽን','ኦሮሚያ','2027-04-20T12:00:00Z','{"language":"am","summary":"ለግንባታ ስራ የሚያገለግሉ እቃዎችን ማቅረብ።","contact":"tenders@example.com"}')
ON CONFLICT (source_key) DO NOTHING;
