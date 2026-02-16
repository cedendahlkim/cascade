/**
 * Data Generator Plugin — Fake data, testdata, mock-objekt
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { randomUUID } from "crypto";

const plugin: PluginManifest = {
  name: "Data Generator",
  version: "1.0.0",
  description: "Generera testdata: namn, e-post, adresser, telefonnummer, JSON-mock, SQL inserts",
  author: "Gracestack",
  tools: [
    {
      name: "generate_fake_data",
      description: "Generate fake/mock data records with realistic Swedish names, emails, phone numbers, addresses. Returns JSON array.",
      parameters: {
        count: { type: "number", description: "Number of records (default: 5, max: 100)" },
        fields: { type: "string", description: "Comma-separated fields: name, email, phone, address, company, age, id, date, ip, url (default: name,email,phone)" },
      },
      handler: (input) => {
        const count = Math.min((input.count as number) || 5, 100);
        const fieldStr = (input.fields as string) || "name,email,phone";
        const fields = fieldStr.split(",").map(f => f.trim().toLowerCase());

        const firstNames = ["Erik", "Anna", "Lars", "Maria", "Karl", "Eva", "Johan", "Karin", "Anders", "Sara", "Per", "Emma", "Olof", "Lisa", "Sven", "Hanna", "Nils", "Sofia", "Axel", "Ida"];
        const lastNames = ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson", "Pettersson", "Jonsson", "Lindberg", "Magnusson", "Lindström"];
        const cities = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping", "Västerås", "Örebro", "Norrköping", "Helsingborg", "Jönköping", "Umeå", "Lund", "Borås", "Sundsvall", "Gävle"];
        const streets = ["Storgatan", "Kungsgatan", "Drottninggatan", "Sveavägen", "Vasagatan", "Birger Jarlsgatan", "Hamngatan", "Nygatan", "Parkvägen", "Skogsvägen"];
        const companies = ["Volvo AB", "Ericsson", "IKEA", "H&M", "Spotify", "Klarna", "Scania", "Atlas Copco", "Sandvik", "SKF", "Telia", "SEB", "Nordea", "Handelsbanken", "Electrolux"];
        const domains = ["gmail.com", "outlook.com", "hotmail.se", "yahoo.se", "telia.com", "bredband.net", "live.se"];

        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        const records = [];
        for (let i = 0; i < count; i++) {
          const first = pick(firstNames);
          const last = pick(lastNames);
          const record: Record<string, unknown> = {};

          for (const field of fields) {
            switch (field) {
              case "name": record.name = `${first} ${last}`; break;
              case "firstname": record.firstName = first; break;
              case "lastname": record.lastName = last; break;
              case "email": record.email = `${first.toLowerCase()}.${last.toLowerCase()}@${pick(domains)}`; break;
              case "phone": record.phone = `+467${randInt(0, 9)}${randInt(1000000, 9999999)}`; break;
              case "address": record.address = `${pick(streets)} ${randInt(1, 150)}, ${randInt(10000, 99999)} ${pick(cities)}`; break;
              case "city": record.city = pick(cities); break;
              case "company": record.company = pick(companies); break;
              case "age": record.age = randInt(18, 85); break;
              case "id": record.id = randomUUID(); break;
              case "date": {
                const d = new Date(Date.now() - randInt(0, 365 * 5) * 86400000);
                record.date = d.toISOString().split("T")[0];
                break;
              }
              case "ip": record.ip = `${randInt(1, 254)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`; break;
              case "url": record.url = `https://www.${last.toLowerCase()}.se/${first.toLowerCase()}`; break;
              case "salary": record.salary = randInt(25, 80) * 1000; break;
              case "bool": record.active = Math.random() > 0.5; break;
            }
          }
          records.push(record);
        }

        return JSON.stringify(records, null, 2);
      },
    },
    {
      name: "generate_sql",
      description: "Generate SQL INSERT statements from a table name and column definitions. Creates realistic test data.",
      parameters: {
        table: { type: "string", description: "Table name (e.g. 'users')" },
        columns: { type: "string", description: "Column definitions: 'name:string, age:int, email:string, active:bool, created:date'" },
        count: { type: "number", description: "Number of rows (default: 10, max: 50)" },
      },
      handler: (input) => {
        const table = (input.table as string) || "test_table";
        const colStr = (input.columns as string) || "id:int, name:string, email:string";
        const count = Math.min((input.count as number) || 10, 50);

        const cols = colStr.split(",").map(c => {
          const [name, type] = c.trim().split(":").map(s => s.trim());
          return { name, type: type || "string" };
        });

        const names = ["Erik", "Anna", "Lars", "Maria", "Karl", "Eva", "Johan", "Karin"];
        const lastNames = ["Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson"];
        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        const rows: string[] = [];
        for (let i = 0; i < count; i++) {
          const values = cols.map(col => {
            switch (col.type) {
              case "int": case "integer": case "number": return String(randInt(1, 10000));
              case "bool": case "boolean": return Math.random() > 0.5 ? "TRUE" : "FALSE";
              case "date": return `'${new Date(Date.now() - randInt(0, 1825) * 86400000).toISOString().split("T")[0]}'`;
              case "datetime": case "timestamp": return `'${new Date(Date.now() - randInt(0, 1825) * 86400000).toISOString()}'`;
              case "email": return `'${pick(names).toLowerCase()}.${pick(lastNames).toLowerCase()}@example.com'`;
              case "float": case "decimal": return (Math.random() * 1000).toFixed(2);
              default: {
                if (col.name.includes("name")) return `'${pick(names)} ${pick(lastNames)}'`;
                if (col.name.includes("email")) return `'${pick(names).toLowerCase()}@example.com'`;
                return `'value_${i + 1}'`;
              }
            }
          });
          rows.push(`INSERT INTO ${table} (${cols.map(c => c.name).join(", ")}) VALUES (${values.join(", ")});`);
        }

        return rows.join("\n");
      },
    },
  ],
};

export default plugin;
