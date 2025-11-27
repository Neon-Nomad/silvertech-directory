import { describe, it, expect } from 'vitest';
import { parseIndianaData } from '../scripts/parse_indiana.js';
import { parseAddress } from '../scripts/ingest_california.js';

describe('Indiana Data Parsing', () => {
    it('should parse a standard facility block correctly', () => {
        const rawData = `
Some Facility Name
123 Main St
Indianapolis, IN 46204
Tel: 317-555-0100
License Number : 12345
Lic Expire Date: 12/31/2025
Bed Capacity: 50
RES
    `;
        const result = parseIndianaData(rawData);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'Some Facility Name',
            address_line1: '123 Main St',
            address_line2: null,
            city: 'Indianapolis',
            state: 'IN',
            postal_code: '46204',
            phone: '317-555-0100',
            latitude: null,
            longitude: null,
            license: {
                number: '12345',
                expiration: '2025-12-31',
                beds: 50
            }
        });
    });

    it('should handle missing optional fields', () => {
        const rawData = `
Minimal Facility
456 Oak Ave
Gary, IN 46402
License Number : 67890
RES
    `;
        const result = parseIndianaData(rawData);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Minimal Facility');
        expect(result[0].license.number).toBe('67890');
        expect(result[0].phone).toBe('');
        expect(result[0].license.beds).toBe(0);
    });

    it('should ignore blocks without license number', () => {
        const rawData = `
Invalid Facility
789 Pine Ln
South Bend, IN 46601
RES
    `;
        const result = parseIndianaData(rawData);
        expect(result).toHaveLength(0);
    });
});

describe('California Address Parsing', () => {
    it('should parse a standard address string', () => {
        const input = "34400 MISSION BLVD., UNION CITY, CA 94587";
        const result = parseAddress(input);
        expect(result).toEqual({
            address_line1: "34400 MISSION BLVD.",
            city: "UNION CITY",
            state: "CA",
            postal_code: "94587"
        });
    });

    it('should handle address with commas', () => {
        const input = "123, Some Street, Apt 4, San Francisco, CA 94103";
        const result = parseAddress(input);
        expect(result).toEqual({
            address_line1: "123, Some Street, Apt 4",
            city: "San Francisco",
            state: "CA",
            postal_code: "94103"
        });
    });

    it('should handle missing zip code', () => {
        const input = "123 Main St, Los Angeles, CA";
        const result = parseAddress(input);
        expect(result).toEqual({
            address_line1: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            postal_code: null
        });
    });

    it('should return nulls for empty input', () => {
        expect(parseAddress("")).toEqual({ address_line1: null, city: null, state: 'CA', postal_code: null });
        expect(parseAddress(null)).toEqual({ address_line1: null, city: null, state: 'CA', postal_code: null });
    });
});
